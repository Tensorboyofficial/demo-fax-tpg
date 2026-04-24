import type { Fax, FaxEvent } from "@/shared/types";
import type { IFaxRepository, IEventRepository } from "../repositories/interfaces/fax.repository";
import { SupabaseFaxRepository, SupabaseEventRepository } from "../repositories/supabase/supabase-fax.repository";
import { MemoryFaxRepository, MemoryEventRepository } from "../repositories/memory/memory-fax.repository";
import { SeedFaxRepository, SeedEventRepository } from "../repositories/seed/seed-fax.repository";

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

export class DataMergeService {
  constructor(
    private readonly supabaseRepo: IFaxRepository,
    private readonly memoryRepo: IFaxRepository,
    private readonly seedRepo: IFaxRepository,
    private readonly supabaseEventRepo: IEventRepository,
    private readonly memoryEventRepo: IEventRepository,
    private readonly seedEventRepo: IEventRepository,
  ) {}

  async getAllFaxes(): Promise<Fax[]> {
    const [supabase, memory, seed] = await Promise.all([
      this.supabaseRepo.findAll(),
      this.memoryRepo.findAll(),
      this.seedRepo.findAll(),
    ]);
    const merged = dedupeById([...supabase, ...memory, ...seed]);
    return merged.sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
  }

  async getFaxById(id: string): Promise<Fax | null> {
    const up = await this.supabaseRepo.findById(id);
    if (up) return up;
    const mem = await this.memoryRepo.findById(id);
    if (mem) return mem;
    return this.seedRepo.findById(id);
  }

  async getEventsForFax(id: string): Promise<FaxEvent[]> {
    const up = await this.supabaseEventRepo.findByFaxId(id);
    if (up.length > 0) return up;
    const mem = await this.memoryEventRepo.findByFaxId(id);
    if (mem.length > 0) return mem;
    return this.seedEventRepo.findByFaxId(id);
  }

  async getAllEvents(): Promise<FaxEvent[]> {
    const [uploaded, memory, seed] = await Promise.all([
      this.supabaseEventRepo.findAll(),
      this.memoryEventRepo.findAll(),
      this.seedEventRepo.findAll(),
    ]);
    const merged = dedupeById([...uploaded, ...memory, ...seed]);
    return merged.sort((a, b) => (a.at < b.at ? 1 : -1));
  }
}

/* ── Singleton instance + standalone function wrappers ── */

let _instance: DataMergeService | undefined;
function getInstance(): DataMergeService {
  if (!_instance) {
    _instance = new DataMergeService(
      new SupabaseFaxRepository(),
      new MemoryFaxRepository(),
      new SeedFaxRepository(),
      new SupabaseEventRepository(),
      new MemoryEventRepository(),
      new SeedEventRepository(),
    );
  }
  return _instance;
}

export async function getAllFaxes(): Promise<Fax[]> {
  return getInstance().getAllFaxes();
}

export async function getFaxByIdMerged(id: string): Promise<Fax | null> {
  return getInstance().getFaxById(id);
}

export async function getEventsForFax(id: string): Promise<FaxEvent[]> {
  return getInstance().getEventsForFax(id);
}

export async function getAllEvents(): Promise<FaxEvent[]> {
  return getInstance().getAllEvents();
}
