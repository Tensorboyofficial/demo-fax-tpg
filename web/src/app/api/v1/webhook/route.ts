import { NextRequest } from "next/server";
import {
  registerWebhook,
  listWebhooks,
  deleteWebhook,
  toggleWebhook,
} from "@/backend/services/webhook.service";

/** GET /api/v1/webhook — list all configured webhooks */
export async function GET() {
  try {
    const webhooks = listWebhooks();
    return Response.json({ webhooks });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to list webhooks" },
      { status: 500 },
    );
  }
}

/** POST /api/v1/webhook — register a new webhook */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, secret, events } = body;

    if (!url || typeof url !== "string") {
      return Response.json({ error: "url is required" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return Response.json({ error: "Invalid URL" }, { status: 400 });
    }

    const result = registerWebhook({ url, secret, events });
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 500 });
    }

    return Response.json({ webhook: result.webhook }, { status: 201 });
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}

/** DELETE /api/v1/webhook?id=xxx — delete a webhook */
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  const deleted = deleteWebhook(id);
  if (!deleted) return Response.json({ error: "Webhook not found" }, { status: 404 });

  return Response.json({ ok: true });
}

/** PATCH /api/v1/webhook?id=xxx — toggle active/inactive */
export async function PATCH(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "id is required" }, { status: 400 });

  try {
    const body = await req.json();
    const { active } = body;
    if (typeof active !== "boolean") {
      return Response.json({ error: "active (boolean) is required" }, { status: 400 });
    }

    const updated = toggleWebhook(id, active);
    if (!updated) return Response.json({ error: "Webhook not found" }, { status: 404 });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
}
