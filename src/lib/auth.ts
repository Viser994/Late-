import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import type { UserRole } from "@prisma/client";

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      memberships: {
        include: { organization: true },
      },
    },
  });

  return user;
}

export async function getOrganizationMember(organizationId: string) {
  const { userId } = await auth();
  if (!userId) return null;

  const member = await prisma.organizationMember.findFirst({
    where: {
      organization: { id: organizationId },
      user: { clerkId: userId },
    },
    include: {
      user: true,
      organization: true,
    },
  });

  return member;
}

export async function requireOrganizationAccess(
  organizationId: string,
  minimumRole?: UserRole
) {
  const member = await getOrganizationMember(organizationId);
  if (!member) throw new Error("Unauthorized");

  if (minimumRole) {
    const roleHierarchy: Record<UserRole, number> = {
      OWNER: 6,
      ADMIN: 5,
      SECURITY_MANAGER: 4,
      SECURITY_ANALYST: 3,
      SALES_ENGINEER: 2,
      VIEWER: 1,
    };

    if (roleHierarchy[member.role] < roleHierarchy[minimumRole]) {
      throw new Error("Insufficient permissions");
    }
  }

  return member;
}

export async function syncUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const user = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      avatarUrl: clerkUser.imageUrl,
    },
    create: {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      avatarUrl: clerkUser.imageUrl,
    },
  });

  return user;
}
