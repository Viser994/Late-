import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe, handleSubscriptionUpdate } from "@/lib/stripe";
import { db } from "@/lib/db";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headerPayload = await headers();
  const signature = headerPayload.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.updated":
    case "customer.subscription.created":
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = sub.metadata.organizationId;
      if (orgId) {
        await db.subscription.update({
          where: { organizationId: orgId },
          data: { plan: "FREE", status: "CANCELED" },
        });
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof invoice.parent?.subscription_details?.subscription === "string"
          ? invoice.parent.subscription_details.subscription
          : invoice.parent?.subscription_details?.subscription?.id;

      if (subscriptionId) {
        const subscription = await db.subscription.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
        });
        if (subscription) {
          await db.invoice.create({
            data: {
              subscriptionId: subscription.id,
              stripeInvoiceId: invoice.id,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: invoice.status ?? "paid",
              pdfUrl: invoice.invoice_pdf ?? undefined,
              periodStart: invoice.period_start
                ? new Date(invoice.period_start * 1000)
                : undefined,
              periodEnd: invoice.period_end
                ? new Date(invoice.period_end * 1000)
                : undefined,
            },
          });
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
