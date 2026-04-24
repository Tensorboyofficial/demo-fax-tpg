"use server";

import { getAnthropic, MODELS, MODEL_LABELS } from "@/backend/config/models.config";
import { PROMPTS_CONFIG } from "@/backend/config/prompts.config";
import { guardRate } from "@/backend/middleware/rate-limiter";

export interface EobClaim {
  patient: string;
  patientAccount?: string;
  dos: string;
  cpt: string;
  description?: string;
  billed: number;
  allowed: number;
  paid: number;
  adjustment: number;
  patientResponsibility: number;
  denialCodes?: string[];
}

export interface EobResult {
  ok: true;
  payer: string;
  checkNumber?: string;
  checkDate?: string;
  checkAmount?: number;
  claims: EobClaim[];
  modelLabel: string;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
}

export interface EobError {
  ok: false;
  error: string;
  latencyMs: number;
}

const SYSTEM_PROMPT = PROMPTS_CONFIG.eob;

type EobContentBlock =
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
      source: { type: "base64"; media_type: "application/pdf"; data: string };
    };

export async function extractEob(
  formData: FormData,
): Promise<EobResult | EobError> {
  const started = Date.now();
  const rate = await guardRate("eob", 5, 60_000);
  if (!rate.ok)
    return {
      ok: false,
      error: rate.error ?? "Rate limit reached",
      latencyMs: 0,
    };

  try {
    const mode = formData.get("mode")?.toString() ?? "text";
    let content: EobContentBlock[];
    if (mode === "text") {
      const text = formData.get("text")?.toString().trim();
      if (!text) return { ok: false, error: "No EOB text provided.", latencyMs: 0 };
      if (text.length > 60_000)
        return { ok: false, error: "EOB text too long (max ~60K chars).", latencyMs: 0 };
      content = [
        {
          type: "text",
          text: `Paper EOB OCR text. Extract the check metadata and every claim line-item.\n\n${text}`,
        },
      ];
    } else {
      const file = formData.get("file") as File | null;
      if (!file || file.size === 0)
        return { ok: false, error: "No file uploaded.", latencyMs: 0 };
      if (file.size > 15 * 1024 * 1024)
        return { ok: false, error: "File too large (max 15 MB).", latencyMs: 0 };
      const mime = file.type || "application/octet-stream";
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      if (mime === "application/pdf") {
        content = [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf" as const, data: base64 },
          },
          { type: "text", text: "Paper EOB scan. Extract the check metadata and every claim line-item." },
        ];
      } else if (
        mime === "image/png" ||
        mime === "image/jpeg" ||
        mime === "image/webp"
      ) {
        content = [
          {
            type: "image",
            source: { type: "base64", media_type: mime, data: base64 },
          },
          { type: "text", text: "Paper EOB scan. Extract the check metadata and every claim line-item." },
        ];
      } else {
        return {
          ok: false,
          error: `Unsupported file type ${mime}. Allowed: PDF, PNG, JPG, WebP.`,
          latencyMs: 0,
        };
      }
    }

    const anthropic = getAnthropic();
    const model = MODELS.premium; // EOBs benefit from Max's layout reasoning
    const modelLabel = MODEL_LABELS.premium;
    const response = await anthropic.messages.create({
      model,
      max_tokens: 2400,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content }],
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
      ok: true,
      payer: String(parsed.payer ?? "Unknown payer"),
      checkNumber: parsed.checkNumber,
      checkDate: parsed.checkDate,
      checkAmount:
        typeof parsed.checkAmount === "number" ? parsed.checkAmount : undefined,
      claims: Array.isArray(parsed.claims) ? parsed.claims : [],
      modelLabel,
      latencyMs,
      tokensIn: response.usage.input_tokens,
      tokensOut: response.usage.output_tokens,
    };
  } catch (err) {
    const latencyMs = Date.now() - started;
    if (typeof console !== "undefined" && err instanceof Error) {
      console.error("[eob]", err.message);
    }
    return {
      ok: false,
      error:
        "Couldn't extract that EOB. Try uploading a clearer scan or paste the OCR text.",
      latencyMs,
    };
  }
}
