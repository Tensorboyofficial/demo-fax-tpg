import Link from "next/link";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge, typeBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconBox } from "@/components/ui/icon-box";
import { ConfidenceMeter } from "@/components/inbox/ConfidenceMeter";
import { faxes } from "@/data/faxes";
import { patients } from "@/data/patients";
import { AlertCircle, ArrowRight } from "lucide-react";
import { formatRelative } from "@/lib/utils";

export const metadata = {
  title: "Review Queue · Cevi",
};

export default function ReviewPage() {
  const queue = faxes.filter((f) => f.status === "needs_review");

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div className="max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] mb-2">
            Review Queue
          </div>
          <h1 className="font-serif text-[32px] leading-[1.1] tracking-[-0.02em] text-[var(--cevi-text)]">
            The 5% humans still handle.
          </h1>
          <p className="mt-3 text-[14px] text-[var(--cevi-text-muted)]">
            These faxes scored below the 80% classification or 90% patient-match
            threshold. Dispose of them here and Cevi learns from your decision —
            confidence improves every week.
          </p>
        </div>
        <IconBox tone="amber" size="lg">
          <AlertCircle className="h-6 w-6" strokeWidth={1.5} />
        </IconBox>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {queue.length === 0 ? (
          <div className="md:col-span-2 py-16 text-center">
            <div className="text-[14px] text-[var(--cevi-text-muted)] mb-2">
              Nothing in the review queue. Inbox is fully auto-handled.
            </div>
          </div>
        ) : (
          queue.map((f) => {
            const bestCandidate = f.candidates[0];
            const candidatePatient = bestCandidate
              ? patients.find((p) => p.id === bestCandidate.patientId)
              : undefined;
            return (
              <Card padding="none" key={f.id}>
                <CardHeader className="flex items-start justify-between">
                  <div>
                    <Badge variant={typeBadgeVariant(f.type)} size="sm">
                      {f.type.replace("_", " ")}
                    </Badge>
                    <div className="mt-2 text-[14px] font-semibold text-[var(--cevi-text)]">
                      {f.fromOrg}
                    </div>
                    <div className="text-[11px] text-[var(--cevi-text-muted)]">
                      {formatRelative(f.receivedAt)} · {f.pages} pages
                    </div>
                  </div>
                  <Badge variant="amber" size="sm" dot pulse>
                    Needs review
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[var(--cevi-text-tertiary)] mb-1">
                      Why it's here
                    </div>
                    <div className="text-[12px] text-[var(--cevi-text-secondary)]">
                      {f.routedReason ??
                        "Scored below the auto-route threshold. Needs a 10-second human decision."}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[var(--cevi-text-tertiary)]">
                        Type confidence
                      </div>
                      <ConfidenceMeter value={f.typeConfidence} className="mt-1" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[var(--cevi-text-tertiary)]">
                        Best match
                      </div>
                      <div className="mt-1 text-[12px] text-[var(--cevi-text)]">
                        {candidatePatient
                          ? `${candidatePatient.firstName} ${candidatePatient.lastName}`
                          : "No candidate"}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <div className="text-[11px] text-[var(--cevi-text-muted)]">
                    Estimated decision time · ~15s
                  </div>
                  <Link href={`/inbox/${f.id}`}>
                    <Button
                      variant="primary"
                      size="sm"
                      iconRight={<ArrowRight className="h-3.5 w-3.5" />}
                    >
                      Review and route
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
