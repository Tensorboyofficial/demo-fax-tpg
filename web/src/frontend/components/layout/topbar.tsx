"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogOut, Settings, Bell, Menu } from "lucide-react";
import { cn } from "@/shared/utils";
import { useSidebar } from "./sidebar-context";
import { useIsDesktop } from "@/frontend/hooks/use-media-query";

function UserMenu({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-1 w-52 bg-white border border-[var(--cevi-border)] rounded-lg shadow-[var(--shadow-md)] z-50 overflow-hidden"
    >
      <div className="px-3 py-2.5 bg-[var(--cevi-surface-warm)] border-b border-[var(--cevi-border-light)]">
        <div className="text-[12px] font-semibold text-[var(--cevi-text)]">Dr. Todd Nguyen</div>
        <div className="text-[10px] text-[var(--cevi-text-muted)]">todd.nguyen@tmghealth.com</div>
      </div>
      <div className="py-1">
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 h-9 text-[13px] text-[var(--cevi-text)] hover:bg-[var(--cevi-surface-warm)] transition-colors"
        >
          <User className="h-3.5 w-3.5 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
          My Account
        </Link>
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 h-9 text-[13px] text-[var(--cevi-text)] hover:bg-[var(--cevi-surface-warm)] transition-colors"
        >
          <Settings className="h-3.5 w-3.5 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
          Settings
        </Link>
        <div className="mx-3 my-0.5 border-t border-[var(--cevi-border-light)]" />
        <button className="w-full flex items-center gap-2.5 px-3 h-9 text-[13px] text-[var(--cevi-accent)] hover:bg-[var(--cevi-surface-warm)] transition-colors">
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
          Log out
        </button>
      </div>
    </div>
  );
}

export function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { openMobile } = useSidebar();
  const isDesktop = useIsDesktop();

  return (
    <header className="h-12 bg-white border-b border-[var(--cevi-border)] sticky top-0 z-10">
      <div className="h-full px-4 sm:px-6 md:px-10 flex items-center gap-3">
        {/* Mobile hamburger — hidden on desktop */}
        {!isDesktop && (
          <button
            onClick={openMobile}
            className="p-1.5 -ml-1 rounded-lg hover:bg-[var(--cevi-surface)] transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-[var(--cevi-text)]" strokeWidth={1.5} />
          </button>
        )}

        <div className="flex-1" />

        {/* Notification bell */}
        <button
          className="relative p-1.5 rounded-lg hover:bg-[var(--cevi-surface)] transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
          <span className="absolute top-1 right-1 h-[7px] w-[7px] rounded-full bg-[var(--cevi-accent)] ring-[1.5px] ring-white" />
        </button>

        {/* User avatar */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              "h-7 w-7 rounded-full bg-[var(--cevi-accent-bg)] text-[var(--cevi-accent)] font-semibold text-[10px] inline-flex items-center justify-center transition-all",
              menuOpen ? "ring-2 ring-[var(--cevi-accent)]/20" : "hover:ring-2 hover:ring-[var(--cevi-border)]",
            )}
            aria-label="Account menu"
          >
            TN
          </button>
          {menuOpen && <UserMenu onClose={() => setMenuOpen(false)} />}
        </div>
      </div>
    </header>
  );
}
