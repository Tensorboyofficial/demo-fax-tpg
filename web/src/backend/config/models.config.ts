import Anthropic from "@anthropic-ai/sdk";

export type { ModelTier } from "@/shared/constants/model-labels";
type ModelTier = "fast" | "smart" | "premium";

export interface ModelTierConfig {
  model: string;
  label: string;
  description: string;
  env: string;
  maxTokens: number;
}

export const MODELS_CONFIG: Record<ModelTier, ModelTierConfig> = {
  fast: {
    model: "claude-haiku-4-5-20251001",
    label: "Cevi Base",
    description: "Fast and efficient for routine routing",
    env: "CLAUDE_MODEL_FAST",
    maxTokens: 1800,
  },
  smart: {
    model: "claude-sonnet-4-6",
    label: "Cevi Pro",
    description: "Balanced reasoning for most clinical faxes",
    env: "CLAUDE_MODEL_SMART",
    maxTokens: 1800,
  },
  premium: {
    model: "claude-opus-4-7",
    label: "Cevi Max",
    description: "Premium reasoning for specialist and high-stakes cases",
    env: "CLAUDE_MODEL_PREMIUM",
    maxTokens: 1800,
  },
};

/* ── Backward-compatible convenience exports ── */

/** Record<ModelTier, model-id> — used by server actions */
export const MODELS: Record<ModelTier, string> = {
  fast: MODELS_CONFIG.fast.model,
  smart: MODELS_CONFIG.smart.model,
  premium: MODELS_CONFIG.premium.model,
};

/** Record<ModelTier, human label> */
export const MODEL_LABELS: Record<ModelTier, string> = {
  fast: MODELS_CONFIG.fast.label,
  smart: MODELS_CONFIG.smart.label,
  premium: MODELS_CONFIG.premium.label,
};

/** Singleton Anthropic client */
let _client: Anthropic | undefined;
export function getAnthropic(): Anthropic {
  if (!_client) _client = new Anthropic();
  return _client;
}

export function resolveModel(tier: ModelTier): string {
  const cfg = MODELS_CONFIG[tier];
  return process.env[cfg.env] ?? cfg.model;
}

export function modelLabelFromId(id: string | undefined | null): string {
  if (!id) return "Cevi AI";
  for (const tier of ["fast", "smart", "premium"] as const) {
    if (resolveModel(tier) === id || MODELS_CONFIG[tier].model === id) return MODELS_CONFIG[tier].label;
  }
  if (/haiku/i.test(id)) return "Cevi Base";
  if (/sonnet/i.test(id)) return "Cevi Pro";
  if (/opus/i.test(id)) return "Cevi Max";
  return "Cevi AI";
}

export const MODEL_DEFAULTS = {
  classification: "smart" as ModelTier,
  patientMessage: "premium" as ModelTier,
};
