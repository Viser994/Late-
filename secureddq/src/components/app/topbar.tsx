import Link from "next/link";
import { Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "./user-menu";
import { Notifications } from "./notifications";
import { MobileNav } from "./mobile-nav";
import type { Role } from "@prisma/client";

export function Topbar({ name, email, role }: { name: string; email: string; role: Role }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur lg:px-6">
      <MobileNav />
      <Link
        href="/search"
        className="flex h-9 flex-1 items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted md:max-w-md"
      >
        <Search className="h-4 w-4" />
        <span>Search projects, documents, answers…</span>
        <kbd className="ml-auto hidden rounded border bg-background px-1.5 text-xs md:inline">⌘K</kbd>
      </Link>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Notifications />
        <UserMenu name={name} email={email} role={role} />
      </div>
    </header>
  );
}
