import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { QuestionnaireStatusBadge } from "@/components/app/status-badge";
import { QuestionnaireWorkspace } from "@/components/app/questionnaire-workspace";
import { getQuestionnaire, getQuestions } from "@/lib/data";

export const metadata: Metadata = { title: "Questionnaire" };

export default async function QuestionnaireDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [questionnaire, questions] = await Promise.all([getQuestionnaire(id), getQuestions(id)]);

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/questionnaires">
          <ArrowLeft className="h-4 w-4" /> Back to questionnaires
        </Link>
      </Button>
      <PageHeader
        title={questionnaire.title}
        description={questionnaire.requester ? `Requested by ${questionnaire.requester}` : undefined}
        actions={<QuestionnaireStatusBadge status={questionnaire.status} />}
      />
      <QuestionnaireWorkspace questions={questions} />
    </>
  );
}
