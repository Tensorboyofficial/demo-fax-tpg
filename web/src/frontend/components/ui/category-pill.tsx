"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

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
        className="inline-flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-white rounded-[10px] transition-colors"
        style={{ background: "#E85D40", borderColor: "#E85D40" }}
      >
        {selected?.label ?? value}
        <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[#D4D4D4] rounded-lg shadow-lg z-50 min-w-[200px] max-h-[360px] overflow-y-auto py-1">
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { onChange(opt.key); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-[12px] font-medium transition-colors ${
                opt.key === value
                  ? "bg-[#FEF7F5] text-[#E85D40]"
                  : "text-[#1A1A1A] hover:bg-[#F5F5F5]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
