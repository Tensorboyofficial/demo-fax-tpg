/** MVP lifecycle statuses per wireframe */
export const FAX_STATUSES = [
  "unopened",
  "opened",
  "archived",
  "needs_review",
] as const;

export type FaxStatus = (typeof FAX_STATUSES)[number];

export const FAX_STATUS_LABELS: Record<FaxStatus, string> = {
  unopened: "Unopened",
  opened: "Opened",
  archived: "Archived",
  needs_review: "Needs Review",
};
