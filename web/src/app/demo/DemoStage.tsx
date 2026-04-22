"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Play,
  Inbox,
  ScanLine,
  Sparkles,
  UserCheck,
  Share2,
  BellRing,
  Database,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconBox } from "@/components/ui/icon-box";
import { faxes } from "@/data/faxes";
import { classifyFax } from "@/app/actions/classify";
import { cn } from "@/lib/utils";
import type { ClassifyResult } from "@/app/actions/classify";

type StageKey =
  | "idle"
  | "received"
  | "ocr"
  | "classified"
  | "matched"
  | "extracted"
  | "routed"
  | "written_back"
  | "notified"
  | "done";

const SEQUENCE: {
  key: StageKey;
  label: string;
  icon: React.ReactNode;
  tone: "accent" | "teal" | "jade" | "sand" | "amber";
  detail: string;
}[] = [
  {
    key: "received",
    label: "Received",
    icon: <Inbox className="h-3.5 w-3.5" strokeWidth={1.5} />,
    tone: "accent",
    detail: "Fax landed via Medsender · 2 pages · from Quest Diagnostics",
  },
  {
    key: "ocr",
    label: "OCR",
    icon: <ScanLine className="h-3.5 w-3.5" strokeWidth={1.5} />,
    tone: "teal",
    detail: "Tesseract + layout analysis · 420 characters extracted",
  },
  {
    key: "classified",
    label: "Classified",
    icon: <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />,
    tone: "accent",
    detail: "Cevi Pro · lab_result @ high confidence",
  },
  {
    key: "matched",
    label: "Matched",
    icon: <UserCheck className="h-3.5 w-3.5" strokeWidth={1.5} />,
    tone: "jade",
    detail: "Matched to Priya Ramanathan · MRN-004233 · 98%",
  },
  {
    key: "extracted",
    label: "Extracted",
    icon: <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />,
    tone: "sand",
    detail: "Potassium 6.1 (CRITICAL HIGH) · urgency flagged",
  },
  {
    key: "routed",
    label: "Routed",
    icon: <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} />,
    tone: "accent",
    detail: "Dr. Alicia Harbison's results inbox · Pantego clinic",
  },
  {
    key: "written_back",
    label: "eCW write-back",
    icon: <Database className="h-3.5 w-3.5" strokeWidth={1.5} />,
    tone: "jade",
    detail: "Attached to chart · encounter note added",
  },
  {
    key: "notified",
    label: "On-call notified",
    icon: <BellRing className="h-3.5 w-3.5" strokeWidth={1.5} />,
    tone: "amber",
    detail: "SMS via Twilio · Nurse Guerrero · delivered",
  },
];

const HERO_FAX_ID = "FAX-20260423-002";

export function DemoStage() {
  const heroFax = faxes.find((f) => f.id === HERO_FAX_ID);
  if (!heroFax) {
    return (
      <div className="rounded-lg border border-[var(--cevi-accent)]/20 bg-[var(--cevi-accent-light)] p-6 text-[13px] text-[var(--cevi-accent)]">
        Demo stage unavailable — hero fax fixture not found. Reseed the database and
        reload.
      </div>
    );
  }
  const [stage, setStage] = useState<StageKey>("idle");
  const [completed, setCompleted] = useState<StageKey[]>([]);
  const [claudeResult, setClaudeResult] = useState<ClassifyResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const totalElapsed = startedAt
    ? ((Date.now() - startedAt) / 1000).toFixed(1)
    : "—";

  async function advance(to: StageKey, delayMs: number) {
    await new Promise((r) => setTimeout(r, delayMs));
    setCompleted((prev) => (prev.includes(to) ? prev : [...prev, to]));
    setStage(to);
  }

  function handleTrigger() {
    if (isPending) return;
    setCompleted([]);
    setClaudeResult(null);
    setStartedAt(Date.now());
    setStage("received");

    startTransition(async () => {
      await advance("received", 400);
      await advance("ocr", 900);
      // Fire the real Claude classification
      setStage("classified"); // show pending
      const classifyPromise = classifyFax(HERO_FAX_ID, "smart");
      const [result] = await Promise.all([
        classifyPromise,
        new Promise((r) => setTimeout(r, 1200)),
      ]);
      if (result.ok) setClaudeResult(result);
      setCompleted((p) => [...p, "classified"]);
      await advance("matched", 500);
      await advance("extracted", 700);
      await advance("routed", 500);
      await advance("written_back", 900);
      await advance("notified", 400);
      setStage("done");
    });
  }

  const isDone = stage === "done";
  const isRunning = stage !== "idle" && !isDone;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
      {/* Left column: Fax + CTA */}
      <div>
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <IconBox tone="accent">
                  <Play className="h-4 w-4" strokeWidth={1.5} />
                </IconBox>
                <div>
                  <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                    Live demo stage
                  </div>
                  <div className="text-[11px] text-[var(--cevi-text-muted)]">
                    Simulates a fax landing right now · real Claude call on classify
                  </div>
                </div>
              </div>
              {isRunning && (
                <Badge variant="accent" size="sm" dot pulse>
                  Processing · {totalElapsed}s
                </Badge>
              )}
              {isDone && (
                <Badge variant="jade" size="sm" dot>
                  Pipeline complete · {totalElapsed}s
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md bg-[var(--cevi-accent-bg)] p-4 border border-[var(--cevi-accent)]/10 mb-4">
              <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[var(--cevi-accent)]">
                Incoming fax (preview)
              </div>
              <div className="mt-1 text-[15px] font-semibold text-[var(--cevi-text)]">
                {heroFax.fromOrg}
              </div>
              <div className="mt-0.5 text-[12px] text-[var(--cevi-text-muted)]">
                {heroFax.pages}-page lab result · from {heroFax.fromNumber}
              </div>
              <div className="mt-3 text-[12px] text-[var(--cevi-text-secondary)] italic">
                "Potassium 6.1 mmol/L — <span className="text-[var(--cevi-accent)] font-semibold not-italic">CRITICAL HIGH</span>"
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleTrigger}
              disabled={isRunning}
              icon={
                isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isDone ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )
              }
            >
              {isDone ? "Run again" : isRunning ? "Processing…" : "Trigger inbound fax"}
            </Button>
            {isDone && (
              <div className="mt-3 text-center">
                <Link
                  href={`/inbox/${HERO_FAX_ID}`}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--cevi-accent)] hover:underline"
                >
                  Open the fax <ArrowRight className="h-3 w-3" strokeWidth={2} />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {claudeResult && (
          <Card padding="none" className="mt-4">
            <CardHeader>
              <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                Claude response (this run)
              </div>
              <div className="text-[11px] text-[var(--cevi-text-muted)]">
                {claudeResult.modelLabel} · {(claudeResult.latencyMs / 1000).toFixed(1)}s
                · {claudeResult.tokensIn}→{claudeResult.tokensOut} tokens
                {claudeResult.cachedInputTokens
                  ? ` · ${claudeResult.cachedInputTokens} cached`
                  : ""}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-[12px] text-[var(--cevi-text-secondary)] italic mb-2">
                {claudeResult.aiSummary}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-[var(--cevi-surface)]">
                  <div className="font-semibold uppercase tracking-[0.06em] text-[var(--cevi-text-tertiary)]">
                    Type
                  </div>
                  <div className="mt-0.5 text-[var(--cevi-text)] capitalize">
                    {claudeResult.type.replace("_", " ")}
                  </div>
                </div>
                <div className="p-2 rounded bg-[var(--cevi-surface)]">
                  <div className="font-semibold uppercase tracking-[0.06em] text-[var(--cevi-text-tertiary)]">
                    Urgency
                  </div>
                  <div className="mt-0.5 text-[var(--cevi-accent)] font-semibold capitalize">
                    {claudeResult.urgency}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right column: Pipeline */}
      <Card padding="none">
        <CardHeader>
          <div>
            <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
              Pipeline
            </div>
            <div className="text-[11px] text-[var(--cevi-text-muted)]">
              Every step audited · eCW write-back enabled · SMS for critical
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {SEQUENCE.map((s, i) => {
              const isActive = stage === s.key;
              const isComplete = completed.includes(s.key);
              return (
                <li
                  key={s.key}
                  className={cn(
                    "flex items-start gap-3 rounded-md border p-3 transition-all duration-200",
                    isComplete
                      ? "border-[var(--cevi-jade)]/30 bg-[var(--cevi-jade-light)]"
                      : isActive
                        ? "border-[var(--cevi-accent)]/30 bg-[var(--cevi-accent-light)]"
                        : "border-[var(--cevi-border-light)] bg-white opacity-60",
                  )}
                >
                  <div
                    className={cn(
                      "shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
                      isComplete
                        ? "bg-[var(--cevi-jade)] text-white"
                        : isActive
                          ? "bg-[var(--cevi-accent)] text-white"
                          : "bg-[var(--cevi-surface)] text-[var(--cevi-text-muted)]",
                    )}
                  >
                    {isActive && !isComplete ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                    ) : isComplete ? (
                      <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                    ) : (
                      s.icon
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="text-[12px] font-semibold text-[var(--cevi-text)] uppercase tracking-[0.04em]">
                        {i + 1}. {s.label}
                      </div>
                      {isComplete && (
                        <span className="text-[10px] font-semibold text-[var(--cevi-success)] uppercase tracking-[0.08em]">
                          Done
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[12px] text-[var(--cevi-text-secondary)]">
                      {s.detail}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
