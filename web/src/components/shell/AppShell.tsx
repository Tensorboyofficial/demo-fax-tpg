import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--cevi-bg)]">
      <Topbar />
      <main className="max-w-[1400px] mx-auto px-6 md:px-10 py-8">
        {children}
      </main>
    </div>
  );
}
