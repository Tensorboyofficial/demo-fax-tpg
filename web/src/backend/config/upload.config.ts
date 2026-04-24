export const UPLOAD_CONFIG = {
  maxFileSizeBytes: 15 * 1024 * 1024,
  maxOcrTextLength: 50_000,
  allowedMimeTypes: [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
  ] as const,
  defaultClinic: "Arlington",
  defaultFaxNumber: "817-860-2704",
  idPrefix: "FAX-UP",
} as const;
