"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Bell,
  Users,
  Lock,
  Building2,
  Sparkles,
  Database,
  Key,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react";

interface SettingSection {
  icon: React.ReactNode;
  title: string;
  description: string;
  items: { label: string; value: string; mono?: boolean }[];
}

const SECTIONS: SettingSection[] = [
  {
    icon: <Building2 className="h-4 w-4" strokeWidth={1.5} />,
    title: "Clinic Profile",
    description: "Organization and location details",
    items: [
      { label: "Organization", value: "Transcend Medical Group" },
      { label: "Location", value: "Arlington, TX" },
      { label: "Fax number", value: "817-860-2704", mono: true },
      { label: "EHR", value: "eClinicalWorks" },
      { label: "Time zone", value: "Central (CT)" },
    ],
  },
  {
    icon: <Users className="h-4 w-4" strokeWidth={1.5} />,
    title: "Team & Roles",
    description: "Manage who can access faxes and PHI",
    items: [
      { label: "Dr. Todd Nguyen", value: "Admin · Provider" },
      { label: "Sarah Chen", value: "Front Desk" },
      { label: "Maria Lopez", value: "Nurse" },
      { label: "James Wilson", value: "Billing" },
    ],
  },
  {
    icon: <Sparkles className="h-4 w-4" strokeWidth={1.5} />,
    title: "AI Classification",
    description: "Model selection and confidence thresholds",
    items: [
      { label: "Default model", value: "Claude Sonnet 4.6" },
      { label: "Type confidence threshold", value: "80%", mono: true },
      { label: "Patient match threshold", value: "95%", mono: true },
      { label: "Review threshold", value: "70%", mono: true },
      { label: "Auto-route above threshold", value: "Enabled" },
    ],
  },
  {
    icon: <Bell className="h-4 w-4" strokeWidth={1.5} />,
    title: "Notifications",
    description: "Alert routing for urgent and critical faxes",
    items: [
      { label: "STAT faxes", value: "SMS + eCW inbox → Dr. Nguyen" },
      { label: "Critical lab results", value: "SMS → On-call provider" },
      { label: "Failed matches", value: "Email → Front desk" },
      { label: "Daily digest", value: "Email → All staff, 7:00 AM CT" },
    ],
  },
  {
    icon: <Database className="h-4 w-4" strokeWidth={1.5} />,
    title: "Integrations",
    description: "Connected systems and data sources",
    items: [
      { label: "Supabase", value: "Connected", mono: true },
      { label: "Medsender (fax ingest)", value: "Active" },
      { label: "eClinicalWorks (write-back)", value: "Pending setup" },
      { label: "Twilio (SMS alerts)", value: "Configured" },
    ],
  },
  {
    icon: <Lock className="h-4 w-4" strokeWidth={1.5} />,
    title: "Compliance & Security",
    description: "HIPAA controls and audit configuration",
    items: [
      { label: "BAA status", value: "On file" },
      { label: "Audit logging", value: "Enabled · immutable" },
      { label: "PHI access logging", value: "Enabled" },
      { label: "Session timeout", value: "30 minutes" },
      { label: "Data retention", value: "7 years" },
    ],
  },
];

interface ApiKeyState {
  configured: boolean;
  source: "settings" | "env" | "none";
  masked: string | null;
}

export default function SettingsPage() {
  const [keyState, setKeyState] = useState<ApiKeyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchKeyState = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/settings");
      const data = await res.json();
      setKeyState(data.anthropic_api_key);
    } catch {
      setKeyState({ configured: false, source: "none", masked: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeyState();
  }, [fetchKeyState]);

  const handleSave = async () => {
    if (!inputValue.trim()) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/v1/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "anthropic_api_key", value: inputValue.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", message: data.error ?? "Failed to save" });
        return;
      }
      setFeedback({ type: "success", message: "API key saved" });
      setInputValue("");
      setShowInput(false);
      fetchKeyState();
    } catch {
      setFeedback({ type: "error", message: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/v1/settings?key=anthropic_api_key", { method: "DELETE" });
      const data = await res.json();
      if (data.fallback) {
        setFeedback({ type: "success", message: "Runtime key removed. Falling back to .env" });
      } else {
        setFeedback({ type: "success", message: "API key removed" });
      }
      fetchKeyState();
    } catch {
      setFeedback({ type: "error", message: "Network error" });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-[24px] leading-[1.2] tracking-[-0.02em] text-[var(--cevi-text)]">
          Settings
        </h1>
        <p className="mt-1 text-[13px] text-[var(--cevi-text-muted)]">
          Clinic configuration, team management, and compliance controls
        </p>
      </div>

      <div className="space-y-4">
        {/* ── API Key Section ── */}
        <div className="rounded-lg border border-[var(--cevi-border)] bg-white overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 bg-[var(--cevi-surface-warm)] border-b border-[var(--cevi-border-light)]">
            <div className="h-8 w-8 rounded-lg bg-white border border-[var(--cevi-border)] flex items-center justify-center text-[var(--cevi-accent)]">
              <Key className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[var(--cevi-text)]">API Key</div>
              <div className="text-[11px] text-[var(--cevi-text-muted)]">
                Anthropic API key for Claude classification and extraction
              </div>
            </div>
          </div>

          <div className="px-4 py-3 space-y-3">
            {/* Status row */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[var(--cevi-text-secondary)]">Status</span>
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--cevi-text-muted)]" />
              ) : keyState?.configured ? (
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--cevi-jade)]">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--cevi-jade)]" />
                  Configured
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--cevi-coral)]">
                  <AlertCircle className="h-3 w-3" />
                  Not configured
                </span>
              )}
            </div>

            {/* Source row */}
            {keyState?.configured && (
              <div className="flex items-center justify-between border-t border-[var(--cevi-border-light)] pt-3">
                <span className="text-[12px] text-[var(--cevi-text-secondary)]">Source</span>
                <span className="text-[12px] font-mono text-[var(--cevi-text)]">
                  {keyState.source === "settings" ? "Settings (runtime)" : ".env file"}
                </span>
              </div>
            )}

            {/* Masked key row */}
            {keyState?.masked && (
              <div className="flex items-center justify-between border-t border-[var(--cevi-border-light)] pt-3">
                <span className="text-[12px] text-[var(--cevi-text-secondary)]">Key</span>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-mono text-[var(--cevi-text)]">
                    {showKey ? keyState.masked : keyState.masked.replace(/[^*-]/g, (c, i) => i < 7 ? c : "*")}
                  </span>
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)] transition-colors"
                  >
                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Feedback message */}
            {feedback && (
              <div
                className={`flex items-center gap-1.5 text-[12px] px-3 py-2 rounded-md ${
                  feedback.type === "success"
                    ? "bg-[#f0faf5] text-[var(--cevi-jade)]"
                    : "bg-[#fef2f2] text-[#dc2626]"
                }`}
              >
                {feedback.type === "success" ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {feedback.message}
              </div>
            )}

            {/* Input for new key */}
            {showInput && (
              <div className="border-t border-[var(--cevi-border-light)] pt-3 space-y-2">
                <label className="text-[11px] font-medium text-[var(--cevi-text-secondary)] uppercase tracking-wider">
                  {keyState?.configured ? "Replace API Key" : "Enter API Key"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="sk-ant-api03-..."
                    className="flex-1 text-[12px] font-mono px-3 py-2 rounded-md border border-[var(--cevi-border)] bg-white text-[var(--cevi-text)] placeholder:text-[var(--cevi-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cevi-accent)]/30 focus:border-[var(--cevi-accent)]"
                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving || !inputValue.trim()}
                    className="px-3 py-2 text-[12px] font-medium rounded-md bg-[var(--cevi-accent)] text-white hover:bg-[var(--cevi-accent)]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Save
                  </button>
                  <button
                    onClick={() => { setShowInput(false); setInputValue(""); setFeedback(null); }}
                    className="px-2 py-2 text-[12px] rounded-md border border-[var(--cevi-border)] text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)] hover:bg-[var(--cevi-surface-warm)] transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-[var(--cevi-text-muted)]">
                  Key is stored locally in SQLite. In production, use the <code className="font-mono text-[10px] bg-[var(--cevi-surface-warm)] px-1 rounded">ANTHROPIC_API_KEY</code> environment variable instead.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 border-t border-[var(--cevi-border-light)] pt-3">
              {!showInput && (
                <button
                  onClick={() => { setShowInput(true); setFeedback(null); }}
                  className="px-3 py-1.5 text-[12px] font-medium rounded-md border border-[var(--cevi-border)] text-[var(--cevi-text)] hover:bg-[var(--cevi-surface-warm)] transition-colors flex items-center gap-1.5"
                >
                  <Key className="h-3.5 w-3.5" />
                  {keyState?.configured ? "Change Key" : "Add Key"}
                </button>
              )}

              {keyState?.source === "settings" && !showInput && (
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  className="px-3 py-1.5 text-[12px] font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                >
                  {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Remove
                </button>
              )}

              {keyState?.source === "env" && !showInput && (
                <span className="text-[11px] text-[var(--cevi-text-muted)] italic">
                  Set via .env — remove from .env to use Settings key
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Static Sections ── */}
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            className="rounded-lg border border-[var(--cevi-border)] bg-white overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-[var(--cevi-surface-warm)] border-b border-[var(--cevi-border-light)]">
              <div className="h-8 w-8 rounded-lg bg-white border border-[var(--cevi-border)] flex items-center justify-center text-[var(--cevi-accent)]">
                {section.icon}
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[var(--cevi-text)]">{section.title}</div>
                <div className="text-[11px] text-[var(--cevi-text-muted)]">{section.description}</div>
              </div>
            </div>

            <div>
              {section.items.map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between px-4 py-2.5 ${
                    i < section.items.length - 1 ? "border-b border-[var(--cevi-border-light)]" : ""
                  }`}
                >
                  <span className="text-[12px] text-[var(--cevi-text-secondary)]">{item.label}</span>
                  <span
                    className={`text-[12px] text-[var(--cevi-text)] ${item.mono ? "font-mono" : "font-medium"}`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between text-[11px] text-[var(--cevi-text-muted)]">
        <span>Cevi v1.0 · Transcend Medical Group</span>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--cevi-jade)]" />
          <span>All systems operational</span>
        </div>
      </div>
    </div>
  );
}
