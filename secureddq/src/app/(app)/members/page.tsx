import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { MembersTable } from "@/components/app/members-table";
import { Card, CardContent } from "@/components/ui/card";
import { getMembers } from "@/lib/data";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/constants";
import type { Role } from "@prisma/client";

export const metadata: Metadata = { title: "Members" };

const ROLES: Role[] = ["OWNER", "ADMIN", "SECURITY_MANAGER", "SECURITY_ANALYST", "SALES_ENGINEER", "VIEWER"];

export default async function MembersPage() {
  const members = await getMembers();
  return (
    <>
      <PageHeader title="Members" description="Manage who has access and what they can do." />
      <MembersTable members={members} />

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Roles & permissions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((role) => (
            <Card key={role}>
              <CardContent className="p-4">
                <p className="font-medium">{ROLE_LABELS[role]}</p>
                <p className="mt-1 text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
