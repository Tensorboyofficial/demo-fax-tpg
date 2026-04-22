import { UploadForm } from "./UploadForm";

export const metadata = {
  title: "Upload a fax · Cevi",
};

export default function UploadPage() {
  return (
    <div>
      <div className="mb-8 max-w-3xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] mb-2">
          Upload a fax
        </div>
        <h1 className="font-serif text-[32px] leading-[1.1] tracking-[-0.02em] text-[var(--cevi-text)]">
          Drop your own fax. Watch Cevi handle it.
        </h1>
        <p className="mt-3 text-[14px] text-[var(--cevi-text-muted)]">
          Upload a PDF, image, or paste OCR text. Cevi AI classifies the document,
          matches the patient against your directory, extracts diagnoses and medications,
          and routes it through the right workflow — all in under ten seconds. The
          result lands in your inbox, persisted in Supabase, with a full audit trail.
        </p>
      </div>
      <UploadForm />
    </div>
  );
}
