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

export function typeBadgeVariant(type: string): BadgeVariant {
  switch (type) {
    case "referral":
      return "teal";
    case "lab_result":
      return "jade";
    case "prior_auth":
      return "amber";
    case "records_request":
      return "sand";
    case "rx_refill":
      return "coral";
    case "specialist_consult":
      return "teal";
    case "imaging_report":
      return "sand";
    default:
      return "default";
  }
}

export function statusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case "auto_routed":
    case "routed":
    case "completed":
      return "jade";
    case "needs_review":
      return "amber";
    case "failed_match":
    case "processing":
      return "accent";
    case "received":
      return "outline";
    default:
      return "default";
  }
}

export function urgencyBadgeVariant(urgency: string): BadgeVariant {
  switch (urgency) {
    case "critical":
      return "accent";
    case "stat":
      return "coral";
    case "urgent":
      return "amber";
    default:
      return "outline";
  }
}
