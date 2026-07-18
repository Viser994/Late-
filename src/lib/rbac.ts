import type { OrganizationRole } from "@prisma/client";

export type Permission =
  | "organization.manage"
  | "users.invite"
  | "billing.manage"
  | "documents.read"
  | "documents.write"
  | "questionnaires.read"
  | "questionnaires.write"
  | "answers.review"
  | "analytics.read"
  | "admin.read"
  | "api_keys.manage";

const rolePermissions = {
  OWNER: [
    "organization.manage",
    "users.invite",
    "billing.manage",
    "documents.read",
    "documents.write",
    "questionnaires.read",
    "questionnaires.write",
    "answers.review",
    "analytics.read",
    "admin.read",
    "api_keys.manage"
  ],
  ADMIN: [
    "organization.manage",
    "users.invite",
    "documents.read",
    "documents.write",
    "questionnaires.read",
    "questionnaires.write",
    "answers.review",
    "analytics.read",
    "admin.read",
    "api_keys.manage"
  ],
  SECURITY_MANAGER: [
    "documents.read",
    "documents.write",
    "questionnaires.read",
    "questionnaires.write",
    "answers.review",
    "analytics.read"
  ],
  SECURITY_ANALYST: [
    "documents.read",
    "documents.write",
    "questionnaires.read",
    "questionnaires.write",
    "answers.review"
  ],
  SALES_ENGINEER: [
    "documents.read",
    "questionnaires.read",
    "questionnaires.write",
    "analytics.read"
  ],
  VIEWER: ["documents.read", "questionnaires.read", "analytics.read"]
} satisfies Record<OrganizationRole, Permission[]>;

export function can(role: OrganizationRole, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export function assertPermission(role: OrganizationRole, permission: Permission) {
  if (!can(role, permission)) {
    throw new Error(`Role ${role} is missing permission ${permission}`);
  }
}

export function permissionsFor(role: OrganizationRole) {
  return rolePermissions[role];
}
