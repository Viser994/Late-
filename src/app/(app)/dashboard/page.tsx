import {
  BadgeCheck,
  Clock3,
  DollarSign,
  FileCheck2,
  Files,
  ShieldCheck,
  Sparkles,
  TimerReset
} from "lucide-react";

import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoAnalytics } from "@/lib/analytics";
import { dashboardActivity, recentUploads } from "@/lib/demo-data";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";

export default function DashboardPage() {
  const metrics = [
    {
      label: "Total Questionnaires",
      value: String(demoAnalytics.questionnaires),
      trend: "+18% this month",
      icon: FileCheck2
    },
    {
      label: "Pending Review",
      value: String(demoAnalytics.pendingReview),
      trend: "34 answers awaiting approval",
      icon: Clock3
    },
    {
      label: "AI Accuracy",
      value: `${demoAnalytics.aiAccuracy}%`,
      trend: "Based on accepted answers",
      icon: Sparkles
    },
    {
      label: "Hours Saved",
      value: formatCompactNumber(demoAnalytics.estimatedHoursSaved),
      trend: "Across all workspaces",
      icon: TimerReset
    },
    {
      label: "Revenue Protected",
      value: formatCurrency(demoAnalytics.revenueProtected * 100),
      trend: "Open opportunities",
      icon: DollarSign
    },
    {
      label: "Knowledge Base Size",
      value: formatCompactNumber(demoAnalytics.knowledgeBaseSize),
      trend: "Evidence chunks indexed",
      icon: Files
    },
    {
      label: "Compliance Coverage",
      value: `${demoAnalytics.complianceCoverage}%`,
      trend: "SOC2, ISO, HIPAA, GDPR",
      icon: ShieldCheck
    },
    {
      label: "Completed",
      value: String(demoAnalytics.completed),
      trend: "Questionnaires exported",
      icon: BadgeCheck
    }
  ];

  return (
    <>
      <PageHeader
        eyebrow="Command center"
        title="Dashboard"
        description="Track questionnaire throughput, knowledge base health, compliance coverage, AI quality, and team activity."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Team Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardActivity.map((activity) => (
              <div key={activity} className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <p className="text-sm text-muted-foreground">{activity}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentUploads.map((upload) => (
              <div
                key={upload.title}
                className="rounded-2xl border bg-background p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{upload.title}</p>
                  <Badge
                    variant={upload.status === "Ready" ? "success" : "warning"}
                  >
                    {upload.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {upload.chunks} chunks indexed
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {upload.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
