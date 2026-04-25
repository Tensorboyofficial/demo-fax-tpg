interface ConfidenceValueProps {
  value: number | null;
  variant?: "numeric" | "dot";
}

export function ConfidenceValue({ value, variant = "numeric" }: ConfidenceValueProps) {
  if (value == null) return <span className="text-[12px] text-[var(--cevi-text-muted)]">&mdash;</span>;

  const pct = Math.round(value * 100);
  const cls = pct >= 95 ? "conf-high" : pct >= 70 ? "conf-mid" : "conf-low";

  if (variant === "dot") {
    const color = pct >= 95 ? "#1F6F3F" : pct >= 70 ? "#8A5A0F" : "#A32D2D";
    return (
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      </span>
    );
  }

  return <span className={`conf-val ${cls}`}>{pct}%</span>;
}
