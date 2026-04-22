import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { IconBox } from "@/components/ui/icon-box";
import { Inbox, ScanLine, Tags, UserSearch, Share2, Database } from "lucide-react";

const STEPS: Array<{
  title: string;
  detail: string;
  icon: React.ReactNode;
  tone: "accent" | "teal" | "jade" | "sand" | "amber" | "coral";
}> = [
  {
    title: "Receive",
    detail: "Fax lands in your virtual inbox. Cevi picks it up in under 30 seconds.",
    icon: <Inbox className="h-4 w-4" strokeWidth={1.5} />,
    tone: "accent",
  },
  {
    title: "Read",
    detail: "OCR turns the TIFF or PDF into text, including handwritten forms.",
    icon: <ScanLine className="h-4 w-4" strokeWidth={1.5} />,
    tone: "teal",
  },
  {
    title: "Tag",
    detail: "Classify as lab, imaging, consult, referral, prior auth, EOB, records, or DME.",
    icon: <Tags className="h-4 w-4" strokeWidth={1.5} />,
    tone: "sand",
  },
  {
    title: "Match",
    detail: "Find the right patient by name + DOB + MRN against your eCW roster.",
    icon: <UserSearch className="h-4 w-4" strokeWidth={1.5} />,
    tone: "jade",
  },
  {
    title: "Route",
    detail: "Send to the ordering provider's inbox. Critical values page the on-call.",
    icon: <Share2 className="h-4 w-4" strokeWidth={1.5} />,
    tone: "amber",
  },
  {
    title: "Write to chart",
    detail: "Attach to the patient chart in eClinicalWorks with the correct tag.",
    icon: <Database className="h-4 w-4" strokeWidth={1.5} />,
    tone: "coral",
  },
];

export function HowItWorks() {
  return (
    <Card padding="none">
      <CardHeader>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)]">
            How Cevi handles every fax
          </div>
          <h2 className="mt-1 font-serif text-[22px] leading-tight text-[var(--cevi-text)]">
            Read. Tag. Match. Route. Write.
          </h2>
          <p className="mt-1 text-[12px] text-[var(--cevi-text-muted)]">
            The pipeline that replaces the manual hand-download. Same six steps,
            every time, audited.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex items-start gap-3 rounded-md border border-[var(--cevi-border-light)] bg-[var(--cevi-surface-warm)] p-3"
            >
              <IconBox tone={step.tone} size="sm">
                {step.icon}
              </IconBox>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-semibold tabular-nums text-[var(--cevi-text-tertiary)]">
                    0{i + 1}
                  </span>
                  <span className="text-[13px] font-semibold text-[var(--cevi-text)]">
                    {step.title}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-[var(--cevi-text-muted)] leading-snug">
                  {step.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
