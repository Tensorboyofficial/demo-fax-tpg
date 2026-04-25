"use client";

import { Card, CardHeader, CardContent } from "@/frontend/components/ui/card";
import { IconBox } from "@/frontend/components/ui/icon-box";
import {
  Inbox,
  ScanLine,
  Sparkles,
  UserCheck,
  FileOutput,
  Share2,
  BellRing,
  Database,
  AlertCircle,
  User,
  ScrollText,
} from "lucide-react";
import type { FaxEvent } from "@/shared/types";
import { formatDateTime, cn } from "@/shared/utils";
import { modelLabelFromId } from "@/shared/constants";

const KIND_META: Record<
  FaxEvent["kind"],
  { icon: React.ReactNode; label: string; tone: "accent" | "jade" | "teal" | "sand" | "amber" | "muted" }
> = {
  received: { icon: <Inbox className="h-3.5 w-3.5" strokeWidth={1.5} />, label: "Received", tone: "muted" },
  ocr: { icon: <ScanLine className="h-3.5 w-3.5" strokeWidth={1.5} />, label: "OCR", tone: "teal" },
  classified: { icon: <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />, label: "Classified", tone: "accent" },
  matched: { icon: <UserCheck className="h-3.5 w-3.5" strokeWidth={1.5} />, label: "Matched", tone: "jade" },
  extracted: { icon: <FileOutput className="h-3.5 w-3.5" strokeWidth={1.5} />, label: "Extracted", tone: "sand" },
  routed: { icon: <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} />, label: "Routed", tone: "accent" },
  notified: { icon: <BellRing className="h-3.5 w-3.5" strokeWidth={1.5} />, label: "Notified", tone: "amber" },
  written_back: { icon: <Database className="h-3.5 w-3.5" strokeWidth={1.5} />, label: "eCW write-back", tone: "jade" },
  human_override: { icon: <User className="h-3.5 w-3.5" strokeWidth={1.5} />, label: "Human action", tone: "accent" },
  flagged: { icon: <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.5} />, label: "Flagged", tone: "amber" },
};

interface Props {
  events: FaxEvent[];
}

export function AuditTimeline({ events }: Props) {
  const sorted = [...events].sort((a, b) => (a.at < b.at ? -1 : 1));

  return (
    <Card padding="none">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <IconBox tone="muted" size="sm">
            <ScrollText className="h-4 w-4" strokeWidth={1.5} />
          </IconBox>
          <div>
            <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
              Pipeline audit
            </div>
            <div className="text-[11px] text-[var(--cevi-text-muted)]">
              Every step timestamped for HIPAA + SOC 2
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="relative">
          {sorted.map((e, idx) => {
            const meta = KIND_META[e.kind];
            return (
              <li
                key={e.id}
                className={cn(
                  "flex items-start gap-3 relative pb-4 last:pb-0",
                )}
              >
                {idx < sorted.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[13px] top-7 bottom-0 w-px bg-[var(--cevi-border-light)]"
                  />
                )}
                <div
                  className={cn(
                    "shrink-0 w-7 h-7 rounded-full flex items-center justify-center relative z-10 border",
                    meta.tone === "accent" &&
                      "bg-[var(--cevi-accent-bg)] text-[var(--cevi-accent)] border-[var(--cevi-accent)]/20",
                    meta.tone === "jade" &&
                      "bg-[var(--cevi-jade-light)] text-[var(--cevi-jade)] border-[var(--cevi-jade)]/20",
                    meta.tone === "teal" &&
                      "bg-[var(--cevi-teal-light)] text-[var(--cevi-teal)] border-[var(--cevi-teal)]/20",
                    meta.tone === "sand" &&
                      "bg-[var(--cevi-sand-light)] text-[var(--cevi-sand)] border-[var(--cevi-sand)]/20",
                    meta.tone === "amber" &&
                      "bg-[var(--cevi-amber-light)] text-[var(--cevi-amber)] border-[var(--cevi-amber)]/20",
                    meta.tone === "muted" &&
                      "bg-[var(--cevi-surface)] text-[var(--cevi-text-muted)] border-[var(--cevi-border)]",
                  )}
                >
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-[12px] font-semibold text-[var(--cevi-text)] uppercase tracking-[0.04em]">
                      {meta.label}
                    </div>
                    <div className="text-[11px] text-[var(--cevi-text-muted)] tabular-nums">
                      {formatDateTime(e.at)}
                    </div>
                  </div>
                  <div className="mt-0.5 text-[12px] text-[var(--cevi-text-secondary)]">
                    {e.detail}
                  </div>
                  {(e.model || typeof e.latencyMs === "number") && (
                    <div className="mt-1 text-[11px] text-[var(--cevi-text-muted)] inline-flex items-center gap-2">
                      {e.model && (
                        <span className="font-semibold text-[var(--cevi-text-secondary)]">
                          {modelLabelFromId(e.model)}
                        </span>
                      )}
                      {typeof e.latencyMs === "number" && (
                        <span>· {(e.latencyMs / 1000).toFixed(1)}s</span>
                      )}
                      {typeof e.tokensOut === "number" && (
                        <span>
                          · {e.tokensIn}→{e.tokensOut} tokens
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
