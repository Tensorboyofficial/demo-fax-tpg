"use server";

import { getAnthropic, MODELS, MODEL_LABELS } from "@/lib/claude";
import { getFaxById } from "@/data/faxes";
import { getUploadedFaxById, insertPatientMessage } from "@/lib/supabase/userFaxes";
import { getPatientById, patientFullName } from "@/data/patients";
import { getProviderById } from "@/data/providers";
import { guardRate } from "@/lib/rate-limit";

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

const SYSTEM_PROMPT = `You are Cevi's patient-communication assistant. You help a primary-care doctor draft a reassuring, precise, HIPAA-compliant patient-facing message based on a fax (lab result, imaging, or specialist consult).

Hard requirements:
- Grade 4–6 reading level (short sentences, common words; no jargon without a plain-English gloss).
- Warm, calm tone. Never alarming. Never dismissive.
- Never include critical abnormal values without a clear "what to do" step.
- Never include personally identifying info not already in the fax (no SSN, no insurance IDs, no DOB).
- Address the patient by first name. Sign off with the PCP's name, provided below.
- DO NOT recommend specific doses or new prescriptions — surface what the specialist/lab said, plus the PCP's next step.
- If there is any critical finding, the message must include a "please call us today at 817-860-2700" line.

Return a single JSON object:
{
  "subject": string  (≤ 60 chars; plain english),
  "body": string     (markdown plain text, 4–8 short paragraphs; include an opening line, the news, what it means, what we recommend, and a warm sign-off)
}

Return ONLY the JSON object. No preamble, no markdown fences.`;

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
    const subject = String(parsed.subject ?? "Your results from Texas Physicians Group");
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
