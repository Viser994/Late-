import type { Metadata } from "next";
import { Users, Building2, CreditCard, HardDrive, Cpu, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ApiKeysManager } from "@/components/app/api-keys-manager";

export const metadata: Metadata = { title: "Admin" };

const auditLogs = [
  { id: "l1", actor: "ava@northwind.io", action: "answer.approved", target: "Globex SOC 2 DDQ", at: "2026-07-18 21:14", ip: "203.0.113.10" },
  { id: "l2", actor: "priya@northwind.io", action: "document.uploaded", target: "SOC 2 Type II 2025", at: "2026-07-18 18:02", ip: "203.0.113.24" },
  { id: "l3", actor: "admin@northwind.io", action: "member.role_changed", target: "diego@northwind.io → Analyst", at: "2026-07-17 09:41", ip: "198.51.100.7" },
  { id: "l4", actor: "system", action: "subscription.renewed", target: "Professional", at: "2026-07-16 00:00", ip: "—" },
];

const templates = [
  { id: "t1", name: "SOC 2 Vendor DDQ", questions: 88, uses: 34 },
  { id: "t2", name: "HIPAA Security Questionnaire", questions: 96, uses: 12 },
  { id: "t3", name: "Generic Cloud Security Review", questions: 142, uses: 51 },
];

export default function AdminPage() {
  return (
    <>
      <PageHeader title="Admin Panel" description="Platform administration and operational controls." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Members" value="8" icon={Users} />
        <StatCard label="Organization" value="Northwind" icon={Building2} />
        <StatCard label="Subscription" value="Professional" icon={CreditCard} />
        <StatCard label="Storage used" value="4.2 GB" icon={HardDrive} hint="of 100 GB" />
        <StatCard label="AI tokens (mo)" value="6.4M" icon={Cpu} hint="$128 est. cost" />
        <StatCard label="Audit events (24h)" value="142" icon={ScrollText} />
      </div>

      <Tabs defaultValue="audit" className="mt-6">
        <TabsList>
          <TabsTrigger value="audit">Audit logs</TabsTrigger>
          <TabsTrigger value="apikeys">API keys</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit log</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm">{l.actor}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{l.action}</code>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.target}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.at}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.ip}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apikeys">
          <ApiKeysManager />
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Questionnaire templates</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Uses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-muted-foreground">{t.questions}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{t.uses} uses</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System status</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {[
                ["API", "Operational"],
                ["Background jobs", "Operational"],
                ["Vector index", "Operational"],
                ["Email delivery", "Operational"],
              ].map(([name, status]) => (
                <div key={name} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">{name}</span>
                  <Badge variant="success">{status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
