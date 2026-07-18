"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { navItems } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-card/80 p-5 backdrop-blur lg:block">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary p-2 text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">SecureDDQ AI</p>
            <p className="text-xs text-muted-foreground">Enterprise workspace</p>
          </div>
        </Link>

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  active && "bg-primary/10 text-primary"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border bg-background p-4">
          <Badge variant="success">Professional</Badge>
          <p className="mt-3 text-sm font-medium">AI usage healthy</p>
          <p className="mt-1 text-xs text-muted-foreground">
            62% of monthly answer generation budget remaining.
          </p>
        </div>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/80 px-5 backdrop-blur">
          <div>
            <p className="text-sm text-muted-foreground">Acme Security, Inc.</p>
            <p className="font-semibold">Security response automation</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              Invite
            </Button>
            <div className="h-9 w-9 rounded-full bg-primary/10 text-center text-sm font-semibold leading-9 text-primary">
              AS
            </div>
          </div>
        </header>
        <div className="p-5 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
