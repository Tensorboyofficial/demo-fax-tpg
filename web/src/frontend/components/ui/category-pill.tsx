"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface CategoryOption {
  key: string;
  label: string;
}

interface CategoryPillProps {
  value: string;
  onChange: (key: string) => void;
  options: CategoryOption[];
}

export function CategoryPill({ value, onChange, options }: CategoryPillProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.key === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-[5px] text-[12px] font-semibold text-white rounded-lg transition-all hover:opacity-90 active:scale-[0.97]"
        style={{ background: "var(--cevi-accent)" }}
      >
        {selected?.label ?? value}
        <ChevronDown
          className="h-3 w-3 transition-transform"
          strokeWidth={2.5}
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-[var(--cevi-border)] rounded-lg shadow-[var(--shadow-md)] z-50 min-w-[200px] max-h-[360px] overflow-y-auto py-1 scrollbar-thin">
          {options.map((opt) => {
            const active = opt.key === value;
            return (
              <button
                key={opt.key}
                onClick={() => { onChange(opt.key); setOpen(false); }}
                className={`w-full text-left px-3 py-[6px] text-[12px] font-medium transition-colors flex items-center justify-between gap-2 ${
                  active
                    ? "bg-[var(--cevi-accent-light)] text-[var(--cevi-accent)]"
                    : "text-[var(--cevi-text)] hover:bg-[var(--cevi-surface)]"
                }`}
              >
                {opt.label}
                {active && <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
