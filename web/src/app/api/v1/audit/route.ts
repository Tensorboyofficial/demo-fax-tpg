import { getDataMergeService } from "@/backend/factories/service.factory";

export async function GET() {
  try {
    const svc = getDataMergeService();
    const events = await svc.getAllEvents();
    return Response.json({ events });
  } catch {
    return Response.json(
      { error: "Failed to fetch audit events" },
      { status: 500 },
    );
  }
}
