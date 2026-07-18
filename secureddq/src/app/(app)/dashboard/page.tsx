import Link from "next/link";
import {
  FileStack,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  Target,
  Timer,
  ShieldCheck,
  Library,
  DollarSign,
  Plus,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DocumentStatusBadge } from "@/components/app/status-badge";
import { getDashboardMetrics, getFrameworkCoverage, getRecentActivity, getRecentUploads } from "@/lib/data";
import { FRAMEWORK_LABELS } from "@/lib/constants";
import { formatCompact, formatCurrency, formatPercent, initials, timeAgo } from "@/lib/utils";

export default async function DashboardPage() {
  const [metrics, activity, uploads, coverage] = await Promise.all([
    getDashboardMetrics(),
    getRecentActivity(),
    getRecentUploads(),
    getFrameworkCoverage(),
  ]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Your security questionnaire program at a glance."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/documents">
                <Upload className="h-4 w-4" /> Upload
              </Link>
            </Button>
            <Button asChild>
              <Link href="/questionnaires/new">
                <Plus className="h-4 w-4" /> New questionnaire
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total questionnaires" value={String(metrics.totalQuestionnaires)} icon={FileStack} trend={{ value: "+12%", positive: true }} />
        <StatCard label="Completed" value={String(metrics.completed)} icon={CheckCircle2} hint={`${metrics.inProgress} in progress`} />
        <StatCard label="In progress" value={String(metrics.inProgress)} icon={Clock3} />
        <StatCard label="Pending review" value={String(metrics.pendingReview)} icon={ClipboardCheck} hint="Awaiting approval" />
        <StatCard label="AI accuracy" value={formatPercent(metrics.aiAccuracy, 1)} icon={Target} trend={{ value: "+2.1%", positive: true }} />
        <StatCard label="Hours saved" value={formatCompact(metrics.hoursSaved)} icon={Timer} hint="This quarter" />
        <StatCard label="Revenue protected" value={formatCurrency(metrics.revenueProtected * 100)} icon={DollarSign} hint="Deals unblocked" />
        <StatCard label="Knowledge base" value={`${metrics.knowledgeBaseSize} docs`} icon={Library} trend={{ value: "+9", positive: true }} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Compliance coverage</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/compliance">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {coverage.map((c) => (
              <div key={c.framework}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{FRAMEWORK_LABELS[c.framework]}</span>
                  <span className="text-muted-foreground">
                    {c.implemented}/{c.total} controls · {c.coverage}%
                  </span>
                </div>
                <Progress value={c.coverage} indicatorClassName={c.coverage >= 80 ? "bg-success" : c.coverage >= 50 ? "bg-warning" : "bg-destructive"} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Overall readiness</CardTitle>
            <ShieldCheck className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-4">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(metrics.complianceCoverage / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                  />
                </svg>
                <span className="absolute text-2xl font-bold">{metrics.complianceCoverage}%</span>
              </div>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Compliance coverage across all mapped frameworks.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activity.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials(item.actor)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{item.actor}</span>{" "}
                    <span className="text-muted-foreground">{item.verb}</span> {item.summary}
                  </p>
                  <p className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent uploads</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/documents">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploads.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Library className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">Updated {timeAgo(doc.updatedAt)}</p>
                  </div>
                </div>
                <DocumentStatusBadge status={doc.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
