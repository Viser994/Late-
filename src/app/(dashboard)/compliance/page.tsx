import { Shield, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const frameworks = [
  {
    id: "soc2",
    name: "SOC 2",
    description: "Service Organization Control 2",
    coverage: 84,
    covered: 52,
    total: 62,
    color: "bg-blue-500",
    lightColor: "bg-blue-500/10",
    textColor: "text-blue-600",
    categories: [
      { name: "Security (CC)", covered: 18, total: 20, coverage: 90 },
      { name: "Availability (A)", covered: 8, total: 9, coverage: 89 },
      { name: "Confidentiality (C)", covered: 7, total: 8, coverage: 88 },
      { name: "Processing Integrity (PI)", covered: 6, total: 8, coverage: 75 },
      { name: "Privacy (P)", covered: 13, total: 17, coverage: 76 },
    ],
  },
  {
    id: "iso27001",
    name: "ISO 27001",
    description: "Information Security Management",
    coverage: 71,
    covered: 78,
    total: 110,
    color: "bg-green-500",
    lightColor: "bg-green-500/10",
    textColor: "text-green-600",
    categories: [
      { name: "Organizational Controls", covered: 25, total: 37, coverage: 68 },
      { name: "People Controls", covered: 7, total: 8, coverage: 88 },
      { name: "Physical Controls", covered: 12, total: 14, coverage: 86 },
      { name: "Technological Controls", covered: 34, total: 51, coverage: 67 },
    ],
  },
  {
    id: "hipaa",
    name: "HIPAA",
    description: "Health Insurance Portability & Accountability Act",
    coverage: 62,
    covered: 38,
    total: 61,
    color: "bg-purple-500",
    lightColor: "bg-purple-500/10",
    textColor: "text-purple-600",
    categories: [
      { name: "Administrative Safeguards", covered: 18, total: 22, coverage: 82 },
      { name: "Physical Safeguards", covered: 6, total: 10, coverage: 60 },
      { name: "Technical Safeguards", covered: 14, total: 20, coverage: 70 },
      { name: "Organizational Requirements", covered: 0, total: 9, coverage: 0 },
    ],
  },
  {
    id: "gdpr",
    name: "GDPR",
    description: "General Data Protection Regulation",
    coverage: 78,
    covered: 35,
    total: 45,
    color: "bg-orange-500",
    lightColor: "bg-orange-500/10",
    textColor: "text-orange-600",
    categories: [
      { name: "Lawful Basis", covered: 8, total: 10, coverage: 80 },
      { name: "Data Subject Rights", covered: 11, total: 14, coverage: 79 },
      { name: "Data Protection", covered: 9, total: 11, coverage: 82 },
      { name: "Data Breach", covered: 7, total: 10, coverage: 70 },
    ],
  },
];

const gaps = [
  {
    framework: "SOC 2",
    control: "PI 1.5",
    name: "Monitoring of system performance",
    severity: "medium",
  },
  {
    framework: "ISO 27001",
    control: "A.5.34",
    name: "Privacy and protection of PII",
    severity: "high",
  },
  {
    framework: "HIPAA",
    control: "§164.530",
    name: "Organizational requirements documentation",
    severity: "high",
  },
  {
    framework: "GDPR",
    control: "Art. 35",
    name: "Data protection impact assessment",
    severity: "medium",
  },
  {
    framework: "ISO 27001",
    control: "A.8.16",
    name: "Monitoring activities",
    severity: "low",
  },
];

const severityConfig = {
  high: { label: "High", color: "text-red-500", bg: "bg-red-500/10", icon: XCircle },
  medium: { label: "Medium", color: "text-yellow-500", bg: "bg-yellow-500/10", icon: AlertTriangle },
  low: { label: "Low", color: "text-blue-500", bg: "bg-blue-500/10", icon: AlertTriangle },
};

export default function CompliancePage() {
  const overallCoverage = Math.round(
    frameworks.reduce((acc, f) => acc + f.coverage, 0) / frameworks.length
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Compliance Center</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your compliance coverage across security frameworks
        </p>
      </div>

      {/* Overall score */}
      <Card className="border-border/60 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-6xl font-black text-primary">
                {overallCoverage}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Overall Coverage
              </div>
            </div>
            <div className="flex-1 grid grid-cols-4 gap-4">
              {frameworks.map((f) => (
                <div key={f.id} className="text-center">
                  <div className="text-2xl font-bold">{f.coverage}%</div>
                  <div className="text-xs text-muted-foreground">{f.name}</div>
                  <Progress value={f.coverage} className="h-1 mt-2" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Framework details */}
      <div className="grid md:grid-cols-2 gap-6">
        {frameworks.map((framework) => (
          <Card key={framework.id} className="border-border/60">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg ${framework.lightColor} flex items-center justify-center`}
                  >
                    <Shield className={`w-5 h-5 ${framework.textColor}`} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{framework.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {framework.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{framework.coverage}%</div>
                  <div className="text-xs text-muted-foreground">
                    {framework.covered}/{framework.total} controls
                  </div>
                </div>
              </div>
              <Progress value={framework.coverage} className={`h-2 mt-2`} />
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {framework.categories.map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  {cat.coverage === 100 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  ) : cat.coverage === 0 ? (
                    <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate">
                        {cat.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">
                        {cat.covered}/{cat.total}
                      </span>
                    </div>
                    <Progress value={cat.coverage} className="h-1" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gaps */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            Control Gaps ({gaps.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {gaps.map((gap, i) => {
              const severity = severityConfig[gap.severity as keyof typeof severityConfig];
              return (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <severity.icon className={`w-4 h-4 ${severity.color} shrink-0`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{gap.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {gap.framework} · {gap.control}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${severity.bg} ${severity.color}`}
                  >
                    {severity.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
