"use client";

import { cn } from "@/shared/utils";

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
} as const;

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: keyof typeof paddingStyles;
  as?: keyof React.JSX.IntrinsicElements;
}

export function Card({
  children,
  className,
  hover,
  padding = "md",
  as: Tag = "div",
}: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-lg bg-white border border-[var(--cevi-border)]",
        paddingStyles[padding],
        hover &&
          "transition-all duration-150 hover:border-[var(--cevi-accent)] hover:bg-[var(--cevi-accent-light)] hover:-translate-y-px",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-5 py-4 border-b border-[var(--cevi-border-light)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-5 py-4 border-t border-[var(--cevi-border-light)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
