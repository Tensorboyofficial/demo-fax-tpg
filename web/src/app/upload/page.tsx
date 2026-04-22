import { UploadForm } from "./UploadForm";

export const metadata = {
  title: "Upload · Cevi",
};

export default function UploadPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-[40px] leading-[1.05] tracking-[-0.02em] text-[var(--cevi-text)]">
          Upload
        </h1>
        <div className="mt-2 text-[13px] text-[var(--cevi-text-muted)]">
          Drop a fax or paste OCR text. Cevi reads, tags, and sends it to the
          chart.
        </div>
      </div>
      <UploadForm />
    </div>
  );
}
