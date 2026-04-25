"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { cn, formatRelative } from "@/shared/utils";

interface SchemaRow {
  category: string;
  label: string;
  fileCount: number;
  splittable: boolean;
  alwaysReview: boolean;
}

/** Build a type badge string like Reducto's "Parse", "Parse > Extract", "Parse > Split > Extract" */
function typePipeline(schema: SchemaRow): string[] {
  const steps: string[] = ["Parse"];
  if (schema.splittable) steps.push("Split");
  if (!schema.alwaysReview) steps.push("Extract");
  return steps;
}

const STEP_COLORS: Record<string, string> = {
  Parse: "bg-[#F0E6F6] text-[#7C3AED]",
  Split: "bg-[#E0F2FE] text-[#0284C7]",
  Extract: "bg-[#DCFCE7] text-[#16A34A]",
  Edit: "bg-[#FEF3C7] text-[#D97706]",
};

interface Props {
  schemas: SchemaRow[];
}

export function SchemasTable({ schemas }: Props) {
  // Only show categories that have schemas (all of them), sorted by file count desc then label
  const sorted = [...schemas].sort((a, b) => b.fileCount - a.fileCount || a.label.localeCompare(b.label));

  return (
    <div>
      <div className="overflow-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-[var(--cevi-border-light)]">
              <th className="text-left px-4 py-3 text-[13px] font-medium text-[var(--cevi-text-muted)] whitespace-nowrap">Document</th>
              <th className="text-left px-4 py-3 text-[13px] font-medium text-[var(--cevi-text-muted)] whitespace-nowrap">Type</th>
              <th className="text-left px-4 py-3 text-[13px] font-medium text-[var(--cevi-text-muted)] whitespace-nowrap">Author</th>
              <th className="text-left px-4 py-3 text-[13px] font-medium text-[var(--cevi-text-muted)] whitespace-nowrap">Files</th>
              <th className="text-left px-4 py-3 text-[13px] font-medium text-[var(--cevi-text-muted)] whitespace-nowrap">Created</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((schema) => {
              const steps = typePipeline(schema);
              return (
                <tr
                  key={schema.category}
                  className="border-b border-[var(--cevi-border-light)] hover:bg-[#F5F5F5] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/category/${schema.category}`}
                      className="text-[14px] font-medium text-[var(--cevi-text)] hover:underline"
                    >
                      {schema.label}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      {steps.map((step, i) => (
                        <span key={step} className="flex items-center gap-1">
                          {i > 0 && <span className="text-[11px] text-[var(--cevi-text-muted)]">&gt;</span>}
                          <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full", STEP_COLORS[step] ?? "bg-[var(--cevi-surface)] text-[var(--cevi-text-muted)]")}>
                            {step}
                          </span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-[var(--cevi-accent)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        RD
                      </div>
                      <span className="text-[13px] text-[var(--cevi-text-secondary)]">Reducto Demo</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-[var(--cevi-text-secondary)] tabular-nums">
                    {schema.fileCount}
                  </td>
                  <td className="px-4 py-3.5 text-[13px] text-[var(--cevi-text-muted)]">
                    2d
                  </td>
                  <td className="px-4 py-3.5">
                    <button className="p-1 rounded hover:bg-[var(--cevi-surface)] transition-colors">
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
