import { cn } from "@/shared/utils";

export function ConfidenceMeter({
  value,
  className,
}: {
  value: number | null;
  className?: string;
}) {
  if (value === null) {
    return (
      <span className={cn("text-[12px] text-[var(--cevi-text-muted)]", className)}>
        —
      </span>
    );
  }
  const pct = Math.round(value * 100);
  const tone =
    value >= 0.9
      ? "text-[var(--cevi-success)]"
      : value >= 0.8
        ? "text-[var(--cevi-text-secondary)]"
        : "text-[var(--cevi-accent)]";
  const barTone =
    value >= 0.9
      ? "bg-[var(--cevi-jade)]"
      : value >= 0.8
        ? "bg-[var(--cevi-text-muted)]"
        : "bg-[var(--cevi-accent)]";
  return (
    <div className={cn("flex items-center gap-2 min-w-20", className)}>
      <div className="h-1 w-12 rounded-full bg-[var(--cevi-border-light)] overflow-hidden">
        <div
          className={cn("h-full rounded-full", barTone)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn("text-[12px] font-medium tabular-nums", tone)}>{pct}%</span>
    </div>
  );
}
