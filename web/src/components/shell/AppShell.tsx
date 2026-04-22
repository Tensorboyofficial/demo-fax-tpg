import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--cevi-bg)]">
      <Sidebar />
      <div className="pl-0 md:pl-[200px]">
        <Topbar />
        <main className="px-6 md:px-10 py-8 max-w-[1440px]">{children}</main>
      </div>
    </div>
  );
}
