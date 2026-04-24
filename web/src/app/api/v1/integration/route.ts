import { integrations } from "@/data/seed/integrations";

export async function GET() {
  return Response.json({ integrations });
}
