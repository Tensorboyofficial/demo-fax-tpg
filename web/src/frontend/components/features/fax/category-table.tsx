"use client";

import Link from "next/link";
import { useMemo, useState, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Search,
  ChevronRight,
  Settings2,
  List,
  Layers,
} from "lucide-react";
import { Badge, typeBadgeVariant } from "@/frontend/components/ui/badge";
import { StateChip } from "@/frontend/components/ui/state-chip";
import { ConfidenceValue } from "@/frontend/components/ui/confidence-value";
import { KeyboardShortcutsBar } from "@/frontend/components/ui/keyboard-shortcuts-bar";
import { FaxThumbnail } from "@/frontend/components/features/fax/fax-thumbnail";
import { FaxModal } from "@/frontend/components/features/fax/fax-modal";
import { HoverPreview } from "@/frontend/components/features/fax/hover-preview";
import { useSpreadsheetSelection } from "@/frontend/hooks/use-spreadsheet-selection";
import { useKeyboardNav } from "@/frontend/hooks/use-keyboard-nav";
import { useToast } from "@/frontend/components/ui/toast";
import { Button } from "@/frontend/components/ui/button";
import { SchemaBuilderDrawer } from "./schema-builder-drawer";
import { LAB_RESULTS, type LabFaxData, type LabPanel, type LabTest } from "@/data/seed/lab-results";
import { formatRelative, cn } from "@/shared/utils";
import type { Fax } from "@/shared/types";

/* ─── Lifecycle ─── */
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

/* ─── Hierarchical row types ─── */
type RowKind = "fax" | "panel" | "test";

interface FlatRow {
  kind: RowKind;
  faxIdx: number;
  panelIdx?: number;
  testIdx?: number;
  lab: LabFaxData;
  panel?: LabPanel;
  test?: LabTest;
  depth: number;
}

/* ─── Column definitions for lab hierarchical view ─── */
const LAB_COL_HEADERS = [
  "Patient ID", "Last Name", "First Name", "MI", "DOB",
  "Provider", "Lab", "Collected", "Panel", "Test",
  "Value", "Unit", "Range", "Flag", "Confidence", "State",
];

function getLabCellValue(row: FlatRow, colIdx: number): string {
  const { kind, lab, panel, test } = row;
  switch (colIdx) {
    case 0: return kind === "fax" ? lab.patientId : "";
    case 1: return kind === "fax" ? lab.lastName : "";
    case 2: return kind === "fax" ? lab.firstName : "";
    case 3: return kind === "fax" ? lab.middleInitial : "";
    case 4: return kind === "fax" ? lab.dob : "";
    case 5: return kind === "fax" ? lab.provider : "";
    case 6: return kind === "fax" ? lab.lab : "";
    case 7: return panel?.collectedDate ?? "";
    case 8: return panel?.name ?? "";
    case 9: return test?.name ?? "";
    case 10: return test?.value ?? "";
    case 11: return test?.unit ?? "";
    case 12: return test?.range ?? "";
    case 13: return test?.flag ?? "";
    case 14: {
      if (kind === "test" && test) return `${Math.round(test.confidence * 100)}%`;
      if (kind === "fax") return `${Math.round(lab.confidence * 100)}%`;
      return "";
    }
    case 15: return kind === "fax" ? lab.state : "";
    default: return "";
  }
}

/* ─── Generic category column definitions ─── */
interface ExtractionCol {
  key: string;
  header: string;
  getValue: (fax: Fax) => string;
}

const CATEGORY_COLUMNS: Record<string, ExtractionCol[]> = {
  lab: [
    { key: "diagnoses", header: "Diagnoses", getValue: (f) => f.extracted.diagnoses?.join("; ") ?? "\u2014" },
    { key: "icd10", header: "ICD-10", getValue: (f) => f.extracted.icd10?.join(", ") ?? "\u2014" },
    { key: "medications", header: "Medications", getValue: (f) => f.extracted.medications?.join("; ") ?? "\u2014" },
  ],
  imaging: [
    { key: "diagnoses", header: "Findings", getValue: (f) => f.extracted.diagnoses?.join("; ") ?? "\u2014" },
    { key: "recommendations", header: "Recommendations", getValue: (f) => f.extracted.recommendations?.join("; ") ?? "\u2014" },
    { key: "cpt", header: "CPT", getValue: (f) => f.extracted.cpt?.join(", ") ?? "\u2014" },
  ],
  consult: [
    { key: "sendingProvider", header: "Specialist", getValue: (f) => f.extracted.sendingProvider ?? "\u2014" },
    { key: "diagnoses", header: "Diagnoses", getValue: (f) => f.extracted.diagnoses?.join("; ") ?? "\u2014" },
    { key: "recommendations", header: "Plan", getValue: (f) => f.extracted.recommendations?.join("; ") ?? "\u2014" },
  ],
  referral: [
    { key: "sendingProvider", header: "Referring Dr", getValue: (f) => f.extracted.sendingProvider ?? "\u2014" },
    { key: "sendingOrg", header: "Referring Org", getValue: (f) => f.extracted.sendingOrg ?? "\u2014" },
    { key: "diagnoses", header: "Reason", getValue: (f) => f.extracted.diagnoses?.join("; ") ?? "\u2014" },
  ],
};

const SHORTCUTS = [
  { keys: ["\u2191\u2193", "\u2190\u2192"], label: "navigate" },
  { keys: ["\u21B5"], label: "copy & down" },
  { keys: ["\u21E5"], label: "copy & right" },
  { keys: ["\u2318C"], label: "copy range" },
  { keys: ["Space"], label: "expand" },
];

const SHORTCUTS_FLAT = SHORTCUTS.filter((s) => s.label !== "expand");

/* ─── Main Component ─── */
interface Props {
  faxes: Fax[];
  category: string;
  label: string;
}

export function CategoryTable({ faxes, category, label }: Props) {
  const { toast } = useToast();
  const gridRef = useRef<HTMLDivElement>(null);
  const isLab = category === "lab" || category === "lab_result";

  const [statusFilter, setStatusFilter] = useState<Lifecycle>("all");
  const [search, setSearch] = useState("");
  const [showSchema, setShowSchema] = useState(false);
  const [grouped, setGrouped] = useState(true);
  const [outlineLevel, setOutlineLevel] = useState(3); // 1=faxes, 2=panels, 3=tests
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Modal & hover
  const [modalFax, setModalFax] = useState<Fax | null>(null);
  const [modalLabFax, setModalLabFax] = useState<LabFaxData | null>(null);
  const [hoverFax, setHoverFax] = useState<Fax | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // Status counts
  const counts = useMemo(() => {
    if (isLab) {
      const c: Record<string, number> = { all: LAB_RESULTS.length, unopened: 0, opened: 0, archived: 0, needs_review: 0 };
      for (const lr of LAB_RESULTS) c[lr.state]++;
      return c;
    }
    const c: Record<string, number> = { all: faxes.length, unopened: 0, opened: 0, archived: 0, needs_review: 0 };
    for (const f of faxes) c[toLifecycle(f.status)]++;
    return c;
  }, [faxes, isLab]);

  // Lab hierarchical rows
  const labFiltered = useMemo(() => {
    if (!isLab) return [];
    return LAB_RESULTS.filter((lr) => {
      const statusOK = statusFilter === "all" || lr.state === statusFilter;
      const q = search.toLowerCase();
      const searchOK = !q ||
        lr.lastName.toLowerCase().includes(q) ||
        lr.firstName.toLowerCase().includes(q) ||
        lr.patientId.toLowerCase().includes(q) ||
        lr.faxId.toLowerCase().includes(q);
      return statusOK && searchOK;
    });
  }, [isLab, statusFilter, search]);

  const labRows = useMemo((): FlatRow[] => {
    if (!isLab) return [];
    if (!grouped) {
      // Flat mode: one row per test
      const rows: FlatRow[] = [];
      for (let fi = 0; fi < labFiltered.length; fi++) {
        const lab = labFiltered[fi];
        for (let pi = 0; pi < lab.panels.length; pi++) {
          const panel = lab.panels[pi];
          for (let ti = 0; ti < panel.tests.length; ti++) {
            rows.push({ kind: "test", faxIdx: fi, panelIdx: pi, testIdx: ti, lab, panel, test: panel.tests[ti], depth: 0 });
          }
        }
      }
      return rows;
    }
    // Grouped mode with outline levels
    const rows: FlatRow[] = [];
    for (let fi = 0; fi < labFiltered.length; fi++) {
      const lab = labFiltered[fi];
      const faxKey = `fax-${fi}`;
      rows.push({ kind: "fax", faxIdx: fi, lab, depth: 0 });

      const faxOpen = expanded.has(faxKey) || outlineLevel >= 2;
      if (!faxOpen) continue;

      for (let pi = 0; pi < lab.panels.length; pi++) {
        const panel = lab.panels[pi];
        const panelKey = `panel-${fi}-${pi}`;
        rows.push({ kind: "panel", faxIdx: fi, panelIdx: pi, lab, panel, depth: 1 });

        const panelOpen = expanded.has(panelKey) || outlineLevel >= 3;
        if (!panelOpen) continue;

        for (let ti = 0; ti < panel.tests.length; ti++) {
          rows.push({ kind: "test", faxIdx: fi, panelIdx: pi, testIdx: ti, lab, panel, test: panel.tests[ti], depth: 2 });
        }
      }
    }
    return rows;
  }, [isLab, labFiltered, grouped, outlineLevel, expanded]);

  const toggleExpand = useCallback((rowIdx: number) => {
    const row = labRows[rowIdx];
    if (!row) return;
    let key: string;
    if (row.kind === "fax") key = `fax-${row.faxIdx}`;
    else if (row.kind === "panel") key = `panel-${row.faxIdx}-${row.panelIdx}`;
    else return;
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, [labRows]);

  // Generic (non-lab) filtered
  const genericFiltered = useMemo(() => {
    if (isLab) return [];
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
  }, [faxes, isLab, statusFilter, search]);

  const extraCols = CATEGORY_COLUMNS[category] ?? [];

  // Generic column definitions
  const genericHeaders = ["Document", "Patient", "Sender", "Status", ...extraCols.map((c) => c.header), "Confidence", "Received"];

  function getGenericCellValue(ri: number, ci: number): string {
    const fax = genericFiltered[ri];
    if (!fax) return "";
    if (ci === 0) return fax.id;
    if (ci === 1) return fax.extracted.patientNameOnDoc ?? "Unmatched";
    if (ci === 2) return fax.fromOrg;
    if (ci === 3) return toLifecycle(fax.status);
    if (ci >= 4 && ci < 4 + extraCols.length) return extraCols[ci - 4].getValue(fax);
    if (ci === 4 + extraCols.length) return fax.typeConfidence != null ? `${Math.round(fax.typeConfidence * 100)}%` : "\u2014";
    if (ci === 4 + extraCols.length + 1) return formatRelative(fax.receivedAt);
    return "";
  }

  // Selection
  const rowCount = isLab ? labRows.length : genericFiltered.length;
  const colCount = isLab ? LAB_COL_HEADERS.length : genericHeaders.length;

  const getCellValue = useCallback(
    (r: number, c: number) => {
      if (isLab) {
        const row = labRows[r];
        return row ? getLabCellValue(row, c) : "";
      }
      return getGenericCellValue(r, c);
    },
    [isLab, labRows, genericFiltered, extraCols],
  );

  const selection = useSpreadsheetSelection({
    rowCount,
    colCount,
    getCellValue,
    onCopy: (text) => toast(text),
  });

  useKeyboardNav({
    wrapperRef: gridRef,
    move: selection.move,
    extendSelection: selection.extendSelection,
    copyCurrent: selection.copyCurrent,
    selectAll: selection.selectAll,
    onEscape: () => { setModalFax(null); setModalLabFax(null); },
    onSpace: grouped && isLab ? () => {
      const r = selection.sel.r;
      toggleExpand(r);
    } : undefined,
  });

  const needsReviewCount = counts.needs_review;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Link>
          <h1 className="font-serif text-[22px] leading-[1.2] tracking-[-0.02em] text-[var(--cevi-text)]">
            {label}
          </h1>
          <Badge variant={typeBadgeVariant(category)} size="sm">{isLab ? labFiltered.length : faxes.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center">
            <Search className="h-[16px] w-[16px] text-[var(--cevi-text-faint)] mr-2 shrink-0" strokeWidth={1.5} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="search-clean border-0 outline-none bg-transparent text-[14px] font-medium text-[var(--cevi-text)] placeholder:text-[var(--cevi-text-faint)] placeholder:font-normal py-0.5 w-44"
            />
          </div>
          {isLab && (
            <div className="flex items-center border border-[var(--cevi-border)] rounded-lg overflow-hidden">
              <button
                onClick={() => setGrouped(true)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                  grouped ? "bg-[var(--cevi-surface)] text-[var(--cevi-text)]" : "text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface-warm)]",
                )}
              >
                <Layers className="h-3 w-3" strokeWidth={1.5} />
                Grouped
              </button>
              <button
                onClick={() => setGrouped(false)}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium transition-colors border-l border-[var(--cevi-border)]",
                  !grouped ? "bg-[var(--cevi-surface)] text-[var(--cevi-text)]" : "text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface-warm)]",
                )}
              >
                <List className="h-3 w-3" strokeWidth={1.5} />
                Flat
              </button>
            </div>
          )}
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

      {/* Keyboard shortcuts */}
      <KeyboardShortcutsBar shortcuts={grouped && isLab ? SHORTCUTS : SHORTCUTS_FLAT} />

      {/* Status tabs */}
      <div className="flex items-center gap-0.5 px-5 border-t border-[var(--cevi-border-light)] border-b border-b-[var(--cevi-border-light)] bg-white">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={cn(
              "px-3 py-2.5 text-[12px] font-medium border-b-[2px] transition-colors -mb-px",
              statusFilter === tab.key
                ? "text-[var(--cevi-text)] border-b-[var(--cevi-text)]"
                : "text-[var(--cevi-text-muted)] border-b-transparent hover:text-[var(--cevi-text-secondary)] hover:border-b-[var(--cevi-border)]",
            )}
          >
            {tab.label}
            {tab.key !== "all" && (
              <span className="ml-1 text-[10px] text-[var(--cevi-text-faint)]">{counts[tab.key] ?? 0}</span>
            )}
            {tab.key === "needs_review" && needsReviewCount > 0 && (
              <span className="ml-1 inline-block px-1.5 py-0.5 text-[11px] font-medium text-[var(--cevi-error)] bg-[var(--cevi-error-light)] rounded-full">
                {needsReviewCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Outline level bar (lab grouped mode only) */}
      {isLab && grouped && (
        <div className="flex items-center gap-2 px-5 py-2 bg-[var(--cevi-surface-warm)] border-b border-[var(--cevi-border-light)] text-[11px]">
          <span className="text-[var(--cevi-text-muted)] font-medium">Outline level</span>
          {[
            { level: 1, label: "Faxes" },
            { level: 2, label: "Panels" },
            { level: 3, label: "Tests" },
          ].map(({ level, label: lbl }) => (
            <button
              key={level}
              onClick={() => { setOutlineLevel(level); setExpanded(new Set()); }}
              className={cn(
                "px-2 py-1 rounded font-medium transition-colors",
                outlineLevel === level
                  ? "bg-[#DBEAFD] text-[var(--sel-border)] border border-[var(--sel-border)]"
                  : "text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface)] border border-transparent",
              )}
            >
              {level} · {lbl}
            </button>
          ))}
          <span className="ml-auto text-[var(--cevi-text-faint)]">
            {labRows.length} rows · {labFiltered.length} faxes
          </span>
        </div>
      )}

      {/* Grid */}
      <div ref={gridRef} tabIndex={0} className="overflow-auto max-h-[640px] outline-none">
        {isLab ? (
          /* ─── Lab hierarchical table ─── */
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                <th className="w-[100px] px-2 py-2 bg-[var(--table-header-bg)] border-r border-b border-[var(--table-border)] sticky top-0 left-0 z-[3] text-[10px] font-medium text-[var(--cevi-text-muted)]">
                  #
                </th>
                {LAB_COL_HEADERS.map((h, ci) => (
                  <th
                    key={h}
                    onClick={() => selection.selectColumn(ci, false)}
                    className={cn(
                      "font-medium text-[10px] text-[var(--cevi-text-muted)] px-2 py-2 bg-[var(--table-header-bg)] border-r border-b border-[var(--table-border)] text-left sticky top-0 z-[2] whitespace-nowrap cursor-pointer select-none transition-colors hover:bg-[var(--cevi-surface-hover)]",
                      selection.isColSelected(ci) && "grid-colhead col-selected",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labRows.map((row, ri) => {
                const isFax = row.kind === "fax";
                const isPanel = row.kind === "panel";
                return (
                  <tr
                    key={`${row.kind}-${row.faxIdx}-${row.panelIdx ?? ""}-${row.testIdx ?? ""}`}
                    className={cn(
                      "group transition-colors",
                      isFax && "font-semibold bg-[var(--cevi-surface-warm)]",
                      isPanel && "bg-white font-medium",
                      selection.isRowSelected(ri) && "!bg-[var(--table-header-bg)]",
                    )}
                  >
                    {/* Row number + thumbnail */}
                    <td
                      className={cn(
                        "border-r border-b border-[var(--table-border)] px-2 py-1.5 sticky left-0 bg-inherit z-[1]",
                        selection.isRowSelected(ri) && "grid-rownum row-selected",
                      )}
                      onClick={() => selection.selectRow(ri, false)}
                    >
                      <div className="flex items-center gap-1.5">
                        {(isFax || isPanel) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleExpand(ri); }}
                            className="p-0.5 rounded hover:bg-[var(--cevi-surface)] transition-colors"
                          >
                            <ChevronRight
                              className={cn(
                                "h-3 w-3 text-[var(--cevi-text-muted)] transition-transform",
                                // Check if expanded
                                (isFax ? (expanded.has(`fax-${row.faxIdx}`) || outlineLevel >= 2) : (expanded.has(`panel-${row.faxIdx}-${row.panelIdx}`) || outlineLevel >= 3)) && "rotate-90",
                              )}
                              strokeWidth={1.5}
                            />
                          </button>
                        )}
                        <span className="text-[10px] text-[var(--cevi-text-faint)] tabular-nums">{ri + 1}</span>
                      </div>
                    </td>
                    {/* Data cells */}
                    {LAB_COL_HEADERS.map((_, ci) => {
                      const val = getLabCellValue(row, ci);
                      return (
                        <td
                          key={ci}
                          className={cn(
                            "border-r border-b border-[var(--table-border)] cursor-cell select-none",
                            selection.cellClasses(ri, ci),
                            !selection.isRowSelected(ri) && "group-hover:bg-[var(--table-header-bg)]",
                          )}
                          style={{ paddingLeft: ci === 8 && isPanel ? 24 : ci === 9 && row.kind === "test" ? 32 : undefined }}
                          onMouseDown={(e) => { selection.onMouseDown(ri, ci, e.shiftKey); gridRef.current?.focus(); }}
                          onMouseEnter={(e) => selection.onMouseEnter(ri, ci, e.buttons)}
                          onClick={() => {
                            if (val) {
                              navigator.clipboard.writeText(val).catch(() => {});
                              toast("Copied: " + (val.length > 38 ? val.substring(0, 38) + "\u2026" : val));
                            }
                          }}
                        >
                          <div className="px-2 py-1.5 min-h-[18px] flex items-center text-[12px]">
                            {ci === 13 && val ? (
                              <span className={`flag-${val}`}>{val}</span>
                            ) : ci === 14 && val ? (
                              <ConfidenceValue value={parseFloat(val) / 100} variant="numeric" />
                            ) : ci === 15 && val ? (
                              <StateChip state={val} />
                            ) : (
                              <span className={cn(
                                "truncate",
                                isFax && ci <= 6 ? "text-[var(--cevi-text)]" : "text-[var(--cevi-text-secondary)]",
                                !val && "text-[var(--cevi-text-faint)]",
                              )}>
                                {val || "\u00A0"}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {labRows.length === 0 && (
                <tr>
                  <td colSpan={LAB_COL_HEADERS.length + 1} className="py-16 text-center text-[12px] text-[var(--cevi-text-faint)]">
                    No lab results match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          /* ─── Generic category table ─── */
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr>
                <th className="w-[50px] px-2 py-2 bg-[var(--table-header-bg)] border-r border-b border-[var(--table-border)] sticky top-0 z-[2] text-[10px] font-medium text-[var(--cevi-text-muted)]">
                  #
                </th>
                <th className="w-[50px] px-2 py-2 bg-[var(--table-header-bg)] border-r border-b border-[var(--table-border)] sticky top-0 z-[2]" />
                {genericHeaders.map((h, ci) => (
                  <th
                    key={h}
                    onClick={() => selection.selectColumn(ci, false)}
                    className={cn(
                      "font-medium text-[10px] text-[var(--cevi-text-muted)] px-3 py-2 bg-[var(--table-header-bg)] border-r border-b border-[var(--table-border)] text-left sticky top-0 z-[2] whitespace-nowrap cursor-pointer select-none transition-colors hover:bg-[var(--cevi-surface-hover)]",
                      selection.isColSelected(ci) && "grid-colhead col-selected",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {genericFiltered.map((fax, ri) => (
                <tr
                  key={fax.id}
                  className={cn(
                    "group transition-colors",
                    toLifecycle(fax.status) === "unopened" && "font-semibold",
                    selection.isRowSelected(ri) && "bg-[var(--table-header-bg)]",
                  )}
                >
                  <td
                    className={cn(
                      "border-r border-b border-[var(--table-border)] px-2 py-2.5 text-[10px] text-[var(--cevi-text-faint)] tabular-nums text-center",
                      selection.isRowSelected(ri) && "grid-rownum row-selected",
                    )}
                    onClick={() => selection.selectRow(ri, false)}
                  >
                    {ri + 1}
                  </td>
                  <td className="border-r border-b border-[var(--table-border)] px-1 py-1">
                    <FaxThumbnail
                      fax={fax}
                      onClick={() => setModalFax(fax)}
                      onMouseEnter={(e) => { setHoverFax(fax); setHoverPos({ x: e.clientX, y: e.clientY }); }}
                      onMouseLeave={() => { setHoverFax(null); setHoverPos(null); }}
                    />
                  </td>
                  {genericHeaders.map((_, ci) => {
                    const val = getGenericCellValue(ri, ci);
                    return (
                      <td
                        key={ci}
                        className={cn(
                          "border-r border-b border-[var(--table-border)] cursor-cell select-none",
                          selection.cellClasses(ri, ci),
                          !selection.isRowSelected(ri) && "group-hover:bg-[var(--table-header-bg)]",
                        )}
                        onMouseDown={(e) => { selection.onMouseDown(ri, ci, e.shiftKey); gridRef.current?.focus(); }}
                        onMouseEnter={(e) => selection.onMouseEnter(ri, ci, e.buttons)}
                        onClick={() => {
                          if (val) {
                            navigator.clipboard.writeText(val).catch(() => {});
                            toast("Copied: " + (val.length > 38 ? val.substring(0, 38) + "\u2026" : val));
                          }
                        }}
                      >
                        <div className="px-3 py-2.5 min-h-[18px] flex items-center">
                          {ci === 3 ? (
                            <StateChip state={val} />
                          ) : ci === 4 + extraCols.length ? (
                            <ConfidenceValue value={fax.typeConfidence} variant="dot" />
                          ) : (
                            <span className="text-[12px] text-[var(--cevi-text)] truncate">{val}</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {genericFiltered.length === 0 && (
                <tr>
                  <td colSpan={genericHeaders.length + 2} className="py-16 text-center text-[12px] text-[var(--cevi-text-faint)]">
                    No {label.toLowerCase()} faxes match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2 flex items-center justify-between text-[10px] text-[var(--cevi-text-faint)]">
        <span>
          {selection.selectedCellCount > 1
            ? `${selection.selectedCellCount} cells selected`
            : `${rowCount} rows`}
        </span>
        <span>{isLab ? `${labFiltered.length} faxes` : `${genericFiltered.length} of ${faxes.length} faxes`}</span>
      </div>

      {/* Hover preview + Modal */}
      <HoverPreview fax={hoverFax} position={hoverPos} />
      {modalFax && <FaxModal fax={modalFax} onClose={() => setModalFax(null)} />}

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
