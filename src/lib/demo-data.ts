import {
  BarChart3,
  Bot,
  BrainCircuit,
  Building2,
  CheckCircle2,
  FileCheck2,
  FileSearch,
  FolderLock,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/documents", label: "Knowledge Base", icon: FolderLock },
  { href: "/questionnaires", label: "Questionnaires", icon: FileCheck2 },
  { href: "/chat", label: "AI Chat", icon: MessageSquareText },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/analytics", label: "Analytics", icon: BrainCircuit },
  { href: "/billing", label: "Billing", icon: Building2 },
  { href: "/admin", label: "Admin", icon: Users }
];

export const dashboardActivity = [
  "SOC 2 questionnaire for Northstar Bank moved to review",
  "Password Policy v4 indexed with 18 evidence chunks",
  "ISO 27001 A.8 control coverage increased to 92%",
  "Maya approved 34 AI-generated answers",
  "Stripe invoice synced for Professional plan"
];

export const recentUploads = [
  {
    title: "SOC 2 Type II Report 2026",
    status: "Ready",
    tags: ["SOC2", "Audit"],
    chunks: 318
  },
  {
    title: "Incident Response Plan",
    status: "Ready",
    tags: ["IR", "Security"],
    chunks: 86
  },
  {
    title: "Cloud Architecture Overview",
    status: "Processing",
    tags: ["AWS", "Infrastructure"],
    chunks: 42
  }
];

export const questionnaireRows = [
  {
    name: "Northstar Bank Vendor Security DDQ",
    status: "In Review",
    progress: 82,
    questions: 412,
    due: "Jul 29"
  },
  {
    name: "Acme Health HIPAA Assessment",
    status: "Generating",
    progress: 46,
    questions: 189,
    due: "Aug 3"
  },
  {
    name: "Enterprise RFP Security Appendix",
    status: "Approved",
    progress: 100,
    questions: 96,
    due: "Completed"
  }
];

export const complianceCards = [
  { framework: "SOC 2", coverage: 91, missing: 7 },
  { framework: "ISO 27001", coverage: 84, missing: 13 },
  { framework: "HIPAA", coverage: 76, missing: 18 },
  { framework: "GDPR", coverage: 88, missing: 9 },
  { framework: "PCI DSS", coverage: 64, missing: 26 },
  { framework: "NIST", coverage: 79, missing: 15 }
];

export const landingFeatures = [
  {
    title: "Evidence-backed AI answers",
    description:
      "Generate questionnaire responses from approved source documents only, with citations and confidence scores.",
    icon: Sparkles
  },
  {
    title: "Questionnaire ingestion",
    description:
      "Parse PDFs, spreadsheets, Word docs, CSVs, required fields, checkboxes, sections, and answer formats.",
    icon: FileSearch
  },
  {
    title: "Enterprise review workflows",
    description:
      "Route answers through owners, admins, security analysts, sales engineers, comments, mentions, and approvals.",
    icon: CheckCircle2
  },
  {
    title: "AI knowledge base",
    description:
      "Index policies, audit reports, architecture docs, penetration tests, and compliance evidence with pgvector search.",
    icon: Bot
  }
];
