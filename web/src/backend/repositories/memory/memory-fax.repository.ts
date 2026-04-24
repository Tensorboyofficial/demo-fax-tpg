import type { IFaxRepository, IEventRepository } from "../interfaces/fax.repository";
import type { Fax, FaxEvent } from "@/shared/types";

type FaxMap = Map<string, Fax>;
type EventMap = Map<string, FaxEvent[]>;

declare global {
  var __ceviMemoryFaxes: FaxMap | undefined;
  var __ceviMemoryEvents: EventMap | undefined;
}

const faxStore: FaxMap = globalThis.__ceviMemoryFaxes ?? new Map();
const eventStore: EventMap = globalThis.__ceviMemoryEvents ?? new Map();
globalThis.__ceviMemoryFaxes = faxStore;
globalThis.__ceviMemoryEvents = eventStore;

export class MemoryFaxRepository implements IFaxRepository {
  async findAll(): Promise<Fax[]> {
    return Array.from(faxStore.values()).sort((a, b) =>
      a.receivedAt < b.receivedAt ? 1 : -1,
    );
  }

  async findById(id: string): Promise<Fax | null> {
    return faxStore.get(id) ?? null;
  }

  save(fax: Fax, events: FaxEvent[]): void {
    faxStore.set(fax.id, fax);
    eventStore.set(fax.id, events);
  }
}

export class MemoryEventRepository implements IEventRepository {
  async findByFaxId(faxId: string): Promise<FaxEvent[]> {
    return eventStore.get(faxId) ?? [];
  }

  async findAll(): Promise<FaxEvent[]> {
    const all: FaxEvent[] = [];
    for (const events of eventStore.values()) {
      all.push(...events);
    }
    return all.sort((a, b) => (a.at < b.at ? 1 : -1));
  }
}

/* ── Standalone wrapper for backward compatibility ── */

const _repo = new MemoryFaxRepository();

export function saveFaxInMemory(fax: Fax, events: FaxEvent[]): void {
  _repo.save(fax, events);
}
