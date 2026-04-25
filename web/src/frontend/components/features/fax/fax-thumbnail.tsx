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
      ) : fileUrl && !imgError ? (
        /* PDF or non-image — show file icon with page count */
        <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--cevi-surface)]">
          <svg className="w-5 h-5 text-[var(--cevi-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="text-[7px] font-medium text-[var(--cevi-text-muted)] mt-0.5">{fax.pages}p</span>
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
