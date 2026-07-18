import type { PlanTier, Role, Framework } from "@prisma/client";

export const APP_NAME = "SecureDDQ AI";
export const APP_TAGLINE = "Answer security questionnaires in minutes, not weeks.";
export const APP_DESCRIPTION =
  "SecureDDQ AI builds an evidence-backed knowledge base from your security documentation and drafts accurate, citable answers to security questionnaires, vendor assessments, and RFPs.";

// ─────────────────────────────── Plans ───────────────────────────────

export interface PlanFeature {
  label: string;
  included: boolean;
}

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  priceMonthly: number | null; // null => custom
  priceLabel: string;
  description: string;
  cta: string;
  highlighted?: boolean;
  limits: {
    users: number | "unlimited";
    documents: number | "unlimited";
    questionnairesPerMonth: number | "unlimited";
    aiTokensPerMonth: number | "unlimited";
  };
  features: string[];
}

export const PLANS: Record<PlanTier, PlanDefinition> = {
  FREE: {
    tier: "FREE",
    name: "Free",
    priceMonthly: 0,
    priceLabel: "$0",
    description: "Explore the platform with a single small team.",
    cta: "Get started",
    limits: { users: 2, documents: 10, questionnairesPerMonth: 1, aiTokensPerMonth: 50_000 },
    features: [
      "1 organization",
      "2 users",
      "10 document uploads",
      "1 questionnaire / month",
      "Basic AI responses",
      "Community support",
    ],
  },
  STARTER: {
    tier: "STARTER",
    name: "Starter",
    priceMonthly: 49,
    priceLabel: "$49",
    description: "For growing security teams handling steady questionnaire volume.",
    cta: "Start free trial",
    limits: { users: 5, documents: 100, questionnairesPerMonth: "unlimited", aiTokensPerMonth: 2_000_000 },
    features: [
      "5 users",
      "100 documents",
      "Unlimited questionnaires",
      "AI chat",
      "Compliance dashboard",
      "Email support",
    ],
  },
  PROFESSIONAL: {
    tier: "PROFESSIONAL",
    name: "Professional",
    priceMonthly: 199,
    priceLabel: "$199",
    description: "Advanced automation, workflows, and analytics for scaling teams.",
    cta: "Start free trial",
    highlighted: true,
    limits: {
      users: "unlimited",
      documents: "unlimited",
      questionnairesPerMonth: "unlimited",
      aiTokensPerMonth: 20_000_000,
    },
    features: [
      "Unlimited users",
      "Unlimited documents",
      "Advanced AI answer engine",
      "Approval workflows",
      "Analytics",
      "API access",
      "Advanced exports",
      "Custom templates",
      "Priority support",
    ],
  },
  ENTERPRISE: {
    tier: "ENTERPRISE",
    name: "Enterprise",
    priceMonthly: null,
    priceLabel: "Custom",
    description: "Security, scale, and support for the largest organizations.",
    cta: "Contact sales",
    limits: {
      users: "unlimited",
      documents: "unlimited",
      questionnairesPerMonth: "unlimited",
      aiTokensPerMonth: "unlimited",
    },
    features: [
      "Everything in Professional",
      "Unlimited AI usage",
      "SSO (SAML / OIDC)",
      "Dedicated onboarding",
      "Custom integrations",
      "SLA",
      "Private cloud options",
      "Dedicated account manager",
      "Audit assistance",
      "Advanced security controls",
    ],
  },
};

export const PLAN_ORDER: PlanTier[] = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"];

// ─────────────────────────────── Roles ───────────────────────────────

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  SECURITY_MANAGER: "Security Manager",
  SECURITY_ANALYST: "Security Analyst",
  SALES_ENGINEER: "Sales Engineer",
  VIEWER: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  OWNER: "Full access, including billing and organization deletion.",
  ADMIN: "Manage members, settings, and all workspace content.",
  SECURITY_MANAGER: "Own the knowledge base, approve answers, manage compliance.",
  SECURITY_ANALYST: "Draft and edit answers, upload documents, run AI.",
  SALES_ENGINEER: "Create questionnaires and request reviews.",
  VIEWER: "Read-only access to projects and answers.",
};

// ─────────────────────────────── Frameworks ───────────────────────────────

export const FRAMEWORK_LABELS: Record<Framework, string> = {
  SOC2: "SOC 2",
  ISO27001: "ISO 27001",
  HIPAA: "HIPAA",
  GDPR: "GDPR",
  PCI_DSS: "PCI DSS",
  NIST_CSF: "NIST CSF",
  NIST_80053: "NIST 800-53",
};
