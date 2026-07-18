import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ClipboardList, Plus } from "lucide-react";
import { QuestionnaireUploadButton } from "@/components/documents/upload-button";

export default async function QuestionnairesPage() {
  const { organizationId } = await requireAuth();

  const questionnaires = await db.questionnaire.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    include: { project: { select: { name: true } } },
  });

  const statusVariant = (status: string) => {
    switch (status) {
      case "COMPLETED": return "success" as const;
      case "IN_PROGRESS": return "default" as const;
      case "PENDING_REVIEW": return "warning" as const;
      default: return "secondary" as const;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Questionnaires</h1>
          <p className="text-muted-foreground">
            Upload and manage security questionnaires with AI-generated answers
          </p>
        </div>
        <QuestionnaireUploadButton organizationId={organizationId} />
      </div>

      {questionnaires.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No questionnaires yet</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Upload a security questionnaire to automatically detect questions
              and generate AI-powered answers.
            </p>
            <QuestionnaireUploadButton organizationId={organizationId} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {questionnaires.map((q) => {
            const progress =
              q.totalQuestions > 0
                ? Math.round((q.answeredCount / q.totalQuestions) * 100)
                : 0;
            return (
              <Card key={q.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <Link
                        href={`/dashboard/questionnaires/${q.id}`}
                        className="text-lg font-semibold hover:text-primary"
                      >
                        {q.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {q.project?.name && `${q.project.name} · `}
                        Updated {formatDistanceToNow(q.updatedAt, { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant={statusVariant(q.status)}>{q.status}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>
                        {q.answeredCount} / {q.totalQuestions} answered
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/questionnaires/${q.id}`}>
                        View Details
                      </Link>
                    </Button>
                    {q.status === "DRAFT" && q.totalQuestions === 0 && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/questionnaires/${q.id}/parse`}>
                          Parse Questions
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
