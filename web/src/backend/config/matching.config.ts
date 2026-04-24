export const MATCHING_CONFIG = {
  weights: {
    fullName: 0.55,
    surnameOnly: 0.30,
    partialName: 0.15,
    dob: 0.40,
    mrn: 0.50,
  },
  thresholds: {
    minScore: 0.20,
    maxScore: 0.99,
    autoMatchAbove: 0.80,
  },
  maxCandidates: 3,
} as const;

export type MatchingConfig = typeof MATCHING_CONFIG;
