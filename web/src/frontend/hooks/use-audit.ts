"use client";
import { useEffect } from "react";
import { useApi } from "./use-api";
import type { FaxEvent } from "@/shared/types";

export function useAudit() {
  const { data, loading, error, execute } = useApi<{ events: FaxEvent[] }>();

  useEffect(() => {
    execute("/api/v1/audit");
  }, [execute]);

  return { events: data?.events ?? [], loading, error, refetch: () => execute("/api/v1/audit") };
}
