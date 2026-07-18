import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BarChart3, FileText, Gauge, ShieldCheck, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const dashboardStats = [
  { title: "Total Questionnaires", value: "248", icon: FileText },
  { title: "Completed", value: "182", icon: ShieldCheck },
  { title: "In Progress", value: "51", icon: Gauge },
  { title: "Pending Review", value: "15", icon: Users },
  { title: "AI Accuracy", value: "93.4%", icon: BarChart3 },
  { title: "Estimated Hours Saved", value: "1,742", icon: Gauge },
];

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8 lg:px-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-300">
          Operational visibility across questionnaires, AI confidence, compliance readiness, and team throughput.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dashboardStats.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="pb-3">
              <CardDescription>{metric.title}</CardDescription>
              <CardTitle className="flex items-center justify-between text-2xl">
                {metric.value}
                <metric.icon className="h-5 w-5 text-zinc-500" />
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team activity</CardTitle>
            <CardDescription>Recent operations from security and sales engineering workflows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>• Jackson approved 28 AI answers in Q3 vendor assessment.</p>
            <p>• Priya uploaded ISO 27001 Statement of Applicability.</p>
            <p>• Marta requested review for payment security controls.</p>
            <p>• New questionnaire imported: Enterprise Buyer Security DDQ v7.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Compliance center</CardTitle>
            <CardDescription>Coverage snapshot across major frameworks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>• SOC 2: 89% controls mapped.</p>
            <p>• ISO 27001: 83% clauses covered.</p>
            <p>• HIPAA: 71% safeguard evidence linked.</p>
            <p>• GDPR: 76% articles with documented controls.</p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
