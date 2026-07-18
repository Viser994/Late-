import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const { organizationId } = await requireAuth();

  const [org, settings] = await Promise.all([
    db.organization.findUnique({ where: { id: organizationId } }),
    db.organizationSettings.findUnique({ where: { organizationId } }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage organization preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Organization Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{org?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Slug</p>
              <p className="font-medium">{org?.slug}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Industry</p>
              <p className="font-medium">{org?.industry ?? "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Website</p>
              <p className="font-medium">{org?.website ?? "Not set"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Default Answer Style</p>
              <p className="font-medium">{settings?.defaultAnswerStyle ?? "DETAILED"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Require Approval</p>
              <p className="font-medium">{settings?.requireApproval ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Auto-Generate Answers</p>
              <p className="font-medium">{settings?.autoGenerateAnswers ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Confidence Threshold</p>
              <p className="font-medium">{((settings?.confidenceThreshold ?? 0.7) * 100).toFixed(0)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
