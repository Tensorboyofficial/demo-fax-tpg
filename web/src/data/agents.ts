import type { AgentStat } from "@/lib/types";

export const agents: AgentStat[] = [
  {
    key: "referrals",
    name: "Referral Management & Tracking",
    subtitle: "Inbound specialist referrals, booking, loop-closure",
    openCount: 7,
    weeklyCount: 14,
    avgTurnaround: "4h 12m",
    industryBaseline: "2.3 days",
    savingsDollars: 8200,
  },
  {
    key: "prior_auth",
    name: "Prior Authorization Processing",
    subtitle: "Payer PA requests, submission, tracking, approval write-back",
    openCount: 9,
    weeklyCount: 12,
    avgTurnaround: "1.8 days",
    industryBaseline: "5.0 days",
    savingsDollars: 18400,
  },
  {
    key: "lab_results",
    name: "Lab Results Delivery & Follow-Up",
    subtitle: "Result routing, critical-value alerts, patient notification",
    openCount: 3,
    weeklyCount: 61,
    avgTurnaround: "9 min",
    industryBaseline: "2.1 hours",
    savingsDollars: 4600,
  },
  {
    key: "rx_refills",
    name: "Prescription Routing & Refill Mgmt",
    subtitle: "Refill auth, pharmacy callback, Rx state tracking",
    openCount: 4,
    weeklyCount: 38,
    avgTurnaround: "23 min",
    industryBaseline: "1.5 hours",
    savingsDollars: 2900,
  },
  {
    key: "records",
    name: "Medical Records Request Processing",
    subtitle: "Release of information, attorney/patient/payer requests",
    openCount: 5,
    weeklyCount: 22,
    avgTurnaround: "1.2 days",
    industryBaseline: "3.5 days",
    savingsDollars: 1800,
  },
];

export function agentByKey(key: string): AgentStat | undefined {
  return agents.find((a) => a.key === key);
}
