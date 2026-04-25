"use client";

import { useState, useCallback, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Sparkles,
  ChevronDown,
  ChevronRight,
  FileText,
  Printer as FaxIcon,
  Zap,
  ZoomIn,
  ZoomOut,
  Save,
  CheckCircle2,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { Badge, statusBadgeVariant, typeBadgeVariant, urgencyBadgeVariant } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { useToast } from "@/frontend/components/ui/toast";
import { ConfidenceMeter } from "@/frontend/components/composed/confidence-meter";
import { patients, patientFullName } from "@/data/seed/patients";
import { formatDateTime, formatDob, calcAge, cn } from "@/shared/utils";
import { FAX_TYPE_LABELS, MODEL_LABELS, modelLabelFromId, type ModelTier } from "@/shared/constants";
import type { Fax, FaxEvent, ExtractedFields, Urgency } from "@/shared/types";

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

  // Section collapse state
  const [extractionOpen, setExtractionOpen] = useState(true);
  const [metaOpen, setMetaOpen] = useState(true);
  const [matchOpen, setMatchOpen] = useState(true);
  const [auditOpen, setAuditOpen] = useState(false);

  // Document viewer state
  const [zoom, setZoom] = useState(100);

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

  const matchedPatient = fax.matchedPatientId
    ? patients.find((p) => p.id === fax.matchedPatientId)
    : null;

  const sortedEvents = [...events].sort((a, b) => (a.at < b.at ? -1 : 1));

  // Simulate multi-page content from OCR text
  const ocrPages = splitToPages(fax.ocrText, fax.pages);

  return (
    <div className="-mx-6 md:-mx-10 -my-6 flex flex-col h-screen">
      {/* ── Top action bar ── */}
      <div className="shrink-0 flex items-center justify-between gap-4 px-4 h-12 border-b border-[var(--cevi-border)] bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            Back
          </Link>
          <div className="h-4 w-px bg-[var(--cevi-border)]" />
          <h1 className="text-[14px] font-semibold text-[var(--cevi-text)] truncate">
            {fax.fromOrg}
          </h1>
          <Badge variant={typeBadgeVariant(type)} size="sm">
            {TYPE_LABELS[type] ?? type}
          </Badge>
          <Badge variant={urgencyBadgeVariant(urgency)} size="sm" dot>
            {urgency}
          </Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            loading={isPending}
            disabled={isPending}
            onClick={() => handleReclassify("premium")}
            icon={<Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />}
          >
            Re-classify
          </Button>
          <Button variant="outline" size="sm" onClick={() => {}} icon={<AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.5} />}>
            Needs Review
          </Button>
          <Button variant="primary" size="sm" onClick={() => {}} icon={<CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />}>
            Mark Processed
          </Button>
        </div>
      </div>

      {error && (
        <div className="shrink-0 mx-4 mt-2 rounded-md border border-[var(--cevi-accent)]/20 bg-[var(--cevi-accent-light)] p-2.5 text-[12px] text-[var(--cevi-accent)]">
          Classification failed: {error}
        </div>
      )}

      {/* ── Split view ── */}
      <div className="flex-1 flex min-h-0">
        {/* ─── LEFT: Document viewer (Reducto-style) ─── */}
        <div className="flex border-r border-[var(--cevi-border)] bg-[#F7F7F5]">
          {/* Page thumbnails strip */}
          <div className="w-[80px] shrink-0 border-r border-[var(--cevi-border-light)] bg-[#F0EFED] overflow-y-auto py-3 px-2 space-y-2 scrollbar-thin">
            {ocrPages.map((_, i) => (
              <button
                key={i}
                className="w-full aspect-[8.5/11] rounded border border-[var(--cevi-border)] bg-white shadow-sm hover:border-[var(--cevi-accent)] hover:shadow-md transition-all relative group"
              >
                {/* Mini page content representation */}
                <div className="absolute inset-1.5 overflow-hidden">
                  <div className="h-1 w-10 bg-[#E5E5E5] rounded-full mb-1" />
                  <div className="h-0.5 w-12 bg-[#EFEFEF] rounded-full mb-0.5" />
                  <div className="h-0.5 w-8 bg-[#EFEFEF] rounded-full mb-0.5" />
                  <div className="h-0.5 w-11 bg-[#EFEFEF] rounded-full mb-0.5" />
                  <div className="h-0.5 w-6 bg-[#EFEFEF] rounded-full mb-1" />
                  <div className="h-0.5 w-10 bg-[#EFEFEF] rounded-full mb-0.5" />
                  <div className="h-0.5 w-9 bg-[#EFEFEF] rounded-full" />
                </div>
                <div className="absolute bottom-0.5 left-0 right-0 text-center text-[8px] text-[var(--cevi-text-muted)] font-medium">
                  {i + 1}
                </div>
              </button>
            ))}
            {/* Add file button */}
            <button className="w-full aspect-[8.5/11] rounded border border-dashed border-[var(--cevi-border)] bg-transparent hover:bg-white hover:border-[var(--cevi-accent)] transition-all flex items-center justify-center">
              <Plus className="h-3.5 w-3.5 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
            </button>
          </div>

          {/* Main document area */}
          <div className="flex-1 flex flex-col min-w-[400px]">
            {/* Document toolbar */}
            <div className="shrink-0 flex items-center justify-between px-4 h-10 border-b border-[var(--cevi-border-light)] bg-white/80">
              <div className="flex items-center gap-2 text-[11px] text-[var(--cevi-text-secondary)]">
                <FaxIcon className="h-3.5 w-3.5 text-[var(--cevi-accent)]" strokeWidth={1.5} />
                <span className="font-semibold">{fax.pages}-page fax</span>
                <span className="text-[var(--cevi-text-muted)]">·</span>
                <span className="text-[var(--cevi-text-muted)]">{formatDateTime(fax.receivedAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  className="p-1 rounded hover:bg-[var(--cevi-surface)] transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut className="h-3.5 w-3.5 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
                </button>
                <span className="text-[10px] text-[var(--cevi-text-muted)] tabular-nums w-8 text-center font-medium">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 10))}
                  className="p-1 rounded hover:bg-[var(--cevi-surface)] transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn className="h-3.5 w-3.5 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Document body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div
                className="mx-auto transition-transform origin-top"
                style={{ maxWidth: `${Math.round(612 * zoom / 100)}px` }}
              >
                {ocrPages.map((pageText, i) => (
                  <div key={i} className="mb-6 last:mb-0">
                    <div className="fax-paper rounded-lg p-8 relative shadow-md">
                      {/* RECEIVED stamp on first page */}
                      {i === 0 && (
                        <div className="absolute top-6 right-6 rotate-[8deg] border-[3px] border-[var(--cevi-accent)] text-[var(--cevi-accent)] px-3 py-1 font-bold text-[11px] tracking-[0.15em] opacity-50 select-none pointer-events-none">
                          RECEIVED
                          <div className="text-[7px] tracking-[0.1em] font-semibold text-center mt-0.5">
                            {new Date(fax.receivedAt).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" })}
                          </div>
                        </div>
                      )}

                      {/* Page header */}
                      <div className="pb-2 mb-4 text-[9px] text-[#888] font-sans tracking-[0.05em] flex items-center justify-between border-b border-dashed border-[rgba(0,0,0,0.15)]">
                        <span>RECEIVED AT {fax.faxNumberTo}</span>
                        <span>Page {i + 1} of {fax.pages}</span>
                      </div>

                      {/* Page content */}
                      <div
                        className="font-mono text-[11px] leading-[1.65] text-[#2a2722] whitespace-pre-wrap"
                        style={{ fontSize: `${Math.round(11 * zoom / 100)}px` }}
                      >
                        {pageText}
                      </div>

                      {/* Page footer */}
                      <div className="mt-6 pt-2 border-t border-dashed border-[rgba(0,0,0,0.15)] text-[9px] text-[#888] font-sans flex items-center justify-between">
                        <span>— page {i + 1} —</span>
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-2.5 w-2.5" strokeWidth={1.5} />
                          {fax.fromNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Extraction panel ─── */}
        <div className="w-[480px] shrink-0 flex flex-col bg-white overflow-hidden">
          {/* Panel header */}
          <div className="shrink-0 px-4 py-3 border-b border-[var(--cevi-border-light)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-[var(--cevi-text)]">Extracted Data</span>
                <Badge variant={statusBadgeVariant(fax.status)} size="sm">
                  {fax.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                {matchedPatient ? (
                  <Badge variant="success" size="sm" dot>Matched</Badge>
                ) : fax.candidates.length > 0 ? (
                  <Badge variant="amber" size="sm" dot>Needs Review</Badge>
                ) : (
                  <Badge variant="outline" size="sm">Unmatched</Badge>
                )}
              </div>
            </div>
            {/* Classification + confidence row */}
            <div className="mt-2 flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--cevi-text-muted)]">Category:</span>
                <span className="font-semibold text-[var(--cevi-text)]">{TYPE_LABELS[type] ?? type}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--cevi-text-muted)]">Confidence:</span>
                <ConfidenceMeter value={confidence} />
              </div>
              {latencyMs && (
                <div className="flex items-center gap-1 text-[var(--cevi-text-muted)]">
                  <Zap className="h-3 w-3 text-[var(--cevi-amber)]" strokeWidth={1.5} />
                  <span>{(latencyMs / 1000).toFixed(1)}s</span>
                </div>
              )}
            </div>
          </div>

          {/* AI summary */}
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

          {/* Scrollable extraction grid */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 scrollbar-thin">
            {/* Extracted Fields */}
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
              badge={matchedPatient
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
                    const p = patients.find((x) => x.id === c.patientId);
                    if (!p) return null;
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
                            {patientFullName(p)}
                            {isMatched && <span className="ml-1.5 text-[var(--cevi-jade)] text-[10px] font-bold">MATCHED</span>}
                          </div>
                          <div className="text-[11px] text-[var(--cevi-text-muted)] font-mono">
                            {p.mrn} · DOB {formatDob(p.dob)} · {calcAge(p.dob)}y {p.sex}
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
          </div>

          {/* Keyboard hints footer */}
          <div className="shrink-0 px-4 py-2 border-t border-[var(--cevi-border-light)] bg-[var(--cevi-surface-warm)] flex items-center gap-3 text-[10px] text-[var(--cevi-text-muted)]">
            <span><kbd className="px-1 py-0.5 rounded bg-white border border-[var(--cevi-border)] text-[9px]">Click</kbd> copy</span>
            <span><kbd className="px-1 py-0.5 rounded bg-white border border-[var(--cevi-border)] text-[9px]">Double-click</kbd> edit</span>
            <span><kbd className="px-1 py-0.5 rounded bg-white border border-[var(--cevi-border)] text-[9px]">↑↓</kbd> navigate</span>
            <span><kbd className="px-1 py-0.5 rounded bg-white border border-[var(--cevi-border)] text-[9px]">⌘C</kbd> copy</span>
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
