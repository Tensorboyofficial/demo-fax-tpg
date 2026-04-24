import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Stat } from "@/frontend/components/ui/stat";
import { Badge, statusBadgeVariant, urgencyBadgeVariant } from "@/frontend/components/ui/badge";
import { ConfidenceMeter } from "@/frontend/components/composed/confidence-meter";
import { AgentHeaderActions } from "@/frontend/components/features/agent/agent-header-actions";
import { agentByKey } from "@/data/seed/agents";
import { faxes, getFaxesByAgent } from "@/data/seed/faxes";
import { getPatientById, patientFullName } from "@/data/seed/patients";
import { formatRelative, formatDob, cn } from "@/shared/utils";

const SLUG_TO_KEY: Record<string, "referrals" | "prior_auth" | "lab_results" | "rx_refills" | "records"> = {
  referrals: "referrals",
  "prior-auth": "prior_auth",
  "lab-results": "lab_results",
  "rx-refills": "rx_refills",
  records: "records",
};

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const key = SLUG_TO_KEY[slug];
  if (!key) notFound();
  const agent = agentByKey(key);
  if (!agent) notFound();

  const agentFaxes = getFaxesByAgent(key);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          All connected agents
        </Link>
      </div>

      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div className="max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] mb-2">
            Connected agent
          </div>
          <h1 className="font-serif text-[28px] leading-[1.2] tracking-[-0.02em] text-[var(--cevi-text)]">
            {agent.name}
          </h1>
          <p className="mt-2 text-[13px] text-[var(--cevi-text-muted)]">
            {agent.subtitle}
          </p>
        </div>
        <AgentHeaderActions agentKey={key} slug={slug} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="Open" value={agent.openCount} helper="queue right now" />
        <Stat label="7-day volume" value={agent.weeklyCount} helper="rolling" />
        <Stat
          label="Avg turnaround"
          value={agent.avgTurnaround}
          delta={agent.industryBaseline ? `industry ${agent.industryBaseline}` : undefined}
          deltaTone="neutral"
        />
        <Stat
          label="$ recovered"
          value={agent.savingsDollars ? `$${agent.savingsDollars.toLocaleString()}` : "—"}
          deltaTone="neutral"
          helper="this month"
        />
      </div>

      <div className="rounded-lg border border-[var(--cevi-border)] bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--cevi-border-light)] flex items-center justify-between">
          <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
            Queue — {agentFaxes.length} {agentFaxes.length === 1 ? "fax" : "faxes"}
          </div>
          <div className="text-[11px] text-[var(--cevi-text-muted)]">
            Filtered from {faxes.length} total inbound faxes
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--cevi-surface-warm)] text-left text-[10px] font-semibold text-[var(--cevi-text-tertiary)] uppercase tracking-[0.08em]">
              <th className="px-5 py-3">Received</th>
              <th className="px-5 py-3">Patient</th>
              <th className="px-5 py-3">From</th>
              <th className="px-5 py-3">Confidence</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Urgency</th>
              <th className="px-5 py-3 text-right">Summary</th>
            </tr>
          </thead>
          <tbody>
            {agentFaxes.map((f) => {
              const p = getPatientById(f.matchedPatientId);
              return (
                <tr
                  key={f.id}
                  className={cn(
                    "border-b border-[var(--cevi-border-light)] last:border-b-0 hover:bg-[var(--cevi-surface-warm)] transition-colors",
                  )}
                >
                  <td className="px-5 py-3 align-top">
                    <Link href={`/inbox/${f.id}`} className="block">
                      <div className="text-[12px] text-[var(--cevi-text)] font-medium">
                        {formatRelative(f.receivedAt)}
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3 align-top">
                    <Link href={`/inbox/${f.id}`} className="block">
                      <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                        {p ? patientFullName(p) : f.extracted.patientNameOnDoc ?? "Unmatched"}
                      </div>
                      {p && (
                        <div className="text-[11px] font-mono text-[var(--cevi-text-muted)]">
                          {p.mrn} · DOB {formatDob(p.dob)}
                        </div>
                      )}
                    </Link>
                  </td>
                  <td className="px-5 py-3 align-top">
                    <Link href={`/inbox/${f.id}`} className="block">
                      <div className="text-[12px] text-[var(--cevi-text-secondary)] line-clamp-1">
                        {f.fromOrg}
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-3 align-top">
                    <ConfidenceMeter value={f.matchConfidence} />
                  </td>
                  <td className="px-5 py-3 align-top">
                    <Badge variant={statusBadgeVariant(f.status)} size="sm" dot>
                      {f.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 align-top">
                    {f.urgency === "routine" ? (
                      <span className="text-[11px] text-[var(--cevi-text-muted)]">routine</span>
                    ) : (
                      <Badge variant={urgencyBadgeVariant(f.urgency)} size="sm" dot pulse={f.urgency === "critical"}>
                        {f.urgency}
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 align-top text-right">
                    <Link
                      href={`/inbox/${f.id}`}
                      className="text-[11px] text-[var(--cevi-text-secondary)] line-clamp-2 hover:text-[var(--cevi-text)]"
                    >
                      {f.extracted.summary ?? "—"}
                    </Link>
                  </td>
                </tr>
              );
            })}
            {agentFaxes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-[13px] text-[var(--cevi-text-muted)]">
                  No faxes currently in this queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
