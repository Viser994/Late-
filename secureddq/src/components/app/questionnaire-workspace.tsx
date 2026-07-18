"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Sparkles,
  Check,
  X,
  RefreshCw,
  FileText,
  ChevronDown,
  MessageSquare,
  Download,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnswerStatusBadge } from "@/components/app/status-badge";
import { generateAnswerForQuestion } from "@/lib/actions/answers";
import type { QuestionView } from "@/lib/data/types";
import type { AnswerStatus, AnswerStyle } from "@prisma/client";
import { cn, formatPercent } from "@/lib/utils";

type QState = QuestionView & { expanded: boolean; regenerating: boolean };

function confidenceColor(c: number | null) {
  if (c === null) return "text-muted-foreground";
  if (c >= 0.85) return "text-success";
  if (c >= 0.6) return "text-warning";
  return "text-destructive";
}

export function QuestionnaireWorkspace({ questions: initial }: { questions: QuestionView[] }) {
  const [questions, setQuestions] = useState<QState[]>(
    initial.map((q) => ({ ...q, expanded: false, regenerating: false }))
  );
  const [style, setStyle] = useState<AnswerStyle>("DETAILED");
  const [, startTransition] = useTransition();

  const stats = useMemo(() => {
    const total = questions.length;
    const answered = questions.filter((q) => q.answer.content).length;
    const approved = questions.filter((q) => q.answer.status === "APPROVED").length;
    const lowConfidence = questions.filter((q) => (q.answer.confidence ?? 0) < 0.6).length;
    return { total, answered, approved, lowConfidence, progress: total ? Math.round((answered / total) * 100) : 0 };
  }, [questions]);

  const update = (id: string, patch: Partial<QState> | ((q: QState) => Partial<QState>)) =>
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...(typeof patch === "function" ? patch(q) : patch) } : q))
    );

  const updateAnswer = (id: string, patch: Partial<QuestionView["answer"]>) =>
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, answer: { ...q.answer, ...patch } } : q)));

  const regenerate = (q: QState) => {
    update(q.id, { regenerating: true });
    startTransition(async () => {
      const result = await generateAnswerForQuestion(q.prompt, style);
      updateAnswer(q.id, {
        content: result.content,
        confidence: result.confidence,
        status: "GENERATED",
        aiGenerated: true,
        citations: result.citations,
      });
      update(q.id, { regenerating: false });
      toast.success("Answer regenerated", { description: `Confidence ${formatPercent((result.confidence ?? 0) * 100)}` });
    });
  };

  const generateAll = () => {
    toast.info("Generating answers for all questions…");
    questions.forEach((q) => regenerate(q));
  };

  const setStatus = (id: string, status: AnswerStatus) => {
    updateAnswer(id, { status });
    toast.success(`Answer ${status.toLowerCase()}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Metric label="Questions" value={String(stats.total)} />
            <Metric label="Answered" value={`${stats.answered}/${stats.total}`} />
            <Metric label="Approved" value={String(stats.approved)} />
            <Metric label="Low confidence" value={String(stats.lowConfidence)} danger={stats.lowConfidence > 0} />
          </div>
          <div className="flex items-center gap-2">
            <Select value={style} onValueChange={(v) => setStyle(v as AnswerStyle)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONCISE">Concise</SelectItem>
                <SelectItem value="DETAILED">Detailed</SelectItem>
                <SelectItem value="FORMAL">Formal</SelectItem>
                <SelectItem value="TECHNICAL">Technical</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => toast.info("Export queued", { description: "Excel / Word / PDF export with original formatting." })}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button onClick={generateAll}>
              <Wand2 className="h-4 w-4" /> Generate all
            </Button>
          </div>
        </CardContent>
      </Card>

      <Progress value={stats.progress} />

      <div className="space-y-3">
        {questions.map((q, i) => (
          <Card key={q.id} className={cn((q.answer.confidence ?? 1) < 0.6 && "border-warning/50")}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {q.section} · Q{i + 1}
                    </span>
                    {q.required && <Badge variant="outline" className="text-[10px]">Required</Badge>}
                  </div>
                  <p className="mt-1 font-medium">{q.prompt}</p>
                </div>
                <div className="flex items-center gap-2">
                  {q.answer.confidence !== null && (
                    <span className={cn("text-xs font-semibold", confidenceColor(q.answer.confidence))}>
                      {formatPercent(q.answer.confidence * 100)}
                    </span>
                  )}
                  <AnswerStatusBadge status={q.answer.status} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => update(q.id, (p) => ({ expanded: !p.expanded }))}>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", q.expanded && "rotate-180")} />
                  </Button>
                </div>
              </div>

              {!q.expanded && q.answer.content && (
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{q.answer.content}</p>
              )}

              {q.expanded && (
                <div className="mt-4 space-y-4">
                  <Textarea
                    value={q.answer.content}
                    onChange={(e) => updateAnswer(q.id, { content: e.target.value, status: "EDITED" })}
                    rows={4}
                    placeholder="No answer yet — generate one with AI or write it here."
                  />

                  {q.answer.citations.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Sources</p>
                      {q.answer.citations.map((c, ci) => (
                        <div key={ci} className="flex items-start gap-2 rounded-lg border bg-muted/30 p-2 text-xs">
                          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{c.documentTitle}</span>
                              <span className="text-muted-foreground">{formatPercent(c.relevance * 100)} match</span>
                            </div>
                            <p className="text-muted-foreground">“{c.quote}”</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => regenerate(q)} disabled={q.regenerating}>
                      {q.regenerating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Regenerate
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setStatus(q.id, "APPROVED")}>
                      <Check className="h-3.5 w-3.5 text-success" /> Approve
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setStatus(q.id, "REJECTED")}>
                      <X className="h-3.5 w-3.5 text-destructive" /> Reject
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => toast.info("Comments", { description: "Threaded comments and @mentions." })}>
                      <MessageSquare className="h-3.5 w-3.5" /> Comment
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-semibold", danger && "text-warning")}>{value}</p>
    </div>
  );
}
