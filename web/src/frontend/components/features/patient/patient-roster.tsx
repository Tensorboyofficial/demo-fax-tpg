"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Search,
  UploadCloud,
  Plus,
  X,
  Download,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { useToast } from "@/frontend/components/ui/toast";
import { formatDob, calcAge, cn } from "@/shared/utils";
import type { Patient } from "@/shared/types";

/* ─── Column definitions ─── */
interface ColDef {
  key: string;
  header: string;
  width: string;
  getValue: (p: Patient) => string;
}

const COLUMNS: ColDef[] = [
  { key: "mrn", header: "eCW Account", width: "w-28", getValue: (p) => p.mrn },
  { key: "lastName", header: "Last Name", width: "w-32", getValue: (p) => p.lastName },
  { key: "firstName", header: "First Name", width: "w-32", getValue: (p) => p.firstName },
  { key: "dob", header: "DOB", width: "w-28", getValue: (p) => formatDob(p.dob) },
  { key: "age", header: "Age", width: "w-16", getValue: (p) => `${calcAge(p.dob)}` },
  { key: "sex", header: "Sex", width: "w-14", getValue: (p) => p.sex },
  { key: "clinic", header: "Clinic", width: "w-28", getValue: (p) => p.clinic },
  { key: "phone", header: "Phone", width: "w-32", getValue: (p) => p.phone ?? "—" },
  { key: "insurance", header: "Insurance", width: "min-w-[160px]", getValue: (p) => p.insurance ?? "—" },
];

/* ─── CSV Parser ─── */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
    return row;
  });
}

function csvRowToPatient(row: Record<string, string>, index: number): Patient | null {
  const lastName = row["last_name"] || row["lastname"] || row["last name"] || "";
  const firstName = row["first_name"] || row["firstname"] || row["first name"] || "";
  const mrn = row["mrn"] || row["ecw_account_number"] || row["account"] || row["ecw account"] || "";
  const dob = row["dob"] || row["date_of_birth"] || row["dateofbirth"] || row["date of birth"] || "";
  const sex = (row["sex"] || row["gender"] || "U").toUpperCase().charAt(0);
  const clinic = row["clinic"] || row["location"] || "";
  const phone = row["phone"] || row["telephone"] || "";
  const insurance = row["insurance"] || row["payer"] || "";

  if (!lastName && !firstName) return null;

  return {
    id: `CSV-${Date.now()}-${index}`,
    mrn: mrn || `MRN-AUTO-${index}`,
    firstName,
    lastName,
    dob: dob || "1900-01-01",
    sex: (sex === "M" || sex === "F" || sex === "X" ? sex : "X") as "M" | "F" | "X",
    primaryProviderId: "",
    clinic,
    phone: phone || undefined,
    insurance: insurance || undefined,
  };
}

/* ─── CSV Upload Modal ─── */
function CsvUploadModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (patients: Patient[]) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setError(null);
    if (!f.name.endsWith(".csv")) {
      setError("Only .csv files are accepted");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File too large (max 10 MB)");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCsv(text);
      const parsed = rows.map((r, i) => csvRowToPatient(r, i)).filter(Boolean) as Patient[];
      if (parsed.length === 0) {
        setError("No valid patient rows found. Expected columns: first_name, last_name, mrn, dob, sex");
        return;
      }
      setPreview(parsed);
    };
    reader.readAsText(f);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-xl border border-[var(--cevi-border)] shadow-xl w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--cevi-border-light)]">
          <h2 className="text-[16px] font-serif font-semibold text-[var(--cevi-text)]">Upload Patient CSV</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--cevi-surface-warm)] transition-colors">
            <X className="h-4 w-4 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-5">
          {!file ? (
            /* Dropzone */
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                dragOver
                  ? "border-[var(--cevi-accent)] bg-[var(--cevi-accent-light)]"
                  : "border-[var(--cevi-border)] hover:border-[var(--cevi-text-muted)]",
              )}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              onClick={() => fileRef.current?.click()}
            >
              <UploadCloud className="h-8 w-8 mx-auto text-[var(--cevi-text-muted)] mb-3" strokeWidth={1.5} />
              <div className="text-[13px] text-[var(--cevi-text)]">
                Drop a CSV file here or <span className="text-[var(--cevi-accent)] font-semibold">browse</span>
              </div>
              <div className="text-[11px] text-[var(--cevi-text-muted)] mt-1">
                Expected columns: first_name, last_name, mrn, dob, sex, clinic, phone, insurance
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
          ) : preview.length > 0 ? (
            /* Preview */
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-[var(--cevi-jade)]" strokeWidth={1.5} />
                <span className="text-[13px] text-[var(--cevi-text)]">
                  <span className="font-semibold">{preview.length}</span> patients parsed from <span className="font-mono text-[12px]">{file.name}</span>
                </span>
              </div>
              <div className="rounded-lg border border-[var(--cevi-border)] overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[var(--cevi-surface-warm)] text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)]">
                      <th className="px-3 py-1.5">Name</th>
                      <th className="px-3 py-1.5">MRN</th>
                      <th className="px-3 py-1.5">DOB</th>
                      <th className="px-3 py-1.5">Sex</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((p) => (
                      <tr key={p.id} className="border-t border-[var(--cevi-border-light)] text-[12px]">
                        <td className="px-3 py-1.5 text-[var(--cevi-text)]">{p.firstName} {p.lastName}</td>
                        <td className="px-3 py-1.5 font-mono text-[var(--cevi-text-muted)]">{p.mrn}</td>
                        <td className="px-3 py-1.5 tabular-nums text-[var(--cevi-text-secondary)]">{formatDob(p.dob)}</td>
                        <td className="px-3 py-1.5 text-[var(--cevi-text-secondary)]">{p.sex}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <div className="px-3 py-1.5 text-[11px] text-[var(--cevi-text-muted)] bg-[var(--cevi-surface-warm)] border-t border-[var(--cevi-border-light)]">
                    + {preview.length - 10} more patients
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {error && (
            <div className="mt-3 flex items-center gap-2 text-[12px] text-[var(--cevi-accent)]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--cevi-border-light)]">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          {file && preview.length > 0 ? (
            <Button
              variant="primary"
              size="sm"
              icon={<Download className="h-3.5 w-3.5" strokeWidth={1.5} />}
              onClick={() => { onImport(preview); onClose(); }}
            >
              Import {preview.length} patients
            </Button>
          ) : (
            <Button variant="primary" size="sm" disabled>Import</Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Add Patient Drawer ─── */
function AddPatientDrawer({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (p: Patient) => void;
}) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", mrn: "", dob: "", sex: "U", clinic: "", phone: "", insurance: "",
  });

  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const canSave = form.firstName.trim() && form.lastName.trim();

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md h-full border-l border-[var(--cevi-border)] shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--cevi-border-light)] shrink-0">
          <h2 className="text-[16px] font-serif font-semibold text-[var(--cevi-text)]">Add Patient</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--cevi-surface-warm)] transition-colors">
            <X className="h-4 w-4 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name *" value={form.firstName} onChange={(v) => set("firstName", v)} />
            <Field label="Last name *" value={form.lastName} onChange={(v) => set("lastName", v)} />
          </div>
          <Field label="eCW Account / MRN" value={form.mrn} onChange={(v) => set("mrn", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date of birth" value={form.dob} onChange={(v) => set("dob", v)} type="date" />
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--cevi-text-tertiary)] mb-1">Sex</label>
              <select
                value={form.sex}
                onChange={(e) => set("sex", e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-[var(--cevi-border)] bg-white text-[13px] text-[var(--cevi-text)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20"
              >
                <option value="U">—</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="X">Other</option>
              </select>
            </div>
          </div>
          <Field label="Clinic" value={form.clinic} onChange={(v) => set("clinic", v)} />
          <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} />
          <Field label="Insurance" value={form.insurance} onChange={(v) => set("insurance", v)} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--cevi-border-light)] shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!canSave}
            onClick={() => {
              const p: Patient = {
                id: `PT-NEW-${Date.now()}`,
                mrn: form.mrn || `MRN-AUTO-${Date.now()}`,
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                dob: form.dob || "1900-01-01",
                sex: (form.sex === "M" || form.sex === "F" || form.sex === "X" ? form.sex : "X") as "M" | "F" | "X",
                primaryProviderId: "",
                clinic: form.clinic,
                phone: form.phone || undefined,
                insurance: form.insurance || undefined,
              };
              onAdd(p);
              onClose();
            }}
          >
            Add Patient
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--cevi-text-tertiary)] mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-md border border-[var(--cevi-border)] bg-white text-[13px] text-[var(--cevi-text)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20"
      />
    </div>
  );
}

/* ─── Main Component ─── */
interface Props {
  seedPatients: Patient[];
}

export function PatientRoster({ seedPatients }: Props) {
  const { toast } = useToast();
  const [allPatients, setAllPatients] = useState<Patient[]>(seedPatients);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState("lastName");
  const [sortAsc, setSortAsc] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // Spreadsheet state
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const tableRef = useRef<HTMLTableElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = allPatients;
    if (q) {
      list = list.filter(
        (p) =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q) ||
          (p.phone ?? "").includes(q) ||
          (p.insurance ?? "").toLowerCase().includes(q),
      );
    }
    const col = COLUMNS.find((c) => c.key === sortCol);
    if (col) {
      list = [...list].sort((a, b) => {
        const va = col.getValue(a).toLowerCase();
        const vb = col.getValue(b).toLowerCase();
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return list;
  }, [allPatients, search, sortCol, sortAsc]);

  const handleSort = useCallback((key: string) => {
    if (sortCol === key) setSortAsc(!sortAsc);
    else { setSortCol(key); setSortAsc(true); }
  }, [sortCol, sortAsc]);

  const copyCell = useCallback((row: number, col: number) => {
    const p = filtered[row];
    if (!p) return;
    const value = COLUMNS[col].getValue(p);
    if (value === "—") return;
    navigator.clipboard.writeText(value);
    toast("Copied");
    setActiveCell({ row, col });
  }, [filtered, toast]);

  const startEdit = useCallback((row: number, col: number) => {
    const p = filtered[row];
    if (!p) return;
    setEditValue(COLUMNS[col].getValue(p));
    setEditingCell({ row, col });
    setActiveCell({ row, col });
  }, [filtered]);

  const saveEdit = useCallback(() => {
    if (editingCell) {
      const p = filtered[editingCell.row];
      const col = COLUMNS[editingCell.col];
      if (p && col && editValue.trim()) {
        setAllPatients((prev) =>
          prev.map((pat) => {
            if (pat.id !== p.id) return pat;
            const updated = { ...pat };
            if (col.key === "firstName") updated.firstName = editValue.trim();
            else if (col.key === "lastName") updated.lastName = editValue.trim();
            else if (col.key === "mrn") updated.mrn = editValue.trim();
            else if (col.key === "dob") updated.dob = editValue.trim();
            else if (col.key === "sex") updated.sex = editValue.trim() as "M" | "F" | "X";
            else if (col.key === "clinic") updated.clinic = editValue.trim();
            else if (col.key === "phone") updated.phone = editValue.trim() || undefined;
            else if (col.key === "insurance") updated.insurance = editValue.trim() || undefined;
            return updated;
          }),
        );
        toast("Updated");
      }
    }
    setEditingCell(null);
  }, [editingCell, editValue, filtered, toast]);
  const cancelEdit = useCallback(() => { setEditingCell(null); }, []);

  const handleCellClick = useCallback((row: number, col: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.detail === 2) startEdit(row, col);
    else copyCell(row, col);
  }, [copyCell, startEdit]);

  const handleImport = useCallback((imported: Patient[]) => {
    setAllPatients((prev) => [...prev, ...imported]);
    toast(`Imported ${imported.length} patients`);
  }, [toast]);

  const handleAddPatient = useCallback((p: Patient) => {
    setAllPatients((prev) => [...prev, p]);
    toast("Patient added");
  }, [toast]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (editingCell) {
        if (e.key === "Escape") { cancelEdit(); e.preventDefault(); }
        if (e.key === "Enter") { saveEdit(); e.preventDefault(); }
        return;
      }
      if (!activeCell) return;
      const { row, col } = activeCell;

      if (e.key === "ArrowDown") { setActiveCell({ row: Math.min(row + 1, filtered.length - 1), col }); e.preventDefault(); }
      else if (e.key === "ArrowUp") { setActiveCell({ row: Math.max(row - 1, 0), col }); e.preventDefault(); }
      else if (e.key === "ArrowRight" || (e.key === "Tab" && !e.shiftKey)) { setActiveCell({ row, col: Math.min(col + 1, COLUMNS.length - 1) }); e.preventDefault(); }
      else if (e.key === "ArrowLeft" || (e.key === "Tab" && e.shiftKey)) { setActiveCell({ row, col: Math.max(col - 1, 0) }); e.preventDefault(); }
      else if (e.key === "Enter") { copyCell(row, col); setActiveCell({ row: Math.min(row + 1, filtered.length - 1), col }); e.preventDefault(); }
      else if (e.key === "Escape") { setActiveCell(null); e.preventDefault(); }
      else if (e.key === "c" && (e.metaKey || e.ctrlKey)) { copyCell(row, col); e.preventDefault(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeCell, editingCell, filtered, copyCell, saveEdit, cancelEdit]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-[20px] sm:text-[24px] leading-[1.2] tracking-[-0.02em] text-[var(--cevi-text)]">
            Patient Roster
          </h1>
          <span className="text-[12px] text-[var(--cevi-text-muted)]">
            {allPatients.length} patients
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 pr-3 rounded-md border border-[var(--cevi-border)] bg-white text-[13px] text-[var(--cevi-text)] placeholder:text-[var(--cevi-text-muted)] focus:outline-none focus:border-[var(--cevi-text)] focus:ring-2 focus:ring-[var(--cevi-accent)]/20 w-full sm:w-52"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<UploadCloud className="h-3.5 w-3.5" strokeWidth={1.5} />}
            onClick={() => setShowUpload(true)}
          >
            <span className="hidden sm:inline">Upload CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-3.5 w-3.5" strokeWidth={1.5} />}
            onClick={() => setShowAdd(true)}
          >
            <span className="hidden sm:inline">Add Patient</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-[var(--cevi-border)] bg-white py-16 text-center">
          <div className="text-[13px] text-[var(--cevi-text-muted)]">
            {search ? "No patients match your search" : "No patients in roster"}
          </div>
          {!search && (
            <Button
              variant="primary"
              size="sm"
              className="mt-3"
              icon={<UploadCloud className="h-3.5 w-3.5" strokeWidth={1.5} />}
              onClick={() => setShowUpload(true)}
            >
              Upload CSV
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--cevi-border)]">
          <table ref={tableRef} className="w-full text-left" role="grid">
            <thead>
              <tr className="bg-[var(--cevi-surface-warm)] border-b border-[var(--cevi-border)]">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-tertiary)] cursor-pointer hover:text-[var(--cevi-text)] transition-colors select-none",
                      col.width,
                    )}
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {sortCol === col.key && (
                        <span className="text-[var(--cevi-accent)]">{sortAsc ? "↑" : "↓"}</span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((patient, ri) => (
                <tr
                  key={patient.id}
                  className="border-b border-[var(--cevi-border-light)] last:border-b-0 hover:bg-[var(--cevi-surface-warm)] transition-colors"
                >
                  {COLUMNS.map((col, ci) => {
                    const isActive = activeCell?.row === ri && activeCell?.col === ci;
                    const isEditing = editingCell?.row === ri && editingCell?.col === ci;
                    const val = col.getValue(patient);
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          "px-3 py-2 border-r border-[var(--cevi-border-light)] last:border-r-0 cursor-pointer select-none transition-colors",
                          isActive && !isEditing && "bg-[var(--cevi-surface)]",
                        )}
                        onClick={(e) => handleCellClick(ri, ci, e)}
                      >
                        {isEditing ? (
                          <input
                            autoFocus
                            type={col.key === "dob" ? "date" : "text"}
                            value={col.key === "dob" ? editValue.replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$1-$2") : editValue}
                            onChange={(e) => setEditValue(col.key === "dob" ? e.target.value.replace(/(\d{4})-(\d{2})-(\d{2})/, "$2/$3/$1") : e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") cancelEdit();
                            }}
                            className="w-full h-7 px-1 -mx-1 bg-transparent text-[13px] text-[var(--cevi-text)] border-b border-[var(--cevi-text)] focus:outline-none"
                          />
                        ) : (
                          <span
                            className={cn(
                              "text-[12px] block truncate",
                              col.key === "mrn" ? "font-mono text-[var(--cevi-text-muted)]" :
                              col.key === "lastName" ? "font-medium text-[var(--cevi-text)]" :
                              col.key === "dob" || col.key === "age" ? "tabular-nums text-[var(--cevi-text-secondary)]" :
                              val === "—" ? "text-[var(--cevi-text-muted)]" :
                              "text-[var(--cevi-text)]",
                            )}
                          >
                            {val}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--cevi-text-muted)]">
        <div className="hidden sm:flex items-center gap-3">
          <span><kbd className="px-1 py-0.5 rounded bg-[var(--cevi-surface)] border border-[var(--cevi-border)] text-[9px]">Click</kbd> copy</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[var(--cevi-surface)] border border-[var(--cevi-border)] text-[9px]">Double-click</kbd> edit</span>
          <span><kbd className="px-1 py-0.5 rounded bg-[var(--cevi-surface)] border border-[var(--cevi-border)] text-[9px]">↑↓←→</kbd> navigate</span>
          <span>Click header to sort</span>
        </div>
        <span>{filtered.length} of {allPatients.length} patients</span>
      </div>

      {/* Modals */}
      {showUpload && <CsvUploadModal onClose={() => setShowUpload(false)} onImport={handleImport} />}
      {showAdd && <AddPatientDrawer onClose={() => setShowAdd(false)} onAdd={handleAddPatient} />}
    </div>
  );
}
