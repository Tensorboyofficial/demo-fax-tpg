interface ConfidenceValueProps {
  value: number | null;
  variant?: "numeric" | "dot";
}

const thresholds = {
  high: { color: "var(--cevi-success)", dot: "#1F6F3F" },
  mid: { color: "var(--cevi-warning)", dot: "#8A5A0F" },
  low: { color: "#A32D2D", dot: "#A32D2D" },
} as const;

function tier(pct: number) {
  if (pct >= 95) return thresholds.high;
  if (pct >= 70) return thresholds.mid;
  return thresholds.low;
}

export function ConfidenceValue({ value, variant = "numeric" }: ConfidenceValueProps) {
  if (value == null) return <span className="text-[11px] text-[var(--cevi-text-faint)]">&mdash;</span>;

  const pct = Math.round(value * 100);
  const t = tier(pct);

  if (variant === "dot") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span
          className="inline-block w-[7px] h-[7px] rounded-full"
          style={{ backgroundColor: t.dot }}
        />
        <span
          className="text-[11px] font-medium tabular-nums"
          style={{ color: t.dot }}
        >
          {pct}%
        </span>
      </span>
    );
  }

  const cls = pct >= 95 ? "conf-high" : pct >= 70 ? "conf-mid" : "conf-low";
  return <span className={`conf-val ${cls}`}>{pct}%</span>;
}
