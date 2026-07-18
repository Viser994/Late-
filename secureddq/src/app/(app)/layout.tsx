import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";
import { getCurrentUser } from "@/lib/auth";
import { getOrgContext } from "@/lib/data";
import type { Role } from "@prisma/client";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, org] = await Promise.all([getCurrentUser(), getOrgContext()]);
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar plan={org.plan} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar name={user.name} email={user.email} role={user.role as Role} />
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-7xl py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
