"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UploadCloud,
  ClipboardPaste,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Stethoscope,
  Receipt,
} from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { IconBox } from "@/components/ui/icon-box";
import { cn } from "@/lib/utils";
import { uploadFax, type UploadResult, type UploadError } from "./actions";
import {
  extractEob,
  type EobResult as EobSuccess,
  type EobError,
} from "./eob-actions";
import { EobResultView, EobErrorView } from "@/components/upload/EobResult";

type Kind = "fax" | "eob";
type Mode = "file" | "text";

const SAMPLE_FAX = `QUEST DIAGNOSTICS - IRVING METROPLEX
BMP / Basic Metabolic Panel
Patient: BROWN, ANTHONY    DOB: 03/14/1971
Collection: 04/23/2026 0910    Reported: 04/23/2026 1148
Ordering: T. Nguyen, MD

TEST                RESULT   UNITS       REFERENCE     FLAG
Sodium              136      mmol/L      136-145
Potassium           6.4      mmol/L      3.5-5.1       *** CRITICAL HIGH ***
Chloride            102      mmol/L      98-107
CO2                 23       mmol/L      22-29
BUN                 28       mg/dL       7-20          HIGH
Creatinine          1.3      mg/dL       0.6-1.1       HIGH
Glucose             118      mg/dL       70-99         HIGH

CRITICAL VALUE called to: T. Nguyen, MD at 04/23/2026 1150
Recommend immediate STAT repeat & EKG.`;

const SAMPLE_REFERRAL = `ARLINGTON ORTHOPEDIC ASSOCIATES
3500 MATLOCK RD, ARLINGTON TX 76015
Date: 04/23/2026
REFERRING PROVIDER: Jennifer Soto, MD
REFERRING TO: Transcend Medical Group PCP of record
PATIENT: Anderson, Michelle   DOB: 06/22/1959

Reason for referral: Patient s/p left total knee replacement
04/10/2026. Requires PCP co-management for hypertension,
hyperlipidemia, and early CKD. Please schedule new-patient
visit within 2 weeks to establish care.
Thank you.`;

const SAMPLE_EOB = `BLUECROSS BLUESHIELD OF TEXAS
EXPLANATION OF BENEFITS
Provider: Transcend Medical Group - Arlington  NPI 1487293042
Check #: 100238841   Check Date: 04/19/2026   Check Total: $342.58

Patient: GONZALEZ, MARIA E.    Acct: TMG-004218
  DOS       CPT    Description           Billed    Allowed    Paid    Adj     Pt Resp   Denial
  04/08/26  99214  Office visit level 4  $210.00   $132.40    $132.40 $77.60  $0.00
  04/08/26  36415  Venipuncture          $25.00    $3.00      $3.00   $22.00  $0.00

Patient: WHITFIELD, JAMES      Acct: TMG-004221
  DOS       CPT    Description           Billed    Allowed    Paid    Adj     Pt Resp   Denial
  04/10/26  99213  Office visit level 3  $160.00   $94.18     $75.34  $65.82  $18.84
  04/10/26  93000  EKG complete          $60.00    $28.84     $28.84  $31.16  $0.00
  04/10/26  85025  CBC w/ auto diff      $35.00    $10.00     $0.00   $10.00  $0.00    CO-97

Patient: RAMANATHAN, PRIYA     Acct: TMG-004233
  DOS       CPT    Description           Billed    Allowed    Paid    Adj     Pt Resp   Denial
  04/14/26  99215  Office visit level 5  $305.00   $175.00    $87.50  $130.00 $87.50   PR-1

TOTAL PAID: $327.08   ADJUSTMENTS: $336.58   PATIENT RESPONSIBILITY: $106.34`;

interface Samples {
  id: string;
  title: string;
  summary: string;
  icon: React.ReactNode;
  tone: "accent" | "teal" | "sand";
  body: string;
}

const FAX_SAMPLES: Samples[] = [
  {
    id: "sample-lab",
    title: "Critical lab result",
    summary: "Quest BMP · K+ 6.4 critical high",
    icon: <FlaskConical className="h-4 w-4" strokeWidth={1.5} />,
    tone: "accent",
    body: SAMPLE_FAX,
  },
  {
    id: "sample-referral",
    title: "Inbound referral",
    summary: "Orthopedic post-op PCP co-management",
    icon: <Stethoscope className="h-4 w-4" strokeWidth={1.5} />,
    tone: "teal",
    body: SAMPLE_REFERRAL,
  },
];

const EOB_SAMPLES: Samples[] = [
  {
    id: "sample-eob",
    title: "BCBS of Texas · 3 patients",
    summary: "5 claim lines with one denial",
    icon: <Receipt className="h-4 w-4" strokeWidth={1.5} />,
    tone: "sand",
    body: SAMPLE_EOB,
  },
];

export function UploadForm() {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("fax");
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [senderHint, setSenderHint] = useState("");
  const [clinic, setClinic] = useState("Arlington");
  const [faxResult, setFaxResult] = useState<UploadResult | UploadError | null>(null);
  const [eobResult, setEobResult] = useState<EobSuccess | EobError | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function reset() {
    setFaxResult(null);
    setEobResult(null);
  }

  function switchKind(next: Kind) {
    setKind(next);
    reset();
  }

  function loadSample(body: string) {
    setMode("text");
    setText(body);
    reset();
  }

  function handleSubmit() {
    reset();
    startTransition(async () => {
      const fd = new FormData();
      fd.append("mode", mode);
      fd.append("sender", senderHint);
      fd.append("clinic", clinic);
      if (mode === "text") fd.append("text", text);
      if (mode === "file" && file) fd.append("file", file);

      if (kind === "fax") {
        // Default to smart tier internally; UI hides the choice.
        fd.append("tier", "smart");
        const r = await uploadFax(fd);
        setFaxResult(r);
        // Upload always caches in process memory as a fallback, so the detail
        // route can render even when Supabase persistence fails.
        if (r.ok) {
          window.setTimeout(() => router.push(`/inbox/${r.faxId}`), 1500);
        }
      } else {
        const r = await extractEob(fd);
        setEobResult(r);
      }
    });
  }

  const canSubmit =
    !isPending && (mode === "text" ? text.trim().length > 20 : !!file);

  const samples = kind === "fax" ? FAX_SAMPLES : EOB_SAMPLES;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
      {/* Main form */}
      <div className="space-y-4">
        {/* Kind toggle — primary choice */}
        <div className="rounded-lg border border-[var(--cevi-border)] bg-white overflow-hidden">
          <div className="grid grid-cols-2">
            <button
              type="button"
              onClick={() => switchKind("fax")}
              className={cn(
                "px-5 py-3 text-left transition-colors border-r border-[var(--cevi-border)]",
                kind === "fax"
                  ? "bg-[var(--cevi-accent-light)]"
                  : "bg-white hover:bg-[var(--cevi-surface-warm)]",
              )}
            >
              <div className="flex items-center gap-2">
                <UploadCloud
                  className={cn(
                    "h-4 w-4",
                    kind === "fax"
                      ? "text-[var(--cevi-accent)]"
                      : "text-[var(--cevi-text-muted)]",
                  )}
                  strokeWidth={1.5}
                />
                <span
                  className={cn(
                    "text-[13px] font-semibold",
                    kind === "fax"
                      ? "text-[var(--cevi-text)]"
                      : "text-[var(--cevi-text-secondary)]",
                  )}
                >
                  A fax
                </span>
              </div>
              <div className="mt-1 text-[11px] text-[var(--cevi-text-muted)]">
                Lab, consult, referral, prior auth, records, Rx refill
              </div>
            </button>
            <button
              type="button"
              onClick={() => switchKind("eob")}
              className={cn(
                "px-5 py-3 text-left transition-colors",
                kind === "eob"
                  ? "bg-[var(--cevi-accent-light)]"
                  : "bg-white hover:bg-[var(--cevi-surface-warm)]",
              )}
            >
              <div className="flex items-center gap-2">
                <Receipt
                  className={cn(
                    "h-4 w-4",
                    kind === "eob"
                      ? "text-[var(--cevi-accent)]"
                      : "text-[var(--cevi-text-muted)]",
                  )}
                  strokeWidth={1.5}
                />
                <span
                  className={cn(
                    "text-[13px] font-semibold",
                    kind === "eob"
                      ? "text-[var(--cevi-text)]"
                      : "text-[var(--cevi-text-secondary)]",
                  )}
                >
                  A paper EOB
                </span>
                <Badge variant="jade" size="sm">
                  New
                </Badge>
              </div>
              <div className="mt-1 text-[11px] text-[var(--cevi-text-muted)]">
                Saves your biller from hand-keying each claim line
              </div>
            </button>
          </div>
        </div>

        {/* Mode sub-toggle */}
        <div className="inline-flex items-center bg-[var(--cevi-surface)] rounded-lg p-1 text-[12px] font-semibold">
          <button
            type="button"
            onClick={() => setMode("text")}
            className={cn(
              "px-4 h-8 rounded-md inline-flex items-center gap-1.5 transition-colors",
              mode === "text"
                ? "bg-white text-[var(--cevi-text)] shadow-[0_1px_0_rgba(0,0,0,0.04)]"
                : "text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)]",
            )}
          >
            <ClipboardPaste className="h-3.5 w-3.5" strokeWidth={1.5} />
            Paste OCR
          </button>
          <button
            type="button"
            onClick={() => setMode("file")}
            className={cn(
              "px-4 h-8 rounded-md inline-flex items-center gap-1.5 transition-colors",
              mode === "file"
                ? "bg-white text-[var(--cevi-text)] shadow-[0_1px_0_rgba(0,0,0,0.04)]"
                : "text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)]",
            )}
          >
            <UploadCloud className="h-3.5 w-3.5" strokeWidth={1.5} />
            Upload PDF / image
          </button>
        </div>

        {/* Input */}
        {mode === "file" ? (
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <IconBox tone="accent" size="sm">
                    <UploadCloud className="h-4 w-4" strokeWidth={1.5} />
                  </IconBox>
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                      {kind === "fax"
                        ? "Drop a fax file"
                        : "Drop the scanned EOB"}
                    </div>
                    <div className="text-[11px] text-[var(--cevi-text-muted)]">
                      PDF, PNG, JPG, or WebP · up to 15 MB
                    </div>
                  </div>
                </div>
                {file && (
                  <Badge variant="jade" size="sm" dot>
                    Ready
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const f = e.dataTransfer.files[0];
                  if (f) setFile(f);
                }}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                className={cn(
                  "rounded-lg border-2 border-dashed py-14 text-center cursor-pointer transition-colors",
                  isDragging
                    ? "border-[var(--cevi-accent)] bg-[var(--cevi-accent-light)]"
                    : "border-[var(--cevi-border)] bg-[var(--cevi-surface-warm)] hover:bg-[var(--cevi-surface)]",
                )}
              >
                <UploadCloud
                  className="h-10 w-10 text-[var(--cevi-accent)] mx-auto mb-3"
                  strokeWidth={1.5}
                />
                {file ? (
                  <>
                    <div className="text-[14px] font-semibold text-[var(--cevi-text)]">
                      {file.name}
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--cevi-text-muted)]">
                      {(file.size / 1024).toFixed(0)} KB · {file.type}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="mt-2 text-[11px] text-[var(--cevi-accent)] hover:underline"
                    >
                      Choose a different file
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-[14px] font-semibold text-[var(--cevi-text)]">
                      Drop here, or click to browse
                    </div>
                    <div className="mt-1 text-[12px] text-[var(--cevi-text-muted)]">
                      Processed on Cevi's server. Nothing is stored in your browser.
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <IconBox tone="teal" size="sm">
                    <ClipboardPaste className="h-4 w-4" strokeWidth={1.5} />
                  </IconBox>
                  <div>
                    <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                      Paste OCR text
                    </div>
                    <div className="text-[11px] text-[var(--cevi-text-muted)]">
                      {kind === "fax"
                        ? "For faxes already OCR'd by your fax provider"
                        : "For EOBs already OCR'd or copy-pasted from a PDF"}
                    </div>
                  </div>
                </div>
                {text.trim().length > 0 && (
                  <span className="text-[11px] text-[var(--cevi-text-muted)]">
                    {text.length.toLocaleString()} chars
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={14}
                placeholder={
                  kind === "fax"
                    ? "Paste the fax OCR text here…"
                    : "Paste the EOB OCR text here — check header, then one line per claim…"
                }
                className="w-full rounded-md border border-[var(--cevi-border)] bg-[var(--cevi-surface-warm)] p-3 text-[12px] font-mono leading-[1.55] text-[var(--cevi-text)] placeholder:text-[var(--cevi-text-faint)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20"
              />
            </CardContent>
          </Card>
        )}

        {/* Context fields — only relevant for faxes */}
        {kind === "fax" && (
          <Card padding="md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)]">
                  Sender hint (optional)
                </label>
                <Input
                  className="mt-1"
                  placeholder="e.g. Baylor Cardiology, BCBS PA"
                  value={senderHint}
                  onChange={(e) => setSenderHint(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)]">
                  Receiving clinic
                </label>
                <select
                  value={clinic}
                  onChange={(e) => setClinic(e.target.value)}
                  className="mt-1 w-full h-9 px-3 rounded-md border border-[var(--cevi-border)] bg-white text-[13px] text-[var(--cevi-text)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20"
                >
                  <option>Arlington</option>
                  <option>Pantego</option>
                  <option>Grand Prairie</option>
                  <option>River Oaks</option>
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* CTA */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[11px] text-[var(--cevi-text-muted)]">
            {kind === "fax"
              ? "Cevi tags it and drops it in your inbox in under ten seconds."
              : "Cevi extracts every claim line so your biller can post without re-typing."}
          </div>
          <Button
            variant="primary"
            size="lg"
            disabled={!canSubmit}
            loading={isPending}
            onClick={handleSubmit}
            iconRight={<ArrowRight className="h-4 w-4" />}
          >
            {isPending
              ? kind === "fax"
                ? "Tagging…"
                : "Extracting…"
              : kind === "fax"
                ? "Tag and route"
                : "Extract claims"}
          </Button>
        </div>

        {/* Fax result */}
        {kind === "fax" && faxResult && (
          <Card padding="none">
            {faxResult.ok ? (
              <>
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <IconBox tone="jade" size="sm">
                      <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
                    </IconBox>
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                        Tagged and queued
                      </div>
                      <div className="text-[11px] text-[var(--cevi-text-muted)]">
                        {faxResult.modelLabel} ·{" "}
                        {(faxResult.latencyMs / 1000).toFixed(1)}s · redirecting
                        to fax…
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-[var(--cevi-surface)]">
                      <div className="font-semibold uppercase tracking-[0.06em] text-[var(--cevi-text-tertiary)]">
                        Type
                      </div>
                      <div className="mt-0.5 text-[var(--cevi-text)] capitalize">
                        {faxResult.classifiedAs.replace("_", " ")}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-[var(--cevi-surface)]">
                      <div className="font-semibold uppercase tracking-[0.06em] text-[var(--cevi-text-tertiary)]">
                        Confidence
                      </div>
                      <div className="mt-0.5 text-[var(--cevi-text)]">
                        {Math.round(faxResult.confidence * 100)}%
                      </div>
                    </div>
                    <div className="p-2 rounded bg-[var(--cevi-surface)]">
                      <div className="font-semibold uppercase tracking-[0.06em] text-[var(--cevi-text-tertiary)]">
                        Saved
                      </div>
                      <div
                        className={cn(
                          "mt-0.5 font-semibold",
                          faxResult.persisted
                            ? "text-[var(--cevi-success)]"
                            : "text-[var(--cevi-accent)]",
                        )}
                      >
                        {faxResult.persisted ? "Yes" : "Local only"}
                      </div>
                    </div>
                  </div>
                  {!faxResult.persisted && faxResult.persistError && (
                    <div className="mt-3 p-3 rounded-md bg-[var(--cevi-accent-light)] border border-[var(--cevi-accent)]/20 text-[11px] text-[var(--cevi-accent)]">
                      <strong className="font-semibold">Supabase schema not applied yet.</strong>{" "}
                      Cevi classified the fax live, but the result wasn't saved to the inbox.
                      Apply <code className="font-mono">web/supabase/schema.sql</code> in
                      your Supabase SQL Editor to enable persistence across sessions.
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {faxResult.persisted ? (
                    <Link
                      href={`/inbox/${faxResult.faxId}`}
                      className="text-[12px] font-semibold text-[var(--cevi-accent)] hover:underline inline-flex items-center gap-1"
                    >
                      Open fax <ArrowRight className="h-3 w-3" strokeWidth={2} />
                    </Link>
                  ) : (
                    <Link
                      href="/"
                      className="text-[12px] font-semibold text-[var(--cevi-accent)] hover:underline inline-flex items-center gap-1"
                    >
                      See example faxes in the inbox{" "}
                      <ArrowRight className="h-3 w-3" strokeWidth={2} />
                    </Link>
                  )}
                </CardFooter>
              </>
            ) : (
              <>
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <IconBox tone="accent" size="sm">
                      <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
                    </IconBox>
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                        Upload failed
                      </div>
                      <div className="text-[11px] text-[var(--cevi-text-muted)]">
                        Nothing was saved.
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-[12px] text-[var(--cevi-text-secondary)]">
                  {faxResult.error}
                </CardContent>
              </>
            )}
          </Card>
        )}

        {/* EOB result */}
        {kind === "eob" && eobResult && (
          eobResult.ok ? (
            <EobResultView result={eobResult} />
          ) : (
            <EobErrorView error={eobResult.error} />
          )
        )}
      </div>

      {/* Sidebar */}
      <aside className="space-y-4">
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <IconBox tone="sand" size="sm">
                <Sparkles className="h-4 w-4" strokeWidth={1.5} />
              </IconBox>
              <div>
                <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                  Try a sample
                </div>
                <div className="text-[11px] text-[var(--cevi-text-muted)]">
                  Synthetic — no real PHI
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {samples.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => loadSample(s.body)}
                className="w-full text-left rounded-md border border-[var(--cevi-border)] bg-white hover:bg-[var(--cevi-surface-warm)] transition-colors p-3"
              >
                <div className="flex items-start gap-2.5">
                  <IconBox tone={s.tone} size="sm">
                    {s.icon}
                  </IconBox>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                      {s.title}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--cevi-text-muted)]">
                      {s.summary}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card padding="none">
          <CardHeader>
            <div>
              <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                What happens next
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2.5 text-[12px] text-[var(--cevi-text-secondary)]">
              {(kind === "fax"
                ? [
                    "Read the fax (OCR + vision)",
                    "Classify — lab, consult, PA, etc.",
                    "Match to your patient directory",
                    "Structure diagnoses, Rx, urgency",
                    "Route per your workflow rules",
                    "Write to eClinicalWorks chart",
                  ]
                : [
                    "Read the paper EOB (OCR + vision)",
                    "Pull out check header (payer, #, date)",
                    "Extract every claim line-item",
                    "Flag denials and adjustments",
                    "Hand your biller a clean table to post",
                  ]
              ).map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[var(--cevi-accent-bg)] text-[var(--cevi-accent)] text-[10px] font-semibold inline-flex items-center justify-center tabular-nums">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
          <CardFooter>
            <div className="text-[11px] text-[var(--cevi-text-muted)] inline-flex items-center gap-1.5">
              <Loader2 className="h-3 w-3" strokeWidth={1.5} /> Typical end-to-end:
              3–8 seconds
            </div>
          </CardFooter>
        </Card>
      </aside>
    </div>
  );
}
