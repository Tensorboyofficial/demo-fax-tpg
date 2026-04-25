import type { IFaxRepository, IEventRepository } from "../interfaces/fax.repository";
import type { Fax, FaxEvent } from "@/shared/types";
import { getSupabase } from "./supabase.client";
import { rowToFax, rowToEvent, type UserFaxRow, type UserFaxEventRow } from "./schema";

export class SupabaseFaxRepository implements IFaxRepository {
  async findAll(): Promise<Fax[]> {
    const s = getSupabase();
    if (!s) return [];
    try {
      const { data, error } = await s
        .from("user_faxes")
        .select("*")
        .order("received_at", { ascending: false })
        .limit(100);
      if (error || !data) return [];
      return (data as UserFaxRow[]).map(rowToFax);
    } catch {
      return [];
    }
  }

  async findById(id: string): Promise<Fax | null> {
    const s = getSupabase();
    if (!s) return null;
    try {
      const { data, error } = await s
        .from("user_faxes")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) return null;
      return rowToFax(data as UserFaxRow);
    } catch {
      return null;
    }
  }

  async updateStatus(id: string, status: string): Promise<boolean> {
    const s = getSupabase();
    if (!s) return false;
    try {
      const { error } = await s
        .from("user_faxes")
        .update({ status })
        .eq("id", id);
      return !error;
    } catch {
      return false;
    }
  }
}

export class SupabaseEventRepository implements IEventRepository {
  async findByFaxId(faxId: string): Promise<FaxEvent[]> {
    const s = getSupabase();
    if (!s) return [];
    try {
      const { data, error } = await s
        .from("user_fax_events")
        .select("*")
        .eq("fax_id", faxId)
        .order("at", { ascending: true });
      if (error || !data) return [];
      return (data as UserFaxEventRow[]).map(rowToEvent);
    } catch {
      return [];
    }
  }

  async findAll(): Promise<FaxEvent[]> {
    const s = getSupabase();
    if (!s) return [];
    try {
      const { data, error } = await s
        .from("user_fax_events")
        .select("*")
        .order("at", { ascending: false })
        .limit(500);
      if (error || !data) return [];
      return (data as UserFaxEventRow[]).map(rowToEvent);
    } catch {
      return [];
    }
  }
}
