import { cn } from "@/lib/utils";
import type { BadgeVariant } from "@/lib/badge-variants";

const variants: Record<BadgeVariant, string> = {
  default: "bg-[var(--cevi-surface)] text-[var(--cevi-text-secondary)]",
  coral: "bg-[var(--cevi-coral-light)] text-[var(--cevi-coral)]",
  amber: "bg-[var(--cevi-amber-light)] text-[var(--cevi-amber)]",
  jade: "bg-[var(--cevi-jade-light)] text-[var(--cevi-jade)]",
  sand: "bg-[var(--cevi-sand-light)] text-[var(--cevi-sand)]",
  teal: "bg-[var(--cevi-teal-light)] text-[var(--cevi-teal)]",
  success: "bg-[var(--cevi-success-light)] text-[var(--cevi-success)]",
  error: "bg-[var(--cevi-error-light)] text-[var(--cevi-error)]",
  accent:
    "bg-[var(--cevi-accent-light)] text-[var(--cevi-accent)] border border-[var(--cevi-accent)]/15",
  outline:
    "bg-transparent border border-[var(--cevi-border)] text-[var(--cevi-text-secondary)]",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-[var(--cevi-text-muted)]",
  coral: "bg-[var(--cevi-coral)]",
  amber: "bg-[var(--cevi-amber)]",
  jade: "bg-[var(--cevi-jade)]",
  sand: "bg-[var(--cevi-sand)]",
  teal: "bg-[var(--cevi-teal)]",
  success: "bg-[var(--cevi-success)]",
  error: "bg-[var(--cevi-error)]",
  accent: "bg-[var(--cevi-accent)]",
  outline: "bg-[var(--cevi-text-muted)]",
};

const sizes = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-[11px]",
} as const;

interface BadgeProps {
  variant?: BadgeVariant;
  size?: keyof typeof sizes;
  dot?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = "default",
  size = "md",
  dot,
  pulse,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-[0.04em]",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            dotColors[variant],
            pulse && "animate-pulse",
          )}
        />
      )}
      {children}
    </span>
  );
}

// Re-export for convenience so existing imports keep working.
export {
  typeBadgeVariant,
  statusBadgeVariant,
  urgencyBadgeVariant,
} from "@/lib/badge-variants";
