import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
  const ctx = await requirePermission("admin:access");

  const [orgs, users, jobs, aiUsage] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.backgroundJob.groupBy({
      by: ["status"],
      _count: true,
    }),
    db.aiUsageLog.aggregate({
      where: { organizationId: ctx.organizationId },
      _sum: { inputTokens: true, outputTokens: true },
      _count: true,
    }),
  ]);

  const auditLogs = await db.auditLog.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: { select: { email: true } } },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">
          System administration and audit logs
        </p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{orgs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{users}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">AI Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{aiUsage._count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Background Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {jobs.map((j) => (
              <p key={j.status} className="text-sm">
                {j.status}: {j._count}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit logs yet</p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded border p-3 text-sm"
                >
                  <div>
                    <Badge variant="outline" className="mr-2">
                      {log.action}
                    </Badge>
                    <span>
                      {log.entityType} · {log.entityId}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {log.user?.email ?? "System"} ·{" "}
                    {log.createdAt.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
