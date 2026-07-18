import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function KnowledgeBasePage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Knowledge base</CardTitle>
          <CardDescription>
            Store security documents, run chunking + embeddings, and power semantic search with strict citations.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-zinc-600 dark:text-zinc-300">
          Document ingestion currently supports PDF, DOCX, CSV, XLS/XLSX, TXT, and Markdown text extraction.
        </CardContent>
      </Card>
    </main>
  );
}
