import { DemoStage } from "./DemoStage";

export const metadata = {
  title: "Live Demo · Cevi for Texas Physicians",
};

export default function DemoPage() {
  return (
    <div>
      <div className="mb-8 max-w-3xl">
        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] mb-2">
          Live demo
        </div>
        <h1 className="font-serif text-[32px] leading-[1.1] tracking-[-0.02em] text-[var(--cevi-text)]">
          Watch a critical fax get handled — end to end.
        </h1>
        <p className="mt-3 text-[14px] text-[var(--cevi-text-muted)]">
          Click the button. A realistic Quest Diagnostics critical potassium lab result
          lands in your inbox, gets OCR'd, classified by Claude live, matched to the
          right patient, extracted, routed to Dr. Harbison, written back to
          eClinicalWorks, and triggers an SMS to the on-call nurse. Under 15 seconds.
        </p>
      </div>
      <DemoStage />
    </div>
  );
}
