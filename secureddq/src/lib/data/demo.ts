import type {
  ActivityItem,
  AnalyticsSummary,
  ChatMessageView,
  ControlView,
  DashboardMetrics,
  DocumentView,
  FrameworkCoverage,
  InvoiceView,
  OrgContext,
  OrgMember,
  QuestionView,
  QuestionnaireView,
} from "./types";
import type { Framework } from "@prisma/client";

/**
 * Deterministic demo dataset. Used to render the full UI without a live
 * database — every accessor in `@/lib/data` falls back to these fixtures.
 */

export const DEMO_ORG: OrgContext = {
  id: "org_demo",
  name: "Northwind Security",
  slug: "northwind",
  plan: "PROFESSIONAL",
  role: "OWNER",
  seatsUsed: 8,
  seatsTotal: "unlimited",
};

export const DEMO_MEMBERS: OrgMember[] = [
  { id: "u1", name: "Ava Chen", email: "ava@northwind.io", role: "OWNER", lastActiveAt: iso(-1), status: "ACTIVE" },
  { id: "u2", name: "Marcus Reed", email: "marcus@northwind.io", role: "SECURITY_MANAGER", lastActiveAt: iso(-2), status: "ACTIVE" },
  { id: "u3", name: "Priya Nair", email: "priya@northwind.io", role: "SECURITY_ANALYST", lastActiveAt: iso(-30), status: "ACTIVE" },
  { id: "u4", name: "Diego Santos", email: "diego@northwind.io", role: "SECURITY_ANALYST", lastActiveAt: iso(-90), status: "ACTIVE" },
  { id: "u5", name: "Lena Petrov", email: "lena@northwind.io", role: "SALES_ENGINEER", lastActiveAt: iso(-15), status: "ACTIVE" },
  { id: "u6", name: "Tom Baker", email: "tom@northwind.io", role: "VIEWER", lastActiveAt: iso(-240), status: "ACTIVE" },
  { id: "u7", name: "Sara Kim", email: "sara@vendor.com", role: "SECURITY_ANALYST", lastActiveAt: iso(0), status: "INVITED" },
  { id: "u8", name: "Admin User", email: "admin@northwind.io", role: "ADMIN", lastActiveAt: iso(-5), status: "ACTIVE" },
];

export const DEMO_METRICS: DashboardMetrics = {
  totalQuestionnaires: 46,
  completed: 31,
  inProgress: 9,
  pendingReview: 6,
  aiAccuracy: 94.2,
  hoursSaved: 1284,
  revenueProtected: 4_250_000,
  knowledgeBaseSize: 187,
  complianceCoverage: 82,
};

export const DEMO_ACTIVITY: ActivityItem[] = [
  { id: "a1", actor: "Priya Nair", verb: "generated", summary: "AI answers for “Acme Corp Vendor Assessment” (142 questions)", createdAt: iso(-1) },
  { id: "a2", actor: "Marcus Reed", verb: "approved", summary: "28 answers in “Globex SOC 2 DDQ”", createdAt: iso(-3) },
  { id: "a3", actor: "Ava Chen", verb: "uploaded", summary: "SOC 2 Type II Report (2025)", createdAt: iso(-6) },
  { id: "a4", actor: "Lena Petrov", verb: "created", summary: "questionnaire “Initech RFP – Security Section”", createdAt: iso(-9) },
  { id: "a5", actor: "Diego Santos", verb: "edited", summary: "answer for “Do you encrypt data at rest?”", createdAt: iso(-12) },
  { id: "a6", actor: "System", verb: "flagged", summary: "Penetration Test Report expires in 21 days", createdAt: iso(-24) },
];

export const DEMO_RECENT_UPLOADS: DocumentView[] = demoDocuments().slice(0, 5);

export function demoDocuments(): DocumentView[] {
  return [
    doc("d1", "Information Security Policy", "SECURITY_POLICY", "READY", 412_000, 3, 48, ["policy", "iso27001"], -20, 320),
    doc("d2", "SOC 2 Type II Report 2025", "SOC_REPORT", "READY", 2_940_000, 1, 96, ["soc2", "audit"], -6, 340),
    doc("d3", "ISO 27001 Statement of Applicability", "ISO_DOCUMENT", "READY", 640_000, 2, 61, ["iso27001"], -40, 300),
    doc("d4", "Cloud Architecture Overview", "ARCHITECTURE", "READY", 1_200_000, 1, 37, ["aws", "infrastructure"], -55, null),
    doc("d5", "Penetration Test Report Q2", "PENTEST_REPORT", "READY", 3_100_000, 1, 74, ["pentest", "security"], -70, 21),
    doc("d6", "Data Retention & Deletion Policy", "POLICY", "READY", 220_000, 4, 22, ["policy", "gdpr"], -12, 200),
    doc("d7", "Incident Response Plan", "POLICY", "READY", 380_000, 2, 29, ["policy", "incident"], -33, 150),
    doc("d8", "Business Continuity & DR Plan", "POLICY", "PROCESSING", 510_000, 1, 0, ["dr", "bcp"], -1, 365),
    doc("d9", "Vendor Risk Management Standard", "SECURITY_POLICY", "READY", 190_000, 1, 18, ["vendor", "risk"], -80, 280),
    doc("d10", "Encryption Standard", "SECURITY_POLICY", "READY", 160_000, 5, 15, ["encryption", "crypto"], -25, 260),
    doc("d11", "Access Control Policy", "SECURITY_POLICY", "READY", 240_000, 3, 26, ["iam", "access"], -18, 250),
    doc("d12", "GDPR Data Processing Addendum", "OTHER", "ARCHIVED", 120_000, 2, 11, ["gdpr", "legal"], -300, null),
  ];
}

export function demoQuestionnaires(): QuestionnaireView[] {
  return [
    q("qn1", "Acme Corp Vendor Assessment", "IN_PROGRESS", "Enterprise Deals", 142, 118, 74, 6, "security@acme.com"),
    q("qn2", "Globex SOC 2 DDQ", "PENDING_REVIEW", "Enterprise Deals", 88, 88, 60, 3, "vendormgmt@globex.com"),
    q("qn3", "Initech RFP – Security Section", "DRAFT", "RFPs", 210, 0, 0, 21, "rfp@initech.com"),
    q("qn4", "Umbrella Health HIPAA Questionnaire", "COMPLETED", "Healthcare", 96, 96, 96, null, "compliance@umbrella.health"),
    q("qn5", "Stark Industries Cloud Security Review", "IN_PROGRESS", "Enterprise Deals", 320, 210, 150, 10, "ciso@stark.com"),
    q("qn6", "Wayne Enterprises PCI DSS Assessment", "PENDING_REVIEW", null, 64, 64, 40, 5, "pci@wayne.com"),
    q("qn7", "Hooli GDPR DPA Review", "COMPLETED", "Legal", 45, 45, 45, null, "privacy@hooli.com"),
    q("qn8", "Pied Piper Security Addendum", "IN_PROGRESS", "SMB", 75, 51, 30, 14, "legal@piedpiper.com"),
  ];
}

const QUESTIONNAIRE_QUESTIONS: Record<string, QuestionView[]> = {
  qn1: [
    question(
      "q1",
      "Do you encrypt customer data at rest?",
      "Encryption",
      true,
      "Yes. All customer data is encrypted at rest using AES-256. Encryption keys are managed via AWS KMS with automatic annual rotation and are never stored alongside encrypted data.",
      "APPROVED",
      0.97,
      [
        { documentTitle: "Encryption Standard", quote: "All data at rest is encrypted using AES-256-GCM. Keys are managed in AWS KMS.", relevance: 0.94 },
        { documentTitle: "SOC 2 Type II Report 2025", quote: "Control CC6.1 — data at rest encryption verified with no exceptions.", relevance: 0.88 },
      ]
    ),
    question(
      "q2",
      "Describe your incident response process.",
      "Incident Response",
      true,
      "Our documented Incident Response Plan defines six phases: preparation, detection, containment, eradication, recovery, and post-incident review. A 24/7 on-call rotation triages alerts, and Sev-1 incidents trigger executive notification within 1 hour.",
      "EDITED",
      0.91,
      [{ documentTitle: "Incident Response Plan", quote: "The IR lifecycle follows NIST 800-61: preparation, detection & analysis, containment, eradication, recovery, and lessons learned.", relevance: 0.92 }]
    ),
    question(
      "q3",
      "Do you encrypt backups?",
      "Disaster Recovery",
      false,
      "Yes. Backups are encrypted with AES-256 and stored in a separate AWS region. Backup restoration is tested quarterly as part of our DR program.",
      "GENERATED",
      0.83,
      [{ documentTitle: "Business Continuity & DR Plan", quote: "Backups are encrypted and replicated cross-region; restore tests run quarterly.", relevance: 0.79 }]
    ),
    question(
      "q4",
      "What is your password policy?",
      "Identity & Access Management",
      true,
      "Passwords require a minimum of 12 characters with complexity requirements, are checked against known-breach lists, and rotate every 90 days for privileged accounts. MFA is enforced organization-wide.",
      "APPROVED",
      0.95,
      [{ documentTitle: "Access Control Policy", quote: "Minimum 12-character passwords, breach-list checks, and mandatory MFA for all users.", relevance: 0.9 }]
    ),
    question(
      "q5",
      "Provide evidence of SOC 2 CC6 controls.",
      "Compliance",
      true,
      "SOC 2 CC6 (Logical & Physical Access) controls are evidenced in our 2025 Type II report, which received an unqualified opinion covering logical access provisioning, de-provisioning, and network segmentation.",
      "DRAFT",
      0.68,
      [{ documentTitle: "SOC 2 Type II Report 2025", quote: "CC6.1–CC6.8 tested across the audit period with no exceptions noted.", relevance: 0.86 }]
    ),
  ],
};

export function demoQuestions(questionnaireId: string): QuestionView[] {
  return QUESTIONNAIRE_QUESTIONS[questionnaireId] ?? QUESTIONNAIRE_QUESTIONS.qn1;
}

export const DEMO_CHAT: ChatMessageView[] = [
  { id: "m1", role: "user", content: "Do we encrypt backups?", createdAt: iso(-1) },
  {
    id: "m2",
    role: "assistant",
    content:
      "Yes. Backups are encrypted at rest with AES-256 and replicated to a separate AWS region. Restore procedures are tested quarterly as part of the disaster recovery program.",
    citations: [
      { documentTitle: "Business Continuity & DR Plan", quote: "Backups are encrypted and replicated cross-region; restore tests run quarterly." },
      { documentTitle: "Encryption Standard", quote: "All data at rest — including backups — is encrypted using AES-256-GCM." },
    ],
    createdAt: iso(-1),
  },
];

export function demoControls(): ControlView[] {
  const rows: ControlView[] = [];
  const soc2: [string, string, ControlView["status"], number][] = [
    ["CC1.1", "Control environment & integrity", "IMPLEMENTED", 3],
    ["CC2.1", "Communication of policies", "IMPLEMENTED", 2],
    ["CC6.1", "Logical access — encryption", "IMPLEMENTED", 4],
    ["CC6.6", "Boundary protection", "IN_PROGRESS", 1],
    ["CC7.2", "Security incident monitoring", "IMPLEMENTED", 2],
    ["CC9.2", "Vendor risk management", "IN_PROGRESS", 1],
  ];
  soc2.forEach(([code, title, status, docs], i) =>
    rows.push({ id: `soc2-${i}`, framework: "SOC2", code, title, status, mappedDocuments: docs })
  );
  const iso: [string, string, ControlView["status"], number][] = [
    ["A.5.1", "Policies for information security", "IMPLEMENTED", 2],
    ["A.8.24", "Use of cryptography", "IMPLEMENTED", 2],
    ["A.5.23", "Cloud services security", "IN_PROGRESS", 1],
    ["A.5.30", "ICT readiness for continuity", "NOT_STARTED", 0],
  ];
  iso.forEach(([code, title, status, docs], i) =>
    rows.push({ id: `iso-${i}`, framework: "ISO27001", code, title, status, mappedDocuments: docs })
  );
  return rows;
}

export function demoFrameworkCoverage(): FrameworkCoverage[] {
  const data: [Framework, number, number, number][] = [
    ["SOC2", 64, 58, 4],
    ["ISO27001", 93, 71, 12],
    ["HIPAA", 54, 40, 6],
    ["GDPR", 39, 33, 3],
    ["PCI_DSS", 78, 52, 14],
    ["NIST_CSF", 108, 74, 18],
  ];
  return data.map(([framework, total, implemented, inProgress]) => ({
    framework,
    total,
    implemented,
    inProgress,
    coverage: Math.round((implemented / total) * 100),
  }));
}

export const DEMO_ANALYTICS: AnalyticsSummary = {
  questionsAnswered: 6120,
  hoursSaved: 1284,
  moneySaved: 192_600,
  avgCompletionHours: 3.4,
  aiAcceptanceRate: 88,
  humanEditRate: 22,
  knowledgeGrowth: [
    { month: "Feb", documents: 92, chunks: 2400 },
    { month: "Mar", documents: 118, chunks: 3100 },
    { month: "Apr", documents: 134, chunks: 3800 },
    { month: "May", documents: 152, chunks: 4500 },
    { month: "Jun", documents: 171, chunks: 5200 },
    { month: "Jul", documents: 187, chunks: 5900 },
  ],
  answersOverTime: [
    { month: "Feb", ai: 420, human: 120 },
    { month: "Mar", ai: 610, human: 140 },
    { month: "Apr", ai: 780, human: 160 },
    { month: "May", ai: 940, human: 180 },
    { month: "Jun", ai: 1120, human: 190 },
    { month: "Jul", ai: 1290, human: 210 },
  ],
  topQuestions: [
    { prompt: "Do you encrypt data at rest and in transit?", count: 41 },
    { prompt: "Describe your incident response process.", count: 38 },
    { prompt: "Are you SOC 2 Type II compliant?", count: 35 },
    { prompt: "What is your data retention policy?", count: 29 },
    { prompt: "Do you support SSO / SAML?", count: 27 },
  ],
};

export const DEMO_INVOICES: InvoiceView[] = [
  { id: "in1", number: "INV-2026-007", amount: 19900, status: "paid", date: iso(-2), url: "#" },
  { id: "in2", number: "INV-2026-006", amount: 19900, status: "paid", date: iso(-32), url: "#" },
  { id: "in3", number: "INV-2026-005", amount: 19900, status: "paid", date: iso(-62), url: "#" },
];

// ─────────────────────────────── helpers ───────────────────────────────

function iso(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86_400_000).toISOString();
}

function doc(
  id: string,
  title: string,
  type: DocumentView["type"],
  status: DocumentView["status"],
  sizeBytes: number,
  version: number,
  chunkCount: number,
  tags: string[],
  updatedDaysAgo: number,
  expiresInDays: number | null
): DocumentView {
  return {
    id,
    title,
    type,
    status,
    sizeBytes,
    version,
    chunkCount,
    tags,
    updatedAt: iso(updatedDaysAgo),
    expiresAt: expiresInDays === null ? null : iso(expiresInDays),
  };
}

function q(
  id: string,
  title: string,
  status: QuestionnaireView["status"],
  project: string | null,
  totalQuestions: number,
  answered: number,
  approved: number,
  dueInDays: number | null,
  requester: string | null
): QuestionnaireView {
  return {
    id,
    title,
    status,
    project,
    totalQuestions,
    answered,
    approved,
    dueDate: dueInDays === null ? null : iso(dueInDays),
    requester,
    updatedAt: iso(-1),
  };
}

function question(
  id: string,
  prompt: string,
  section: string,
  required: boolean,
  content: string,
  status: QuestionView["answer"]["status"],
  confidence: number,
  citations: QuestionView["answer"]["citations"]
): QuestionView {
  return {
    id,
    prompt,
    section,
    required,
    answer: { content, status, confidence, aiGenerated: true, citations },
  };
}
