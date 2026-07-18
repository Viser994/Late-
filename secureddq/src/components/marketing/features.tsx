import {
  BrainCircuit,
  FileSearch,
  MessagesSquare,
  ShieldCheck,
  Workflow,
  BarChart3,
  FileUp,
  Quote,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: FileUp,
    title: "Ingest everything",
    description: "Upload PDFs, DOCX, Excel, CSV, and Markdown. We extract text, OCR scans, chunk, and embed automatically.",
  },
  {
    icon: BrainCircuit,
    title: "RAG answer engine",
    description: "Retrieval-augmented answers grounded in your documents — with confidence scores and multiple answer styles.",
  },
  {
    icon: Quote,
    title: "Always cited, never hallucinated",
    description: "Every answer links back to the exact source passages so reviewers can verify in one click.",
  },
  {
    icon: Workflow,
    title: "Human-in-the-loop review",
    description: "Draft → edited → approved workflows with comments, mentions, version history, and a full audit log.",
  },
  {
    icon: MessagesSquare,
    title: "AI chat over your evidence",
    description: "Ask “Do we encrypt backups?” and get an instant, sourced answer from your knowledge base.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance center",
    description: "Map documents to SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, and NIST controls and track coverage.",
  },
  {
    icon: FileSearch,
    title: "Semantic search",
    description: "Global AI search across projects, documents, questions, answers, evidence, and controls.",
  },
  {
    icon: BarChart3,
    title: "Analytics that prove ROI",
    description: "Time saved, revenue protected, AI acceptance rate, and knowledge growth — all in one place.",
  },
  {
    icon: Users,
    title: "Built for teams",
    description: "Six roles with granular permissions, organization invitations, MFA, and SSO for enterprise.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t bg-muted/30 py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything your security team needs</h2>
          <p className="mt-4 text-muted-foreground">
            From document ingestion to export, SecureDDQ AI covers the entire questionnaire lifecycle.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4 text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
