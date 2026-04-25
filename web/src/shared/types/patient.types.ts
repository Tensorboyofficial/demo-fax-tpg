import type { MatchDecision } from "@/shared/constants";

/* ─── FHIR HumanName (PRD section 3.2) ─── */
export interface FhirHumanName {
  use: "official" | "nickname" | "maiden" | "old";
  family: string;
  given: string[];
  prefix?: string[];
  suffix?: string[];
}

/* ─── Patient Roster Record (PRD section 5.1) ─── */
export interface PatientRoster {
  patient_id: string;             // Cevi-generated UUID
  ecw_account_number: string;     // eCW identifier
  name: {
    first_name: string;
    middle_name?: string;
    last_name: string;
    suffix?: string;
    preferred_name?: string;
    fhir_human_name: FhirHumanName[];
  };
  dob: string;                    // ISO date YYYY-MM-DD
  sex: "M" | "F" | "U";
  addresses?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  }[];
  telecom?: {
    system: "phone" | "email";
    use?: "home" | "mobile" | "work";
    value: string;
  }[];
  identifiers?: {
    label: string;
    value: string;
  }[];
  insurance?: {
    payer_name?: string;
    member_id?: string;
    group_number?: string;
  }[];
  primary_provider?: {
    name?: string;
    npi?: string;
  };
  aliases?: string[];
  deceased?: {
    is_deceased: boolean;
    deceased_date?: string;
  };
  source: "csv_upload" | "manual" | "ehr_export" | "other";
  status?: "active" | "inactive";
  created_at: string;
  updated_at?: string;
}

/* ─── Legacy Patient (backward compat with seed data) ─── */
export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dob: string;
  sex: "M" | "F" | "X";
  primaryProviderId: string;
  clinic: string;
  phone?: string;
  insurance?: string;
}

/* ─── Match Candidate (PRD section 4.2) ─── */
export interface MatchCandidate {
  patientId: string;
  score: number;       // 0..1 composite
  reason: string;
  components?: Record<string, number>;  // per-component scores
}

/* ─── Match Result (PRD section 4) ─── */
export interface MatchResult {
  match_id: string;
  fax_id: string;
  candidates: MatchCandidate[];
  decision: MatchDecision;
  threshold_snapshot: {
    confident_match: number;
    review: number;
  };
  matcher_version: string;
  created_at: string;
}
