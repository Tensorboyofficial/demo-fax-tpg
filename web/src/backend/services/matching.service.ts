import type { MatchCandidate, Patient } from "@/shared/types";
import type { MatchingConfig } from "../config/matching.config";
import { MATCHING_CONFIG } from "../config/matching.config";
import { patients } from "@/data/seed/patients";

function normalizeStr(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function sameDate(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  try {
    return new Date(a).toISOString().slice(0, 10) === new Date(b).toISOString().slice(0, 10);
  } catch {
    return false;
  }
}

export class MatchingService {
  constructor(private readonly config: MatchingConfig) {}

  match(input: { name?: string; dob?: string; mrn?: string }, patients: Patient[]): MatchCandidate[] {
    const w = this.config.weights;
    const nameNorm = input.name ? normalizeStr(input.name) : "";
    const nameTokens = nameNorm.split(/\s+/).filter((t) => t.length >= 2);

    const scored = patients.map((p) => {
      const fullLower = normalizeStr(`${p.firstName} ${p.lastName}`);
      const lastLower = normalizeStr(p.lastName);
      const mrnMatch = input.mrn && p.mrn.replace(/\D/g, "") === input.mrn.replace(/\D/g, "");
      const dobMatch = sameDate(input.dob, p.dob);

      let score = 0;
      const reasons: string[] = [];

      if (nameTokens.length > 0) {
        const lastHit = nameTokens.some((t) => lastLower.includes(t));
        const nameTokenHits = nameTokens.filter((t) => fullLower.includes(t)).length;
        if (nameTokenHits >= 2) { score += w.fullName; reasons.push("Name match"); }
        else if (lastHit) { score += w.surnameOnly; reasons.push("Surname match"); }
        else if (nameTokenHits === 1) { score += w.partialName; reasons.push("Partial name match"); }
      }
      if (dobMatch) { score += w.dob; reasons.push("DOB match"); }
      if (mrnMatch) { score += w.mrn; reasons.push("MRN match"); }
      score = Math.min(score, this.config.thresholds.maxScore);

      return { patientId: p.id, score, reason: reasons.join(" + ") || "No strong match" };
    });

    return scored
      .filter((c) => c.score >= this.config.thresholds.minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.maxCandidates);
  }
}

/* ── Standalone wrapper for backward compatibility ── */

const _service = new MatchingService(MATCHING_CONFIG);

export function matchPatient(input: {
  name?: string;
  dob?: string;
  mrn?: string;
}): MatchCandidate[] {
  return _service.match(input, patients);
}
