import { AuditTable } from "@/frontend/components/features/audit/audit-table";

export const metadata = {
  title: "Audit Trail · Cevi",
};

export default function AuditPage() {
  return (
    <div>
      <div className="mb-8 max-w-2xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] mb-2">
          Audit Trail
        </div>
        <h1 className="font-serif text-[24px] sm:text-[32px] leading-[1.1] tracking-[-0.02em] text-[var(--cevi-text)]">
          Every event, forever.
        </h1>
        <p className="mt-3 text-[14px] text-[var(--cevi-text-muted)]">
          Every OCR run, classification decision, patient match, route, and chart
          write-back is timestamped, user-stamped, and immutable. HIPAA §164.312(b) and
          SOC 2 CC7.2 controls covered. Export any slice to CSV for your compliance team.
        </p>
      </div>
      <AuditTable />
    </div>
  );
}
