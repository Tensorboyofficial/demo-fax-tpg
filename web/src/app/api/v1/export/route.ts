import { NextRequest } from "next/server";
import { getAllFaxes } from "@/backend/services/data-merge.service";
import type { Fax } from "@/shared/types";

/**
 * GET /api/v1/export
 *
 * Export faxes + structured extractions from all data sources (seed + memory + Supabase + SQLite).
 * Query params:
 *   format=json (default) | csv
 *   category=lab_result (optional filter)
 *   from=2025-01-01 (optional date filter)
 *   to=2025-12-31 (optional date filter)
 *   status=unopened (optional status filter)
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const format = params.get("format") ?? "json";
    const category = params.get("category") ?? undefined;
    const fromDate = params.get("from") ?? undefined;
    const toDate = params.get("to") ?? undefined;
    const status = params.get("status") ?? undefined;

    const ids = params.get("ids") ?? undefined;

    let faxes = await getAllFaxes();

    // Filter by specific IDs (from checkbox selection)
    if (ids) {
      const idSet = new Set(ids.split(","));
      faxes = faxes.filter((f) => idSet.has(f.id));
    }

    // Apply filters
    if (category) {
      faxes = faxes.filter((f) => f.type === category);
    }
    if (fromDate) {
      faxes = faxes.filter((f) => f.receivedAt >= fromDate);
    }
    if (toDate) {
      faxes = faxes.filter((f) => f.receivedAt <= toDate);
    }
    if (status) {
      faxes = faxes.filter((f) => f.status === status);
    }

    if (format === "csv") {
      const csv = faxesToCsv(faxes);
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="cevi-export-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // JSON export
    const exportData = faxes.map((f) => ({
      id: f.id,
      receivedAt: f.receivedAt,
      pages: f.pages,
      fromOrg: f.fromOrg,
      fromNumber: f.fromNumber,
      toClinic: f.toClinic,
      type: f.type,
      typeConfidence: f.typeConfidence,
      urgency: f.urgency,
      status: f.status,
      matchedPatientId: f.matchedPatientId,
      matchConfidence: f.matchConfidence,
      routedTo: f.routedTo,
      routedReason: f.routedReason,
      aiSummary: f.aiSummary,
      extracted: f.extracted,
    }));

    return Response.json(
      { count: exportData.length, exported_at: new Date().toISOString(), faxes: exportData },
      {
        headers: {
          "Content-Disposition": `attachment; filename="cevi-export-${new Date().toISOString().slice(0, 10)}.json"`,
        },
      },
    );
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Export failed" },
      { status: 500 },
    );
  }
}

function faxesToCsv(faxes: Fax[]): string {
  if (faxes.length === 0) return "No data to export";

  const headers = [
    "id", "received_at", "pages", "from_org", "from_number", "to_clinic",
    "type", "type_confidence", "urgency", "status",
    "matched_patient_id", "match_confidence",
    "routed_to", "routed_reason", "ai_summary",
    "patient_name", "patient_dob", "sending_provider", "sending_org",
    "summary",
  ];

  const rows: string[] = [headers.join(",")];

  for (const f of faxes) {
    rows.push([
      csvEscape(f.id),
      csvEscape(f.receivedAt),
      String(f.pages),
      csvEscape(f.fromOrg),
      csvEscape(f.fromNumber),
      csvEscape(f.toClinic),
      csvEscape(f.type),
      String(f.typeConfidence),
      csvEscape(f.urgency),
      csvEscape(f.status),
      csvEscape(f.matchedPatientId ?? ""),
      f.matchConfidence != null ? String(f.matchConfidence) : "",
      csvEscape(f.routedTo ?? ""),
      csvEscape(f.routedReason ?? ""),
      csvEscape(f.aiSummary ?? ""),
      csvEscape(f.extracted?.patientNameOnDoc ?? ""),
      csvEscape(f.extracted?.patientDobOnDoc ?? ""),
      csvEscape(f.extracted?.sendingProvider ?? ""),
      csvEscape(f.extracted?.sendingOrg ?? ""),
      csvEscape(f.extracted?.summary ?? ""),
    ].join(","));
  }

  return rows.join("\n");
}

function csvEscape(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
