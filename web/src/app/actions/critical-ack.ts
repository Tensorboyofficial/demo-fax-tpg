"use server";

import { insertCriticalAck } from "@/lib/supabase/userFaxes";

export interface AckResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export async function acknowledgeCritical(payload: {
  faxId: string;
  acknowledgedBy: string;
  calledAt: string;
  patientResponse: string;
  note: string;
}): Promise<AckResult> {
  if (!payload.faxId) return { ok: false, error: "fax id missing" };
  if (!payload.acknowledgedBy)
    return { ok: false, error: "select who called the patient" };

  const id = `ACK-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
  const result = await insertCriticalAck({
    id,
    fax_id: payload.faxId,
    acknowledged_by: payload.acknowledgedBy,
    called_at: payload.calledAt,
    patient_response: payload.patientResponse || undefined,
    note: payload.note || undefined,
  });

  if (!result.ok) {
    // Always treat as optimistically acknowledged in-memory so UI doesn't lie
    // if Supabase is offline. Surface the reason for operator awareness.
    return { ok: false, error: result.error, id };
  }
  return { ok: true, id };
}
