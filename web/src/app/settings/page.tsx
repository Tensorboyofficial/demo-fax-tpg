"use client";

import { useState, useRef, useEffect } from "react";
import { X, Check, AlertTriangle } from "lucide-react";
import { useToast } from "@/frontend/components/ui/toast";
import { cn } from "@/shared/utils";

type Tab = "account" | "users";

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("account");

  // Account state — persisted to localStorage
  const [email, setEmail] = useState("theo@cevi.ai");
  const [name, setName] = useState("Theo Sakellos");
  const [theme, setTheme] = useState("light");
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);

  // Inline editing
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  // Security
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);

  // Cookie toggles
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [functionalEnabled, setFunctionalEnabled] = useState(true);

  // Confirm modals
  const [confirmAction, setConfirmAction] = useState<"delete_account" | "delete_org" | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("cevi_settings");
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.email) setEmail(s.email);
        if (s.name) setName(s.name);
        if (s.theme) setTheme(s.theme);
        if (s.twoFaEnabled != null) setTwoFaEnabled(s.twoFaEnabled);
        if (s.passwordSet != null) setPasswordSet(s.passwordSet);
        if (s.analyticsEnabled != null) setAnalyticsEnabled(s.analyticsEnabled);
        if (s.functionalEnabled != null) setFunctionalEnabled(s.functionalEnabled);
        if (s.profilePicUrl) setProfilePicUrl(s.profilePicUrl);
      } catch {}
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("cevi_settings", JSON.stringify({
      email, name, theme, twoFaEnabled, passwordSet, analyticsEnabled, functionalEnabled, profilePicUrl,
    }));
  }, [email, name, theme, twoFaEnabled, passwordSet, analyticsEnabled, functionalEnabled, profilePicUrl]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  function startEdit(field: string, currentValue: string) {
    setEditingField(field);
    setEditValue(currentValue);
    setTimeout(() => editRef.current?.focus(), 0);
  }

  function commitEdit(field: string) {
    const val = editValue.trim();
    if (!val) { setEditingField(null); return; }
    if (field === "email") { setEmail(val); toast("Email updated"); }
    if (field === "name") { setName(val); toast("Name updated"); }
    if (field === "password") { setPasswordSet(true); toast("Password set"); }
    setEditingField(null);
    setEditValue("");
  }

  return (
    <div className="max-w-2xl">
      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-[var(--cevi-border-light)] mb-6">
        {(["account", "users"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-3 text-[14px] font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab
                ? "text-[var(--cevi-text)] border-b-[var(--cevi-text)]"
                : "text-[var(--cevi-text-muted)] border-b-transparent hover:text-[var(--cevi-text-secondary)]",
            )}
          >
            {tab === "account" ? "Account" : "Users"}
          </button>
        ))}
      </div>

      {activeTab === "account" && (
        <div className="space-y-8">
          {/* Account Settings */}
          <section>
            <h2 className="text-[16px] font-semibold text-[var(--cevi-text)] mb-4">Account Settings</h2>
            <div className="space-y-0 divide-y divide-[var(--cevi-border-light)]">
              {/* Email */}
              <div className="flex items-center justify-between py-4">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-[var(--cevi-text)]">Email</div>
                  {editingField === "email" ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        ref={editRef}
                        type="email"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") commitEdit("email"); if (e.key === "Escape") setEditingField(null); }}
                        className="flex-1 text-[13px] px-2.5 py-1.5 rounded-md border border-[var(--cevi-border)] bg-white text-[var(--cevi-text)] outline-none focus:ring-2 focus:ring-[var(--cevi-accent)]/20 focus:border-[var(--cevi-accent)]"
                      />
                      <button onClick={() => commitEdit("email")} className="p-1 rounded-md hover:bg-[var(--cevi-surface)] text-[var(--cevi-jade)]"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingField(null)} className="p-1 rounded-md hover:bg-[var(--cevi-surface)] text-[var(--cevi-text-muted)]"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <div className="text-[12px] text-[var(--cevi-text-muted)] mt-0.5">{email}</div>
                  )}
                </div>
                {editingField !== "email" && (
                  <button onClick={() => startEdit("email", email)} className="px-4 py-1.5 text-[13px] font-medium rounded-md border border-[var(--cevi-border)] text-[var(--cevi-text)] hover:bg-[var(--cevi-surface)] transition-colors shrink-0">
                    Change Email
                  </button>
                )}
              </div>

              {/* Name */}
              <div className="flex items-center justify-between py-4">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-[var(--cevi-text)]">Name</div>
                  {editingField === "name" ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        ref={editRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") commitEdit("name"); if (e.key === "Escape") setEditingField(null); }}
                        className="flex-1 text-[13px] px-2.5 py-1.5 rounded-md border border-[var(--cevi-border)] bg-white text-[var(--cevi-text)] outline-none focus:ring-2 focus:ring-[var(--cevi-accent)]/20 focus:border-[var(--cevi-accent)]"
                      />
                      <button onClick={() => commitEdit("name")} className="p-1 rounded-md hover:bg-[var(--cevi-surface)] text-[var(--cevi-jade)]"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingField(null)} className="p-1 rounded-md hover:bg-[var(--cevi-surface)] text-[var(--cevi-text-muted)]"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <div className="text-[12px] text-[var(--cevi-text-muted)] mt-0.5">{name}</div>
                  )}
                </div>
                {editingField !== "name" && (
                  <button onClick={() => startEdit("name", name)} className="px-4 py-1.5 text-[13px] font-medium rounded-md border border-[var(--cevi-border)] text-[var(--cevi-text)] hover:bg-[var(--cevi-surface)] transition-colors shrink-0">
                    Edit Name
                  </button>
                )}
              </div>

              {/* Profile Picture */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  {profilePicUrl ? (
                    <img src={profilePicUrl} alt="Profile" className="h-10 w-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-[#3987CB] text-white font-semibold text-[16px] inline-flex items-center justify-center shrink-0">
                      {name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                  )}
                  <div className="text-[14px] font-medium text-[var(--cevi-text)]">Profile Picture</div>
                </div>
                <div className="flex items-center gap-2">
                  {profilePicUrl && (
                    <button
                      onClick={() => { setProfilePicUrl(null); toast("Profile picture removed"); }}
                      className="px-3 py-1.5 text-[13px] font-medium rounded-md text-[var(--cevi-text-muted)] hover:text-[var(--cevi-accent)] transition-colors"
                    >
                      Remove
                    </button>
                  )}
                  <label className="px-4 py-1.5 text-[13px] font-medium rounded-md border border-[var(--cevi-border)] text-[var(--cevi-text)] hover:bg-[var(--cevi-surface)] transition-colors cursor-pointer">
                    {profilePicUrl ? "Change" : "Upload Picture"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) { toast("Image must be under 5 MB"); return; }
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const url = ev.target?.result as string;
                          setProfilePicUrl(url);
                          toast("Profile picture updated");
                        };
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Theme */}
              <div className="flex items-center justify-between py-4">
                <div className="text-[14px] font-medium text-[var(--cevi-text)]">Theme</div>
                <select
                  value={theme}
                  onChange={(e) => { setTheme(e.target.value); toast(`Theme set to ${e.target.value}`); }}
                  className="text-[13px] font-medium text-[var(--cevi-text)] bg-white border border-[var(--cevi-border)] rounded-md px-3 py-1.5 cursor-pointer"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
          </section>

          {/* Security Settings */}
          <section>
            <h2 className="text-[16px] font-semibold text-[var(--cevi-text)] mb-4">Security Settings</h2>
            <div className="space-y-0 divide-y divide-[var(--cevi-border-light)]">
              {/* Password */}
              <div className="flex items-center justify-between py-4">
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-[var(--cevi-text)]">Password</div>
                  {editingField === "password" ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        ref={editRef}
                        type="password"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Enter new password"
                        onKeyDown={(e) => { if (e.key === "Enter") commitEdit("password"); if (e.key === "Escape") setEditingField(null); }}
                        className="flex-1 text-[13px] px-2.5 py-1.5 rounded-md border border-[var(--cevi-border)] bg-white text-[var(--cevi-text)] outline-none focus:ring-2 focus:ring-[var(--cevi-accent)]/20 focus:border-[var(--cevi-accent)]"
                      />
                      <button onClick={() => commitEdit("password")} className="p-1 rounded-md hover:bg-[var(--cevi-surface)] text-[var(--cevi-jade)]"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingField(null)} className="p-1 rounded-md hover:bg-[var(--cevi-surface)] text-[var(--cevi-text-muted)]"><X className="h-4 w-4" /></button>
                    </div>
                  ) : passwordSet ? (
                    <div className="text-[12px] text-[var(--cevi-text-muted)] mt-0.5">••••••••</div>
                  ) : null}
                </div>
                {editingField !== "password" && (
                  <button onClick={() => startEdit("password", "")} className="px-4 py-1.5 text-[13px] font-medium rounded-md border border-[var(--cevi-border)] text-[var(--cevi-text)] hover:bg-[var(--cevi-surface)] transition-colors shrink-0">
                    {passwordSet ? "Change Password" : "Set Password"}
                  </button>
                )}
              </div>

              {/* 2FA */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="text-[14px] font-medium text-[var(--cevi-text)]">Two-Factor Authentication</div>
                  {twoFaEnabled && <div className="text-[12px] text-[var(--cevi-jade)] mt-0.5">Enabled</div>}
                </div>
                <button
                  onClick={() => { setTwoFaEnabled(!twoFaEnabled); toast(twoFaEnabled ? "2FA disabled" : "2FA enabled"); }}
                  className={cn(
                    "px-4 py-1.5 text-[13px] font-medium rounded-md border transition-colors",
                    twoFaEnabled
                      ? "border-[var(--cevi-jade)] text-[var(--cevi-jade)] bg-[var(--cevi-jade-light)] hover:bg-[var(--cevi-jade-light)]/70"
                      : "border-[var(--cevi-border)] text-[var(--cevi-text)] hover:bg-[var(--cevi-surface)]",
                  )}
                >
                  {twoFaEnabled ? "Disable 2FA" : "Enable 2FA"}
                </button>
              </div>

              {/* Delete Account */}
              <div className="flex items-center justify-between py-4">
                <div className="text-[14px] font-medium text-[var(--cevi-text)]">Delete Account</div>
                <button
                  onClick={() => setConfirmAction("delete_account")}
                  className="px-4 py-1.5 text-[13px] font-semibold rounded-md bg-[var(--cevi-accent)] text-white hover:opacity-90 transition-opacity"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </section>

          {/* Organization Settings */}
          <section>
            <h2 className="text-[16px] font-semibold text-[var(--cevi-text)] mb-4">Organization Settings</h2>
            <div className="space-y-0 divide-y divide-[var(--cevi-border-light)]">
              {/* Delete Org */}
              <div className="flex items-center justify-between py-4">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="text-[14px] font-medium text-[var(--cevi-text)]">Delete All Organization Data</div>
                  <div className="text-[12px] text-[var(--cevi-text-muted)] mt-0.5">
                    This will delete all data belonging to your organization, including analytics, files, configurations, and historical records.
                  </div>
                </div>
                <button
                  onClick={() => setConfirmAction("delete_org")}
                  className="px-4 py-1.5 text-[13px] font-semibold rounded-md bg-[var(--cevi-accent)] text-white hover:opacity-90 transition-opacity shrink-0"
                >
                  Delete Organization
                </button>
              </div>

              {/* Cookie Preferences */}
              <div className="py-4">
                <div className="text-[14px] font-medium text-[var(--cevi-text)] mb-3">Cookie Preferences</div>
                <div className="space-y-3">
                  <CookieToggle
                    title="Strictly necessary"
                    description="These cookies are essential for this website to function properly."
                    enabled={true}
                    locked
                  />
                  <CookieToggle
                    title="Analytics"
                    description="These cookies help us understand how features are used."
                    enabled={analyticsEnabled}
                    onChange={(v) => { setAnalyticsEnabled(v); toast(v ? "Analytics cookies enabled" : "Analytics cookies disabled"); }}
                  />
                  <CookieToggle
                    title="Functional"
                    description="These cookies enable enhanced functionality like session replay and error tracking."
                    enabled={functionalEnabled}
                    onChange={(v) => { setFunctionalEnabled(v); toast(v ? "Functional cookies enabled" : "Functional cookies disabled"); }}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-[var(--cevi-border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-semibold text-[var(--cevi-text)]">Team Members</h3>
              <button
                onClick={() => toast("Invite link copied to clipboard")}
                className="px-3 py-1.5 rounded-lg bg-[var(--cevi-accent)] text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
              >
                Invite Member
              </button>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-[var(--cevi-border-light)]">
                    <th className="text-left px-4 py-2.5 text-[13px] font-medium text-[var(--cevi-text-muted)]">Name</th>
                    <th className="text-left px-4 py-2.5 text-[13px] font-medium text-[var(--cevi-text-muted)]">Email</th>
                    <th className="text-left px-4 py-2.5 text-[13px] font-medium text-[var(--cevi-text-muted)]">Role</th>
                    <th className="text-left px-4 py-2.5 text-[13px] font-medium text-[var(--cevi-text-muted)]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Theo Sakellos", email: "theo@cevi.ai", role: "Owner", status: "Active" },
                    { name: "Rishu Gautam", email: "rishu@cevi.ai", role: "Admin", status: "Active" },
                    { name: "Dr. Sarah Chen", email: "s.chen@tmg.com", role: "Member", status: "Active" },
                    { name: "James Wilson", email: "j.wilson@tmg.com", role: "Member", status: "Invited" },
                  ].map((user) => (
                    <tr key={user.email} className="border-b border-[var(--cevi-border-light)] last:border-b-0">
                      <td className="px-4 py-3 font-medium text-[var(--cevi-text)]">{user.name}</td>
                      <td className="px-4 py-3 text-[var(--cevi-text-secondary)]">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-[12px] font-semibold px-2 py-0.5 rounded-full",
                          user.role === "Owner" ? "bg-[#F0E6F6] text-[#7C3AED]"
                            : user.role === "Admin" ? "bg-[#E0F2FE] text-[#0284C7]"
                            : "bg-[var(--cevi-surface)] text-[var(--cevi-text-muted)]",
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-[12px] font-medium",
                          user.status === "Active" ? "text-[#16A34A]" : "text-[var(--cevi-text-muted)]",
                        )}>
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmAction && (
        <ConfirmModal
          title={confirmAction === "delete_account" ? "Delete Account" : "Delete Organization"}
          message={
            confirmAction === "delete_account"
              ? "This will permanently delete your account and all associated data. This action cannot be undone."
              : "This will permanently delete all organization data including analytics, files, configurations, and historical records. This action cannot be undone."
          }
          onConfirm={() => {
            toast(confirmAction === "delete_account" ? "Account deletion requested" : "Organization deletion requested");
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}

function CookieToggle({
  title,
  description,
  enabled,
  locked,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  locked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-[13px] font-semibold text-[var(--cevi-text)]">{title}</div>
        <div className="text-[12px] text-[var(--cevi-text-muted)] mt-0.5">{description}</div>
      </div>
      <button
        onClick={() => !locked && onChange?.(!enabled)}
        disabled={locked}
        className={cn(
          "relative shrink-0 h-6 w-11 rounded-full transition-colors duration-200",
          enabled ? "bg-[#2D7A54]" : "bg-[#D1D5DB]",
          locked && "opacity-50 cursor-not-allowed",
          !locked && "cursor-pointer",
        )}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200",
            enabled && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}

function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onCancel}>
      <div
        className="bg-white rounded-xl border border-[var(--cevi-border)] shadow-xl w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-[var(--cevi-accent-light)] flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-[var(--cevi-accent)]" strokeWidth={1.5} />
          </div>
          <h3 className="text-[16px] font-semibold text-[var(--cevi-text)]">{title}</h3>
        </div>
        <p className="text-[13px] text-[var(--cevi-text-secondary)] mb-5 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-[13px] font-medium rounded-md border border-[var(--cevi-border)] text-[var(--cevi-text)] hover:bg-[var(--cevi-surface)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-[13px] font-semibold rounded-md bg-[var(--cevi-accent)] text-white hover:opacity-90 transition-opacity"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
}
