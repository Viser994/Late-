import { Upload, Cpu, CheckCircle, Download } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload your security docs",
    description:
      "Upload SOC 2 reports, security policies, ISO certificates, pen test reports, and any other documentation. Supports PDF, Word, Excel, and more.",
    detail: "Drag & drop up to 100 documents • Auto-OCR for scanned files • Version tracking",
  },
  {
    number: "02",
    icon: Cpu,
    title: "AI builds your knowledge base",
    description:
      "Our AI reads, understands, and indexes every document. It creates embeddings for semantic search so it can find the right answer for any question.",
    detail: "GPT-4 powered • Vector search • Source attribution",
  },
  {
    number: "03",
    icon: CheckCircle,
    title: "Upload questionnaire, get answers",
    description:
      "Upload any security questionnaire. AI automatically detects questions, retrieves relevant docs, and generates accurate answers with citations.",
    detail: "Confidence scoring • Human review workflow • Comment & approval tracking",
  },
  {
    number: "04",
    icon: Download,
    title: "Review, approve & export",
    description:
      "Security team reviews and approves AI answers. Export back to the customer's original format — Excel, Word, or PDF.",
    detail: "Maintains original formatting • Full audit trail • Version history",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            From questionnaire to completion in hours
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A streamlined process that puts AI to work on the repetitive parts
            while keeping your security experts in control.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-primary/30 to-transparent z-0" />
              )}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-5xl font-black text-primary/20 leading-none">
                    {step.number}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {step.description}
                </p>
                <p className="text-xs text-muted-foreground/70 leading-relaxed">
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Supported frameworks */}
        <div className="mt-20 text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Works with all major security frameworks
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "SOC 2",
              "ISO 27001",
              "HIPAA",
              "GDPR",
              "PCI DSS",
              "NIST CSF",
              "FedRAMP",
              "CCPA",
              "SOX",
              "CIS Controls",
              "CMMC",
              "Custom",
            ].map((framework) => (
              <span
                key={framework}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border/60"
              >
                {framework}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
