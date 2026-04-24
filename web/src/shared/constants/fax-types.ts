export const FAX_TYPES = [
  "referral",
  "lab_result",
  "prior_auth",
  "records_request",
  "rx_refill",
  "specialist_consult",
  "imaging_report",
  "unknown",
] as const;

export type FaxType = (typeof FAX_TYPES)[number];
