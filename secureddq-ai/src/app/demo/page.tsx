import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  LayoutDashboard,
  FileText,
  ClipboardList,
  MessageSquare,
  BarChart3,
  Scale,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const stats = [
  { title: "Total Questionnaires", value: "24", sub: "18 completed" },
  { title: "In Progress", value: "4", sub: "2 pending review" },
  { title: "Hours Saved", value: "312", sub: "Estimated time savings" },
  { title: "Knowledge Base", value: "87", sub: "12 team members" },
];

const recentActivity = [
  { text: "SOC 2 Type II Report processed into 142 chunks", time: "2 hours ago" },
  { text: "Acme Corp DDQ — 48 answers generated", time: "5 hours ago" },
  { text: "Information Security Policy uploaded", time: "1 day ago" },
  { text: "12 answers approved by Security Manager", time: "2 days ago" },
];

const sampleAnswers = [
  {
    question: "Do you encrypt data at rest?",
    answer:
      "Yes. All customer data at rest is encrypted using AES-256. Database volumes and object storage are encrypted with keys managed through AWS KMS with automatic annual rotation.",
    confidence: 94,
    sources: ["Data Encryption Policy", "SOC 2 Type II Report"],
    status: "APPROVED",
  },
  {
    question: "Describe your incident response process.",
    answer:
      "We maintain a documented Incident Response Plan (IRP) aligned with NIST SP 800-61. Incidents are classified P1–P4 with defined escalation paths. Security incidents are reported to customers within 72 hours per contractual obligations.",
    confidence: 88,
    sources: ["Incident Response Plan", "Security Operations Manual"],
    status: "EDITED",
  },
  {
    question: "Is multi-factor authentication enforced for all users?",
    answer:
      "MFA is enforced for all employees via Okta. Customer-facing applications support TOTP and WebAuthn. Administrative access to production systems requires hardware security keys.",
    confidence: 72,
    sources: ["Access Control Policy"],
    status: "DRAFT",
    uncertain: true,
  },
];

const nav = [
  { name: "Dashboard", icon: LayoutDashboard, active: true },
  { name: "Documents", icon: FileText },
  { name: "Questionnaires", icon: ClipboardList },
  { name: "AI Chat", icon: MessageSquare },
  { name: "Compliance", icon: Scale },
  { name: "Analytics", icon: BarChart3 },
  { name: "Search", icon: Search },
];

export default function DemoPage() {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-semibold">{APP_NAME}</span>
        </div>
        <div className="border-b p-4">
          <div className="rounded-lg bg-muted px-3 py-2 text-sm font-medium">
            Acme Security Corp
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map((item) => (
            <div
              key={item.name}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                item.active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </div>
          ))}
        </nav>
        <div className="border-t p-4">
          <Badge variant="warning" className="w-full justify-center">
            Demo Mode
          </Badge>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-muted/20">
        <div className="border-b bg-amber-500/10 px-6 py-3 text-center text-sm">
          <strong>Live Demo</strong> — Sample data shown.{" "}
          <Link href="/" className="text-primary underline">
            Configure production services
          </Link>{" "}
          to enable full functionality.
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">
                Security questionnaire automation overview
              </p>
            </div>
            <Button>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Answers
            </Button>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
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
                    <span className="font-medium">91%</span>
                  </div>
                  <Progress value={91} />
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>Compliance Coverage</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <Progress value={78} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivity.map((item) => (
                  <div key={item.text} className="text-sm">
                    <p>{item.text}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sample AI-Generated Answers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {sampleAnswers.map((item) => (
                <div key={item.question} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <p className="font-medium">{item.question}</p>
                    <Badge variant="outline">{item.status}</Badge>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {item.answer}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-muted-foreground">
                      Confidence: <strong>{item.confidence}%</strong>
                    </span>
                    {item.uncertain && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <AlertTriangle className="h-3 w-3" />
                        Needs review
                      </span>
                    )}
                    {item.sources.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        <FileText className="mr-1 h-3 w-3" />
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/">View Landing Page</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/sign-up">Set Up Production Account</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
