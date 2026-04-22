"use client";

import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0..1
  className?: string;
  tone?: "accent" | "jade" | "amber";
}

export function Progress({ value, className, tone = "accent" }: ProgressProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const toneClass =
    tone === "jade"
      ? "bg-[var(--cevi-jade)]"
      : tone === "amber"
        ? "bg-[var(--cevi-amber)]"
        : "bg-[var(--cevi-accent)]";
  return (
    <div
      className={cn(
        "h-1.5 w-full rounded-full bg-[var(--cevi-border-light)] overflow-hidden",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full", toneClass)}
        style={{
          width: `${clamped * 100}%`,
          transition: "width 500ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
    </div>
  );
}
