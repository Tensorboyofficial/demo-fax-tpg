import { AgentCard } from "@/frontend/components/features/agent/agent-card";
import { Stat } from "@/frontend/components/ui/stat";
import { agents } from "@/data/seed/agents";
import { Stethoscope, ShieldCheck, FlaskConical, Pill, FileText } from "lucide-react";

export const metadata = {
  title: "Connected Agents · Cevi",
};

// Tone + icon + synthetic sparkline data per agent — deterministic
const META: Record<
  string,
  { slug: string; tone: "accent" | "teal" | "jade" | "sand" | "amber" | "coral"; icon: React.ReactNode; spark: number[] }
> = {
  referrals: {
    slug: "referrals",
    tone: "teal",
    icon: <Stethoscope className="h-5 w-5" strokeWidth={1.5} />,
    spark: [8, 12, 9, 14, 11, 13, 14],
  },
  prior_auth: {
    slug: "prior-auth",
    tone: "amber",
    icon: <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />,
    spark: [6, 9, 10, 7, 11, 8, 12],
  },
  lab_results: {
    slug: "lab-results",
    tone: "jade",
    icon: <FlaskConical className="h-5 w-5" strokeWidth={1.5} />,
    spark: [48, 52, 58, 55, 61, 59, 61],
  },
  rx_refills: {
    slug: "rx-refills",
    tone: "coral",
    icon: <Pill className="h-5 w-5" strokeWidth={1.5} />,
    spark: [32, 35, 28, 40, 36, 38, 38],
  },
  records: {
    slug: "records",
    tone: "sand",
    icon: <FileText className="h-5 w-5" strokeWidth={1.5} />,
    spark: [18, 22, 19, 24, 21, 23, 22],
  },
};

export default function AgentsPage() {
  const totalOpen = agents.reduce((s, a) => s + a.openCount, 0);
  const totalWeekly = agents.reduce((s, a) => s + a.weeklyCount, 0);
  const totalSavings = agents.reduce((s, a) => s + (a.savingsDollars ?? 0), 0);

  return (
    <div>
      <div className="mb-10 max-w-3xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] mb-2">
          Connected Agents
        </div>
        <h1 className="font-serif text-[32px] leading-[1.1] tracking-[-0.02em] text-[var(--cevi-text)]">
          Classification is the starting line.
        </h1>
        <p className="mt-3 text-[14px] text-[var(--cevi-text-muted)] leading-relaxed">
          Every classified fax kicks off a downstream workflow with its own SLA, audit
          trail, and eClinicalWorks write-back. These are the five agents live for Texas
          Physicians Group today. Click any card to see its queue.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <Stat
          label="Open across all agents"
          value={totalOpen}
          delta="−6 vs yesterday"
          deltaTone="positive"
          helper="SLA healthy"
        />
        <Stat
          label="Handled this week"
          value={totalWeekly}
          delta="+18%"
          deltaTone="positive"
          helper="rolling 7-day"
        />
        <Stat
          label="Revenue recovered"
          value={`$${totalSavings.toLocaleString()}`}
          delta="this month"
          deltaTone="neutral"
          helper="prior-auth + referral leakage"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {agents.map((a) => {
          const m = META[a.key];
          return (
            <AgentCard
              key={a.key}
              agent={a}
              tone={m.tone}
              icon={m.icon}
              slug={m.slug}
              spark={m.spark}
            />
          );
        })}
      </div>
    </div>
  );
}
