import type { UserRole } from "@prisma/client";
import { ROLE_HIERARCHY } from "./constants";

export type Permission =
  | "org:manage"
  | "org:billing"
  | "users:invite"
  | "users:manage"
  | "documents:upload"
  | "documents:delete"
  | "documents:archive"
  | "questionnaires:create"
  | "questionnaires:edit"
  | "questionnaires:delete"
  | "answers:generate"
  | "answers:edit"
  | "answers:approve"
  | "answers:reject"
  | "compliance:manage"
  | "analytics:view"
  | "admin:access"
  | "api:manage"
  | "settings:manage"
  | "export:data";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [
    "org:manage",
    "org:billing",
    "users:invite",
    "users:manage",
    "documents:upload",
    "documents:delete",
    "documents:archive",
    "questionnaires:create",
    "questionnaires:edit",
    "questionnaires:delete",
    "answers:generate",
    "answers:edit",
    "answers:approve",
    "answers:reject",
    "compliance:manage",
    "analytics:view",
    "admin:access",
    "api:manage",
    "settings:manage",
    "export:data",
  ],
  ADMIN: [
    "org:manage",
    "org:billing",
    "users:invite",
    "users:manage",
    "documents:upload",
    "documents:delete",
    "documents:archive",
    "questionnaires:create",
    "questionnaires:edit",
    "questionnaires:delete",
    "answers:generate",
    "answers:edit",
    "answers:approve",
    "answers:reject",
    "compliance:manage",
    "analytics:view",
    "api:manage",
    "settings:manage",
    "export:data",
  ],
  SECURITY_MANAGER: [
    "users:invite",
    "documents:upload",
    "documents:delete",
    "documents:archive",
    "questionnaires:create",
    "questionnaires:edit",
    "answers:generate",
    "answers:edit",
    "answers:approve",
    "answers:reject",
    "compliance:manage",
    "analytics:view",
    "export:data",
  ],
  SECURITY_ANALYST: [
    "documents:upload",
    "questionnaires:create",
    "questionnaires:edit",
    "answers:generate",
    "answers:edit",
    "answers:approve",
    "compliance:manage",
    "analytics:view",
    "export:data",
  ],
  SALES_ENGINEER: [
    "questionnaires:create",
    "questionnaires:edit",
    "answers:generate",
    "answers:edit",
    "export:data",
    "analytics:view",
  ],
  VIEWER: ["analytics:view"],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasMinRole(role: UserRole, minRole: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minRole];
}

export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
