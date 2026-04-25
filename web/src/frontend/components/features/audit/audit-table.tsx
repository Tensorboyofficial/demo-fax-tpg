"use client";

import { useMemo, useState } from "react";
import { Download, Filter } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Badge } from "@/frontend/components/ui/badge";
import { faxes, buildAuditEvents } from "@/data/seed/faxes";
import { formatDateTime, cn } from "@/shared/utils";
import { modelLabelFromId } from "@/shared/constants";
import type { FaxEvent } from "@/shared/types";

const KIND_LABEL: Record<FaxEvent["kind"], string> = {
  received: "Received",
  ocr: "OCR",
  classified: "Classified",
  matched: "Matched",
  extracted: "Extracted",
  routed: "Routed",
  notified: "Notified",
  written_back: "eCW write-back",
  human_override: "Human",
  flagged: "Flagged",
};

const KIND_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All kinds" },
  { value: "classified", label: "Classified" },
  { value: "matched", label: "Matched" },
  { value: "routed", label: "Routed" },
  { value: "written_back", label: "eCW write-back" },
  { value: "flagged", label: "Flagged" },
];

function toCsv(events: FaxEvent[]): string {
  const header = [
    "timestamp",
    "fax_id",
    "kind",
    "actor",
    "model",
    "latency_ms",
    "tokens_in",
    "tokens_out",
    "detail",
  ].join(",");
  const rows = events.map((e) => {
    const fields = [
      e.at,
      e.faxId,
      e.kind,
      e.actor,
      e.model ?? "",
      e.latencyMs ?? "",
      e.tokensIn ?? "",
      e.tokensOut ?? "",
      `"${e.detail.replaceAll('"', '""')}"`,
    ];
    return fields.join(",");
  });
  return [header, ...rows].join("\n");
}

export function AuditTable() {
  const [kind, setKind] = useState("all");
  const [query, setQuery] = useState("");

  const all = useMemo(() => buildAuditEvents(), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((e) => {
      const kindOK = kind === "all" || e.kind === kind;
      if (!kindOK) return false;
      if (!q) return true;
      const fax = faxes.find((f) => f.id === e.faxId);
      return (
        e.detail.toLowerCase().includes(q) ||
        e.faxId.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        (fax?.fromOrg ?? "").toLowerCase().includes(q)
      );
    });
  }, [all, kind, query]);

  function handleExport() {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cevi-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="h-8 px-2 pr-7 rounded-md border border-[var(--cevi-border)] bg-white text-[12px] text-[var(--cevi-text)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20"
            >
              {KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-64">
            <Input
              placeholder="Search by fax ID, actor, or sender…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="h-3.5 w-3.5" strokeWidth={1.5} />}
            onClick={handleExport}
          >
            Export {filtered.length} rows
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--cevi-border)] bg-white overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-[var(--cevi-surface-warm)] text-left text-[10px] font-semibold text-[var(--cevi-text-tertiary)] uppercase tracking-[0.08em]">
              <th className="px-5 py-3 w-44">Timestamp</th>
              <th className="px-5 py-3 w-40">Fax</th>
              <th className="px-5 py-3 w-32">Kind</th>
              <th className="px-5 py-3 w-28">Actor</th>
              <th className="px-5 py-3">Detail</th>
              <th className="px-5 py-3 w-40 text-right">Signal</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 200).map((e) => (
              <tr
                key={e.id}
                className={cn(
                  "border-b border-[var(--cevi-border-light)] last:border-b-0 hover:bg-[var(--cevi-surface-warm)] transition-colors",
                )}
              >
                <td className="px-5 py-3 text-[12px] text-[var(--cevi-text)] tabular-nums">
                  {formatDateTime(e.at)}
                </td>
                <td className="px-5 py-3 text-[11px] font-mono text-[var(--cevi-text-muted)]">
                  {e.faxId}
                </td>
                <td className="px-5 py-3">
                  <Badge variant="outline" size="sm">
                    {KIND_LABEL[e.kind]}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-[12px] text-[var(--cevi-text-secondary)]">
                  {e.actor}
                </td>
                <td className="px-5 py-3 text-[12px] text-[var(--cevi-text-secondary)]">
                  {e.detail}
                </td>
                <td className="px-5 py-3 text-right text-[11px] text-[var(--cevi-text-muted)]">
                  {e.model && (
                    <span className="font-semibold text-[var(--cevi-text-secondary)]">
                      {modelLabelFromId(e.model)}
                    </span>
                  )}
                  {typeof e.latencyMs === "number" && (
                    <span> · {(e.latencyMs / 1000).toFixed(1)}s</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-[13px] text-[var(--cevi-text-muted)]">
                  No events match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > 200 && (
        <div className="mt-3 text-[11px] text-[var(--cevi-text-muted)]">
          Showing first 200 of {filtered.length} rows. Export to CSV for the full set.
        </div>
      )}
    </div>
  );
}
