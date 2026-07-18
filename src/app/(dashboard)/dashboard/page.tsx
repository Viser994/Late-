import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Eye,
  TrendingUp,
  FileText,
  Shield,
  Zap,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

const stats = [
  {
    title: "Total Questionnaires",
    value: "24",
    change: "+3 this month",
    icon: ClipboardList,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Completed",
    value: "18",
    change: "75% completion rate",
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    title: "In Progress",
    value: "4",
    change: "2 due this week",
    icon: Clock,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    title: "Pending Review",
    value: "2",
    change: "Action required",
    icon: Eye,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
];

const metricsCards = [
  {
    title: "AI Accuracy",
    value: "96%",
    description: "Last 30 days",
    icon: Zap,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    progress: 96,
  },
  {
    title: "Hours Saved",
    value: "284h",
    description: "Est. this year",
    icon: TrendingUp,
    color: "text-green-500",
    bg: "bg-green-500/10",
    progress: 71,
  },
  {
    title: "Knowledge Base",
    value: "47 docs",
    description: "128K chunks indexed",
    icon: FileText,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    progress: 47,
  },
  {
    title: "Compliance Coverage",
    value: "84%",
    description: "Across 3 frameworks",
    icon: Shield,
    color: "text-red-500",
    bg: "bg-red-500/10",
    progress: 84,
  },
];

const recentQuestionnaires = [
  {
    id: "1",
    name: "Acme Corp Security Assessment",
    company: "Acme Corp",
    status: "IN_PROGRESS",
    progress: 72,
    questions: 85,
    dueDate: "Jul 25, 2026",
  },
  {
    id: "2",
    name: "Enterprise DDQ - GlobalBank",
    company: "GlobalBank",
    status: "REVIEW",
    progress: 95,
    questions: 120,
    dueDate: "Jul 20, 2026",
  },
  {
    id: "3",
    name: "ISO 27001 Vendor Assessment",
    company: "ISO Systems",
    status: "COMPLETED",
    progress: 100,
    questions: 65,
    dueDate: "Jul 18, 2026",
  },
  {
    id: "4",
    name: "HIPAA Compliance Check",
    company: "MedCorp",
    status: "DRAFT",
    progress: 0,
    questions: 0,
    dueDate: "Aug 1, 2026",
  },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PROCESSING: { label: "Processing", variant: "secondary" },
  IN_PROGRESS: { label: "In Progress", variant: "default" },
  REVIEW: { label: "Review", variant: "outline" },
  COMPLETED: { label: "Completed", variant: "default" },
  ARCHIVED: { label: "Archived", variant: "secondary" },
};

const recentActivity = [
  { action: "AI generated answers for", target: "Acme Corp Assessment", time: "2 hours ago", icon: Zap },
  { action: "Document uploaded:", target: "Security Policy v3.2.pdf", time: "4 hours ago", icon: FileText },
  { action: "Answer approved in", target: "GlobalBank DDQ", time: "Yesterday", icon: CheckCircle2 },
  { action: "New questionnaire:", target: "HIPAA Compliance Check", time: "Yesterday", icon: ClipboardList },
  { action: "Knowledge base indexed:", target: "SOC 2 Report 2026", time: "2 days ago", icon: FileText },
];

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back. Here&apos;s your security questionnaire overview.
          </p>
        </div>
        <Button asChild>
          <Link href="/questionnaires/new">
            <ClipboardList className="w-4 h-4 mr-2" />
            New Questionnaire
          </Link>
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}
                >
                  <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-xs font-medium text-muted-foreground mb-0.5">
                {stat.title}
              </div>
              <div className="text-xs text-muted-foreground/70">
                {stat.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsCards.map((metric) => (
          <Card key={metric.title} className="border-border/60">
            <CardContent className="p-5">
              <div
                className={`w-9 h-9 rounded-lg ${metric.bg} flex items-center justify-center mb-3`}
              >
                <metric.icon className={`w-4.5 h-4.5 ${metric.color}`} />
              </div>
              <div className="text-2xl font-bold mb-0.5">{metric.value}</div>
              <div className="text-xs text-muted-foreground mb-3">
                {metric.title} · {metric.description}
              </div>
              <Progress value={metric.progress} className="h-1.5" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Questionnaires */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Recent Questionnaires
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/questionnaires">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {recentQuestionnaires.map((q) => {
                const status = statusConfig[q.status];
                return (
                  <Link
                    key={q.id}
                    href={`/questionnaires/${q.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {q.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {q.company} · Due {q.dueDate}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {q.progress > 0 && (
                        <div className="text-xs text-muted-foreground w-16 text-right">
                          {q.progress}%
                        </div>
                      )}
                      <Badge variant={status.variant} className="text-xs">
                        {status.label}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs leading-relaxed">
                    <span className="text-muted-foreground">{item.action}</span>{" "}
                    <span className="font-medium text-foreground">
                      {item.target}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground/60 mt-0.5">
                    {item.time}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
