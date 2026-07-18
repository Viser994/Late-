import { Settings, Bell, Shield, CreditCard, Users, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your organization settings and preferences
        </p>
      </div>

      {/* Organization */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Organization
          </CardTitle>
          <CardDescription>
            Configure your organization profile and branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input defaultValue="Acme Corporation" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input defaultValue="acme-corp" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Website</Label>
              <Input defaultValue="https://acme.com" />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input defaultValue="SaaS / Technology" />
            </div>
          </div>
          <Button size="sm">Save Changes</Button>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            AI Configuration
          </CardTitle>
          <CardDescription>
            Customize how the AI generates answers for your questionnaires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Require Approval</div>
              <div className="text-xs text-muted-foreground">
                All AI answers must be approved before submission
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Allow AI Generation</div>
              <div className="text-xs text-muted-foreground">
                Enable automatic AI answer generation
              </div>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Default Answer Style</Label>
            <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="professional">Professional</option>
              <option value="technical">Technical</option>
              <option value="concise">Concise</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Confidence Threshold</Label>
            <div className="flex items-center gap-3">
              <Input type="number" defaultValue="70" min="0" max="100" className="w-24" />
              <span className="text-sm text-muted-foreground">
                % minimum (below this flags for review)
              </span>
            </div>
          </div>
          <Button size="sm">Save Settings</Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "New questionnaire assigned", desc: "Get notified when you receive a new questionnaire" },
            { label: "Review requested", desc: "When your review is needed on an answer" },
            { label: "Document expiring", desc: "30 days before a document expires" },
            { label: "Deadline reminders", desc: "3 days before a questionnaire is due" },
            { label: "Weekly summary", desc: "Weekly digest of activity" },
          ].map((item, i) => (
            <div key={i}>
              {i > 0 && <Separator className="mb-4" />}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
                <Switch defaultChecked={i < 4} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Team */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team Members
              </CardTitle>
              <CardDescription>Manage team access and roles</CardDescription>
            </div>
            <Button size="sm">Invite Member</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: "Sarah Chen", email: "sarah@acme.com", role: "OWNER", avatar: "SC" },
            { name: "Marcus Rodriguez", email: "marcus@acme.com", role: "ADMIN", avatar: "MR" },
            { name: "Jennifer Park", email: "jennifer@acme.com", role: "SECURITY_MANAGER", avatar: "JP" },
            { name: "David Thompson", email: "david@acme.com", role: "SECURITY_ANALYST", avatar: "DT" },
          ].map((member) => (
            <div key={member.email} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                {member.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{member.name}</div>
                <div className="text-xs text-muted-foreground">{member.email}</div>
              </div>
              <Badge variant="outline" className="text-xs">
                {member.role.replace("_", " ")}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Billing */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Billing & Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div>
              <div className="font-semibold">Professional Plan</div>
              <div className="text-sm text-muted-foreground">$199/month · Next billing Jul 25, 2026</div>
            </div>
            <Badge>Active</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Manage Billing</Button>
            <Button variant="outline" size="sm">View Invoices</Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
              Cancel Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Keys
              </CardTitle>
              <CardDescription>Manage API access for integrations</CardDescription>
            </div>
            <Button size="sm">Create Key</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: "Production Key", prefix: "sddq_prod_...", lastUsed: "Today", created: "Jan 15, 2026" },
            { name: "Development Key", prefix: "sddq_dev_...", lastUsed: "Yesterday", created: "Mar 1, 2026" },
          ].map((key) => (
            <div key={key.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Key className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{key.name}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {key.prefix}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Last used: {key.lastUsed}
              </div>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7">
                Revoke
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
