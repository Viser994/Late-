import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ControlStatusBadge } from "@/components/app/status-badge";
import { getControls, getFrameworkCoverage } from "@/lib/data";
import { FRAMEWORK_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Compliance" };

export default async function CompliancePage() {
  const [controls, coverage] = await Promise.all([getControls(), getFrameworkCoverage()]);
  const frameworks = [...new Set(controls.map((c) => c.framework))];

  return (
    <>
      <PageHeader
        title="Compliance Center"
        description="Map documents to controls and track coverage across frameworks."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coverage.map((fc) => (
          <Card key={fc.framework}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="font-medium">{FRAMEWORK_LABELS[fc.framework]}</span>
                <Badge variant={fc.coverage >= 80 ? "success" : fc.coverage >= 50 ? "warning" : "destructive"}>
                  {fc.coverage}%
                </Badge>
              </div>
              <Progress
                className="mt-3"
                value={fc.coverage}
                indicatorClassName={fc.coverage >= 80 ? "bg-success" : fc.coverage >= 50 ? "bg-warning" : "bg-destructive"}
              />
              <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                <span>{fc.implemented} implemented</span>
                <span>{fc.inProgress} in progress</span>
                <span>{fc.total - fc.implemented - fc.inProgress} missing</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={frameworks[0]}>
            <TabsList>
              {frameworks.map((f) => (
                <TabsTrigger key={f} value={f}>
                  {FRAMEWORK_LABELS[f]}
                </TabsTrigger>
              ))}
            </TabsList>
            {frameworks.map((f) => (
              <TabsContent key={f} value={f}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Control</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Evidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {controls
                      .filter((c) => c.framework === f)
                      .map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono text-sm">{c.code}</TableCell>
                          <TableCell>{c.title}</TableCell>
                          <TableCell>
                            <ControlStatusBadge status={c.status} />
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <FileText className="h-3.5 w-3.5" /> {c.mappedDocuments} mapped
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
