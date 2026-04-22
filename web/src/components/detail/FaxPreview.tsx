import { cn, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Printer as FaxIcon, FileText } from "lucide-react";
import type { Fax } from "@/lib/types";

interface Props {
  fax: Fax;
  className?: string;
}

export function FaxPreview({ fax, className }: Props) {
  return (
    <div className={cn("flex flex-col", className)}>
      {/* Paper toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--cevi-surface-warm)] border border-[var(--cevi-border)] border-b-0 rounded-t-lg">
        <div className="flex items-center gap-2 text-[12px] text-[var(--cevi-text-secondary)]">
          <FaxIcon className="h-3.5 w-3.5 text-[var(--cevi-accent)]" strokeWidth={1.5} />
          <span className="font-semibold">{fax.pages}-page fax</span>
          <span className="text-[var(--cevi-text-muted)]">·</span>
          <span>{formatDateTime(fax.receivedAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" size="sm">
            PHI · Confidential
          </Badge>
        </div>
      </div>

      {/* Paper surface */}
      <div className="fax-paper flex-1 border border-[var(--cevi-border)] rounded-b-lg p-8 relative overflow-hidden min-h-[520px]">
        {/* Watermark */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.04]"
          aria-hidden="true"
        >
          <div className="font-serif text-[96px] rotate-[-20deg] tracking-tight">
            CONFIDENTIAL
          </div>
        </div>

        {/* Document content */}
        <div className="relative font-mono text-[11px] leading-[1.55] text-[#2a2722] whitespace-pre-wrap">
          <div className="fax-paper-header pb-3 mb-4 text-[10px] text-[#645f57] font-sans tracking-[0.05em] flex items-center justify-between">
            <span>RECEIVED AT {fax.faxNumberTo}</span>
            <span>{formatDateTime(fax.receivedAt)}</span>
          </div>
          <div>{fax.ocrText}</div>
          <div className="mt-6 pt-3 border-t border-dashed border-[rgba(0,0,0,0.2)] text-[10px] text-[#645f57] font-sans flex items-center justify-between">
            <span>— end of page {fax.pages} —</span>
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3 w-3" strokeWidth={1.5} />
              Medsender inbound · {fax.fromNumber}
            </span>
          </div>
        </div>

        {/* RECEIVED stamp */}
        <div className="absolute top-10 right-8 rotate-[8deg] border-[3px] border-[var(--cevi-accent)] text-[var(--cevi-accent)] px-3 py-1 font-bold text-[12px] tracking-[0.15em] opacity-60 select-none pointer-events-none">
          RECEIVED
          <div className="text-[8px] tracking-[0.1em] font-semibold text-center mt-0.5">
            {new Date(fax.receivedAt).toLocaleDateString("en-US", {
              timeZone: "UTC",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
