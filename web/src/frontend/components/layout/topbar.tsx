import { Search } from "lucide-react";
import { Input } from "@/frontend/components/ui/input";

export function Topbar() {
  return (
    <header className="h-14 bg-white border-b border-[var(--cevi-border)]">
      <div className="h-full px-6 md:px-10 flex items-center gap-4">
        <div className="flex-1" />
        <div className="hidden md:block w-[280px]">
          <Input
            placeholder="Search faxes, patients, MRNs…"
            iconLeft={<Search className="h-3.5 w-3.5" strokeWidth={1.5} />}
          />
        </div>
        <div className="inline-flex items-center gap-2 h-8 px-3 rounded-full bg-white border border-[var(--cevi-border)] text-[12px] font-semibold text-[var(--cevi-text)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--cevi-accent)]" />
          TMG Arlington
        </div>
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
