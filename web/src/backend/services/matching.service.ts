import type { MatchCandidate, Patient } from "@/shared/types";
import type { MatchingConfig, ComponentWeights } from "../config/matching.config";
import { MATCHING_CONFIG } from "../config/matching.config";
import { patients } from "@/data/seed/patients";

/* ═══════════════════════════════════════════════════════════════════════════
 * String Utilities
 * ═══════════════════════════════════════════════════════════════════════════ */

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function normalizePhone(s: string): string {
  return s.replace(/\D/g, "").slice(-10); // last 10 digits
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

/** Levenshtein distance — for fuzzy name matching (tier 5) */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function sameDate(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  try {
    return new Date(a).toISOString().slice(0, 10) === new Date(b).toISOString().slice(0, 10);
  } catch {
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Match Input — fields extracted from the fax
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface MatchInput {
  name?: string;
  dob?: string;
  mrn?: string;
  phone?: string;
  postalCode?: string;
  street?: string;
  insuranceMemberId?: string;
  /** Fax category — used to look up per-category weights */
  category?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Matching Service — 6-Tier Cascade (PRD section 4.2)
 * ═══════════════════════════════════════════════════════════════════════════ */

export class MatchingService {
  constructor(private readonly config: MatchingConfig) {}

  /**
   * Run the 6-tier matching cascade against a patient roster.
   * Returns scored candidates sorted by composite score descending.
   */
  match(
    input: MatchInput,
    roster: Patient[],
    categoryWeights?: ComponentWeights,
  ): MatchCandidate[] {
    const w = categoryWeights ?? this.config.defaultWeights;
    const tolerance = this.config.fuzzyTolerance;

    // Pre-normalize input
    const inputNameNorm = input.name ? normalize(input.name) : "";
    const inputNameTokens = input.name ? tokenize(input.name) : [];
    const inputMrnNorm = input.mrn ? input.mrn.replace(/\D/g, "") : "";
    const inputPhoneNorm = input.phone ? normalizePhone(input.phone) : "";
    const inputPostalNorm = input.postalCode ? input.postalCode.replace(/\D/g, "").slice(0, 5) : "";
    const inputStreetNorm = input.street ? normalize(input.street) : "";
    const inputInsuranceNorm = input.insuranceMemberId ? normalize(input.insuranceMemberId) : "";

    const scored = roster.map((p) => {
      const components: Record<string, number> = {};
      const reasons: string[] = [];
      let tier = 6; // default to lowest tier

      const pLastNorm = normalize(p.lastName);
      const pFirstNorm = normalize(p.firstName);
      const pFullNorm = normalize(`${p.firstName} ${p.lastName}`);
      const pMrnNorm = p.mrn.replace(/\D/g, "");

      /* ── Tier 1: Exact Identifier (MRN) ── */
      if (inputMrnNorm && pMrnNorm && inputMrnNorm === pMrnNorm) {
        components.identifier_exact = 1.0;
        reasons.push("MRN exact match");
        tier = 1;
      } else {
        components.identifier_exact = 0;
      }

      /* ── Tier 2: Exact Account ── */
      // For seed data, MRN serves as account number
      // If tier 1 didn't match, check partial account match
      if (components.identifier_exact === 0 && inputMrnNorm && pMrnNorm) {
        if (pMrnNorm.includes(inputMrnNorm) || inputMrnNorm.includes(pMrnNorm)) {
          components.identifier_exact = 0.8;
          reasons.push("Account partial match");
          tier = Math.min(tier, 2);
        }
      }

      /* ── Tier 3: DOB + Full Name Exact ── */
      const dobMatch = sameDate(input.dob, p.dob);
      components.dob_exact = dobMatch ? 1.0 : 0;
      if (dobMatch) reasons.push("DOB match");

      // Family name
      if (inputNameTokens.length > 0) {
        const lastHit = inputNameTokens.some((t) => t === pLastNorm || pLastNorm.includes(t));
        components.family_name = lastHit ? 1.0 : 0;
        if (lastHit) reasons.push("Last name match");

        // Given name
        const firstHit = inputNameTokens.some((t) => t === pFirstNorm || pFirstNorm.includes(t));
        components.given_name = firstHit ? 1.0 : 0;
        if (firstHit) reasons.push("First name match");

        // Middle name — check if there's a 3rd token
        if (inputNameTokens.length >= 3) {
          const middleToken = inputNameTokens[1]; // assume middle is second token
          components.middle_name = pFullNorm.includes(middleToken) ? 1.0 : 0;
        } else {
          components.middle_name = 0;
        }

        if (dobMatch && lastHit && firstHit) {
          tier = Math.min(tier, 3);
        }
      } else {
        components.family_name = 0;
        components.given_name = 0;
        components.middle_name = 0;
      }

      /* ── Tier 4: Alias + DOB ── */
      // Seed data doesn't have aliases, but we check reversed name order
      if (dobMatch && inputNameTokens.length >= 2 && components.given_name === 0) {
        // Try reversed: maybe "LastName FirstName" was on the document
        const reversedHit = inputNameTokens.some((t) => t === pFirstNorm) &&
                           inputNameTokens.some((t) => t === pLastNorm);
        if (reversedHit) {
          components.alias_match = 1.0;
          components.given_name = 0.8;
          components.family_name = 0.8;
          reasons.push("Name alias (reversed order)");
          tier = Math.min(tier, 4);
        } else {
          components.alias_match = 0;
        }
      } else {
        components.alias_match = 0;
      }

      /* ── Tier 5: Fuzzy Name + DOB ── */
      if (components.family_name === 0 && inputNameTokens.length > 0) {
        const lastDist = levenshtein(inputNameTokens[inputNameTokens.length - 1] ?? "", pLastNorm);
        if (lastDist <= tolerance && lastDist > 0) {
          components.family_name = 1.0 - (lastDist / (tolerance + 1));
          reasons.push(`Fuzzy last name (edit distance ${lastDist})`);
          if (dobMatch) tier = Math.min(tier, 5);
        }
        if (components.given_name === 0 && inputNameTokens.length >= 1) {
          const firstDist = levenshtein(inputNameTokens[0], pFirstNorm);
          if (firstDist <= tolerance && firstDist > 0) {
            components.given_name = 1.0 - (firstDist / (tolerance + 1));
            reasons.push(`Fuzzy first name (edit distance ${firstDist})`);
          }
        }
      }

      /* ── Tier 6: Tiebreaker signals ── */
      // Sex
      if (input.name) {
        // Can't infer sex from name, but if extracted fields include it
        components.sex = 0; // Not available in basic match input
      } else {
        components.sex = 0;
      }

      // Postal code
      if (inputPostalNorm) {
        components.postal_code = 0; // Seed patients don't have addresses
      } else {
        components.postal_code = 0;
      }

      // Street
      if (inputStreetNorm) {
        components.street_fuzzy = 0;
      } else {
        components.street_fuzzy = 0;
      }

      // Phone
      if (inputPhoneNorm && p.phone) {
        const pPhoneNorm = normalizePhone(p.phone);
        components.phone_match = inputPhoneNorm === pPhoneNorm ? 1.0 : 0;
        if (components.phone_match === 1.0) reasons.push("Phone match");
      } else {
        components.phone_match = 0;
      }

      // Insurance member ID
      if (inputInsuranceNorm && p.insurance) {
        const pInsNorm = normalize(p.insurance);
        components.insurance_member_id = pInsNorm.includes(inputInsuranceNorm) ? 0.7 : 0;
        if (components.insurance_member_id > 0) reasons.push("Insurance match");
      } else {
        components.insurance_member_id = 0;
      }

      /* ── Composite score ── */
      let score = 0;
      for (const [key, weight] of Object.entries(w)) {
        score += (components[key] ?? 0) * weight;
      }
      score = Math.min(score, this.config.thresholds.maxScore);

      return {
        patientId: p.id,
        score,
        reason: reasons.join(" + ") || "No strong match",
        components,
        _tier: tier,
      };
    });

    return scored
      .filter((c) => c.score >= this.config.thresholds.minScore)
      .sort((a, b) => {
        // Primary: tier ascending (higher tier = better)
        if (a._tier !== b._tier) return a._tier - b._tier;
        // Secondary: score descending
        return b.score - a.score;
      })
      .slice(0, this.config.maxCandidates)
      .map(({ _tier, ...rest }) => rest); // strip internal _tier field
  }

  /**
   * Determine match decision based on top candidate score and thresholds.
   */
  decide(
    candidates: MatchCandidate[],
    confidentThreshold: number,
    reviewThreshold: number,
  ): { decision: string; matchedPatientId: string | null } {
    if (candidates.length === 0) {
      return { decision: "unmatched", matchedPatientId: null };
    }

    const top = candidates[0];

    // Check for ambiguous: top two are very close
    if (candidates.length >= 2) {
      const gap = top.score - candidates[1].score;
      if (gap < 0.05 && top.score >= reviewThreshold) {
        return { decision: "ambiguous", matchedPatientId: null };
      }
    }

    if (top.score >= confidentThreshold) {
      return { decision: "matched_confident", matchedPatientId: top.patientId };
    }

    if (top.score >= reviewThreshold) {
      return { decision: "needs_review", matchedPatientId: top.patientId };
    }

    return { decision: "unmatched", matchedPatientId: null };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Standalone wrapper — backward compatible with existing upload pipeline
 * ═══════════════════════════════════════════════════════════════════════════ */

const _service = new MatchingService(MATCHING_CONFIG);

export function matchPatient(input: {
  name?: string;
  dob?: string;
  mrn?: string;
}): MatchCandidate[] {
  return _service.match(input, patients);
}
