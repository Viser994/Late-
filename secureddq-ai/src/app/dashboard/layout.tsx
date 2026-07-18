import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
            SecureDDQ AI
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-zinc-600 dark:text-zinc-300 md:flex">
            <Link href="/dashboard">Overview</Link>
            <Link href="/dashboard/questionnaires">Questionnaires</Link>
            <Link href="/dashboard/knowledge-base">Knowledge Base</Link>
            <Link href="/dashboard/compliance">Compliance</Link>
            <Link href="/dashboard/billing">Billing</Link>
          </nav>
          <UserButton />
        </div>
      </header>
      {children}
    </div>
  );
}
