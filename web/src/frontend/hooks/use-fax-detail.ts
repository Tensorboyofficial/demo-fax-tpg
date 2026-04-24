"use client";
import { useEffect } from "react";
import { useApi } from "./use-api";
import type { Fax, FaxEvent } from "@/shared/types";

export function useFaxDetail(id: string) {
  const { data, loading, error, execute } = useApi<{ fax: Fax; events: FaxEvent[] }>();

  useEffect(() => {
    if (id) execute(`/api/v1/fax/${id}`);
  }, [id, execute]);

  return {
    fax: data?.fax ?? null,
    events: data?.events ?? [],
    loading,
    error,
    refetch: () => execute(`/api/v1/fax/${id}`),
  };
}
