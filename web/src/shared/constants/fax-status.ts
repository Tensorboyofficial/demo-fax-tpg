export const FAX_STATUSES = [
  "received",
  "processing",
  "auto_routed",
  "needs_review",
  "failed_match",
  "routed",
  "completed",
] as const;

export type FaxStatus = (typeof FAX_STATUSES)[number];
