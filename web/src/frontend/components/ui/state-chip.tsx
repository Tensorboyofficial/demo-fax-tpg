const LABELS: Record<string, string> = {
  unopened: "Unopened",
  opened: "Opened",
  archived: "Archived",
  needs_review: "Needs Review",
};

export function StateChip({ state }: { state: string }) {
  const label = LABELS[state] ?? state;
  return <span className={`state-chip ${state}`}>{label}</span>;
}
