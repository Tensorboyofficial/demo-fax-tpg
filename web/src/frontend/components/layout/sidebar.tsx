"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  UploadCloud,
  ShieldCheck,
  Settings,
  Receipt,
} from "lucide-react";
import { CeviLogo } from "@/frontend/components/brand/cevi-logo";
import { cn } from "@/shared/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV: NavItem[] = [
  {
    href: "/",
    label: "Inbox",
    icon: <Inbox className="h-4 w-4" strokeWidth={1.5} />,
  },
  {
    href: "/upload",
    label: "Upload",
    icon: <UploadCloud className="h-4 w-4" strokeWidth={1.5} />,
  },
  {
    href: "/eob",
    label: "Paper EOB",
    icon: <Receipt className="h-4 w-4" strokeWidth={1.5} />,
  },
  {
    href: "/audit",
    label: "Audit",
    icon: <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: <Settings className="h-4 w-4" strokeWidth={1.5} />,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname.startsWith("/inbox");
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-20 w-[200px] bg-white border-r border-[var(--cevi-border)] flex flex-col">
      <div className="h-20 px-6 flex items-center">
        <Link href="/" aria-label="Cevi home" className="inline-flex">
          <CeviLogo size="md" />
        </Link>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto scrollbar-thin">
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 h-9 rounded-md text-[13px] font-medium transition-colors",
                    active
                      ? "bg-[var(--cevi-accent-light)] text-[var(--cevi-text)]"
                      : "text-[var(--cevi-text-secondary)] hover:bg-[var(--cevi-surface-warm)] hover:text-[var(--cevi-text)]",
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
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
