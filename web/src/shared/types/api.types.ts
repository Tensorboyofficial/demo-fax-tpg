import type { FaxType, Urgency } from "@/shared/constants";
import type { Fax, FaxEvent, ExtractedFields } from "./fax.types";
import type { MatchCandidate, Patient } from "./patient.types";
import type { AgentStat } from "./agent.types";
import type { Integration } from "./integration.types";

// ── Fax List ──
export interface FaxListResponse {
  data: Fax[];
  total: number;
}

// ── Fax Detail ──
export interface FaxDetailResponse {
  fax: Fax;
  events: FaxEvent[];
  matchedPatient: Patient | null;
  alternativeCandidates: MatchCandidate[];
}

// ── Upload ──
export interface UploadResponse {
  ok: true;
  faxId: string;
  classifiedAs: FaxType;
  confidence: number;
  modelLabel: string;
  latencyMs: number;
  persisted: boolean;
  persistError?: string;
}

// ── Classify ──
export type ModelTier = "fast" | "smart" | "premium";

export interface ClassifyRequest {
  tier: ModelTier;
}

export interface ClassifyResponse {
  ok: true;
  type: FaxType;
  typeConfidence: number;
  urgency: Urgency;
  extracted: ExtractedFields;
  aiSummary: string;
  model: string;
  modelLabel: string;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
  cachedInputTokens?: number;
}

// ── Draft Message ──
export interface DraftMessageResponse {
  ok: true;
  subject: string;
  body: string;
  modelLabel: string;
  latencyMs: number;
  persisted: boolean;
  persistError?: string;
  messageId: string;
}

// ── Acknowledge ──
export interface AcknowledgeRequest {
  faxId: string;
  acknowledgedBy: string;
  calledAt: string;
  patientResponse: string;
  note: string;
}

export interface AcknowledgeResponse {
  ok: boolean;
  error?: string;
  id?: string;
}

// ── Agents ──
export interface AgentListResponse {
  data: AgentStat[];
}

export interface AgentDetailResponse {
  agent: AgentStat;
  faxes: Fax[];
}

// ── Audit ──
export interface AuditResponse {
  data: FaxEvent[];
  total: number;
}

// ── Integrations ──
export interface IntegrationListResponse {
  connected: Integration[];
  available: Integration[];
}

// ── Error ──
export interface ApiError {
  ok: false;
  error: string;
  retryAfter?: number;
}

// ── KPI ──
export interface KPI {
  label: string;
  value: string | number;
  delta?: string;
  helper?: string;
}
