import type { Urgency } from "@/shared/constants";
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
  /** Category-specific extracted data (panels, tests, etc.) */
  [key: string]: unknown;
}

export interface FaxEvent {
  id: string;
  faxId: string;
  at: string; // ISO
  kind: string;
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
  /** Lifecycle status — MVP values: unopened, opened, archived, needs_review */
  status: string;
  /** Category — MVP values: lab, imaging, consult, referral, prior_auth, dme, forms, records_request, eob, discharge, other */
  type: string;
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
  /** parent_id for split faxes (e.g. multi-patient EOBs) */
  parentId?: string;
  isHero?: boolean;
}
