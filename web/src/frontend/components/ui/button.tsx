"use client";

import { cn } from "@/shared/utils";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "bg-[var(--cevi-accent)] text-white hover:bg-[var(--cevi-accent-hover)]",
  secondary:
    "bg-white border border-[var(--cevi-border)] text-[var(--cevi-text)] hover:border-[var(--cevi-text-muted)]",
  ghost:
    "bg-transparent text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface)] hover:text-[var(--cevi-text)]",
  outline:
    "bg-transparent border border-[var(--cevi-border)] text-[var(--cevi-text-secondary)] hover:border-[var(--cevi-accent)] hover:text-[var(--cevi-accent)]",
  danger:
    "bg-[var(--cevi-error-light)] border border-[var(--cevi-error)]/20 text-[var(--cevi-error)] hover:bg-[var(--cevi-error)]/10",
} as const;

const sizes = {
  sm: "px-3 py-1.5 text-[12px] h-8",
  md: "px-4 py-2 text-[13px] h-9",
  lg: "px-6 py-3 text-[14px] h-11",
  icon: "h-9 w-9 p-0",
} as const;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      icon,
      iconRight,
      fullWidth,
      disabled,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cevi-accent)]/30 disabled:pointer-events-none disabled:opacity-50 cursor-pointer whitespace-nowrap",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : icon ? (
        <span className="shrink-0 inline-flex">{icon}</span>
      ) : null}
      {children}
      {iconRight && <span className="shrink-0 inline-flex">{iconRight}</span>}
    </button>
  ),
);
Button.displayName = "Button";
