import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GitBranch } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconBox } from "@/components/ui/icon-box";
import { WorkflowEditor } from "@/components/agents/WorkflowEditor";
import { agentByKey } from "@/data/agents";
import type { AgentKey } from "@/lib/types";

const SLUG_TO_KEY: Record<string, AgentKey> = {
  referrals: "referrals",
  "prior-auth": "prior_auth",
  "lab-results": "lab_results",
  "rx-refills": "rx_refills",
  records: "records",
};

export default async function WorkflowEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const key = SLUG_TO_KEY[slug];
  if (!key) notFound();
  const agent = agentByKey(key);
  if (!agent) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/agents/${slug}`}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          Back to {agent.name.split(" ")[0]} agent
        </Link>
      </div>

      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div className="max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] mb-2">
            Workflow editor
          </div>
          <h1 className="font-serif text-[28px] leading-[1.2] tracking-[-0.02em] text-[var(--cevi-text)]">
            {agent.name}
          </h1>
          <p className="mt-2 text-[13px] text-[var(--cevi-text-muted)]">
            Rules that run on every inbound fax classified to this agent. Toggle a rule
            off to send the case to manual review instead. Changes take effect
            immediately across all four clinics.
          </p>
        </div>
        <IconBox tone="teal" size="lg">
          <GitBranch className="h-6 w-6" strokeWidth={1.5} />
        </IconBox>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <WorkflowEditor agentKey={key} slug={slug} />

        <div className="space-y-4">
          <Card padding="none">
            <CardHeader>
              <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                Active window
              </div>
              <div className="text-[11px] text-[var(--cevi-text-muted)]">
                When this agent is allowed to auto-route
              </div>
            </CardHeader>
            <CardContent>
              <ul className="text-[12px] text-[var(--cevi-text-secondary)] space-y-2">
                <li className="flex items-center justify-between">
                  <span>Mon – Fri</span>
                  <Badge variant="jade" size="sm" dot>
                    7a – 7p
                  </Badge>
                </li>
                <li className="flex items-center justify-between">
                  <span>Saturday</span>
                  <Badge variant="amber" size="sm" dot>
                    9a – 1p
                  </Badge>
                </li>
                <li className="flex items-center justify-between">
                  <span>Sunday</span>
                  <Badge variant="outline" size="sm">
                    Queue only
                  </Badge>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <div className="text-[11px] text-[var(--cevi-text-muted)]">
                Out-of-window faxes wait for next business hour unless marked STAT /
                critical.
              </div>
            </CardFooter>
          </Card>

          <Card padding="none">
            <CardHeader>
              <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                Escalation chain
              </div>
              <div className="text-[11px] text-[var(--cevi-text-muted)]">
                If auto-route fails
              </div>
            </CardHeader>
            <CardContent>
              <ol className="text-[12px] text-[var(--cevi-text-secondary)] space-y-2 list-decimal ml-4">
                <li>Assigned triage nurse</li>
                <li>Clinic front-desk lead</li>
                <li>Operations manager (Arlington HQ)</li>
              </ol>
            </CardContent>
          </Card>

          <Card padding="none">
            <CardHeader>
              <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                Version
              </div>
              <div className="text-[11px] text-[var(--cevi-text-muted)]">
                Last change log
              </div>
            </CardHeader>
            <CardContent className="text-[11px] text-[var(--cevi-text-muted)] space-y-2">
              <div>
                <span className="font-mono text-[var(--cevi-text-secondary)]">v1.4</span>{" "}
                — Auto-confirm threshold raised to 90% (Apr 18)
              </div>
              <div>
                <span className="font-mono text-[var(--cevi-text-secondary)]">v1.3</span>{" "}
                — eCW write-back enabled (Apr 11)
              </div>
              <div>
                <span className="font-mono text-[var(--cevi-text-secondary)]">v1.2</span>{" "}
                — Critical SMS added (Apr 02)
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const key = SLUG_TO_KEY[slug];
  const agent = key ? agentByKey(key) : undefined;
  return {
    title: agent ? `${agent.name} · Workflow · Cevi` : "Workflow · Cevi",
  };
}
