"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Upload, Download, Menu } from "lucide-react";
import { cn } from "@/shared/utils";
import { useSidebar } from "./sidebar-context";
import { useIsDesktop } from "@/frontend/hooks/use-media-query";

/* ─── Account Dropdown (logout only) ─── */
function AccountDropdown({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 mt-1 w-40 bg-white border border-[var(--cevi-border)] rounded-lg shadow-[var(--shadow-md)] z-50 overflow-hidden"
    >
      <div className="py-1">
        <button
          onClick={onClose}
          className="w-full flex items-center gap-2.5 px-3 h-9 text-[13px] text-[var(--cevi-accent)] hover:bg-[var(--cevi-surface)] transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
          Log out
        </button>
      </div>
    </div>
  );
}

/* ─── Upload Modal ─── */
function UploadModal({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));
    try {
      const res = await fetch("/api/v1/fax", { method: "POST", body: formData });
      if (res.ok) {
        onClose();
        window.location.reload();
      }
    } catch {
      // handled silently
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        ref={ref}
        className="bg-white rounded-xl border border-[var(--cevi-border)] shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[18px] font-semibold text-[var(--cevi-text)] mb-4">Upload Faxes</h2>
        <div
          className="border-2 border-dashed border-[var(--cevi-border)] rounded-lg p-8 text-center cursor-pointer hover:border-[var(--cevi-text-muted)] transition-colors"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files); }}
        >
          <Upload className="h-8 w-8 text-[var(--cevi-text-muted)] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-[14px] text-[var(--cevi-text-secondary)] mb-1">
            Drop files here or click to browse
          </p>
          <p className="text-[12px] text-[var(--cevi-text-muted)]">
            PDF, TIFF, PNG, JPG — up to 25 MB
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.tiff,.tif,.png,.jpg,.jpeg"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Topbar ─── */
export function Topbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchHover, setSearchHover] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [name, setName] = useState("Theo Sakellos");
  const { openMobile } = useSidebar();
  const isDesktop = useIsDesktop();

  // Read profile from localStorage and listen for changes
  useEffect(() => {
    const read = () => {
      try {
        const raw = localStorage.getItem("cevi_settings");
        if (!raw) return;
        const s = JSON.parse(raw);
        if (s.profilePicUrl !== undefined) setProfilePicUrl(s.profilePicUrl ?? null);
        if (s.name) setName(s.name);
      } catch {}
    };
    read();
    window.addEventListener("storage", read);
    window.addEventListener("cevi:settings-updated", read);
    return () => {
      window.removeEventListener("storage", read);
      window.removeEventListener("cevi:settings-updated", read);
    };
  }, []);

  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "T";

  const handleExport = async () => {
    try {
      const res = await fetch("/api/v1/export");
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cevi-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // handled silently
    }
  };

  return (
    <>
      <header className="h-12 bg-[var(--cevi-surface-warm)] sticky top-0 z-10">
        <div className="h-full flex items-center gap-3 px-4 sm:px-6">
          {/* Mobile hamburger */}
          {!isDesktop && (
            <button
              onClick={openMobile}
              className="p-1.5 -ml-1 rounded-lg hover:bg-[var(--cevi-surface)] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-[var(--cevi-text)]" strokeWidth={1.5} />
            </button>
          )}

          {/* Search bar */}
          <label
            className={cn(
              "flex-1 h-full flex items-center cursor-text rounded-md transition-colors px-2",
              searchHover ? "bg-[var(--cevi-surface)]" : "bg-transparent",
            )}
            onMouseEnter={() => setSearchHover(true)}
            onMouseLeave={() => setSearchHover(false)}
          >
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="search-clean w-full h-full bg-transparent text-[22px] font-medium text-[var(--cevi-text)] placeholder:text-[var(--cevi-text-faint)] outline-none border-none"
            />
          </label>

          {/* Upload button */}
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--cevi-bg)] border border-[var(--cevi-border)] rounded-[10px] text-[var(--cevi-text)] text-[13px] font-medium hover:bg-[var(--cevi-surface)] transition-colors shrink-0"
          >
            <Upload className="h-4 w-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Upload</span>
          </button>

          {/* Export button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--cevi-bg)] border border-[var(--cevi-border)] rounded-[10px] text-[var(--cevi-text)] text-[13px] font-medium hover:bg-[var(--cevi-surface)] transition-colors shrink-0"
          >
            <Download className="h-4 w-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Account circle */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="h-8 w-8 rounded-full overflow-hidden inline-flex items-center justify-center shrink-0 transition-all hover:opacity-90"
              aria-label="Account menu"
            >
              {profilePicUrl ? (
                <img src={profilePicUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="h-full w-full inline-flex items-center justify-center bg-[#3987CB] text-white font-semibold text-[13px]">
                  {initials}
                </span>
              )}
            </button>
            {menuOpen && <AccountDropdown onClose={() => setMenuOpen(false)} />}
          </div>
        </div>
      </header>

      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} />}
    </>
  );
}
