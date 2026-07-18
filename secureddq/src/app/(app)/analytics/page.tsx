import type { Metadata } from "next";
import { MessageSquareText, Timer, DollarSign, Clock, ThumbsUp, PencilLine } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnswersOverTimeChart, KnowledgeGrowthChart, TopQuestionsChart } from "@/components/app/analytics-charts";
import { getAnalytics } from "@/lib/data";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const a = await getAnalytics();
  return (
    <>
      <PageHeader title="Analytics" description="Measure impact, adoption, and knowledge growth." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Questions answered" value={formatCompact(a.questionsAnswered)} icon={MessageSquareText} trend={{ value: "+18%", positive: true }} />
        <StatCard label="Hours saved" value={formatCompact(a.hoursSaved)} icon={Timer} trend={{ value: "+12%", positive: true }} />
        <StatCard label="Money saved" value={formatCurrency(a.moneySaved * 100)} icon={DollarSign} hint="At $150/hr blended rate" />
        <StatCard label="Avg. completion" value={`${a.avgCompletionHours}h`} icon={Clock} trend={{ value: "-31%", positive: true }} />
        <StatCard label="AI acceptance rate" value={formatPercent(a.aiAcceptanceRate)} icon={ThumbsUp} trend={{ value: "+4%", positive: true }} />
        <StatCard label="Human edit rate" value={formatPercent(a.humanEditRate)} icon={PencilLine} hint="Answers edited before approval" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Answers over time</CardTitle>
          </CardHeader>
          <CardContent>
            <AnswersOverTimeChart data={a.answersOverTime} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Knowledge base growth</CardTitle>
          </CardHeader>
          <CardContent>
            <KnowledgeGrowthChart data={a.knowledgeGrowth} />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Most common questions</CardTitle>
        </CardHeader>
        <CardContent>
          <TopQuestionsChart data={a.topQuestions} />
        </CardContent>
      </Card>
    </>
  );
}
