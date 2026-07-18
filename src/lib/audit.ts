import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function writeAuditLog(input: {
  organizationId?: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
      organization: input.organizationId
        ? { connect: { id: input.organizationId } }
        : undefined,
      actor: input.actorId ? { connect: { id: input.actorId } } : undefined
    }
  });
}
