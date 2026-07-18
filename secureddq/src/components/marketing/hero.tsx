import Link from "next/link";
import { ArrowRight, Sparkles, FileCheck2, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 grid-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="absolute left-1/2 top-0 -z-10 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="container flex flex-col items-center py-24 text-center md:py-32">
        <Badge className="mb-6 gap-1.5 py-1" variant="secondary">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Evidence-backed AI for security teams
        </Badge>
        <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Answer security questionnaires in{" "}
          <span className="gradient-text">minutes, not weeks</span>
        </h1>
        <p className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
          SecureDDQ AI turns your policies, SOC 2 reports, and security docs into a searchable knowledge base,
          then drafts accurate, citable answers to DDQs, vendor assessments, and RFPs — so deals close faster.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/sign-up">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/dashboard">View live demo</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">No credit card required · SOC 2-ready architecture</p>

        <div className="mt-14 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: Clock, stat: "85%", label: "less time per questionnaire" },
            { icon: FileCheck2, stat: "1,600+", label: "questions handled per file" },
            { icon: ShieldCheck, stat: "94%", label: "AI answer accuracy" },
          ].map(({ icon: Icon, stat, label }) => (
            <div key={label} className="rounded-xl border bg-card/60 p-5 text-left shadow-sm">
              <Icon className="h-5 w-5 text-primary" />
              <div className="mt-3 text-2xl font-bold">{stat}</div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
