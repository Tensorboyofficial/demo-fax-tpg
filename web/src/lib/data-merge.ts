import { faxes as seedFaxes, buildAuditEvents as buildSeedEvents } from "@/data/faxes";
import {
  listUploadedFaxes,
  getUploadedFaxById,
  listUploadedEventsForFax,
  listAllUploadedEvents,
} from "@/lib/supabase/userFaxes";
import type { Fax, FaxEvent } from "@/lib/types";

/**
 * Merged view of uploaded (Supabase) + seed (in-memory) faxes.
 * Uploaded faxes always sort first by received_at desc.
 */
export async function getAllFaxes(): Promise<Fax[]> {
  const uploaded = await listUploadedFaxes();
  return [...uploaded, ...seedFaxes].sort((a, b) =>
    a.receivedAt < b.receivedAt ? 1 : -1,
  );
}

export async function getFaxByIdMerged(id: string): Promise<Fax | null> {
  // Check Supabase first — uploaded faxes are the "live" data layer.
  const up = await getUploadedFaxById(id);
  if (up) return up;
  return seedFaxes.find((f) => f.id === id) ?? null;
}

export async function getEventsForFax(id: string): Promise<FaxEvent[]> {
  const up = await listUploadedEventsForFax(id);
  if (up.length > 0) return up;
  return buildSeedEvents().filter((e) => e.faxId === id);
}

export async function getAllEvents(): Promise<FaxEvent[]> {
  const uploaded = await listAllUploadedEvents();
  const seed = buildSeedEvents();
  return [...uploaded, ...seed].sort((a, b) => (a.at < b.at ? 1 : -1));
}
