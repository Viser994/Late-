import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe, createCheckoutSession, createStripeCustomer } from "@/lib/stripe";
import { z } from "zod";

const requestSchema = z.object({
  organizationId: z.string(),
  priceId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { organizationId, priceId } = requestSchema.parse(body);

    // Verify owner/admin access
    const member = await prisma.organizationMember.findFirst({
      where: {
        organization: { id: organizationId },
        user: { clerkId: userId },
        role: { in: ["OWNER", "ADMIN"] },
      },
      include: { user: true, organization: true },
    });

    if (!member) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    let subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    });

    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await createStripeCustomer(
        member.user.email,
        member.organization.name
      );
      customerId = customer.id;

      if (!subscription) {
        await prisma.subscription.create({
          data: {
            organizationId,
            stripeCustomerId: customerId,
          },
        });
      } else {
        await prisma.subscription.update({
          where: { organizationId },
          data: { stripeCustomerId: customerId },
        });
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await createCheckoutSession({
      customerId,
      priceId,
      organizationId,
      successUrl: `${appUrl}/dashboard?checkout=success`,
      cancelUrl: `${appUrl}/settings?checkout=canceled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
