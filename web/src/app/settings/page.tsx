import { Card, CardHeader, CardContent } from "@/frontend/components/ui/card";
import { IconBox } from "@/frontend/components/ui/icon-box";
import { Badge } from "@/frontend/components/ui/badge";
import { Settings as SettingsIcon, ShieldCheck, Bell, Users, Lock } from "lucide-react";

export const metadata = {
  title: "Settings · Cevi",
};

const CARDS = [
  {
    tone: "accent" as const,
    icon: <Users className="h-4 w-4" strokeWidth={1.5} />,
    title: "Team & roles",
    body: "Invite front-desk, nurses, and providers. Role-based access to faxes, queues, and PHI.",
    cta: "4 members · Admin (you)",
  },
  {
    tone: "teal" as const,
    icon: <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />,
    title: "Classification thresholds",
    body: "Tune per-type confidence thresholds. Default: 80% type, 90% patient match. Below → review queue.",
    cta: "Defaults applied",
  },
  {
    tone: "amber" as const,
    icon: <Bell className="h-4 w-4" strokeWidth={1.5} />,
    title: "Notifications",
    body: "Who gets pinged when a STAT or CRITICAL fax lands. SMS via Twilio, email, eClinicalWorks inbox.",
    cta: "2 recipients",
  },
  {
    tone: "jade" as const,
    icon: <Lock className="h-4 w-4" strokeWidth={1.5} />,
    title: "Compliance",
    body: "BAA on file · SOC 2 Type II (2025) · HIPAA §164.312(b) audit controls enforced.",
    cta: "All controls green",
  },
];

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] mb-2">
            Settings
          </div>
          <h1 className="font-serif text-[32px] leading-[1.1] tracking-[-0.02em] text-[var(--cevi-text)]">
            Tune it to your clinic.
          </h1>
          <p className="mt-3 text-[14px] text-[var(--cevi-text-muted)] max-w-xl">
            Thresholds, notifications, users, and compliance — all one click away. Full
            surface is configured during onboarding; this is the read-only preview.
          </p>
        </div>
        <IconBox tone="muted" size="lg">
          <SettingsIcon className="h-6 w-6" strokeWidth={1.5} />
        </IconBox>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CARDS.map((c) => (
          <Card key={c.title} padding="none">
            <CardHeader className="flex items-start gap-3">
              <IconBox tone={c.tone} size="sm">
                {c.icon}
              </IconBox>
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-[var(--cevi-text)]">
                  {c.title}
                </div>
                <div className="text-[11px] text-[var(--cevi-text-muted)] mt-0.5">
                  {c.cta}
                </div>
              </div>
              <Badge variant="outline" size="sm">
                Preview
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-[13px] text-[var(--cevi-text-secondary)] leading-snug">
                {c.body}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
