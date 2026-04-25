"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, User, Settings } from "lucide-react";
import { cn } from "@/shared/utils";

interface NavTab {
  href: string;
  label: string;
  icon: React.ReactNode;
  match: (path: string) => boolean;
}

const TABS: NavTab[] = [
  {
    href: "/",
    label: "Inbox",
    icon: <Inbox className="h-[20px] w-[20px]" strokeWidth={1.5} />,
    match: (p) => p === "/" || p.startsWith("/inbox") || p.startsWith("/category"),
  },
  {
    href: "/patients",
    label: "Patients",
    icon: <User className="h-[20px] w-[20px]" strokeWidth={1.5} />,
    match: (p) => p.startsWith("/patients"),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: <Settings className="h-[20px] w-[20px]" strokeWidth={1.5} />,
    match: (p) => p.startsWith("/settings"),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on detail pages (fax detail is full-screen)
  if (pathname.match(/^\/inbox\/[^/]+/)) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[var(--cevi-border)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch justify-around h-[52px]">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors",
                active
                  ? "text-[var(--cevi-accent)]"
                  : "text-[var(--cevi-text-muted)]",
              )}
            >
              {tab.icon}
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
