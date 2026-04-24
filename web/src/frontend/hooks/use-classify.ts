"use client";
import { useCallback } from "react";
import { useApi } from "./use-api";

type Tier = "fast" | "smart" | "premium";

export function useClassify(faxId: string) {
  const { data, loading, error, execute } = useApi<any>();

  const classify = useCallback((tier: Tier = "smart") => {
    return execute(`/api/v1/fax/${faxId}/classify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
  }, [faxId, execute]);

  return { result: data, loading, error, classify };
}
