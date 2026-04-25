import type { IFaxRepository, IEventRepository } from "../interfaces/fax.repository";
import type { Fax, FaxEvent } from "@/shared/types";
import { faxes as seedFaxes, buildAuditEvents } from "@/data/seed";

export class SeedFaxRepository implements IFaxRepository {
  async findAll(): Promise<Fax[]> {
    return seedFaxes;
  }

  async findById(id: string): Promise<Fax | null> {
    return seedFaxes.find((f) => f.id === id) ?? null;
  }

  async updateStatus(_id: string, _status: string): Promise<boolean> {
    return false; // seed data is read-only
  }
}

export class SeedEventRepository implements IEventRepository {
  async findByFaxId(faxId: string): Promise<FaxEvent[]> {
    return buildAuditEvents().filter((e) => e.faxId === faxId);
  }

  async findAll(): Promise<FaxEvent[]> {
    return buildAuditEvents();
  }
}
