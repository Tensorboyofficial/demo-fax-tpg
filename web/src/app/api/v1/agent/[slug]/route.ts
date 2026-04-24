import { NextRequest } from "next/server";
import { getDataMergeService } from "@/backend/factories/service.factory";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const svc = getDataMergeService();
    const allFaxes = await svc.getAllFaxes();

    const faxes = allFaxes.filter(
      (fax) => fax.routedTo === `agent:${slug}`,
    );

    return Response.json({ faxes });
  } catch {
    return Response.json(
      { error: "Failed to fetch queue faxes" },
      { status: 500 },
    );
  }
}
