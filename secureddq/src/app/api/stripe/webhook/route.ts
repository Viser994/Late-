import { NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripe";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook handler. Verifies the signature (when configured) and updates
 * subscription/invoice state. In demo mode it acknowledges without processing.
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    return NextResponse.json({ received: true, mode: "demo" });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${(err as Error).message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "invoice.paid":
    case "invoice.payment_failed":
      // Persist subscription/invoice changes here (Prisma) in production.
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
