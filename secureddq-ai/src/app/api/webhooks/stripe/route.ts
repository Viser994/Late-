import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { stripe } from "@/lib/billing/stripe";

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook signature missing" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return NextResponse.json({ error: `Webhook verification failed: ${String(error)}` }, { status: 400 });
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    const subscription = event.data.object as Stripe.Subscription;
    const stripeSubscriptionId = subscription.id;
    const stripeCustomerId = String(subscription.customer);
    const status = subscription.status;
    const firstItem = subscription.items.data[0];
    const currentPeriodStart = firstItem?.current_period_start
      ? new Date(firstItem.current_period_start * 1000)
      : null;
    const currentPeriodEnd = firstItem?.current_period_end ? new Date(firstItem.current_period_end * 1000) : null;

    await db.subscription.updateMany({
      where: { stripeCustomerId },
      data: {
        stripeSubscriptionId,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object;
    const stripeCustomerId = String(invoice.customer);
    const subscription = await db.subscription.findFirst({
      where: { stripeCustomerId },
      select: { organizationId: true },
    });

    if (subscription) {
      await db.invoice.upsert({
        where: { stripeInvoiceId: invoice.id },
        update: {
          amountCents: invoice.amount_paid,
          currency: invoice.currency ?? "usd",
          status: invoice.status ?? "paid",
          hostedUrl: invoice.hosted_invoice_url ?? undefined,
          paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : undefined,
        },
        create: {
          organizationId: subscription.organizationId,
          stripeInvoiceId: invoice.id,
          amountCents: invoice.amount_paid,
          currency: invoice.currency ?? "usd",
          status: invoice.status ?? "paid",
          hostedUrl: invoice.hosted_invoice_url ?? undefined,
          paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : undefined,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
