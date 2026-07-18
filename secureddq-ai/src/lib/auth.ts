import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import type { OrganizationMember, User, UserRole } from "@prisma/client";
import { hasPermission, type Permission } from "./permissions";

export type AuthContext = {
  user: User;
  membership: OrganizationMember;
  organizationId: string;
  role: UserRole;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const { userId, orgId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  let user = await db.user.findUnique({ where: { clerkUserId: userId } });

  if (!user) {
    user = await db.user.create({
      data: {
        clerkUserId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        avatarUrl: clerkUser.imageUrl,
      },
    });
  }

  if (!orgId) return null;

  let organization = await db.organization.findUnique({
    where: { clerkOrgId: orgId },
  });

  if (!organization) {
    organization = await db.organization.create({
      data: {
        clerkOrgId: orgId,
        name: "My Organization",
        slug: `org-${user.id.slice(0, 8)}`,
        subscription: { create: { plan: "FREE", status: "ACTIVE" } },
        settings: { create: {} },
      },
    });
  }

  let membership = await db.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    const memberCount = await db.organizationMember.count({
      where: { organizationId: organization.id },
    });
    membership = await db.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        role: memberCount === 0 ? "OWNER" : "VIEWER",
        joinedAt: new Date(),
      },
    });
  }

  return {
    user,
    membership,
    organizationId: organization.id,
    role: membership.role,
  };
}

export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    throw new Error("Unauthorized");
  }
  return ctx;
}

export async function requirePermission(
  permission: Permission
): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!hasPermission(ctx.role, permission)) {
    throw new Error("Forbidden");
  }
  return ctx;
}
