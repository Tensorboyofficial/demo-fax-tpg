import Link from "next/link";
import { InboxTable } from "@/components/inbox/InboxTable";
import { RoiHero } from "@/components/home/RoiHero";
import { InlineDropzone } from "@/components/home/InlineDropzone";
import { HowItWorks } from "@/components/home/HowItWorks";
import { getAllFaxes } from "@/lib/data-merge";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const allFaxes = await getAllFaxes();

  // Week = last 7 days (demo-time anchored)
  const weekAgo = new Date("2026-04-16T14:32:00Z").getTime();
  const thisWeek = allFaxes.filter(
    (f) => new Date(f.receivedAt).getTime() >= weekAgo,
  ).length;

  // Staff math: ~3 min of manual sorting per fax. Round to nearest hour.
  // Add seed-like offset so the numbers feel real with only 15 seeded faxes.
  const weeklyFaxesDisplayed = thisWeek > 50 ? thisWeek : thisWeek + 1832;
  const hoursSaved = Math.round((weeklyFaxesDisplayed * 3) / 60);
  const dollarsSaved = Math.round(hoursSaved * 15);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] mb-2">
            Thursday, April 23
          </div>
          <h1 className="font-serif text-[36px] leading-[1.05] tracking-[-0.02em] text-[var(--cevi-text)]">
            Good morning, Dr. Nguyen.
          </h1>
          <p className="mt-2 text-[14px] text-[var(--cevi-text-muted)] max-w-2xl">
            Here is what Cevi handled overnight. Everything below is already tagged,
            matched to a patient, and queued for your chart.
          </p>
        </div>
      </div>

      <RoiHero
        faxesThisWeek={weeklyFaxesDisplayed}
        hoursSaved={hoursSaved}
        dollarsSaved={dollarsSaved}
      />

      <InlineDropzone />

      <section>
        <div className="mb-4 flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] mb-1">
              Your inbox
            </div>
            <h2 className="font-serif text-[22px] text-[var(--cevi-text)] leading-tight">
              {allFaxes.length} {allFaxes.length === 1 ? "fax" : "faxes"} ready to send to chart
            </h2>
          </div>
          <Link
            href="/upload"
            className="text-[12px] font-semibold text-[var(--cevi-accent)] hover:underline inline-flex items-center gap-1"
          >
            Upload a fax <ArrowRight className="h-3 w-3" strokeWidth={2} />
          </Link>
        </div>
        <InboxTable faxes={allFaxes} />
      </section>

      <HowItWorks />

      <footer className="pt-6 border-t border-[var(--cevi-border-light)] text-[11px] text-[var(--cevi-text-muted)] flex items-center justify-between flex-wrap gap-2">
        <div>
          Cevi · Fax intelligence for Transcend Medical Group · HIPAA + SOC 2 Type II
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/audit"
            className="hover:text-[var(--cevi-text)] transition-colors"
          >
            Audit trail
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            href="/agents"
            className="hover:text-[var(--cevi-text)] transition-colors"
          >
            Admin view
          </Link>
        </div>
      </footer>
    </div>
  );
}
