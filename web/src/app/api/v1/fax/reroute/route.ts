import { getSupabase } from "@/backend/repositories/supabase/supabase.client";
import { RoutingService } from "@/backend/services/routing.service";

/**
 * POST /api/v1/fax/reroute
 * Re-evaluates routing rules for all existing faxes and updates their status.
 * Applies confidence-based override: < 70% → needs_review.
 */
export async function POST() {
  const s = getSupabase();
  if (!s) {
    return Response.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { data: faxes, error } = await s
    .from("user_faxes")
    .select("id, type, urgency, type_confidence, status");

  if (error || !faxes) {
    return Response.json({ error: "Failed to fetch faxes" }, { status: 500 });
  }

  const router = new RoutingService();
  const updates: { id: string; oldStatus: string; newStatus: string }[] = [];

  for (const fax of faxes) {
    const confidence = Number(fax.type_confidence ?? 0);
    const routing = router.route({
      type: fax.type,
      urgency: fax.urgency ?? "routine",
      matchedPatientId: null,
    });

    let newStatus = routing.status;

    // Confidence override: < 70% → needs_review
    if (confidence < 0.7) {
      newStatus = "needs_review";
    }

    if (newStatus !== fax.status) {
      await s.from("user_faxes").update({ status: newStatus }).eq("id", fax.id);
      updates.push({ id: fax.id, oldStatus: fax.status, newStatus });
    }
  }

  return Response.json({ ok: true, total: faxes.length, updated: updates });
}
