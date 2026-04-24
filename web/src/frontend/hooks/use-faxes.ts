"use client";
import { useEffect } from "react";
import { useApi } from "./use-api";
import type { Fax } from "@/shared/types";

export function useFaxes() {
  const { data, loading, error, execute } = useApi<{ faxes: Fax[] }>();

  useEffect(() => {
    execute("/api/v1/fax");
  }, [execute]);

  return { faxes: data?.faxes ?? [], loading, error, refetch: () => execute("/api/v1/fax") };
}
