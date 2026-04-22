import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { IconBox } from "@/components/ui/icon-box";
import { Badge } from "@/components/ui/badge";
import { FileOutput, Sparkles } from "lucide-react";
import type { ExtractedFields as Fields } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  fields: Fields;
  modelLabel?: string;
  aiSummary?: string;
  latencyMs?: number;
  className?: string;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-4 py-2.5 border-b border-[var(--cevi-border-light)] last:border-b-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--cevi-text-tertiary)]">
        {label}
      </div>
      <div className="text-[13px] text-[var(--cevi-text)]">{children}</div>
    </div>
  );
}

function Chips({
  items,
  tone = "default",
}: {
  items: string[];
  tone?: "default" | "accent";
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span
          key={`${item}-${i}`}
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium",
            tone === "accent"
              ? "bg-[var(--cevi-accent-light)] text-[var(--cevi-accent)] border border-[var(--cevi-accent)]/15"
              : "bg-[var(--cevi-surface)] text-[var(--cevi-text-secondary)]",
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function ExtractedFields({
  fields,
  modelLabel,
  aiSummary,
  latencyMs,
  className,
}: Props) {
  return (
    <Card padding="none" className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <IconBox tone="sand" size="sm">
              <FileOutput className="h-4 w-4" strokeWidth={1.5} />
            </IconBox>
            <div>
              <div className="text-[13px] font-semibold text-[var(--cevi-text)]">
                Structured extraction
              </div>
              <div className="text-[11px] text-[var(--cevi-text-muted)]">
                {modelLabel ? (
                  <span className="inline-flex items-center gap-1">
                    <Sparkles
                      className="h-3 w-3 text-[var(--cevi-accent)]"
                      strokeWidth={1.5}
                    />
                    {modelLabel}
                    {typeof latencyMs === "number" && (
                      <span className="text-[var(--cevi-text-faint)] ml-1">
                        · {(latencyMs / 1000).toFixed(1)}s
                      </span>
                    )}
                  </span>
                ) : (
                  "Awaiting model run"
                )}
              </div>
            </div>
          </div>
          <Badge variant="jade" size="sm">
            JSON-validated
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {aiSummary && (
          <div className="mb-4 p-3 rounded-md bg-[var(--cevi-accent-light)] border border-[var(--cevi-accent)]/15">
            <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-accent)] mb-1">
              AI summary
            </div>
            <div className="text-[13px] text-[var(--cevi-text)] leading-snug">
              {aiSummary}
            </div>
          </div>
        )}

        <div>
          {fields.sendingProvider && (
            <Row label="Sending provider">{fields.sendingProvider}</Row>
          )}
          {fields.sendingOrg && <Row label="Sending org">{fields.sendingOrg}</Row>}
          {fields.documentDate && (
            <Row label="Document date">{fields.documentDate}</Row>
          )}
          {fields.patientNameOnDoc && (
            <Row label="Patient on doc">{fields.patientNameOnDoc}</Row>
          )}
          {fields.patientDobOnDoc && (
            <Row label="DOB on doc">{fields.patientDobOnDoc}</Row>
          )}
          {fields.patientMrnOnDoc && (
            <Row label="MRN on doc">
              <span className="font-mono">{fields.patientMrnOnDoc}</span>
            </Row>
          )}
          {fields.diagnoses && fields.diagnoses.length > 0 && (
            <Row label="Diagnoses">
              <ul className="space-y-1">
                {fields.diagnoses.map((d, i) => (
                  <li key={i} className="text-[13px]">
                    · {d}
                  </li>
                ))}
              </ul>
            </Row>
          )}
          {fields.medications && fields.medications.length > 0 && (
            <Row label="Medications">
              <ul className="space-y-1">
                {fields.medications.map((m, i) => (
                  <li key={i} className="text-[13px]">
                    · {m}
                  </li>
                ))}
              </ul>
            </Row>
          )}
          {fields.recommendations && fields.recommendations.length > 0 && (
            <Row label="Recommendations">
              <ul className="space-y-1">
                {fields.recommendations.map((r, i) => (
                  <li key={i} className="text-[13px] flex gap-2">
                    <span className="text-[var(--cevi-accent)] shrink-0 font-bold">→</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Row>
          )}
          {fields.icd10 && fields.icd10.length > 0 && (
            <Row label="ICD-10">
              <Chips items={fields.icd10} tone="accent" />
            </Row>
          )}
          {fields.cpt && fields.cpt.length > 0 && (
            <Row label="CPT">
              <Chips items={fields.cpt} />
            </Row>
          )}
          {fields.urgency && (
            <Row label="Urgency">
              <span className="capitalize">{fields.urgency}</span>
            </Row>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
