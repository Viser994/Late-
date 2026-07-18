import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function QuestionnairesPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Questionnaire automation</CardTitle>
          <CardDescription>
            Upload DOCX/XLSX/PDF questionnaires, detect sections and fields, then generate evidence-backed responses.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-zinc-600 dark:text-zinc-300">
          The upload parser, answer generation engine, and human review workflow are implemented as modular APIs ready
          to connect to storage providers and background pipelines.
        </CardContent>
      </Card>
    </main>
  );
}
