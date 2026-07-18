import Link from "next/link";
import { ArrowRight, CheckCircle, Shield, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Hours saved per questionnaire", value: "40+" },
  { label: "Answer accuracy", value: "95%" },
  { label: "Faster completion", value: "10x" },
  { label: "Compliance frameworks", value: "12+" },
];

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6 gap-1.5">
            <Zap className="w-3 h-3" />
            AI-Powered Security Automation
          </Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Complete Security{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
              Questionnaires
            </span>{" "}
            in Minutes
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Stop spending weeks manually answering DDQs. Upload your security
            documentation once, and let AI automatically generate accurate,
            evidence-backed answers for every questionnaire.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="gap-2 text-base h-12 px-8" asChild>
              <Link href="/sign-up">
                Start for free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 text-base h-12 px-8"
              asChild
            >
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            {[
              "No credit card required",
              "Free plan available",
              "SOC 2 compliant",
              "Cancel anytime",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Hero visual - Dashboard mockup */}
        <div className="mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none bottom-0 h-32" />
          <div className="rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden">
            <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 border-b border-border/60">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-background rounded-md px-3 py-1 text-xs text-muted-foreground text-center max-w-xs mx-auto">
                  app.secureddq.ai/dashboard
                </div>
              </div>
            </div>
            <div className="p-6">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Sidebar mock */}
      <div className="col-span-1 space-y-2">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10">
          <div className="w-4 h-4 rounded bg-primary/40" />
          <div className="h-3 bg-primary/40 rounded flex-1" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg">
            <div className="w-4 h-4 rounded bg-muted-foreground/20" />
            <div className="h-3 bg-muted-foreground/20 rounded flex-1" />
          </div>
        ))}
      </div>

      {/* Main content mock */}
      <div className="col-span-3 space-y-4">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Questionnaires", value: "24", color: "bg-blue-500/10" },
            { label: "Completed", value: "18", color: "bg-green-500/10" },
            { label: "In Progress", value: "4", color: "bg-yellow-500/10" },
            { label: "AI Accuracy", value: "96%", color: "bg-purple-500/10" },
          ].map((card) => (
            <div
              key={card.label}
              className={`p-3 rounded-lg ${card.color} border border-border/40`}
            >
              <div className="text-xs text-muted-foreground mb-1">
                {card.label}
              </div>
              <div className="text-2xl font-bold">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-lg border border-border/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-3 bg-foreground/20 rounded w-32" />
              <div className="h-5 w-16 rounded-full bg-green-500/20" />
            </div>
            {[85, 70, 90, 60].map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-2 bg-muted-foreground/20 rounded flex-1" />
                <div
                  className="h-4 rounded bg-primary/20"
                  style={{ width: `${w}%` }}
                />
              </div>
            ))}
          </div>
          <div className="p-4 rounded-lg border border-border/40 space-y-3">
            <div className="h-3 bg-foreground/20 rounded w-28" />
            {[
              { w: "w-3/4", color: "bg-blue-400/40" },
              { w: "w-1/2", color: "bg-green-400/40" },
              { w: "w-5/6", color: "bg-purple-400/40" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <div className={`h-2 ${item.w} bg-muted-foreground/20 rounded`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
