"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useRef } from "react";
import {
  ArrowLeft,
  Search,
  Settings2,
} from "lucide-react";
import { Badge, typeBadgeVariant } from "@/frontend/components/ui/badge";
import { StateChip } from "@/frontend/components/ui/state-chip";
import { ConfidenceValue } from "@/frontend/components/ui/confidence-value";
import { useToast } from "@/frontend/components/ui/toast";
import { Button } from "@/frontend/components/ui/button";
import { SchemaBuilderDrawer } from "./schema-builder-drawer";
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

/* ─── Column definitions ─── */
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
  lab_result: [
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

/* ─── Main Component ─── */
interface Props {
  faxes: Fax[];
  category: string;
  label: string;
}

export function CategoryTable({ faxes, category, label }: Props) {
  const { toast } = useToast();
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<Lifecycle>("all");
  const [search, setSearch] = useState("");
  const [showSchema, setShowSchema] = useState(false);

  // Status counts
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: faxes.length, unopened: 0, opened: 0, archived: 0, needs_review: 0 };
    for (const f of faxes) c[toLifecycle(f.status)]++;
    return c;
  }, [faxes]);

  // Filtered faxes
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

  const extraCols = CATEGORY_COLUMNS[category] ?? [];
  const headers = ["Document", "Patient", "Sender", "Status", ...extraCols.map((c) => c.header), "Confidence", "Received"];

  const copyCell = (val: string) => {
    if (!val || val === "\u2014") return;
    navigator.clipboard.writeText(val).catch(() => {});
    toast("Copied");
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-3 sm:px-5 py-3 sm:py-3.5 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Link>
          <h1 className="text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--cevi-text)]">
            {label}
          </h1>
          <Badge variant={typeBadgeVariant(category)} size="sm">{faxes.length}</Badge>
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
      <div className="flex items-center gap-0.5 px-3 sm:px-5 border-t border-[var(--cevi-border-light)] border-b border-b-[var(--cevi-border-light)] bg-white overflow-x-auto scrollbar-hide">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={cn(
              "px-3 py-2.5 text-[13px] font-medium border-b-[2px] transition-colors -mb-px",
              statusFilter === tab.key
                ? "text-[var(--cevi-text)] border-b-[var(--cevi-text)]"
                : "text-[var(--cevi-text-muted)] border-b-transparent hover:text-[var(--cevi-text-secondary)]",
            )}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {tab.label}
            <span className="ml-1.5 text-[11px] text-[var(--cevi-text-faint)] tabular-nums">
              {tab.key === "all" ? faxes.length : (counts[tab.key] ?? 0)}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-[var(--cevi-border-light)]">
              {headers.map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-[13px] font-medium text-[var(--cevi-text-muted)] whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((fax) => {
              const lifecycle = toLifecycle(fax.status);
              const isUnopened = lifecycle === "unopened";
              return (
                <tr
                  key={fax.id}
                  onClick={() => router.push(`/inbox/${fax.id}`)}
                  className="border-b border-[var(--cevi-border-light)] hover:bg-[#E5E5E5] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className={cn("text-[14px]", isUnopened ? "font-semibold" : "font-normal")} style={{ fontFamily: "var(--font-mono)" }}>
                      {fax.id.length > 20 ? fax.id.substring(0, 20) + "..." : fax.id}
                    </div>
                    <div className="text-[11px] text-[var(--cevi-text-muted)]">{fax.pages} pg</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn("text-[14px]", isUnopened ? "font-semibold" : "font-normal")}
                      onClick={(e) => { e.stopPropagation(); copyCell(fax.extracted.patientNameOnDoc ?? ""); }}
                    >
                      {fax.extracted.patientNameOnDoc ?? "Unmatched"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[14px] text-[var(--cevi-text-secondary)]"
                    onClick={(e) => { e.stopPropagation(); copyCell(fax.fromOrg); }}
                  >
                    {fax.fromOrg}
                  </td>
                  <td className="px-4 py-3">
                    <StateChip state={lifecycle} />
                  </td>
                  {extraCols.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 text-[13px] text-[var(--cevi-text-secondary)] max-w-[200px] truncate"
                      onClick={(e) => { e.stopPropagation(); copyCell(col.getValue(fax)); }}
                    >
                      {col.getValue(fax)}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <ConfidenceValue value={fax.typeConfidence} variant="dot" />
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[var(--cevi-text-muted)] whitespace-nowrap">
                    {formatRelative(fax.receivedAt)}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={headers.length} className="py-16 text-center text-[14px] text-[var(--cevi-text-muted)]">
                  No {label.toLowerCase()} faxes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-2 flex items-center justify-between text-[11px] text-[var(--cevi-text-faint)]">
        <span>{filtered.length} rows</span>
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
