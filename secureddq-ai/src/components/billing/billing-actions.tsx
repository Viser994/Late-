"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { SubscriptionPlan } from "@prisma/client";

export function BillingActions({
  organizationId,
  currentPlan,
}: {
  organizationId: string;
  currentPlan: SubscriptionPlan;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(plan: SubscriptionPlan) {
    setLoading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, organizationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.url) window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Portal failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {currentPlan === "FREE" && (
        <>
          <Button
            onClick={() => handleCheckout("STARTER")}
            disabled={!!loading}
          >
            {loading === "STARTER" ? "Loading..." : "Upgrade to Starter"}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleCheckout("PROFESSIONAL")}
            disabled={!!loading}
          >
            {loading === "PROFESSIONAL" ? "Loading..." : "Upgrade to Professional"}
          </Button>
        </>
      )}
      {currentPlan !== "FREE" && (
        <Button onClick={handlePortal} disabled={!!loading}>
          {loading === "portal" ? "Loading..." : "Manage Billing"}
        </Button>
      )}
    </div>
  );
}
