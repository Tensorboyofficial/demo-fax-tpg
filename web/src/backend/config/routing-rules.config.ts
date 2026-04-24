import type { FaxType, Urgency } from "@/shared/constants";

export interface RoutingRule {
  priority: number;
  condition: {
    type?: FaxType | FaxType[];
    urgency?: Urgency | Urgency[];
    noPatientMatch?: boolean;
  };
  action: {
    routedTo: string | null;
    routedReason: string;
    status: "auto_routed" | "needs_review";
  };
}

export const ROUTING_RULES: RoutingRule[] = [
  {
    priority: 1,
    condition: { noPatientMatch: true },
    action: {
      routedTo: null,
      routedReason: "Patient match below 80% confidence — routed to Review queue for operator confirmation.",
      status: "needs_review",
    },
  },
  {
    priority: 2,
    condition: { urgency: ["critical", "stat"] },
    action: {
      routedTo: "agent:lab_results",
      routedReason: "Critical / STAT result — routed to Lab Results agent with SMS dispatch to on-call nurse.",
      status: "auto_routed",
    },
  },
  {
    priority: 10,
    condition: { type: "referral" },
    action: {
      routedTo: "agent:referrals",
      routedReason: "Inbound referral → Referrals agent; Healow slot held.",
      status: "auto_routed",
    },
  },
  {
    priority: 11,
    condition: { type: "prior_auth" },
    action: {
      routedTo: "agent:prior_auth",
      routedReason: "Payer PA request → Prior Auth agent; clinical justification drafted.",
      status: "auto_routed",
    },
  },
  {
    priority: 12,
    condition: { type: "records_request" },
    action: {
      routedTo: "agent:records",
      routedReason: "Records request → Records agent; ROI ticket created.",
      status: "auto_routed",
    },
  },
  {
    priority: 13,
    condition: { type: "rx_refill" },
    action: {
      routedTo: "agent:rx_refills",
      routedReason: "Refill request → Rx agent; draft approval prepared for e-signature.",
      status: "auto_routed",
    },
  },
  {
    priority: 14,
    condition: { type: ["lab_result", "imaging_report"] },
    action: {
      routedTo: "P-001",
      routedReason: "Patient's PCP inbox (auto).",
      status: "auto_routed",
    },
  },
  {
    priority: 15,
    condition: { type: "specialist_consult" },
    action: {
      routedTo: "P-001",
      routedReason: "Specialist report → PCP results inbox.",
      status: "auto_routed",
    },
  },
  {
    priority: 99,
    condition: {},
    action: {
      routedTo: null,
      routedReason: "Document type unclear — routed to Review queue for operator confirmation.",
      status: "needs_review",
    },
  },
];
