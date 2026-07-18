"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import {
  Shield,
  LayoutDashboard,
  FileText,
  ClipboardList,
  MessageSquare,
  BarChart3,
  Settings,
  Search,
  Bell,
  FolderKanban,
  Scale,
  Users,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { ThemeToggle } from "@/components/theme-toggle";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Documents", href: "/dashboard/documents", icon: FileText },
  { name: "Questionnaires", href: "/dashboard/questionnaires", icon: ClipboardList },
  { name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { name: "AI Chat", href: "/dashboard/chat", icon: MessageSquare },
  { name: "Compliance", href: "/dashboard/compliance", icon: Scale },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Search", href: "/dashboard/search", icon: Search },
  { name: "Team", href: "/dashboard/team", icon: Users },
  { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Admin", href: "/dashboard/admin", icon: Shield },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Shield className="h-6 w-6 text-primary" />
        <span className="font-semibold">{APP_NAME}</span>
      </div>

      <div className="border-b p-4">
        <OrganizationSwitcher
          appearance={{
            elements: {
              rootBox: "w-full",
              organizationSwitcherTrigger: "w-full justify-between",
            },
          }}
          hidePersonal
          afterCreateOrganizationUrl="/dashboard"
          afterSelectOrganizationUrl="/dashboard"
        />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <UserButton />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/dashboard/notifications"
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
