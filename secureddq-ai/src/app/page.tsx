import Link from "next/link";
import { ArrowRight, CheckCircle2, Shield, Sparkles, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "AI-backed questionnaire completion",
    description: "Auto-detects questions, drafts accurate responses, and cites policy evidence.",
    icon: Sparkles,
  },
  {
    title: "Enterprise knowledge base",
    description: "Upload SOC 2, ISO, policies, pen tests, and architecture docs with versioning.",
    icon: Upload,
  },
  {
    title: "Compliance visibility",
    description: "Track SOC 2, ISO 27001, HIPAA, GDPR, and NIST control coverage in one place.",
    icon: Shield,
  },
];

const pricing = [
  { name: "Free", price: "$0", subtitle: "Great for evaluation", features: ["2 users", "10 documents", "1 questionnaire / month"] },
  {
    name: "Starter",
    price: "$49/mo",
    subtitle: "For growing security teams",
    features: ["5 users", "100 documents", "Unlimited questionnaires", "AI chat"],
  },
  {
    name: "Professional",
    price: "$199/mo",
    subtitle: "For scaling GTM organizations",
    features: ["Unlimited users", "Advanced AI", "Approvals + analytics", "API access"],
  },
  { name: "Enterprise", price: "Custom", subtitle: "For highly regulated companies", features: ["SSO", "SLA", "Private cloud", "Dedicated onboarding"] },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col px-6 py-10 lg:px-8">
      <header className="mb-20 flex items-center justify-between">
        <div className="text-xl font-semibold tracking-tight">SecureDDQ AI</div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Start free trial</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-10 rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:grid-cols-2">
        <div className="space-y-6">
          <Badge className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">AI for Security Questionnaires</Badge>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Complete cybersecurity DDQs in minutes, not weeks.
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-300">
            Build a trusted AI knowledge base from your policies and evidence. Generate high-confidence responses with citations,
            approval workflows, and compliance mapping.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <Link href="/dashboard">
                Book a demo <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/dashboard">Open product</Link>
            </Button>
          </div>
        </div>
        <Card className="border-zinc-200/80 dark:border-zinc-700">
          <CardHeader>
            <CardTitle>Trusted by security + sales teams</CardTitle>
            <CardDescription>Automate repetitive answers while keeping humans in control.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Evidence-backed answers", "Source citations", "Role-based approvals", "Audit-ready activity log"].map((item) => (
              <div className="flex items-center gap-2 text-sm" key={item}>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-24">
        <h2 className="mb-8 text-2xl font-semibold tracking-tight">Platform capabilities</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="mb-3 h-5 w-5 text-zinc-700 dark:text-zinc-200" />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-24">
        <h2 className="mb-8 text-2xl font-semibold tracking-tight">Pricing</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {pricing.map((plan) => (
            <Card key={plan.name}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.subtitle}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 text-2xl font-semibold">{plan.price}</div>
                <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                  {plan.features.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
