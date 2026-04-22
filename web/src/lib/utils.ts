import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// Pin timezone to UTC for all server-rendered time strings so SSR output
// matches client hydration — prevents React hydration mismatch (#418).
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
  // Anchor to the demo's "now" so server and client agree.
  const dob = new Date(dobIso);
  const ref = refIso
    ? new Date(refIso)
    : new Date("2026-04-23T14:32:00Z");
  let age = ref.getUTCFullYear() - dob.getUTCFullYear();
  const m = ref.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && ref.getUTCDate() < dob.getUTCDate())) age -= 1;
  return age;
}

export function percent(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
