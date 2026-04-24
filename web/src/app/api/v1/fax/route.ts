import { NextRequest } from "next/server";
import { getDataMergeService } from "@/backend/factories/service.factory";
import { uploadFax } from "@/app/upload/actions";

export async function GET() {
  try {
    const svc = getDataMergeService();
    const faxes = await svc.getAllFaxes();
    return Response.json({ faxes });
  } catch {
    return Response.json({ error: "Failed to fetch faxes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const result = await uploadFax(formData);
    const status = result.ok ? 201 : 400;
    return Response.json(result, { status });
  } catch {
    return Response.json(
      { ok: false, error: "Upload failed" },
      { status: 500 },
    );
  }
}
