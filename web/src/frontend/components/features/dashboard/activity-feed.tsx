import Link from "next/link";
import { Sparkles, UserCheck, Share2, Database, Inbox, AlertCircle } from "lucide-react";
import { faxes } from "@/data/seed/faxes";
import { getPatientById, patientFullName } from "@/data/seed/patients";
import type { FaxEvent } from "@/shared/types";
import { formatRelative, cn } from "@/shared/utils";

const KIND_ICON: Record<
  FaxEvent["kind"],
  { icon: React.ReactNode; tone: string }
> = {
  received: { icon: <Inbox className="h-3 w-3" strokeWidth={1.5} />, tone: "text-[var(--cevi-text-muted)]" },
  ocr: { icon: <Sparkles className="h-3 w-3" strokeWidth={1.5} />, tone: "text-[var(--cevi-teal)]" },
  classified: { icon: <Sparkles className="h-3 w-3" strokeWidth={1.5} />, tone: "text-[var(--cevi-accent)]" },
  matched: { icon: <UserCheck className="h-3 w-3" strokeWidth={1.5} />, tone: "text-[var(--cevi-jade)]" },
  extracted: { icon: <Sparkles className="h-3 w-3" strokeWidth={1.5} />, tone: "text-[var(--cevi-sand)]" },
  routed: { icon: <Share2 className="h-3 w-3" strokeWidth={1.5} />, tone: "text-[var(--cevi-accent)]" },
  notified: { icon: <Share2 className="h-3 w-3" strokeWidth={1.5} />, tone: "text-[var(--cevi-amber)]" },
  written_back: { icon: <Database className="h-3 w-3" strokeWidth={1.5} />, tone: "text-[var(--cevi-jade)]" },
  human_override: { icon: <UserCheck className="h-3 w-3" strokeWidth={1.5} />, tone: "text-[var(--cevi-accent)]" },
  flagged: { icon: <AlertCircle className="h-3 w-3" strokeWidth={1.5} />, tone: "text-[var(--cevi-amber)]" },
};

export function ActivityFeed({ events, limit = 10 }: { events: FaxEvent[]; limit?: number }) {
  const recent = events.slice(0, limit);
  return (
    <ul className="space-y-0.5">
      {recent.map((e) => {
        const fax = faxes.find((f) => f.id === e.faxId);
        const patient = fax ? getPatientById(fax.matchedPatientId) : undefined;
        const meta = KIND_ICON[e.kind];
        return (
          <li
            key={e.id}
            className="group"
          >
            <Link
              href={`/inbox/${e.faxId}`}
              className="flex items-start gap-3 px-3 py-2 rounded-md hover:bg-[var(--cevi-surface-warm)] transition-colors"
            >
              <div
                className={cn(
                  "shrink-0 w-6 h-6 rounded-full bg-[var(--cevi-surface)] flex items-center justify-center border border-[var(--cevi-border)]",
                  meta.tone,
                )}
              >
                {meta.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-[var(--cevi-text)] truncate">
                  <span className="font-semibold capitalize">{e.kind.replace("_", " ")}</span>{" "}
                  <span className="text-[var(--cevi-text-muted)]">· {e.detail}</span>
                </div>
                <div className="text-[11px] text-[var(--cevi-text-muted)]">
                  {patient ? patientFullName(patient) : fax?.fromOrg ?? e.faxId} · {formatRelative(e.at)}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
