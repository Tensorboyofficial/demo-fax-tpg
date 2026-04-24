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
    referral: { color: "teal" as BadgeVariant, label: "Referral" },
    lab_result: { color: "jade" as BadgeVariant, label: "Lab Result" },
    prior_auth: { color: "amber" as BadgeVariant, label: "Prior Auth" },
    records_request: { color: "sand" as BadgeVariant, label: "Records Request" },
    rx_refill: { color: "coral" as BadgeVariant, label: "Rx Refill" },
    specialist_consult: { color: "teal" as BadgeVariant, label: "Specialist Consult" },
    imaging_report: { color: "sand" as BadgeVariant, label: "Imaging Report" },
    unknown: { color: "default" as BadgeVariant, label: "Unknown" },
  },
  status: {
    auto_routed: { color: "jade" as BadgeVariant, label: "Auto-Routed" },
    routed: { color: "jade" as BadgeVariant, label: "Routed" },
    completed: { color: "jade" as BadgeVariant, label: "Completed" },
    needs_review: { color: "amber" as BadgeVariant, label: "Needs Review" },
    failed_match: { color: "accent" as BadgeVariant, label: "Failed Match" },
    processing: { color: "accent" as BadgeVariant, label: "Processing" },
    received: { color: "outline" as BadgeVariant, label: "Received" },
  },
  urgency: {
    critical: { color: "accent" as BadgeVariant, label: "Critical" },
    stat: { color: "coral" as BadgeVariant, label: "STAT" },
    urgent: { color: "amber" as BadgeVariant, label: "Urgent" },
    routine: { color: "outline" as BadgeVariant, label: "Routine" },
  },
} as const;

// Helper functions that replace the old switch-based badge-variants.ts
export function typeBadgeVariant(type: string): BadgeVariant {
  return BADGE_CONFIG.type[type as keyof typeof BADGE_CONFIG.type]?.color ?? "default";
}

export function statusBadgeVariant(status: string): BadgeVariant {
  return BADGE_CONFIG.status[status as keyof typeof BADGE_CONFIG.status]?.color ?? "default";
}

export function urgencyBadgeVariant(urgency: string): BadgeVariant {
  return BADGE_CONFIG.urgency[urgency as keyof typeof BADGE_CONFIG.urgency]?.color ?? "outline";
}
