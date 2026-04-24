import type { AgentKey } from "@/shared/constants";

export interface AgentStat {
  key: AgentKey;
  name: string;
  subtitle: string;
  openCount: number;
  weeklyCount: number;
  avgTurnaround: string;
  industryBaseline?: string;
  savingsDollars?: number;
}
