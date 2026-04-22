"use client";

import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { IconBox } from "@/components/ui/icon-box";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { providers } from "@/data/providers";
import { agents } from "@/data/agents";
import { ArrowRight, Share2 } from "lucide-react";
import { useState } from "react";
import type { Fax } from "@/lib/types";

interface Props {
  fax: Fax;
}

function routeToLabel(routeTo: string | null): {
  primary: string;
  secondary: string;
} {
  if (!routeTo) return { primary: "Unassigned", secondary: "" };
  if (routeTo.startsWith("P-")) {
    const p = providers.find((x) => x.id === routeTo);
    if (!p) return { primary: routeTo, secondary: "" };
    return {
      primary: p.name,
      secondary: `${p.specialty} · ${p.clinic} clinic`,
    };
  }
  if (routeTo.startsWith("agent:")) {
    const a = agents.find((x) => x.key === routeTo.slice(6));
    if (!a) return { primary: routeTo, secondary: "" };
    return {
      primary: a.name,
      secondary: a.subtitle,
    };
  }
  return { primary: routeTo, secondary: "" };
}

export function RoutingCard({ fax }: Props) {
  const [sent, setSent] = useState(
    fax.status === "completed" || fax.status === "routed",
  );
  const labels = routeToLabel(fax.routedTo);

  const alternatives = [
    ...providers.map((p) => ({
      id: p.id,
      label: `${p.name.split(",")[0]} · ${p.clinic}`,
    })),
    ...agents.map((a) => ({
      id: `agent:${a.key}`,
      label: `${a.name} (agent)`,
    })),
  ];

  return (
    <Card padding="none">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <IconBox tone="accent" size="sm">
            <Share2 className="h-4 w-4" strokeWidth={1.5} />
          </IconBox>
          <div>
            <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
              Routing
            </div>
            <div className="text-[11px] text-[var(--cevi-text-muted)]">
              Auto-applied per workflow rule · override anytime
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-[var(--cevi-border)] p-3 bg-[var(--cevi-surface-warm)]">
          <div className="text-[11px] uppercase tracking-[0.06em] font-semibold text-[var(--cevi-text-tertiary)]">
            Routed to
          </div>
          <div className="mt-1 text-[14px] font-semibold text-[var(--cevi-text)]">
            {labels.primary}
          </div>
          {labels.secondary && (
            <div className="text-[12px] text-[var(--cevi-text-muted)]">
              {labels.secondary}
            </div>
          )}
        </div>
        {fax.routedReason && (
          <div className="mt-3 text-[12px] text-[var(--cevi-text-secondary)] leading-relaxed">
            <span className="font-semibold text-[var(--cevi-text)]">Why: </span>
            {fax.routedReason}
          </div>
        )}

        <div className="mt-4">
          <label className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)]">
            Override
          </label>
          <select
            defaultValue={fax.routedTo ?? ""}
            className="mt-1 w-full h-9 px-3 rounded-md border border-[var(--cevi-border)] bg-white text-[13px] text-[var(--cevi-text)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20"
          >
            {fax.routedTo === null && <option value="">— pick destination —</option>}
            {alternatives.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="text-[11px] text-[var(--cevi-text-muted)]">
          Notification will go via eClinicalWorks inbox + SMS if critical
        </div>
        {sent ? (
          <Badge variant="success" dot size="sm">
            Delivered
          </Badge>
        ) : (
          <Button
            variant="primary"
            size="sm"
            iconRight={<ArrowRight className="h-3.5 w-3.5" />}
            onClick={() => setSent(true)}
          >
            Send now
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
