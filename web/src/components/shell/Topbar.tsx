import Link from "next/link";
import { UploadCloud, ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CeviLogo } from "@/components/brand/CeviLogo";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 h-14 bg-white/95 backdrop-blur-sm border-b border-[var(--cevi-border)]">
      <div className="h-full max-w-[1400px] mx-auto px-6 md:px-10 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-3 text-[var(--cevi-text)] hover:opacity-80 transition-opacity"
          aria-label="Cevi home"
        >
          <CeviLogo size="sm" />
          <span className="hidden sm:block h-5 w-px bg-[var(--cevi-border)]" aria-hidden="true" />
          <span className="hidden sm:block text-[10px] uppercase tracking-[0.08em] font-semibold text-[var(--cevi-text-muted)] leading-tight">
            Transcend Medical
            <br />
            Group
          </span>
        </Link>

        <div className="flex-1" />

        <Link
          href="/audit"
          className="hidden md:inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-semibold text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)] hover:bg-[var(--cevi-surface)] transition-colors"
        >
          <ScrollText className="h-3.5 w-3.5" strokeWidth={1.5} />
          Audit
        </Link>

        <Link
          href="/upload"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-semibold bg-[var(--cevi-accent)] text-white hover:bg-[var(--cevi-accent-hover)] transition-colors"
        >
          <UploadCloud className="h-3.5 w-3.5" strokeWidth={2} />
          Upload a fax
        </Link>

        <div className="hidden sm:block h-5 w-px bg-[var(--cevi-border)]" aria-hidden="true" />

        <Badge variant="jade" dot size="sm" className="hidden md:inline-flex">
          eCW connected
        </Badge>

        <div
          className="h-8 w-8 rounded-full bg-[var(--cevi-accent-bg)] text-[var(--cevi-accent)] font-semibold text-[11px] inline-flex items-center justify-center"
          aria-label="Dr. Todd Nguyen"
          title="Dr. Todd Nguyen"
        >
          TN
        </div>
      </div>
    </header>
  );
}
