"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/frontend/components/ui/card";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { IconBox } from "@/frontend/components/ui/icon-box";
import {
  Receipt,
  Copy,
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { EobResult } from "@/app/upload/eob-actions";
import { cn } from "@/shared/utils";

interface Props {
  result: EobResult;
}

function money(n: number | undefined): string {
  if (typeof n !== "number") return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function buildCsv(result: EobResult): string {
  const headers = [
    "payer",
    "check_number",
    "check_date",
    "patient",
    "patient_account",
    "dos",
    "cpt",
    "description",
    "billed",
    "allowed",
    "paid",
    "adjustment",
    "patient_responsibility",
    "denial_codes",
  ];
  const escape = (v: string | number | undefined) =>
    `"${String(v ?? "").replaceAll('"', '""')}"`;
  const rows = result.claims.map((c) =>
    [
      result.payer,
      result.checkNumber,
      result.checkDate,
      c.patient,
      c.patientAccount,
      c.dos,
      c.cpt,
      c.description,
      c.billed,
      c.allowed,
      c.paid,
      c.adjustment,
      c.patientResponsibility,
      (c.denialCodes ?? []).join("|"),
    ]
      .map(escape)
      .join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}

export function EobResultView({ result }: Props) {
  const [copied, setCopied] = useState(false);
  const totalPaid = result.claims.reduce((s, c) => s + (c.paid ?? 0), 0);
  const totalBilled = result.claims.reduce((s, c) => s + (c.billed ?? 0), 0);

  function handleCopy() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    const lines = [
      `${result.payer}${result.checkNumber ? ` · check ${result.checkNumber}` : ""}${result.checkDate ? ` · ${result.checkDate}` : ""}`,
      "",
      "Patient\tDOS\tCPT\tBilled\tAllowed\tPaid\tAdjustment\tPatient resp\tDenials",
      ...result.claims.map((c) =>
        [
          c.patient,
          c.dos,
          c.cpt,
          money(c.billed),
          money(c.allowed),
          money(c.paid),
          money(c.adjustment),
          money(c.patientResponsibility),
          (c.denialCodes ?? []).join(", "),
        ].join("\t"),
      ),
    ].join("\n");
    navigator.clipboard.writeText(lines);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  function handleDownload() {
    const csv = buildCsv(result);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cevi-eob-${result.checkNumber ?? new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasDenials = result.claims.some(
    (c) => (c.denialCodes ?? []).length > 0,
  );

  return (
    <Card padding="none">
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <IconBox tone="sand">
              <Receipt className="h-5 w-5" strokeWidth={1.5} />
            </IconBox>
            <div>
              <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[var(--cevi-text-tertiary)]">
                Extracted EOB · {result.claims.length}{" "}
                {result.claims.length === 1 ? "claim" : "claims"}
              </div>
              <div className="mt-0.5 text-[15px] font-semibold text-[var(--cevi-text)]">
                {result.payer}
                {result.checkNumber ? ` · check ${result.checkNumber}` : ""}
              </div>
              <div className="text-[11px] text-[var(--cevi-text-muted)] inline-flex items-center gap-1.5 mt-0.5">
                <Sparkles className="h-3 w-3 text-[var(--cevi-accent)]" strokeWidth={1.5} />
                {result.modelLabel} · {(result.latencyMs / 1000).toFixed(1)}s
                {typeof result.checkAmount === "number" && (
                  <>
                    <span>·</span>
                    <span>Check total {money(result.checkAmount)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {hasDenials && (
            <Badge variant="amber" dot size="sm">
              Denials present
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border border-[var(--cevi-border-light)]">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--cevi-surface-warm)] text-left text-[10px] font-semibold text-[var(--cevi-text-tertiary)] uppercase tracking-[0.08em]">
                <th className="px-3 py-2.5">Patient</th>
                <th className="px-3 py-2.5">DOS</th>
                <th className="px-3 py-2.5">CPT</th>
                <th className="px-3 py-2.5 text-right">Billed</th>
                <th className="px-3 py-2.5 text-right">Allowed</th>
                <th className="px-3 py-2.5 text-right">Paid</th>
                <th className="px-3 py-2.5 text-right">Adj</th>
                <th className="px-3 py-2.5 text-right">Pt resp</th>
                <th className="px-3 py-2.5">Denial</th>
              </tr>
            </thead>
            <tbody>
              {result.claims.map((c, i) => (
                <tr
                  key={`${c.patient}-${c.cpt}-${i}`}
                  className="border-t border-[var(--cevi-border-light)] hover:bg-[var(--cevi-surface-warm)]"
                >
                  <td className="px-3 py-2.5 text-[12px] text-[var(--cevi-text)]">
                    <div className="font-medium">{c.patient}</div>
                    {c.patientAccount && (
                      <div className="text-[10px] font-mono text-[var(--cevi-text-muted)]">
                        {c.patientAccount}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-[var(--cevi-text-secondary)] tabular-nums">
                    {formatDate(c.dos)}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] font-mono">
                    {c.cpt}
                    {c.description && (
                      <div className="text-[10px] text-[var(--cevi-text-muted)] font-sans line-clamp-1">
                        {c.description}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-right tabular-nums">
                    {money(c.billed)}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-right tabular-nums">
                    {money(c.allowed)}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-right tabular-nums font-semibold text-[var(--cevi-success)]">
                    {money(c.paid)}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-right tabular-nums text-[var(--cevi-text-muted)]">
                    {money(c.adjustment)}
                  </td>
                  <td className="px-3 py-2.5 text-[12px] text-right tabular-nums">
                    {money(c.patientResponsibility)}
                  </td>
                  <td className="px-3 py-2.5">
                    {(c.denialCodes ?? []).length > 0 ? (
                      <span className="inline-flex gap-1 flex-wrap">
                        {(c.denialCodes ?? []).map((code) => (
                          <Badge key={code} variant="amber" size="sm">
                            {code}
                          </Badge>
                        ))}
                      </span>
                    ) : (
                      <span className="text-[11px] text-[var(--cevi-text-faint)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr
                className={cn(
                  "border-t-2 border-[var(--cevi-border)] bg-[var(--cevi-surface-warm)] font-semibold",
                )}
              >
                <td className="px-3 py-2.5 text-[11px] uppercase tracking-[0.06em] text-[var(--cevi-text-tertiary)]" colSpan={3}>
                  Totals
                </td>
                <td className="px-3 py-2.5 text-[12px] text-right tabular-nums">
                  {money(totalBilled)}
                </td>
                <td className="px-3 py-2.5" />
                <td className="px-3 py-2.5 text-[12px] text-right tabular-nums text-[var(--cevi-success)]">
                  {money(totalPaid)}
                </td>
                <td className="px-3 py-2.5" colSpan={3} />
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-[11px] text-[var(--cevi-text-muted)]">
          Paste into your biller's workflow, or export as CSV.
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={
              copied ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--cevi-jade)]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )
            }
            onClick={handleCopy}
          >
            {copied ? "Copied" : "Copy rows"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Download className="h-3.5 w-3.5" strokeWidth={1.5} />}
            onClick={handleDownload}
          >
            Export CSV
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export function EobErrorView({ error }: { error: string }) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-3">
        <IconBox tone="accent" size="sm">
          <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
        </IconBox>
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
            Couldn't read that EOB
          </div>
          <div className="mt-0.5 text-[12px] text-[var(--cevi-text-muted)]">
            {error}
          </div>
        </div>
      </div>
    </Card>
  );
}
