import { requireAuth, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { FileText, Upload, Archive } from "lucide-react";
import Link from "next/link";
import { DocumentUploadButton } from "@/components/documents/upload-button";

export default async function DocumentsPage() {
  const ctx = await requireAuth();
  await requirePermission("documents:upload").catch(() => null);

  const documents = await db.document.findMany({
    where: { organizationId: ctx.organizationId, archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { chunks: true } } },
  });

  const statusVariant = (status: string) => {
    switch (status) {
      case "READY": return "success" as const;
      case "FAILED": return "destructive" as const;
      case "PROCESSING": return "warning" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground">
            Manage your security documentation for AI-powered answers
          </p>
        </div>
        <DocumentUploadButton organizationId={ctx.organizationId} />
      </div>

      {documents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No documents yet</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Upload security policies, SOC reports, and other documentation to
              build your knowledge base.
            </p>
            <DocumentUploadButton organizationId={ctx.organizationId} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Link
                      href={`/dashboard/documents/${doc.id}`}
                      className="font-semibold hover:text-primary"
                    >
                      {doc.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatBytes(doc.fileSize)} · {doc._count.chunks} chunks ·{" "}
                      {formatDistanceToNow(doc.createdAt, { addSuffix: true })}
                    </p>
                    {doc.tags.length > 0 && (
                      <div className="mt-1 flex gap-1">
                        {doc.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusVariant(doc.status)}>{doc.status}</Badge>
                  <Badge variant="outline">{doc.documentType}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
