import type { Fax, FaxEvent } from "@/shared/types";

export interface IFaxRepository {
  findAll(): Promise<Fax[]>;
  findById(id: string): Promise<Fax | null>;
}

export interface IEventRepository {
  findByFaxId(faxId: string): Promise<FaxEvent[]>;
  findAll(): Promise<FaxEvent[]>;
}
