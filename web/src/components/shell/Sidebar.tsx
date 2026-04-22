"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Inbox,
  AlertCircle,
  GitBranch,
  ShieldCheck,
  FlaskConical,
  Pill,
  FileText,
  ScrollText,
  Link2,
  Settings,
  Stethoscope,
  UploadCloud,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: { value: string | number; tone: "accent" | "amber" | "jade" };
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    items: [
      {
        href: "/",
        label: "Dashboard",
        icon: <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />,
      },
      {
        href: "/inbox",
        label: "Fax Inbox",
        icon: <Inbox className="h-4 w-4" strokeWidth={1.5} />,
        badge: { value: 7, tone: "accent" },
      },
      {
        href: "/upload",
        label: "Upload a fax",
        icon: <UploadCloud className="h-4 w-4" strokeWidth={1.5} />,
        badge: { value: "New", tone: "jade" },
      },
      {
        href: "/review",
        label: "Review Queue",
        icon: <AlertCircle className="h-4 w-4" strokeWidth={1.5} />,
        badge: { value: 2, tone: "amber" },
      },
    ],
  },
  {
    title: "Connected Agents",
    items: [
      {
        href: "/agents",
        label: "All agents",
        icon: <GitBranch className="h-4 w-4" strokeWidth={1.5} />,
      },
      {
        href: "/agents/referrals",
        label: "Referrals",
        icon: <Stethoscope className="h-4 w-4" strokeWidth={1.5} />,
      },
      {
        href: "/agents/prior-auth",
        label: "Prior Auth",
        icon: <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />,
      },
      {
        href: "/agents/lab-results",
        label: "Lab Results",
        icon: <FlaskConical className="h-4 w-4" strokeWidth={1.5} />,
      },
      {
        href: "/agents/rx-refills",
        label: "Rx Refills",
        icon: <Pill className="h-4 w-4" strokeWidth={1.5} />,
      },
      {
        href: "/agents/records",
        label: "Medical Records",
        icon: <FileText className="h-4 w-4" strokeWidth={1.5} />,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        href: "/audit",
        label: "Audit Trail",
        icon: <ScrollText className="h-4 w-4" strokeWidth={1.5} />,
      },
      {
        href: "/integrations",
        label: "Integrations",
        icon: <Link2 className="h-4 w-4" strokeWidth={1.5} />,
      },
      {
        href: "/settings",
        label: "Settings",
        icon: <Settings className="h-4 w-4" strokeWidth={1.5} />,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-60 bg-[var(--cevi-surface)] border-r border-[var(--cevi-border)] flex flex-col">
      {/* Wordmark */}
      <div className="h-16 flex items-center px-5 border-b border-[var(--cevi-border)]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/cevi-logo.svg"
            alt="Cevi"
            width={72}
            height={24}
            priority
            className="h-6 w-auto"
          />
          <span className="h-5 w-px bg-[var(--cevi-border)]" aria-hidden="true" />
          <span className="text-[10px] text-[var(--cevi-text-muted)] uppercase tracking-[0.08em] leading-tight">
            for Texas
            <br />
            Physicians
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="mb-5 px-3">
            {section.title && (
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)]">
                {section.title}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-3 h-9 rounded-md text-[13px] font-medium transition-colors",
                        active
                          ? "bg-white text-[var(--cevi-text)] shadow-[0_1px_0_rgba(0,0,0,0.04)]"
                          : "text-[var(--cevi-text-secondary)] hover:bg-white/60 hover:text-[var(--cevi-text)]",
                      )}
                    >
                      <span
                        className={cn(
                          active
                            ? "text-[var(--cevi-accent)]"
                            : "text-[var(--cevi-text-muted)]",
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            "min-w-5 h-5 px-1.5 rounded-full text-[10px] font-semibold inline-flex items-center justify-center",
                            item.badge.tone === "accent"
                              ? "bg-[var(--cevi-accent)] text-white"
                              : item.badge.tone === "amber"
                                ? "bg-[var(--cevi-amber-light)] text-[var(--cevi-amber)]"
                                : "bg-[var(--cevi-jade-light)] text-[var(--cevi-jade)]",
                          )}
                        >
                          {item.badge.value}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer — Clinic / location switcher */}
      <div className="p-3 border-t border-[var(--cevi-border)]">
        <div className="rounded-lg bg-white border border-[var(--cevi-border)] p-3">
          <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] font-semibold">
            Viewing
          </div>
          <div className="mt-1 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                All locations
              </div>
              <div className="text-[11px] text-[var(--cevi-text-muted)]">
                4 clinics · Arlington HQ
              </div>
            </div>
            <button
              type="button"
              className="h-7 px-2 rounded-md text-[11px] font-semibold text-[var(--cevi-accent)] hover:bg-[var(--cevi-accent-light)]"
            >
              Switch
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
