"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconBox } from "@/components/ui/icon-box";
import { Check, Save, Plus, MoveRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentKey } from "@/lib/types";

type Condition = { label: string; detail: string };
type Action = { label: string; detail: string; tone: "accent" | "teal" | "jade" | "sand" | "amber" };

interface Rule {
  id: string;
  name: string;
  when: Condition;
  then: Action[];
  enabled: boolean;
  autoRoute: boolean;
  weeklyFires: number;
}

const RULES_BY_AGENT: Record<AgentKey, Rule[]> = {
  referrals: [
    {
      id: "r-1",
      name: "Inbound referral → schedule new-patient visit",
      when: { label: "Document type", detail: "referral · confidence ≥ 80%" },
      then: [
        { label: "Hold Healow slot", detail: "within 14 days at patient's home clinic", tone: "teal" },
        { label: "Notify referring office", detail: "auto-fax confirmation + appt time", tone: "accent" },
        { label: "Attach to chart", detail: "eClinicalWorks patient record", tone: "jade" },
      ],
      enabled: true,
      autoRoute: true,
      weeklyFires: 14,
    },
    {
      id: "r-2",
      name: "Specialist → loop-close letter after visit",
      when: { label: "Follow-up lag", detail: "> 10 business days without response" },
      then: [
        { label: "Draft loop-close letter", detail: "Cevi Pro · HIPAA-safe summary", tone: "sand" },
        { label: "Queue for provider signature", detail: "Dr. Nguyen / Dr. Harbison inbox", tone: "accent" },
      ],
      enabled: true,
      autoRoute: false,
      weeklyFires: 6,
    },
    {
      id: "r-3",
      name: "High-risk specialty → flag for PCP review",
      when: { label: "Specialty", detail: "oncology, cardiothoracic, neurosurgery" },
      then: [
        { label: "Hold auto-route", detail: "require PCP acknowledgement", tone: "amber" },
        { label: "SMS PCP", detail: "within 15 min via Twilio", tone: "accent" },
      ],
      enabled: false,
      autoRoute: false,
      weeklyFires: 0,
    },
  ],
  prior_auth: [
    {
      id: "pa-1",
      name: "PA request → auto-draft clinical justification",
      when: { label: "Document type", detail: "prior_auth request" },
      then: [
        { label: "Pull recent notes", detail: "last 6 weeks from eCW encounter notes", tone: "teal" },
        { label: "Cevi Pro drafts 278", detail: "ICD-10 + conservative tx + imaging", tone: "sand" },
        { label: "Queue for MD e-sign", detail: "ordering provider inbox", tone: "accent" },
      ],
      enabled: true,
      autoRoute: true,
      weeklyFires: 12,
    },
    {
      id: "pa-2",
      name: "PA approval → write to chart + schedule patient",
      when: { label: "Document type", detail: "prior_auth approval letter" },
      then: [
        { label: "Attach auth to chart", detail: "include auth number + expiration", tone: "jade" },
        { label: "Notify scheduler", detail: "Healow task with auth # attached", tone: "teal" },
      ],
      enabled: true,
      autoRoute: true,
      weeklyFires: 9,
    },
    {
      id: "pa-3",
      name: "PA denial → peer-to-peer prep",
      when: { label: "Document type", detail: "prior_auth denial" },
      then: [
        { label: "Compile peer-to-peer packet", detail: "clinical rationale + guidelines citations", tone: "accent" },
        { label: "Book P2P slot", detail: "payer call within 3 business days", tone: "amber" },
      ],
      enabled: true,
      autoRoute: false,
      weeklyFires: 2,
    },
  ],
  lab_results: [
    {
      id: "lab-1",
      name: "Critical value → page on-call + block auto-route",
      when: { label: "Any critical lab value", detail: "K+ > 6.0, Na < 125, glucose > 400, Hgb < 7, etc." },
      then: [
        { label: "SMS on-call nurse", detail: "via Twilio · delivery receipt logged", tone: "accent" },
        { label: "Block auto-route", detail: "require MD acknowledgement before close", tone: "amber" },
        { label: "Start 30-min callback timer", detail: "escalate at 30 min if unacknowledged", tone: "accent" },
      ],
      enabled: true,
      autoRoute: false,
      weeklyFires: 3,
    },
    {
      id: "lab-2",
      name: "Normal panel → auto-route to PCP results inbox",
      when: { label: "All values in range", detail: "≥ 80% type confidence · patient matched" },
      then: [
        { label: "Attach to chart", detail: "eClinicalWorks", tone: "jade" },
        { label: "Patient portal", detail: "auto-release via Healow after 24h", tone: "teal" },
      ],
      enabled: true,
      autoRoute: true,
      weeklyFires: 58,
    },
  ],
  rx_refills: [
    {
      id: "rx-1",
      name: "Chronic refill request → auto-approve if criteria met",
      when: { label: "Medication on chronic list", detail: "last fill < 90 days · no flagged interactions" },
      then: [
        { label: "Auto-approve", detail: "prescriber of record signs electronically", tone: "jade" },
        { label: "Transmit to pharmacy", detail: "via Surescripts (when connected)", tone: "teal" },
      ],
      enabled: true,
      autoRoute: true,
      weeklyFires: 32,
    },
    {
      id: "rx-2",
      name: "Controlled substance → always human in loop",
      when: { label: "DEA schedule", detail: "II–V" },
      then: [
        { label: "Block auto-approve", detail: "route to prescriber inbox", tone: "amber" },
        { label: "PDMP check reminder", detail: "attached to task", tone: "accent" },
      ],
      enabled: true,
      autoRoute: false,
      weeklyFires: 6,
    },
  ],
  records: [
    {
      id: "rec-1",
      name: "Attorney / payer request → ROI ticket + fee invoice",
      when: { label: "Sender type", detail: "legal or insurance with signed HIPAA release" },
      then: [
        { label: "Create ROI ticket", detail: "HIM inbox with release attached", tone: "sand" },
        { label: "Fee invoice draft", detail: "per Texas state schedule · QuickBooks export", tone: "teal" },
      ],
      enabled: true,
      autoRoute: true,
      weeklyFires: 18,
    },
    {
      id: "rec-2",
      name: "Patient self-request → fast-track 72h",
      when: { label: "Sender matches", detail: "patient phone / email on file" },
      then: [
        { label: "HIM fast-track queue", detail: "72-hour SLA", tone: "jade" },
        { label: "Portal invite", detail: "if not already enrolled in Healow", tone: "teal" },
      ],
      enabled: true,
      autoRoute: true,
      weeklyFires: 4,
    },
  ],
};

interface Props {
  agentKey: AgentKey;
  slug: string;
}

export function WorkflowEditor({ agentKey, slug }: Props) {
  const [rules, setRules] = useState<Rule[]>(RULES_BY_AGENT[agentKey] ?? []);
  const [saved, setSaved] = useState(false);

  function toggle(id: string) {
    setSaved(false);
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    );
  }

  function toggleAutoRoute(id: string) {
    setSaved(false);
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, autoRoute: !r.autoRoute } : r)),
    );
  }

  function handleSave() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3500);
  }

  return (
    <div className="space-y-4">
      <Card padding="none">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                Active rules
              </div>
              <div className="text-[11px] text-[var(--cevi-text-muted)]">
                {rules.filter((r) => r.enabled).length} of {rules.length} enabled ·{" "}
                applies to all 4 clinics
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
                Add rule
              </Button>
              {saved ? (
                <Badge variant="jade" dot size="sm">
                  Saved
                </Badge>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Save className="h-3.5 w-3.5" />}
                  onClick={handleSave}
                >
                  Save changes
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                "rounded-lg border p-4 transition-colors",
                rule.enabled
                  ? "border-[var(--cevi-border)] bg-white"
                  : "border-[var(--cevi-border-light)] bg-[var(--cevi-surface-warm)] opacity-75",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <IconBox tone={rule.enabled ? "accent" : "muted"} size="sm">
                    <Sparkles className="h-4 w-4" strokeWidth={1.5} />
                  </IconBox>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-[var(--cevi-text)]">
                      {rule.name}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--cevi-text-muted)]">
                      Fires ~{rule.weeklyFires}× per week across all clinics
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => toggle(rule.id)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-[var(--cevi-border)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--cevi-accent)]/20 rounded-full peer peer-checked:bg-[var(--cevi-accent)] transition-colors" />
                  <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                </label>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-[140px_1fr] gap-3">
                <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[var(--cevi-text-tertiary)] pt-1">
                  When
                </div>
                <div className="rounded-md bg-[var(--cevi-surface-warm)] border border-[var(--cevi-border-light)] px-3 py-2">
                  <div className="text-[12px] font-medium text-[var(--cevi-text)]">
                    {rule.when.label}
                  </div>
                  <div className="text-[11px] text-[var(--cevi-text-muted)]">
                    {rule.when.detail}
                  </div>
                </div>

                <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[var(--cevi-text-tertiary)] pt-1">
                  Then
                </div>
                <ul className="space-y-2">
                  {rule.then.map((act, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 rounded-md bg-white border border-[var(--cevi-border-light)] px-3 py-2"
                    >
                      <MoveRight
                        className={cn(
                          "h-3.5 w-3.5 mt-1 shrink-0",
                          act.tone === "accent" && "text-[var(--cevi-accent)]",
                          act.tone === "teal" && "text-[var(--cevi-teal)]",
                          act.tone === "jade" && "text-[var(--cevi-jade)]",
                          act.tone === "sand" && "text-[var(--cevi-sand)]",
                          act.tone === "amber" && "text-[var(--cevi-amber)]",
                        )}
                        strokeWidth={1.5}
                      />
                      <div>
                        <div className="text-[12px] font-medium text-[var(--cevi-text)]">
                          {act.label}
                        </div>
                        <div className="text-[11px] text-[var(--cevi-text-muted)]">
                          {act.detail}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 pt-3 border-t border-[var(--cevi-border-light)]">
                <div className="text-[11px] text-[var(--cevi-text-muted)]">
                  Auto-route without human approval
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <span className="text-[11px] font-semibold text-[var(--cevi-text-secondary)]">
                    {rule.autoRoute ? "Enabled" : "Require review"}
                  </span>
                  <input
                    type="checkbox"
                    checked={rule.autoRoute}
                    onChange={() => toggleAutoRoute(rule.id)}
                    disabled={!rule.enabled}
                    className="sr-only peer"
                  />
                  <span className="relative w-10 h-5 bg-[var(--cevi-border)] rounded-full peer-checked:bg-[var(--cevi-jade)] transition-colors peer-disabled:opacity-40">
                    <span className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full shadow peer-checked:translate-x-5 transition-transform" />
                  </span>
                </label>
              </div>
            </div>
          ))}
          {rules.length === 0 && (
            <div className="py-8 text-center text-[13px] text-[var(--cevi-text-muted)]">
              No rules configured yet for this agent.
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <div className="text-[11px] text-[var(--cevi-text-muted)] inline-flex items-center gap-1.5">
            <Check className="h-3 w-3 text-[var(--cevi-jade)]" strokeWidth={2} /> Changes
            are sandboxed — no effect on production traffic until you click Save.
          </div>
          <span className="text-[11px] text-[var(--cevi-text-faint)] font-mono">
            agent:{slug}
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
