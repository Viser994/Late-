import { UserRole } from "@prisma/client";

export const roleHierarchy: Record<UserRole, number> = {
  OWNER: 100,
  ADMIN: 90,
  SECURITY_MANAGER: 80,
  SECURITY_ANALYST: 70,
  SALES_ENGINEER: 60,
  VIEWER: 10,
};

export const permissions = {
  organization: {
    manage: [UserRole.OWNER, UserRole.ADMIN],
    invite: [UserRole.OWNER, UserRole.ADMIN, UserRole.SECURITY_MANAGER],
    read: [
      UserRole.OWNER,
      UserRole.ADMIN,
      UserRole.SECURITY_MANAGER,
      UserRole.SECURITY_ANALYST,
      UserRole.SALES_ENGINEER,
      UserRole.VIEWER,
    ],
  },
  knowledgeBase: {
    write: [UserRole.OWNER, UserRole.ADMIN, UserRole.SECURITY_MANAGER, UserRole.SECURITY_ANALYST],
    read: [
      UserRole.OWNER,
      UserRole.ADMIN,
      UserRole.SECURITY_MANAGER,
      UserRole.SECURITY_ANALYST,
      UserRole.SALES_ENGINEER,
      UserRole.VIEWER,
    ],
  },
  questionnaire: {
    write: [UserRole.OWNER, UserRole.ADMIN, UserRole.SECURITY_MANAGER, UserRole.SECURITY_ANALYST],
    approve: [UserRole.OWNER, UserRole.ADMIN, UserRole.SECURITY_MANAGER],
    read: [
      UserRole.OWNER,
      UserRole.ADMIN,
      UserRole.SECURITY_MANAGER,
      UserRole.SECURITY_ANALYST,
      UserRole.SALES_ENGINEER,
      UserRole.VIEWER,
    ],
  },
  billing: {
    manage: [UserRole.OWNER, UserRole.ADMIN],
    read: [UserRole.OWNER, UserRole.ADMIN],
  },
} as const;

type PermissionResource = keyof typeof permissions;
type PermissionAction<R extends PermissionResource> = keyof (typeof permissions)[R];

export function can<R extends PermissionResource, A extends PermissionAction<R>>(
  role: UserRole,
  resource: R,
  action: A,
) {
  const allowedRoles = permissions[resource][action] as readonly UserRole[];
  return allowedRoles.includes(role);
}

export function isAtLeastRole(role: UserRole, minimumRole: UserRole) {
  return roleHierarchy[role] >= roleHierarchy[minimumRole];
}
