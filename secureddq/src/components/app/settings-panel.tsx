"use client";

import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

function ToggleRow({ title, description, defaultChecked }: { title: string; description: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} onCheckedChange={() => toast.success("Setting updated")} />
    </div>
  );
}

export function SettingsPanel({ orgName }: { orgName: string }) {
  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="ai">AI</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organization profile</CardTitle>
            <CardDescription>Company details shown across the workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-name">Company name</Label>
                <Input id="org-name" defaultValue={orgName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" defaultValue="https://northwind.io" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" defaultValue="SaaS / Technology" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Company size</Label>
                <Select defaultValue="201-500">
                  <SelectTrigger id="size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-50">1–50</SelectItem>
                    <SelectItem value="51-200">51–200</SelectItem>
                    <SelectItem value="201-500">201–500</SelectItem>
                    <SelectItem value="501+">501+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => toast.success("Profile saved")}>Save changes</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Security & access</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <ToggleRow title="Require MFA" description="Enforce multi-factor authentication for all members." defaultChecked />
            <ToggleRow title="Single sign-on (SSO)" description="SAML / OIDC — available on Enterprise." />
            <ToggleRow title="Session timeout" description="Automatically sign out inactive sessions after 24h." defaultChecked />
            <div className="pt-3">
              <Label htmlFor="retention">Data retention (days)</Label>
              <Input id="retention" type="number" defaultValue={365} className="mt-2 max-w-[160px]" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ai">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI answer engine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="style">Default answer style</Label>
                <Select defaultValue="DETAILED">
                  <SelectTrigger id="style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONCISE">Concise</SelectItem>
                    <SelectItem value="DETAILED">Detailed</SelectItem>
                    <SelectItem value="FORMAL">Formal</SelectItem>
                    <SelectItem value="TECHNICAL">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">Confidence threshold for auto-approval</Label>
                <Input id="threshold" type="number" step="0.05" min="0" max="1" defaultValue={0.7} />
              </div>
            </div>
            <Separator />
            <ToggleRow title="Auto-generate on import" description="Draft answers automatically when a questionnaire is uploaded." defaultChecked />
            <ToggleRow title="Require human approval" description="Answers must be approved before export." defaultChecked />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <ToggleRow title="New questionnaire" description="When a questionnaire is created or assigned to you." defaultChecked />
            <ToggleRow title="Review requests" description="When someone requests your review." defaultChecked />
            <ToggleRow title="Deadlines" description="Reminders as due dates approach." defaultChecked />
            <ToggleRow title="Document expiration" description="When a document is about to expire." defaultChecked />
            <ToggleRow title="Subscription issues" description="Billing and payment notifications." defaultChecked />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
