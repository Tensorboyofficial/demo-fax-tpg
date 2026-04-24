"use server";

import { getAnthropic, MODELS, MODEL_LABELS, type ModelTier } from "@/backend/config/models.config";
import { getFaxById } from "@/data/seed/faxes";
import { guardRate } from "@/backend/middleware/rate-limiter";
import type { ExtractedFields, FaxType } from "@/shared/types";

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

import { PROMPTS_CONFIG } from "@/backend/config/prompts.config";

const SYSTEM_PROMPT = PROMPTS_CONFIG.classification;

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
