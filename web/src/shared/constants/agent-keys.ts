export const AGENT_KEYS = [
  "referrals",
  "prior_auth",
  "lab_results",
  "rx_refills",
  "records",
] as const;

export type AgentKey = (typeof AGENT_KEYS)[number];
