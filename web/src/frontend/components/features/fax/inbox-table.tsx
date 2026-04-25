"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useCallback } from "react";
import {
  FlaskConical,
  Stethoscope,
  ShieldCheck,
  FileText,
  FileSearch,
  Image as ImageIcon,
  HelpCircle,
  Receipt,
  ClipboardList,
  HeartPulse,
  Pill,
} from "lucide-react";
import { Badge, typeBadgeVariant } from "@/frontend/components/ui/badge";
import { StateChip } from "@/frontend/components/ui/state-chip";
import { ConfidenceValue } from "@/frontend/components/ui/confidence-value";
import { CategoryPill } from "@/frontend/components/ui/category-pill";
import { FaxThumbnail } from "@/frontend/components/features/fax/fax-thumbnail";
import { useToast } from "@/frontend/components/ui/toast";
import { formatRelative, cn } from "@/shared/utils";
import { useIsDesktop } from "@/frontend/hooks/use-media-query";
import type { Fax } from "@/shared/types";

/* ─── Lifecycle ─── */
type Lifecycle = "all" | "unopened" | "opened" | "archived" | "needs_review";

const STATUS_TABS: { key: Lifecycle; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unopened", label: "Unopened" },
  { key: "opened", label: "Opened" },
  { key: "archived", label: "Archived" },
  { key: "needs_review", label: "Needs Review" },
];

function toLifecycle(status: string): Lifecycle {
  switch (status) {
    case "unopened": return "unopened";
    case "opened": return "opened";
    case "archived": return "archived";
    case "needs_review": case "failed_match": return "needs_review";
    case "received": case "processing": return "unopened";
    case "auto_routed": case "routed": return "opened";
    case "completed": return "archived";
    default: return "unopened";
  }
}

/* ─── Type labels ─── */
const TYPE_LABELS: Record<string, string> = {
  lab: "Lab", imaging: "Imaging", consult: "Consult", referral: "Referral",
  prior_auth: "Prior Auth", dme: "DME", forms: "Forms", records_request: "Records",
  eob: "EOB", discharge: "Discharge", other: "Other",
  lab_result: "Lab Result", specialist_consult: "Consult Note", imaging_report: "Imaging",
  rx_refill: "Rx Refill", unknown: "Other",
  consult_note: "Consult Note", referral_incoming: "Referral",
  prior_auth_response: "Prior Auth", pharmacy_prior_auth_request: "Pharmacy PA",
  pharmacy_refill_request: "Rx Refill", dme_documentation: "DME",
  physical_exam_form: "Physical Exam", medical_records_request: "Records Request",
  eob_era: "EOB / ERA", hospital_discharge_summary: "Discharge",
  ed_visit_summary: "ED Visit", cardiac_diagnostic_report: "Cardiac Dx",
  pathology_report: "Pathology", immunization_record: "Immunization",
  home_health_order: "Home Health", hospice_correspondence: "Hospice",
  snf_nh_correspondence: "SNF / NH", disability_or_leave_form: "Disability/Leave",
  handicap_placard_or_jury_excuse: "Handicap/Jury", payer_correspondence: "Payer",
  subpoena_or_legal_notice: "Legal Notice", marketing_or_junk: "Junk",
  unclassified: "Unclassified",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  lab: <FlaskConical className="h-3 w-3" strokeWidth={1.5} />,
  lab_result: <FlaskConical className="h-3 w-3" strokeWidth={1.5} />,
  imaging: <ImageIcon className="h-3 w-3" strokeWidth={1.5} />,
  imaging_report: <ImageIcon className="h-3 w-3" strokeWidth={1.5} />,
  consult: <FileText className="h-3 w-3" strokeWidth={1.5} />,
  specialist_consult: <FileText className="h-3 w-3" strokeWidth={1.5} />,
  referral: <Stethoscope className="h-3 w-3" strokeWidth={1.5} />,
  prior_auth: <ShieldCheck className="h-3 w-3" strokeWidth={1.5} />,
  dme: <ClipboardList className="h-3 w-3" strokeWidth={1.5} />,
  forms: <FileText className="h-3 w-3" strokeWidth={1.5} />,
  records_request: <FileSearch className="h-3 w-3" strokeWidth={1.5} />,
  eob: <Receipt className="h-3 w-3" strokeWidth={1.5} />,
  discharge: <HeartPulse className="h-3 w-3" strokeWidth={1.5} />,
  other: <HelpCircle className="h-3 w-3" strokeWidth={1.5} />,
  unknown: <HelpCircle className="h-3 w-3" strokeWidth={1.5} />,
  rx_refill: <Pill className="h-3 w-3" strokeWidth={1.5} />,
};

const CATEGORY_OPTIONS = [
  { key: "all", label: "All Types" },
  { key: "lab_result", label: "Lab Results" },
  { key: "imaging_report", label: "Imaging" },
  { key: "consult_note", label: "Consult Notes" },
  { key: "referral_incoming", label: "Referrals" },
  { key: "prior_auth_response", label: "Prior Auth" },
  { key: "pharmacy_prior_auth_request", label: "Pharmacy PA" },
  { key: "pharmacy_refill_request", label: "Rx Refill" },
  { key: "dme_documentation", label: "DME" },
  { key: "physical_exam_form", label: "Physical Exam" },
  { key: "medical_records_request", label: "Records Request" },
  { key: "eob_era", label: "EOB / ERA" },
  { key: "hospital_discharge_summary", label: "Discharge" },
  { key: "ed_visit_summary", label: "ED Visit" },
  { key: "cardiac_diagnostic_report", label: "Cardiac Dx" },
  { key: "pathology_report", label: "Pathology" },
  { key: "immunization_record", label: "Immunization" },
  { key: "home_health_order", label: "Home Health" },
  { key: "hospice_correspondence", label: "Hospice" },
  { key: "snf_nh_correspondence", label: "SNF / NH" },
  { key: "disability_or_leave_form", label: "Disability/Leave" },
  { key: "handicap_placard_or_jury_excuse", label: "Handicap/Jury" },
  { key: "payer_correspondence", label: "Payer" },
  { key: "subpoena_or_legal_notice", label: "Legal Notice" },
  { key: "marketing_or_junk", label: "Marketing/Junk" },
  { key: "unclassified", label: "Unclassified" },
];

function patientLabel(fax: Fax): string {
  return fax.extracted.patientNameOnDoc ?? "Unmatched";
}

/* ─── Main Component ─── */
interface Props {
  faxes?: Fax[];
}

export function InboxTable({ faxes: faxesProp }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q")?.toLowerCase() ?? "";
  const isDesktop = useIsDesktop();
  const faxes = faxesProp ?? [];

  const [statusFilter, setStatusFilter] = useState<Lifecycle>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Checkbox selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    return faxes.filter((f) => {
      const lifecycle = toLifecycle(f.status);
      const statusOK = statusFilter === "all" || lifecycle === statusFilter;
      const catOK = categoryFilter === "all" || f.type === categoryFilter;
      if (!statusOK || !catOK) return false;
      if (searchQuery) {
        const hay = [
          f.id,
          f.type,
          f.fromOrg,
          f.toClinic,
          f.extracted.patientNameOnDoc,
          f.extracted.sendingProvider,
        ].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(searchQuery);
      }
      return true;
    });
  }, [faxes, statusFilter, categoryFilter, searchQuery]);

  const counts = useMemo(() => {
    const base = categoryFilter === "all" ? faxes : faxes.filter((f) => f.type === categoryFilter);
    const c: Record<string, number> = { all: base.length, unopened: 0, opened: 0, archived: 0, needs_review: 0 };
    for (const f of base) c[toLifecycle(f.status)]++;
    return c;
  }, [faxes, categoryFilter]);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === filtered.length) return new Set();
      return new Set(filtered.map((f) => f.id));
    });
  }, [filtered]);

  const handleCellClick = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (text) {
      navigator.clipboard.writeText(text).catch(() => {});
      toast("Copied: " + (text.length > 38 ? text.substring(0, 38) + "\u2026" : text));
    }
  };

  return (
    <div>
      {/* Category dropdown */}
      <div className="px-3 sm:px-5 pt-3 pb-2">
        <CategoryPill
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={CATEGORY_OPTIONS}
        />
      </div>

      {/* Status tabs with counts */}
      <div className="flex items-center gap-0.5 px-3 sm:px-5 overflow-x-auto scrollbar-hide">
        {STATUS_TABS.map((tab) => {
          const count = counts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                "px-3 py-2 text-[15px] font-medium border-b-[2px] transition-colors -mb-px whitespace-nowrap",
                statusFilter === tab.key
                  ? "text-[var(--cevi-text)] border-b-[var(--cevi-text)]"
                  : "text-[var(--cevi-text-muted)] border-b-transparent hover:text-[var(--cevi-text-secondary)]",
              )}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  "ml-1.5 text-[13px]",
                  statusFilter === tab.key ? "text-[var(--cevi-text)]" : "text-[var(--cevi-text-faint)]",
                )}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--cevi-border)] mx-0" />

      {/* ── Mobile: Card list ── */}
      {!isDesktop && (
        <div className="divide-y divide-[var(--cevi-border-light)]">
          {filtered.map((fax) => {
            const isUnopened = toLifecycle(fax.status) === "unopened";
            return (
              <Link
                key={fax.id}
                href={`/inbox/${fax.id}`}
                className="flex items-start gap-3 px-4 py-3 active:bg-[var(--cevi-surface)] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn("text-[14px] text-[var(--cevi-text)] truncate", isUnopened && "font-semibold")}>
                      {fax.fromOrg}
                    </span>
                    <StateChip state={toLifecycle(fax.status)} />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={typeBadgeVariant(fax.type)} size="sm">
                      <span className="inline-flex items-center gap-1">
                        {TYPE_ICON[fax.type]}
                        {TYPE_LABELS[fax.type] ?? fax.type}
                      </span>
                    </Badge>
                    <ConfidenceValue value={fax.typeConfidence} variant="dot" />
                  </div>
                  <div className="text-[12px] text-[var(--cevi-text-muted)] truncate">
                    {patientLabel(fax)} &middot; {fax.pages} pg &middot; {formatRelative(fax.receivedAt)}
                  </div>
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <div className="text-[13px] text-[var(--cevi-text-faint)] mb-2">No faxes match filters.</div>
              <button
                onClick={() => { setStatusFilter("all"); setCategoryFilter("all"); }}
                className="text-[13px] font-semibold text-[var(--cevi-accent)]"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Desktop: Clean metadata table ── */}
      {isDesktop && (
        <div className="overflow-x-auto">
          <table className="w-full text-[16px]">
            <thead>
              <tr>
                <th className="w-[40px] px-3 py-2.5 text-left">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-[var(--cevi-border)] cursor-pointer accent-[var(--cevi-accent)]"
                  />
                </th>
                <th className="px-3 py-2.5 text-left text-[14px] font-medium text-[var(--cevi-text-muted)] select-none">Document</th>
                <th className="px-3 py-2.5 text-left text-[14px] font-medium text-[var(--cevi-text-muted)] select-none">Preview</th>
                <th className="px-3 py-2.5 text-left text-[14px] font-medium text-[var(--cevi-text-muted)] select-none">Type</th>
                <th className="px-3 py-2.5 text-left text-[14px] font-medium text-[var(--cevi-text-muted)] select-none">Patient</th>
                <th className="px-3 py-2.5 text-left text-[14px] font-medium text-[var(--cevi-text-muted)] select-none">Sender</th>
                <th className="px-3 py-2.5 text-left text-[14px] font-medium text-[var(--cevi-text-muted)] select-none">Status</th>
                <th className="px-3 py-2.5 text-left text-[14px] font-medium text-[var(--cevi-text-muted)] select-none">Confidence</th>
                <th className="px-3 py-2.5 text-left text-[14px] font-medium text-[var(--cevi-text-muted)] select-none">Received</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((fax) => {
                const lifecycle = toLifecycle(fax.status);
                const isUnopened = lifecycle === "unopened";
                const isSelected = selectedIds.has(fax.id);
                const patient = patientLabel(fax);

                return (
                  <tr
                    key={fax.id}
                    className={cn(
                      "transition-colors",
                      isSelected
                        ? "bg-[var(--cevi-accent-light)]"
                        : "hover:bg-[#F5F5F5]",
                    )}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        onClick={(e) => toggleSelect(fax.id, e)}
                        className="h-4 w-4 rounded border-[var(--cevi-border)] cursor-pointer accent-[var(--cevi-accent)]"
                      />
                    </td>

                    {/* Document */}
                    <td
                      className="px-3 py-3"
                      onClick={(e) => handleCellClick(fax.id, e)}
                    >
                      <span className="text-[14px] font-mono font-medium text-[var(--cevi-text)]">
                        {fax.id.replace("FAX-20260423-", "FAX-").replace("FAX-UP-", "FAX-")}
                      </span>
                    </td>

                    {/* Preview — double-click to open detail */}
                    <td
                      className="px-3 py-3 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={() => router.push(`/inbox/${fax.id}`)}
                    >
                      <FaxThumbnail fax={fax} />
                    </td>

                    {/* Type */}
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-[13px] font-medium rounded bg-[var(--cevi-surface)] text-[var(--cevi-text-secondary)]">
                        {TYPE_ICON[fax.type]}
                        {TYPE_LABELS[fax.type] ?? fax.type}
                      </span>
                    </td>

                    {/* Patient */}
                    <td
                      className="px-3 py-3"
                      onClick={(e) => handleCellClick(patient, e)}
                    >
                      <span className={cn(
                        "text-[16px] text-[var(--cevi-text)]",
                        isUnopened ? "font-semibold" : "font-normal",
                      )}
                      style={isUnopened ? { fontFamily: "var(--font-mono)" } : undefined}
                      >
                        {patient}
                      </span>
                    </td>

                    {/* Sender */}
                    <td
                      className="px-3 py-3"
                      onClick={(e) => handleCellClick(fax.fromOrg, e)}
                    >
                      <span className="text-[16px] text-[var(--cevi-text)]">
                        {fax.fromOrg}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <StateChip state={lifecycle} />
                    </td>

                    {/* Confidence (single metric) */}
                    <td className="px-3 py-3">
                      <ConfidenceValue value={fax.typeConfidence} variant="dot" />
                    </td>

                    {/* Received */}
                    <td className="px-3 py-3">
                      <span className="text-[14px] text-[var(--cevi-text-muted)] font-medium tabular-nums">
                        {formatRelative(fax.receivedAt)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="text-[14px] text-[var(--cevi-text-faint)] mb-2">
                      No faxes match the current filters.
                    </div>
                    <button
                      onClick={() => { setStatusFilter("all"); setCategoryFilter("all"); }}
                      className="text-[14px] font-semibold text-[var(--cevi-accent)] hover:underline"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
