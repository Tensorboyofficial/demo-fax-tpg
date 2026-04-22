"use server";

import { getAnthropic, MODELS, MODEL_LABELS, type ModelTier } from "@/lib/claude";
import { insertUploadedFax } from "@/lib/supabase/userFaxes";
import { matchPatient } from "@/lib/matching";
import { guardRate } from "@/lib/rate-limit";
import type {
  ExtractedFields,
  Fax,
  FaxEvent,
  FaxType,
  Urgency,
} from "@/lib/types";

export interface UploadResult {
  ok: true;
  faxId: string;
  classifiedAs: FaxType;
  confidence: number;
  modelLabel: string;
  latencyMs: number;
  persisted: boolean;
  persistError?: string;
}

export interface UploadError {
  ok: false;
  error: string;
}

const SYSTEM_PROMPT = `You are Cevi's medical fax triage AI. You are HIPAA-compliant and work for Texas Physicians Group (multi-location primary care on eClinicalWorks).

Given a fax (as image/PDF pages, or OCR text), return a single JSON object with EXACTLY this shape — no prose, no markdown fences:

{
  "type": "referral" | "lab_result" | "prior_auth" | "records_request" | "rx_refill" | "specialist_consult" | "imaging_report" | "unknown",
  "typeConfidence": number 0..1,
  "urgency": "routine" | "urgent" | "stat" | "critical",
  "extracted": {
    "sendingProvider": string?,
    "sendingOrg": string?,
    "documentDate": string? (YYYY-MM-DD),
    "patientNameOnDoc": string?,
    "patientDobOnDoc": string? (MM/DD/YYYY),
    "patientMrnOnDoc": string?,
    "diagnoses": string[]?,
    "recommendations": string[]?,
    "medications": string[]?,
    "icd10": string[]?,
    "cpt": string[]?,
    "summary": string (2-3 sentence clinical summary)
  },
  "aiSummary": string (one sentence, ~20 words, operator-facing),
  "ocrTextExcerpt": string (first ~200 chars of the fax content for audit)
}

Rules:
- "critical" urgency is reserved for labs with values flagged CRITICAL, STAT radiology with hemorrhage/PE, or explicit "time-sensitive" patient safety events.
- "urgent" for abnormal findings that need action today but are not life-threatening.
- Don't invent data. Omit fields that aren't present.
- Use ICD-10 codes verbatim from the document.
- Return ONLY the JSON object.`;

function genId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${ts}${rand}`.toUpperCase();
}

function inferRouting(
  type: FaxType,
  urgency: Urgency,
  matchedPatientId: string | null,
): { routedTo: string | null; routedReason: string | null; status: Fax["status"] } {
  if (!matchedPatientId) {
    return {
      routedTo: null,
      routedReason:
        "Patient match below 80% confidence — routed to Review queue for operator confirmation.",
      status: "needs_review",
    };
  }
  if (urgency === "critical" || urgency === "stat") {
    return {
      routedTo: "agent:lab_results",
      routedReason:
        "Critical / STAT result — routed to Lab Results agent with SMS dispatch to on-call nurse.",
      status: "auto_routed",
    };
  }
  switch (type) {
    case "referral":
      return {
        routedTo: "agent:referrals",
        routedReason: "Inbound referral → Referrals agent; Healow slot held.",
        status: "auto_routed",
      };
    case "prior_auth":
      return {
        routedTo: "agent:prior_auth",
        routedReason: "Payer PA request → Prior Auth agent; clinical justification drafted.",
        status: "auto_routed",
      };
    case "records_request":
      return {
        routedTo: "agent:records",
        routedReason: "Records request → Records agent; ROI ticket created.",
        status: "auto_routed",
      };
    case "rx_refill":
      return {
        routedTo: "agent:rx_refills",
        routedReason: "Refill request → Rx agent; draft approval prepared for e-signature.",
        status: "auto_routed",
      };
    case "lab_result":
    case "imaging_report":
      return {
        routedTo: "P-001",
        routedReason: "Patient's PCP inbox (auto).",
        status: "auto_routed",
      };
    case "specialist_consult":
      return {
        routedTo: "P-001",
        routedReason: "Specialist report → PCP results inbox.",
        status: "auto_routed",
      };
    default:
      return {
        routedTo: null,
        routedReason:
          "Document type unclear — routed to Review queue for operator confirmation.",
        status: "needs_review",
      };
  }
}

type UploadContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: "image/png" | "image/jpeg" | "image/webp";
        data: string;
      };
    }
  | {
      type: "document";
      source: {
        type: "base64";
        media_type: "application/pdf";
        data: string;
      };
    };

async function classifyBlocks(
  tier: ModelTier,
  userContent: UploadContentBlock[],
): Promise<{
  parsed: {
    type: FaxType;
    typeConfidence: number;
    urgency: Urgency;
    extracted: ExtractedFields;
    aiSummary?: string;
    ocrTextExcerpt?: string;
  };
  modelLabel: string;
  model: string;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
}> {
  const anthropic = getAnthropic();
  const model = MODELS[tier];
  const modelLabel = MODEL_LABELS[tier];
  const started = Date.now();
  const response = await anthropic.messages.create({
    model,
    max_tokens: 1800,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
  });
  const latencyMs = Date.now() - started;
  const text = response.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Model did not return JSON");
  const parsed = JSON.parse(m[0]);
  return {
    parsed,
    modelLabel,
    model,
    latencyMs,
    tokensIn: response.usage.input_tokens,
    tokensOut: response.usage.output_tokens,
  };
}

export async function uploadFax(formData: FormData): Promise<UploadResult | UploadError> {
  try {
    const rate = await guardRate("upload", 8, 60_000);
    if (!rate.ok) return { ok: false, error: rate.error ?? "Rate limit reached" };

    const mode = formData.get("mode")?.toString() ?? "file";
    const tierRaw = formData.get("tier")?.toString() ?? "smart";
    const tier: ModelTier =
      tierRaw === "fast" ? "fast" : tierRaw === "premium" ? "premium" : "smart";
    const senderHint = formData.get("sender")?.toString().trim() || undefined;
    const clinicHint = formData.get("clinic")?.toString().trim() || "Arlington";

    let userContent: UploadContentBlock[];
    let ocrText = "";
    let pages = 1;

    if (mode === "text") {
      const text = formData.get("text")?.toString().trim();
      if (!text) return { ok: false, error: "No OCR text provided." };
      if (text.length > 50_000)
        return { ok: false, error: "OCR text too long (max ~50K chars)." };
      ocrText = text;
      pages = Math.max(1, Math.ceil(text.length / 1800));
      userContent = [
        {
          type: "text",
          text: `Fax OCR text (sender hint: ${senderHint ?? "unknown"}; clinic: ${clinicHint}):\n\n${text}`,
        },
      ];
    } else {
      const file = formData.get("file") as File | null;
      if (!file || file.size === 0)
        return { ok: false, error: "No file uploaded." };
      if (file.size > 15 * 1024 * 1024)
        return { ok: false, error: "File too large (max 15 MB)." };
      const mime = file.type || "application/octet-stream";
      const allowed = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/webp",
      ];
      if (!allowed.includes(mime))
        return {
          ok: false,
          error: `Unsupported file type ${mime}. Allowed: PDF, PNG, JPG, WebP.`,
        };
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      ocrText = `[${mime} · ${Math.round(file.size / 1024)}KB · ${file.name}]`;
      pages = mime === "application/pdf" ? Math.max(1, Math.ceil(file.size / 60_000)) : 1;
      if (mime === "application/pdf") {
        userContent = [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf" as const,
              data: base64,
            },
          },
          {
            type: "text",
            text: `Classify this healthcare fax. Sender hint: ${senderHint ?? "unknown"}; clinic: ${clinicHint}.`,
          },
        ];
      } else {
        const imageMime = mime as "image/png" | "image/jpeg" | "image/webp";
        userContent = [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: imageMime,
              data: base64,
            },
          },
          {
            type: "text",
            text: `Classify this healthcare fax image. Sender hint: ${senderHint ?? "unknown"}; clinic: ${clinicHint}.`,
          },
        ];
      }
    }

    const {
      parsed,
      modelLabel,
      model,
      latencyMs,
      tokensIn,
      tokensOut,
    } = await classifyBlocks(tier, userContent);

    // Patient matching
    const candidates = matchPatient({
      name: parsed.extracted?.patientNameOnDoc,
      dob: parsed.extracted?.patientDobOnDoc,
      mrn: parsed.extracted?.patientMrnOnDoc,
    });
    const bestCandidate = candidates[0];
    const matchedPatientId =
      bestCandidate && bestCandidate.score >= 0.8 ? bestCandidate.patientId : null;
    const matchConfidence = bestCandidate?.score ?? null;

    const routing = inferRouting(parsed.type, parsed.urgency, matchedPatientId);

    const id = genId("FAX-UP");
    const nowIso = new Date().toISOString();
    const fax: Fax = {
      id,
      receivedAt: nowIso,
      pages,
      fromNumber: "Uploaded",
      fromOrg:
        parsed.extracted?.sendingOrg ??
        senderHint ??
        "Uploaded by operator",
      faxNumberTo: "817-860-2704",
      toClinic: clinicHint,
      status: routing.status,
      type: parsed.type,
      typeConfidence: Number(parsed.typeConfidence ?? 0.85),
      urgency: parsed.urgency ?? "routine",
      matchedPatientId,
      matchConfidence,
      candidates,
      extracted: { ...parsed.extracted, summary: parsed.extracted?.summary },
      routedTo: routing.routedTo,
      routedReason: routing.routedReason,
      ocrText:
        parsed.ocrTextExcerpt ??
        (ocrText.length > 2000 ? ocrText.slice(0, 2000) + "\n\n[...truncated]" : ocrText),
      aiSummary: parsed.aiSummary,
      modelUsed: model,
      isHero: false,
    };

    const events: FaxEvent[] = [
      {
        id: `${id}:received`,
        faxId: id,
        at: nowIso,
        kind: "received",
        actor: "system",
        detail: `Uploaded via /upload (${mode === "text" ? "pasted OCR" : "file"})`,
      },
      {
        id: `${id}:classified`,
        faxId: id,
        at: new Date(Date.now() + 500).toISOString(),
        kind: "classified",
        actor: "claude",
        detail: `Classified as ${parsed.type} (${Math.round((parsed.typeConfidence ?? 0) * 100)}%) by ${modelLabel}`,
        model,
        latencyMs,
        tokensIn,
        tokensOut,
      },
      ...(matchedPatientId
        ? [
            {
              id: `${id}:matched`,
              faxId: id,
              at: new Date(Date.now() + 900).toISOString(),
              kind: "matched" as const,
              actor: "system",
              detail: `Matched to patient (${Math.round((matchConfidence ?? 0) * 100)}%)`,
            },
          ]
        : []),
      ...(routing.routedTo
        ? [
            {
              id: `${id}:routed`,
              faxId: id,
              at: new Date(Date.now() + 1300).toISOString(),
              kind: "routed" as const,
              actor: "system",
              detail: `Routed to ${routing.routedTo}`,
            },
          ]
        : [
            {
              id: `${id}:flagged`,
              faxId: id,
              at: new Date(Date.now() + 1300).toISOString(),
              kind: "flagged" as const,
              actor: "system",
              detail: "Below confidence threshold — sent to Review Queue",
            },
          ]),
    ];

    const insert = await insertUploadedFax({ fax, events });

    return {
      ok: true,
      faxId: id,
      classifiedAs: parsed.type,
      confidence: Number(parsed.typeConfidence ?? 0.85),
      modelLabel,
      latencyMs,
      persisted: insert.ok,
      persistError: insert.ok ? undefined : insert.error,
    };
  } catch (err) {
    if (typeof console !== "undefined" && err instanceof Error) {
      console.error("[upload] error", err.message);
    }
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Upload failed: ${err.message}`
          : "Upload failed: unknown error",
    };
  }
}
