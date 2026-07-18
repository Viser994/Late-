import type { Role } from "@prisma/client";

/**
 * Permission catalog. Each permission is a `resource:action` string. Roles are
 * granted sets of permissions; higher roles inherit lower-role permissions.
 */
export type Permission =
  | "org:manage"
  | "org:billing"
  | "members:invite"
  | "members:manage"
  | "documents:read"
  | "documents:write"
  | "documents:delete"
  | "questionnaires:read"
  | "questionnaires:write"
  | "answers:draft"
  | "answers:approve"
  | "compliance:read"
  | "compliance:write"
  | "chat:use"
  | "analytics:read"
  | "apikeys:manage"
  | "audit:read";

const VIEWER: Permission[] = ["documents:read", "questionnaires:read", "compliance:read", "analytics:read"];

const SALES_ENGINEER: Permission[] = [...VIEWER, "questionnaires:write", "chat:use"];

const SECURITY_ANALYST: Permission[] = [
  ...SALES_ENGINEER,
  "documents:write",
  "answers:draft",
  "compliance:write",
];

const SECURITY_MANAGER: Permission[] = [
  ...SECURITY_ANALYST,
  "documents:delete",
  "answers:approve",
  "audit:read",
];

const ADMIN: Permission[] = [
  ...SECURITY_MANAGER,
  "members:invite",
  "members:manage",
  "apikeys:manage",
  "org:manage",
];

const OWNER: Permission[] = [...ADMIN, "org:billing"];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  VIEWER,
  SALES_ENGINEER,
  SECURITY_ANALYST,
  SECURITY_MANAGER,
  ADMIN,
  OWNER,
};

/** Rank used for comparing role seniority (higher = more privileged). */
export const ROLE_RANK: Record<Role, number> = {
  VIEWER: 0,
  SALES_ENGINEER: 1,
  SECURITY_ANALYST: 2,
  SECURITY_MANAGER: 3,
  ADMIN: 4,
  OWNER: 5,
};

/** Whether a role has a given permission. */
export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Whether `role` is at least as privileged as `minimum`. */
export function atLeast(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

/** Throw when a role lacks a permission (for use in server actions). */
export function assertCan(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    throw new Error(`Forbidden: role ${role} lacks permission "${permission}".`);
  }
}
