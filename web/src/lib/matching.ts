import { patients } from "@/data/patients";
import type { MatchCandidate } from "@/lib/types";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function sameDate(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  try {
    const da = new Date(a).toISOString().slice(0, 10);
    const db = new Date(b).toISOString().slice(0, 10);
    return da === db;
  } catch {
    return false;
  }
}

/**
 * Match an extracted patient name/DOB/MRN against the seeded patient directory.
 * Returns up to 3 candidates sorted by score desc. No DB — pure in-memory for speed.
 */
export function matchPatient(input: {
  name?: string;
  dob?: string;
  mrn?: string;
}): MatchCandidate[] {
  const nameNorm = input.name ? normalize(input.name) : "";
  const nameTokens = nameNorm.split(/\s+/).filter((t) => t.length >= 2);

  const scored = patients.map((p) => {
    const fullLower = normalize(`${p.firstName} ${p.lastName}`);
    const lastLower = normalize(p.lastName);
    const mrnMatch = input.mrn && p.mrn.replace(/\D/g, "") === input.mrn.replace(/\D/g, "");
    const dobMatch = sameDate(input.dob, p.dob);

    let score = 0;
    const reasons: string[] = [];

    // name matching
    if (nameTokens.length > 0) {
      const lastHit = nameTokens.some((t) => lastLower.includes(t));
      const nameTokenHits = nameTokens.filter((t) => fullLower.includes(t)).length;
      if (nameTokenHits >= 2) {
        score += 0.55;
        reasons.push("Name match");
      } else if (lastHit) {
        score += 0.3;
        reasons.push("Surname match");
      } else if (nameTokenHits === 1) {
        score += 0.15;
        reasons.push("Partial name match");
      }
    }
    if (dobMatch) {
      score += 0.4;
      reasons.push("DOB match");
    }
    if (mrnMatch) {
      score += 0.5;
      reasons.push("MRN match");
    }
    score = Math.min(score, 0.99);

    return {
      patientId: p.id,
      score,
      reason: reasons.join(" + ") || "No strong match",
    };
  });

  return scored
    .filter((c) => c.score >= 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
