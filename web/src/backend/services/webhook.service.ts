import { getSqlite } from "@/backend/repositories/sqlite/sqlite.client";
import { createHmac, randomUUID } from "crypto";

interface WebhookConfig {
  id: string;
  url: string;
  secret: string | null;
  events: string[];
  active: boolean;
}

function genId(): string {
  return `wh-${randomUUID().slice(0, 8)}`;
}

/** Register a new webhook endpoint */
export function registerWebhook(params: {
  url: string;
  secret?: string;
  events?: string[];
}): { ok: true; webhook: WebhookConfig } | { ok: false; error: string } {
  const db = getSqlite();
  const id = genId();
  const events = params.events ?? ["fax.extracted"];
  try {
    db.prepare(`
      INSERT INTO webhook_config (id, url, secret, events, active)
      VALUES (@id, @url, @secret, @events, 1)
    `).run({
      id,
      url: params.url,
      secret: params.secret ?? null,
      events: JSON.stringify(events),
    });
    return {
      ok: true,
      webhook: { id, url: params.url, secret: params.secret ?? null, events, active: true },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/** List all webhook configs */
export function listWebhooks(): WebhookConfig[] {
  const db = getSqlite();
  const rows = db.prepare("SELECT * FROM webhook_config ORDER BY created_at DESC").all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: r.id as string,
    url: r.url as string,
    secret: r.secret as string | null,
    events: JSON.parse((r.events as string) ?? '["fax.extracted"]'),
    active: Boolean(r.active),
  }));
}

/** Delete a webhook */
export function deleteWebhook(id: string): boolean {
  const db = getSqlite();
  const result = db.prepare("DELETE FROM webhook_config WHERE id = ?").run(id);
  return result.changes > 0;
}

/** Toggle webhook active/inactive */
export function toggleWebhook(id: string, active: boolean): boolean {
  const db = getSqlite();
  const result = db.prepare("UPDATE webhook_config SET active = ?, updated_at = datetime('now') WHERE id = ?").run(active ? 1 : 0, id);
  return result.changes > 0;
}

/** Fire webhooks for a given event type (non-blocking) */
export async function fireWebhooks(
  eventType: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const db = getSqlite();
  const rows = db.prepare(
    "SELECT * FROM webhook_config WHERE active = 1",
  ).all() as Record<string, unknown>[];

  const webhooks = rows.filter((r) => {
    const events: string[] = JSON.parse((r.events as string) ?? "[]");
    return events.includes(eventType) || events.includes("*");
  });

  const deliveryInsert = db.prepare(`
    INSERT INTO webhook_deliveries (id, webhook_id, event_type, fax_id, payload, status_code, response_body, success)
    VALUES (@id, @webhook_id, @event_type, @fax_id, @payload, @status_code, @response_body, @success)
  `);

  for (const wh of webhooks) {
    const webhookId = wh.id as string;
    const url = wh.url as string;
    const secret = wh.secret as string | null;
    const faxId = (payload.faxId as string) ?? "unknown";

    const body = JSON.stringify({
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Cevi-Event": eventType,
    };

    // HMAC signature if secret is configured
    if (secret) {
      const signature = createHmac("sha256", secret).update(body).digest("hex");
      headers["X-Cevi-Signature"] = `sha256=${signature}`;
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(10_000),
      });

      const responseBody = await res.text().catch(() => "");

      deliveryInsert.run({
        id: `del-${randomUUID().slice(0, 8)}`,
        webhook_id: webhookId,
        event_type: eventType,
        fax_id: faxId,
        payload: body,
        status_code: res.status,
        response_body: responseBody.slice(0, 2000),
        success: res.ok ? 1 : 0,
      });
    } catch (err) {
      deliveryInsert.run({
        id: `del-${randomUUID().slice(0, 8)}`,
        webhook_id: webhookId,
        event_type: eventType,
        fax_id: faxId,
        payload: body,
        status_code: 0,
        response_body: err instanceof Error ? err.message : "Unknown error",
        success: 0,
      });
    }
  }
}

/** Get recent deliveries for a webhook */
export function getWebhookDeliveries(webhookId: string, limit = 20): Record<string, unknown>[] {
  const db = getSqlite();
  return db.prepare(
    "SELECT * FROM webhook_deliveries WHERE webhook_id = ? ORDER BY delivered_at DESC LIMIT ?",
  ).all(webhookId, limit) as Record<string, unknown>[];
}
