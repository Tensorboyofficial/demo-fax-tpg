"use client";

import type { Fax } from "@/shared/types";

interface HoverPreviewProps {
  fax: Fax | null;
  position: { x: number; y: number } | null;
}

export function HoverPreview({ fax, position }: HoverPreviewProps) {
  if (!fax || !position) return null;

  let x = position.x + 20;
  let y = position.y + 10;
  if (typeof window !== "undefined") {
    if (x + 280 > window.innerWidth) x = position.x - 300;
    if (y + 360 > window.innerHeight) y = window.innerHeight - 370;
  }

  return (
    <div
      className="fixed z-[100] bg-white border border-[#D4D4D4] rounded-lg overflow-hidden pointer-events-none"
      style={{
        left: x,
        top: y,
        width: 280,
        maxHeight: 360,
        boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
      }}
    >
      <div className="p-3 text-[7px] leading-[1.3] font-mono text-[#1A1A1A] whitespace-pre-wrap overflow-hidden">
        <div className="text-center text-[7.5px] font-bold mb-1">{fax.fromOrg.toUpperCase()}</div>
        <hr className="border-t border-[#E5E5E5] my-1" />
        <div className="mb-1"><strong>PATIENT:</strong> {fax.extracted.patientNameOnDoc ?? "N/A"}</div>
        <div className="mb-1"><strong>DOB:</strong> {fax.extracted.patientDobOnDoc ?? "N/A"}</div>
        <hr className="border-t border-[#E5E5E5] my-1" />
        <div className="text-[6px] text-[#888] overflow-hidden" style={{ maxHeight: 240 }}>
          {fax.ocrText.substring(0, 600)}
        </div>
      </div>
    </div>
  );
}
