import Link from "next/link";
import { UploadCloud, ArrowRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { IconBox } from "@/components/ui/icon-box";

/**
 * A compact inline CTA that sends the user to /upload.
 * Non-interactive by design — the heavy dropzone lives on the dedicated page.
 */
export function InlineDropzone() {
  return (
    <Link
      href="/upload"
      className="block group"
      aria-label="Upload a fax to Cevi"
    >
      <Card
        padding="md"
        className="group-hover:border-[var(--cevi-accent)] group-hover:bg-[var(--cevi-accent-light)] transition-colors"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <IconBox tone="accent">
            <UploadCloud className="h-5 w-5" strokeWidth={1.5} />
          </IconBox>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-[var(--cevi-text)]">
              Drop a fax, paste OCR text, or scan a paper EOB
            </div>
            <div className="mt-0.5 text-[12px] text-[var(--cevi-text-muted)] inline-flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-[var(--cevi-accent)]" strokeWidth={1.5} />
              Cevi tags it and sends it to the chart in under ten seconds.
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--cevi-accent)]">
            Upload
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          </span>
        </div>
      </Card>
    </Link>
  );
}
