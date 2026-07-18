"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    description: "For individuals getting started",
    monthly: 0,
    annual: 0,
    badge: null,
    features: [
      "1 organization",
      "2 users",
      "10 document uploads",
      "1 questionnaire per month",
      "Basic AI responses",
      "Community support",
    ],
    cta: "Get started free",
    href: "/sign-up",
    variant: "outline" as const,
  },
  {
    name: "Starter",
    description: "For growing security teams",
    monthly: 49,
    annual: 39,
    badge: null,
    features: [
      "5 users",
      "100 documents",
      "Unlimited questionnaires",
      "AI chat assistant",
      "Compliance dashboard",
      "Email support",
      "API access",
      "Export to Excel/Word/PDF",
    ],
    cta: "Start free trial",
    href: "/sign-up?plan=starter",
    variant: "outline" as const,
  },
  {
    name: "Professional",
    description: "For serious enterprise security teams",
    monthly: 199,
    annual: 159,
    badge: "Most Popular",
    features: [
      "Unlimited users",
      "Unlimited documents",
      "Advanced AI (GPT-4)",
      "Approval workflows",
      "Analytics & reporting",
      "Priority support",
      "Advanced exports",
      "Custom templates",
      "Audit logs",
      "SSO (Google/Microsoft)",
    ],
    cta: "Start free trial",
    href: "/sign-up?plan=professional",
    variant: "default" as const,
  },
  {
    name: "Enterprise",
    description: "For large organizations with custom needs",
    monthly: null,
    annual: null,
    badge: null,
    features: [
      "Everything in Professional",
      "Unlimited AI usage",
      "SAML/OIDC SSO",
      "Dedicated onboarding",
      "Custom integrations",
      "SLA guarantee",
      "Private cloud options",
      "Dedicated account manager",
      "Audit assistance",
      "Advanced security controls",
    ],
    cta: "Contact sales",
    href: "/contact",
    variant: "outline" as const,
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Start free. Scale as you grow. No hidden fees.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-4 p-1 rounded-full bg-muted border border-border/60">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                !annual
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                annual
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Annual
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative p-6 rounded-2xl border flex flex-col",
                plan.badge
                  ? "border-primary shadow-lg shadow-primary/10 bg-card"
                  : "border-border/60 bg-card"
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gap-1">
                    <Zap className="w-3 h-3" />
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                {plan.monthly !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">
                      ${annual ? plan.annual : plan.monthly}
                    </span>
                    <span className="text-muted-foreground text-sm">/month</span>
                  </div>
                ) : (
                  <div className="text-4xl font-black">Custom</div>
                )}
                {annual && plan.monthly !== null && plan.monthly > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Billed annually
                  </p>
                )}
              </div>

              <ul className="space-y-3 flex-1 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.variant}
                className="w-full"
                asChild
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}
