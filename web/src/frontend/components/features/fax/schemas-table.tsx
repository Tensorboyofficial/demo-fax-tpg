"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { cn, formatRelative } from "@/shared/utils";

interface SchemaRow {
  category: string;
  label: string;
  fileCount: number;
  splittable: boolean;
  alwaysReview: boolean;
  earliestFaxDate: string | null;
}

/** Build a type pipeline badge: "Parse", "Parse > Extract", "Parse > Split > Extract" */
function typePipeline(schema: SchemaRow): string[] {
  const steps: string[] = ["Parse"];
  if (schema.splittable) steps.push("Split");
  if (!schema.alwaysReview) steps.push("Extract");
  return steps;
}

const STEP_COLORS: Record<string, string> = {
  Parse: "bg-[var(--cevi-teal-light)] text-[var(--cevi-info)]",
  Split: "bg-[var(--cevi-amber-light)] text-[var(--cevi-warning)]",
  Extract: "bg-[var(--cevi-success-light)] text-[var(--cevi-success)]",
};

interface Props {
  schemas: SchemaRow[];
}

export function SchemasTable({ schemas }: Props) {
  const router = useRouter();
  const sorted = [...schemas].sort((a, b) => b.fileCount - a.fileCount || a.label.localeCompare(b.label));

  return (
    <div>
      {/* Header — matches inbox/category page padding & typography */}
      <div className="flex items-center gap-3 px-3 sm:px-5 py-3 sm:py-3.5">
        <h1 className="text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--cevi-text)]">
          Schemas
        </h1>
        <span className="text-[13px] text-[var(--cevi-text-muted)] tabular-nums">
          {sorted.length}
        </span>
      </div>

      <div className="border-t border-[var(--cevi-border-light)]" />

      <div className="overflow-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-[var(--cevi-border-light)]">
              <th className="text-left px-4 sm:px-5 py-3 text-[14px] font-medium text-[var(--cevi-text-muted)] whitespace-nowrap">Document</th>
              <th className="text-left px-4 py-3 text-[14px] font-medium text-[var(--cevi-text-muted)] whitespace-nowrap">Type</th>
              <th className="text-left px-4 py-3 text-[14px] font-medium text-[var(--cevi-text-muted)] whitespace-nowrap">Files</th>
              <th className="text-left px-4 py-3 text-[14px] font-medium text-[var(--cevi-text-muted)] whitespace-nowrap">Created</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((schema) => {
              const steps = typePipeline(schema);
              return (
                <tr
                  key={schema.category}
                  onClick={() => router.push(`/category/${schema.category}`)}
                  className="border-b border-[var(--cevi-border-light)] hover:bg-[var(--cevi-surface)] cursor-pointer transition-colors"
                >
                  <td className="px-4 sm:px-5 py-3.5">
                    <span className="text-[14px] font-medium text-[var(--cevi-text)]">
                      {schema.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {steps.map((step, i) => (
                        <span key={step} className="flex items-center gap-1.5">
                          {i > 0 && <span className="text-[11px] text-[var(--cevi-text-faint)]">&rsaquo;</span>}
                          <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-md", STEP_COLORS[step] ?? "bg-[var(--cevi-surface)] text-[var(--cevi-text-muted)]")}>
                            {step}
                          </span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-[var(--cevi-text-secondary)] tabular-nums">
                    {schema.fileCount}
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-[var(--cevi-text-muted)]">
                    {schema.earliestFaxDate ? formatRelative(schema.earliestFaxDate) : "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-md hover:bg-[var(--cevi-surface-hover)] transition-colors"
                    >
                      <MoreHorizontal className="h-4 w-4 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
