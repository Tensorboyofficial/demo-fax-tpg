"use client";

import type { Fax } from "@/shared/types";

interface FaxThumbnailProps {
  fax: Fax;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
}

export function FaxThumbnail({ fax, onClick, onMouseEnter, onMouseLeave }: FaxThumbnailProps) {
  const orgShort = (fax.fromOrg || "FAX").substring(0, 12).toUpperCase();
  const blockCount = Math.min(8, fax.pages * 2);

  return (
    <div
      className="fax-thumb"
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="th-hdr">{orgShort}</div>
      <div className="th-line" />
      <div className="th-block sm" />
      <div className="th-block md" />
      <div className="th-line" />
      {Array.from({ length: blockCount }).map((_, i) => {
        const size = i % 3 === 0 ? "lg" : i % 3 === 1 ? "md" : "sm";
        return <div key={i} className={`th-block ${size}`} />;
      })}
    </div>
  );
}
