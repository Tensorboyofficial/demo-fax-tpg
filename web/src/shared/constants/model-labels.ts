/** Model tier display labels — pure string mappings, safe for frontend use. */

export type ModelTier = "fast" | "smart" | "premium";

export const MODEL_LABELS: Record<ModelTier, string> = {
  fast: "Cevi Base",
  smart: "Cevi Pro",
  premium: "Cevi Max",
};

export function modelLabelFromId(id: string | undefined | null): string {
  if (!id) return "Cevi AI";
  if (/haiku/i.test(id)) return "Cevi Base";
  if (/sonnet/i.test(id)) return "Cevi Pro";
  if (/opus/i.test(id)) return "Cevi Max";
  return "Cevi AI";
}
