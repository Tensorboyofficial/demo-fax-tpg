/**
 * Patient matching configuration — PRD section 4.2
 *
 * 6-tier cascade:
 *   1. exact_identifier  — MRN or account number exact match
 *   2. exact_account     — eCW account number exact match
 *   3. dob_plus_full_name — DOB + full name exact
 *   4. alias_plus_dob    — alias name + DOB
 *   5. fuzzy_name_plus_dob — fuzzy/partial name + DOB
 *   6. tiebreakers       — address, phone, insurance signals
 *
 * Component weights are defined per-category in category.config.ts.
 * This file holds global defaults and thresholds.
 */

export interface MatchingConfig {
  /** Default component weights (used when no category-specific weights exist) */
  defaultWeights: ComponentWeights;
  /** Global thresholds */
  thresholds: {
    /** Minimum composite score to include as a candidate */
    minScore: number;
    /** Maximum composite score cap */
    maxScore: number;
    /** Default auto-match threshold (per-category overrides in category.config) */
    confidentMatch: number;
    /** Default review threshold */
    review: number;
  };
  /** Max candidates to return */
  maxCandidates: number;
  /** Fuzzy name match tolerance (Levenshtein distance) */
  fuzzyTolerance: number;
}

export interface ComponentWeights {
  identifier_exact: number;
  family_name: number;
  given_name: number;
  middle_name: number;
  dob_exact: number;
  sex: number;
  postal_code: number;
  street_fuzzy: number;
  phone_match: number;
  insurance_member_id: number;
  alias_match: number;
}

export const MATCHING_CONFIG: MatchingConfig = {
  defaultWeights: {
    identifier_exact: 0.30,
    family_name: 0.15,
    given_name: 0.10,
    middle_name: 0.05,
    dob_exact: 0.25,
    sex: 0.02,
    postal_code: 0.03,
    street_fuzzy: 0.02,
    phone_match: 0.02,
    insurance_member_id: 0.05,
    alias_match: 0.01,
  },
  thresholds: {
    minScore: 0.15,
    maxScore: 0.99,
    confidentMatch: 0.95,
    review: 0.70,
  },
  maxCandidates: 5,
  fuzzyTolerance: 2,
};
