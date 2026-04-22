"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  ClipboardPaste,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Stethoscope,
  ShieldCheck,
} from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { IconBox } from "@/components/ui/icon-box";
import { cn } from "@/lib/utils";
import { uploadFax, type UploadResult, type UploadError } from "./actions";

type Mode = "file" | "text";
type Tier = "fast" | "smart" | "premium";

const SAMPLE_TEXT = `QUEST DIAGNOSTICS - IRVING METROPLEX
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
REFERRING TO: Texas Physicians Group PCP of record
PATIENT: Anderson, Michelle   DOB: 06/22/1959

Reason for referral: Patient s/p left total knee replacement
04/10/2026. Requires PCP co-management for hypertension,
hyperlipidemia, and early CKD. Please schedule new-patient
visit within 2 weeks to establish care.
Thank you.`;

const SAMPLES = [
  {
    id: "sample-lab",
    title: "Critical lab result",
    body: SAMPLE_TEXT,
    icon: <FlaskConical className="h-4 w-4" strokeWidth={1.5} />,
    tone: "accent" as const,
    summary: "Quest BMP · K+ 6.4 critical high",
  },
  {
    id: "sample-referral",
    title: "Inbound referral",
    body: SAMPLE_REFERRAL,
    icon: <Stethoscope className="h-4 w-4" strokeWidth={1.5} />,
    tone: "teal" as const,
    summary: "Orthopedic post-op PCP co-management",
  },
];

export function UploadForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("text");
  const [tier, setTier] = useState<Tier>("smart");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [senderHint, setSenderHint] = useState("");
  const [clinic, setClinic] = useState("Arlington");
  const [result, setResult] = useState<UploadResult | UploadError | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function reset() {
    setResult(null);
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
      fd.append("tier", tier);
      fd.append("sender", senderHint);
      fd.append("clinic", clinic);
      if (mode === "text") fd.append("text", text);
      if (mode === "file" && file) fd.append("file", file);
      const r = await uploadFax(fd);
      setResult(r);
      if (r.ok) {
        // Let the success card show for a beat, then route.
        setTimeout(() => {
          router.push(`/inbox/${r.faxId}`);
        }, 1500);
      }
    });
  }

  const canSubmit = !isPending && (mode === "text" ? text.trim().length > 20 : !!file);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
      {/* Main form */}
      <div className="space-y-4">
        {/* Mode switch */}
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
                      Drop a fax file
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
                      Drop your fax here, or click to browse
                    </div>
                    <div className="mt-1 text-[12px] text-[var(--cevi-text-muted)]">
                      Faxes are classified with Cevi AI on our server — never stored in
                      the browser.
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
                      For faxes already OCR'd by your fax provider (Medsender, Scrypt,
                      etc.)
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
                placeholder="Paste the fax OCR text here — provider name, patient name/DOB, labs, recommendations, anything you've got…"
                className="w-full rounded-md border border-[var(--cevi-border)] bg-[var(--cevi-surface-warm)] p-3 text-[12px] font-mono leading-[1.55] text-[var(--cevi-text)] placeholder:text-[var(--cevi-text-faint)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20"
              />
            </CardContent>
          </Card>
        )}

        {/* Context fields */}
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

        {/* Model tier */}
        <Card padding="md">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                Classify with
              </div>
              <div className="text-[11px] text-[var(--cevi-text-muted)] mt-0.5">
                Pick a tier. Max runs slower but handles the trickiest consults.
              </div>
            </div>
            <div className="inline-flex items-center bg-[var(--cevi-surface)] rounded-md p-1 text-[12px] font-semibold">
              {(["fast", "smart", "premium"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={cn(
                    "px-3 h-7 rounded inline-flex items-center gap-1 transition-colors",
                    tier === t
                      ? "bg-[var(--cevi-accent)] text-white"
                      : "text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)]",
                  )}
                >
                  {t === "fast" ? "Base" : t === "smart" ? "Pro" : "Max"}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[11px] text-[var(--cevi-text-muted)]">
            By uploading, you confirm the fax contains synthetic or de-identified
            content for demo purposes.
          </div>
          <Button
            variant="primary"
            size="lg"
            disabled={!canSubmit}
            loading={isPending}
            onClick={handleSubmit}
            iconRight={<ArrowRight className="h-4 w-4" />}
          >
            {isPending ? "Classifying…" : "Classify and route"}
          </Button>
        </div>

        {/* Result */}
        {result && (
          <Card padding="none">
            {result.ok ? (
              <>
                <CardHeader>
                  <div className="flex items-center gap-2.5">
                    <IconBox tone="jade" size="sm">
                      <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} />
                    </IconBox>
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                        Classified and persisted
                      </div>
                      <div className="text-[11px] text-[var(--cevi-text-muted)]">
                        {result.modelLabel} · {(result.latencyMs / 1000).toFixed(1)}s ·
                        redirecting to fax detail…
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
                        {result.classifiedAs.replace("_", " ")}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-[var(--cevi-surface)]">
                      <div className="font-semibold uppercase tracking-[0.06em] text-[var(--cevi-text-tertiary)]">
                        Confidence
                      </div>
                      <div className="mt-0.5 text-[var(--cevi-text)]">
                        {Math.round(result.confidence * 100)}%
                      </div>
                    </div>
                    <div className="p-2 rounded bg-[var(--cevi-surface)]">
                      <div className="font-semibold uppercase tracking-[0.06em] text-[var(--cevi-text-tertiary)]">
                        Persisted
                      </div>
                      <div
                        className={cn(
                          "mt-0.5 font-semibold",
                          result.persisted
                            ? "text-[var(--cevi-success)]"
                            : "text-[var(--cevi-accent)]",
                        )}
                      >
                        {result.persisted ? "Supabase · ok" : "in-memory only"}
                      </div>
                    </div>
                  </div>
                  {!result.persisted && result.persistError && (
                    <div className="mt-3 p-3 rounded-md bg-[var(--cevi-accent-light)] border border-[var(--cevi-accent)]/20 text-[11px] text-[var(--cevi-accent)]">
                      Database note: {result.persistError}. Run the schema from{" "}
                      <code>web/supabase/schema.sql</code> in your Supabase SQL editor
                      to unlock persistence.
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Link
                    href={`/inbox/${result.faxId}`}
                    className="text-[12px] font-semibold text-[var(--cevi-accent)] hover:underline inline-flex items-center gap-1"
                  >
                    Open fax <ArrowRight className="h-3 w-3" strokeWidth={2} />
                  </Link>
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
                  {result.error}
                </CardContent>
              </>
            )}
          </Card>
        )}
      </div>

      {/* Sidebar */}
      <aside className="space-y-4">
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <IconBox tone="sand" size="sm">
                <FileText className="h-4 w-4" strokeWidth={1.5} />
              </IconBox>
              <div>
                <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                  Try a sample fax
                </div>
                <div className="text-[11px] text-[var(--cevi-text-muted)]">
                  Synthetic — no real PHI
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {SAMPLES.map((s) => (
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
                  <Sparkles
                    className="h-3.5 w-3.5 text-[var(--cevi-accent)] shrink-0 mt-1"
                    strokeWidth={1.5}
                  />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card padding="none">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <IconBox tone="teal" size="sm">
                <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
              </IconBox>
              <div>
                <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                  What happens next
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2.5 text-[12px] text-[var(--cevi-text-secondary)]">
              {[
                "OCR / vision extraction",
                "Classify with Cevi AI",
                "Match to patient directory",
                "Structure diagnoses, Rx, urgency",
                "Route per workflow rules",
                "Write fax + audit events to Supabase",
                "Redirect you to the fax detail",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-[var(--cevi-accent-bg)] text-[var(--cevi-accent)] text-[10px] font-semibold inline-flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
          <CardFooter>
            <div className="text-[11px] text-[var(--cevi-text-muted)] inline-flex items-center gap-1.5">
              <Loader2 className="h-3 w-3" strokeWidth={1.5} /> Typical end-to-end: 3–8 seconds
            </div>
          </CardFooter>
        </Card>
      </aside>
    </div>
  );
}
