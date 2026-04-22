import type { Fax, FaxEvent } from "@/lib/types";

/**
 * Process-local fallback store for uploaded faxes when Supabase is
 * unreachable (e.g. schema not yet applied). Persists for the lifetime of
 * the Node.js process / Lambda instance. Not meant to be authoritative —
 * Supabase is the source of truth once it's available.
 */

type FaxMap = Map<string, Fax>;
type EventMap = Map<string, FaxEvent[]>;

declare global {
  // eslint-disable-next-line no-var
  var __ceviMemoryFaxes: FaxMap | undefined;
  // eslint-disable-next-line no-var
  var __ceviMemoryEvents: EventMap | undefined;
}

// Use a module-global Map so hot reloads don't reset state in dev.
const faxStore: FaxMap = globalThis.__ceviMemoryFaxes ?? new Map();
const eventStore: EventMap = globalThis.__ceviMemoryEvents ?? new Map();
globalThis.__ceviMemoryFaxes = faxStore;
globalThis.__ceviMemoryEvents = eventStore;

export function saveFaxInMemory(fax: Fax, events: FaxEvent[]): void {
  faxStore.set(fax.id, fax);
  eventStore.set(fax.id, events);
}

export function getFaxFromMemory(id: string): Fax | null {
  return faxStore.get(id) ?? null;
}

export function listMemoryFaxes(): Fax[] {
  return Array.from(faxStore.values()).sort((a, b) =>
    a.receivedAt < b.receivedAt ? 1 : -1,
  );
}

export function listMemoryEventsForFax(id: string): FaxEvent[] {
  return eventStore.get(id) ?? [];
}

export function listAllMemoryEvents(): FaxEvent[] {
  const all: FaxEvent[] = [];
  for (const events of eventStore.values()) {
    all.push(...events);
  }
  return all.sort((a, b) => (a.at < b.at ? 1 : -1));
}
