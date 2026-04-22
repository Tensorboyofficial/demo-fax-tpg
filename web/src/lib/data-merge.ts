import { faxes as seedFaxes, buildAuditEvents as buildSeedEvents } from "@/data/faxes";
import {
  listUploadedFaxes,
  getUploadedFaxById,
  listUploadedEventsForFax,
  listAllUploadedEvents,
} from "@/lib/supabase/userFaxes";
import {
  listMemoryFaxes,
  getFaxFromMemory,
  listMemoryEventsForFax,
  listAllMemoryEvents,
} from "@/lib/memory-store";
import type { Fax, FaxEvent } from "@/lib/types";

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  return out;
}

/**
 * Merged view of uploaded faxes from all sources + seed.
 * Precedence: Supabase > process memory > seed. Sorted by received_at desc.
 */
export async function getAllFaxes(): Promise<Fax[]> {
  const [supabase, memory] = await Promise.all([
    listUploadedFaxes(),
    Promise.resolve(listMemoryFaxes()),
  ]);
  const merged = dedupeById([...supabase, ...memory, ...seedFaxes]);
  return merged.sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
}

export async function getFaxByIdMerged(id: string): Promise<Fax | null> {
  // Supabase first (authoritative), then process memory (just-uploaded fallback),
  // then seed (demo fixtures).
  const up = await getUploadedFaxById(id);
  if (up) return up;
  const mem = getFaxFromMemory(id);
  if (mem) return mem;
  return seedFaxes.find((f) => f.id === id) ?? null;
}

export async function getEventsForFax(id: string): Promise<FaxEvent[]> {
  const up = await listUploadedEventsForFax(id);
  if (up.length > 0) return up;
  const mem = listMemoryEventsForFax(id);
  if (mem.length > 0) return mem;
  return buildSeedEvents().filter((e) => e.faxId === id);
}

export async function getAllEvents(): Promise<FaxEvent[]> {
  const [uploaded, memory] = await Promise.all([
    listAllUploadedEvents(),
    Promise.resolve(listAllMemoryEvents()),
  ]);
  const seed = buildSeedEvents();
  const merged = dedupeById([...uploaded, ...memory, ...seed]);
  return merged.sort((a, b) => (a.at < b.at ? 1 : -1));
}
