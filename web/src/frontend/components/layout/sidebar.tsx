"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Copy,
  ExternalLink,
  Home,
  LogOut,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Table2,
  User,
  X,
} from "lucide-react";
import { CeviLogo } from "@/frontend/components/brand/cevi-logo";
import { cn } from "@/shared/utils";
import { useIsDesktop } from "@/frontend/hooks/use-media-query";
import { useSidebar } from "./sidebar-context";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/patients", label: "Patients", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/category", label: "Schemas", icon: Table2 },
];

const W_EXPANDED = 220;
const W_COLLAPSED = 64;
const W_MOBILE = 280;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/inbox");
  if (href === "/category") return pathname.startsWith("/category");
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* ─── Sidebar ─── */
export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle, mobileOpen, closeMobile } = useSidebar();
  const isDesktop = useIsDesktop();
  const [accountOpen, setAccountOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const width = !isDesktop ? W_MOBILE : collapsed ? W_COLLAPSED : W_EXPANDED;
  const visible = isDesktop || mobileOpen;
  const showLabels = isDesktop ? !collapsed : true;

  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-30 flex flex-col bg-[var(--cevi-surface-warm)] border-r border-[var(--cevi-border-light)] transition-[width,transform] duration-200 ease-out"
        style={{
          width,
          transform: visible ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {/* Header — logo (when expanded) + toggle */}
        <div
          className={cn(
            "h-14 shrink-0 flex items-center",
            showLabels ? "justify-between px-4" : "justify-center px-2",
          )}
        >
          {showLabels && (
            <Link
              href="/"
              aria-label="Cevi home"
              className="inline-flex items-center text-[var(--cevi-text)]"
              onClick={closeMobile}
            >
              <CeviLogo size="sm" />
            </Link>
          )}

          {isDesktop ? (
            <button
              onClick={toggle}
              type="button"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface)] hover:text-[var(--cevi-text)] transition-colors"
            >
              {collapsed ? (
                <PanelLeftOpen className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
              )}
            </button>
          ) : (
            <button
              onClick={closeMobile}
              type="button"
              aria-label="Close sidebar"
              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface)] hover:text-[var(--cevi-text)] transition-colors"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto scrollbar-thin pt-1",
            showLabels ? "px-3" : "px-2",
          )}
        >
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active = isActive(pathname ?? "", item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={!showLabels ? item.label : undefined}
                    onClick={closeMobile}
                    className={cn(
                      "flex items-center rounded-lg text-[14px] font-medium transition-colors",
                      showLabels ? "h-9 gap-3 px-3" : "h-9 w-10 mx-auto justify-center",
                      active
                        ? "bg-[var(--cevi-bg)] text-[var(--cevi-text)] font-semibold"
                        : "text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface)] hover:text-[var(--cevi-text)]",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0",
                        active ? "text-[var(--cevi-accent)]" : "text-current",
                      )}
                      strokeWidth={1.5}
                    />
                    {showLabels && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer — Support + Account */}
        <div
          className={cn(
            "shrink-0 pb-3 pt-2 space-y-1",
            showLabels ? "px-3" : "px-2",
          )}
        >
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            title={!showLabels ? "Support" : undefined}
            className={cn(
              "w-full flex items-center rounded-lg text-[14px] font-medium text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface)] hover:text-[var(--cevi-text)] transition-colors",
              showLabels ? "h-9 gap-3 px-3" : "h-9 w-10 mx-auto justify-center",
            )}
          >
            <Mail className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
            {showLabels && <span>Support</span>}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((v) => !v)}
              title={!showLabels ? "TMG" : undefined}
              className={cn(
                "w-full flex items-center rounded-lg text-[14px] font-medium text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface)] hover:text-[var(--cevi-text)] transition-colors",
                showLabels ? "h-9 gap-3 px-3" : "h-9 w-10 mx-auto justify-center",
              )}
            >
              <Building2 className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
              {showLabels && <span>TMG</span>}
            </button>
            {accountOpen && (
              <AccountMenu
                onClose={() => setAccountOpen(false)}
                showLabels={showLabels}
              />
            )}
          </div>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {!isDesktop && mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}
    </>
  );
}

/* ─── Account Menu (logout) ─── */
function AccountMenu({
  onClose,
  showLabels,
}: {
  onClose: () => void;
  showLabels: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);
  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-[var(--cevi-border)] bg-[var(--cevi-bg)] shadow-md overflow-hidden"
    >
      <button
        type="button"
        onClick={onClose}
        className={cn(
          "w-full flex items-center gap-2.5 h-9 text-[13px] text-[var(--cevi-accent)] hover:bg-[var(--cevi-surface)] transition-colors",
          showLabels ? "px-3" : "justify-center px-1",
        )}
      >
        <LogOut className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
        {showLabels && <span>Log out</span>}
      </button>
    </div>
  );
}

/* ─── Support Modal ─── */
function SupportModal({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);
  const email = "theo@cevi.ai";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        ref={ref}
        className="bg-[var(--cevi-bg)] rounded-xl border border-[var(--cevi-border)] shadow-xl w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[18px] font-semibold text-[var(--cevi-text)]">
            Contact Support
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--cevi-surface)] transition-colors"
          >
            <X className="h-4 w-4 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
          </button>
        </div>
        <p className="text-[13px] text-[var(--cevi-text-secondary)] mb-4">
          Reach out to our support team for assistance with any questions or issues.
        </p>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--cevi-surface)] border border-[var(--cevi-border-light)]">
          <Mail
            className="h-4 w-4 text-[var(--cevi-text-muted)] shrink-0"
            strokeWidth={1.5}
          />
          <span className="flex-1 text-[14px] font-medium text-[var(--cevi-text)]">
            {email}
          </span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(email);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-[var(--cevi-border)] bg-[var(--cevi-bg)] text-[12px] font-medium text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)] transition-colors"
          >
            <Copy className="h-3 w-3" strokeWidth={1.5} />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--cevi-accent)] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
            Open Email Client
          </a>
        </div>
      </div>
    </div>
  );
}
