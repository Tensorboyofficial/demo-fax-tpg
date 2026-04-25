import type { Urgency } from "@/shared/constants";
import type { ExtractedFields, FaxEvent, Fax, MatchCandidate } from "@/shared/types";

export interface UserFaxRow {
  id: string;
  received_at: string;
  pages: number;
  from_number: string | null;
  from_org: string | null;
  fax_number_to: string | null;
  to_clinic: string | null;
  status: string;
  type: string;
  type_confidence: number;
  urgency: Urgency;
  matched_patient_id: string | null;
  match_confidence: number | null;
  extracted: ExtractedFields & { candidates?: MatchCandidate[] };
  routed_to: string | null;
  routed_reason: string | null;
  ocr_text: string;
  ai_summary: string | null;
  model_used: string | null;
  file_url: string | null;
  is_user_uploaded: boolean;
  source_kind: string | null;
  created_by: string | null;
  created_at: string;
}

export interface UserFaxEventRow {
  id: string;
  fax_id: string;
  at: string;
  kind: string;
  actor: string;
  detail: string;
  model: string | null;
  latency_ms: number | null;
  tokens_in: number | null;
  tokens_out: number | null;
  created_at: string;
}

export function rowToFax(row: UserFaxRow): Fax {
  const extractedCandidates = row.extracted?.candidates ?? [];
  return {
    id: row.id,
    receivedAt: row.received_at,
    pages: row.pages ?? 1,
    fromNumber: row.from_number ?? "",
    fromOrg: row.from_org ?? "Unknown sender",
    faxNumberTo: row.fax_number_to ?? "817-860-2704",
    toClinic: row.to_clinic ?? "Arlington",
    status: row.status,
    type: row.type,
    typeConfidence: Number(row.type_confidence ?? 0),
    urgency: row.urgency ?? "routine",
    matchedPatientId: row.matched_patient_id,
    matchConfidence: row.match_confidence !== null ? Number(row.match_confidence) : null,
    candidates: extractedCandidates,
    extracted: row.extracted ?? {},
    routedTo: row.routed_to,
    routedReason: row.routed_reason,
    ocrText: row.ocr_text ?? "",
    aiSummary: row.ai_summary ?? undefined,
    modelUsed: row.model_used ?? undefined,
    isHero: false,
    fileUrl: row.file_url ?? (row.extracted as Record<string, unknown>)?.fileUrl as string ?? undefined,
  };
}

export function rowToEvent(row: UserFaxEventRow): FaxEvent {
  return {
    id: row.id,
    faxId: row.fax_id,
    at: row.at,
    kind: row.kind,
    actor: row.actor,
    detail: row.detail,
    model: row.model ?? undefined,
    latencyMs: row.latency_ms ?? undefined,
    tokensIn: row.tokens_in ?? undefined,
    tokensOut: row.tokens_out ?? undefined,
  };
}
