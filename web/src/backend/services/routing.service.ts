import type { FaxType, Urgency } from "@/shared/constants";
import type { FaxStatus } from "@/shared/constants";
import { ROUTING_RULES, type RoutingRule } from "../config/routing-rules.config";

export interface RouteInput {
  type: FaxType;
  urgency: Urgency;
  matchedPatientId: string | null;
}

export interface RouteDecision {
  routedTo: string | null;
  routedReason: string;
  status: FaxStatus;
}

export class RoutingService {
  private readonly rules: RoutingRule[];

  constructor(rules?: RoutingRule[]) {
    this.rules = [...(rules ?? ROUTING_RULES)].sort((a, b) => a.priority - b.priority);
  }

  route(input: RouteInput): RouteDecision {
    for (const rule of this.rules) {
      if (this.matches(rule.condition, input)) {
        return {
          routedTo: rule.action.routedTo,
          routedReason: rule.action.routedReason,
          status: rule.action.status,
        };
      }
    }
    return { routedTo: null, routedReason: "No matching rule", status: "needs_review" };
  }

  private matches(condition: RoutingRule["condition"], input: RouteInput): boolean {
    if (condition.noPatientMatch) {
      return input.matchedPatientId === null;
    }
    if (condition.urgency) {
      const urgencies = Array.isArray(condition.urgency) ? condition.urgency : [condition.urgency];
      if (!urgencies.includes(input.urgency)) return false;
    }
    if (condition.type) {
      const types = Array.isArray(condition.type) ? condition.type : [condition.type];
      if (!types.includes(input.type)) return false;
    }
    // Empty condition matches everything (fallback)
    if (!condition.type && !condition.urgency && !condition.noPatientMatch) return true;
    return true;
  }
}
