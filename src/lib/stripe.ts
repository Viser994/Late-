import Stripe from "stripe";

import { requireEnv } from "@/lib/env";

export function getStripeClient() {
  return new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
    apiVersion: "2025-06-30.basil",
    typescript: true
  });
}

export const planPriceEnv = {
  starter: "STRIPE_PRICE_STARTER",
  professional: "STRIPE_PRICE_PROFESSIONAL"
} as const;
