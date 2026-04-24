"use client";
import { useCallback } from "react";
import { useApi } from "./use-api";

export function useUpload() {
  const { data, loading, error, execute } = useApi<any>();

  const upload = useCallback((formData: FormData) => {
    return execute("/api/v1/fax", {
      method: "POST",
      body: formData,
    });
  }, [execute]);

  return { result: data, loading, error, upload };
}
