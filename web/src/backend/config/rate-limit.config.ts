export interface RateLimitDef {
  namespace: string;
  limit: number;
  windowMs: number;
}

export const RATE_LIMIT_CONFIG = {
  classify: { namespace: "classify", limit: 15, windowMs: 60_000 } satisfies RateLimitDef,
  upload: { namespace: "upload", limit: 8, windowMs: 60_000 } satisfies RateLimitDef,
  draftMessage: { namespace: "draft-message", limit: 6, windowMs: 60_000 } satisfies RateLimitDef,
};
