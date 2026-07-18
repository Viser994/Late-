import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default async function NotificationsPage() {
  const { organizationId, user } = await requireAuth();

  const notifications = await db.notification.findMany({
    where: { userId: user.id, organizationId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">
          Stay updated on reviews, deadlines, and system events
        </p>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No notifications yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className={n.read ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <p className="font-medium">{n.title}</p>
                      {!n.read && <Badge variant="default">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  {n.link && (
                    <Link href={n.link} className="text-sm text-primary hover:underline">
                      View
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
