import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Cta() {
  return (
    <section className="py-24">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary to-indigo-700 px-8 py-16 text-center text-primary-foreground shadow-xl">
          <div className="absolute inset-0 grid-pattern opacity-10" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Stop losing deals to slow security reviews</h2>
            <p className="mt-4 text-primary-foreground/80">
              Join security teams cutting questionnaire turnaround by 85%. Start free — no credit card required.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/sign-up">
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" asChild>
                <Link href="/sign-up?plan=enterprise">Talk to sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
