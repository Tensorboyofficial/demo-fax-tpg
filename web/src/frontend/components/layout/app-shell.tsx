"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileTopbar } from "./mobile-topbar";
import { BottomNav } from "./bottom-nav";
import { SidebarProvider, useSidebar } from "./sidebar-context";
import { ToastProvider } from "@/frontend/components/ui/toast";
import { useIsDesktop } from "@/frontend/hooks/use-media-query";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const isDesktop = useIsDesktop();

  if (!isDesktop) {
    // ── Mobile: app-like layout ──
    return (
      <div className="min-h-screen bg-[var(--cevi-bg)] flex flex-col">
        <MobileTopbar />
        <main className="flex-1 px-4 py-3" style={{ paddingBottom: "calc(60px + env(safe-area-inset-bottom, 0px))" }}>
          {children}
        </main>
        <BottomNav />
      </div>
    );
  }

  // ── Desktop: unchanged ──
  return (
    <div className="min-h-screen bg-[var(--cevi-surface-warm)]">
      <Sidebar />
      <div
        className="transition-[padding-left] duration-200 ease-out"
        style={{ paddingLeft: collapsed ? 56 : 200 }}
      >
        <Topbar />
        <main className="px-6 md:px-10 py-6 max-w-[1440px]">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SidebarProvider>
        <ShellInner>{children}</ShellInner>
      </SidebarProvider>
    </ToastProvider>
  );
}
