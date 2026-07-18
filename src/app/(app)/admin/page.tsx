import { Database, KeyRound, ScrollText, Settings, Users } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="System controls"
        description="Manage organizations, users, subscriptions, storage, AI usage, API keys, audit logs, templates, and application settings."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Users", "128 active members", Users],
          ["Storage", "412 GB secured uploads", Database],
          ["API keys", "9 active integration keys", KeyRound],
          ["Settings", "SSO, MFA, retention, exports", Settings]
        ].map(([title, body, Icon]) => (
          <Card key={String(title)}>
            <CardContent className="p-6">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-semibold">{String(title)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{String(body)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            Audit log
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            ["Maya Chen approved 34 answers", "answers.review", "2 min ago"],
            ["API key created for Salesforce integration", "api_keys.manage", "1 hr ago"],
            ["Invoice payment succeeded", "billing.webhook", "4 hrs ago"],
            ["SOC 2 report downloaded", "documents.read", "Yesterday"]
          ].map(([summary, action, time]) => (
            <div
              key={summary}
              className="grid gap-3 rounded-2xl border bg-background p-4 md:grid-cols-[1fr_auto_auto]"
            >
              <p className="text-sm">{summary}</p>
              <Badge variant="outline">{action}</Badge>
              <p className="text-sm text-muted-foreground">{time}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
