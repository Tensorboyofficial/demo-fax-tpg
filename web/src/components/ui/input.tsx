"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  iconLeft?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, iconLeft, ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        className={cn(
          "w-full h-9 rounded-lg border border-[var(--cevi-border)] bg-white px-3 text-[13px] text-[var(--cevi-text)] placeholder:text-[var(--cevi-text-faint)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20 transition-colors",
          iconLeft && "pl-9",
          className,
        )}
        {...props}
      />
    );
    if (!iconLeft) return input;
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cevi-text-faint)] pointer-events-none">
          {iconLeft}
        </span>
        {input}
      </div>
    );
  },
);
Input.displayName = "Input";
