import type { Fax, FaxEvent } from "@/shared/types";
import type { IFaxRepository, IEventRepository } from "../repositories/interfaces/fax.repository";
import { SupabaseFaxRepository, SupabaseEventRepository } from "../repositories/supabase/supabase-fax.repository";
import { SUPABASE_CONFIGURED } from "../repositories/supabase/supabase.client";
import { SeedFaxRepository, SeedEventRepository } from "../repositories/seed/seed-fax.repository";

/** Empty repo — used when SQLite is unavailable (Vercel serverless). */
class NullFaxRepository implements IFaxRepository {
  async findAll(): Promise<Fax[]> { return []; }
  async findById(): Promise<Fax | null> { return null; }
}
class NullEventRepository implements IEventRepository {
  async findByFaxId(): Promise<FaxEvent[]> { return []; }
  async findAll(): Promise<FaxEvent[]> { return []; }
}

/** Try loading SQLite repos; return nulls on Vercel where better-sqlite3 isn't available. */
function loadSqliteRepos(): { fax: IFaxRepository; event: IEventRepository } {
  try {
    // Dynamic require — if better-sqlite3 native module is missing this throws
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("../repositories/sqlite/sqlite-fax.repository");
    return { fax: new mod.SqliteFaxRepository(), event: new mod.SqliteEventRepository() };
  } catch {
    return { fax: new NullFaxRepository(), event: new NullEventRepository() };
  }
}

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
    private readonly sqliteRepo: IFaxRepository,
    private readonly supabaseEventRepo: IEventRepository,
    private readonly sqliteEventRepo: IEventRepository,
  ) {}

  async getAllFaxes(): Promise<Fax[]> {
    const sources: Promise<Fax[]>[] = [
      this.supabaseRepo.findAll(),
      this.sqliteRepo.findAll(),
    ];
    // Only include seed data when Supabase is NOT configured (local dev without DB)
    if (!SUPABASE_CONFIGURED) sources.push(new SeedFaxRepository().findAll());
    const results = await Promise.all(sources);
    const merged = dedupeById(results.flat());
    return merged.sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
  }

  async getFaxById(id: string): Promise<Fax | null> {
    const up = await this.supabaseRepo.findById(id);
    if (up) return up;
    const sq = await this.sqliteRepo.findById(id);
    if (sq) return sq;
    if (!SUPABASE_CONFIGURED) return new SeedFaxRepository().findById(id);
    return null;
  }

  async getEventsForFax(id: string): Promise<FaxEvent[]> {
    const up = await this.supabaseEventRepo.findByFaxId(id);
    if (up.length > 0) return up;
    const sq = await this.sqliteEventRepo.findByFaxId(id);
    if (sq.length > 0) return sq;
    if (!SUPABASE_CONFIGURED) return new SeedEventRepository().findByFaxId(id);
    return [];
  }

  async getAllEvents(): Promise<FaxEvent[]> {
    const sources: Promise<FaxEvent[]>[] = [
      this.supabaseEventRepo.findAll(),
      this.sqliteEventRepo.findAll(),
    ];
    if (!SUPABASE_CONFIGURED) sources.push(new SeedEventRepository().findAll());
    const results = await Promise.all(sources);
    const merged = dedupeById(results.flat());
    return merged.sort((a, b) => (a.at < b.at ? 1 : -1));
  }
}

/* ── Singleton instance + standalone function wrappers ── */

let _instance: DataMergeService | undefined;
function getInstance(): DataMergeService {
  if (!_instance) {
    const sqlite = loadSqliteRepos();
    _instance = new DataMergeService(
      new SupabaseFaxRepository(),
      sqlite.fax,
      new SupabaseEventRepository(),
      sqlite.event,
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
