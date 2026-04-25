import { SupabaseFaxRepository, SupabaseEventRepository } from "../repositories/supabase/supabase-fax.repository";
import { SqliteFaxRepository, SqliteEventRepository } from "../repositories/sqlite/sqlite-fax.repository";
import { DataMergeService } from "../services/data-merge.service";
import { MatchingService } from "../services/matching.service";
import { RoutingService } from "../services/routing.service";
import { MATCHING_CONFIG } from "../config/matching.config";

// Lazy singletons
let _dataMerge: DataMergeService | null = null;

export function getDataMergeService(): DataMergeService {
  if (_dataMerge) return _dataMerge;

  _dataMerge = new DataMergeService(
    new SupabaseFaxRepository(),
    new SqliteFaxRepository(),
    new SupabaseEventRepository(),
    new SqliteEventRepository(),
  );
  return _dataMerge;
}

export function getMatchingService(): MatchingService {
  return new MatchingService(MATCHING_CONFIG);
}

export function getRoutingService(): RoutingService {
  return new RoutingService();
}
