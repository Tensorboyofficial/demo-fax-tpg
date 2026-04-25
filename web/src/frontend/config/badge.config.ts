export type BadgeVariant =
  | "default"
  | "coral"
  | "amber"
  | "jade"
  | "sand"
  | "teal"
  | "success"
  | "error"
  | "accent"
  | "outline";

export const BADGE_CONFIG = {
  type: {
    lab: { color: "jade" as BadgeVariant, label: "Lab Results" },
    imaging: { color: "sand" as BadgeVariant, label: "Imaging" },
    consult: { color: "teal" as BadgeVariant, label: "Consult Note" },
    referral: { color: "teal" as BadgeVariant, label: "Referral" },
    prior_auth: { color: "amber" as BadgeVariant, label: "Prior Auth" },
    dme: { color: "sand" as BadgeVariant, label: "DME" },
    forms: { color: "default" as BadgeVariant, label: "Forms" },
    records_request: { color: "sand" as BadgeVariant, label: "Records Req" },
    eob: { color: "coral" as BadgeVariant, label: "EOB" },
    discharge: { color: "accent" as BadgeVariant, label: "Discharge" },
    other: { color: "default" as BadgeVariant, label: "Other" },
    // Full 25-category schema names
    lab_result: { color: "jade" as BadgeVariant, label: "Lab Results" },
    imaging_report: { color: "sand" as BadgeVariant, label: "Imaging" },
    consult_note: { color: "teal" as BadgeVariant, label: "Consult Note" },
    referral_incoming: { color: "teal" as BadgeVariant, label: "Referral" },
    prior_auth_response: { color: "amber" as BadgeVariant, label: "Prior Auth" },
    pharmacy_prior_auth_request: { color: "amber" as BadgeVariant, label: "Pharmacy PA" },
    pharmacy_refill_request: { color: "coral" as BadgeVariant, label: "Rx Refill" },
    dme_documentation: { color: "sand" as BadgeVariant, label: "DME" },
    physical_exam_form: { color: "default" as BadgeVariant, label: "Physical Exam" },
    medical_records_request: { color: "sand" as BadgeVariant, label: "Records Req" },
    eob_era: { color: "coral" as BadgeVariant, label: "EOB/ERA" },
    hospital_discharge_summary: { color: "accent" as BadgeVariant, label: "Discharge" },
    ed_visit_summary: { color: "accent" as BadgeVariant, label: "ED Visit" },
    cardiac_diagnostic_report: { color: "coral" as BadgeVariant, label: "Cardiac Dx" },
    pathology_report: { color: "jade" as BadgeVariant, label: "Pathology" },
    immunization_record: { color: "jade" as BadgeVariant, label: "Immunization" },
    home_health_order: { color: "sand" as BadgeVariant, label: "Home Health" },
    hospice_correspondence: { color: "default" as BadgeVariant, label: "Hospice" },
    snf_nh_correspondence: { color: "default" as BadgeVariant, label: "SNF/NH" },
    disability_or_leave_form: { color: "default" as BadgeVariant, label: "Disability" },
    handicap_placard_or_jury_excuse: { color: "default" as BadgeVariant, label: "Handicap/Jury" },
    payer_correspondence: { color: "coral" as BadgeVariant, label: "Payer" },
    subpoena_or_legal_notice: { color: "accent" as BadgeVariant, label: "Legal" },
    marketing_or_junk: { color: "default" as BadgeVariant, label: "Junk" },
    unclassified: { color: "default" as BadgeVariant, label: "Unclassified" },
    // Legacy aliases
    specialist_consult: { color: "teal" as BadgeVariant, label: "Consult Note" },
    rx_refill: { color: "coral" as BadgeVariant, label: "Rx Refill" },
    unknown: { color: "default" as BadgeVariant, label: "Other" },
  },
  status: {
    unopened: { color: "accent" as BadgeVariant, label: "Unopened" },
    opened: { color: "sand" as BadgeVariant, label: "Opened" },
    archived: { color: "jade" as BadgeVariant, label: "Archived" },
    needs_review: { color: "amber" as BadgeVariant, label: "Needs Review" },
    // Legacy aliases — seed data still uses these
    received: { color: "accent" as BadgeVariant, label: "Unopened" },
    processing: { color: "accent" as BadgeVariant, label: "Unopened" },
    auto_routed: { color: "sand" as BadgeVariant, label: "Opened" },
    routed: { color: "sand" as BadgeVariant, label: "Opened" },
    completed: { color: "jade" as BadgeVariant, label: "Archived" },
    failed_match: { color: "amber" as BadgeVariant, label: "Needs Review" },
  },
  urgency: {
    critical: { color: "accent" as BadgeVariant, label: "Critical" },
    stat: { color: "coral" as BadgeVariant, label: "STAT" },
    urgent: { color: "amber" as BadgeVariant, label: "Urgent" },
    routine: { color: "outline" as BadgeVariant, label: "Routine" },
  },
} as const;

export function typeBadgeVariant(type: string): BadgeVariant {
  return BADGE_CONFIG.type[type as keyof typeof BADGE_CONFIG.type]?.color ?? "default";
}

export function statusBadgeVariant(status: string): BadgeVariant {
  return BADGE_CONFIG.status[status as keyof typeof BADGE_CONFIG.status]?.color ?? "default";
}

export function urgencyBadgeVariant(urgency: string): BadgeVariant {
  return BADGE_CONFIG.urgency[urgency as keyof typeof BADGE_CONFIG.urgency]?.color ?? "outline";
}
