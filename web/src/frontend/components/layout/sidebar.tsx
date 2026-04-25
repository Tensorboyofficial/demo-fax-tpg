"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  Settings,
  Table2,
  Mail,
  Building2,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Copy,
  ExternalLink,
} from "lucide-react";
import { CeviLogo } from "@/frontend/components/brand/cevi-logo";
import { cn } from "@/shared/utils";
import { useState, useRef, useEffect } from "react";
import { useSidebar } from "./sidebar-context";
import { useIsDesktop } from "@/frontend/hooks/use-media-query";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const MAIN_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/patients", label: "Patients", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/category", label: "Schemas", icon: Table2 },
];

/* ─── Account Menu (logout only) ─── */
function AccountMenu({ onClose, collapsed, anchorRef }: { onClose: () => void; collapsed: boolean; anchorRef: React.RefObject<HTMLDivElement | null> }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ bottom: number; left: number } | null>(null);

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ bottom: window.innerHeight - rect.top + 4, left: rect.left });
    }
  }, [anchorRef]);

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
      className="fixed bg-white border border-[var(--cevi-border)] rounded-lg z-50 overflow-hidden"
      style={{
        bottom: pos?.bottom ?? 60,
        left: pos?.left ?? 12,
        width: collapsed ? 208 : 180,
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
      }}
    >
      <div className="py-1">
        <button
          onClick={onClose}
          className="w-full flex items-center gap-2.5 px-3 h-9 text-[13px] text-[var(--cevi-accent)] hover:bg-[var(--cevi-surface)] transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
          Log out
        </button>
      </div>
    </div>
  );
}

/* ─── Support Modal ─── */
function SupportModal({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const email = "theo@cevi.ai";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        ref={ref}
        className="bg-white rounded-xl border border-[var(--cevi-border)] shadow-xl w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[18px] font-semibold text-[var(--cevi-text)]">Contact Support</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--cevi-surface)] transition-colors">
            <X className="h-4 w-4 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
          </button>
        </div>
        <p className="text-[13px] text-[var(--cevi-text-secondary)] mb-4">
          Reach out to our support team for assistance with any questions or issues.
        </p>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--cevi-surface-warm)] border border-[var(--cevi-border-light)]">
          <Mail className="h-4 w-4 text-[var(--cevi-text-muted)] shrink-0" strokeWidth={1.5} />
          <span className="flex-1 text-[14px] font-medium text-[var(--cevi-text)]">{email}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(email);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-[var(--cevi-border)] bg-white text-[12px] font-medium text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)] transition-colors"
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

/* ─── Sidebar ─── */
export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle, mobileOpen, closeMobile } = useSidebar();
  const isDesktop = useIsDesktop();
  const [accountOpen, setAccountOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const accountAnchorRef = useRef<HTMLDivElement>(null);

  // Close mobile sidebar on route change
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname.startsWith("/inbox");
    if (href === "/category") return pathname.startsWith("/category");
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const sidebarWidth = isDesktop ? (collapsed ? 56 : 200) : 260;
  const visible = isDesktop || mobileOpen;

  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-20 bg-[var(--cevi-surface-warm)] flex flex-col transition-all duration-200 ease-out"
        style={{
          width: sidebarWidth,
          transform: visible ? "translateX(0)" : "translateX(-100%)",
          boxShadow: !isDesktop && mobileOpen ? "4px 0 24px rgba(0,0,0,0.12)" : "none",
        }}
      >
        {/* Logo + collapse toggle */}
        <div className={cn("h-12 flex items-center shrink-0", collapsed ? "justify-center px-2" : "justify-between px-4")}>
          {collapsed ? (
            <button
              onClick={toggle}
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-[var(--cevi-surface)] transition-colors text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)]"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" strokeWidth={1.5} />
            </button>
          ) : (
            <>
              <Link href="/" aria-label="Cevi home" className="inline-flex">
                <CeviLogo size="sm" className="h-5" />
              </Link>
              <button
                onClick={toggle}
                className="p-1 rounded-md hover:bg-[var(--cevi-surface)] transition-colors text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)]"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className={cn("flex-1 overflow-y-auto scrollbar-thin mt-2", collapsed ? "px-1.5" : "px-3")}>
          <ul className="space-y-1">
            {MAIN_NAV.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center rounded-lg text-[15px] font-medium transition-all relative",
                      collapsed ? "justify-center h-9 w-9 mx-auto" : "gap-2.5 px-3 h-9",
                      active
                        ? collapsed
                          ? "bg-white text-[var(--cevi-text)] font-semibold shadow-[0_0_10px_rgba(0,0,0,0.06)]"
                          : "bg-white text-[var(--cevi-text)] font-semibold border border-[#E5E5E5] shadow-[0_0_10px_rgba(0,0,0,0.06)]"
                        : "text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface)]",
                    )}
                  >
                    <Icon
                      className={cn("h-5 w-5 shrink-0", active ? "text-[var(--cevi-accent)]" : "text-[var(--cevi-text-muted)]")}
                      strokeWidth={1.5}
                    />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className={cn("pb-3 space-y-1", collapsed ? "px-1.5" : "px-3")}>
          {/* Support */}
          <button
            onClick={() => setSupportOpen(true)}
            title={collapsed ? "Support" : undefined}
            className={cn(
              "w-full flex items-center rounded-lg text-[15px] font-medium text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface)] hover:text-[var(--cevi-text)] transition-colors",
              collapsed ? "justify-center h-9" : "gap-2.5 px-3 h-9",
            )}
          >
            <Mail className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            {!collapsed && <span>Support</span>}
          </button>

          {/* Account / Org */}
          <div ref={accountAnchorRef} className="relative">
            {accountOpen && <AccountMenu onClose={() => setAccountOpen(false)} collapsed={collapsed} anchorRef={accountAnchorRef} />}
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              title={collapsed ? "TMG" : undefined}
              className={cn(
                "w-full flex items-center rounded-lg hover:bg-[var(--cevi-surface)] transition-colors",
                collapsed ? "justify-center h-9" : "gap-2.5 px-3 h-9",
              )}
            >
              <Building2
                className="h-5 w-5 shrink-0 text-[var(--cevi-text-muted)]"
                strokeWidth={1.5}
              />
              {!collapsed && <span className="text-[15px] font-medium text-[var(--cevi-text-muted)]">TMG</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {!isDesktop && mobileOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/20"
          onClick={closeMobile}
        />
      )}

      {/* Support Modal */}
      {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}
    </>
  );
}
