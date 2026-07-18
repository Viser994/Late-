import { BarChart3, BrainCircuit, Edit3, TrendingUp } from "lucide-react";

import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { demoAnalytics } from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Automation impact"
        description="Measure time saved, money saved, average completion time, common questions, knowledge growth, AI acceptance, and human edit rate."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Questions Answered"
          value="8,428"
          trend="+1,204 this quarter"
          icon={BarChart3}
        />
        <MetricCard
          label="Money Saved"
          value={formatCurrency(18400000)}
          trend="Estimated manual effort avoided"
          icon={TrendingUp}
        />
        <MetricCard
          label="AI Acceptance Rate"
          value={`${demoAnalytics.aiAcceptanceRate}%`}
          trend="Approved without material edit"
          icon={BrainCircuit}
        />
        <MetricCard
          label="Human Edit Rate"
          value={`${demoAnalytics.humanEditPercentage}%`}
          trend="Answers refined by reviewers"
          icon={Edit3}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Most common question themes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            ["Encryption and key management", 96],
            ["Identity and access management", 88],
            ["Incident response", 72],
            ["Business continuity and disaster recovery", 68],
            ["Vulnerability management", 61]
          ].map(([label, value]) => (
            <div key={String(label)}>
              <div className="mb-2 flex justify-between text-sm">
                <span>{String(label)}</span>
                <span className="text-muted-foreground">{Number(value)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${Number(value)}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
