"use client";

import { useState, useCallback, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  FileText,
  Printer as FaxIcon,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Plus,
  Download,
  Layers,
} from "lucide-react";
import { Badge, statusBadgeVariant, typeBadgeVariant, urgencyBadgeVariant } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { StateChip } from "@/frontend/components/ui/state-chip";
import { useToast } from "@/frontend/components/ui/toast";
import { ConfidenceMeter } from "@/frontend/components/composed/confidence-meter";
import { formatDateTime, formatDate, cn } from "@/shared/utils";
import { FAX_TYPE_LABELS, MODEL_LABELS, modelLabelFromId, type ModelTier } from "@/shared/constants";
import type { Fax, FaxEvent, ExtractedFields, Urgency } from "@/shared/types";
import { useIsDesktop, useMediaQuery } from "@/frontend/hooks/use-media-query";

/* ─── API call ─── */
interface ClassifyResult {
  ok: true;
  type: string;
  typeConfidence: number;
  urgency: string;
  extracted: ExtractedFields;
  aiSummary: string;
  model: string;
  modelLabel: string;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
  cachedInputTokens?: number;
}
interface ClassifyError { ok: false; error: string; }

async function classifyViaApi(faxId: string, tier: string): Promise<ClassifyResult | ClassifyError> {
  const res = await fetch(`/api/v1/fax/${faxId}/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier }),
  });
  return res.json();
}

const TYPE_LABELS: Record<string, string> = {
  ...FAX_TYPE_LABELS,
  lab_result: "Lab Result",
  specialist_consult: "Consult Note",
  imaging_report: "Imaging Report",
  rx_refill: "Rx Refill",
  records_request: "Records Request",
  unknown: "Other",
};

function toLifecycle(status: string): string {
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

/* ─── Field definitions ─── */
interface FieldDef {
  key: string;
  label: string;
  getValue: (fax: Fax, fields: ExtractedFields) => string;
}

const META_FIELDS: FieldDef[] = [
  { key: "id", label: "Fax ID", getValue: (f) => f.id },
  { key: "received", label: "Received", getValue: (f) => formatDateTime(f.receivedAt) },
  { key: "pages", label: "Pages", getValue: (f) => String(f.pages) },
  { key: "from", label: "From", getValue: (f) => `${f.fromOrg} · ${f.fromNumber}` },
  { key: "to", label: "To", getValue: (f) => `${f.toClinic} · ${f.faxNumberTo}` },
];

const EXTRACTION_FIELDS: FieldDef[] = [
  { key: "patientName", label: "Patient name", getValue: (_, e) => e.patientNameOnDoc ?? "—" },
  { key: "patientDob", label: "Patient DOB", getValue: (_, e) => e.patientDobOnDoc ?? "—" },
  { key: "patientMrn", label: "Patient MRN", getValue: (_, e) => e.patientMrnOnDoc ?? "—" },
  { key: "sendingProvider", label: "Sending provider", getValue: (_, e) => e.sendingProvider ?? "—" },
  { key: "sendingOrg", label: "Sending org", getValue: (_, e) => e.sendingOrg ?? "—" },
  { key: "documentDate", label: "Document date", getValue: (_, e) => e.documentDate ?? "—" },
  { key: "diagnoses", label: "Diagnoses", getValue: (_, e) => e.diagnoses?.join("; ") ?? "—" },
  { key: "medications", label: "Medications", getValue: (_, e) => e.medications?.join("; ") ?? "—" },
  { key: "recommendations", label: "Recommendations", getValue: (_, e) => e.recommendations?.join("; ") ?? "—" },
  { key: "icd10", label: "ICD-10", getValue: (_, e) => e.icd10?.join(", ") ?? "—" },
  { key: "cpt", label: "CPT", getValue: (_, e) => e.cpt?.join(", ") ?? "—" },
];

/* ─── Main Component ─── */
interface Props {
  fax: Fax;
  initialEvents: FaxEvent[];
}

const TIER_BY_MODEL_ID: Record<string, ModelTier> = {
  "claude-haiku-4-5-20251001": "fast",
  "claude-sonnet-4-6": "smart",
  "claude-opus-4-7": "premium",
};

export function DetailShell({ fax, initialEvents }: Props) {
  const { toast } = useToast();
  const initialTier: ModelTier = TIER_BY_MODEL_ID[fax.modelUsed ?? ""] ?? "smart";

  const [type, setType] = useState(fax.type);
  const [confidence, setConfidence] = useState(fax.typeConfidence);
  const [urgency, setUrgency] = useState(fax.urgency);
  const [fields, setFields] = useState(fax.extracted);
  const [aiSummary, setAiSummary] = useState<string | undefined>(fax.extracted.summary);
  const [tier, setTier] = useState<ModelTier>(initialTier);
  const [modelLabel, setModelLabel] = useState(MODEL_LABELS[initialTier]);
  const [latencyMs, setLatencyMs] = useState<number | undefined>();
  const [tokensIn, setTokensIn] = useState<number | undefined>();
  const [tokensOut, setTokensOut] = useState<number | undefined>();
  const [cacheRead, setCacheRead] = useState<number | undefined>();
  const [events, setEvents] = useState<FaxEvent[]>(initialEvents);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Spreadsheet state
  const [activeRow, setActiveRow] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  // Section collapse state (Schema Extracted tab)
  const [extractionOpen, setExtractionOpen] = useState(true);
  const [metaOpen, setMetaOpen] = useState(true);
  const [matchOpen, setMatchOpen] = useState(true);
  const [auditOpen, setAuditOpen] = useState(false);

  // Figma tabs: Schema Extracted vs Full Extraction
  const [activeTab, setActiveTab] = useState<"schema" | "full">("schema");
  // Format toggle: Formatted vs JSON
  const [formatMode, setFormatMode] = useState<"formatted" | "json">("formatted");

  // Structured extraction from Pass 2
  const structuredExtraction = fields.structuredExtraction as Record<string, unknown> | undefined;

  // Document viewer state
  const [zoom, setZoom] = useState(100);
  const [activePage, setActivePage] = useState(0);
  const [showThumbs, setShowThumbs] = useState(true);
  const isDesktop = useIsDesktop();
  const isSplitView = useMediaQuery("(min-width: 1024px)");

  const allFields = [...META_FIELDS, ...EXTRACTION_FIELDS];

  const copyValue = useCallback((value: string) => {
    if (value === "—") return;
    navigator.clipboard.writeText(value);
    toast("Copied");
  }, [toast]);

  const handleClick = useCallback((key: string, value: string) => {
    setActiveRow(key);
    copyValue(value);
  }, [copyValue]);

  const handleDoubleClick = useCallback((key: string, value: string) => {
    setEditingRow(key);
    setEditValue(value === "—" ? "" : value);
    setTimeout(() => editRef.current?.focus(), 0);
  }, []);

  const commitEdit = useCallback(() => { setEditingRow(null); }, []);
  const cancelEdit = useCallback(() => { setEditingRow(null); setEditValue(""); }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (editingRow) {
        if (e.key === "Escape") { cancelEdit(); e.preventDefault(); }
        if (e.key === "Enter") { commitEdit(); e.preventDefault(); }
        return;
      }
      if (!activeRow) return;
      const idx = allFields.findIndex((f) => f.key === activeRow);
      if (idx === -1) return;

      if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
        e.preventDefault();
        setActiveRow(allFields[Math.min(idx + 1, allFields.length - 1)].key);
      }
      if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
        e.preventDefault();
        setActiveRow(allFields[Math.max(idx - 1, 0)].key);
      }
      if (e.key === "Enter") {
        copyValue(allFields[idx].getValue(fax, fields));
        setActiveRow(allFields[Math.min(idx + 1, allFields.length - 1)].key);
        e.preventDefault();
      }
      if (e.key === "Escape") { setActiveRow(null); e.preventDefault(); }
      if (e.key === "c" && (e.metaKey || e.ctrlKey)) {
        copyValue(allFields[idx].getValue(fax, fields));
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeRow, editingRow, allFields, fax, fields, copyValue, cancelEdit, commitEdit]);

  function handleReclassify(nextTier: ModelTier) {
    setError(null);
    setTier(nextTier);
    startTransition(async () => {
      const res = await classifyViaApi(fax.id, nextTier);
      if (!res.ok) { setError(res.error); return; }
      setType(res.type);
      setConfidence(res.typeConfidence);
      setUrgency(res.urgency as Urgency);
      setFields(res.extracted);
      setAiSummary(res.aiSummary);
      setModelLabel(res.modelLabel);
      setLatencyMs(res.latencyMs);
      setTokensIn(res.tokensIn);
      setTokensOut(res.tokensOut);
      setCacheRead(res.cachedInputTokens);
      const now = new Date().toISOString();
      setEvents((prev) => [...prev, {
        id: `${fax.id}:live-${Date.now()}`,
        faxId: fax.id,
        at: now,
        kind: "classified",
        actor: "claude",
        detail: `Re-classified live · ${res.modelLabel}`,
        model: res.model,
        latencyMs: res.latencyMs,
        tokensIn: res.tokensIn,
        tokensOut: res.tokensOut,
      }]);
    });
  }

  const hasMatch = fax.matchedPatientId != null;

  const sortedEvents = [...events].sort((a, b) => (a.at < b.at ? -1 : 1));

  // Simulate multi-page content from OCR text
  const ocrPages = splitToPages(fax.ocrText, fax.pages);

  return (
    <div
      className="flex flex-col h-screen"
    >
      {/* ── Top action bar ── */}
      <div className="shrink-0 flex items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 h-12 bg-white border-b border-[var(--cevi-border)]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/"
            className="inline-flex items-center text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)] transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </Link>
          <h1 className="text-[15px] font-semibold text-[var(--cevi-text)] truncate" style={{ fontFamily: "var(--font-mono)" }}>
            {fax.id.replace("FAX-20260423-", "FAX-")}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={typeBadgeVariant(type)} size="sm">
            {TYPE_LABELS[type] ?? type}
          </Badge>
          <StateChip state={fax.typeConfidence != null && fax.typeConfidence < 0.7 ? "needs_review" : toLifecycle(fax.status)} />
        </div>
      </div>

      {error && (
        <div className="shrink-0 mx-4 mt-2 rounded-md border border-[var(--cevi-accent)]/20 bg-[var(--cevi-accent-light)] p-2.5 text-[12px] text-[var(--cevi-accent)]">
          Classification failed: {error}
        </div>
      )}

      {/* ── Split view ── */}
      <div
        className="flex-1 min-h-0"
        style={{
          display: "flex",
          flexDirection: isSplitView ? "row" : "column",
          overflow: isSplitView ? "hidden" : "auto",
        }}
      >
        {/* ─── LEFT: Document viewer (Reducto-style) ─── */}
        <div
          className="flex flex-col"
          style={{
            backgroundColor: "#F5F5F5",
            backgroundImage: "radial-gradient(circle, #D4D4D4 0.5px, transparent 0.5px)",
            backgroundSize: "12px 12px",
            flex: isSplitView ? "1 1 0%" : "none",
            minWidth: 0,
            overflow: isSplitView ? "hidden" : "visible",
            borderRight: isSplitView ? "1px solid var(--cevi-border)" : "none",
            borderBottom: isSplitView ? "none" : "1px solid var(--cevi-border)",
          }}
        >
          {/* Main document area — scrollable */}
          <div className="flex-1 p-4 sm:p-8 overflow-y-auto flex items-start justify-center">
            <div
              className="bg-white rounded-lg shadow-md overflow-hidden transition-all"
              style={{ width: `${Math.round(612 * zoom / 100)}px`, maxWidth: "100%" }}
            >
              {fax.fileUrl ? (
                fax.fileUrl.includes(".pdf") ? (
                  <iframe
                    src={fax.fileUrl}
                    className="w-full bg-white"
                    style={{ height: `${Math.round(792 * zoom / 100)}px` }}
                    title="Fax document"
                  />
                ) : (
                  <img
                    src={fax.fileUrl}
                    alt="Fax document"
                    className="w-full bg-white"
                  />
                )
              ) : (
                /* Fallback: render active page as fax paper */
                <div className="fax-paper p-8 relative">
                  {activePage === 0 && (
                    <div className="absolute top-6 right-6 rotate-[8deg] border-[3px] border-[var(--cevi-accent)] text-[var(--cevi-accent)] px-3 py-1 font-bold text-[11px] tracking-[0.15em] opacity-50 select-none pointer-events-none">
                      RECEIVED
                      <div className="text-[7px] tracking-[0.1em] font-semibold text-center mt-0.5">
                        {formatDate(fax.receivedAt)}
                      </div>
                    </div>
                  )}
                  <div className="pb-2 mb-4 text-[9px] text-[#888] font-sans tracking-[0.05em] flex items-center justify-between border-b border-dashed border-[rgba(0,0,0,0.15)]">
                    <span>RECEIVED AT {fax.faxNumberTo}</span>
                    <span>Page {activePage + 1} of {fax.pages}</span>
                  </div>
                  <div
                    className="font-mono text-[11px] leading-[1.65] text-[#2a2722] whitespace-pre-wrap"
                    style={{ fontSize: `${Math.round(11 * zoom / 100)}px` }}
                  >
                    {ocrPages[activePage]}
                  </div>
                  <div className="mt-6 pt-2 border-t border-dashed border-[rgba(0,0,0,0.15)] text-[9px] text-[#888] font-sans flex items-center justify-between">
                    <span>— page {activePage + 1} —</span>
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-2.5 w-2.5" strokeWidth={1.5} />
                      {fax.fromNumber}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom thumbnails strip */}
          {showThumbs && ocrPages.length > 1 && (
            <div className="shrink-0 flex items-center justify-center gap-2 px-4 py-3 bg-white/60 border-t border-[var(--cevi-border-light)]">
              <button
                onClick={() => setActivePage(Math.max(0, activePage - 1))}
                disabled={activePage === 0}
                className="p-1 rounded hover:bg-[var(--cevi-surface)] transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
              </button>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {ocrPages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePage(i)}
                    className={cn(
                      "w-[52px] h-[68px] rounded border bg-white shadow-sm flex-shrink-0 transition-all relative overflow-hidden",
                      activePage === i
                        ? "border-[var(--sel-border)] ring-2 ring-[var(--sel-border)]/20"
                        : "border-[var(--cevi-border)] hover:border-[var(--cevi-text-muted)]",
                    )}
                  >
                    <div className="absolute inset-1.5">
                      <div className="h-0.5 w-6 bg-[#E5E5E5] rounded-full mb-0.5" />
                      <div className="h-0.5 w-8 bg-[#EFEFEF] rounded-full mb-0.5" />
                      <div className="h-0.5 w-5 bg-[#EFEFEF] rounded-full mb-0.5" />
                      <div className="h-0.5 w-7 bg-[#EFEFEF] rounded-full" />
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setActivePage(Math.min(ocrPages.length - 1, activePage + 1))}
                disabled={activePage === ocrPages.length - 1}
                className="p-1 rounded hover:bg-[var(--cevi-surface)] transition-colors disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
              </button>
            </div>
          )}

          {/* Bottom control bar */}
          <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-white border-t border-[var(--cevi-border-light)]">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowThumbs(!showThumbs)}
                className={cn(
                  "p-1.5 rounded-md border transition-colors",
                  showThumbs
                    ? "bg-[var(--cevi-surface)] border-[var(--cevi-border)] text-[var(--cevi-text)]"
                    : "border-transparent text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface)]",
                )}
                title="Toggle page thumbnails"
              >
                <Layers className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button
                className="p-1.5 rounded-md border border-transparent text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface)] transition-colors"
                title="Download"
              >
                <Download className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[var(--cevi-border)] text-[12px] font-medium text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface)] transition-colors">
                <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                Add file
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="p-1 rounded hover:bg-[var(--cevi-surface)] transition-colors"
              >
                <ZoomOut className="h-4 w-4 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
              </button>
              <span className="text-[12px] text-[var(--cevi-text-muted)] tabular-nums w-10 text-center font-medium">
                {zoom}%
              </span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="p-1 rounded hover:bg-[var(--cevi-surface)] transition-colors"
              >
                <ZoomIn className="h-4 w-4 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
              </button>
              <div className="ml-2 flex items-center gap-0.5 border border-[var(--cevi-border)] rounded-md px-2 py-1">
                <input
                  type="text"
                  value={activePage + 1}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!isNaN(n) && n >= 1 && n <= ocrPages.length) setActivePage(n - 1);
                  }}
                  className="w-5 text-center text-[12px] font-medium text-[var(--cevi-text)] bg-transparent outline-none tabular-nums"
                />
                <span className="text-[12px] text-[var(--cevi-text-muted)] tabular-nums">/ {ocrPages.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Extraction panel ─── */}
        <div
          className="flex flex-col bg-white"
          style={{
            width: isSplitView ? 480 : "100%",
            flexShrink: 0,
            flex: isSplitView ? "none" : "none",
            minWidth: 0,
            overflow: isSplitView ? "hidden" : "visible",
          }}
        >
          {/* Tabs: Schema Extracted / Full Extraction */}
          <div className="shrink-0 flex items-center justify-between px-5 border-b border-[var(--cevi-border)]">
            <div className="flex items-center gap-0">
              <button
                onClick={() => setActiveTab("schema")}
                className={cn(
                  "px-3 py-3 text-[14px] font-medium border-b-2 transition-colors -mb-px",
                  activeTab === "schema"
                    ? "text-[var(--cevi-text)] border-b-[var(--cevi-text)]"
                    : "text-[var(--cevi-text-muted)] border-b-transparent hover:text-[var(--cevi-text-secondary)]",
                )}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Schema Extracted
              </button>
              <button
                onClick={() => setActiveTab("full")}
                className={cn(
                  "px-3 py-3 text-[14px] font-medium border-b-2 transition-colors -mb-px",
                  activeTab === "full"
                    ? "text-[var(--cevi-text)] border-b-[var(--cevi-text)]"
                    : "text-[var(--cevi-text-muted)] border-b-transparent hover:text-[var(--cevi-text-secondary)]",
                )}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Full Extraction
              </button>
            </div>
            {/* Formatted / JSON dropdown */}
            <select
              value={formatMode}
              onChange={(e) => setFormatMode(e.target.value as "formatted" | "json")}
              className="text-[13px] font-medium text-[var(--cevi-text)] bg-white border border-[var(--cevi-border)] rounded-md px-2 py-1 cursor-pointer"
            >
              <option value="formatted">Formatted</option>
              <option value="json">JSON</option>
            </select>
          </div>

          {/* Category + Confidence + Actions */}
          <div className="shrink-0 px-5 py-3 flex items-center justify-between border-b border-[var(--cevi-border-light)]">
            <div className="flex items-center gap-4 text-[14px]">
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--cevi-text-muted)]">Category:</span>
                <span className="font-semibold text-[var(--cevi-text)]">{TYPE_LABELS[type] ?? type}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--cevi-text-muted)]">Confidence:</span>
                <ConfidenceMeter value={confidence} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => {}} icon={<CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />}>
                Mark Processed
              </Button>
              <Button variant="outline" size="sm" onClick={() => {}}>
                Push to EHR
              </Button>
            </div>
          </div>

          {/* AI summary — shown in both tabs */}
          {aiSummary && (
            <div className="shrink-0 mx-4 mt-3 p-3 rounded-lg bg-[var(--cevi-accent-light)] border border-[var(--cevi-accent)]/15">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3 w-3 text-[var(--cevi-accent)]" strokeWidth={1.5} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-accent)]">AI Summary</span>
                {modelLabel && <span className="text-[10px] text-[var(--cevi-text-muted)]">· {modelLabel}</span>}
              </div>
              <div className="text-[12px] text-[var(--cevi-text)] leading-snug">{aiSummary}</div>
            </div>
          )}

          {/* Scrollable content area */}
          <div className="flex-1 px-4 py-3 space-y-1 scrollbar-thin" style={{ overflowY: isSplitView ? "auto" : "visible" }}>

            {/* ── Schema Extracted tab ── */}
            {activeTab === "schema" && (
              <>
                {formatMode === "json" ? (
                  /* JSON view of extraction fields */
                  <div className="border border-[var(--cevi-border)] rounded-lg overflow-hidden mb-3">
                    <div className="flex items-center justify-between px-3 py-2 bg-[var(--cevi-surface-warm)] border-b border-[var(--cevi-border-light)]">
                      <span className="text-[11px] font-semibold text-[var(--cevi-text-tertiary)] uppercase tracking-[0.06em]">Extracted Fields JSON</span>
                      <span
                        role="button"
                        onClick={() => { navigator.clipboard.writeText(JSON.stringify(fields, null, 2)); toast("Copied JSON"); }}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--cevi-accent)] hover:underline cursor-pointer"
                      >
                        <Copy className="h-3 w-3" strokeWidth={1.5} />
                        Copy
                      </span>
                    </div>
                    <pre className="p-3 text-[11px] leading-relaxed font-mono text-[var(--cevi-text)] overflow-x-auto">
                      {JSON.stringify(fields, null, 2)}
                    </pre>
                  </div>
                ) : (
                  /* Formatted table view */
                  <>
                    <SectionHeader
                      title="Extracted fields"
                      count={EXTRACTION_FIELDS.length}
                      open={extractionOpen}
                      onToggle={() => setExtractionOpen(!extractionOpen)}
                    />
                    {extractionOpen && (
                      <div className="border border-[var(--cevi-border)] rounded-lg mb-3 overflow-hidden">
                        <div className="grid grid-cols-[130px_1fr] text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--cevi-text-muted)] bg-[var(--cevi-surface-warm)] border-b border-[var(--cevi-border-light)]">
                          <div className="px-3 py-1.5 border-r border-[var(--cevi-border-light)]">Field</div>
                          <div className="px-3 py-1.5">Value</div>
                        </div>
                        {EXTRACTION_FIELDS.map((f) => {
                          const val = f.getValue(fax, fields);
                          return (
                            <FieldRow
                              key={f.key}
                              fieldKey={f.key}
                              label={f.label}
                              value={val}
                              isActive={activeRow === f.key}
                              isEditing={editingRow === f.key}
                              editValue={editValue}
                              editRef={editRef}
                              onEditChange={setEditValue}
                              onClick={() => handleClick(f.key, val)}
                              onDoubleClick={() => handleDoubleClick(f.key, val)}
                              onCommit={commitEdit}
                              onCancel={cancelEdit}
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Fax Metadata */}
                    <SectionHeader
                      title="Fax metadata"
                      count={META_FIELDS.length}
                      open={metaOpen}
                      onToggle={() => setMetaOpen(!metaOpen)}
                    />
                    {metaOpen && (
                      <div className="border border-[var(--cevi-border)] rounded-lg mb-3 overflow-hidden">
                        {META_FIELDS.map((f) => {
                          const val = f.getValue(fax, fields);
                          return (
                            <FieldRow
                              key={f.key}
                              fieldKey={f.key}
                              label={f.label}
                              value={val}
                              isActive={activeRow === f.key}
                              isEditing={editingRow === f.key}
                              editValue={editValue}
                              editRef={editRef}
                              onEditChange={setEditValue}
                              onClick={() => handleClick(f.key, val)}
                              onDoubleClick={() => handleDoubleClick(f.key, val)}
                              onCommit={commitEdit}
                              onCancel={cancelEdit}
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Patient Match */}
                    <SectionHeader
                      title="Patient match"
                      count={fax.candidates.length}
                      open={matchOpen}
                      onToggle={() => setMatchOpen(!matchOpen)}
                      badge={hasMatch
                        ? <Badge variant="success" size="sm" dot>Matched</Badge>
                        : fax.candidates.length > 0
                          ? <Badge variant="amber" size="sm" dot>Review</Badge>
                          : <Badge variant="outline" size="sm">No match</Badge>
                      }
                    />
                    {matchOpen && (
                      <div className="border border-[var(--cevi-border)] rounded-lg mb-3 overflow-hidden">
                        {fax.candidates.length === 0 ? (
                          <div className="p-4 text-center text-[12px] text-[var(--cevi-text-muted)]">
                            No patient candidates found
                          </div>
                        ) : (
                          fax.candidates.map((c) => {
                            const isMatched = fax.matchedPatientId === c.patientId;
                            return (
                              <div
                                key={c.patientId}
                                className={cn(
                                  "flex items-center justify-between px-3 py-2.5 border-b border-[var(--cevi-border-light)] last:border-b-0 text-[12px]",
                                  isMatched && "bg-[var(--cevi-jade-light)]/30",
                                )}
                              >
                                <div className="min-w-0">
                                  <div className="font-semibold text-[var(--cevi-text)] truncate">
                                    {c.patientId}
                                    {isMatched && <span className="ml-1.5 text-[var(--cevi-jade)] text-[10px] font-bold">MATCHED</span>}
                                  </div>
                                  <div className="text-[11px] text-[var(--cevi-text-muted)] font-mono">
                                    {c.reason}
                                  </div>
                                </div>
                                <ConfidenceMeter value={c.score} />
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Audit Trail */}
                    <SectionHeader title="Audit trail" count={sortedEvents.length} open={auditOpen} onToggle={() => setAuditOpen(!auditOpen)} />
                    {auditOpen && (
                      <div className="border border-[var(--cevi-border)] rounded-lg mb-3 overflow-hidden">
                        {sortedEvents.map((e) => (
                          <div key={e.id} className="flex items-start gap-3 px-3 py-2 border-b border-[var(--cevi-border-light)] last:border-b-0 text-[12px]">
                            <div className="shrink-0 mt-0.5">
                              <span className="inline-block w-2 h-2 rounded-full bg-[var(--cevi-text-muted)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="font-semibold text-[var(--cevi-text)] uppercase tracking-[0.04em] text-[11px]">{e.kind}</span>
                                <span className="text-[10px] text-[var(--cevi-text-muted)] tabular-nums shrink-0">{formatDateTime(e.at)}</span>
                              </div>
                              <div className="text-[var(--cevi-text-secondary)] mt-0.5">{e.detail}</div>
                              {e.model && (
                                <div className="text-[10px] text-[var(--cevi-text-muted)] mt-0.5">
                                  {modelLabelFromId(e.model)}
                                  {typeof e.latencyMs === "number" && ` · ${(e.latencyMs / 1000).toFixed(1)}s`}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── Full Extraction tab ── */}
            {activeTab === "full" && (
              <>
                {formatMode === "json" ? (
                  /* Raw JSON of structured extraction */
                  <div className="border border-[var(--cevi-border)] rounded-lg overflow-hidden mb-3">
                    <div className="flex items-center justify-between px-3 py-2 bg-[var(--cevi-surface-warm)] border-b border-[var(--cevi-border-light)]">
                      <span className="text-[11px] font-semibold text-[var(--cevi-text-tertiary)] uppercase tracking-[0.06em]">Full Extraction JSON</span>
                      <span
                        role="button"
                        onClick={() => {
                          const data = structuredExtraction ?? fields;
                          navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                          toast("Copied JSON");
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--cevi-accent)] hover:underline cursor-pointer"
                      >
                        <Copy className="h-3 w-3" strokeWidth={1.5} />
                        Copy
                      </span>
                    </div>
                    <pre className="p-3 text-[11px] leading-relaxed font-mono text-[var(--cevi-text)] overflow-x-auto">
                      {JSON.stringify(structuredExtraction ?? fields, null, 2)}
                    </pre>
                  </div>
                ) : (
                  /* Formatted structured extraction sections */
                  structuredExtraction ? (
                    <div className="space-y-1.5 mb-3">
                      {Object.entries(structuredExtraction)
                        .filter(([k]) => !["extraction_meta", "$schema", "$id"].includes(k))
                        .map(([key, val]) => (
                          <SchemaSection key={key} sectionKey={key} data={val} onCopy={copyValue} />
                        ))
                      }
                    </div>
                  ) : (
                    <div className="p-6 text-center text-[13px] text-[var(--cevi-text-muted)]">
                      No structured extraction available for this fax.
                    </div>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

/** Split OCR text into simulated pages */
function splitToPages(text: string, pageCount: number): string[] {
  if (pageCount <= 1) return [text];
  const lines = text.split("\n");
  const perPage = Math.ceil(lines.length / pageCount);
  const pages: string[] = [];
  for (let i = 0; i < pageCount; i++) {
    pages.push(lines.slice(i * perPage, (i + 1) * perPage).join("\n"));
  }
  return pages;
}

/* ─── Subcomponents ─── */

function SectionHeader({
  title,
  count,
  open,
  onToggle,
  badge,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-1.5 mb-0.5 group text-left"
    >
      <div className="flex items-center gap-2">
        {open
          ? <ChevronDown className="h-3.5 w-3.5 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
          : <ChevronRight className="h-3.5 w-3.5 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
        }
        <span className="text-[12px] font-semibold text-[var(--cevi-text)]">{title}</span>
        <span className="text-[10px] text-[var(--cevi-text-muted)]">({count})</span>
      </div>
      {badge}
    </button>
  );
}

/** Collapsible section for each top-level schema key */
function SchemaSection({ sectionKey, data, onCopy }: { sectionKey: string; data: unknown; onCopy: (v: string) => void }) {
  const [open, setOpen] = useState(true);
  const label = sectionKey.replace(/_/g, " ");

  // Leaf value — show as single row
  if (data === null || data === undefined) return null;
  if (typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
    const val = String(data);
    return (
      <div
        className="border border-[var(--cevi-border)] rounded-lg overflow-hidden cursor-pointer hover:bg-[var(--cevi-surface-warm)] transition-colors"
        onClick={() => onCopy(val)}
      >
        <div className="grid grid-cols-[130px_1fr] px-3 py-2">
          <span className="text-[11px] font-semibold text-[var(--cevi-text-tertiary)] capitalize">{label}</span>
          <span className="text-[12px] text-[var(--cevi-text)]">{val}</span>
        </div>
      </div>
    );
  }

  // Array or object — collapsible
  const isArr = Array.isArray(data);
  const count = isArr ? data.length : Object.keys(data as Record<string, unknown>).length;

  return (
    <div className="border border-[var(--cevi-border)] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-[var(--cevi-surface-warm)] hover:bg-[#EDECEB] transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {open
            ? <ChevronDown className="h-3.5 w-3.5 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
            : <ChevronRight className="h-3.5 w-3.5 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
          }
          <span className="text-[12px] font-semibold text-[var(--cevi-text)] capitalize">{label}</span>
          <span className="text-[10px] text-[var(--cevi-text-muted)]">
            {isArr ? `${count} item${count !== 1 ? "s" : ""}` : `${count} fields`}
          </span>
        </div>
      </button>
      {open && (
        <div className="divide-y divide-[var(--cevi-border-light)]">
          {isArr ? (
            (data as unknown[]).map((item, i) => (
              <div key={i} className="px-3 py-1.5">
                <div className="text-[10px] font-semibold text-[var(--cevi-text-muted)] uppercase mb-1">
                  {label} #{i + 1}
                </div>
                <FlatFields data={item} onCopy={onCopy} />
              </div>
            ))
          ) : (
            <div className="px-0">
              <FlatFields data={data} onCopy={onCopy} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Renders all fields of an object (and nested objects) as flat label→value rows */
function FlatFields({ data, onCopy, prefix = "" }: { data: unknown; onCopy: (v: string) => void; prefix?: string }) {
  if (data === null || data === undefined) return null;
  if (typeof data !== "object") {
    const val = String(data);
    return (
      <span
        className="text-[12px] text-[var(--cevi-text)] cursor-pointer hover:bg-[var(--sel-fill)] rounded px-0.5"
        onClick={() => onCopy(val)}
      >
        {val}
      </span>
    );
  }

  if (Array.isArray(data)) {
    return (
      <div className="space-y-1">
        {data.map((item, i) => (
          <div key={i} className="pl-2 border-l-2 border-[var(--cevi-border-light)]">
            {typeof item === "object" && item !== null ? (
              <FlatFields data={item} onCopy={onCopy} prefix={`${prefix}[${i}].`} />
            ) : (
              <span
                className="text-[12px] text-[var(--cevi-text)] cursor-pointer hover:bg-[var(--sel-fill)] rounded px-0.5 block py-0.5"
                onClick={() => onCopy(String(item))}
              >
                {String(item)}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  const entries = Object.entries(data as Record<string, unknown>);
  return (
    <div>
      {entries.map(([key, val]) => {
        const fullKey = prefix ? `${prefix}${key}` : key;
        const label = key.replace(/_/g, " ");

        // Nested object — recurse
        if (val !== null && typeof val === "object" && !Array.isArray(val)) {
          return (
            <div key={fullKey} className="border-b border-[var(--cevi-border-light)] last:border-b-0">
              <div className="px-3 py-1 bg-[#FAFAF9]">
                <span className="text-[10px] font-semibold text-[var(--cevi-text-muted)] uppercase">{label}</span>
              </div>
              <div className="pl-2">
                <FlatFields data={val} onCopy={onCopy} prefix={`${fullKey}.`} />
              </div>
            </div>
          );
        }

        // Array — show items
        if (Array.isArray(val)) {
          return (
            <div key={fullKey} className="border-b border-[var(--cevi-border-light)] last:border-b-0">
              <div className="px-3 py-1 bg-[#FAFAF9]">
                <span className="text-[10px] font-semibold text-[var(--cevi-text-muted)] uppercase">{label}</span>
                <span className="text-[10px] text-[var(--cevi-text-muted)] ml-1">({val.length})</span>
              </div>
              <div className="pl-2">
                <FlatFields data={val} onCopy={onCopy} prefix={`${fullKey}.`} />
              </div>
            </div>
          );
        }

        // Leaf
        const strVal = val === null || val === undefined ? "—" : String(val);
        return (
          <div
            key={fullKey}
            className="grid grid-cols-[130px_1fr] border-b border-[var(--cevi-border-light)] last:border-b-0 cursor-pointer hover:bg-[var(--cevi-surface-warm)] transition-colors"
            onClick={() => strVal !== "—" && onCopy(strVal)}
          >
            <div className="px-3 py-1.5 text-[11px] font-semibold text-[var(--cevi-text-tertiary)] border-r border-[var(--cevi-border-light)] capitalize">
              {label}
            </div>
            <div className="px-3 py-1.5 text-[12px] text-[var(--cevi-text)] flex items-center gap-1.5">
              <span className={cn("truncate", strVal === "—" && "text-[var(--cevi-text-muted)]")}>{strVal}</span>
              {strVal !== "—" && <Copy className="h-3 w-3 text-[var(--cevi-text-muted)] shrink-0 opacity-0 group-hover:opacity-100" strokeWidth={1.5} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FieldRow({
  fieldKey,
  label,
  value,
  isActive,
  isEditing,
  editValue,
  editRef,
  onEditChange,
  onClick,
  onDoubleClick,
  onCommit,
  onCancel,
}: {
  fieldKey: string;
  label: string;
  value: string;
  isActive: boolean;
  isEditing: boolean;
  editValue: string;
  editRef: React.RefObject<HTMLInputElement | null>;
  onEditChange: (v: string) => void;
  onClick: () => void;
  onDoubleClick: () => void;
  onCommit: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[130px_1fr] border-b border-[var(--cevi-border-light)] last:border-b-0 cursor-pointer select-none transition-colors",
        isActive && !isEditing && "bg-[var(--sel-fill)]",
        isActive && !isEditing && "shadow-[inset_0_1px_0_0_var(--sel-border),inset_0_-1px_0_0_var(--sel-border),inset_1px_0_0_0_var(--sel-border),inset_-1px_0_0_0_var(--sel-border)]",
        !isActive && "hover:bg-[var(--cevi-surface-warm)]",
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className="px-3 py-2 text-[11px] font-semibold text-[var(--cevi-text-tertiary)] border-r border-[var(--cevi-border-light)] flex items-center">
        {label}
      </div>
      <div className="px-3 py-2 text-[12px] text-[var(--cevi-text)] flex items-center justify-between gap-2 min-w-0">
        {isEditing ? (
          <input
            ref={editRef}
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCommit();
              if (e.key === "Escape") onCancel();
            }}
            className="w-full bg-transparent outline-none text-[12px] text-[var(--cevi-text)] border-b border-[var(--sel-border)] pb-0.5"
          />
        ) : (
          <>
            <span className={cn("truncate", value === "—" && "text-[var(--cevi-text-muted)]")}>
              {value}
            </span>
            {isActive && value !== "—" && (
              <Copy className="h-3 w-3 text-[var(--cevi-text-muted)] shrink-0" strokeWidth={1.5} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
