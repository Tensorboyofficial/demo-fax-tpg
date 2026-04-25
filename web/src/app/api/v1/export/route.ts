import { NextRequest } from "next/server";
import { getAllFaxesWithExtractions } from "@/backend/repositories/sqlite/sqlite-fax.repository";

/**
 * GET /api/v1/export
 *
 * Export faxes + structured extractions.
 * Query params:
 *   format=json (default) | csv
 *   category=lab_result (optional filter)
 *   from=2025-01-01 (optional date filter)
 *   to=2025-12-31 (optional date filter)
 *   status=unopened (optional status filter)
 *   flat=true (optional: flatten nested JSON for CSV)
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const format = params.get("format") ?? "json";
    const category = params.get("category") ?? undefined;
    const fromDate = params.get("from") ?? undefined;
    const toDate = params.get("to") ?? undefined;
    const status = params.get("status") ?? undefined;

    const faxes = getAllFaxesWithExtractions({ category, fromDate, toDate, status });

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

    // JSON export — full structured data
    const exportData = faxes.map((f) => ({
      id: f.id,
      receivedAt: f.receivedAt,
      fromOrg: f.fromOrg,
      type: f.type,
      typeConfidence: f.typeConfidence,
      urgency: f.urgency,
      status: f.status,
      matchedPatientId: f.matchedPatientId,
      matchConfidence: f.matchConfidence,
      routedTo: f.routedTo,
      aiSummary: f.aiSummary,
      extraction: f.extraction ?? null,
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

/** Flatten fax + extraction data into CSV rows */
function faxesToCsv(
  faxes: Array<{ id: string; receivedAt: string; fromOrg: string; type: string; typeConfidence: number; urgency: string; status: string; matchedPatientId: string | null; matchConfidence: number | null; routedTo: string | null; aiSummary?: string; extraction?: Record<string, unknown> }>,
): string {
  if (faxes.length === 0) return "No data to export";

  // Base columns always present
  const baseHeaders = [
    "id", "received_at", "from_org", "type", "type_confidence",
    "urgency", "status", "matched_patient_id", "match_confidence",
    "routed_to", "ai_summary",
  ];

  // Collect all extraction keys across all faxes (flattened one level)
  const extractionKeys = new Set<string>();
  for (const f of faxes) {
    if (f.extraction) {
      for (const key of Object.keys(f.extraction)) {
        extractionKeys.add(`ext_${key}`);
      }
    }
  }

  const allHeaders = [...baseHeaders, ...Array.from(extractionKeys).sort()];
  const rows: string[] = [allHeaders.join(",")];

  for (const f of faxes) {
    const base = [
      csvEscape(f.id),
      csvEscape(f.receivedAt),
      csvEscape(f.fromOrg),
      csvEscape(f.type),
      String(f.typeConfidence),
      csvEscape(f.urgency),
      csvEscape(f.status),
      csvEscape(f.matchedPatientId ?? ""),
      f.matchConfidence != null ? String(f.matchConfidence) : "",
      csvEscape(f.routedTo ?? ""),
      csvEscape(f.aiSummary ?? ""),
    ];

    const extValues: string[] = [];
    for (const key of Array.from(extractionKeys).sort()) {
      const realKey = key.replace(/^ext_/, "");
      const val = f.extraction?.[realKey];
      if (val === undefined || val === null) {
        extValues.push("");
      } else if (typeof val === "object") {
        extValues.push(csvEscape(JSON.stringify(val)));
      } else {
        extValues.push(csvEscape(String(val)));
      }
    }

    rows.push([...base, ...extValues].join(","));
  }

  return rows.join("\n");
}

function csvEscape(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
