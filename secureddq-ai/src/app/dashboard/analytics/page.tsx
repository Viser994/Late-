import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HOURS_SAVED_PER_QUESTION } from "@/lib/constants";

export default async function AnalyticsPage() {
  const { organizationId } = await requireAuth();

  const [
    questionnaires,
    answers,
    documents,
    aiUsage,
    editedAnswers,
    approvedAnswers,
  ] = await Promise.all([
    db.questionnaire.count({ where: { organizationId } }),
    db.answer.count({
      where: { question: { questionnaire: { organizationId } } },
    }),
    db.document.count({ where: { organizationId } }),
    db.aiUsageLog.aggregate({
      where: { organizationId },
      _sum: { inputTokens: true, outputTokens: true },
      _count: true,
    }),
    db.answer.count({
      where: {
        status: "EDITED",
        question: { questionnaire: { organizationId } },
      },
    }),
    db.answer.count({
      where: {
        status: "APPROVED",
        question: { questionnaire: { organizationId } },
      },
    }),
  ]);

  const hoursSaved = Math.round(answers * HOURS_SAVED_PER_QUESTION);
  const moneySaved = hoursSaved * 150;
  const aiAcceptanceRate =
    answers > 0 ? Math.round((approvedAnswers / answers) * 100) : 0;
  const humanEditRate =
    answers > 0 ? Math.round((editedAnswers / answers) * 100) : 0;

  const metrics = [
    { title: "Questions Answered", value: answers },
    { title: "Questionnaires", value: questionnaires },
    { title: "Hours Saved", value: hoursSaved },
    { title: "Money Saved", value: `$${moneySaved.toLocaleString()}` },
    { title: "AI Acceptance Rate", value: `${aiAcceptanceRate}%` },
    { title: "Human Edit Rate", value: `${humanEditRate}%` },
    { title: "Knowledge Base Size", value: documents },
    { title: "AI API Calls", value: aiUsage._count },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track your security questionnaire automation performance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Token Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Input Tokens</p>
              <p className="text-xl font-bold">
                {(aiUsage._sum.inputTokens ?? 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Output Tokens</p>
              <p className="text-xl font-bold">
                {(aiUsage._sum.outputTokens ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
