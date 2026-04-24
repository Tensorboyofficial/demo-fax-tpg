import { getDataMergeService } from "@/backend/factories/service.factory";
import { agents } from "@/data/seed/agents";
import type { AgentStat } from "@/shared/types";

export async function GET() {
  try {
    const svc = getDataMergeService();
    const faxes = await svc.getAllFaxes();

    // Count faxes routed to each agent queue
    const queueCounts = new Map<string, number>();
    for (const fax of faxes) {
      if (fax.routedTo?.startsWith("agent:")) {
        const key = fax.routedTo.replace("agent:", "");
        queueCounts.set(key, (queueCounts.get(key) ?? 0) + 1);
      }
    }

    // Merge live counts into seed agent metadata
    const enriched: AgentStat[] = agents.map((agent) => ({
      ...agent,
      openCount: queueCounts.get(agent.key) ?? agent.openCount,
    }));

    return Response.json({ agents: enriched });
  } catch {
    return Response.json(
      { error: "Failed to fetch agent stats" },
      { status: 500 },
    );
  }
}
