import { Archive, CalendarClock, Search, Tags, UploadCloud } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supportedDocumentTypes } from "@/lib/constants";
import { recentUploads } from "@/lib/demo-data";

export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Knowledge base"
        title="Documents"
        description="Upload, tag, version, archive, search, and monitor security evidence used by AI responses."
        action={
          <Button>
            <UploadCloud className="h-4 w-4" />
            Upload evidence
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Supported evidence</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {supportedDocumentTypes.map((type) => (
              <Badge key={type} variant="outline">
                {type}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Document controls</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            {[
              ["Semantic search", Search],
              ["Tags", Tags],
              ["Expiration tracking", CalendarClock],
              ["Archive history", Archive]
            ].map(([label, Icon]) => (
              <div key={String(label)} className="rounded-2xl border p-4">
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-medium">{String(label)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Knowledge base inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentUploads.map((upload) => (
            <div
              key={upload.title}
              className="grid gap-4 rounded-2xl border bg-background p-4 md:grid-cols-[1fr_auto_auto]"
            >
              <div>
                <p className="font-medium">{upload.title}</p>
                <p className="text-sm text-muted-foreground">
                  Version 1 - {upload.chunks} indexed chunks
                </p>
              </div>
              <div className="flex gap-2">
                {upload.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Badge variant={upload.status === "Ready" ? "success" : "warning"}>
                {upload.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
