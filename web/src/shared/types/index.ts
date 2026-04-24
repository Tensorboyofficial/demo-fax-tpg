export type { Provider } from "./provider.types";
export type { Patient, MatchCandidate } from "./patient.types";
export type { Fax, FaxEvent, ExtractedFields } from "./fax.types";
export type { AgentStat } from "./agent.types";
export type { Integration } from "./integration.types";
export type {
  ModelTier,
  KPI,
  FaxListResponse,
  FaxDetailResponse,
  UploadResponse,
  ClassifyRequest,
  ClassifyResponse,
  DraftMessageResponse,
  AcknowledgeRequest,
  AcknowledgeResponse,
  AgentListResponse,
  AgentDetailResponse,
  AuditResponse,
  IntegrationListResponse,
  ApiError,
} from "./api.types";

// Re-export constant-derived types so consumers can import from @/shared/types
export type { FaxType } from "@/shared/constants";
export type { FaxStatus } from "@/shared/constants";
export type { Urgency } from "@/shared/constants";
export type { AgentKey } from "@/shared/constants";
