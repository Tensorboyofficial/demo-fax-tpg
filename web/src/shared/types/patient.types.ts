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
  reason: string;
}
