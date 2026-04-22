import { cn } from "@/lib/utils";

type Tone = "accent" | "teal" | "jade" | "sand" | "amber" | "coral" | "muted";

const toneClasses: Record<Tone, string> = {
  accent: "bg-[var(--cevi-accent-bg)] text-[var(--cevi-accent)]",
  teal: "bg-[var(--cevi-teal-light)] text-[var(--cevi-teal)]",
  jade: "bg-[var(--cevi-jade-light)] text-[var(--cevi-jade)]",
  sand: "bg-[var(--cevi-sand-light)] text-[var(--cevi-sand)]",
  amber: "bg-[var(--cevi-amber-light)] text-[var(--cevi-amber)]",
  coral: "bg-[var(--cevi-coral-light)] text-[var(--cevi-coral)]",
  muted: "bg-[var(--cevi-surface)] text-[var(--cevi-text-muted)]",
};

interface IconBoxProps {
  children: React.ReactNode;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function IconBox({
  children,
  tone = "accent",
  size = "md",
  className,
}: IconBoxProps) {
  const sizeClass =
    size === "sm" ? "w-7 h-7" : size === "lg" ? "w-12 h-12" : "w-9 h-9";
  return (
    <div
      className={cn(
        "rounded-lg flex items-center justify-center shrink-0",
        sizeClass,
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
