import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pricingPlans } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PricingGrid() {
  return (
    <div className="grid gap-5 lg:grid-cols-4">
      {pricingPlans.map((plan) => (
        <Card
          key={plan.id}
          className={cn(
            "relative overflow-hidden",
            plan.featured && "border-primary shadow-glow"
          )}
        >
          {plan.featured ? (
            <div className="absolute right-4 top-4">
              <Badge>Popular</Badge>
            </div>
          ) : null}
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
            <div className="pt-4">
              <span className="text-3xl font-semibold">{plan.price}</span>
              {plan.id !== "free" && plan.id !== "enterprise" ? (
                <span className="text-muted-foreground">/month</span>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              variant={plan.featured ? "default" : "outline"}
            >
              {plan.id === "enterprise" ? "Contact sales" : "Start now"}
            </Button>
            <ul className="mt-5 space-y-3 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
