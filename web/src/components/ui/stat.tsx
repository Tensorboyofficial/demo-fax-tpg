import { cn } from "@/lib/utils";

interface StatProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  helper?: string;
  className?: string;
}

export function Stat({
  label,
  value,
  delta,
  deltaTone = "neutral",
  helper,
  className,
}: StatProps) {
  const toneClass =
    deltaTone === "positive"
      ? "text-[var(--cevi-success)]"
      : deltaTone === "negative"
        ? "text-[var(--cevi-accent)]"
        : "text-[var(--cevi-text-muted)]";
  return (
    <div
      className={cn(
        "rounded-lg bg-white border border-[var(--cevi-border)] p-5",
        className,
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)]">
        {label}
      </div>
      <div className="mt-2 font-serif text-[36px] leading-none text-[var(--cevi-text)]">
        {value}
      </div>
      {(delta || helper) && (
        <div className="mt-2 flex items-center gap-2 text-[12px]">
          {delta && <span className={cn("font-semibold", toneClass)}>{delta}</span>}
          {helper && <span className="text-[var(--cevi-text-muted)]">{helper}</span>}
        </div>
      )}
    </div>
  );
}
