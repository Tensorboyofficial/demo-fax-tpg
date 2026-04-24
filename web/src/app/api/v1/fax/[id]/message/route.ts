import { NextRequest } from "next/server";
import { draftPatientMessage } from "@/app/actions/draft-message";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await draftPatientMessage({ faxId: id });
    const status = result.ok ? 200 : 400;
    return Response.json(result, { status });
  } catch {
    return Response.json(
      { ok: false, error: "Draft message failed" },
      { status: 500 },
    );
  }
}
