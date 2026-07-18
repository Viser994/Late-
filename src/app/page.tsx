import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileLock2,
  Gauge,
  ShieldCheck
} from "lucide-react";

import { PricingGrid } from "@/components/pricing-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { landingFeatures } from "@/lib/demo-data";

export default function LandingPage() {
  return (
    <main>
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-3 font-semibold">
          <span className="rounded-2xl bg-primary p-2 text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </span>
          SecureDDQ AI
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features">Features</a>
          <a href="#workflow">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </nav>
        <Button asChild={false} variant="outline">
          <Link href="/dashboard">Open app</Link>
        </Button>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <Badge>AI security questionnaire automation</Badge>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight md:text-7xl">
            Complete DDQs and RFP security responses in minutes.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            SecureDDQ AI builds an evidence-backed knowledge base from your
            security documentation, generates accurate questionnaire answers,
            and routes every response through human review.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg">
              Start free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline">
              Book a demo
            </Button>
          </div>
          <div className="mt-8 grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
            {["SOC 2", "ISO 27001", "HIPAA/GDPR"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                {item} ready
              </div>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden shadow-glow">
          <CardContent className="p-0">
            <div className="border-b bg-muted/40 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Northstar Bank DDQ</p>
                  <p className="text-xs text-muted-foreground">
                    412 questions detected
                  </p>
                </div>
                <Badge variant="success">82% complete</Badge>
              </div>
            </div>
            <div className="space-y-4 p-5">
              {[
                [
                  "Do you encrypt customer data at rest?",
                  "Yes. Customer data is encrypted at rest with AES-256 using cloud-managed KMS keys. Key rotation is performed annually and access is restricted through IAM policies.",
                  "SOC 2 Type II Report p. 31"
                ],
                [
                  "Describe your incident response process.",
                  "We maintain a documented incident response plan with severity classification, escalation, customer notification, post-incident review, and tabletop testing.",
                  "Incident Response Plan v4"
                ]
              ].map(([question, answer, source]) => (
                <div key={question} className="rounded-2xl border bg-background p-4">
                  <p className="text-sm font-semibold">{question}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {answer}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-primary">
                    <FileLock2 className="h-3.5 w-3.5" />
                    {source}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 max-w-2xl">
          <Badge variant="outline">Platform</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            Built for enterprise security teams and revenue teams.
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {landingFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardContent className="p-6">
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-5 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-7xl px-6 py-16">
        <Card>
          <CardContent className="grid gap-8 p-8 md:grid-cols-3">
            {[
              ["Upload evidence", "Policies, SOC reports, architecture docs, spreadsheets, and RFPs."],
              ["Generate answers", "RAG retrieves relevant chunks, cites sources, and scores confidence."],
              ["Review and export", "Approve, comment, track changes, then export to Excel, Word, or PDF."]
            ].map(([title, body], index) => (
              <div key={title}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          {["Vanta-grade workflows", "Linear-fast UX", "Notion-clean docs"].map(
            (quote) => (
              <Card key={quote}>
                <CardContent className="p-6">
                  <Gauge className="h-5 w-5 text-primary" />
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    "{quote}. SecureDDQ cut our security response cycle from
                    weeks of manual work to a single afternoon."
                  </p>
                  <p className="mt-4 text-sm font-semibold">Placeholder CISO</p>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 text-center">
          <Badge>Pricing</Badge>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            Plans that scale with your security program.
          </h2>
        </div>
        <PricingGrid />
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-3xl font-semibold tracking-tight">FAQ</h2>
        <div className="mt-6 divide-y rounded-2xl border bg-card">
          {[
            ["Does the AI hallucinate?", "The answer engine is instructed to use only retrieved evidence and surface uncertainty when sources are missing."],
            ["Can we export to original formats?", "The export module is designed for Excel, Word, and PDF workflows with original formatting preservation as a production integration point."],
            ["Is this multi-tenant?", "Yes. The schema, RBAC, billing, audit logs, and API keys are organization-scoped."]
          ].map(([question, answer]) => (
            <div key={question} className="p-5">
              <p className="font-medium">{question}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        SecureDDQ AI - AI questionnaire automation for enterprise security teams.
      </footer>
    </main>
  );
}
