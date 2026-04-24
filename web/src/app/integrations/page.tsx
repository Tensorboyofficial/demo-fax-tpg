import { Card, CardHeader, CardContent, CardFooter } from "@/frontend/components/ui/card";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { IconBox } from "@/frontend/components/ui/icon-box";
import { integrations } from "@/data/seed/integrations";
import { Plug, CheckCircle2, CircleDashed } from "lucide-react";
import type { Integration } from "@/shared/types";

export const metadata = {
  title: "Integrations · Cevi",
};

const CATEGORY_LABELS: Record<Integration["category"], string> = {
  EHR: "EHR",
  Scheduling: "Scheduling",
  Telehealth: "Telehealth",
  Billing: "Billing & revenue",
  Pharmacy: "Pharmacy",
  Labs: "Labs",
  Messaging: "Messaging",
};

const CATEGORY_TONE: Record<Integration["category"], "accent" | "teal" | "jade" | "sand" | "amber" | "coral"> = {
  EHR: "accent",
  Scheduling: "teal",
  Telehealth: "jade",
  Billing: "sand",
  Pharmacy: "coral",
  Labs: "jade",
  Messaging: "amber",
};

function IntegrationCard({ integration }: { integration: Integration }) {
  return (
    <Card padding="none" hover>
      <CardHeader className="flex items-start gap-3">
        <IconBox tone={CATEGORY_TONE[integration.category]}>
          <span className="font-serif text-[18px] leading-none">
            {integration.logoInitial}
          </span>
        </IconBox>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-[var(--cevi-text)]">
            {integration.name}
          </div>
          <div className="text-[11px] text-[var(--cevi-text-muted)] uppercase tracking-[0.06em]">
            {CATEGORY_LABELS[integration.category]}
          </div>
        </div>
        {integration.connected ? (
          <Badge variant="jade" dot size="sm">
            Connected
          </Badge>
        ) : (
          <Badge variant="outline" size="sm">
            Available
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-[12px] text-[var(--cevi-text-secondary)] leading-snug min-h-[42px]">
          {integration.note ?? ""}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="text-[11px] text-[var(--cevi-text-muted)] inline-flex items-center gap-1.5">
          {integration.connected ? (
            <>
              <CheckCircle2 className="h-3 w-3 text-[var(--cevi-jade)]" strokeWidth={2} />
              Last sync {integration.last_sync}
            </>
          ) : (
            <>
              <CircleDashed className="h-3 w-3" strokeWidth={1.5} />
              Not connected
            </>
          )}
        </div>
        <Button variant={integration.connected ? "ghost" : "secondary"} size="sm">
          {integration.connected ? "Manage" : "Connect"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function IntegrationsPage() {
  const connected = integrations.filter((i) => i.connected);
  const available = integrations.filter((i) => !i.connected);

  return (
    <div>
      <div className="mb-8 max-w-2xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] mb-2">
          Integrations
        </div>
        <h1 className="font-serif text-[32px] leading-[1.1] tracking-[-0.02em] text-[var(--cevi-text)]">
          Works with what you already run.
        </h1>
        <p className="mt-3 text-[14px] text-[var(--cevi-text-muted)]">
          eClinicalWorks is your source of truth. Cevi syncs your patient directory every
          60 seconds, writes faxes straight to the chart, and kicks downstream workflows
          via Healow, Availity, and your lab vendors. 148+ integrations available — these
          are the ones live for Transcend Medical Group today.
        </p>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <IconBox tone="jade" size="sm">
            <Plug className="h-4 w-4" strokeWidth={1.5} />
          </IconBox>
          <div>
            <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
              Live for your tenant
            </div>
            <div className="text-[11px] text-[var(--cevi-text-muted)]">
              {connected.length} connections, synced continuously
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {connected.map((i) => (
            <IntegrationCard key={i.id} integration={i} />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <IconBox tone="muted" size="sm">
            <CircleDashed className="h-4 w-4" strokeWidth={1.5} />
          </IconBox>
          <div>
            <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
              Available to enable
            </div>
            <div className="text-[11px] text-[var(--cevi-text-muted)]">
              One-click activation, BAA on file
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {available.map((i) => (
            <IntegrationCard key={i.id} integration={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
