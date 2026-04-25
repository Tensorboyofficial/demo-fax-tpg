"use client";

import { useState, useCallback } from "react";
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  Upload,
  Copy,
  Sparkles,
} from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useToast } from "@/frontend/components/ui/toast";
import { cn } from "@/shared/utils";
import type { SchemaField } from "@/shared/types";

/* ─── Default schemas per category ─── */
const DEFAULT_SCHEMAS: Record<string, SchemaField[]> = {
  lab: [
    { name: "patient_name", type: "text", required: true, description: "Patient full name on document" },
    { name: "patient_dob", type: "date", required: true, description: "Patient date of birth" },
    { name: "patient_mrn", type: "text", required: false, description: "Medical record number" },
    { name: "ordering_provider", type: "text", required: false, description: "Ordering physician name" },
    { name: "lab_name", type: "text", required: false, description: "Laboratory name" },
    { name: "collection_date", type: "date", required: false, description: "Specimen collection date" },
    { name: "test_panels", type: "array", required: true, description: "Lab test panels and results" },
    { name: "diagnoses", type: "array", required: false, description: "ICD-10 diagnoses" },
    { name: "critical_values", type: "boolean", required: false, description: "Contains critical values" },
  ],
  imaging: [
    { name: "patient_name", type: "text", required: true, description: "Patient name on report" },
    { name: "modality", type: "select", required: true, description: "Imaging modality", enum_values: ["X-Ray", "CT", "MRI", "Ultrasound", "PET"] },
    { name: "body_region", type: "text", required: true, description: "Body part examined" },
    { name: "findings", type: "text", required: true, description: "Key findings" },
    { name: "impression", type: "text", required: true, description: "Radiologist impression" },
    { name: "recommendations", type: "array", required: false, description: "Follow-up recommendations" },
  ],
  other: [
    { name: "patient_name", type: "text", required: false, description: "Patient name if present" },
    { name: "document_type", type: "text", required: false, description: "Detected document type" },
    { name: "source_org", type: "text", required: false, description: "Source organization" },
    { name: "document_date", type: "date", required: false, description: "Document date" },
    { name: "summary", type: "text", required: false, description: "Document summary" },
  ],
};

const FIELD_TYPES: SchemaField["type"][] = ["text", "number", "date", "boolean", "array", "select"];

/* ─── Props ─── */
interface Props {
  category: string;
  label: string;
  onClose: () => void;
}

export function SchemaBuilderDrawer({ category, label, onClose }: Props) {
  const { toast } = useToast();
  const defaultFields = DEFAULT_SCHEMAS[category] ?? DEFAULT_SCHEMAS.other!;
  const [fields, setFields] = useState<SchemaField[]>(JSON.parse(JSON.stringify(defaultFields)));
  const [systemPrompt, setSystemPrompt] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [openTypeIdx, setOpenTypeIdx] = useState<number | null>(null);

  const addField = useCallback(() => {
    setFields((prev) => [
      ...prev,
      { name: "", type: "text", required: false, description: "" },
    ]);
  }, []);

  const removeField = useCallback((idx: number) => {
    setFields((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const updateField = useCallback((idx: number, partial: Partial<SchemaField>) => {
    setFields((prev) => prev.map((f, i) => i === idx ? { ...f, ...partial } : f));
  }, []);

  const handleDragStart = useCallback((idx: number) => setDragIdx(idx), []);
  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setFields((prev) => {
      const next = [...prev];
      const [removed] = next.splice(dragIdx, 1);
      next.splice(idx, 0, removed);
      return next;
    });
    setDragIdx(idx);
  }, [dragIdx]);
  const handleDragEnd = useCallback(() => setDragIdx(null), []);

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/30" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg h-full border-r border-[var(--cevi-border)] shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--cevi-border-light)] shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
            <div>
              <h2 className="text-[16px] font-semibold text-[var(--cevi-text)]">Schema builder</h2>
              <div className="text-[12px] text-[var(--cevi-text-muted)] mt-0.5">
                Define the fields you&apos;d like to extract from the document.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="p-1.5 rounded-md hover:bg-[var(--cevi-surface-warm)] transition-colors text-[var(--cevi-text-muted)]" title="Import">
              <Upload className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button className="p-1.5 rounded-md hover:bg-[var(--cevi-surface-warm)] transition-colors text-[var(--cevi-text-muted)]" title="Copy">
              <Copy className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button className="p-1.5 rounded-md hover:bg-[var(--cevi-surface-warm)] transition-colors text-[var(--cevi-text-muted)]" title="Delete">
              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <Button variant="outline" size="sm" icon={<Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />}>
              Generate
            </Button>
          </div>
        </div>

        {/* Field table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-[var(--cevi-border-light)]">
                <th className="w-8" />
                <th className="text-left px-3 py-2.5 text-[13px] font-medium text-[var(--cevi-text-muted)]">Field</th>
                <th className="text-left px-3 py-2.5 text-[13px] font-medium text-[var(--cevi-text-muted)] w-[120px]">Type</th>
                <th className="text-left px-3 py-2.5 text-[13px] font-medium text-[var(--cevi-text-muted)]">Description</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {fields.map((field, idx) => (
                <tr
                  key={`${field.name}-${idx}`}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "border-b border-[var(--cevi-border-light)] hover:bg-[var(--cevi-surface-warm)] transition-colors",
                    dragIdx === idx && "opacity-50",
                  )}
                >
                  <td className="pl-3 py-2.5">
                    <GripVertical className="h-3.5 w-3.5 text-[var(--cevi-text-muted)] cursor-grab" strokeWidth={1.5} />
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      value={field.name}
                      onChange={(e) => updateField(idx, { name: e.target.value.replace(/[^a-z0-9_]/gi, "_").toLowerCase() })}
                      placeholder="field_name"
                      className="w-full bg-transparent text-[13px] text-[var(--cevi-text)] outline-none font-mono placeholder:text-[var(--cevi-text-faint)]"
                    />
                  </td>
                  <td className="px-3 py-2.5 relative">
                    <button
                      onClick={() => setOpenTypeIdx(openTypeIdx === idx ? null : idx)}
                      className="flex items-center gap-1 text-[13px] text-[var(--cevi-text)] bg-[var(--cevi-surface-warm)] border border-[var(--cevi-border)] rounded-md px-2.5 py-1 w-full justify-between"
                    >
                      <span className="capitalize">{field.type}</span>
                      <ChevronDown className="h-3 w-3 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
                    </button>
                    {openTypeIdx === idx && (
                      <div className="absolute top-full left-3 mt-1 bg-white border border-[var(--cevi-border)] rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                        {FIELD_TYPES.map((t) => (
                          <button
                            key={t}
                            onClick={() => { updateField(idx, { type: t }); setOpenTypeIdx(null); }}
                            className={cn(
                              "w-full text-left px-3 py-1.5 text-[13px] hover:bg-[var(--cevi-surface-warm)] transition-colors capitalize flex items-center justify-between",
                              field.type === t && "font-semibold",
                            )}
                          >
                            {t}
                            {field.type === t && <span className="text-[var(--cevi-text)]">&#10003;</span>}
                          </button>
                        ))}
                        <button
                          onClick={() => { updateField(idx, { type: "text" }); setOpenTypeIdx(null); }}
                          className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-[var(--cevi-surface-warm)] transition-colors capitalize"
                        >
                          Object
                        </button>
                        <button
                          onClick={() => { updateField(idx, { type: "select" }); setOpenTypeIdx(null); }}
                          className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-[var(--cevi-surface-warm)] transition-colors capitalize"
                        >
                          Enum
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      value={field.description ?? ""}
                      onChange={(e) => updateField(idx, { description: e.target.value })}
                      placeholder="Add description"
                      className="w-full bg-transparent text-[13px] text-[var(--cevi-text-muted)] outline-none placeholder:text-[var(--cevi-text-faint)]"
                    />
                  </td>
                  <td className="pr-3 py-2.5">
                    <button
                      onClick={() => removeField(idx)}
                      className="p-1 rounded hover:bg-red-50 text-[var(--cevi-text-muted)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add field */}
          <button
            onClick={addField}
            className="w-full flex items-center gap-1.5 px-5 py-3 text-[13px] font-medium text-[var(--cevi-text-muted)] hover:text-[var(--cevi-accent)] hover:bg-[var(--cevi-surface-warm)] transition-colors border-b border-[var(--cevi-border-light)]"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Add field
          </button>

          {/* System Prompt */}
          <div className="px-5 py-4">
            <div className="mb-1">
              <div className="text-[14px] font-semibold text-[var(--cevi-text)]">System Prompt</div>
              <div className="text-[12px] text-[var(--cevi-text-muted)]">
                Provide more context for the document processing block.
              </div>
            </div>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="if this is a lab report put this schema"
              rows={3}
              className="mt-2 w-full rounded-md border border-[var(--cevi-border)] bg-[var(--cevi-bg)] px-3 py-2.5 text-[13px] text-[var(--cevi-text)] placeholder:text-[var(--cevi-text-faint)] outline-none focus:border-[var(--cevi-text)] resize-y transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
