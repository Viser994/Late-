import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { GenerateAnswersButton } from "@/components/questionnaires/generate-answers-button";
import { AnswerCard } from "@/components/questionnaires/answer-card";

export default async function QuestionnaireDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organizationId } = await requireAuth();

  const questionnaire = await db.questionnaire.findFirst({
    where: { id, organizationId },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
        include: {
          answers: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              evidence: { include: { document: { select: { name: true } } } },
            },
          },
          section: true,
        },
      },
      sections: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!questionnaire) notFound();

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-3xl font-bold">{questionnaire.title}</h1>
            <Badge>{questionnaire.status}</Badge>
          </div>
          <p className="text-muted-foreground">
            {questionnaire.answeredCount} of {questionnaire.totalQuestions} questions answered
          </p>
        </div>
        <div className="flex gap-2">
          <GenerateAnswersButton
            questionnaireId={questionnaire.id}
            organizationId={organizationId}
          />
          <Button variant="outline" asChild>
            <Link href="/dashboard/questionnaires">Back</Link>
          </Button>
        </div>
      </div>

      {questionnaire.questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">
              No questions parsed yet. Parse the uploaded file to detect questions.
            </p>
            <Button asChild>
              <Link href={`/dashboard/questionnaires/${id}/parse`}>
                Parse Questions
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {questionnaire.questions.map((question, index) => (
            <AnswerCard
              key={question.id}
              questionNumber={index + 1}
              question={question}
              answer={question.answers[0] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
