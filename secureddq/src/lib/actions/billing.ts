"use server";

import { redirect } from "next/navigation";
import type { PlanTier } from "@prisma/client";
import { createCheckoutSession, createBillingPortalSession } from "@/lib/billing/stripe";
import { getOrgContext } from "@/lib/data";

function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}${path}`;
}

/** Begin a checkout/upgrade for the given plan. */
export async function startCheckout(plan: PlanTier): Promise<void> {
  const org = await getOrgContext();
  const { url } = await createCheckoutSession({
    plan,
    organizationId: org.id,
    customerEmail: "billing@northwind.io",
    successUrl: appUrl("/billing?success=1"),
    cancelUrl: appUrl("/billing?canceled=1"),
  });
  redirect(url);
}

/** Open the Stripe billing portal (or demo fallback). */
export async function openBillingPortal(): Promise<void> {
  const { url } = await createBillingPortalSession(null, appUrl("/billing"));
  redirect(url);
}
