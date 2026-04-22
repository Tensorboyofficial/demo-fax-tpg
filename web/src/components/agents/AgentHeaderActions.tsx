"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { faxes } from "@/data/faxes";
import { patients } from "@/data/patients";
import { Download, Settings2 } from "lucide-react";
import type { AgentKey } from "@/lib/types";

interface Props {
  agentKey: AgentKey;
  slug: string;
}

function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) =>
    `"${String(v).replaceAll('"', '""')}"`;
  const body = rows.map((r) => headers.map((h) => escape(r[h])).join(","));
  return [headers.join(","), ...body].join("\n");
}

export function AgentHeaderActions({ agentKey, slug }: Props) {
  function handleDownload() {
    const agentTypeMap: Record<AgentKey, string> = {
      referrals: "referral",
      prior_auth: "prior_auth",
      lab_results: "lab_result",
      rx_refills: "rx_refill",
      records: "records_request",
    };
    const type = agentTypeMap[agentKey];
    const rows = faxes
      .filter((f) => f.type === type)
      .map((f) => {
        const p = patients.find((pt) => pt.id === f.matchedPatientId);
        return {
          fax_id: f.id,
          received_at: f.receivedAt,
          from_org: f.fromOrg,
          patient: p ? `${p.firstName} ${p.lastName}` : f.extracted.patientNameOnDoc ?? "",
          dob: p?.dob ?? "",
          clinic: f.toClinic,
          type: f.type,
          status: f.status,
          urgency: f.urgency,
          summary: (f.extracted.summary ?? "").replaceAll("\n", " "),
        };
      });

    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cevi-${slug}-pilot-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/agents/${slug}/workflow`}>
        <Button
          variant="secondary"
          size="sm"
          icon={<Settings2 className="h-3.5 w-3.5" strokeWidth={1.5} />}
        >
          Edit workflow
        </Button>
      </Link>
      <Button
        variant="primary"
        size="sm"
        icon={<Download className="h-3.5 w-3.5" strokeWidth={1.5} />}
        onClick={handleDownload}
      >
        Run pilot report
      </Button>
    </div>
  );
}
