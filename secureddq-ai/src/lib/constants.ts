import type { UserRole } from "@prisma/client";

export const APP_NAME = "SecureDDQ AI";
export const APP_DESCRIPTION =
  "AI-powered security questionnaire automation for enterprise teams";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  OWNER: 6,
  ADMIN: 5,
  SECURITY_MANAGER: 4,
  SECURITY_ANALYST: 3,
  SALES_ENGINEER: 2,
  VIEWER: 1,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  SECURITY_MANAGER: "Security Manager",
  SECURITY_ANALYST: "Security Analyst",
  SALES_ENGINEER: "Sales Engineer",
  VIEWER: "Viewer",
};

export const SUPPORTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
  "text/markdown",
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const COMPLIANCE_FRAMEWORKS = [
  { id: "SOC2", name: "SOC 2", description: "Service Organization Control 2" },
  { id: "ISO27001", name: "ISO 27001", description: "Information Security Management" },
  { id: "HIPAA", name: "HIPAA", description: "Health Insurance Portability" },
  { id: "GDPR", name: "GDPR", description: "General Data Protection Regulation" },
  { id: "PCI_DSS", name: "PCI DSS", description: "Payment Card Industry" },
  { id: "NIST", name: "NIST", description: "Cybersecurity Framework" },
] as const;

export const HOURS_SAVED_PER_QUESTION = 0.25;
export const AVG_DEAL_VALUE = 50000;
