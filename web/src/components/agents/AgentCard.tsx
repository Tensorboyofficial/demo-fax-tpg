import Link from "next/link";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { IconBox } from "@/components/ui/icon-box";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import type { AgentStat } from "@/lib/types";

type Tone = "accent" | "teal" | "jade" | "sand" | "amber" | "coral";

interface Props {
  agent: AgentStat;
  tone: Tone;
  icon: React.ReactNode;
  slug: string;
  spark: number[]; // 7 points (last 7 days counts)
}

function Sparkline({ data, tone }: { data: number[]; tone: Tone }) {
  const max = Math.max(...data, 1);
  const toneClass =
    tone === "accent"
      ? "fill-[var(--cevi-accent)]"
      : tone === "teal"
        ? "fill-[var(--cevi-teal)]"
        : tone === "jade"
          ? "fill-[var(--cevi-jade)]"
          : tone === "sand"
            ? "fill-[var(--cevi-sand)]"
            : tone === "amber"
              ? "fill-[var(--cevi-amber)]"
              : "fill-[var(--cevi-coral)]";
  const W = 120;
  const H = 36;
  const barW = W / data.length - 2;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-9" aria-hidden="true">
      {data.map((v, i) => {
        const h = Math.max(2, (v / max) * (H - 4));
        return (
          <rect
            key={i}
            x={i * (barW + 2)}
            y={H - h}
            width={barW}
            height={h}
            rx={1.5}
            className={toneClass}
            opacity={0.25 + (i / data.length) * 0.75}
          />
        );
      })}
    </svg>
  );
}

export function AgentCard({ agent, tone, icon, slug, spark }: Props) {
  return (
    <Link href={`/agents/${slug}`} className="block group">
      <Card
        hover
        padding="none"
        className="h-full transition-all duration-150 group-hover:shadow-[var(--shadow-sm)]"
      >
        <CardHeader className="flex items-start gap-3">
          <IconBox tone={tone}>{icon}</IconBox>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-[var(--cevi-text)] leading-tight">
              {agent.name}
            </div>
            <div className="text-[12px] text-[var(--cevi-text-muted)] mt-1 leading-snug">
              {agent.subtitle}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[var(--cevi-text-tertiary)]">
                Open
              </div>
              <div className="mt-1 font-serif text-[28px] leading-none text-[var(--cevi-text)]">
                {agent.openCount}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[var(--cevi-text-tertiary)]">
                7-day volume
              </div>
              <div className="mt-1 font-serif text-[28px] leading-none text-[var(--cevi-text)]">
                {agent.weeklyCount}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Sparkline data={spark} tone={tone} />
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Badge variant="success" size="sm">
              Avg {agent.avgTurnaround}
            </Badge>
            {agent.industryBaseline && (
              <span className="text-[11px] text-[var(--cevi-text-muted)]">
                vs industry {agent.industryBaseline}
              </span>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          {agent.savingsDollars ? (
            <div className="text-[12px] text-[var(--cevi-text-secondary)]">
              <span className="font-semibold text-[var(--cevi-text)]">
                ${agent.savingsDollars.toLocaleString()}
              </span>{" "}
              recovered this month
            </div>
          ) : (
            <div />
          )}
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--cevi-accent)] group-hover:gap-2 transition-all">
            Open queue
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
