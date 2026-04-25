"use client";

import { useState } from "react";
import { cn } from "@/shared/utils";

type Tab = "account" | "users";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [theme, setTheme] = useState("light");

  return (
    <div className="max-w-2xl">
      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-[var(--cevi-border-light)] mb-6">
        {(["account", "users"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-3 text-[14px] font-medium border-b-2 transition-colors -mb-px capitalize",
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
              <SettingsRow
                label="Email"
                value="theo@cevi.ai"
                action="Change Email"
              />
              <SettingsRow
                label="Name"
                value="Theo Sakellos"
                action="Edit Name"
              />
              <SettingsRow
                label="Profile Picture"
                action="Change Picture"
              />
              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="text-[14px] font-medium text-[var(--cevi-text)]">Theme</div>
                </div>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
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
              <SettingsRow
                label="Password"
                action="Set Password"
              />
              <SettingsRow
                label="Two-Factor Authentication"
                action="Enable 2FA"
              />
              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="text-[14px] font-medium text-[var(--cevi-text)]">Delete Account</div>
                </div>
                <button className="px-4 py-1.5 text-[13px] font-semibold rounded-md bg-[var(--cevi-accent)] text-white hover:opacity-90 transition-opacity">
                  Delete Account
                </button>
              </div>
            </div>
          </section>

          {/* Organization Settings */}
          <section>
            <h2 className="text-[16px] font-semibold text-[var(--cevi-text)] mb-4">Organization Settings</h2>
            <div className="space-y-0 divide-y divide-[var(--cevi-border-light)]">
              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="text-[14px] font-medium text-[var(--cevi-text)]">Delete All Organization Data</div>
                  <div className="text-[12px] text-[var(--cevi-text-muted)] mt-0.5">
                    This will delete all data belonging to your organization, including analytics, files, configurations, and historical records.
                  </div>
                </div>
                <button className="px-4 py-1.5 text-[13px] font-semibold rounded-md bg-[var(--cevi-accent)] text-white hover:opacity-90 transition-opacity shrink-0 ml-4">
                  Delete Organization
                </button>
              </div>

              <div className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[14px] font-medium text-[var(--cevi-text)]">Cookie Preferences</div>
                  <button className="px-4 py-1.5 text-[13px] font-medium rounded-md border border-[var(--cevi-border)] text-[var(--cevi-text)] hover:bg-[var(--cevi-surface)] transition-colors">
                    Manage
                  </button>
                </div>
                <div className="space-y-3">
                  <CookieRow
                    title="Strictly necessary"
                    description="These cookies are essential for this website to function properly."
                  />
                  <CookieRow
                    title="Analytics"
                    description="These cookies help us understand how features are used."
                  />
                  <CookieRow
                    title="Functional"
                    description="These cookies enable enhanced functionality like session replay and error tracking."
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "users" && (
        <div className="text-[14px] text-[var(--cevi-text-muted)] py-12 text-center">
          User management coming soon.
        </div>
      )}
    </div>
  );
}

function SettingsRow({
  label,
  value,
  action,
}: {
  label: string;
  value?: string;
  action: string;
}) {
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <div className="text-[14px] font-medium text-[var(--cevi-text)]">{label}</div>
        {value && <div className="text-[12px] text-[var(--cevi-text-muted)] mt-0.5">{value}</div>}
      </div>
      <button className="px-4 py-1.5 text-[13px] font-medium rounded-md border border-[var(--cevi-border)] text-[var(--cevi-text)] hover:bg-[var(--cevi-surface)] transition-colors">
        {action}
      </button>
    </div>
  );
}

function CookieRow({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <div className="text-[13px] font-semibold text-[var(--cevi-text)]">{title}</div>
      <div className="text-[12px] text-[var(--cevi-text-muted)] mt-0.5">{description}</div>
    </div>
  );
}
