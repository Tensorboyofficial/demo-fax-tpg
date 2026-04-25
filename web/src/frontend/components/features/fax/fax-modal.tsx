"use client";

import { useEffect, useRef } from "react";
import type { Fax } from "@/shared/types";

interface FaxModalProps {
  fax: Fax | null;
  onClose: () => void;
}

export function FaxModal({ fax, onClose }: FaxModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!fax) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center pt-10 pb-5 overflow-auto"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="bg-white rounded-[10px] w-full max-w-[680px] mx-4 flex flex-col max-h-[85vh] overflow-hidden"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-[#EAEAEA] bg-[#FAFAFA] shrink-0 gap-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[15px] font-medium text-[#1A1A1A] truncate">
              {fax.extracted.patientNameOnDoc ?? fax.id} &mdash; {fax.fromOrg}
            </span>
            <span className="text-[12px] text-[#9CA3AF] font-medium truncate">
              {fax.id} &middot; {fax.pages} page{fax.pages !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-[13px] font-medium text-[#1A1A1A] bg-white border border-[#D4D4D4] rounded-[10px] hover:bg-[#F5F5F5] transition-colors"
            >
              Close &middot; Esc
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#F9F9F9]">
          <div className="fax-paper rounded-md p-6 text-[12px] leading-[1.6] font-mono whitespace-pre-wrap">
            {fax.ocrText}
          </div>
        </div>
      </div>
    </div>
  );
}
