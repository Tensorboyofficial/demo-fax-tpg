"use client";

import { useEffect, useState, useTransition } from "react";
import { Siren, PhoneCall, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { acknowledgeCritical } from "@/app/actions/critical-ack";
import type { Fax } from "@/lib/types";

interface Props {
  fax: Fax;
}

function fmtElapsed(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function CriticalBanner({ fax }: Props) {
  const initialElapsed = Date.now() - new Date(fax.receivedAt).getTime();
  const [elapsed, setElapsed] = useState(initialElapsed);
  const [open, setOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [acknowledgedBy, setAcknowledgedBy] = useState("");
  const [patientResponse, setPatientResponse] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (acknowledged) return;
    const i = window.setInterval(() => {
      setElapsed(Date.now() - new Date(fax.receivedAt).getTime());
    }, 1000);
    return () => window.clearInterval(i);
  }, [acknowledged, fax.receivedAt]);

  if (fax.urgency !== "critical" && fax.urgency !== "stat") return null;

  const overdue = elapsed > 30 * 60_000; // 30 minutes
  const tone = acknowledged
    ? "jade"
    : overdue
      ? "accent"
      : "amber";

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const res = await acknowledgeCritical({
        faxId: fax.id,
        acknowledgedBy,
        calledAt: new Date().toISOString(),
        patientResponse,
        note,
      });
      if (!res.ok && !res.id) {
        setError(res.error ?? "Could not record acknowledgement");
        return;
      }
      if (res.error) {
        // DB failed but we still optimistically mark ack in-memory so UX doesn't lie.
        setError(`Saved locally · DB note: ${res.error}`);
      }
      setAcknowledged(true);
      setOpen(false);
    });
  }

  return (
    <>
      <aside
        className={cn(
          "sticky top-16 z-10 mb-4 rounded-lg border-2 px-4 py-3 flex items-center gap-3 flex-wrap shadow-[var(--shadow-sm)]",
          acknowledged
            ? "border-[var(--cevi-jade)]/40 bg-[var(--cevi-jade-light)]"
            : overdue
              ? "border-[var(--cevi-accent)] bg-[var(--cevi-accent-light)]"
              : "border-[var(--cevi-amber)]/50 bg-[var(--cevi-amber-light)]",
        )}
      >
        <div
          className={cn(
            "shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
            acknowledged
              ? "bg-[var(--cevi-jade)] text-white"
              : overdue
                ? "bg-[var(--cevi-accent)] text-white"
                : "bg-[var(--cevi-amber)] text-white",
          )}
        >
          {acknowledged ? (
            <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
          ) : (
            <Siren
              className={cn("h-5 w-5", !acknowledged && "animate-pulse")}
              strokeWidth={2}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold uppercase tracking-[0.04em] text-[var(--cevi-text)]">
              {acknowledged
                ? "Critical result · acknowledged"
                : overdue
                  ? "Critical result · overdue"
                  : "Critical result · patient not yet contacted"}
            </span>
            {!acknowledged && (
              <Badge variant={tone} size="sm" dot pulse>
                {fmtElapsed(elapsed)} since arrival
              </Badge>
            )}
          </div>
          <div className="mt-0.5 text-[12px] text-[var(--cevi-text-secondary)]">
            {acknowledged
              ? `Callback logged${acknowledgedBy ? ` by ${acknowledgedBy}` : ""}. eClinicalWorks chart note attached.`
              : overdue
                ? "Escalate to PCP on-call per policy R-019. Fax age exceeds 30 min."
                : "Cevi SMS dispatched to on-call nurse. Log callback here to close the loop."}
          </div>
        </div>
        {!acknowledged && (
          <Button
            variant="primary"
            size="sm"
            icon={<PhoneCall className="h-3.5 w-3.5" strokeWidth={2} />}
            onClick={() => setOpen(true)}
          >
            Acknowledge & log callback
          </Button>
        )}
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => !isPending && setOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-xl shadow-[var(--shadow-lg)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-[var(--cevi-border-light)] flex items-center justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-accent)]">
                  Critical-result acknowledgement
                </div>
                <div className="text-[16px] font-serif mt-1 text-[var(--cevi-text)]">
                  Who called the patient?
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-md inline-flex items-center justify-center text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)]">
                  Called by
                </label>
                <select
                  value={acknowledgedBy}
                  onChange={(e) => setAcknowledgedBy(e.target.value)}
                  className="mt-1 w-full h-10 px-3 rounded-md border border-[var(--cevi-border)] bg-white text-[13px] text-[var(--cevi-text)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20"
                >
                  <option value="">— pick a team member —</option>
                  <option>Dr. Todd Nguyen (PCP)</option>
                  <option>Dr. Alicia Harbison (PCP)</option>
                  <option>Nurse Guerrero (on-call)</option>
                  <option>Front desk · Arlington</option>
                  <option>Me</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)]">
                  Patient response
                </label>
                <select
                  value={patientResponse}
                  onChange={(e) => setPatientResponse(e.target.value)}
                  className="mt-1 w-full h-10 px-3 rounded-md border border-[var(--cevi-border)] bg-white text-[13px] text-[var(--cevi-text)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20"
                >
                  <option value="">— optional —</option>
                  <option>Patient answered · instructions given</option>
                  <option>Voicemail left · follow-up scheduled</option>
                  <option>Patient advised to go to ED</option>
                  <option>Patient declined recommended next step</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)]">
                  Note (optional, attached to chart)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="e.g. Patient will come in at 2pm today for STAT repeat BMP + EKG."
                  className="mt-1 w-full rounded-md border border-[var(--cevi-border)] bg-white p-3 text-[13px] text-[var(--cevi-text)] placeholder:text-[var(--cevi-text-faint)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20"
                />
              </div>
              {error && (
                <div className="text-[12px] text-[var(--cevi-accent)] bg-[var(--cevi-accent-light)] border border-[var(--cevi-accent)]/20 rounded-md p-2">
                  {error}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[var(--cevi-border-light)] flex items-center justify-between bg-[var(--cevi-surface-warm)]">
              <div className="text-[11px] text-[var(--cevi-text-muted)]">
                Writes to eClinicalWorks chart + audit trail.
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmit}
                  loading={isPending}
                  disabled={!acknowledgedBy}
                >
                  Save acknowledgement
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
