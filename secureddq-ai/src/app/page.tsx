import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, CheckCircle2, Zap, FileSearch, Lock } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { PLANS } from "@/lib/stripe/plans";

const features = [
  {
    icon: FileSearch,
    title: "AI-Powered Answers",
    description:
      "Generate accurate, evidence-backed responses from your security documentation using advanced RAG technology.",
  },
  {
    icon: Shield,
    title: "Compliance Coverage",
    description:
      "Track SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, and NIST controls with automated gap analysis.",
  },
  {
    icon: Zap,
    title: "10x Faster Completion",
    description:
      "Reduce questionnaire completion time from weeks to hours with intelligent automation and review workflows.",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description:
      "SOC 2 compliant infrastructure with encryption at rest, RBAC, MFA, and comprehensive audit logging.",
  },
];

const steps = [
  {
    step: "01",
    title: "Upload Documentation",
    description:
      "Import your security policies, SOC reports, penetration tests, and architecture documents.",
  },
  {
    step: "02",
    title: "Upload Questionnaire",
    description:
      "Drop in any security questionnaire — PDF, Excel, Word, or CSV. We parse questions automatically.",
  },
  {
    step: "03",
    title: "Review & Export",
    description:
      "Review AI-generated answers with citations, approve responses, and export in original format.",
  },
];

const testimonials = [
  {
    quote:
      "SecureDDQ cut our questionnaire response time from 3 weeks to 2 days. Our security team can finally focus on actual security work.",
    author: "Sarah Chen",
    role: "CISO, TechCorp",
  },
  {
    quote:
      "The citation feature gives us confidence that every answer is backed by real documentation. No more guessing.",
    author: "Michael Rodriguez",
    role: "Security Manager, CloudScale",
  },
  {
    quote:
      "We closed 40% more enterprise deals last quarter because we could respond to security reviews in hours, not weeks.",
    author: "Jennifer Park",
    role: "VP Sales, DataFlow",
  },
];

const faqs = [
  {
    q: "How accurate are the AI-generated answers?",
    a: "Our RAG architecture retrieves relevant content from your uploaded documents and generates answers with source citations. Every answer includes a confidence score, and uncertain responses are flagged for human review.",
  },
  {
    q: "What document formats do you support?",
    a: "We support PDF, DOCX, Excel, CSV, TXT, and Markdown files. This includes SOC reports, ISO documents, penetration test reports, security policies, and architecture documents.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted at rest and in transit. We use enterprise-grade authentication with MFA, role-based access control, and comprehensive audit logging. Your documents are never used to train AI models.",
  },
  {
    q: "Can I customize answer styles?",
    a: "Yes. Choose from concise, detailed, technical, or executive answer styles. You can also set organization-wide defaults and per-questionnaire preferences.",
  },
  {
    q: "Do you integrate with existing tools?",
    a: "Professional and Enterprise plans include API access. We're building integrations with Salesforce, HubSpot, Slack, and Microsoft Teams.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Shield className="h-6 w-6 text-primary" />
            <span>{APP_NAME}</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">
              How it Works
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="#faq" className="text-sm text-muted-foreground hover:text-foreground">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">
                Get Started
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden px-6 py-24 md:py-32">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
          <div className="mx-auto max-w-4xl text-center animate-fade-in">
            <div className="mb-6 inline-flex items-center rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
              <Zap className="mr-2 h-4 w-4 text-primary" />
              AI-Powered Security Questionnaire Automation
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Answer security questionnaires{" "}
              <span className="gradient-text">10x faster</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Build an AI knowledge base from your security documentation and
              automatically generate accurate, evidence-backed answers to vendor
              security assessments, DDQs, and RFPs.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required · Free plan available
            </p>
          </div>
        </section>

        <section id="features" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Everything you need to ace security reviews
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                From document ingestion to compliance tracking, SecureDDQ handles
                the entire security questionnaire lifecycle.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-xl border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-muted/30 px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                How it works
              </h2>
              <p className="text-muted-foreground">
                Three simple steps to automate your security questionnaires
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {steps.map((step) => (
                <div key={step.step} className="relative rounded-xl border bg-card p-8">
                  <span className="mb-4 block text-4xl font-bold text-primary/20">
                    {step.step}
                  </span>
                  <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Trusted by security teams
              </h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((t) => (
                <div key={t.author} className="rounded-xl border bg-card p-6">
                  <p className="mb-4 text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
                  <div>
                    <p className="font-semibold">{t.author}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-muted/30 px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Simple, transparent pricing
              </h2>
              <p className="text-muted-foreground">
                Start free, scale as you grow
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {(["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"] as const).map(
                (planKey) => {
                  const plan = PLANS[planKey];
                  const isPopular = planKey === "PROFESSIONAL";
                  return (
                    <div
                      key={planKey}
                      className={`relative rounded-xl border bg-card p-6 ${
                        isPopular ? "border-primary shadow-lg ring-1 ring-primary" : ""
                      }`}
                    >
                      {isPopular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                          Most Popular
                        </span>
                      )}
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <div className="my-4">
                        <span className="text-4xl font-bold">
                          {plan.priceLabel}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-muted-foreground">/month</span>
                        )}
                      </div>
                      <p className="mb-6 text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                      <ul className="mb-6 space-y-3">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={isPopular ? "default" : "outline"}
                        asChild
                      >
                        <Link href={planKey === "ENTERPRISE" ? "mailto:sales@secureddq.ai" : "/sign-up"}>
                          {planKey === "ENTERPRISE" ? "Contact Sales" : "Get Started"}
                        </Link>
                      </Button>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </section>

        <section id="faq" className="px-6 py-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.q} className="rounded-xl border bg-card p-6">
                  <h3 className="mb-2 font-semibold">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24">
          <div className="mx-auto max-w-4xl rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground">
            <h2 className="mb-4 text-3xl font-bold">
              Ready to transform your security questionnaire process?
            </h2>
            <p className="mb-8 text-primary-foreground/80">
              Join hundreds of security teams saving thousands of hours on
              vendor assessments.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/sign-up">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold">{APP_NAME}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="mailto:support@secureddq.ai" className="hover:text-foreground">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
