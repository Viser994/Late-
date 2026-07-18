import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PLANS, PLAN_ORDER } from "@/lib/constants";

export function Pricing({ compact = false }: { compact?: boolean }) {
  return (
    <section id="pricing" className={cn(!compact && "py-24")}>
      <div className="container">
        {!compact && (
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, scalable pricing</h2>
            <p className="mt-4 text-muted-foreground">Start free. Upgrade when you're ready. Cancel anytime.</p>
          </div>
        )}
        <div className="mt-14 grid gap-6 lg:grid-cols-4">
          {PLAN_ORDER.map((tier) => {
            const plan = PLANS[tier];
            return (
              <Card
                key={tier}
                className={cn(
                  "relative flex flex-col",
                  plan.highlighted && "border-primary shadow-lg ring-1 ring-primary/30"
                )}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most popular</Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.priceLabel}</span>
                    {plan.priceMonthly !== null && plan.priceMonthly > 0 && (
                      <span className="text-muted-foreground">/mo</span>
                    )}
                  </div>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ul className="space-y-2.5 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-6 w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <Link href={tier === "ENTERPRISE" ? "/sign-up?plan=enterprise" : `/sign-up?plan=${tier.toLowerCase()}`}>
                      {plan.cta}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
