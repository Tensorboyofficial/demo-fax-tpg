import Anthropic from "@anthropic-ai/sdk";

export type ModelTier = "fast" | "smart" | "premium";

export const MODELS: Record<ModelTier, string> = {
  fast: process.env.CLAUDE_MODEL_FAST ?? "claude-haiku-4-5-20251001",
  smart: process.env.CLAUDE_MODEL_SMART ?? "claude-sonnet-4-6",
  premium: process.env.CLAUDE_MODEL_PREMIUM ?? "claude-opus-4-7",
};

export const MODEL_LABELS: Record<ModelTier, string> = {
  fast: "Cevi Base",
  smart: "Cevi Pro",
  premium: "Cevi Max",
};

export const MODEL_BLURBS: Record<ModelTier, string> = {
  fast: "Fast and efficient for routine routing",
  smart: "Balanced reasoning for most clinical faxes",
  premium: "Premium reasoning for specialist and high-stakes cases",
};

/** Map a raw model ID (e.g. "claude-sonnet-4-6") to the Cevi product name. */
export function modelLabelFromId(id: string | undefined | null): string {
  if (!id) return "Cevi AI";
  for (const tier of ["fast", "smart", "premium"] as const) {
    if (MODELS[tier] === id) return MODEL_LABELS[tier];
  }
  // Heuristic fallback — pattern-match the underlying family without naming it.
  if (/haiku/i.test(id)) return "Cevi Base";
  if (/sonnet/i.test(id)) return "Cevi Pro";
  if (/opus/i.test(id)) return "Cevi Max";
  return "Cevi AI";
}

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (client) return client;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }
  client = new Anthropic({ apiKey: key });
  return client;
}
