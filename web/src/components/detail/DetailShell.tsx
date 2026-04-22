"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Flag, Copy } from "lucide-react";
import { Badge, statusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FaxPreview } from "./FaxPreview";
import { ClassificationCard } from "./ClassificationCard";
import { PatientMatchCard } from "./PatientMatchCard";
import { ExtractedFields } from "./ExtractedFields";
import { RoutingCard } from "./RoutingCard";
import { AuditTimeline } from "./AuditTimeline";
import { CriticalBanner } from "./CriticalBanner";
import { PatientMessageButton } from "./PatientMessageButton";
import { classifyFax, type ClassifyResult } from "@/app/actions/classify";
import type { Fax, FaxEvent, FaxType, Urgency } from "@/lib/types";
import { MODEL_LABELS, type ModelTier } from "@/lib/claude";

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
  const initialTier: ModelTier =
    TIER_BY_MODEL_ID[fax.modelUsed ?? ""] ?? "smart";

  const [type, setType] = useState<FaxType>(fax.type);
  const [confidence, setConfidence] = useState(fax.typeConfidence);
  const [urgency, setUrgency] = useState<Urgency>(fax.urgency);
  const [fields, setFields] = useState(fax.extracted);
  const [aiSummary, setAiSummary] = useState<string | undefined>(
    fax.extracted.summary,
  );
  const [tier, setTier] = useState<ModelTier>(initialTier);
  const [modelLabel, setModelLabel] = useState(MODEL_LABELS[initialTier]);
  const [latencyMs, setLatencyMs] = useState<number | undefined>();
  const [tokensIn, setTokensIn] = useState<number | undefined>();
  const [tokensOut, setTokensOut] = useState<number | undefined>();
  const [cacheRead, setCacheRead] = useState<number | undefined>();
  const [events, setEvents] = useState<FaxEvent[]>(initialEvents);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleReclassify(nextTier: ModelTier) {
    setError(null);
    setTier(nextTier);
    startTransition(async () => {
      const res: ClassifyResult | Awaited<ReturnType<typeof classifyFax>> =
        await classifyFax(fax.id, nextTier);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setType(res.type);
      setConfidence(res.typeConfidence);
      setUrgency(res.urgency);
      setFields(res.extracted);
      setAiSummary(res.aiSummary);
      setModelLabel(res.modelLabel);
      setLatencyMs(res.latencyMs);
      setTokensIn(res.tokensIn);
      setTokensOut(res.tokensOut);
      setCacheRead(res.cachedInputTokens);

      // Append a new event to the timeline
      const now = new Date().toISOString();
      setEvents((prev) => [
        ...prev,
        {
          id: `${fax.id}:live-${Date.now()}`,
          faxId: fax.id,
          at: now,
          kind: "classified",
          actor: "claude",
          detail: `Re-classified live by user · ${res.modelLabel}`,
          model: res.model,
          latencyMs: res.latencyMs,
          tokensIn: res.tokensIn,
          tokensOut: res.tokensOut,
        },
      ]);
    });
  }

  return (
    <div>
      {/* Breadcrumb + header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link
            href="/inbox"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            Back to inbox
          </Link>
          <h1 className="mt-2 font-serif text-[26px] leading-[1.2] tracking-[-0.02em] text-[var(--cevi-text)]">
            {fax.fromOrg}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-[12px] text-[var(--cevi-text-muted)]">
            <span className="font-mono">{fax.id}</span>
            <span>·</span>
            <span>{fax.pages} pages</span>
            <span>·</span>
            <span>{fax.toClinic} clinic</span>
            <span>·</span>
            <Badge variant={statusBadgeVariant(fax.status)} size="sm" dot>
              {fax.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PatientMessageButton fax={fax} />
          <Button
            variant="ghost"
            size="sm"
            icon={<Copy className="h-3.5 w-3.5" strokeWidth={1.5} />}
          >
            Copy link
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Printer className="h-3.5 w-3.5" strokeWidth={1.5} />}
          >
            Print
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<Flag className="h-3.5 w-3.5" strokeWidth={1.5} />}
          >
            Flag for QA
          </Button>
        </div>
      </div>

      <CriticalBanner fax={fax} />

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,520px)_minmax(0,1fr)] gap-6">
        <div className="order-2 xl:order-1">
          <FaxPreview fax={fax} />
        </div>
        <div className="order-1 xl:order-2 space-y-4">
          <ClassificationCard
            type={type}
            confidence={confidence}
            urgency={urgency}
            modelLabel={modelLabel}
            tier={tier}
            isRunning={isPending}
            onReclassify={handleReclassify}
            latencyMs={latencyMs}
            tokensIn={tokensIn}
            tokensOut={tokensOut}
            cacheRead={cacheRead}
          />
          {error && (
            <div className="rounded-md border border-[var(--cevi-accent)]/20 bg-[var(--cevi-accent-light)] p-3 text-[12px] text-[var(--cevi-accent)]">
              Claude call failed: {error}. Showing last stable extraction.
            </div>
          )}
          <PatientMatchCard fax={fax} />
          <ExtractedFields
            fields={fields}
            modelLabel={modelLabel}
            aiSummary={aiSummary}
            latencyMs={latencyMs}
          />
          <RoutingCard fax={fax} />
          <AuditTimeline events={events} />
        </div>
      </div>
    </div>
  );
}
