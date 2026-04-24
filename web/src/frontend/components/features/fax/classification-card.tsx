"use client";

import { Card, CardHeader, CardContent, CardFooter } from "@/frontend/components/ui/card";
import { IconBox } from "@/frontend/components/ui/icon-box";
import { Button } from "@/frontend/components/ui/button";
import {
  Badge,
  typeBadgeVariant,
  urgencyBadgeVariant,
} from "@/frontend/components/ui/badge";
import { ConfidenceMeter } from "@/frontend/components/composed/confidence-meter";
import { Sparkles, Zap } from "lucide-react";
import type { FaxType, Urgency } from "@/shared/types";

const TYPE_LABELS: Record<FaxType, string> = {
  referral: "Inbound referral",
  lab_result: "Lab result",
  prior_auth: "Prior authorization",
  records_request: "Medical records request",
  rx_refill: "Prescription refill",
  specialist_consult: "Specialist consultation",
  imaging_report: "Imaging report",
  unknown: "Unclassified",
};

type Tier = "fast" | "smart" | "premium";

interface Props {
  type: FaxType;
  confidence: number;
  urgency: Urgency;
  modelLabel: string;
  tier: Tier;
  isRunning: boolean;
  onReclassify: (tier: Tier) => void;
  latencyMs?: number;
  tokensIn?: number;
  tokensOut?: number;
  cacheRead?: number;
}

export function ClassificationCard({
  type,
  confidence,
  urgency,
  modelLabel,
  tier,
  isRunning,
  onReclassify,
  latencyMs,
  tokensIn,
  tokensOut,
  cacheRead,
}: Props) {
  return (
    <Card padding="none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <IconBox tone="accent" size="sm">
              <Sparkles className="h-4 w-4" strokeWidth={1.5} />
            </IconBox>
            <div>
              <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                Classification
              </div>
              <div className="text-[11px] text-[var(--cevi-text-muted)]">
                {modelLabel}
                {latencyMs && ` · ${(latencyMs / 1000).toFixed(1)}s`}
              </div>
            </div>
          </div>
          <Badge variant={urgencyBadgeVariant(urgency)} size="sm" dot>
            {urgency}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Badge variant={typeBadgeVariant(type)} size="md">
              {TYPE_LABELS[type]}
            </Badge>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[var(--cevi-text-tertiary)] mb-1">
              Confidence
            </div>
            <ConfidenceMeter value={confidence} />
          </div>
        </div>

        {(tokensIn !== undefined || cacheRead !== undefined) && (
          <div className="mt-3 p-2.5 rounded-md bg-[var(--cevi-surface-warm)] text-[11px] text-[var(--cevi-text-muted)] flex items-center justify-between flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-[var(--cevi-amber)]" strokeWidth={1.5} />
              Tokens{" "}
              <span className="font-mono text-[var(--cevi-text-secondary)]">
                {tokensIn}
                {tokensOut ? `→${tokensOut}` : ""}
              </span>
            </span>
            {cacheRead ? (
              <span>
                Cached{" "}
                <span className="font-mono text-[var(--cevi-success)]">
                  {cacheRead}
                </span>
              </span>
            ) : null}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[11px] text-[var(--cevi-text-muted)]">
          Not quite right? Re-check live with Cevi AI.
        </div>
        <Button
          variant="outline"
          size="sm"
          loading={isRunning}
          disabled={isRunning}
          onClick={() => onReclassify("premium")}
          icon={<Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />}
        >
          Re-check with Cevi AI
        </Button>
      </CardFooter>
    </Card>
  );
}
