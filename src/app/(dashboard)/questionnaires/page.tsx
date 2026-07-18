import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  ClipboardList,
  Calendar,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const questionnaires = [
  {
    id: "1",
    name: "Acme Corp Security Assessment",
    company: "Acme Corporation",
    status: "IN_PROGRESS",
    totalQuestions: 85,
    answeredCount: 61,
    approvedCount: 45,
    dueDate: "Jul 25, 2026",
    createdAt: "Jul 10, 2026",
    frameworks: ["SOC 2", "ISO 27001"],
  },
  {
    id: "2",
    name: "Enterprise DDQ - GlobalBank",
    company: "GlobalBank Financial",
    status: "REVIEW",
    totalQuestions: 120,
    answeredCount: 114,
    approvedCount: 108,
    dueDate: "Jul 20, 2026",
    createdAt: "Jul 5, 2026",
    frameworks: ["SOC 2", "GDPR"],
  },
  {
    id: "3",
    name: "ISO 27001 Vendor Assessment",
    company: "ISO Systems Ltd",
    status: "COMPLETED",
    totalQuestions: 65,
    answeredCount: 65,
    approvedCount: 65,
    dueDate: "Jul 18, 2026",
    createdAt: "Jun 28, 2026",
    frameworks: ["ISO 27001"],
  },
  {
    id: "4",
    name: "HIPAA Compliance Questionnaire",
    company: "MedCorp Healthcare",
    status: "DRAFT",
    totalQuestions: 0,
    answeredCount: 0,
    approvedCount: 0,
    dueDate: "Aug 1, 2026",
    createdAt: "Jul 18, 2026",
    frameworks: ["HIPAA"],
  },
  {
    id: "5",
    name: "PCI DSS SAQ-D Assessment",
    company: "RetailChain Pro",
    status: "IN_PROGRESS",
    totalQuestions: 200,
    answeredCount: 88,
    approvedCount: 72,
    dueDate: "Aug 10, 2026",
    createdAt: "Jul 15, 2026",
    frameworks: ["PCI DSS"],
  },
  {
    id: "6",
    name: "Cloud Security RFP",
    company: "CloudVentures",
    status: "COMPLETED",
    totalQuestions: 45,
    answeredCount: 45,
    approvedCount: 45,
    dueDate: "Jul 12, 2026",
    createdAt: "Jun 20, 2026",
    frameworks: ["Custom"],
  },
];

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PROCESSING: { label: "Processing", variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  REVIEW: { label: "Review", variant: "outline" },
  COMPLETED: { label: "Completed", variant: "default" },
  ARCHIVED: { label: "Archived", variant: "secondary" },
};

export default function QuestionnairesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Questionnaires</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all your security questionnaires and DDQs
          </p>
        </div>
        <Button asChild>
          <Link href="/questionnaires/new">
            <Plus className="w-4 h-4 mr-2" />
            New Questionnaire
          </Link>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total", value: questionnaires.length, color: "text-foreground" },
          {
            label: "In Progress",
            value: questionnaires.filter((q) => q.status === "IN_PROGRESS").length,
            color: "text-blue-500",
          },
          {
            label: "Review",
            value: questionnaires.filter((q) => q.status === "REVIEW").length,
            color: "text-orange-500",
          },
          {
            label: "Completed",
            value: questionnaires.filter((q) => q.status === "COMPLETED").length,
            color: "text-green-500",
          },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4 text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Search questionnaires..." className="pl-9" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {/* Questionnaire list */}
      <div className="space-y-3">
        {questionnaires.map((q) => {
          const status = statusConfig[q.status];
          const progress =
            q.totalQuestions > 0
              ? Math.round((q.answeredCount / q.totalQuestions) * 100)
              : 0;

          return (
            <Link key={q.id} href={`/questionnaires/${q.id}`}>
              <Card className="border-border/60 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-5 h-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-sm truncate">
                          {q.name}
                        </h3>
                        <Badge variant={status.variant} className="shrink-0 text-xs">
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{q.company}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due {q.dueDate}
                        </span>
                        <div className="flex gap-1">
                          {q.frameworks.map((f) => (
                            <span
                              key={f}
                              className="px-1.5 py-0.5 rounded bg-muted text-[10px]"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {q.totalQuestions > 0 && (
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {q.answeredCount}/{q.totalQuestions}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            questions
                          </div>
                          <Progress
                            value={progress}
                            className="h-1 mt-1 w-24"
                          />
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.preventDefault()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
