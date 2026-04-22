import { Stat } from "@/components/ui/stat";
import { Button } from "@/components/ui/button";
import { InboxTable } from "@/components/inbox/InboxTable";
import { getAllFaxes } from "@/lib/data-merge";
import { Download, Filter, UploadCloud } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Fax Inbox · Cevi",
};

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const allFaxes = await getAllFaxes();
  const now = new Date("2026-04-23T14:32:00Z");

  const today = allFaxes.filter((f) => {
    const d = new Date(f.receivedAt);
    return (
      d.toDateString() === now.toDateString() ||
      d.getTime() > now.getTime() - 24 * 60 * 60 * 1000
    );
  });
  const autoRouted = today.filter(
    (f) => f.status === "auto_routed" || f.status === "completed",
  ).length;
  const needsReview = today.filter((f) => f.status === "needs_review").length;
  const critical = today.filter(
    (f) => f.urgency === "critical" || f.urgency === "stat",
  ).length;
  const uploadedCount = allFaxes.filter((f) => f.id.startsWith("FAX-UP-")).length;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] mb-2">
            Fax Inbox
          </div>
          <h1 className="font-serif text-[32px] leading-[1.1] tracking-[-0.02em] text-[var(--cevi-text)]">
            Every fax, triaged on arrival.
          </h1>
          <p className="mt-2 text-[14px] text-[var(--cevi-text-muted)] max-w-2xl">
            OCR runs in under 15 seconds. Classification is 95% accurate. Patient
            matching is continuous against your eClinicalWorks directory. Click any row
            to see the full pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/upload">
            <Button
              variant="secondary"
              icon={<UploadCloud className="h-3.5 w-3.5" strokeWidth={1.5} />}
            >
              Upload a fax
            </Button>
          </Link>
          <Button
            variant="secondary"
            icon={<Filter className="h-3.5 w-3.5" strokeWidth={1.5} />}
          >
            Saved views
          </Button>
          <Button
            variant="secondary"
            icon={<Download className="h-3.5 w-3.5" strokeWidth={1.5} />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Faxes today" value={today.length} helper="across 4 clinics" />
        <Stat
          label="Auto-routed"
          value={
            today.length
              ? `${Math.round((autoRouted / today.length) * 100)}%`
              : "—"
          }
          delta={`${autoRouted}/${today.length}`}
          deltaTone="positive"
          helper="no human touch"
        />
        <Stat
          label="Needs review"
          value={needsReview}
          delta={needsReview ? "action required" : "clear"}
          deltaTone={needsReview ? "negative" : "positive"}
          helper="confidence < 80%"
        />
        <Stat
          label={uploadedCount > 0 ? "Uploaded live" : "Critical / STAT"}
          value={uploadedCount > 0 ? uploadedCount : critical}
          delta={
            uploadedCount > 0
              ? "via /upload"
              : critical
                ? "on-call notified"
                : "none"
          }
          deltaTone={
            uploadedCount > 0 ? "positive" : critical ? "negative" : "positive"
          }
          helper={uploadedCount > 0 ? "persisted in Supabase" : "SMS dispatched"}
        />
      </div>

      <InboxTable faxes={allFaxes} />
    </div>
  );
}
