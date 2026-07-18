import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { NewQuestionnaireForm } from "@/components/app/new-questionnaire-form";

export const metadata: Metadata = { title: "New questionnaire" };

export default function NewQuestionnairePage() {
  return (
    <>
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/questionnaires">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </Button>
      <PageHeader
        title="New questionnaire"
        description="Upload a questionnaire and we'll detect sections, questions, and answer formats automatically."
      />
      <NewQuestionnaireForm />
    </>
  );
}
