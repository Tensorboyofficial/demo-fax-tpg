import Database from "better-sqlite3";
import { join } from "path";

const DB_PATH = process.env.SQLITE_DB_PATH ?? join(process.cwd(), "cevi.db");

let db: Database.Database | null = null;

export function getSqlite(): Database.Database {
  if (db) return db;
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initSchema(db);
  migrate(db);
  return db;
}

/** Add columns that may be missing from older DBs */
function migrate(d: Database.Database) {
  try { d.exec("ALTER TABLE faxes ADD COLUMN file_url TEXT"); } catch { /* already exists */ }
}

function initSchema(d: Database.Database) {
  d.exec(`
    -- Faxes
    CREATE TABLE IF NOT EXISTS faxes (
      id TEXT PRIMARY KEY,
      received_at TEXT NOT NULL DEFAULT (datetime('now')),
      pages INTEGER NOT NULL DEFAULT 1,
      from_number TEXT,
      from_org TEXT,
      fax_number_to TEXT DEFAULT '817-860-2704',
      to_clinic TEXT,
      status TEXT NOT NULL DEFAULT 'unopened',
      type TEXT NOT NULL DEFAULT 'other',
      type_confidence REAL NOT NULL DEFAULT 0.0,
      urgency TEXT NOT NULL DEFAULT 'routine',
      matched_patient_id TEXT,
      match_confidence REAL,
      extracted TEXT NOT NULL DEFAULT '{}',
      routed_to TEXT,
      routed_reason TEXT,
      ocr_text TEXT NOT NULL DEFAULT '',
      ai_summary TEXT,
      model_used TEXT,
      is_user_uploaded INTEGER NOT NULL DEFAULT 1,
      source_kind TEXT DEFAULT 'upload',
      created_by TEXT DEFAULT 'anon',
      file_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_faxes_received_at ON faxes(received_at);
    CREATE INDEX IF NOT EXISTS idx_faxes_type ON faxes(type);
    CREATE INDEX IF NOT EXISTS idx_faxes_status ON faxes(status);

    -- Structured extractions (one per fax, full JSON schema output)
    CREATE TABLE IF NOT EXISTS fax_extractions (
      id TEXT PRIMARY KEY,
      fax_id TEXT NOT NULL REFERENCES faxes(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      subcategory TEXT,
      schema_version TEXT NOT NULL DEFAULT 'v1',
      extraction TEXT NOT NULL DEFAULT '{}',
      model_used TEXT,
      latency_ms INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(fax_id)
    );

    CREATE INDEX IF NOT EXISTS idx_fax_extractions_fax_id ON fax_extractions(fax_id);
    CREATE INDEX IF NOT EXISTS idx_fax_extractions_category ON fax_extractions(category);

    -- Fax events (audit trail)
    CREATE TABLE IF NOT EXISTS fax_events (
      id TEXT PRIMARY KEY,
      fax_id TEXT NOT NULL REFERENCES faxes(id) ON DELETE CASCADE,
      at TEXT NOT NULL DEFAULT (datetime('now')),
      kind TEXT NOT NULL,
      actor TEXT NOT NULL DEFAULT 'system',
      detail TEXT NOT NULL,
      model TEXT,
      latency_ms INTEGER,
      tokens_in INTEGER,
      tokens_out INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_fax_events_fax_at ON fax_events(fax_id, at);

    -- Webhook configs
    CREATE TABLE IF NOT EXISTS webhook_config (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      secret TEXT,
      events TEXT NOT NULL DEFAULT '["fax.extracted"]',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Webhook delivery log
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id TEXT PRIMARY KEY,
      webhook_id TEXT NOT NULL REFERENCES webhook_config(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      fax_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      status_code INTEGER,
      response_body TEXT,
      delivered_at TEXT NOT NULL DEFAULT (datetime('now')),
      success INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);

    -- Match results
    CREATE TABLE IF NOT EXISTS match_results (
      id TEXT PRIMARY KEY,
      fax_id TEXT NOT NULL REFERENCES faxes(id) ON DELETE CASCADE,
      candidates TEXT NOT NULL DEFAULT '[]',
      decision TEXT NOT NULL DEFAULT 'unmatched',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- App settings (key-value store)
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

/** Get a setting value */
export function getSetting(key: string): string | null {
  const db = getSqlite();
  const row = db.prepare("SELECT value FROM app_settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

/** Set a setting value */
export function setSetting(key: string, value: string): void {
  const db = getSqlite();
  db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (@key, @value, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = @value, updated_at = datetime('now')
  `).run({ key, value });
}

/** Delete a setting */
export function deleteSetting(key: string): boolean {
  const db = getSqlite();
  const result = db.prepare("DELETE FROM app_settings WHERE key = ?").run(key);
  return result.changes > 0;
}
