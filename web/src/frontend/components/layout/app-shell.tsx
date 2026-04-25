"use client";

import { Sidebar } from "./sidebar";
import { SidebarProvider, useSidebar } from "./sidebar-context";
import { ToastProvider } from "@/frontend/components/ui/toast";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div className="min-h-screen bg-[var(--cevi-bg)]">
      <Sidebar />
      <div
        className="transition-[padding-left] duration-200 ease-out"
        style={{ paddingLeft: collapsed ? 56 : 200 }}
      >
        <main className="px-6 md:px-10 py-6 max-w-[1440px]">{children}</main>
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
