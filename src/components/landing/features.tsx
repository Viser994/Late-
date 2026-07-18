import {
  Brain,
  FileSearch,
  Shield,
  Clock,
  CheckSquare,
  BarChart3,
  Lock,
  Globe,
  Zap,
  Database,
  Users,
  FileText,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Answer Engine",
    description:
      "GPT-4 powered engine that reads your security docs and generates accurate, cited answers for every questionnaire question.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Database,
    title: "Smart Knowledge Base",
    description:
      "Upload PDFs, Word docs, SOC 2 reports, ISO certifications. AI indexes everything for instant semantic search.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: FileSearch,
    title: "Source Citations",
    description:
      "Every AI answer cites the exact document and section it came from. Full transparency, no hallucinations.",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    icon: CheckSquare,
    title: "Approval Workflows",
    description:
      "Route answers through security teams for review. Track edits, approvals, and maintain audit trails.",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: Shield,
    title: "Compliance Center",
    description:
      "Track coverage for SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS. See gaps and map documents to controls.",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    icon: Clock,
    title: "10x Faster Completion",
    description:
      "What used to take 2 weeks now takes hours. AI handles the heavy lifting while your team reviews.",
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Track time saved, AI accuracy, most common questions, knowledge base growth, and ROI metrics.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description:
      "SOC 2 compliant, end-to-end encryption, RBAC, SSO, MFA, audit logs. Built for enterprise requirements.",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    icon: Globe,
    title: "Multi-Framework Support",
    description:
      "Handle questionnaires spanning SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, NIST, and custom frameworks.",
    color: "text-teal-500",
    bg: "bg-teal-500/10",
  },
  {
    icon: FileText,
    title: "Export Everything",
    description:
      "Export completed questionnaires to Excel, Word, or PDF. Maintain original formatting from the customer's template.",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Assign questions to team members, leave comments, mention colleagues, and coordinate reviews in one place.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Zap,
    title: "AI Chat Interface",
    description:
      "Ask anything about your security posture. \"Do we encrypt backups?\" Get answers with document citations instantly.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Everything you need to automate security questionnaires
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete platform built specifically for security teams and
            sales engineers who spend too much time on compliance paperwork.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/30 hover:shadow-md transition-all group"
            >
              <div
                className={`w-10 h-10 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}
              >
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
