import type { FaxType, FaxStatus, Urgency } from "@/shared/constants";

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
    status: FaxStatus;
  };
}

/**
 * Routing rules per PRD section 4.4 — category.route_to_queue drives the queue,
 * these rules handle urgency overrides and fallback logic.
 */
export const ROUTING_RULES: RoutingRule[] = [
  // Removed: noPatientMatch priority-1 rule that forced ALL unmatched faxes to needs_review.
  // Faxes without a patient match now follow type-specific routing rules below.
  // Only the fallback rule (priority 99) sends truly unclassified docs to needs_review.
  {
    priority: 2,
    condition: { urgency: ["critical", "stat"] },
    action: {
      routedTo: "nurse_triage",
      routedReason: "Critical / STAT result — escalated to nurse triage.",
      status: "needs_review",
    },
  },
  {
    priority: 10,
    condition: { type: ["referral", "referral_incoming"] },
    action: {
      routedTo: "front_desk",
      routedReason: "Inbound referral — always requires human review.",
      status: "needs_review",
    },
  },
  {
    priority: 11,
    condition: { type: ["prior_auth", "prior_auth_response", "pharmacy_prior_auth_request"] },
    action: {
      routedTo: "billing_review",
      routedReason: "Prior auth — routed to billing review.",
      status: "needs_review",
    },
  },
  {
    priority: 12,
    condition: { type: ["records_request", "medical_records_request"] },
    action: {
      routedTo: "front_desk",
      routedReason: "Records request — HIPAA review required.",
      status: "needs_review",
    },
  },
  {
    priority: 13,
    condition: { type: ["eob", "eob_era", "payer_correspondence"] },
    action: {
      routedTo: "billing_review",
      routedReason: "EOB/payer correspondence — routed to billing review.",
      status: "unopened",
    },
  },
  {
    priority: 14,
    condition: { type: ["lab", "imaging", "lab_result", "imaging_report", "pathology_report", "cardiac_diagnostic_report"] },
    action: {
      routedTo: "labs_review",
      routedReason: "Lab/imaging result — matched to patient's PCP inbox.",
      status: "unopened",
    },
  },
  {
    priority: 15,
    condition: { type: ["consult", "consult_note"] },
    action: {
      routedTo: "clinical_review",
      routedReason: "Consult note — always requires clinical review.",
      status: "needs_review",
    },
  },
  {
    priority: 16,
    condition: { type: ["discharge", "hospital_discharge_summary", "ed_visit_summary"] },
    action: {
      routedTo: "nurse_triage",
      routedReason: "Discharge/ED summary — routed to nurse triage.",
      status: "needs_review",
    },
  },
  {
    priority: 17,
    condition: { type: ["subpoena_or_legal_notice"] },
    action: {
      routedTo: "front_desk",
      routedReason: "Legal notice — requires immediate front desk review.",
      status: "needs_review",
    },
  },
  {
    priority: 18,
    condition: { type: ["marketing_or_junk"] },
    action: {
      routedTo: null,
      routedReason: "Marketing/junk fax — auto-archived.",
      status: "archived",
    },
  },
  {
    priority: 19,
    condition: { type: ["disability_or_leave_form", "handicap_placard_or_jury_excuse", "physical_exam_form"] },
    action: {
      routedTo: "front_desk",
      routedReason: "Administrative form — routed to front desk.",
      status: "unopened",
    },
  },
  {
    priority: 20,
    condition: { type: ["dme", "dme_documentation", "home_health_order"] },
    action: {
      routedTo: "clinical_review",
      routedReason: "DME/home health order — routed to clinical review.",
      status: "unopened",
    },
  },
  {
    priority: 21,
    condition: { type: ["hospice_correspondence", "snf_nh_correspondence"] },
    action: {
      routedTo: "clinical_review",
      routedReason: "Facility correspondence — routed to clinical review.",
      status: "unopened",
    },
  },
  {
    priority: 22,
    condition: { type: ["immunization_record"] },
    action: {
      routedTo: "clinical_review",
      routedReason: "Immunization record — routed to clinical review.",
      status: "unopened",
    },
  },
  {
    priority: 23,
    condition: { type: ["pharmacy_refill_request"] },
    action: {
      routedTo: "clinical_review",
      routedReason: "Rx refill request — routed to clinical review.",
      status: "unopened",
    },
  },
  {
    priority: 99,
    condition: {},
    action: {
      routedTo: "front_desk",
      routedReason: "Unclassified document — routed to front desk for review.",
      status: "needs_review",
    },
  },
];
