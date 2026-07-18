import Stripe from "stripe";

import { requireEnv } from "@/lib/env";

export function getStripeClient() {
  return new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
    typescript: true
  });
}

export const planPriceEnv = {
  starter: "STRIPE_PRICE_STARTER",
  professional: "STRIPE_PRICE_PROFESSIONAL"
} as const;
