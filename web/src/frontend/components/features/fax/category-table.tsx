"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Search,
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
  Settings2,
} from "lucide-react";
import { Badge, typeBadgeVariant } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { useToast } from "@/frontend/components/ui/toast";
import { ConfidenceMeter } from "@/frontend/components/composed/confidence-meter";
import { SchemaBuilderDrawer } from "./schema-builder-drawer";
import { patients } from "@/data/seed/patients";
import { formatRelative, cn } from "@/shared/utils";
import type { Fax } from "@/shared/types";

/* ─── Lifecycle mapping ─── */
type Lifecycle = "all" | "unopened" | "opened" | "archived" | "needs_review";

const STATUS_TABS: { key: Lifecycle; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unopened", label: "Unopened" },
  { key: "opened", label: "Opened" },
  { key: "needs_review", label: "Needs Review" },
  { key: "archived", label: "Archived" },
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

const LIFECYCLE_BADGE: Record<string, { label: string; variant: "jade" | "sand" | "amber" | "accent" }> = {
  unopened: { label: "Unopened", variant: "accent" },
  opened: { label: "Opened", variant: "sand" },
  archived: { label: "Archived", variant: "jade" },
  needs_review: { label: "Needs Review", variant: "amber" },
};

/* ─── Category icons ─── */
const CATEGORY_ICON: Record<string, React.ReactNode> = {
  lab: <FlaskConical className="h-4 w-4" strokeWidth={1.5} />,
  imaging: <ImageIcon className="h-4 w-4" strokeWidth={1.5} />,
  consult: <FileText className="h-4 w-4" strokeWidth={1.5} />,
  referral: <Stethoscope className="h-4 w-4" strokeWidth={1.5} />,
  prior_auth: <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />,
  dme: <ClipboardList className="h-4 w-4" strokeWidth={1.5} />,
  forms: <FileText className="h-4 w-4" strokeWidth={1.5} />,
  records_request: <FileSearch className="h-4 w-4" strokeWidth={1.5} />,
  eob: <Receipt className="h-4 w-4" strokeWidth={1.5} />,
  discharge: <HeartPulse className="h-4 w-4" strokeWidth={1.5} />,
  other: <HelpCircle className="h-4 w-4" strokeWidth={1.5} />,
};

/* ─── Category-specific extraction columns ─── */
interface ExtractionCol {
  key: string;
  header: string;
  getValue: (fax: Fax) => string;
}

const CATEGORY_COLUMNS: Record<string, ExtractionCol[]> = {
  lab: [
    { key: "diagnoses", header: "Diagnoses", getValue: (f) => f.extracted.diagnoses?.join("; ") ?? "—" },
    { key: "icd10", header: "ICD-10", getValue: (f) => f.extracted.icd10?.join(", ") ?? "—" },
    { key: "medications", header: "Medications", getValue: (f) => f.extracted.medications?.join("; ") ?? "—" },
  ],
  imaging: [
    { key: "diagnoses", header: "Findings", getValue: (f) => f.extracted.diagnoses?.join("; ") ?? "—" },
    { key: "recommendations", header: "Recommendations", getValue: (f) => f.extracted.recommendations?.join("; ") ?? "—" },
    { key: "cpt", header: "CPT", getValue: (f) => f.extracted.cpt?.join(", ") ?? "—" },
  ],
  consult: [
    { key: "sendingProvider", header: "Specialist", getValue: (f) => f.extracted.sendingProvider ?? "—" },
    { key: "diagnoses", header: "Diagnoses", getValue: (f) => f.extracted.diagnoses?.join("; ") ?? "—" },
    { key: "recommendations", header: "Plan", getValue: (f) => f.extracted.recommendations?.join("; ") ?? "—" },
  ],
  referral: [
    { key: "sendingProvider", header: "Referring Dr", getValue: (f) => f.extracted.sendingProvider ?? "—" },
    { key: "sendingOrg", header: "Referring Org", getValue: (f) => f.extracted.sendingOrg ?? "—" },
    { key: "diagnoses", header: "Reason", getValue: (f) => f.extracted.diagnoses?.join("; ") ?? "—" },
  ],
  prior_auth: [
    { key: "icd10", header: "ICD-10", getValue: (f) => f.extracted.icd10?.join(", ") ?? "—" },
    { key: "cpt", header: "CPT", getValue: (f) => f.extracted.cpt?.join(", ") ?? "—" },
    { key: "sendingOrg", header: "Payer", getValue: (f) => f.extracted.sendingOrg ?? "—" },
  ],
  dme: [
    { key: "sendingOrg", header: "Supplier", getValue: (f) => f.extracted.sendingOrg ?? "—" },
    { key: "diagnoses", header: "Diagnoses", getValue: (f) => f.extracted.diagnoses?.join("; ") ?? "—" },
    { key: "cpt", header: "CPT / HCPCS", getValue: (f) => f.extracted.cpt?.join(", ") ?? "—" },
  ],
  forms: [
    { key: "sendingOrg", header: "Source", getValue: (f) => f.extracted.sendingOrg ?? "—" },
    { key: "documentDate", header: "Doc Date", getValue: (f) => f.extracted.documentDate ?? "—" },
  ],
  records_request: [
    { key: "sendingProvider", header: "Requesting Dr", getValue: (f) => f.extracted.sendingProvider ?? "—" },
    { key: "sendingOrg", header: "Requesting Org", getValue: (f) => f.extracted.sendingOrg ?? "—" },
  ],
  eob: [
    { key: "sendingOrg", header: "Payer", getValue: (f) => f.extracted.sendingOrg ?? "—" },
    { key: "icd10", header: "ICD-10", getValue: (f) => f.extracted.icd10?.join(", ") ?? "—" },
    { key: "cpt", header: "CPT", getValue: (f) => f.extracted.cpt?.join(", ") ?? "—" },
  ],
  discharge: [
    { key: "sendingOrg", header: "Facility", getValue: (f) => f.extracted.sendingOrg ?? "—" },
    { key: "diagnoses", header: "Discharge Dx", getValue: (f) => f.extracted.diagnoses?.join("; ") ?? "—" },
    { key: "medications", header: "Discharge Meds", getValue: (f) => f.extracted.medications?.join("; ") ?? "—" },
  ],
  other: [
    { key: "sendingOrg", header: "Source", getValue: (f) => f.extracted.sendingOrg ?? "—" },
    { key: "documentDate", header: "Doc Date", getValue: (f) => f.extracted.documentDate ?? "—" },
  ],
};

/* ─── Patient label ─── */
function patientLabel(fax: Fax): { primary: string; secondary: string } {
  if (!fax.matchedPatientId) {
    return { primary: fax.extracted.patientNameOnDoc ?? "Unmatched", secondary: "" };
  }
  const p = patients.find((pt) => pt.id === fax.matchedPatientId);
  if (!p) return { primary: "Unknown", secondary: "" };
  return { primary: `${p.firstName} ${p.lastName}`, secondary: p.mrn };
}

/* ─── Main Component ─── */
interface Props {
  faxes: Fax[];
  category: string;
  label: string;
}

export function CategoryTable({ faxes, category, label }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const extraCols = CATEGORY_COLUMNS[category] ?? [];

  const [statusFilter, setStatusFilter] = useState<Lifecycle>("all");
  const [search, setSearch] = useState("");
  const [showSchema, setShowSchema] = useState(false);

  // Spreadsheet state
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const filtered = useMemo(() => {
    return faxes.filter((f) => {
      const lifecycle = toLifecycle(f.status);
      const statusOK = statusFilter === "all" || lifecycle === statusFilter;
      const q = search.toLowerCase();
      const searchOK = !q ||
        f.fromOrg.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q) ||
        (f.extracted.patientNameOnDoc ?? "").toLowerCase().includes(q);
      return statusOK && searchOK;
    });
  }, [faxes, statusFilter, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: faxes.length, unopened: 0, opened: 0, archived: 0, needs_review: 0 };
    for (const f of faxes) c[toLifecycle(f.status)]++;
    return c;
  }, [faxes]);

  // All column keys for navigation: base + extra
  const totalCols = 5 + extraCols.length; // id, patient, sender, status, received + extras

  const copyCell = useCallback((row: number, col: number) => {
    const fax = filtered[row];
    if (!fax) return;
    let value: string;
    if (col === 0) value = fax.id;
    else if (col === 1) value = patientLabel(fax).primary;
    else if (col === 2) value = fax.fromOrg;
    else if (col === 3) value = LIFECYCLE_BADGE[toLifecycle(fax.status)]?.label ?? fax.status;
    else if (col >= 4 && col < 4 + extraCols.length) value = extraCols[col - 4].getValue(fax);
    else value = formatRelative(fax.receivedAt);
    navigator.clipboard.writeText(value);
    toast("Copied");
    setActiveCell({ row, col });
  }, [filtered, extraCols, toast]);

  const handleCellClick = useCallback((row: number, col: number, e: React.MouseEvent) => {
    e.stopPropagation();
    copyCell(row, col);
  }, [copyCell]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!activeCell) return;
      const { row, col } = activeCell;

      if (e.key === "ArrowDown") {
        setActiveCell({ row: Math.min(row + 1, filtered.length - 1), col });
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        setActiveCell({ row: Math.max(row - 1, 0), col });
        e.preventDefault();
      } else if (e.key === "ArrowRight" || (e.key === "Tab" && !e.shiftKey)) {
        setActiveCell({ row, col: Math.min(col + 1, totalCols - 1) });
        e.preventDefault();
      } else if (e.key === "ArrowLeft" || (e.key === "Tab" && e.shiftKey)) {
        setActiveCell({ row, col: Math.max(col - 1, 0) });
        e.preventDefault();
      } else if (e.key === "Enter") {
        copyCell(row, col);
        setActiveCell({ row: Math.min(row + 1, filtered.length - 1), col });
        e.preventDefault();
      } else if (e.key === "Escape") {
        setActiveCell(null);
        e.preventDefault();
      } else if (e.key === "c" && (e.metaKey || e.ctrlKey)) {
        copyCell(row, col);
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeCell, filtered, totalCols, copyCell]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Link>
          <span className="text-[var(--cevi-accent)]">{CATEGORY_ICON[category]}</span>
          <h1 className="font-serif text-[24px] leading-[1.2] tracking-[-0.02em] text-[var(--cevi-text)]">
            {label}
          </h1>
          <Badge variant={typeBadgeVariant(category)} size="sm">{faxes.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 pr-3 rounded-md border border-[var(--cevi-border)] bg-white text-[13px] text-[var(--cevi-text)] placeholder:text-[var(--cevi-text-muted)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20 w-52"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<Settings2 className="h-3.5 w-3.5" strokeWidth={1.5} />}
            onClick={() => setShowSchema(true)}
          >
            Schema
          </Button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-[var(--cevi-border-light)]">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={cn(
              "px-3 pb-2 text-[12px] font-semibold transition-colors border-b-2 -mb-px",
              statusFilter === tab.key
                ? "border-[var(--cevi-accent)] text-[var(--cevi-text)]"
                : "border-transparent text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)]",
            )}
          >
            {tab.label}
            <span className="ml-1 text-[10px] text-[var(--cevi-text-muted)]">
              {counts[tab.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-[13px] text-[var(--cevi-text-muted)]">
          No {label.toLowerCase()} faxes found
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--cevi-border)]">
          <table ref={tableRef} className="w-full text-left" role="grid">
            <thead>
              <tr className="bg-[var(--cevi-surface-warm)] border-b border-[var(--cevi-border)]">
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] w-24">Document</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] min-w-[130px]">Patient</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] w-36">Sender</th>
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] w-24">Status</th>
                {extraCols.map((ec) => (
                  <th key={ec.key} className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] min-w-[120px]">
                    {ec.header}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] w-24">Received</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((fax, ri) => {
                const pl = patientLabel(fax);
                const lc = toLifecycle(fax.status);
                const b = LIFECYCLE_BADGE[lc];
                return (
                  <tr
                    key={fax.id}
                    className="border-b border-[var(--cevi-border-light)] last:border-b-0 hover:bg-[var(--cevi-surface-warm)] cursor-pointer transition-colors"
                    onClick={() => router.push(`/inbox/${fax.id}`)}
                  >
                    {/* Col 0: Document */}
                    <td
                      className={cn(
                        "px-3 py-2 border-r border-[var(--cevi-border-light)]",
                        activeCell?.row === ri && activeCell?.col === 0 && "ring-2 ring-inset ring-[var(--cevi-accent)]/40 bg-[var(--cevi-accent-light)]/40",
                      )}
                      onClick={(e) => handleCellClick(ri, 0, e)}
                    >
                      <div className="text-[12px] font-mono text-[var(--cevi-text)]">{fax.id}</div>
                      <div className="text-[10px] text-[var(--cevi-text-muted)]">{fax.pages} pg</div>
                    </td>
                    {/* Col 1: Patient */}
                    <td
                      className={cn(
                        "px-3 py-2 border-r border-[var(--cevi-border-light)]",
                        activeCell?.row === ri && activeCell?.col === 1 && "ring-2 ring-inset ring-[var(--cevi-accent)]/40 bg-[var(--cevi-accent-light)]/40",
                      )}
                      onClick={(e) => handleCellClick(ri, 1, e)}
                    >
                      <div className={cn("text-[13px]", fax.matchedPatientId ? "text-[var(--cevi-text)]" : "text-[var(--cevi-text-muted)] italic")}>
                        {pl.primary}
                      </div>
                      {pl.secondary && <div className="text-[10px] text-[var(--cevi-text-muted)] font-mono">{pl.secondary}</div>}
                    </td>
                    {/* Col 2: Sender */}
                    <td
                      className={cn(
                        "px-3 py-2 border-r border-[var(--cevi-border-light)]",
                        activeCell?.row === ri && activeCell?.col === 2 && "ring-2 ring-inset ring-[var(--cevi-accent)]/40 bg-[var(--cevi-accent-light)]/40",
                      )}
                      onClick={(e) => handleCellClick(ri, 2, e)}
                    >
                      <div className="text-[13px] text-[var(--cevi-text)] line-clamp-1">{fax.fromOrg}</div>
                      <div className="text-[10px] text-[var(--cevi-text-muted)] font-mono">{fax.fromNumber}</div>
                    </td>
                    {/* Col 3: Status */}
                    <td
                      className={cn(
                        "px-3 py-2 border-r border-[var(--cevi-border-light)]",
                        activeCell?.row === ri && activeCell?.col === 3 && "ring-2 ring-inset ring-[var(--cevi-accent)]/40 bg-[var(--cevi-accent-light)]/40",
                      )}
                      onClick={(e) => handleCellClick(ri, 3, e)}
                    >
                      <Badge variant={b.variant} size="sm" dot>{b.label}</Badge>
                    </td>
                    {/* Category-specific extra columns */}
                    {extraCols.map((ec, ci) => (
                      <td
                        key={ec.key}
                        className={cn(
                          "px-3 py-2 border-r border-[var(--cevi-border-light)]",
                          activeCell?.row === ri && activeCell?.col === 4 + ci && "ring-2 ring-inset ring-[var(--cevi-accent)]/40 bg-[var(--cevi-accent-light)]/40",
                        )}
                        onClick={(e) => handleCellClick(ri, 4 + ci, e)}
                      >
                        <div className="text-[12px] text-[var(--cevi-text)] line-clamp-2">{ec.getValue(fax)}</div>
                      </td>
                    ))}
                    {/* Last col: Received */}
                    <td
                      className={cn(
                        "px-3 py-2",
                        activeCell?.row === ri && activeCell?.col === 4 + extraCols.length && "ring-2 ring-inset ring-[var(--cevi-accent)]/40 bg-[var(--cevi-accent-light)]/40",
                      )}
                      onClick={(e) => handleCellClick(ri, 4 + extraCols.length, e)}
                    >
                      <div className="text-[12px] text-[var(--cevi-text-secondary)] tabular-nums">
                        {formatRelative(fax.receivedAt)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer hints */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--cevi-text-muted)]">
        <div className="flex items-center gap-3">
          <span><kbd className="px-1 py-0.5 rounded bg-[var(--cevi-surface)] border border-[var(--cevi-border)] text-[9px]">Click</kbd> copy</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[var(--cevi-surface)] border border-[var(--cevi-border)] text-[9px]">↑↓←→</kbd> navigate</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[var(--cevi-surface)] border border-[var(--cevi-border)] text-[9px]">Enter</kbd> copy + next</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[var(--cevi-surface)] border border-[var(--cevi-border)] text-[9px]">Esc</kbd> deselect</span>
        </div>
        <span>{filtered.length} of {faxes.length} faxes</span>
      </div>

      {/* Schema Builder Drawer */}
      {showSchema && (
        <SchemaBuilderDrawer
          category={category}
          label={label}
          onClose={() => setShowSchema(false)}
        />
      )}
    </div>
  );
}
