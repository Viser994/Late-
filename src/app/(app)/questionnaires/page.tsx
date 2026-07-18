import { FileUp, RefreshCw, ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { questionnaireRows } from "@/lib/demo-data";

export default function QuestionnairesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Questionnaire automation"
        title="Questionnaires"
        description="Upload PDFs, spreadsheets, Word documents, and CSVs; detect questions, fields, sections, choices, required status, and generate evidence-backed answers."
        action={
          <Button>
            <FileUp className="h-4 w-4" />
            Upload questionnaire
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Active projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {questionnaireRows.map((row) => (
            <div key={row.name} className="rounded-2xl border bg-background p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{row.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.questions} questions - Due {row.due}
                  </p>
                </div>
                <Badge
                  variant={row.status === "Approved" ? "success" : "warning"}
                >
                  {row.status}
                </Badge>
              </div>
              <div className="mt-4 h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${row.progress}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {[
          ["Human review", "Draft, edited, approved, rejected, comments, mentions, and audit trail.", ShieldAlert],
          ["Regeneration", "Try concise, technical, customer-ready, or risk-assessment styles.", RefreshCw],
          ["Exports", "Return approved answers to Excel, Word, and PDF packages.", FileUp]
        ].map(([title, description, Icon]) => (
          <Card key={String(title)}>
            <CardContent className="p-6">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-semibold">{String(title)}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {String(description)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
