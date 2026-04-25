"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, User, LogOut, Settings, ArrowLeft } from "lucide-react";
import { CeviLogo } from "@/frontend/components/brand/cevi-logo";
import { cn } from "@/shared/utils";

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
      className="absolute top-full right-0 mt-1 w-52 bg-white border border-[var(--cevi-border)] rounded-lg z-50 overflow-hidden"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}
    >
      <div className="px-3 py-2.5 bg-[var(--cevi-surface-warm)] border-b border-[var(--cevi-border-light)]">
        <div className="text-[13px] font-semibold text-[var(--cevi-text)]">Dr. Todd Nguyen</div>
        <div className="text-[11px] text-[var(--cevi-text-muted)]">todd.nguyen@tmghealth.com</div>
      </div>
      <div className="py-1">
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 h-10 text-[13px] text-[var(--cevi-text)] hover:bg-[var(--cevi-surface-warm)] transition-colors"
        >
          <User className="h-3.5 w-3.5 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
          My Account
        </Link>
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 h-10 text-[13px] text-[var(--cevi-text)] hover:bg-[var(--cevi-surface-warm)] transition-colors"
        >
          <Settings className="h-3.5 w-3.5 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
          Settings
        </Link>
        <div className="mx-3 my-0.5 border-t border-[var(--cevi-border-light)]" />
        <button className="w-full flex items-center gap-2.5 px-3 h-10 text-[13px] text-[var(--cevi-accent)] hover:bg-[var(--cevi-surface-warm)] transition-colors">
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
          Log out
        </button>
      </div>
    </div>
  );
}

/** Page title mapping for the mobile header */
function getPageTitle(pathname: string): string | null {
  if (pathname === "/") return null; // Show logo instead
  if (pathname === "/patients") return "Patients";
  if (pathname === "/settings") return "Settings";
  if (pathname === "/audit") return "Audit Trail";
  if (pathname.startsWith("/category/")) return "Category";
  if (pathname.startsWith("/inbox/")) return "Fax Detail";
  return null;
}

function isSubPage(pathname: string): boolean {
  return pathname.startsWith("/inbox/") || pathname.startsWith("/category/");
}

export function MobileTopbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const showBack = isSubPage(pathname);

  return (
    <header
      className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-[var(--cevi-border-light)]"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="h-12 px-4 flex items-center gap-3">
        {/* Left: back button or logo */}
        {showBack ? (
          <Link
            href="/"
            className="p-1 -ml-1 rounded-lg text-[var(--cevi-text)] active:bg-[var(--cevi-surface)]"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
          </Link>
        ) : (
          <Link href="/" className="shrink-0" aria-label="Home">
            <CeviLogo size="sm" />
          </Link>
        )}

        {/* Center: title */}
        {title && (
          <span className="flex-1 text-[15px] font-semibold text-[var(--cevi-text)] truncate">
            {title}
          </span>
        )}
        {!title && <div className="flex-1" />}

        {/* Right: notification + avatar */}
        <button
          className="relative p-1.5 rounded-lg active:bg-[var(--cevi-surface)]"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px] text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
          <span className="absolute top-1 right-1 h-[6px] w-[6px] rounded-full bg-[var(--cevi-accent)] ring-[1.5px] ring-white" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              "h-8 w-8 rounded-full bg-[var(--cevi-accent-bg)] text-[var(--cevi-accent)] font-semibold text-[11px] inline-flex items-center justify-center",
              menuOpen && "ring-2 ring-[var(--cevi-accent)]/20",
            )}
            aria-label="Account"
          >
            TN
          </button>
          {menuOpen && <UserMenu onClose={() => setMenuOpen(false)} />}
        </div>
      </div>
    </header>
  );
}
