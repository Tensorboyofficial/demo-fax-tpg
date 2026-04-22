import Link from "next/link";
import { InboxTable } from "@/components/inbox/InboxTable";
import { getAllFaxes } from "@/lib/data-merge";
import { UploadCloud } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const allFaxes = await getAllFaxes();

  const needsReview = allFaxes.filter((f) => f.status === "needs_review").length;
  const autoRouted = allFaxes.filter(
    (f) => f.status === "auto_routed" || f.status === "completed",
  ).length;
  const critical = allFaxes.filter(
    (f) => f.urgency === "critical" || f.urgency === "stat",
  ).length;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-[40px] leading-[1.05] tracking-[-0.02em] text-[var(--cevi-text)]">
            Inbox
          </h1>
          <div className="mt-2 text-[13px] text-[var(--cevi-text-muted)]">
            {allFaxes.length} faxes · {autoRouted} auto-routed · {needsReview} need
            review
            {critical > 0 ? ` · ${critical} critical` : ""}
          </div>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md text-[13px] font-semibold bg-[var(--cevi-accent)] text-white hover:bg-[var(--cevi-accent-hover)] transition-colors"
        >
          <UploadCloud className="h-3.5 w-3.5" strokeWidth={2} />
          Upload a fax
        </Link>
      </div>

      <InboxTable faxes={allFaxes} />
    </div>
  );
}
