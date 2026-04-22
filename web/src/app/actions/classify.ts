"use server";

import { getAnthropic, MODELS, MODEL_LABELS, type ModelTier } from "@/lib/claude";
import { getFaxById } from "@/data/faxes";
import { guardRate } from "@/lib/rate-limit";
import type { ExtractedFields, FaxType } from "@/lib/types";

export interface ClassifyResult {
  ok: true;
  type: FaxType;
  typeConfidence: number;
  urgency: "routine" | "urgent" | "stat" | "critical";
  extracted: ExtractedFields;
  aiSummary: string;
  model: string;
  modelLabel: string;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
  cachedInputTokens?: number;
}

export interface ClassifyError {
  ok: false;
  error: string;
  model: string;
  latencyMs: number;
}

const SYSTEM_PROMPT = `You are Cevi's medical fax triage AI. You are HIPAA-compliant and operate on OCR'd healthcare faxes at Transcend Medical Group, a multi-location primary care practice on eClinicalWorks.

Given OCR text from a single inbound fax, you MUST return a single JSON object with EXACTLY this shape (no prose, no markdown fences):

{
  "type": "referral" | "lab_result" | "prior_auth" | "records_request" | "rx_refill" | "specialist_consult" | "imaging_report" | "unknown",
  "typeConfidence": number between 0.0 and 1.0,
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
  "aiSummary": string (one sentence, operator-facing, ~20 words)
}

Rules:
- Classification thresholds: use 0.98+ only when type is obvious (exact lab panels, PA letters, Rx refill forms). Use 0.7-0.85 when uncertain.
- "critical" urgency is reserved for lab panels with values flagged CRITICAL, STAT radiology with hemorrhage/PE, or explicit "time-sensitive" patient safety events.
- Prefer "urgent" for abnormal findings that need action today but are not life-threatening.
- Do not invent data. If a field is not present in the OCR text, omit it.
- Respect medical abbreviations; use ICD-10 codes verbatim if present.
- Return ONLY the JSON object. Nothing before, nothing after.`;

export async function classifyFax(
  id: string,
  tier: ModelTier,
): Promise<ClassifyResult | ClassifyError> {
  const rate = await guardRate("classify", 15, 60_000);
  if (!rate.ok) {
    return {
      ok: false,
      error: rate.error ?? "Rate limit reached",
      model: MODELS[tier],
      latencyMs: 0,
    };
  }

  const fax = getFaxById(id);
  if (!fax) {
    return {
      ok: false,
      error: "Fax not found",
      model: MODELS[tier],
      latencyMs: 0,
    };
  }

  const model = MODELS[tier];
  const modelLabel = MODEL_LABELS[tier];

  const started = Date.now();
  try {
    const anthropic = getAnthropic();
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
      messages: [
        {
          role: "user",
          content: `Fax metadata:\n- From: ${fax.fromOrg} (${fax.fromNumber})\n- Received at: ${fax.receivedAt}\n- Pages: ${fax.pages}\n- Clinic: ${fax.toClinic}\n\nOCR text:\n\n${fax.ocrText}`,
        },
      ],
    });
    const latencyMs = Date.now() - started;

    const text = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();

    // Extract JSON — tolerate the model returning it with or without fences.
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Model did not return JSON");
    const parsed = JSON.parse(jsonMatch[0]);

    return {
      ok: true,
      type: parsed.type as FaxType,
      typeConfidence: Number(parsed.typeConfidence ?? 0.9),
      urgency: parsed.urgency ?? "routine",
      extracted: parsed.extracted ?? {},
      aiSummary: parsed.aiSummary ?? parsed.extracted?.summary ?? "",
      model,
      modelLabel,
      latencyMs,
      tokensIn: response.usage.input_tokens,
      tokensOut: response.usage.output_tokens,
      cachedInputTokens: response.usage.cache_read_input_tokens ?? 0,
    };
  } catch (err) {
    const latencyMs = Date.now() - started;
    // Log full error server-side; return a generic message client-side.
    if (typeof console !== "undefined" && err instanceof Error) {
      console.error("[classify] error", {
        tier,
        faxId: id,
        message: err.message,
      });
    }
    return {
      ok: false,
      error: "Cevi AI couldn't reach the model. Showing last stable result.",
      model,
      latencyMs,
    };
  }
}
