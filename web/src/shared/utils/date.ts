const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Manual formatting avoids Intl locale differences between Node and browser
// which cause React hydration mismatches.
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const mon = MONTHS[d.getUTCMonth()];
  const day = d.getUTCDate();
  let hr = d.getUTCHours();
  const min = d.getUTCMinutes().toString().padStart(2, "0");
  const ampm = hr >= 12 ? "PM" : "AM";
  hr = hr % 12 || 12;
  return `${mon} ${day}, ${hr}:${min} ${ampm}`;
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
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function formatDob(iso: string): string {
  const d = new Date(iso);
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = d.getUTCDate().toString().padStart(2, "0");
  return `${mm}/${dd}/${d.getUTCFullYear()}`;
}

export function calcAge(dobIso: string, refIso?: string): number {
  const dob = new Date(dobIso);
  const ref = refIso ? new Date(refIso) : new Date("2026-04-23T14:32:00Z");
  let age = ref.getUTCFullYear() - dob.getUTCFullYear();
  const m = ref.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && ref.getUTCDate() < dob.getUTCDate())) age -= 1;
  return age;
}
