import { NextRequest } from "next/server";
import { acknowledgeCritical } from "@/app/actions/critical-ack";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const result = await acknowledgeCritical({
      faxId: id,
      acknowledgedBy: body.acknowledged_by ?? "",
      calledAt: body.called_at ?? new Date().toISOString(),
      patientResponse: body.patient_response ?? "",
      note: body.note ?? "",
    });

    const status = result.ok ? 200 : 400;
    return Response.json(result, { status });
  } catch {
    return Response.json(
      { ok: false, error: "Acknowledgement failed" },
      { status: 500 },
    );
  }
}
