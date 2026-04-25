import { NextRequest } from "next/server";
import { isApiKeyConfigured } from "@/backend/config/models.config";

/** Dynamic SQLite settings — returns null/noop on Vercel */
function getSqliteSettings() {
  if (process.env.VERCEL) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@/backend/repositories/sqlite/sqlite.client");
    return { getSetting: mod.getSetting as (k: string) => string | null, setSetting: mod.setSetting as (k: string, v: string) => void, deleteSetting: mod.deleteSetting as (k: string) => boolean };
  } catch { return null; }
}

/**
 * GET /api/v1/settings
 * Returns current settings state (keys are masked for security)
 */
export async function GET() {
  try {
    const keyStatus = isApiKeyConfigured();
    const sqlite = getSqliteSettings();
    const runtimeKey = sqlite?.getSetting("anthropic_api_key") ?? null;

    return Response.json({
      anthropic_api_key: {
        configured: keyStatus.configured,
        source: keyStatus.source,
        masked: runtimeKey ? maskKey(runtimeKey) : null,
      },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/settings
 * Set a setting value. Body: { key: string, value: string }
 * For API key: { key: "anthropic_api_key", value: "sk-ant-..." }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || typeof key !== "string") {
      return Response.json({ error: "key is required" }, { status: 400 });
    }

    // Validate API key format
    if (key === "anthropic_api_key") {
      if (!value || typeof value !== "string") {
        return Response.json({ error: "API key value is required" }, { status: 400 });
      }
      if (!value.startsWith("sk-ant-")) {
        return Response.json(
          { error: "Invalid API key format. Anthropic keys start with sk-ant-" },
          { status: 400 },
        );
      }
    }

    const sqlite = getSqliteSettings();
    if (!sqlite) return Response.json({ error: "Settings storage unavailable" }, { status: 503 });
    sqlite.setSetting(key, value);

    return Response.json({
      ok: true,
      key,
      masked: key === "anthropic_api_key" ? maskKey(value) : undefined,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to save setting" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v1/settings?key=anthropic_api_key
 * Remove a runtime setting (falls back to .env)
 */
export async function DELETE(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) return Response.json({ error: "key query param is required" }, { status: 400 });

  const sqlite = getSqliteSettings();
  if (!sqlite) return Response.json({ error: "Settings storage unavailable" }, { status: 503 });
  const deleted = sqlite.deleteSetting(key);

  return Response.json({
    ok: true,
    deleted,
    fallback: key === "anthropic_api_key" ? Boolean(process.env.ANTHROPIC_API_KEY) : undefined,
  });
}

function maskKey(key: string): string {
  if (key.length <= 12) return "sk-ant-****";
  return key.slice(0, 7) + "****" + key.slice(-4);
}
