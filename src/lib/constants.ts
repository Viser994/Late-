import type { OrganizationRole } from "@prisma/client";

export const appConfig = {
  name: "SecureDDQ AI",
  description:
    "AI-powered security questionnaire automation with evidence-backed answers.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
};

export const supportedDocumentTypes = [
  "PDF",
  "DOCX",
  "Excel",
  "CSV",
  "TXT",
  "Markdown",
  "Security policies",
  "SOC reports",
  "ISO documents",
  "Architecture documents",
  "Penetration test reports"
];

export const roles: OrganizationRole[] = [
  "OWNER",
  "ADMIN",
  "SECURITY_MANAGER",
  "SECURITY_ANALYST",
  "SALES_ENGINEER",
  "VIEWER"
];

export const complianceFrameworks = [
  "SOC2",
  "ISO27001",
  "HIPAA",
  "GDPR",
  "PCI DSS",
  "NIST"
];

export const pricingPlans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Validate your knowledge base workflow.",
    features: [
      "1 organization",
      "2 users",
      "10 document uploads",
      "1 questionnaire per month",
      "Basic AI responses",
      "Community support"
    ]
  },
  {
    id: "starter",
    name: "Starter",
    price: "$49",
    description: "For lean sales and security teams.",
    features: [
      "5 users",
      "100 documents",
      "Unlimited questionnaires",
      "AI chat",
      "Compliance dashboard",
      "Email support"
    ]
  },
  {
    id: "professional",
    name: "Professional",
    price: "$199",
    description: "Advanced automation for scaling vendors.",
    featured: true,
    features: [
      "Unlimited users",
      "Unlimited documents",
      "Advanced AI",
      "Approval workflows",
      "Analytics",
      "API access",
      "Priority support",
      "Advanced exports",
      "Custom templates"
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "Security automation for complex programs.",
    features: [
      "Unlimited AI usage",
      "SAML/OIDC SSO",
      "Dedicated onboarding",
      "Custom integrations",
      "SLA",
      "Private cloud options",
      "Dedicated account manager",
      "Audit assistance"
    ]
  }
];
