import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { env, requireEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const payload = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    requireEnv("STRIPE_WEBHOOK_SECRET")
  );

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object;
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status.toUpperCase() as never,
        currentPeriodEnd: subscription.items.data[0]?.current_period_end
          ? new Date(subscription.items.data[0].current_period_end * 1000)
          : null
      }
    });
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;
    const stripeSubscriptionId =
      typeof invoice.parent?.subscription_details?.subscription === "string"
        ? invoice.parent.subscription_details.subscription
        : undefined;

    if (stripeSubscriptionId) {
      const subscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId }
      });

      if (subscription) {
        await prisma.invoice.upsert({
          where: { stripeInvoiceId: invoice.id },
          update: {
            amountDue: invoice.amount_due,
            currency: invoice.currency,
            hostedUrl: invoice.hosted_invoice_url,
            pdfUrl: invoice.invoice_pdf,
            paidAt: new Date()
          },
          create: {
            subscriptionId: subscription.id,
            stripeInvoiceId: invoice.id,
            amountDue: invoice.amount_due,
            currency: invoice.currency,
            hostedUrl: invoice.hosted_invoice_url,
            pdfUrl: invoice.invoice_pdf,
            paidAt: new Date()
          }
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
