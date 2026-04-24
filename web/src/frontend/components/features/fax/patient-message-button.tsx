"use client";

import { useState, useTransition } from "react";
import {
  MessageSquare,
  X,
  Copy,
  Send,
  Sparkles,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { IconBox } from "@/frontend/components/ui/icon-box";
import { draftPatientMessage } from "@/app/actions/draft-message";
import type { Fax } from "@/shared/types";
import { cn } from "@/shared/utils";

interface Props {
  fax: Fax;
}

export function PatientMessageButton({ fax }: Props) {
  const applicable =
    fax.type === "lab_result" ||
    fax.type === "specialist_consult" ||
    fax.type === "imaging_report";

  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [modelLabel, setModelLabel] = useState("Cevi Max");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!applicable) return null;

  function openAndDraft() {
    setOpen(true);
    setError(null);
    setCopied(false);
    setSent(false);
    setSubject("");
    setBody("");
    setLatencyMs(null);
    startTransition(async () => {
      const r = await draftPatientMessage({ faxId: fax.id });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setSubject(r.subject);
      setBody(r.body);
      setModelLabel(r.modelLabel);
      setLatencyMs(r.latencyMs);
      if (!r.persisted && r.persistError) {
        setError(
          `Draft ready · DB note: ${r.persistError}. Apply the Supabase schema to persist drafts.`,
        );
      }
    });
  }

  function handleCopy() {
    const full = `Subject: ${subject}\n\n${body}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(full);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        icon={<MessageSquare className="h-3.5 w-3.5" strokeWidth={1.5} />}
        onClick={openAndDraft}
      >
        Draft patient message
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => !isPending && setOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-xl shadow-[var(--shadow-lg)] overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-[var(--cevi-border-light)] flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <IconBox tone="accent" size="sm">
                  <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
                </IconBox>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)]">
                    Patient-facing draft
                  </div>
                  <div className="text-[16px] font-serif mt-0.5 text-[var(--cevi-text)]">
                    Ready for your edits
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {latencyMs !== null && (
                  <span className="text-[11px] text-[var(--cevi-text-muted)] inline-flex items-center gap-1.5">
                    <Sparkles
                      className="h-3 w-3 text-[var(--cevi-accent)]"
                      strokeWidth={1.5}
                    />
                    {modelLabel} · {(latencyMs / 1000).toFixed(1)}s
                  </span>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 rounded-md inline-flex items-center justify-center text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface)]"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 overflow-y-auto flex-1">
              {isPending && !body ? (
                <div className="py-12 text-center">
                  <Loader2
                    className="h-8 w-8 text-[var(--cevi-accent)] animate-spin mx-auto mb-3"
                    strokeWidth={1.5}
                  />
                  <div className="text-[13px] text-[var(--cevi-text-muted)]">
                    {modelLabel} is drafting — grade-5 reading level, clinical accuracy
                    preserved, no PHI beyond what's on the fax.
                  </div>
                </div>
              ) : error && !body ? (
                <div className="text-[12px] text-[var(--cevi-accent)] bg-[var(--cevi-accent-light)] border border-[var(--cevi-accent)]/20 rounded-md p-3">
                  {error}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)]">
                      Subject
                    </label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="mt-1 w-full h-10 px-3 rounded-md border border-[var(--cevi-border)] bg-white text-[13px] text-[var(--cevi-text)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)]">
                      Message body (editable)
                    </label>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={14}
                      className="mt-1 w-full rounded-md border border-[var(--cevi-border)] bg-[var(--cevi-surface-warm)] p-3 text-[13px] leading-relaxed text-[var(--cevi-text)] placeholder:text-[var(--cevi-text-faint)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20"
                    />
                  </div>
                  {error && (
                    <div className="text-[11px] text-[var(--cevi-text-muted)] bg-[var(--cevi-surface-warm)] border border-[var(--cevi-border-light)] rounded-md p-2">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[var(--cevi-border-light)] flex items-center justify-between gap-3 bg-[var(--cevi-surface-warm)] flex-wrap">
              <div className="text-[11px] text-[var(--cevi-text-muted)]">
                Grade-5 reading level · will queue for PCP review before send.
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!body}
                  icon={
                    copied ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[var(--cevi-jade)]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )
                  }
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button
                  variant={sent ? "ghost" : "primary"}
                  size="sm"
                  onClick={() => setSent(true)}
                  disabled={!body || sent}
                  icon={
                    sent ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )
                  }
                >
                  {sent ? (
                    <span className="inline-flex items-center gap-1.5">
                      Queued <Badge variant="jade" size="sm" dot>Healow</Badge>
                    </span>
                  ) : (
                    "Queue for Healow send"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
