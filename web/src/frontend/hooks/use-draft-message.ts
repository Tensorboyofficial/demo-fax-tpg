"use client";
import { useCallback } from "react";
import { useApi } from "./use-api";

export function useDraftMessage(faxId: string) {
  const { data, loading, error, execute } = useApi<any>();

  const draft = useCallback(() => {
    return execute(`/api/v1/fax/${faxId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  }, [faxId, execute]);

  return { result: data, loading, error, draft };
}
