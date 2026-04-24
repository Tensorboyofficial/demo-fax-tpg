"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Stethoscope,
  FlaskConical,
  ShieldCheck,
  FileText,
  Pill,
  FileSearch,
  Image as ImageIcon,
  HelpCircle,
} from "lucide-react";
import {
  Badge,
  typeBadgeVariant,
  statusBadgeVariant,
  urgencyBadgeVariant,
} from "@/frontend/components/ui/badge";
import { ConfidenceMeter } from "@/frontend/components/composed/confidence-meter";
import { faxes as seedFaxes } from "@/data/seed/faxes";
import { patients } from "@/data/seed/patients";
import { providers } from "@/data/seed/providers";
import { agents } from "@/data/seed/agents";
import { formatRelative, cn } from "@/shared/utils";
import type { Fax, FaxType, FaxStatus } from "@/shared/types";
// (client component — data is passed in via props when available, else seed fallback)

const TYPE_LABELS: Record<FaxType, string> = {
  referral: "Referral",
  lab_result: "Lab Result",
  prior_auth: "Prior Auth",
  records_request: "Records Req",
  rx_refill: "Rx Refill",
  specialist_consult: "Specialist",
  imaging_report: "Imaging",
  unknown: "Unclassified",
};

const STATUS_LABELS: Record<FaxStatus, string> = {
  received: "Received",
  processing: "Processing",
  auto_routed: "Auto-routed",
  needs_review: "Needs review",
  failed_match: "No match",
  routed: "Routed",
  completed: "Completed",
};

const TYPE_ICON: Record<FaxType, React.ReactNode> = {
  referral: <Stethoscope className="h-3.5 w-3.5" strokeWidth={1.5} />,
  lab_result: <FlaskConical className="h-3.5 w-3.5" strokeWidth={1.5} />,
  prior_auth: <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />,
  records_request: <FileSearch className="h-3.5 w-3.5" strokeWidth={1.5} />,
  rx_refill: <Pill className="h-3.5 w-3.5" strokeWidth={1.5} />,
  specialist_consult: <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />,
  imaging_report: <ImageIcon className="h-3.5 w-3.5" strokeWidth={1.5} />,
  unknown: <HelpCircle className="h-3.5 w-3.5" strokeWidth={1.5} />,
};

const TYPE_FILTERS: { key: "all" | FaxType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "specialist_consult", label: "Specialist" },
  { key: "lab_result", label: "Lab" },
  { key: "prior_auth", label: "Prior Auth" },
  { key: "referral", label: "Referrals" },
  { key: "rx_refill", label: "Rx" },
  { key: "records_request", label: "Records" },
  { key: "imaging_report", label: "Imaging" },
  { key: "unknown", label: "Unclassified" },
];

const STATUS_FILTERS: { key: "all" | "needs_review" | "auto_routed" | "completed"; label: string }[] = [
  { key: "all", label: "All statuses" },
  { key: "needs_review", label: "Needs review" },
  { key: "auto_routed", label: "Auto-routed" },
  { key: "completed", label: "Completed" },
];

function routeLabel(fax: Fax): string {
  if (!fax.routedTo) return "—";
  if (fax.routedTo.startsWith("P-")) {
    const prov = providers.find((p) => p.id === fax.routedTo);
    return prov ? prov.name.split(",")[0] : fax.routedTo;
  }
  if (fax.routedTo.startsWith("agent:")) {
    const key = fax.routedTo.slice("agent:".length);
    const ag = agents.find((a) => a.key === key);
    return ag ? ag.name.split(" ").slice(0, 2).join(" ") : key;
  }
  return fax.routedTo;
}

function patientLabel(fax: Fax): { primary: string; secondary: string } {
  if (!fax.matchedPatientId) {
    return {
      primary: fax.extracted.patientNameOnDoc ?? "No match",
      secondary: "Needs human review",
    };
  }
  const p = patients.find((pt) => pt.id === fax.matchedPatientId);
  if (!p) return { primary: "Unknown", secondary: "" };
  return {
    primary: `${p.firstName} ${p.lastName}`,
    secondary: `${p.mrn} · DOB ${new Date(p.dob).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit", timeZone: "UTC" })}`,
  };
}

interface Props {
  initialFilter?: "all" | FaxType | FaxStatus;
  faxes?: Fax[];
}

export function InboxTable({ initialFilter = "all", faxes: faxesProp }: Props) {
  const faxes = faxesProp ?? seedFaxes;
  const [typeFilter, setTypeFilter] = useState<string>(
    initialFilter === "all" ? "all" : initialFilter,
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return faxes.filter((f) => {
      const typeOK = typeFilter === "all" || f.type === typeFilter;
      const statusOK = statusFilter === "all" || f.status === statusFilter;
      return typeOK && statusOK;
    });
  }, [faxes, typeFilter, statusFilter]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              className={cn(
                "h-7 px-3 rounded-full text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors",
                typeFilter === f.key
                  ? "bg-[var(--cevi-accent)] text-white"
                  : "bg-white border border-[var(--cevi-border)] text-[var(--cevi-text-secondary)] hover:border-[var(--cevi-text-muted)]",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] font-semibold">
            Status
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-2 pr-7 rounded-md border border-[var(--cevi-border)] bg-white text-[12px] text-[var(--cevi-text)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--cevi-border)] bg-white overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--cevi-surface-warm)] text-left text-[10px] font-semibold text-[var(--cevi-text-tertiary)] uppercase tracking-[0.08em]">
              <th className="px-4 py-3 w-28">Received</th>
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3 w-36">Type</th>
              <th className="px-4 py-3 w-52">Patient</th>
              <th className="px-4 py-3 w-24">Clinic</th>
              <th className="px-4 py-3 w-24">Confidence</th>
              <th className="px-4 py-3 w-28">Status</th>
              <th className="px-4 py-3 w-36">Routed</th>
              <th className="px-4 py-3 w-16 text-right">Pg</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((fax) => {
              const p = patientLabel(fax);
              const needsReview = fax.status === "needs_review";
              return (
                <tr
                  key={fax.id}
                  className={cn(
                    "border-b border-[var(--cevi-border-light)] last:border-b-0 hover:bg-[var(--cevi-surface-warm)] transition-colors cursor-pointer",
                    needsReview && "bg-[var(--cevi-accent-light)]/30",
                  )}
                >
                  <td className="px-4 py-3 align-top">
                    <Link href={`/inbox/${fax.id}`} className="block">
                      <div className="text-[12px] text-[var(--cevi-text)] font-medium">
                        {formatRelative(fax.receivedAt)}
                      </div>
                      {fax.urgency !== "routine" && (
                        <Badge
                          variant={urgencyBadgeVariant(fax.urgency)}
                          size="sm"
                          dot
                          pulse={fax.urgency === "critical"}
                          className="mt-1"
                        >
                          {fax.urgency}
                        </Badge>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link href={`/inbox/${fax.id}`} className="block">
                      <div className="text-[13px] text-[var(--cevi-text)] font-medium line-clamp-1">
                        {fax.fromOrg}
                      </div>
                      <div className="text-[11px] text-[var(--cevi-text-muted)] font-mono">
                        {fax.fromNumber}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link href={`/inbox/${fax.id}`} className="block">
                      <Badge variant={typeBadgeVariant(fax.type)} size="sm">
                        <span className="inline-flex items-center gap-1">
                          {TYPE_ICON[fax.type]}
                          {TYPE_LABELS[fax.type]}
                        </span>
                      </Badge>
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link href={`/inbox/${fax.id}`} className="block">
                      <div className="text-[13px] text-[var(--cevi-text)] font-medium">
                        {p.primary}
                      </div>
                      <div className="text-[11px] text-[var(--cevi-text-muted)] font-mono">
                        {p.secondary}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link href={`/inbox/${fax.id}`} className="block">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--cevi-teal)]" />
                        <span className="text-[12px] text-[var(--cevi-text-secondary)]">
                          {fax.toClinic}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link href={`/inbox/${fax.id}`} className="block">
                      <ConfidenceMeter value={fax.matchConfidence} />
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link href={`/inbox/${fax.id}`} className="block">
                      <Badge
                        variant={statusBadgeVariant(fax.status)}
                        size="sm"
                        dot={fax.status !== "completed"}
                      >
                        {STATUS_LABELS[fax.status]}
                      </Badge>
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link href={`/inbox/${fax.id}`} className="block">
                      <div className="text-[12px] text-[var(--cevi-text-secondary)] line-clamp-1">
                        {routeLabel(fax)}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <Link href={`/inbox/${fax.id}`} className="block">
                      <span className="text-[12px] text-[var(--cevi-text-muted)] tabular-nums">
                        {fax.pages} pg
                      </span>
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <div className="text-[14px] text-[var(--cevi-text-muted)] mb-2">
                    No faxes match the current filters.
                  </div>
                  <button
                    onClick={() => {
                      setTypeFilter("all");
                      setStatusFilter("all");
                    }}
                    className="text-[12px] font-semibold text-[var(--cevi-accent)] hover:underline"
                  >
                    Clear filters
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-[11px] text-[var(--cevi-text-muted)] flex items-center gap-2 flex-wrap">
        <span>
          Showing {filtered.length} of {faxes.length} faxes · synced from Medsender
          30s ago
        </span>
        {faxes.some((f) => f.id.startsWith("FAX-UP-")) && (
          <span className="inline-flex items-center gap-1 text-[var(--cevi-jade)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--cevi-jade)]" />
            {faxes.filter((f) => f.id.startsWith("FAX-UP-")).length} uploaded live
          </span>
        )}
      </div>
    </div>
  );
}
