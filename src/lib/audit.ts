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
    data: input
  });
}
