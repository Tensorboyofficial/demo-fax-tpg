import { SupabaseFaxRepository, SupabaseEventRepository } from "../repositories/supabase/supabase-fax.repository";
import { MemoryFaxRepository, MemoryEventRepository } from "../repositories/memory/memory-fax.repository";
import { SeedFaxRepository, SeedEventRepository } from "../repositories/seed/seed-fax.repository";
import { DataMergeService } from "../services/data-merge.service";
import { MatchingService } from "../services/matching.service";
import { RoutingService } from "../services/routing.service";
import { MATCHING_CONFIG } from "../config/matching.config";

// Lazy singletons
let _dataMerge: DataMergeService | null = null;
let _memoryFaxRepo: MemoryFaxRepository | null = null;

export function getMemoryFaxRepo(): MemoryFaxRepository {
  if (!_memoryFaxRepo) _memoryFaxRepo = new MemoryFaxRepository();
  return _memoryFaxRepo;
}

export function getDataMergeService(): DataMergeService {
  if (_dataMerge) return _dataMerge;

  const supabaseRepo = new SupabaseFaxRepository();
  const memoryRepo = getMemoryFaxRepo();
  const seedRepo = new SeedFaxRepository();
  const supabaseEventRepo = new SupabaseEventRepository();
  const memoryEventRepo = new MemoryEventRepository();
  const seedEventRepo = new SeedEventRepository();

  _dataMerge = new DataMergeService(
    supabaseRepo, memoryRepo, seedRepo,
    supabaseEventRepo, memoryEventRepo, seedEventRepo,
  );
  return _dataMerge;
}

export function getMatchingService(): MatchingService {
  return new MatchingService(MATCHING_CONFIG);
}

export function getRoutingService(): RoutingService {
  return new RoutingService();
}
