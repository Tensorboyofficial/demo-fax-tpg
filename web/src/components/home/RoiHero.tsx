import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  faxesThisWeek: number;
  hoursSaved: number;
  dollarsSaved: number;
  className?: string;
}

export function RoiHero({
  faxesThisWeek,
  hoursSaved,
  dollarsSaved,
  className,
}: Props) {
  return (
    <Card
      padding="lg"
      className={cn(
        "bg-[var(--cevi-accent-bg)] border-[var(--cevi-accent)]/10",
        className,
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr] gap-6 md:gap-8 md:divide-x divide-[var(--cevi-accent)]/10">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-accent)]">
            Faxes handled this week
          </div>
          <div className="mt-2 font-serif text-[44px] leading-none text-[var(--cevi-text)] tabular-nums">
            {faxesThisWeek.toLocaleString()}
          </div>
          <div className="mt-2 text-[12px] text-[var(--cevi-text-muted)]">
            Across your 4 clinics · zero hand-sorting
          </div>
        </div>

        <div className="md:pl-6 lg:pl-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-accent)]">
            Staff hours reclaimed
          </div>
          <div className="mt-2 font-serif text-[44px] leading-none text-[var(--cevi-text)] tabular-nums">
            {hoursSaved}
          </div>
          <div className="mt-2 text-[12px] text-[var(--cevi-text-muted)]">
            ~3 minutes per fax of manual sorting, gone
          </div>
        </div>

        <div className="md:pl-6 lg:pl-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-accent)]">
            Saved vs one more MA
          </div>
          <div className="mt-2 font-serif text-[44px] leading-none text-[var(--cevi-text)] tabular-nums">
            ${dollarsSaved.toLocaleString()}
          </div>
          <div className="mt-2 text-[12px] text-[var(--cevi-text-muted)] inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-[var(--cevi-accent)]" strokeWidth={1.5} />
            Based on $15/hr fully loaded
          </div>
        </div>
      </div>
    </Card>
  );
}
