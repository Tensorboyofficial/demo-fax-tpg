import type { Fax, FaxEvent } from "@/shared/types";

export interface IFaxRepository {
  findAll(): Promise<Fax[]>;
  findById(id: string): Promise<Fax | null>;
  updateStatus(id: string, status: string): Promise<boolean>;
}

export interface IEventRepository {
  findByFaxId(faxId: string): Promise<FaxEvent[]>;
  findAll(): Promise<FaxEvent[]>;
}
