import type { FaxType, FaxStatus, Urgency } from "@/shared/constants";
import type { MatchCandidate } from "./patient.types";

export interface ExtractedFields {
  sendingProvider?: string;
  sendingOrg?: string;
  documentDate?: string;
  patientNameOnDoc?: string;
  patientDobOnDoc?: string;
  patientMrnOnDoc?: string;
  diagnoses?: string[];
  recommendations?: string[];
  medications?: string[];
  urgency?: Urgency;
  icd10?: string[];
  cpt?: string[];
  summary?: string;
}

export interface FaxEvent {
  id: string;
  faxId: string;
  at: string; // ISO
  kind:
    | "received"
    | "ocr"
    | "classified"
    | "matched"
    | "extracted"
    | "routed"
    | "notified"
    | "written_back"
    | "human_override"
    | "flagged";
  actor: string;
  detail: string;
  model?: string;
  latencyMs?: number;
  tokensIn?: number;
  tokensOut?: number;
}

export interface Fax {
  id: string;
  receivedAt: string; // ISO
  pages: number;
  fromNumber: string;
  fromOrg: string;
  faxNumberTo: string;
  toClinic: string;
  status: FaxStatus;
  type: FaxType;
  typeConfidence: number; // 0..1
  urgency: Urgency;
  matchedPatientId: string | null;
  matchConfidence: number | null;
  candidates: MatchCandidate[];
  extracted: ExtractedFields;
  routedTo: string | null;
  routedReason: string | null;
  ocrText: string;
  aiSummary?: string;
  modelUsed?: string;
  isHero?: boolean;
}
