import { NextRequest } from "next/server";
import { getDataMergeService } from "@/backend/factories/service.factory";
import { SupabaseFaxRepository } from "@/backend/repositories/supabase/supabase-fax.repository";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const svc = getDataMergeService();
    const [fax, events] = await Promise.all([
      svc.getFaxById(id),
      svc.getEventsForFax(id),
    ]);

    if (!fax) {
      return Response.json({ error: "Fax not found" }, { status: 404 });
    }

    return Response.json({ fax, events });
  } catch {
    return Response.json({ error: "Failed to fetch fax" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || typeof status !== "string") {
      return Response.json({ error: "Missing status" }, { status: 400 });
    }

    const repo = new SupabaseFaxRepository();
    const ok = await repo.updateStatus(id, status);

    if (!ok) {
      return Response.json({ error: "Update failed" }, { status: 500 });
    }

    return Response.json({ ok: true, status });
  } catch {
    return Response.json({ error: "Failed to update fax" }, { status: 500 });
  }
}
