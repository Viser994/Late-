import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { COMPLIANCE_FRAMEWORKS } from "@/lib/constants";
import type { ComplianceFramework, ControlStatus } from "@prisma/client";

const DEFAULT_CONTROLS: Record<ComplianceFramework, Array<{ id: string; title: string }>> = {
  SOC2: [
    { id: "CC1.1", title: "Control Environment" },
    { id: "CC2.1", title: "Communication and Information" },
    { id: "CC3.1", title: "Risk Assessment" },
    { id: "CC6.1", title: "Logical Access Security" },
    { id: "CC7.1", title: "System Operations" },
    { id: "CC8.1", title: "Change Management" },
  ],
  ISO27001: [
    { id: "A.5.1", title: "Information Security Policies" },
    { id: "A.6.1", title: "Organization of Information Security" },
    { id: "A.8.1", title: "Asset Management" },
    { id: "A.9.1", title: "Access Control" },
    { id: "A.12.1", title: "Operations Security" },
    { id: "A.16.1", title: "Incident Management" },
  ],
  HIPAA: [
    { id: "164.308", title: "Administrative Safeguards" },
    { id: "164.310", title: "Physical Safeguards" },
    { id: "164.312", title: "Technical Safeguards" },
  ],
  GDPR: [
    { id: "Art.5", title: "Principles of Processing" },
    { id: "Art.25", title: "Data Protection by Design" },
    { id: "Art.32", title: "Security of Processing" },
    { id: "Art.33", title: "Breach Notification" },
  ],
  PCI_DSS: [
    { id: "Req.1", title: "Network Security Controls" },
    { id: "Req.3", title: "Protect Stored Account Data" },
    { id: "Req.8", title: "Identify Users and Authenticate Access" },
    { id: "Req.10", title: "Log and Monitor Access" },
  ],
  NIST: [
    { id: "ID.AM", title: "Asset Management" },
    { id: "PR.AC", title: "Identity Management and Access Control" },
    { id: "DE.CM", title: "Security Continuous Monitoring" },
    { id: "RS.RP", title: "Response Planning" },
  ],
};

async function ensureComplianceControls(organizationId: string) {
  const existing = await db.complianceControl.count({ where: { organizationId } });
  if (existing > 0) return;

  const controls = Object.entries(DEFAULT_CONTROLS).flatMap(
    ([framework, items]) =>
      items.map((item) => ({
        organizationId,
        framework: framework as ComplianceFramework,
        controlId: item.id,
        title: item.title,
        status: "MISSING" as ControlStatus,
      }))
  );

  await db.complianceControl.createMany({ data: controls });
}

export default async function CompliancePage() {
  const { organizationId } = await requireAuth();
  await ensureComplianceControls(organizationId);

  const controls = await db.complianceControl.findMany({
    where: { organizationId },
    orderBy: [{ framework: "asc" }, { controlId: "asc" }],
  });

  const frameworks = COMPLIANCE_FRAMEWORKS.map((fw) => {
    const fwControls = controls.filter((c) => c.framework === fw.id);
    const covered = fwControls.filter((c) => c.status === "COVERED").length;
    const partial = fwControls.filter((c) => c.status === "PARTIAL").length;
    const total = fwControls.length;
    const coverage = total > 0 ? Math.round(((covered + partial * 0.5) / total) * 100) : 0;

    return { ...fw, controls: fwControls, covered, partial, total, coverage };
  });

  const statusColor = (status: string) => {
    switch (status) {
      case "COVERED": return "success" as const;
      case "PARTIAL": return "warning" as const;
      case "MISSING": return "destructive" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Compliance Center</h1>
        <p className="text-muted-foreground">
          Track compliance coverage across security frameworks
        </p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {frameworks.map((fw) => (
          <Card key={fw.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{fw.name}</span>
                <Badge variant={fw.coverage >= 80 ? "success" : fw.coverage >= 50 ? "warning" : "destructive"}>
                  {fw.coverage}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={fw.coverage} className="mb-4" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{fw.covered} covered</span>
                <span>{fw.partial} partial</span>
                <span>{fw.total - fw.covered - fw.partial} missing</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {frameworks.map((fw) => (
        <Card key={`detail-${fw.id}`} className="mb-6">
          <CardHeader>
            <CardTitle>{fw.name} Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fw.controls.map((control) => (
                <div
                  key={control.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {control.controlId}: {control.title}
                    </p>
                    {control.description && (
                      <p className="text-sm text-muted-foreground">
                        {control.description}
                      </p>
                    )}
                  </div>
                  <Badge variant={statusColor(control.status)}>
                    {control.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
