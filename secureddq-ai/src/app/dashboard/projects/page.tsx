import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FolderKanban } from "lucide-react";

export default async function ProjectsPage() {
  const { organizationId } = await requireAuth();

  const projects = await db.project.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { questionnaires: true } } },
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-muted-foreground">
          Organize questionnaires by customer or deal
        </p>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No projects yet. Projects help organize questionnaires by customer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  {project.customerName && (
                    <p className="text-sm text-muted-foreground">
                      {project.customerName}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="outline">
                      {project._count.questionnaires} questionnaires
                    </Badge>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(project.updatedAt, { addSuffix: true })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
