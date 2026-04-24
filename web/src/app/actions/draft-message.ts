"use server";

import { getAnthropic, MODELS, MODEL_LABELS } from "@/backend/config/models.config";
import { getFaxById } from "@/data/seed/faxes";
import { getUploadedFaxById, insertPatientMessage } from "@/backend/repositories/supabase/supabase-writes";
import { getPatientById, patientFullName } from "@/data/seed/patients";
import { getProviderById } from "@/data/seed/providers";
import { guardRate } from "@/backend/middleware/rate-limiter";

export interface DraftResult {
  ok: true;
  subject: string;
  body: string;
  modelLabel: string;
  latencyMs: number;
  persisted: boolean;
  persistError?: string;
  messageId: string;
}
export interface DraftError {
  ok: false;
  error: string;
  latencyMs: number;
}

import { PROMPTS_CONFIG } from "@/backend/config/prompts.config";

const SYSTEM_PROMPT = PROMPTS_CONFIG.patientMessage;

export async function draftPatientMessage(payload: {
  faxId: string;
}): Promise<DraftResult | DraftError> {
  const started = Date.now();
  const rate = await guardRate("draft-message", 6, 60_000);
  if (!rate.ok)
    return {
      ok: false,
      error: rate.error ?? "Rate limit reached",
      latencyMs: 0,
    };
  const { faxId } = payload;
  if (!faxId)
    return { ok: false, error: "fax id missing", latencyMs: 0 };

  // Try Supabase first (uploaded faxes), fall back to seed
  const uploaded = await getUploadedFaxById(faxId);
  const fax = uploaded ?? getFaxById(faxId);
  if (!fax)
    return {
      ok: false,
      error: "fax not found",
      latencyMs: Date.now() - started,
    };

  const patient = fax.matchedPatientId
    ? getPatientById(fax.matchedPatientId)
    : undefined;
  const patientName = patient
    ? patientFullName(patient)
    : fax.extracted.patientNameOnDoc ?? "the patient";
  const firstName = patient?.firstName ?? patientName.split(" ")[0];

  const pcp = patient ? getProviderById(patient.primaryProviderId) : undefined;
  const pcpName = pcp?.name.split(",")[0] ?? "Dr. Nguyen";

  const diagnoses = (fax.extracted.diagnoses ?? []).join("; ") || "none listed";
  const recommendations =
    (fax.extracted.recommendations ?? []).join("; ") || "none listed";
  const urgency = fax.urgency;

  const userMsg = `
Patient: ${patientName} (first name ${firstName})
PCP signing the note: ${pcpName}
Fax type: ${fax.type}
Fax urgency: ${urgency}
From: ${fax.fromOrg}
AI summary: ${fax.extracted.summary ?? fax.aiSummary ?? "(none)"}
Diagnoses from the fax: ${diagnoses}
Recommendations from the fax: ${recommendations}

Draft a message appropriate for the patient portal. Lead with reassurance if results are normal. If values are abnormal or critical, frame the plan clearly.
`.trim();

  try {
    const anthropic = getAnthropic();
    const model = MODELS.premium; // Cevi Max — writing quality matters here
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1200,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMsg }],
    });
    const latencyMs = Date.now() - started;

    const text = response.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Model did not return JSON");
    const parsed = JSON.parse(match[0]);
    const subject = String(parsed.subject ?? "Your results from Transcend Medical Group");
    const body = String(parsed.body ?? "");

    const messageId = `MSG-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
    const insert = await insertPatientMessage({
      id: messageId,
      fax_id: faxId,
      patient_id: patient?.id ?? null,
      subject,
      body,
      status: "draft",
      model,
    });

    return {
      ok: true,
      subject,
      body,
      modelLabel: MODEL_LABELS.premium,
      latencyMs,
      persisted: insert.ok,
      persistError: insert.ok ? undefined : insert.error,
      messageId,
    };
  } catch (err) {
    const latencyMs = Date.now() - started;
    if (typeof console !== "undefined" && err instanceof Error) {
      console.error("[draft-message]", err.message);
    }
    return {
      ok: false,
      error: "Couldn't generate draft. Showing nothing.",
      latencyMs,
    };
  }
}
