import Anthropic from "@anthropic-ai/sdk";

/** Dynamic SQLite settings — returns null on Vercel where better-sqlite3 is unavailable */
function getSetting(key: string): string | null {
  if (process.env.VERCEL) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@/backend/repositories/sqlite/sqlite.client");
    return mod.getSetting(key);
  } catch { return null; }
}

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

/**
 * Anthropic client — checks for API key in this order:
 * 1. Runtime key set via Settings UI (stored in SQLite)
 * 2. ANTHROPIC_API_KEY environment variable
 *
 * Re-creates client when the runtime key changes.
 */
let _client: Anthropic | undefined;
let _lastKey: string | undefined;

export function getAnthropic(): Anthropic {
  const runtimeKey = getSetting("anthropic_api_key");
  const effectiveKey = runtimeKey || process.env.ANTHROPIC_API_KEY;

  if (!effectiveKey) {
    throw new Error(
      "No Anthropic API key configured. Set it in Settings or add ANTHROPIC_API_KEY to .env",
    );
  }

  // Re-create client if key changed (e.g., user updated it in Settings)
  if (_client && _lastKey === effectiveKey) return _client;

  _client = new Anthropic({ apiKey: effectiveKey });
  _lastKey = effectiveKey;
  return _client;
}

/** Check if an API key is configured (from any source) */
export function isApiKeyConfigured(): { configured: boolean; source: "settings" | "env" | "none" } {
  const runtimeKey = getSetting("anthropic_api_key");
  if (runtimeKey) return { configured: true, source: "settings" };
  if (process.env.ANTHROPIC_API_KEY) return { configured: true, source: "env" };
  return { configured: false, source: "none" };
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
