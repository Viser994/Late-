import { NextRequest, NextResponse } from "next/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.warn("CLERK_WEBHOOK_SECRET not set, skipping verification");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const headerPayload = req.headers;
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (evt.type) {
    case "user.created": {
      await prisma.user.create({
        data: {
          clerkId: evt.data.id,
          email: evt.data.email_addresses[0]?.email_address ?? "",
          firstName: evt.data.first_name,
          lastName: evt.data.last_name,
          avatarUrl: evt.data.image_url,
        },
      });
      break;
    }

    case "user.updated": {
      await prisma.user.upsert({
        where: { clerkId: evt.data.id },
        update: {
          email: evt.data.email_addresses[0]?.email_address ?? "",
          firstName: evt.data.first_name,
          lastName: evt.data.last_name,
          avatarUrl: evt.data.image_url,
        },
        create: {
          clerkId: evt.data.id,
          email: evt.data.email_addresses[0]?.email_address ?? "",
          firstName: evt.data.first_name,
          lastName: evt.data.last_name,
          avatarUrl: evt.data.image_url,
        },
      });
      break;
    }

    case "user.deleted": {
      if (evt.data.id) {
        await prisma.user.delete({
          where: { clerkId: evt.data.id },
        }).catch(() => {});
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
