"use client";
import { useEffect } from "react";
import { useApi } from "./use-api";
import type { AgentStat } from "@/shared/types";

export function useAgents() {
  const { data, loading, error, execute } = useApi<{ agents: AgentStat[] }>();

  useEffect(() => {
    execute("/api/v1/agent");
  }, [execute]);

  return { agents: data?.agents ?? [], loading, error, refetch: () => execute("/api/v1/agent") };
}
