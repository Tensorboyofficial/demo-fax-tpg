import { NextRequest } from "next/server";
import { getDataMergeService } from "@/backend/factories/service.factory";

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
