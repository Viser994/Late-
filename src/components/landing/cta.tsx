import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="relative p-12 rounded-3xl bg-primary overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white blur-3xl" />
          </div>
          <div className="relative">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Stop losing deals to slow questionnaires
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Join hundreds of security teams who&apos;ve automated their questionnaire
              process. Start free, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 text-base h-12 px-8"
                asChild
              >
                <Link href="/sign-up">
                  Start free today
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-base h-12 px-8 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
                asChild
              >
                <Link href="/contact">Talk to sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
