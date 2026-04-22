"use client";

import { Bell, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur-sm border-b border-[var(--cevi-border)]">
      <div className="h-full px-6 flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-[12px] text-[var(--cevi-text-muted)]">
          <Sparkles className="h-3.5 w-3.5 text-[var(--cevi-accent)]" strokeWidth={1.5} />
          <span>
            <span className="text-[var(--cevi-text)] font-semibold">Cevi AI</span>{" "}
            · live · processed 14 faxes in the last hour
          </span>
        </div>

        <div className="flex-1" />

        <div className="hidden lg:block w-72">
          <Input
            placeholder="Search patients, faxes, MRNs…"
            iconLeft={<Search className="h-3.5 w-3.5" strokeWidth={1.5} />}
          />
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative h-9 w-9 rounded-md inline-flex items-center justify-center text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface)] hover:text-[var(--cevi-text)] transition-colors"
        >
          <Bell className="h-4 w-4" strokeWidth={1.5} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--cevi-accent)]" />
        </button>

        <div className="h-6 w-px bg-[var(--cevi-border)]" />

        <Badge variant="jade" dot size="sm">
          eCW Connected
        </Badge>

        <button
          type="button"
          aria-label="User menu"
          className="h-9 w-9 rounded-full bg-[var(--cevi-accent-bg)] text-[var(--cevi-accent)] font-semibold text-[12px] inline-flex items-center justify-center hover:bg-[var(--cevi-accent-light)] transition-colors"
        >
          TP
        </button>
      </div>
    </header>
  );
}
