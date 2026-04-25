"use client";

import { useState, useCallback } from "react";
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Save,
  RotateCcw,
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
    { name: "result_date", type: "date", required: false, description: "Result report date" },
    { name: "test_panels", type: "array", required: true, description: "Lab test panels and results", children: [
      { name: "panel_name", type: "text", required: true, description: "Panel name (e.g. CBC, BMP)" },
      { name: "result_value", type: "text", required: true, description: "Result value" },
      { name: "reference_range", type: "text", required: false, description: "Normal reference range" },
      { name: "flag", type: "select", required: false, description: "Abnormal flag", enum_values: ["normal", "high", "low", "critical_high", "critical_low"] },
    ]},
    { name: "diagnoses", type: "array", required: false, description: "ICD-10 diagnoses" },
    { name: "critical_values", type: "boolean", required: false, description: "Contains critical values requiring immediate notification" },
  ],
  imaging: [
    { name: "patient_name", type: "text", required: true, description: "Patient name on report" },
    { name: "patient_dob", type: "date", required: true, description: "Patient date of birth" },
    { name: "modality", type: "select", required: true, description: "Imaging modality", enum_values: ["X-Ray", "CT", "MRI", "Ultrasound", "PET", "Nuclear", "Mammography", "Fluoroscopy", "Other"] },
    { name: "body_region", type: "text", required: true, description: "Body part examined" },
    { name: "exam_date", type: "date", required: false, description: "Date of examination" },
    { name: "radiologist", type: "text", required: false, description: "Interpreting radiologist" },
    { name: "findings", type: "text", required: true, description: "Key findings from report" },
    { name: "impression", type: "text", required: true, description: "Radiologist impression/conclusion" },
    { name: "recommendations", type: "array", required: false, description: "Follow-up recommendations" },
    { name: "cpt_codes", type: "array", required: false, description: "CPT codes" },
  ],
  consult: [
    { name: "patient_name", type: "text", required: true, description: "Patient name" },
    { name: "patient_dob", type: "date", required: true, description: "Patient date of birth" },
    { name: "consulting_provider", type: "text", required: true, description: "Consultant physician name" },
    { name: "specialty", type: "text", required: true, description: "Consultant specialty" },
    { name: "referring_provider", type: "text", required: false, description: "Referring physician" },
    { name: "consult_date", type: "date", required: false, description: "Date of consultation" },
    { name: "chief_complaint", type: "text", required: false, description: "Reason for consult" },
    { name: "assessment", type: "text", required: true, description: "Assessment and diagnosis" },
    { name: "plan", type: "text", required: true, description: "Treatment plan" },
    { name: "medications", type: "array", required: false, description: "Prescribed medications" },
    { name: "follow_up", type: "text", required: false, description: "Follow-up instructions" },
  ],
  referral: [
    { name: "patient_name", type: "text", required: true, description: "Patient name" },
    { name: "patient_dob", type: "date", required: true, description: "Patient date of birth" },
    { name: "referring_provider", type: "text", required: true, description: "Referring physician" },
    { name: "referring_org", type: "text", required: false, description: "Referring organization" },
    { name: "specialty_requested", type: "text", required: true, description: "Specialty being referred to" },
    { name: "reason", type: "text", required: true, description: "Reason for referral" },
    { name: "urgency", type: "select", required: false, description: "Referral urgency", enum_values: ["routine", "urgent", "stat"] },
    { name: "diagnoses", type: "array", required: false, description: "Relevant diagnoses" },
    { name: "insurance_auth", type: "text", required: false, description: "Insurance authorization number" },
  ],
  prior_auth: [
    { name: "patient_name", type: "text", required: true, description: "Patient name" },
    { name: "member_id", type: "text", required: true, description: "Insurance member ID" },
    { name: "payer", type: "text", required: true, description: "Insurance payer name" },
    { name: "auth_number", type: "text", required: false, description: "Authorization number" },
    { name: "status", type: "select", required: true, description: "Authorization status", enum_values: ["approved", "denied", "pending", "partial"] },
    { name: "procedure_codes", type: "array", required: true, description: "CPT / HCPCS codes" },
    { name: "diagnoses", type: "array", required: false, description: "ICD-10 codes" },
    { name: "effective_date", type: "date", required: false, description: "Authorization effective date" },
    { name: "expiry_date", type: "date", required: false, description: "Authorization expiry date" },
  ],
  dme: [
    { name: "patient_name", type: "text", required: true, description: "Patient name" },
    { name: "patient_dob", type: "date", required: true, description: "Patient date of birth" },
    { name: "supplier", type: "text", required: false, description: "DME supplier" },
    { name: "equipment", type: "array", required: true, description: "Equipment items" },
    { name: "hcpcs_codes", type: "array", required: false, description: "HCPCS codes" },
    { name: "diagnoses", type: "array", required: false, description: "Supporting diagnoses" },
    { name: "ordering_provider", type: "text", required: false, description: "Ordering physician" },
  ],
  forms: [
    { name: "patient_name", type: "text", required: true, description: "Patient name" },
    { name: "form_type", type: "text", required: true, description: "Type of form" },
    { name: "document_date", type: "date", required: false, description: "Date on document" },
    { name: "source_org", type: "text", required: false, description: "Source organization" },
  ],
  records_request: [
    { name: "patient_name", type: "text", required: true, description: "Patient whose records are requested" },
    { name: "patient_dob", type: "date", required: true, description: "Patient date of birth" },
    { name: "requesting_provider", type: "text", required: true, description: "Requesting physician/entity" },
    { name: "requesting_org", type: "text", required: false, description: "Requesting organization" },
    { name: "records_from", type: "date", required: false, description: "Records date range start" },
    { name: "records_to", type: "date", required: false, description: "Records date range end" },
    { name: "purpose", type: "text", required: false, description: "Purpose of request" },
  ],
  eob: [
    { name: "patient_name", type: "text", required: true, description: "Patient / subscriber name" },
    { name: "member_id", type: "text", required: true, description: "Member ID" },
    { name: "payer", type: "text", required: true, description: "Insurance payer" },
    { name: "claim_number", type: "text", required: false, description: "Claim number" },
    { name: "service_date", type: "date", required: false, description: "Date of service" },
    { name: "billed_amount", type: "number", required: false, description: "Total billed amount" },
    { name: "allowed_amount", type: "number", required: false, description: "Allowed amount" },
    { name: "patient_responsibility", type: "number", required: false, description: "Patient responsibility" },
    { name: "procedure_codes", type: "array", required: false, description: "CPT codes on claim" },
  ],
  discharge: [
    { name: "patient_name", type: "text", required: true, description: "Patient name" },
    { name: "patient_dob", type: "date", required: true, description: "Patient date of birth" },
    { name: "facility", type: "text", required: true, description: "Discharging facility" },
    { name: "admit_date", type: "date", required: false, description: "Admission date" },
    { name: "discharge_date", type: "date", required: true, description: "Discharge date" },
    { name: "discharge_diagnoses", type: "array", required: true, description: "Discharge diagnoses" },
    { name: "discharge_medications", type: "array", required: false, description: "Discharge medications" },
    { name: "follow_up", type: "text", required: false, description: "Follow-up instructions" },
    { name: "attending_physician", type: "text", required: false, description: "Attending physician" },
  ],
  other: [
    { name: "patient_name", type: "text", required: false, description: "Patient name if present" },
    { name: "document_type", type: "text", required: false, description: "Detected document type" },
    { name: "source_org", type: "text", required: false, description: "Source organization" },
    { name: "document_date", type: "date", required: false, description: "Document date" },
    { name: "summary", type: "text", required: false, description: "Document summary" },
  ],
};

const FIELD_TYPES: SchemaField["type"][] = ["text", "date", "number", "boolean", "array", "select"];

const TYPE_COLORS: Record<string, string> = {
  text: "bg-[var(--cevi-teal-light)] text-[var(--cevi-teal)]",
  date: "bg-[var(--cevi-amber-light)] text-[var(--cevi-amber)]",
  number: "bg-[var(--cevi-jade-light)] text-[var(--cevi-jade)]",
  boolean: "bg-[var(--cevi-sand-light)] text-[var(--cevi-sand)]",
  array: "bg-[var(--cevi-accent-light)] text-[var(--cevi-accent)]",
  select: "bg-[var(--cevi-coral-light,#fde8e0)] text-[var(--cevi-coral,#F4845F)]",
  object: "bg-[var(--cevi-surface)] text-[var(--cevi-text-muted)]",
};

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
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const isDirty = JSON.stringify(fields) !== JSON.stringify(defaultFields);

  const addField = useCallback(() => {
    setFields((prev) => [
      ...prev,
      { name: `field_${prev.length + 1}`, type: "text", required: false, description: "" },
    ]);
    setExpandedIdx(fields.length);
  }, [fields.length]);

  const removeField = useCallback((idx: number) => {
    setFields((prev) => prev.filter((_, i) => i !== idx));
    setExpandedIdx(null);
  }, []);

  const updateField = useCallback((idx: number, partial: Partial<SchemaField>) => {
    setFields((prev) => prev.map((f, i) => i === idx ? { ...f, ...partial } : f));
  }, []);

  const resetSchema = useCallback(() => {
    setFields(JSON.parse(JSON.stringify(defaultFields)));
    setExpandedIdx(null);
    toast("Schema reset to default");
  }, [defaultFields, toast]);

  const saveSchema = useCallback(() => {
    toast("Schema saved");
    // In production, this would persist to category_config or an API
  }, [toast]);

  // Drag reorder
  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx);
  }, []);

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

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md h-full border-l border-[var(--cevi-border)] shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--cevi-border-light)] shrink-0">
          <div>
            <h2 className="text-[16px] font-serif font-semibold text-[var(--cevi-text)]">Schema Builder</h2>
            <div className="text-[11px] text-[var(--cevi-text-muted)] mt-0.5">
              {label} · {fields.length} fields · v1
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--cevi-surface-warm)] transition-colors">
            <X className="h-4 w-4 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
          </button>
        </div>

        {/* Field list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-1.5">
            {fields.map((field, idx) => {
              const isExpanded = expandedIdx === idx;
              return (
                <div
                  key={`${field.name}-${idx}`}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "rounded-lg border transition-all",
                    isExpanded
                      ? "border-[var(--cevi-accent)]/40 bg-white shadow-sm"
                      : "border-[var(--cevi-border)] bg-white hover:border-[var(--cevi-text-muted)]/30",
                    dragIdx === idx && "opacity-50",
                  )}
                >
                  {/* Field header row */}
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  >
                    <GripVertical className="h-3.5 w-3.5 text-[var(--cevi-text-muted)] cursor-grab shrink-0" strokeWidth={1.5} />
                    {isExpanded
                      ? <ChevronDown className="h-3.5 w-3.5 text-[var(--cevi-text-muted)] shrink-0" strokeWidth={1.5} />
                      : <ChevronRight className="h-3.5 w-3.5 text-[var(--cevi-text-muted)] shrink-0" strokeWidth={1.5} />
                    }
                    <span className="text-[13px] font-medium text-[var(--cevi-text)] flex-1 truncate font-mono">
                      {field.name}
                    </span>
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", TYPE_COLORS[field.type] ?? TYPE_COLORS.text)}>
                      {field.type}
                    </span>
                    {field.required && (
                      <span className="text-[10px] font-bold text-[var(--cevi-accent)]">*</span>
                    )}
                  </button>

                  {/* Expanded editor */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 space-y-3 border-t border-[var(--cevi-border-light)]">
                      <div className="pt-3">
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--cevi-text-tertiary)] mb-1">
                          Field name
                        </label>
                        <input
                          value={field.name}
                          onChange={(e) => updateField(idx, { name: e.target.value.replace(/[^a-z0-9_]/gi, "_").toLowerCase() })}
                          className="w-full h-8 px-2.5 rounded-md border border-[var(--cevi-border)] bg-white text-[13px] font-mono text-[var(--cevi-text)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--cevi-text-tertiary)] mb-1">
                            Type
                          </label>
                          <select
                            value={field.type}
                            onChange={(e) => updateField(idx, { type: e.target.value as SchemaField["type"] })}
                            className="w-full h-8 px-2.5 rounded-md border border-[var(--cevi-border)] bg-white text-[13px] text-[var(--cevi-text)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20"
                          >
                            {FIELD_TYPES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 cursor-pointer h-8">
                            <input
                              type="checkbox"
                              checked={field.required ?? false}
                              onChange={(e) => updateField(idx, { required: e.target.checked })}
                              className="h-4 w-4 rounded border-[var(--cevi-border)] text-[var(--cevi-accent)] focus:ring-[var(--cevi-accent)]/20"
                            />
                            <span className="text-[12px] text-[var(--cevi-text)]">Required</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--cevi-text-tertiary)] mb-1">
                          Description
                        </label>
                        <input
                          value={field.description ?? ""}
                          onChange={(e) => updateField(idx, { description: e.target.value })}
                          className="w-full h-8 px-2.5 rounded-md border border-[var(--cevi-border)] bg-white text-[12px] text-[var(--cevi-text)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20"
                          placeholder="What this field captures..."
                        />
                      </div>
                      {field.type === "select" && (
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--cevi-text-tertiary)] mb-1">
                            Options (comma-separated)
                          </label>
                          <input
                            value={(field.enum_values ?? []).join(", ")}
                            onChange={(e) => updateField(idx, { enum_values: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                            className="w-full h-8 px-2.5 rounded-md border border-[var(--cevi-border)] bg-white text-[12px] font-mono text-[var(--cevi-text)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20"
                            placeholder="option_1, option_2, ..."
                          />
                        </div>
                      )}
                      {/* Children preview for array/object */}
                      {field.children && field.children.length > 0 && (
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--cevi-text-tertiary)] mb-1">
                            Nested fields
                          </label>
                          <div className="rounded-md border border-[var(--cevi-border-light)] bg-[var(--cevi-surface-warm)] p-2 space-y-1">
                            {field.children.map((child, ci) => (
                              <div key={ci} className="flex items-center gap-2 text-[11px]">
                                <span className="font-mono text-[var(--cevi-text)]">{child.name}</span>
                                <span className={cn("text-[9px] font-semibold px-1 py-0.5 rounded", TYPE_COLORS[child.type] ?? TYPE_COLORS.text)}>
                                  {child.type}
                                </span>
                                {child.required && <span className="text-[var(--cevi-accent)] font-bold">*</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-end">
                        <button
                          onClick={() => removeField(idx)}
                          className="inline-flex items-center gap-1 text-[11px] text-[var(--cevi-accent)] hover:text-[var(--cevi-accent)]/80 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                          Remove field
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add field button */}
          <button
            onClick={addField}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 border-dashed border-[var(--cevi-border)] text-[12px] font-semibold text-[var(--cevi-text-muted)] hover:border-[var(--cevi-accent)] hover:text-[var(--cevi-accent)] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Add field
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--cevi-border-light)] shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />}
            onClick={resetSchema}
            disabled={!isDirty}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Save className="h-3.5 w-3.5" strokeWidth={1.5} />}
            onClick={saveSchema}
          >
            Save Schema
          </Button>
        </div>
      </div>
    </div>
  );
}
