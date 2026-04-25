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

/* ─── Sidebar ─── */
export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle, mobileOpen, closeMobile } = useSidebar();
  const isDesktop = useIsDesktop();
  const [accountOpen, setAccountOpen] = useState(false);
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
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-[var(--cevi-surface)] transition-colors"
              title="Expand sidebar"
            >
              <svg width="16" height="12" viewBox="0 0 416 139" className="text-[var(--cevi-text)]">
                <path d="M189.325 0C199.437 0 208.347 1.802 216.057 5.306C223.766 8.81 230.273 13.516 235.48 19.323C236.781 20.725 237.983 22.226 239.084 23.728C241.987 27.533 240.986 33.039 237.082 35.742L146.874 98.717C148.677 101.921 150.879 104.824 153.382 107.428C157.988 112.233 163.494 116.138 169.902 119.041C176.41 121.945 183.618 123.346 191.628 123.346H192.028C200.238 123.046 208.147 121.044 215.856 117.039C224.066 112.834 230.374 107.127 234.679 99.919L247.294 110.531C240.586 120.643 232.376 127.852 222.564 132.257C213.153 136.462 202.841 138.665 191.527 138.865H190.727C181.015 138.865 171.904 137.063 163.594 133.759C154.984 130.355 147.675 125.549 141.568 119.342C138.364 116.038 135.461 112.434 132.958 108.529C121.444 116.739 106.627 127.351 103.623 129.153C101.12 130.755 98.617 132.157 96.014 133.358C87.804 137.063 78.994 138.965 69.483 138.965C59.971 138.965 50.059 137.263 41.449 133.859C32.839 130.455 25.53 125.649 19.423 119.442C13.316 113.234 8.61 105.926 5.106 97.416C1.702 88.906 0 79.695 0 69.583C0 59.471 1.702 50.16 5.106 41.75C8.51 33.239 13.316 25.931 19.423 19.723C25.53 13.516 32.839 8.71 41.449 5.306C50.059 1.902 59.371 0.2 69.483 0.2C79.595 0.2 88.205 2.203 96.515 6.207C104.824 10.212 112.133 15.819 118.641 23.027L104.925 33.34C100.019 27.833 94.512 23.528 88.605 20.324C82.698 17.22 76.291 15.619 69.483 15.619C62.674 15.619 54.264 17.02 47.757 19.924C41.249 22.827 35.742 26.632 31.237 31.537C26.632 36.443 23.228 42.15 20.825 48.658C18.422 55.266 17.22 62.274 17.22 69.683C17.22 77.092 18.422 84.1 20.825 90.708C23.228 97.316 26.632 103.022 31.237 107.828C35.843 112.634 41.349 116.538 47.757 119.442C54.264 122.345 61.473 123.747 69.483 123.747C77.492 123.747 83.099 122.145 89.006 118.941C94.612 116.038 111.332 104.024 125.849 93.611C123.346 86.202 122.145 78.293 122.145 69.683C122.145 61.073 123.847 50.26 127.251 41.85C130.655 33.34 135.461 26.031 141.568 19.824C147.675 13.616 154.984 8.81 163.594 5.406C172.205 2.002 181.516 0.3 191.628 0.3M216.157 31.738C218.76 29.936 218.76 26.231 216.257 24.329C213.754 22.427 209.949 20.224 206.345 18.822C201.339 16.82 196.133 15.619 190.626 15.418H188.724C181.916 15.719 175.709 17.12 170.002 19.623C163.494 22.527 157.988 26.331 153.482 31.237C148.877 36.143 145.473 41.85 143.07 48.357C140.667 54.965 139.466 61.974 139.466 69.382C139.466 76.791 139.966 78.693 140.967 83.099L216.157 31.738Z" fill="currentColor" />
              </svg>
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
                    href={item.href === "/category" ? "/category/lab_result" : item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center rounded-lg text-[15px] font-medium transition-all relative",
                      collapsed ? "justify-center h-9 w-full" : "gap-2.5 px-3 h-9",
                      active
                        ? "bg-white text-[var(--cevi-text)] font-semibold border border-[#E5E5E5] shadow-[0_0_10px_rgba(0,0,0,0.06)]"
                        : "text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface)] border border-transparent",
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
          <a
            href="mailto:theo@cevi.ai"
            title={collapsed ? "Support" : undefined}
            className={cn(
              "w-full flex items-center rounded-lg text-[15px] font-medium text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface)] hover:text-[var(--cevi-text)] transition-colors",
              collapsed ? "justify-center h-9" : "gap-2.5 px-3 h-9",
            )}
          >
            <Mail className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            {!collapsed && <span>Support</span>}
          </a>

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
    </>
  );
}
