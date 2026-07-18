"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PLANS, PLAN_ORDER } from "@/lib/constants";
import { startCheckout, openBillingPortal } from "@/lib/actions/billing";
import type { PlanTier } from "@prisma/client";

export function BillingPlans({ currentPlan }: { currentPlan: PlanTier }) {
  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {PLAN_ORDER.map((tier) => {
        const plan = PLANS[tier];
        const isCurrent = tier === currentPlan;
        return (
          <Card key={tier} className={cn("flex flex-col", isCurrent && "border-primary ring-1 ring-primary/30")}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                {isCurrent && <Badge>Current</Badge>}
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-bold">{plan.priceLabel}</span>
                {plan.priceMonthly !== null && plan.priceMonthly > 0 && <span className="text-muted-foreground">/mo</span>}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="space-y-2 text-sm">
                {plan.features.slice(0, 6).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {isCurrent ? (
                  <form action={openBillingPortal}>
                    <Button type="submit" variant="outline" className="w-full">
                      Manage
                    </Button>
                  </form>
                ) : tier === "ENTERPRISE" ? (
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/sign-up?plan=enterprise">Contact sales</a>
                  </Button>
                ) : tier === "FREE" ? (
                  <form action={openBillingPortal}>
                    <Button type="submit" variant="ghost" className="w-full">
                      Downgrade
                    </Button>
                  </form>
                ) : (
                  <form action={startCheckout.bind(null, tier)}>
                    <Button type="submit" className="w-full">
                      {planIndex(tier) > planIndex(currentPlan) ? "Upgrade" : "Switch"}
                    </Button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function planIndex(tier: PlanTier): number {
  return PLAN_ORDER.indexOf(tier);
}
