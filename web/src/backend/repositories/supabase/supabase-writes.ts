import type { Fax, FaxEvent } from "@/shared/types";
import { getSupabase } from "./supabase.client";
import { rowToFax, type UserFaxRow, type UserFaxEventRow } from "./schema";

export interface InsertFaxPayload {
  fax: Fax;
  events: FaxEvent[];
}

export async function insertUploadedFax(
  payload: InsertFaxPayload,
): Promise<{ ok: boolean; error?: string }> {
  const s = getSupabase();
  if (!s) return { ok: false, error: "Supabase not configured" };
  try {
    const { fax, events } = payload;
    // fileUrl is stored inside `extracted` JSONB (always works)
    // Also try the top-level file_url column if it exists
    const extracted = { ...fax.extracted, candidates: fax.candidates };
    const baseRow = {
      id: fax.id,
      received_at: fax.receivedAt,
      pages: fax.pages,
      from_number: fax.fromNumber,
      from_org: fax.fromOrg,
      fax_number_to: fax.faxNumberTo,
      to_clinic: fax.toClinic,
      status: fax.status,
      type: fax.type,
      type_confidence: fax.typeConfidence,
      urgency: fax.urgency,
      matched_patient_id: fax.matchedPatientId,
      match_confidence: fax.matchConfidence,
      extracted,
      routed_to: fax.routedTo,
      routed_reason: fax.routedReason,
      ocr_text: fax.ocrText,
      ai_summary: fax.aiSummary ?? null,
      model_used: fax.modelUsed ?? null,
      is_user_uploaded: true,
      source_kind: "upload",
      created_by: "anon",
    };
    // Try with file_url column; if it doesn't exist yet, retry without it
    let { error: faxErr } = await s.from("user_faxes").insert({ ...baseRow, file_url: fax.fileUrl ?? null });
    if (faxErr?.code === "42703") {
      ({ error: faxErr } = await s.from("user_faxes").insert(baseRow));
    }
    if (faxErr) return { ok: false, error: faxErr.message };

    if (events.length > 0) {
      const eventRows: Omit<UserFaxEventRow, "created_at">[] = events.map((e) => ({
        id: e.id,
        fax_id: e.faxId,
        at: e.at,
        kind: e.kind,
        actor: e.actor,
        detail: e.detail,
        model: e.model ?? null,
        latency_ms: e.latencyMs ?? null,
        tokens_in: e.tokensIn ?? null,
        tokens_out: e.tokensOut ?? null,
      }));
      const { error: evErr } = await s
        .from("user_fax_events")
        .insert(eventRows);
      if (evErr) return { ok: false, error: evErr.message };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function insertCriticalAck(payload: {
  id: string;
  fax_id: string;
  acknowledged_by: string;
  called_at?: string;
  patient_response?: string;
  note?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const s = getSupabase();
  if (!s) return { ok: false, error: "Supabase not configured" };
  try {
    const { error } = await s.from("critical_ack").insert({
      id: payload.id,
      fax_id: payload.fax_id,
      acknowledged_by: payload.acknowledged_by,
      called_at: payload.called_at ?? new Date().toISOString(),
      patient_response: payload.patient_response ?? null,
      note: payload.note ?? null,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function insertPatientMessage(payload: {
  id: string;
  fax_id: string;
  patient_id: string | null;
  subject: string;
  body: string;
  status: "draft" | "queued" | "sent";
  model?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const s = getSupabase();
  if (!s) return { ok: false, error: "Supabase not configured" };
  try {
    const { error } = await s.from("patient_messages").insert({
      id: payload.id,
      fax_id: payload.fax_id,
      patient_id: payload.patient_id,
      subject: payload.subject,
      body: payload.body,
      status: payload.status,
      model: payload.model ?? null,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function getUploadedFaxById(id: string): Promise<Fax | null> {
  const s = getSupabase();
  if (!s) return null;
  try {
    const { data, error } = await s
      .from("user_faxes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return rowToFax(data as UserFaxRow);
  } catch {
    return null;
  }
}
