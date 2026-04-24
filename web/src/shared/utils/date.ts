// Pin timezone to UTC for all server-rendered time strings so SSR output
// matches client hydration — prevents React hydration mismatch.
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}

// Use a fixed anchor for relative time so SSR and client agree. Seed faxes
// were generated against 2026-04-23T14:32:00Z — using that as the "now"
// keeps demo cards stable.
const DEMO_NOW = new Date("2026-04-23T14:32:00Z").getTime();

export function formatRelative(iso: string, nowIso?: string): string {
  const now = nowIso ? new Date(nowIso).getTime() : DEMO_NOW;
  const then = new Date(iso).getTime();
  const diff = Math.abs(now - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateTime(iso);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDob(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function calcAge(dobIso: string, refIso?: string): number {
  const dob = new Date(dobIso);
  const ref = refIso ? new Date(refIso) : new Date("2026-04-23T14:32:00Z");
  let age = ref.getUTCFullYear() - dob.getUTCFullYear();
  const m = ref.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && ref.getUTCDate() < dob.getUTCDate())) age -= 1;
  return age;
}
