import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ROLE_LABELS } from "@/lib/constants";

export default async function TeamPage() {
  const { organizationId } = await requireAuth();

  const members = await db.organizationMember.findMany({
    where: { organizationId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Team</h1>
        <p className="text-muted-foreground">
          Manage organization members and roles
        </p>
      </div>

      <div className="space-y-4">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={member.user.avatarUrl ?? undefined} />
                  <AvatarFallback>
                    {(member.user.firstName?.[0] ?? "") +
                      (member.user.lastName?.[0] ?? "")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {member.user.firstName} {member.user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>
              </div>
              <Badge>{ROLE_LABELS[member.role]}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Use the organization switcher in the sidebar to invite new members via Clerk.
      </p>
    </div>
  );
}
