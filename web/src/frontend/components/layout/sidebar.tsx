"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  Settings,
  BookOpen,
  Headphones,
  LogOut,
  User,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  Image as ImageIcon,
  FileText,
  Stethoscope,
  ShieldCheck,
  ClipboardList,
  FileSearch,
  Receipt,
  HeartPulse,
  HelpCircle,
  Mail,
  MessageSquare,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Pill,
  Accessibility,
  Home,
  Building,
  Syringe,
  Microscope,
  Activity,
  Ambulance,
  Scale,
  Megaphone,
  FileWarning,
  Landmark,
  BriefcaseMedical,
} from "lucide-react";
import { CeviLogo } from "@/frontend/components/brand/cevi-logo";
import { cn } from "@/shared/utils";
import { useState, useRef, useEffect } from "react";
import { useSidebar } from "./sidebar-context";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const MAIN_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: <Inbox className="h-4 w-4" strokeWidth={1.5} /> },
  { href: "/patients", label: "Patients", icon: <User className="h-4 w-4" strokeWidth={1.5} /> },
  { href: "/settings", label: "Settings", icon: <Settings className="h-4 w-4" strokeWidth={1.5} /> },
];

const ic = "h-3.5 w-3.5";
const sw = 1.5;

const CATEGORY_NAV: NavItem[] = [
  { href: "/category/lab_result", label: "Lab Results", icon: <FlaskConical className={ic} strokeWidth={sw} /> },
  { href: "/category/imaging_report", label: "Imaging", icon: <ImageIcon className={ic} strokeWidth={sw} /> },
  { href: "/category/consult_note", label: "Consult Notes", icon: <FileText className={ic} strokeWidth={sw} /> },
  { href: "/category/referral_incoming", label: "Referrals", icon: <Stethoscope className={ic} strokeWidth={sw} /> },
  { href: "/category/prior_auth_response", label: "Prior Auth", icon: <ShieldCheck className={ic} strokeWidth={sw} /> },
  { href: "/category/pharmacy_prior_auth_request", label: "Pharmacy PA", icon: <Pill className={ic} strokeWidth={sw} /> },
  { href: "/category/pharmacy_refill_request", label: "Rx Refill", icon: <Pill className={ic} strokeWidth={sw} /> },
  { href: "/category/dme_documentation", label: "DME", icon: <ClipboardList className={ic} strokeWidth={sw} /> },
  { href: "/category/physical_exam_form", label: "Physical Exam", icon: <BriefcaseMedical className={ic} strokeWidth={sw} /> },
  { href: "/category/medical_records_request", label: "Records Request", icon: <FileSearch className={ic} strokeWidth={sw} /> },
  { href: "/category/eob_era", label: "EOB / ERA", icon: <Receipt className={ic} strokeWidth={sw} /> },
  { href: "/category/hospital_discharge_summary", label: "Discharge", icon: <HeartPulse className={ic} strokeWidth={sw} /> },
  { href: "/category/ed_visit_summary", label: "ED Visit", icon: <Ambulance className={ic} strokeWidth={sw} /> },
  { href: "/category/cardiac_diagnostic_report", label: "Cardiac Dx", icon: <Activity className={ic} strokeWidth={sw} /> },
  { href: "/category/pathology_report", label: "Pathology", icon: <Microscope className={ic} strokeWidth={sw} /> },
  { href: "/category/immunization_record", label: "Immunization", icon: <Syringe className={ic} strokeWidth={sw} /> },
  { href: "/category/home_health_order", label: "Home Health", icon: <Home className={ic} strokeWidth={sw} /> },
  { href: "/category/hospice_correspondence", label: "Hospice", icon: <Building className={ic} strokeWidth={sw} /> },
  { href: "/category/snf_nh_correspondence", label: "SNF / NH", icon: <Building className={ic} strokeWidth={sw} /> },
  { href: "/category/disability_or_leave_form", label: "Disability/Leave", icon: <FileWarning className={ic} strokeWidth={sw} /> },
  { href: "/category/handicap_placard_or_jury_excuse", label: "Handicap/Jury", icon: <Accessibility className={ic} strokeWidth={sw} /> },
  { href: "/category/payer_correspondence", label: "Payer", icon: <Landmark className={ic} strokeWidth={sw} /> },
  { href: "/category/subpoena_or_legal_notice", label: "Legal Notice", icon: <Scale className={ic} strokeWidth={sw} /> },
  { href: "/category/marketing_or_junk", label: "Marketing/Junk", icon: <Megaphone className={ic} strokeWidth={sw} /> },
  { href: "/category/unclassified", label: "Unclassified", icon: <HelpCircle className={ic} strokeWidth={sw} /> },
];

/* ─── Support Modal ─── */
function SupportModal({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        ref={ref}
        className="bg-white rounded-xl border border-[var(--cevi-border)] shadow-xl w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--cevi-border-light)]">
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-[var(--cevi-accent)]" strokeWidth={1.5} />
            <h2 className="text-[15px] font-serif font-semibold text-[var(--cevi-text)]">Support</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--cevi-surface-warm)] transition-colors">
            <X className="h-4 w-4 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <SupportOption
            icon={<Mail className="h-4 w-4" strokeWidth={1.5} />}
            title="Email support"
            description="support@cevi.health"
            subtitle="Response within 4 hours"
          />
          <SupportOption
            icon={<MessageSquare className="h-4 w-4" strokeWidth={1.5} />}
            title="Live chat"
            description="Chat with our team"
            subtitle="Mon-Fri 8am-6pm CT"
          />
          <SupportOption
            icon={<BookOpen className="h-4 w-4" strokeWidth={1.5} />}
            title="Help center"
            description="Guides, FAQs, and tutorials"
            subtitle="docs.cevi.health"
          />
        </div>

        <div className="px-5 py-4 border-t border-[var(--cevi-border-light)] bg-[var(--cevi-surface-warm)] rounded-b-xl">
          <div className="text-[11px] text-[var(--cevi-text-muted)]">
            For urgent issues (system down, PHI exposure), call <span className="font-semibold text-[var(--cevi-text)]">(817) 555-0100</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SupportOption({
  icon,
  title,
  description,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  subtitle: string;
}) {
  return (
    <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-[var(--cevi-border)] hover:border-[var(--cevi-accent)]/30 hover:bg-[var(--cevi-accent-light)]/30 transition-all text-left">
      <div className="h-9 w-9 rounded-lg bg-[var(--cevi-surface-warm)] flex items-center justify-center shrink-0 text-[var(--cevi-accent)]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-[var(--cevi-text)]">{title}</div>
        <div className="text-[12px] text-[var(--cevi-text-secondary)]">{description}</div>
        <div className="text-[10px] text-[var(--cevi-text-muted)] mt-0.5">{subtitle}</div>
      </div>
    </button>
  );
}

/* ─── Account Menu ─── */
function AccountMenu({ onClose, collapsed }: { onClose: () => void; collapsed: boolean }) {
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
      className={cn(
        "absolute bottom-full mb-1 bg-white border border-[var(--cevi-border)] rounded-lg shadow-[var(--shadow-md)] z-50 overflow-hidden",
        collapsed ? "left-1 w-52" : "left-3 right-3",
      )}
    >
      <div className="px-3 py-3 bg-[var(--cevi-surface-warm)] border-b border-[var(--cevi-border-light)]">
        <div className="text-[13px] font-semibold text-[var(--cevi-text)]">Dr. Todd Nguyen</div>
        <div className="text-[11px] text-[var(--cevi-text-muted)]">todd.nguyen@tmghealth.com</div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--cevi-jade)]" />
          <span className="text-[10px] text-[var(--cevi-jade)] font-semibold">Active</span>
          <span className="text-[10px] text-[var(--cevi-text-muted)]">· TMG Arlington</span>
        </div>
      </div>

      <div className="py-1">
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 h-9 text-[13px] text-[var(--cevi-text)] hover:bg-[var(--cevi-surface-warm)] transition-colors"
        >
          <User className="h-3.5 w-3.5 text-[var(--cevi-text-muted)]" strokeWidth={1.5} />
          My Account
        </Link>
        <div className="mx-3 my-0.5 border-t border-[var(--cevi-border-light)]" />
        <button className="w-full flex items-center gap-2.5 px-3 h-9 text-[13px] text-[var(--cevi-accent)] hover:bg-[var(--cevi-surface-warm)] transition-colors">
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
          Log out
        </button>
      </div>
    </div>
  );
}

/* ─── Sidebar ─── */
export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const [accountOpen, setAccountOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(pathname.startsWith("/category"));
  const [supportOpen, setSupportOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname.startsWith("/inbox");
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-20 bg-white border-r border-[var(--cevi-border)] flex flex-col transition-[width] duration-200 ease-out",
          collapsed ? "w-[56px]" : "w-[200px]",
        )}
      >
        {/* Logo + collapse toggle */}
        <div className={cn("h-12 flex items-center shrink-0", collapsed ? "justify-center px-2" : "justify-between px-4")}>
          {collapsed ? (
            <button
              onClick={toggle}
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-[var(--cevi-surface-warm)] transition-colors"
              title="Expand sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 416 139" className="text-[var(--cevi-text)]">
                <path d="M189.325 0C199.437 0 208.347 1.802 216.057 5.306C223.766 8.81 230.273 13.516 235.48 19.323C236.781 20.725 237.983 22.226 239.084 23.728C241.987 27.533 240.986 33.039 237.082 35.742L146.874 98.717C148.677 101.921 150.879 104.824 153.382 107.428C157.988 112.233 163.494 116.138 169.902 119.041C176.41 121.945 183.618 123.346 191.628 123.346H192.028C200.238 123.046 208.147 121.044 215.856 117.039C224.066 112.834 230.374 107.127 234.679 99.919L247.294 110.531C240.586 120.643 232.376 127.852 222.564 132.257C213.153 136.462 202.841 138.665 191.527 138.865H190.727C181.015 138.865 171.904 137.063 163.594 133.759C154.984 130.355 147.675 125.549 141.568 119.342C138.364 116.038 135.461 112.434 132.958 108.529C121.444 116.739 106.627 127.351 103.623 129.153C101.12 130.755 98.617 132.157 96.014 133.358C87.804 137.063 78.994 138.965 69.483 138.965C59.971 138.965 50.059 137.263 41.449 133.859C32.839 130.455 25.53 125.649 19.423 119.442C13.316 113.234 8.61 105.926 5.106 97.416C1.702 88.906 0 79.695 0 69.583C0 59.471 1.702 50.16 5.106 41.75C8.51 33.239 13.316 25.931 19.423 19.723C25.53 13.516 32.839 8.71 41.449 5.306C50.059 1.902 59.371 0.2 69.483 0.2C79.595 0.2 88.205 2.203 96.515 6.207C104.824 10.212 112.133 15.819 118.641 23.027L104.925 33.34C100.019 27.833 94.512 23.528 88.605 20.324C82.698 17.22 76.291 15.619 69.483 15.619C62.674 15.619 54.264 17.02 47.757 19.924C41.249 22.827 35.742 26.632 31.237 31.537C26.632 36.443 23.228 42.15 20.825 48.658C18.422 55.266 17.22 62.274 17.22 69.683C17.22 77.092 18.422 84.1 20.825 90.708C23.228 97.316 26.632 103.022 31.237 107.828C35.843 112.634 41.349 116.538 47.757 119.442C54.264 122.345 61.473 123.747 69.483 123.747C77.492 123.747 83.099 122.145 89.006 118.941C94.612 116.038 111.332 104.024 125.849 93.611C123.346 86.202 122.145 78.293 122.145 69.683C122.145 61.073 123.847 50.26 127.251 41.85C130.655 33.34 135.461 26.031 141.568 19.824C147.675 13.616 154.984 8.81 163.594 5.406C172.205 2.002 181.516 0.3 191.628 0.3M216.157 31.738C218.76 29.936 218.76 26.231 216.257 24.329C213.754 22.427 209.949 20.224 206.345 18.822C201.339 16.82 196.133 15.619 190.626 15.418H188.724C181.916 15.719 175.709 17.12 170.002 19.623C163.494 22.527 157.988 26.331 153.482 31.237C148.877 36.143 145.473 41.85 143.07 48.357C140.667 54.965 139.466 61.974 139.466 69.382C139.466 76.791 139.966 78.693 140.967 83.099L216.157 31.738Z" fill="currentColor" />
              </svg>
            </button>
          ) : (
            <>
              <Link href="/" aria-label="Cevi home" className="inline-flex">
                <CeviLogo size="sm" />
              </Link>
              <button
                onClick={toggle}
                className="p-1 rounded-md hover:bg-[var(--cevi-surface-warm)] transition-colors text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)]"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className={cn("flex-1 overflow-y-auto scrollbar-thin", collapsed ? "px-1.5" : "px-3")}>
          <ul className="space-y-0.5">
            {MAIN_NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center rounded-md text-[13px] font-medium transition-colors",
                      collapsed ? "justify-center h-9 w-full" : "gap-2.5 px-3 h-9",
                      active
                        ? "bg-[var(--cevi-accent-light)] text-[var(--cevi-text)]"
                        : "text-[var(--cevi-text-secondary)] hover:bg-[var(--cevi-surface-warm)] hover:text-[var(--cevi-text)]",
                    )}
                  >
                    <span className={cn("shrink-0", active ? "text-[var(--cevi-accent)]" : "text-[var(--cevi-text-muted)]")}>
                      {item.icon}
                    </span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Categories */}
          {!collapsed ? (
            <div className="mt-4">
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="w-full flex items-center justify-between px-3 h-7 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--cevi-text-muted)] hover:text-[var(--cevi-text)] transition-colors"
              >
                <span>Categories</span>
                {categoriesOpen
                  ? <ChevronDown className="h-3 w-3" strokeWidth={1.5} />
                  : <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
                }
              </button>
              {categoriesOpen && (
                <ul className="space-y-0.5 mt-0.5">
                  {CATEGORY_NAV.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2 px-3 h-8 rounded-md text-[12px] font-medium transition-colors",
                            active
                              ? "bg-[var(--cevi-accent-light)] text-[var(--cevi-text)]"
                              : "text-[var(--cevi-text-secondary)] hover:bg-[var(--cevi-surface-warm)] hover:text-[var(--cevi-text)]",
                          )}
                        >
                          <span className={cn(active ? "text-[var(--cevi-accent)]" : "text-[var(--cevi-text-muted)]")}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            /* Collapsed: just show a divider and category icons */
            <div className="mt-3 pt-3 border-t border-[var(--cevi-border-light)] space-y-0.5">
              {CATEGORY_NAV.slice(0, 5).map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={cn(
                      "flex items-center justify-center h-8 rounded-md transition-colors",
                      active
                        ? "bg-[var(--cevi-accent-light)] text-[var(--cevi-accent)]"
                        : "text-[var(--cevi-text-muted)] hover:bg-[var(--cevi-surface-warm)] hover:text-[var(--cevi-text)]",
                    )}
                  >
                    {item.icon}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Bottom section */}
        <div className={cn("pb-3 space-y-0.5", collapsed ? "px-1.5" : "px-3")}>
          <div className={cn("mb-2 border-t border-[var(--cevi-border-light)]", collapsed ? "mx-1" : "mx-2")} />

          <button
            onClick={() => setSupportOpen(true)}
            title={collapsed ? "Support" : undefined}
            className={cn(
              "w-full flex items-center rounded-md text-[13px] font-medium text-[var(--cevi-text-secondary)] hover:bg-[var(--cevi-surface-warm)] hover:text-[var(--cevi-text)] transition-colors",
              collapsed ? "justify-center h-9" : "gap-2.5 px-3 h-9",
            )}
          >
            <span className="text-[var(--cevi-text-muted)]">
              <Headphones className="h-4 w-4" strokeWidth={1.5} />
            </span>
            {!collapsed && <span>Support</span>}
          </button>

          <div className={cn("my-2 border-t border-[var(--cevi-border-light)]", collapsed ? "mx-1" : "mx-2")} />

          {/* Account */}
          <div className="relative">
            {accountOpen && <AccountMenu onClose={() => setAccountOpen(false)} collapsed={collapsed} />}
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              title={collapsed ? "TMG" : undefined}
              className={cn(
                "w-full flex items-center rounded-md hover:bg-[var(--cevi-surface-warm)] transition-colors",
                collapsed ? "justify-center h-9" : "gap-2.5 px-3 h-9",
              )}
            >
              <span className="h-6 w-6 rounded-full bg-[var(--cevi-surface)] border border-[var(--cevi-border)] flex items-center justify-center text-[10px] font-bold text-[var(--cevi-text-secondary)] shrink-0">
                N
              </span>
              {!collapsed && <span className="text-[13px] font-medium text-[var(--cevi-text-secondary)]">TMG</span>}
            </button>
          </div>
        </div>
      </aside>

      {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}
    </>
  );
}
