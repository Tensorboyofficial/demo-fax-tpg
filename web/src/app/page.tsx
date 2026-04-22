import Link from "next/link";
import { Stat } from "@/components/ui/stat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { IconBox } from "@/components/ui/icon-box";
import { ThroughputChart } from "@/components/home/ThroughputChart";
import { ActivityFeed } from "@/components/home/ActivityFeed";
import { faxes, buildAuditEvents } from "@/data/faxes";
import { agents } from "@/data/agents";
import { ArrowRight, Activity, Stethoscope, ShieldCheck, FlaskConical, Pill, FileText } from "lucide-react";

const AGENT_UI: Record<
  string,
  { slug: string; tone: "accent" | "teal" | "jade" | "sand" | "amber" | "coral"; icon: React.ReactNode }
> = {
  referrals: { slug: "referrals", tone: "teal", icon: <Stethoscope className="h-4 w-4" strokeWidth={1.5} /> },
  prior_auth: { slug: "prior-auth", tone: "amber", icon: <ShieldCheck className="h-4 w-4" strokeWidth={1.5} /> },
  lab_results: { slug: "lab-results", tone: "jade", icon: <FlaskConical className="h-4 w-4" strokeWidth={1.5} /> },
  rx_refills: { slug: "rx-refills", tone: "coral", icon: <Pill className="h-4 w-4" strokeWidth={1.5} /> },
  records: { slug: "records", tone: "sand", icon: <FileText className="h-4 w-4" strokeWidth={1.5} /> },
};

export default function HomePage() {
  const today = faxes.filter((f) => {
    const d = new Date(f.receivedAt);
    const now = new Date("2026-04-23T14:32:00Z");
    return d.toDateString() === now.toDateString();
  });
  const autoRoutedRate = today.length
    ? Math.round(
        (today.filter((f) => f.status === "auto_routed" || f.status === "completed").length /
          today.length) *
          100,
      )
    : 0;

  const throughput = [
    { label: "Thu", value: 187 },
    { label: "Fri", value: 204 },
    { label: "Sat", value: 62 },
    { label: "Sun", value: 58 },
    { label: "Mon", value: 216 },
    { label: "Tue", value: 198 },
    { label: "Wed", value: today.length, isToday: true },
  ];

  const events = buildAuditEvents();

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] mb-2">
            Thursday, April 23 · 4 clinics · Arlington HQ
          </div>
          <h1 className="font-serif text-[36px] leading-[1.05] tracking-[-0.02em] text-[var(--cevi-text)]">
            Good morning, Texas Physicians.
          </h1>
          <p className="mt-2 text-[14px] text-[var(--cevi-text-muted)] max-w-2xl">
            {today.length} new faxes since midnight — {autoRoutedRate}% auto-routed, 1
            critical lab SMS already dispatched, $1,840 in prior-auth revenue recovered
            this week.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary">Export weekly report</Button>
          <Link href="/inbox">
            <Button variant="primary" iconRight={<ArrowRight className="h-3.5 w-3.5" />}>
              Open inbox
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Faxes today"
          value={today.length}
          delta="+3"
          deltaTone="positive"
          helper="vs yesterday"
        />
        <Stat
          label="Auto-routed"
          value={`${autoRoutedRate}%`}
          delta="+4 pts"
          deltaTone="positive"
          helper="no human touch"
        />
        <Stat
          label="PA turnaround"
          value="1.8d"
          delta="−3.2d"
          deltaTone="positive"
          helper="industry 5d"
        />
        <Stat
          label="Hours saved"
          value="127"
          delta="+12"
          deltaTone="positive"
          helper="this month"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <IconBox tone="accent" size="sm">
                  <Activity className="h-4 w-4" strokeWidth={1.5} />
                </IconBox>
                <div>
                  <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                    Weekly throughput
                  </div>
                  <div className="text-[11px] text-[var(--cevi-text-muted)]">
                    Volume processed, last 7 days
                  </div>
                </div>
              </div>
              <Badge variant="jade" size="sm" dot>
                Healthy
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ThroughputChart data={throughput} />
          </CardContent>
        </Card>

        <Card padding="none">
          <CardHeader>
            <div>
              <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                Activity feed
              </div>
              <div className="text-[11px] text-[var(--cevi-text-muted)]">
                Every event, fully auditable
              </div>
            </div>
          </CardHeader>
          <CardContent className="!py-2">
            <ActivityFeed events={events} limit={8} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)]">
              Connected Agents
            </div>
            <h2 className="mt-1 font-serif text-[22px] text-[var(--cevi-text)] leading-tight">
              Every fax triggers downstream automation.
            </h2>
          </div>
          <Link
            href="/agents"
            className="text-[12px] font-semibold text-[var(--cevi-accent)] hover:underline inline-flex items-center gap-1"
          >
            See all agents <ArrowRight className="h-3 w-3" strokeWidth={2} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {agents.map((a) => {
            const ui = AGENT_UI[a.key];
            return (
              <Link
                key={a.key}
                href={`/agents/${ui.slug}`}
                className="group"
              >
                <Card hover padding="md" className="h-full">
                  <div className="flex items-center gap-2.5 mb-3">
                    <IconBox tone={ui.tone} size="sm">
                      {ui.icon}
                    </IconBox>
                    <div className="text-[12px] font-semibold text-[var(--cevi-text)] line-clamp-2 leading-tight">
                      {a.name.split(" ").slice(0, 3).join(" ")}
                    </div>
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] font-semibold">
                    Open
                  </div>
                  <div className="mt-0.5 font-serif text-[22px] leading-none text-[var(--cevi-text)]">
                    {a.openCount}
                  </div>
                  <div className="mt-2 text-[11px] text-[var(--cevi-text-muted)]">
                    Avg {a.avgTurnaround}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
