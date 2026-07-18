import { NotificationChannel, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function notifyUser(input: {
  organizationId: string;
  userId?: string;
  title: string;
  body: string;
  channels?: NotificationChannel[];
  metadata?: Record<string, unknown>;
}) {
  const channels = input.channels ?? ["IN_APP"];

  return prisma.notification.createMany({
    data: channels.map((channel) => ({
      organizationId: input.organizationId,
      userId: input.userId,
      channel,
      title: input.title,
      body: input.body,
      metadata: input.metadata as Prisma.InputJsonValue | undefined
    }))
  });
}
