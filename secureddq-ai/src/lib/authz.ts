import { auth, currentUser } from "@clerk/nextjs/server";
import type { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";

export async function requireUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const clerkProfile = await currentUser();
  if (!clerkProfile?.emailAddresses[0]?.emailAddress) {
    throw new Error("Unable to resolve user email");
  }

  const email = clerkProfile.emailAddresses[0].emailAddress.toLowerCase();
  const firstName = clerkProfile.firstName ?? undefined;
  const lastName = clerkProfile.lastName ?? undefined;

  return db.user.upsert({
    where: { clerkUserId: userId },
    update: { email, firstName, lastName },
    create: { clerkUserId: userId, email, firstName, lastName },
  });
}

export async function requireMembership(organizationId: string) {
  const user = await requireUser();
  const membership = await db.organizationMembership.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId: user.id,
      },
    },
  });

  if (!membership) {
    throw new Error("Organization access denied");
  }

  return { user, membership };
}

export async function requirePermission(
  organizationId: string,
  resource: Parameters<typeof can>[1],
  action: Parameters<typeof can>[2],
) {
  const context = await requireMembership(organizationId);
  const allowed = can(context.membership.role as UserRole, resource, action as never);

  if (!allowed) {
    throw new Error("Forbidden");
  }

  return context;
}
