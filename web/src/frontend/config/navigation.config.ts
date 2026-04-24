import {
  Inbox,
  Upload,
  ClipboardList,
  Settings,
  FileText,
} from "lucide-react";
import type { ComponentType } from "react";

export interface NavItem {
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
  section: "main" | "secondary";
}

export const NAVIGATION: NavItem[] = [
  { label: "Inbox", path: "/inbox", icon: Inbox, section: "main" },
  { label: "Upload", path: "/upload", icon: Upload, section: "main" },
  { label: "Paper EOB", path: "/eob", icon: FileText, section: "main" },
  { label: "Audit Trail", path: "/audit", icon: ClipboardList, section: "main" },
  { label: "Settings", path: "/settings", icon: Settings, section: "secondary" },
];
