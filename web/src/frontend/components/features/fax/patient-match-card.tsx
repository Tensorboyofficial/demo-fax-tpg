"use client";

import { Card, CardHeader, CardContent } from "@/frontend/components/ui/card";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { IconBox } from "@/frontend/components/ui/icon-box";
import { ConfidenceMeter } from "@/frontend/components/composed/confidence-meter";
import { patients, patientFullName } from "@/data/seed/patients";
import { providers } from "@/data/seed/providers";
import { formatDob, calcAge, cn } from "@/shared/utils";
import type { Fax } from "@/shared/types";
import { CheckCircle2, UserSearch, User, Building2 } from "lucide-react";
import { useState } from "react";

interface Props {
  fax: Fax;
}

export function PatientMatchCard({ fax }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(fax.matchedPatientId);
  const [confirmed, setConfirmed] = useState(fax.status !== "needs_review");

  const candidates = fax.candidates;

  return (
    <Card padding="none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <IconBox tone="teal" size="sm">
              <UserSearch className="h-4 w-4" strokeWidth={1.5} />
            </IconBox>
            <div>
              <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                Patient match
              </div>
              <div className="text-[11px] text-[var(--cevi-text-muted)]">
                Compared against 4,217 active patients
              </div>
            </div>
          </div>
          {confirmed ? (
            <Badge variant="success" dot size="sm">
              Confirmed
            </Badge>
          ) : (
            <Badge variant="amber" dot pulse size="sm">
              Needs confirmation
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {candidates.length === 0 ? (
          <div className="py-6 text-center">
            <div className="text-[13px] text-[var(--cevi-text-muted)] mb-2">
              No patient candidates found in the directory.
            </div>
            <Button variant="secondary" size="sm">
              Create new patient
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {candidates.map((c) => {
              const p = patients.find((x) => x.id === c.patientId);
              if (!p) return null;
              const isSelected = selectedId === c.patientId;
              const prov = providers.find((pr) => pr.id === p.primaryProviderId);
              return (
                <li
                  key={c.patientId}
                  className={cn(
                    "rounded-lg border p-3 transition-all",
                    isSelected
                      ? "border-[var(--cevi-accent)] bg-[var(--cevi-accent-light)]"
                      : "border-[var(--cevi-border)] bg-white hover:bg-[var(--cevi-surface-warm)]",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-full bg-[var(--cevi-surface)] flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[13px] font-semibold text-[var(--cevi-text)] truncate">
                          {patientFullName(p)}
                        </div>
                        <ConfidenceMeter value={c.score} />
                      </div>
                      <div className="mt-0.5 text-[11px] text-[var(--cevi-text-muted)] font-mono">
                        {p.mrn} · DOB {formatDob(p.dob)} · {calcAge(p.dob)}y {p.sex}
                      </div>
                      <div className="mt-1 text-[11px] text-[var(--cevi-text-tertiary)] inline-flex items-center gap-1">
                        <Building2 className="h-3 w-3" strokeWidth={1.5} />
                        {p.clinic} · PCP {prov?.name.split(",")[0] ?? "—"}
                      </div>
                      <div className="mt-2 text-[11px] text-[var(--cevi-text-secondary)] italic">
                        {c.reason}
                      </div>
                      {!confirmed && (
                        <div className="mt-3 flex items-center gap-2">
                          {isSelected ? (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                              onClick={() => {
                                setConfirmed(true);
                              }}
                            >
                              Confirm match
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedId(c.patientId)}
                            >
                              Select
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {confirmed && fax.status !== "needs_review" && (
          <div className="mt-3 text-[11px] text-[var(--cevi-text-muted)]">
            Auto-confirmed on arrival (score {Math.round((fax.matchConfidence ?? 0) * 100)}%
            ≥ threshold 90%). Override available above.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
