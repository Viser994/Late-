import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardList,
  FileText,
  Clock,
  TrendingUp,
  Shield,
  CheckCircle2,
  AlertCircle,
  Upload,
} from "lucide-react";
import { HOURS_SAVED_PER_QUESTION, AVG_DEAL_VALUE } from "@/lib/constants";
import { formatDistanceToNow } from "date-fns";

async function getDashboardStats(organizationId: string) {
  const [
    questionnaires,
    documents,
    members,
    activityLogs,
    complianceControls,
    recentUploads,
  ] = await Promise.all([
    db.questionnaire.findMany({
      where: { organizationId },
      select: { status: true, totalQuestions: true, answeredCount: true },
    }),
    db.document.count({ where: { organizationId, archivedAt: null } }),
    db.organizationMember.count({ where: { organizationId } }),
    db.activityLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
    db.complianceControl.findMany({ where: { organizationId } }),
    db.document.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, status: true, createdAt: true },
    }),
  ]);

  const total = questionnaires.length;
  const completed = questionnaires.filter((q) => q.status === "COMPLETED").length;
  const inProgress = questionnaires.filter((q) => q.status === "IN_PROGRESS").length;
  const pendingReview = questionnaires.filter((q) => q.status === "PENDING_REVIEW").length;

  const totalAnswered = questionnaires.reduce((sum, q) => sum + q.answeredCount, 0);
  const hoursSaved = Math.round(totalAnswered * HOURS_SAVED_PER_QUESTION);
  const revenueProtected = completed * AVG_DEAL_VALUE;

  const coveredControls = complianceControls.filter(
    (c) => c.status === "COVERED"
  ).length;
  const complianceCoverage =
    complianceControls.length > 0
      ? Math.round((coveredControls / complianceControls.length) * 100)
      : 0;

  return {
    total,
    completed,
    inProgress,
    pendingReview,
    documents,
    members,
    hoursSaved,
    revenueProtected,
    complianceCoverage,
    aiAccuracy: 87,
    activityLogs,
    recentUploads,
  };
}

export default async function DashboardPage() {
  const { organizationId } = await requireAuth();
  const stats = await getDashboardStats(organizationId);

  const statCards = [
    {
      title: "Total Questionnaires",
      value: stats.total,
      icon: ClipboardList,
      description: `${stats.completed} completed`,
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      icon: Clock,
      description: `${stats.pendingReview} pending review`,
    },
    {
      title: "Hours Saved",
      value: stats.hoursSaved,
      icon: TrendingUp,
      description: "Estimated time savings",
    },
    {
      title: "Knowledge Base",
      value: stats.documents,
      icon: FileText,
      description: `${stats.members} team members`,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your security questionnaire automation
        </p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>AI Accuracy</span>
                <span className="font-medium">{stats.aiAccuracy}%</span>
              </div>
              <Progress value={stats.aiAccuracy} />
            </div>
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Compliance Coverage</span>
                <span className="font-medium">{stats.complianceCoverage}%</span>
              </div>
              <Progress value={stats.complianceCoverage} />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Revenue Protected</p>
                <p className="text-2xl font-bold">
                  ${(stats.revenueProtected / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{stats.pendingReview}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Recent Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentUploads.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No documents uploaded yet
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentUploads.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="truncate">
                      <p className="font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(doc.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                    <Badge
                      variant={
                        doc.status === "READY"
                          ? "success"
                          : doc.status === "FAILED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Team Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.activityLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent activity. Upload documents or create a questionnaire to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {stats.activityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  {log.action.includes("approve") ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 text-primary" />
                  )}
                  <div>
                    <p className="text-sm">{log.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.user
                        ? `${log.user.firstName ?? ""} ${log.user.lastName ?? ""}`.trim()
                        : "System"}{" "}
                      · {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
