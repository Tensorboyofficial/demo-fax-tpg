"use client";

import { useState } from "react";
import type { Fax } from "@/shared/types";

interface FaxThumbnailProps {
  fax: Fax;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
}

export function FaxThumbnail({ fax, onClick, onMouseEnter, onMouseLeave }: FaxThumbnailProps) {
  const [imgError, setImgError] = useState(false);
  const fileUrl = fax.fileUrl;
  const isImage = fileUrl && /\.(png|jpe?g|tiff?|webp|gif)(\?|$)/i.test(fileUrl);
  const ocrSnippet = fax.ocrText?.substring(0, 300) ?? "";

  return (
    <div
      className="fax-thumb"
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {fileUrl && isImage && !imgError ? (
        <img
          src={fileUrl}
          alt="Fax preview"
          className="w-full h-full object-cover object-top rounded-[2px]"
          onError={() => setImgError(true)}
        />
      ) : ocrSnippet ? (
        /* Mini document preview from OCR text */
        <div className="w-full h-full bg-white rounded-[2px] overflow-hidden p-[3px]">
          <div className="text-[2.5px] leading-[1.4] text-[#333] font-mono whitespace-pre-wrap break-all overflow-hidden" style={{ maxHeight: "100%" }}>
            {ocrSnippet}
          </div>
        </div>
      ) : (
        /* Fallback: wireframe placeholder */
        <>
          <div className="th-hdr">{(fax.fromOrg || "FAX").substring(0, 12).toUpperCase()}</div>
          <div className="th-line" />
          <div className="th-block sm" />
          <div className="th-block md" />
          <div className="th-line" />
          {Array.from({ length: Math.min(8, fax.pages * 2) }).map((_, i) => (
            <div key={i} className={`th-block ${i % 3 === 0 ? "lg" : i % 3 === 1 ? "md" : "sm"}`} />
          ))}
        </>
      )}
    </div>
  );
}
