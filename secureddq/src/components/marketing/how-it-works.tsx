import { Upload, Sparkles, CheckCircle2, FileOutput } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "1. Build your knowledge base",
    description: "Upload security policies, SOC reports, and architecture docs. We extract, chunk, and embed them into a searchable vector index.",
  },
  {
    icon: Sparkles,
    title: "2. Import a questionnaire",
    description: "Drop in a DDQ in Excel, Word, PDF, or CSV. We auto-detect sections, questions, and answer formats.",
  },
  {
    icon: CheckCircle2,
    title: "3. Generate & review",
    description: "AI drafts cited answers with confidence scores. Your team edits, approves, and comments in a guided review flow.",
  },
  {
    icon: FileOutput,
    title: "4. Export & win",
    description: "Export back to the original Excel, Word, or PDF format — formatting preserved — and send it back the same day.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">From upload to answer in four steps</h2>
          <p className="mt-4 text-muted-foreground">A workflow designed with security and sales teams, not against them.</p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.title} className="relative">
              {i < steps.length - 1 && (
                <div className="absolute left-11 top-6 hidden h-px w-full bg-gradient-to-r from-border to-transparent md:block" />
              )}
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border bg-card text-primary shadow-sm">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
