import { TrendingUp, Clock, DollarSign, Target, BarChart2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const kpis = [
  {
    title: "Total Questions Answered",
    value: "1,847",
    change: "+12% vs last month",
    trend: "up",
    icon: Target,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Time Saved (Est.)",
    value: "284 hrs",
    change: "This year",
    trend: "up",
    icon: Clock,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    title: "Revenue Protected",
    value: "$2.4M",
    change: "From deals accelerated",
    trend: "up",
    icon: DollarSign,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    title: "AI Acceptance Rate",
    value: "87%",
    change: "Answers used as-is",
    trend: "up",
    icon: TrendingUp,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
];

const monthlyData = [
  { month: "Feb", questions: 82, timeSaved: 18 },
  { month: "Mar", questions: 124, timeSaved: 27 },
  { month: "Apr", questions: 156, timeSaved: 34 },
  { month: "May", questions: 198, timeSaved: 43 },
  { month: "Jun", questions: 245, timeSaved: 54 },
  { month: "Jul", questions: 312, timeSaved: 68 },
];

const topQuestionTypes = [
  { category: "Access Control & Authentication", count: 342, percentage: 85 },
  { category: "Data Encryption", count: 289, percentage: 72 },
  { category: "Incident Response", count: 234, percentage: 58 },
  { category: "Vulnerability Management", count: 198, percentage: 49 },
  { category: "Business Continuity", count: 187, percentage: 47 },
  { category: "Cloud Security", count: 156, percentage: 39 },
  { category: "Third Party Risk", count: 134, percentage: 33 },
  { category: "Privacy & GDPR", count: 107, percentage: 27 },
];

const completionTimes = [
  { size: "Small (1-50 questions)", avg: "2.4 hrs", baseline: "3 days", savings: "94%" },
  { size: "Medium (51-150 questions)", avg: "4.8 hrs", baseline: "1 week", savings: "86%" },
  { size: "Large (151-500 questions)", avg: "9.2 hrs", baseline: "3 weeks", savings: "93%" },
  { size: "Enterprise (500+)", avg: "16 hrs", baseline: "6 weeks", savings: "95%" },
];

export default function AnalyticsPage() {
  const maxCount = Math.max(...monthlyData.map((d) => d.questions));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Understand your AI performance and business impact
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="border-border/60">
            <CardContent className="p-5">
              <div
                className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}
              >
                <kpi.icon className={`w-4.5 h-4.5 ${kpi.color}`} />
              </div>
              <div className="text-3xl font-bold">{kpi.value}</div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">
                {kpi.title}
              </div>
              <div className="text-xs text-muted-foreground/60 mt-0.5">
                {kpi.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly chart */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              Monthly Questions Answered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {monthlyData.map((d) => (
                <div
                  key={d.month}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="text-xs text-muted-foreground font-medium">
                    {d.questions}
                  </div>
                  <div
                    className="w-full rounded-t-sm bg-primary/80"
                    style={{
                      height: `${(d.questions / maxCount) * 120}px`,
                    }}
                  />
                  <div className="text-[11px] text-muted-foreground">
                    {d.month}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Completion time comparison */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Completion Time vs. Manual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {completionTimes.map((item) => (
              <div key={item.size} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{item.size}</span>
                  <span className="text-green-600 font-semibold">
                    {item.savings} faster
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-20 shrink-0">AI: {item.avg}</span>
                  <Progress value={parseInt(item.savings)} className="flex-1 h-1.5" />
                  <span className="w-20 text-right shrink-0">
                    Manual: {item.baseline}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top question categories */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Top Question Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topQuestionTypes.map((item) => (
            <div key={item.category} className="flex items-center gap-4">
              <div className="w-48 text-sm shrink-0">{item.category}</div>
              <div className="flex-1">
                <Progress value={item.percentage} className="h-2" />
              </div>
              <div className="text-sm text-muted-foreground w-16 text-right">
                {item.count}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
