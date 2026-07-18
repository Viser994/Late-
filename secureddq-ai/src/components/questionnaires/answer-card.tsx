import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText } from "lucide-react";
import type { Question, Answer, Evidence, QuestionSection } from "@prisma/client";

type AnswerWithEvidence = Answer & {
  evidence: (Evidence & { document: { name: string } })[];
};

interface AnswerCardProps {
  questionNumber: number;
  question: Question & {
    section: QuestionSection | null;
    answers: AnswerWithEvidence[];
  };
  answer: AnswerWithEvidence | null;
}

export function AnswerCard({ questionNumber, question, answer }: AnswerCardProps) {
  const confidence = answer?.confidence ? Math.round(answer.confidence * 100) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            {question.section && (
              <p className="mb-1 text-xs font-medium text-primary">
                {question.section.title}
              </p>
            )}
            <p className="text-sm font-medium text-muted-foreground">
              Question {questionNumber}
            </p>
            <p className="mt-1 font-medium">{question.text}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Badge variant="outline">{question.questionType}</Badge>
            {answer && <Badge variant="secondary">{answer.status}</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {answer ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="whitespace-pre-wrap text-sm">{answer.content}</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {confidence !== null && (
                <span className="text-muted-foreground">
                  Confidence: <strong>{confidence}%</strong>
                </span>
              )}
              {answer.isUncertain && (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  Needs review
                </span>
              )}
            </div>
            {answer.evidence.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Sources
                </p>
                <div className="space-y-2">
                  {answer.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-start gap-2 rounded border p-3 text-sm"
                    >
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="font-medium">{ev.document.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {ev.excerpt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No answer generated yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
