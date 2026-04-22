export type FaxType =
  | "referral"
  | "lab_result"
  | "prior_auth"
  | "records_request"
  | "rx_refill"
  | "specialist_consult"
  | "imaging_report"
  | "unknown";

export type FaxStatus =
  | "received"
  | "processing"
  | "auto_routed"
  | "needs_review"
  | "failed_match"
  | "routed"
  | "completed";

export type Urgency = "routine" | "urgent" | "stat" | "critical";

export type AgentKey =
  | "referrals"
  | "prior_auth"
  | "lab_results"
  | "rx_refills"
  | "records";

export interface Provider {
  id: string;
  name: string;
  title: string;
  specialty: string;
  clinic: string;
  npi?: string;
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dob: string; // ISO date
  sex: "M" | "F" | "X";
  primaryProviderId: string;
  clinic: string;
  phone?: string;
  insurance?: string;
}

export interface MatchCandidate {
  patientId: string;
  score: number; // 0..1
  reason: string; // human-readable reason
}

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
  actor: string; // "system" | "claude" | "user:dr.nguyen" etc.
  detail: string;
  model?: string; // claude-opus-4-7 etc.
  latencyMs?: number;
  tokensIn?: number;
  tokensOut?: number;
}

export interface Fax {
  id: string;
  receivedAt: string; // ISO
  pages: number;
  fromNumber: string;
  fromOrg: string; // "Baylor Scott & White Heart & Vascular"
  faxNumberTo: string; // "817-860-2704"
  toClinic: string;
  status: FaxStatus;
  type: FaxType;
  typeConfidence: number; // 0..1
  urgency: Urgency;
  matchedPatientId: string | null;
  matchConfidence: number | null;
  candidates: MatchCandidate[];
  extracted: ExtractedFields;
  routedTo: string | null; // provider id or queue name
  routedReason: string | null;
  ocrText: string; // raw OCR text
  aiSummary?: string;
  modelUsed?: string;
  isHero?: boolean; // true for faxes we want Opus 4.7 to touch live in demo
}

export interface AgentStat {
  key: AgentKey;
  name: string;
  subtitle: string;
  openCount: number;
  weeklyCount: number;
  avgTurnaround: string; // "1.8d"
  industryBaseline?: string;
  savingsDollars?: number;
}

export interface Integration {
  id: string;
  name: string;
  category:
    | "EHR"
    | "Scheduling"
    | "Telehealth"
    | "Billing"
    | "Pharmacy"
    | "Labs"
    | "Messaging";
  connected: boolean;
  last_sync?: string;
  logoInitial: string; // single letter fallback
  note?: string;
}

export interface KPI {
  label: string;
  value: string | number;
  delta?: string;
  helper?: string;
}
