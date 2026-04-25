import { Badge } from "@/frontend/components/ui/badge";
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Bell,
  Users,
  Lock,
  Building2,
  Sparkles,
  Database,
} from "lucide-react";

export const metadata = { title: "Settings · Cevi" };

interface SettingSection {
  icon: React.ReactNode;
  title: string;
  description: string;
  items: { label: string; value: string; mono?: boolean }[];
}

const SECTIONS: SettingSection[] = [
  {
    icon: <Building2 className="h-4 w-4" strokeWidth={1.5} />,
    title: "Clinic Profile",
    description: "Organization and location details",
    items: [
      { label: "Organization", value: "Transcend Medical Group" },
      { label: "Location", value: "Arlington, TX" },
      { label: "Fax number", value: "817-860-2704", mono: true },
      { label: "EHR", value: "eClinicalWorks" },
      { label: "Time zone", value: "Central (CT)" },
    ],
  },
  {
    icon: <Users className="h-4 w-4" strokeWidth={1.5} />,
    title: "Team & Roles",
    description: "Manage who can access faxes and PHI",
    items: [
      { label: "Dr. Todd Nguyen", value: "Admin · Provider" },
      { label: "Sarah Chen", value: "Front Desk" },
      { label: "Maria Lopez", value: "Nurse" },
      { label: "James Wilson", value: "Billing" },
    ],
  },
  {
    icon: <Sparkles className="h-4 w-4" strokeWidth={1.5} />,
    title: "AI Classification",
    description: "Model selection and confidence thresholds",
    items: [
      { label: "Default model", value: "Claude Sonnet 4.6" },
      { label: "Type confidence threshold", value: "80%", mono: true },
      { label: "Patient match threshold", value: "95%", mono: true },
      { label: "Review threshold", value: "70%", mono: true },
      { label: "Auto-route above threshold", value: "Enabled" },
    ],
  },
  {
    icon: <Bell className="h-4 w-4" strokeWidth={1.5} />,
    title: "Notifications",
    description: "Alert routing for urgent and critical faxes",
    items: [
      { label: "STAT faxes", value: "SMS + eCW inbox → Dr. Nguyen" },
      { label: "Critical lab results", value: "SMS → On-call provider" },
      { label: "Failed matches", value: "Email → Front desk" },
      { label: "Daily digest", value: "Email → All staff, 7:00 AM CT" },
    ],
  },
  {
    icon: <Database className="h-4 w-4" strokeWidth={1.5} />,
    title: "Integrations",
    description: "Connected systems and data sources",
    items: [
      { label: "Supabase", value: "Connected", mono: true },
      { label: "Medsender (fax ingest)", value: "Active" },
      { label: "eClinicalWorks (write-back)", value: "Pending setup" },
      { label: "Twilio (SMS alerts)", value: "Configured" },
    ],
  },
  {
    icon: <Lock className="h-4 w-4" strokeWidth={1.5} />,
    title: "Compliance & Security",
    description: "HIPAA controls and audit configuration",
    items: [
      { label: "BAA status", value: "On file" },
      { label: "Audit logging", value: "Enabled · immutable" },
      { label: "PHI access logging", value: "Enabled" },
      { label: "Session timeout", value: "30 minutes" },
      { label: "Data retention", value: "7 years" },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-[24px] leading-[1.2] tracking-[-0.02em] text-[var(--cevi-text)]">
          Settings
        </h1>
        <p className="mt-1 text-[13px] text-[var(--cevi-text-muted)]">
          Clinic configuration, team management, and compliance controls
        </p>
      </div>

      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            className="rounded-lg border border-[var(--cevi-border)] bg-white overflow-hidden"
          >
            {/* Section header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[var(--cevi-surface-warm)] border-b border-[var(--cevi-border-light)]">
              <div className="h-8 w-8 rounded-lg bg-white border border-[var(--cevi-border)] flex items-center justify-center text-[var(--cevi-accent)]">
                {section.icon}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[var(--cevi-text)]">{section.title}</div>
                <div className="text-[11px] text-[var(--cevi-text-muted)]">{section.description}</div>
              </div>
            </div>

            {/* Key-value rows */}
            <div>
              {section.items.map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between px-4 py-2.5 ${
                    i < section.items.length - 1 ? "border-b border-[var(--cevi-border-light)]" : ""
                  }`}
                >
                  <span className="text-[12px] text-[var(--cevi-text-secondary)]">{item.label}</span>
                  <span
                    className={`text-[12px] text-[var(--cevi-text)] ${item.mono ? "font-mono" : "font-medium"}`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between text-[11px] text-[var(--cevi-text-muted)]">
        <span>Cevi v1.0 · Transcend Medical Group</span>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--cevi-jade)]" />
          <span>All systems operational</span>
        </div>
      </div>
    </div>
  );
}
