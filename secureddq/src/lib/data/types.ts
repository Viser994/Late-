import type {
  AnswerStatus,
  ControlStatus,
  DocumentStatus,
  DocumentType,
  Framework,
  PlanTier,
  QuestionnaireStatus,
  Role,
} from "@prisma/client";

/**
 * UI-facing view models. These decouple presentation from the persistence
 * layer so the same components render whether data comes from Prisma or the
 * built-in demo provider.
 */

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastActiveAt: string;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
}

export interface DashboardMetrics {
  totalQuestionnaires: number;
  completed: number;
  inProgress: number;
  pendingReview: number;
  aiAccuracy: number;
  hoursSaved: number;
  revenueProtected: number;
  knowledgeBaseSize: number;
  complianceCoverage: number;
}

export interface ActivityItem {
  id: string;
  actor: string;
  verb: string;
  summary: string;
  createdAt: string;
}

export interface DocumentView {
  id: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  sizeBytes: number;
  version: number;
  chunkCount: number;
  tags: string[];
  updatedAt: string;
  expiresAt: string | null;
}

export interface QuestionnaireView {
  id: string;
  title: string;
  status: QuestionnaireStatus;
  project: string | null;
  totalQuestions: number;
  answered: number;
  approved: number;
  dueDate: string | null;
  requester: string | null;
  updatedAt: string;
}

export interface CitationView {
  documentTitle: string;
  quote: string;
  relevance: number;
}

export interface QuestionView {
  id: string;
  prompt: string;
  section: string;
  required: boolean;
  answer: {
    content: string;
    status: AnswerStatus;
    confidence: number | null;
    aiGenerated: boolean;
    citations: CitationView[];
  };
}

export interface ChatCitation {
  documentTitle: string;
  quote: string;
}

export interface ChatMessageView {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
  createdAt: string;
}

export interface ControlView {
  id: string;
  framework: Framework;
  code: string;
  title: string;
  status: ControlStatus;
  mappedDocuments: number;
}

export interface FrameworkCoverage {
  framework: Framework;
  total: number;
  implemented: number;
  inProgress: number;
  coverage: number;
}

export interface AnalyticsSummary {
  questionsAnswered: number;
  hoursSaved: number;
  moneySaved: number;
  avgCompletionHours: number;
  aiAcceptanceRate: number;
  humanEditRate: number;
  knowledgeGrowth: { month: string; documents: number; chunks: number }[];
  answersOverTime: { month: string; ai: number; human: number }[];
  topQuestions: { prompt: string; count: number }[];
}

export interface InvoiceView {
  id: string;
  number: string;
  amount: number;
  status: string;
  date: string;
  url: string;
}

export interface OrgContext {
  id: string;
  name: string;
  slug: string;
  plan: PlanTier;
  role: Role;
  seatsUsed: number;
  seatsTotal: number | "unlimited";
}
