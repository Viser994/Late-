import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Calendar, User2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QuestionnaireStatusBadge } from "@/components/app/status-badge";
import { getQuestionnaires } from "@/lib/data";
import { formatPercent, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Questionnaires" };

export default async function QuestionnairesPage() {
  const questionnaires = await getQuestionnaires();
  return (
    <>
      <PageHeader
        title="Questionnaires"
        description="Security questionnaires, vendor assessments, and RFP security responses."
        actions={
          <Button asChild>
            <Link href="/questionnaires/new">
              <Plus className="h-4 w-4" /> New questionnaire
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {questionnaires.map((q) => {
          const progress = q.totalQuestions ? Math.round((q.answered / q.totalQuestions) * 100) : 0;
          return (
            <Link key={q.id} href={`/questionnaires/${q.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-snug">{q.title}</h3>
                    <QuestionnaireStatusBadge status={q.status} />
                  </div>
                  {q.project && <p className="mt-1 text-xs text-muted-foreground">{q.project}</p>}

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {q.answered}/{q.totalQuestions} answered
                      </span>
                      <span>{formatPercent(progress)}</span>
                    </div>
                    <Progress value={progress} />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User2 className="h-3.5 w-3.5" /> {q.requester ?? "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {q.dueDate ? `Due ${timeAgo(q.dueDate)}` : "No due date"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
