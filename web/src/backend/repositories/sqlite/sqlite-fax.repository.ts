import type { IFaxRepository, IEventRepository } from "../interfaces/fax.repository";
import type { Fax, FaxEvent, ExtractedFields } from "@/shared/types";
import type { MatchCandidate } from "@/shared/types";
import { getSqlite } from "./sqlite.client";

function rowToFax(row: Record<string, unknown>): Fax {
  const extracted: ExtractedFields & { candidates?: MatchCandidate[] } =
    typeof row.extracted === "string" ? JSON.parse(row.extracted as string) : {};
  const candidates = extracted.candidates ?? [];
  return {
    id: row.id as string,
    receivedAt: row.received_at as string,
    pages: (row.pages as number) ?? 1,
    fromNumber: (row.from_number as string) ?? "",
    fromOrg: (row.from_org as string) ?? "Unknown sender",
    faxNumberTo: (row.fax_number_to as string) ?? "817-860-2704",
    toClinic: (row.to_clinic as string) ?? "Arlington",
    status: row.status as string,
    type: row.type as string,
    typeConfidence: Number(row.type_confidence ?? 0),
    urgency: (row.urgency as Fax["urgency"]) ?? "routine",
    matchedPatientId: (row.matched_patient_id as string) ?? null,
    matchConfidence: row.match_confidence != null ? Number(row.match_confidence) : null,
    candidates,
    extracted,
    routedTo: (row.routed_to as string) ?? null,
    routedReason: (row.routed_reason as string) ?? null,
    ocrText: (row.ocr_text as string) ?? "",
    aiSummary: (row.ai_summary as string) ?? undefined,
    modelUsed: (row.model_used as string) ?? undefined,
    isHero: false,
    fileUrl: (row.file_url as string) ?? (extracted as Record<string, unknown>)?.fileUrl as string ?? undefined,
  };
}

function rowToEvent(row: Record<string, unknown>): FaxEvent {
  return {
    id: row.id as string,
    faxId: row.fax_id as string,
    at: row.at as string,
    kind: row.kind as string,
    actor: row.actor as string,
    detail: row.detail as string,
    model: (row.model as string) ?? undefined,
    latencyMs: (row.latency_ms as number) ?? undefined,
    tokensIn: (row.tokens_in as number) ?? undefined,
    tokensOut: (row.tokens_out as number) ?? undefined,
  };
}

export class SqliteFaxRepository implements IFaxRepository {
  async findAll(): Promise<Fax[]> {
    const db = getSqlite();
    const rows = db.prepare("SELECT * FROM faxes ORDER BY received_at DESC").all();
    return (rows as Record<string, unknown>[]).map(rowToFax);
  }

  async findById(id: string): Promise<Fax | null> {
    const db = getSqlite();
    const row = db.prepare("SELECT * FROM faxes WHERE id = ?").get(id);
    return row ? rowToFax(row as Record<string, unknown>) : null;
  }

  async updateStatus(id: string, status: string): Promise<boolean> {
    const db = getSqlite();
    const result = db.prepare("UPDATE faxes SET status = ? WHERE id = ?").run(status, id);
    return result.changes > 0;
  }
}

export class SqliteEventRepository implements IEventRepository {
  async findByFaxId(faxId: string): Promise<FaxEvent[]> {
    const db = getSqlite();
    const rows = db.prepare("SELECT * FROM fax_events WHERE fax_id = ? ORDER BY at ASC").all(faxId);
    return (rows as Record<string, unknown>[]).map(rowToEvent);
  }

  async findAll(): Promise<FaxEvent[]> {
    const db = getSqlite();
    const rows = db.prepare("SELECT * FROM fax_events ORDER BY at DESC").all();
    return (rows as Record<string, unknown>[]).map(rowToEvent);
  }
}

// ── Write operations ──

export function insertFaxSqlite(fax: Fax, events: FaxEvent[]): { ok: boolean; error?: string } {
  const db = getSqlite();
  try {
    const insertFax = db.prepare(`
      INSERT OR REPLACE INTO faxes (
        id, received_at, pages, from_number, from_org, fax_number_to, to_clinic,
        status, type, type_confidence, urgency, matched_patient_id, match_confidence,
        extracted, routed_to, routed_reason, ocr_text, ai_summary, model_used,
        is_user_uploaded, source_kind, created_by, file_url
      ) VALUES (
        @id, @received_at, @pages, @from_number, @from_org, @fax_number_to, @to_clinic,
        @status, @type, @type_confidence, @urgency, @matched_patient_id, @match_confidence,
        @extracted, @routed_to, @routed_reason, @ocr_text, @ai_summary, @model_used,
        @is_user_uploaded, @source_kind, @created_by, @file_url
      )
    `);

    const insertEvent = db.prepare(`
      INSERT OR IGNORE INTO fax_events (id, fax_id, at, kind, actor, detail, model, latency_ms, tokens_in, tokens_out)
      VALUES (@id, @fax_id, @at, @kind, @actor, @detail, @model, @latency_ms, @tokens_in, @tokens_out)
    `);

    const txn = db.transaction(() => {
      insertFax.run({
        id: fax.id,
        received_at: fax.receivedAt,
        pages: fax.pages,
        from_number: fax.fromNumber,
        from_org: fax.fromOrg,
        fax_number_to: fax.faxNumberTo,
        to_clinic: fax.toClinic,
        status: fax.status,
        type: fax.type,
        type_confidence: fax.typeConfidence,
        urgency: fax.urgency,
        matched_patient_id: fax.matchedPatientId,
        match_confidence: fax.matchConfidence,
        extracted: JSON.stringify({ ...fax.extracted, candidates: fax.candidates }),
        routed_to: fax.routedTo,
        routed_reason: fax.routedReason,
        ocr_text: fax.ocrText,
        ai_summary: fax.aiSummary ?? null,
        model_used: fax.modelUsed ?? null,
        is_user_uploaded: 1,
        source_kind: "upload",
        created_by: "anon",
        file_url: fax.fileUrl ?? null,
      });

      for (const e of events) {
        insertEvent.run({
          id: e.id,
          fax_id: e.faxId,
          at: e.at,
          kind: e.kind,
          actor: e.actor,
          detail: e.detail,
          model: e.model ?? null,
          latency_ms: e.latencyMs ?? null,
          tokens_in: e.tokensIn ?? null,
          tokens_out: e.tokensOut ?? null,
        });
      }
    });

    txn();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export function insertExtractionSqlite(params: {
  id: string;
  faxId: string;
  category: string;
  subcategory?: string;
  extraction: Record<string, unknown>;
  modelUsed?: string;
  latencyMs?: number;
}): { ok: boolean; error?: string } {
  const db = getSqlite();
  try {
    db.prepare(`
      INSERT OR REPLACE INTO fax_extractions (id, fax_id, category, subcategory, extraction, model_used, latency_ms)
      VALUES (@id, @fax_id, @category, @subcategory, @extraction, @model_used, @latency_ms)
    `).run({
      id: params.id,
      fax_id: params.faxId,
      category: params.category,
      subcategory: params.subcategory ?? null,
      extraction: JSON.stringify(params.extraction),
      model_used: params.modelUsed ?? null,
      latency_ms: params.latencyMs ?? null,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export function getExtractionByFaxId(faxId: string): Record<string, unknown> | null {
  const db = getSqlite();
  const row = db.prepare("SELECT * FROM fax_extractions WHERE fax_id = ?").get(faxId) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    ...row,
    extraction: typeof row.extraction === "string" ? JSON.parse(row.extraction as string) : row.extraction,
  };
}

/** Get all faxes with their extractions for export */
export function getAllFaxesWithExtractions(opts?: {
  category?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
}): Array<Fax & { extraction?: Record<string, unknown> }> {
  const db = getSqlite();
  const conditions: string[] = [];
  const params: Record<string, string> = {};

  if (opts?.category) {
    conditions.push("f.type = @category");
    params.category = opts.category;
  }
  if (opts?.fromDate) {
    conditions.push("f.received_at >= @fromDate");
    params.fromDate = opts.fromDate;
  }
  if (opts?.toDate) {
    conditions.push("f.received_at <= @toDate");
    params.toDate = opts.toDate;
  }
  if (opts?.status) {
    conditions.push("f.status = @status");
    params.status = opts.status;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `
    SELECT f.*, e.extraction as structured_extraction, e.category as extraction_category
    FROM faxes f
    LEFT JOIN fax_extractions e ON e.fax_id = f.id
    ${where}
    ORDER BY f.received_at DESC
  `;

  const rows = db.prepare(sql).all(params) as Record<string, unknown>[];
  return rows.map((row) => {
    const fax = rowToFax(row);
    const rawExtraction = row.structured_extraction;
    const extraction = typeof rawExtraction === "string" ? JSON.parse(rawExtraction) : undefined;
    return { ...fax, extraction };
  });
}
