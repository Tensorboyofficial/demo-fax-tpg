import { getAllFaxes, getFaxByIdMerged, getEventsForFax, getAllEvents } from "../services/data-merge.service";
import { MatchingService } from "../services/matching.service";
import { RoutingService } from "../services/routing.service";
import { MATCHING_CONFIG } from "../config/matching.config";

/** Returns a DataMergeService-compatible object backed by the singleton in data-merge.service.ts */
export function getDataMergeService() {
  return {
    getAllFaxes,
    getFaxById: getFaxByIdMerged,
    getEventsForFax,
    getAllEvents,
  };
}

export function getMatchingService(): MatchingService {
  return new MatchingService(MATCHING_CONFIG);
}

export function getRoutingService(): RoutingService {
  return new RoutingService();
}
