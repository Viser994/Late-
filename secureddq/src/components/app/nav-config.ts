import {
  LayoutDashboard,
  FolderKanban,
  FileStack,
  Library,
  MessagesSquare,
  ShieldCheck,
  BarChart3,
  Settings,
  Users,
  CreditCard,
  Search,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Projects", href: "/projects", icon: FolderKanban },
      { label: "Questionnaires", href: "/questionnaires", icon: FileStack },
      { label: "Search", href: "/search", icon: Search },
    ],
  },
  {
    title: "Knowledge",
    items: [
      { label: "Documents", href: "/documents", icon: Library },
      { label: "AI Chat", href: "/chat", icon: MessagesSquare },
      { label: "Compliance", href: "/compliance", icon: ShieldCheck },
    ],
  },
  {
    title: "Insights",
    items: [{ label: "Analytics", href: "/analytics", icon: BarChart3 }],
  },
  {
    title: "Organization",
    items: [
      { label: "Members", href: "/members", icon: Users },
      { label: "Billing", href: "/billing", icon: CreditCard },
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "Admin", href: "/admin", icon: ShieldCheck },
    ],
  },
];
