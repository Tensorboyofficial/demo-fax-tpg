import { NextRequest } from "next/server";
import { classifyFax } from "@/app/actions/classify";
import type { ModelTier } from "@/backend/config/models.config";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const tier: ModelTier =
      body.tier === "fast" ? "fast"
      : body.tier === "premium" ? "premium"
      : "smart";

    const result = await classifyFax(id, tier);
    const status = result.ok ? 200 : 400;
    return Response.json(result, { status });
  } catch {
    return Response.json(
      { ok: false, error: "Classification failed" },
      { status: 500 },
    );
  }
}
