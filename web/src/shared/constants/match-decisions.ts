/** Match decision outcomes per PRD section 4.3 */
export const MATCH_DECISIONS = [
  "matched_confident",
  "needs_review",
  "unmatched",
  "ambiguous",
  "deceased_review",
] as const;

export type MatchDecision = (typeof MATCH_DECISIONS)[number];
