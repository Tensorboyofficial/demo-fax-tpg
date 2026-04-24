interface Props {
  data: { label: string; value: number; isToday?: boolean }[];
  className?: string;
}

export function ThroughputChart({ data, className }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={className}>
      <div className="flex items-end gap-2 h-40">
        {data.map((d) => {
          const h = (d.value / max) * 100;
          return (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex-1 flex flex-col justify-end">
                <div
                  className={
                    d.isToday
                      ? "bg-[var(--cevi-accent)] rounded-t"
                      : "bg-[var(--cevi-accent-bg)] rounded-t border-t-2 border-[var(--cevi-accent)]/30"
                  }
                  style={{ height: `${h}%` }}
                  title={`${d.value} faxes`}
                />
              </div>
              <div className="text-[10px] text-[var(--cevi-text-muted)] tabular-nums">
                {d.label}
              </div>
              <div className="text-[11px] font-semibold text-[var(--cevi-text)] tabular-nums">
                {d.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
