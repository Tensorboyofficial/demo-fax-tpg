import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--cevi-bg)]">
      <Sidebar />
      <div className="pl-60">
        <Topbar />
        <main className="px-8 py-8 max-w-[1400px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
