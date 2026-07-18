"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand";
import { NAV_SECTIONS } from "./nav-config";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/lib/constants";
import type { PlanTier } from "@prisma/client";

export function Sidebar({ plan }: { plan: PlanTier }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card/40 lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard">
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <div className="mt-2 space-y-1">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t p-4">
        <div className="rounded-lg bg-accent/60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Current plan</span>
            <Badge>{PLANS[plan].name}</Badge>
          </div>
          <Link href="/billing" className="mt-2 block text-xs font-medium text-primary hover:underline">
            Manage subscription →
          </Link>
        </div>
      </div>
    </aside>
  );
}
