import Link from "next/link";
import { ArrowRight, Receipt } from "lucide-react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { IconBox } from "@/components/ui/icon-box";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Paper EOB · Cevi",
};

export default function EobPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[40px] leading-[1.05] tracking-[-0.02em] text-[var(--cevi-text)]">
          Paper EOB
        </h1>
        <div className="mt-2 text-[13px] text-[var(--cevi-text-muted)]">
          Scan a paper EOB and Cevi extracts every claim line — ready for your
          biller to post.
        </div>
      </div>

      <Link href="/upload" className="block">
        <Card padding="md" hover>
          <div className="flex items-center gap-4 flex-wrap">
            <IconBox tone="sand">
              <Receipt className="h-5 w-5" strokeWidth={1.5} />
            </IconBox>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-[var(--cevi-text)]">
                Open the uploader and switch to EOB mode
              </div>
              <div className="mt-0.5 text-[12px] text-[var(--cevi-text-muted)]">
                EOB extraction lives alongside fax upload. Pick the &ldquo;A paper
                EOB&rdquo; tab to try it.
              </div>
            </div>
            <Badge variant="jade" size="sm">
              New
            </Badge>
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--cevi-accent)]">
              Open uploader
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
          </div>
        </Card>
      </Link>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="md">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)]">
            Processed this month
          </div>
          <div className="mt-2 font-serif text-[28px] leading-none text-[var(--cevi-text)] tabular-nums">
            47
          </div>
          <div className="mt-2 text-[12px] text-[var(--cevi-text-muted)]">
            EOBs · 214 claim lines
          </div>
        </Card>
        <Card padding="md">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)]">
            Average time saved
          </div>
          <div className="mt-2 font-serif text-[28px] leading-none text-[var(--cevi-text)] tabular-nums">
            14m
          </div>
          <div className="mt-2 text-[12px] text-[var(--cevi-text-muted)]">
            Per EOB vs hand-keying
          </div>
        </Card>
        <Card padding="md">
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)]">
            Denials flagged
          </div>
          <div className="mt-2 font-serif text-[28px] leading-none text-[var(--cevi-text)] tabular-nums">
            8
          </div>
          <div className="mt-2 text-[12px] text-[var(--cevi-text-muted)]">
            Ready for appeal workflow
          </div>
        </Card>
      </div>
    </div>
  );
}
