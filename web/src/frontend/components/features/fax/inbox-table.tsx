"use client";

import Link from "next/link";
import { useMemo, useState, useCallback, useRef } from "react";
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
  Upload,
  Download,
  Search,
  ExternalLink,
} from "lucide-react";
import { Badge, typeBadgeVariant } from "@/frontend/components/ui/badge";
import { StateChip } from "@/frontend/components/ui/state-chip";
import { ConfidenceValue } from "@/frontend/components/ui/confidence-value";
import { CategoryPill } from "@/frontend/components/ui/category-pill";
import { KeyboardShortcutsBar } from "@/frontend/components/ui/keyboard-shortcuts-bar";
import { FaxThumbnail } from "@/frontend/components/features/fax/fax-thumbnail";
import { FaxModal } from "@/frontend/components/features/fax/fax-modal";
import { HoverPreview } from "@/frontend/components/features/fax/hover-preview";
import { useSpreadsheetSelection } from "@/frontend/hooks/use-spreadsheet-selection";
import { useKeyboardNav } from "@/frontend/hooks/use-keyboard-nav";
import { useToast } from "@/frontend/components/ui/toast";
import { patients } from "@/data/seed/patients";
import { formatRelative, cn } from "@/shared/utils";
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
  lab_result: "Lab", specialist_consult: "Consult", imaging_report: "Imaging",
  rx_refill: "Rx Refill", unknown: "Other",
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

const SHORTCUTS = [
  { keys: ["\u2191\u2193", "\u2190\u2192"], label: "navigate" },
  { keys: ["\u21B5"], label: "copy & down" },
  { keys: ["\u21E5"], label: "copy & right" },
  { keys: ["\u2318C"], label: "copy cell or range" },
  { keys: ["\u21E7+click"], label: "range" },
];

function patientLabel(fax: Fax): string {
  if (!fax.matchedPatientId) {
    return fax.extracted.patientNameOnDoc ?? "Unmatched";
  }
  const p = patients.find((pt) => pt.id === fax.matchedPatientId);
  if (!p) return "Unknown";
  return `${p.lastName}, ${p.firstName}`;
}

/* ─── Column definitions ─── */
interface ColDef {
  key: string;
  header: string;
  width: string;
  getValue: (fax: Fax) => string;
  render: (fax: Fax) => React.ReactNode;
}

function makeCols(): ColDef[] {
  return [
    {
      key: "document",
      header: "Document",
      width: "w-[120px]",
      getValue: (f) => f.id,
      render: (f) => (
        <div>
          <div className="text-[11px] font-mono text-[#1A1A1A] font-medium">{f.id.replace("FAX-20260423-", "FAX-")}</div>
          <div className="text-[10px] text-[#9CA3AF]">{f.pages} pg</div>
        </div>
      ),
    },
    {
      key: "preview",
      header: "Preview",
      width: "w-[70px]",
      getValue: () => "",
      render: () => null, // handled separately with FaxThumbnail
    },
    {
      key: "type",
      header: "Type",
      width: "w-[90px]",
      getValue: (f) => TYPE_LABELS[f.type] ?? f.type,
      render: (f) => (
        <Badge variant={typeBadgeVariant(f.type)} size="sm">
          <span className="inline-flex items-center gap-1">
            {TYPE_ICON[f.type]}
            {TYPE_LABELS[f.type] ?? f.type}
          </span>
        </Badge>
      ),
    },
    {
      key: "patient",
      header: "Patient",
      width: "min-w-[160px]",
      getValue: (f) => patientLabel(f),
      render: (f) => (
        <span className="text-[12px] text-[#1A1A1A]">
          {patientLabel(f)}
        </span>
      ),
    },
    {
      key: "sender",
      header: "Sender",
      width: "w-[160px]",
      getValue: (f) => f.fromOrg,
      render: (f) => (
        <span className="text-[12px] text-[#1A1A1A] font-medium truncate block">
          {f.fromOrg}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "w-[120px]",
      getValue: (f) => toLifecycle(f.status),
      render: (f) => <StateChip state={toLifecycle(f.status)} />,
    },
    {
      key: "confidence",
      header: "Confidence",
      width: "w-[100px]",
      getValue: (f) => f.matchConfidence != null ? `${Math.round(f.matchConfidence * 100)}%` : "\u2014",
      render: (f) => <ConfidenceValue value={f.matchConfidence} variant="dot" />,
    },
    {
      key: "received",
      header: "Received",
      width: "w-[90px]",
      getValue: (f) => formatRelative(f.receivedAt),
      render: (f) => (
        <span className="text-[11px] text-[#9CA3AF] font-medium tabular-nums">
          {formatRelative(f.receivedAt)}
        </span>
      ),
    },
    {
      key: "action",
      header: "",
      width: "w-[50px]",
      getValue: () => "",
      render: (f) => (
        <Link
          href={`/inbox/${f.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-[var(--cevi-text-muted)] hover:text-[var(--cevi-accent)] hover:bg-[var(--cevi-accent-light)] transition-colors"
          title="View details"
        >
          <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
        </Link>
      ),
    },
  ];
}

/* ─── Main Component ─── */
interface Props {
  faxes?: Fax[];
}

export function InboxTable({ faxes: faxesProp }: Props) {
  const { toast } = useToast();
  const faxes = faxesProp ?? [];
  const cols = useMemo(() => makeCols(), []);
  const gridRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const [statusFilter, setStatusFilter] = useState<Lifecycle>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Modal & hover state
  const [modalFax, setModalFax] = useState<Fax | null>(null);
  const [hoverFax, setHoverFax] = useState<Fax | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Inline edit state
  const [editCell, setEditCell] = useState<{ r: number; c: number } | null>(null);
  const [editValue, setEditValue] = useState("");

  const filtered = useMemo(() => {
    return faxes.filter((f) => {
      const lifecycle = toLifecycle(f.status);
      const statusOK = statusFilter === "all" || lifecycle === statusFilter;
      const catOK = categoryFilter === "all" || f.type === categoryFilter;
      const q = search.toLowerCase();
      const searchOK = !q ||
        f.fromOrg.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q) ||
        (f.extracted.patientNameOnDoc ?? "").toLowerCase().includes(q);
      return statusOK && catOK && searchOK;
    });
  }, [faxes, statusFilter, categoryFilter, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: faxes.length, unopened: 0, opened: 0, archived: 0, needs_review: 0 };
    for (const f of faxes) c[toLifecycle(f.status)]++;
    return c;
  }, [faxes]);

  const needsReviewCount = counts.needs_review;

  // Selection
  const getCellValue = useCallback(
    (r: number, c: number) => {
      const fax = filtered[r];
      if (!fax) return "";
      return cols[c].getValue(fax);
    },
    [filtered, cols],
  );

  const selection = useSpreadsheetSelection({
    rowCount: filtered.length,
    colCount: cols.length,
    getCellValue,
    onCopy: (text) => toast(text),
  });

  useKeyboardNav({
    wrapperRef: gridRef,
    move: selection.move,
    extendSelection: selection.extendSelection,
    copyCurrent: selection.copyCurrent,
    selectAll: selection.selectAll,
    onEscape: () => setModalFax(null),
  });

  return (
    <div>
      {/* Search row */}
      <div className="flex items-center gap-3 px-5 py-3">
        <div className="flex-1 flex items-center">
          <Search className="h-5 w-5 text-[#9CA3AF] mr-2 shrink-0" strokeWidth={1.5} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="search-clean flex-1 border-0 outline-none bg-transparent text-[18px] font-medium text-[#1A1A1A] placeholder:text-[#9CA3AF] py-1"
          />
        </div>
        <Link href="/upload">
          <button className="inline-flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-[#1A1A1A] bg-white border border-[#D4D4D4] rounded-[10px] hover:bg-[#F5F5F5] transition-colors">
            <Upload className="h-3.5 w-3.5" strokeWidth={2} />
            Upload
          </button>
        </Link>
        <button
          onClick={() => {
            const params = new URLSearchParams({ format: "json" });
            if (categoryFilter !== "all") params.set("category", categoryFilter);
            window.open(`/api/v1/export?${params.toString()}`, "_blank");
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-[#1A1A1A] bg-white border border-[#D4D4D4] rounded-[10px] hover:bg-[#F5F5F5] transition-colors"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2} />
          Export
        </button>
        <div className="h-8 w-8 rounded-full bg-[var(--cevi-accent)] text-white font-semibold text-[11px] inline-flex items-center justify-center shrink-0 cursor-pointer">
          T
        </div>
      </div>

      {/* Category row */}
      <div className="flex items-center justify-between px-5 pb-3 gap-3">
        <div className="flex items-center gap-3">
          <CategoryPill
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={CATEGORY_OPTIONS}
          />
          <span className="text-[12px] text-[#9CA3AF] font-medium">
            {selection.selectedCellCount > 1
              ? `${selection.selectedCellCount} cells selected`
              : `${filtered.length} faxes`}
          </span>
        </div>
      </div>

      {/* Keyboard shortcuts bar */}
      <KeyboardShortcutsBar shortcuts={SHORTCUTS} />

      {/* Status tabs */}
      <div className="flex items-center gap-1 px-5 border-t border-[#EAEAEA] border-b border-b-[#EAEAEA] bg-white">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={cn(
              "px-[14px] py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px",
              statusFilter === tab.key
                ? "text-[#1A1A1A] border-b-[#1A1A1A]"
                : "text-[#6B7280] border-b-transparent hover:text-[#1A1A1A]",
            )}
          >
            {tab.label}
            {tab.key === "needs_review" && needsReviewCount > 0 && (
              <span className="ml-1.5 inline-block px-1.5 py-0.5 text-[11px] font-medium text-[#A32D2D] bg-[#FEF2F2] rounded-full">
                {needsReviewCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div ref={gridRef} tabIndex={0} className="overflow-auto max-h-[640px] outline-none">
        <table className="w-full min-w-max border-collapse text-[12px]">
          <thead>
            <tr>
              {cols.map((col, ci) => (
                <th
                  key={col.key}
                  onClick={() => selection.selectColumn(ci, false)}
                  className={cn(
                    "font-medium text-[11px] text-[#6B7280] px-3 py-2 bg-[#FAFAFA] border-r border-b border-[#F0F0F0] text-left sticky top-0 z-[2] whitespace-nowrap cursor-pointer select-none transition-colors hover:bg-[#F0F0F0]",
                    col.width,
                    selection.isColSelected(ci) && "grid-colhead col-selected",
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((fax, ri) => {
              const isUnopened = toLifecycle(fax.status) === "unopened";
              return (
              <tr
                key={fax.id}
                className={cn(
                  "group transition-colors",
                  isUnopened ? "font-semibold" : "font-normal",
                  selection.isRowSelected(ri) && "bg-[#FAFAFA]",
                )}
              >
                {cols.map((col, ci) => {
                  const isEditing = editCell?.r === ri && editCell?.c === ci;
                  return (
                  <td
                    key={col.key}
                    className={cn(
                      "border-r border-b border-[#F0F0F0] cursor-cell select-none relative text-[12px] text-[#1A1A1A]",
                      selection.cellClasses(ri, ci),
                      !selection.isRowSelected(ri) && "group-hover:bg-[#FAFAFA]",
                    )}
                    onMouseDown={(e) => {
                      if ((e.target as HTMLElement).closest(".fax-thumb")) return;
                      if ((e.target as HTMLElement).closest("a")) return;
                      if (isEditing) return;
                      selection.onMouseDown(ri, ci, e.shiftKey);
                      gridRef.current?.focus();
                    }}
                    onMouseEnter={(e) => selection.onMouseEnter(ri, ci, e.buttons)}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest(".fax-thumb")) return;
                      if ((e.target as HTMLElement).closest("a")) return;
                      if (isEditing) return;
                      if (col.key === "preview" || col.key === "action") return;
                      const val = col.getValue(fax);
                      if (val) {
                        navigator.clipboard.writeText(val).catch(() => {});
                        toast("Copied: " + (val.length > 38 ? val.substring(0, 38) + "…" : val));
                      }
                    }}
                    onDoubleClick={(e) => {
                      if ((e.target as HTMLElement).closest(".fax-thumb")) return;
                      if ((e.target as HTMLElement).closest("a")) return;
                      if (col.key === "preview" || col.key === "action") return;
                      const val = col.getValue(fax);
                      setEditCell({ r: ri, c: ci });
                      setEditValue(val);
                      setTimeout(() => editRef.current?.focus(), 0);
                    }}
                  >
                    {isEditing ? (
                      <div className="px-3 py-2.5 min-h-[18px] flex items-center">
                        <input
                          ref={editRef}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => setEditCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setEditCell(null);
                              selection.move(1, 0, false);
                            }
                            if (e.key === "Escape") setEditCell(null);
                            if (e.key === "Tab") {
                              e.preventDefault();
                              setEditCell(null);
                              selection.move(0, e.shiftKey ? -1 : 1, false);
                            }
                          }}
                          className="search-clean w-full bg-transparent border-none outline-none text-[12px] text-[var(--cevi-text)] p-0 m-0"
                        />
                      </div>
                    ) : (
                    <div className="px-3 py-2.5 min-h-[18px] flex items-center gap-1.5">
                      {col.key === "preview" ? (
                        <FaxThumbnail
                          fax={fax}
                          onClick={() => setModalFax(fax)}
                          onMouseEnter={(e) => {
                            setHoverFax(fax);
                            setHoverPos({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => {
                            setHoverFax(null);
                            setHoverPos(null);
                          }}
                        />
                      ) : (
                        col.render(fax)
                      )}
                    </div>
                    )}
                  </td>
                  );
                })}
              </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={cols.length} className="py-16 text-center">
                  <div className="text-[12px] text-[#9CA3AF] mb-2">
                    No faxes match the current filters.
                  </div>
                  <button
                    onClick={() => { setStatusFilter("all"); setCategoryFilter("all"); setSearch(""); }}
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

      {/* Hover preview + Modal */}
      <HoverPreview fax={hoverFax} position={hoverPos} />
      {modalFax && <FaxModal fax={modalFax} onClose={() => setModalFax(null)} />}
    </div>
  );
}
