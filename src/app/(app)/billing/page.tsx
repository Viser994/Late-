import { CreditCard, FileText, RefreshCcw } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PricingGrid } from "@/components/pricing-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BillingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Billing"
        title="Subscription and invoices"
        description="Upgrade, downgrade, cancel, update payment methods, view invoices, and manage organization subscriptions through Stripe Billing."
        action={<Button>Open billing portal</Button>}
      />

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current plan</CardTitle>
            <Badge variant="success">Professional</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {[
            ["Payment method", "Visa ending in 4242", CreditCard],
            ["Next invoice", "$199 on Aug 18", FileText],
            ["Subscription status", "Active", RefreshCcw]
          ].map(([title, value, Icon]) => (
            <div key={String(title)} className="rounded-2xl border p-4">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">{String(title)}</p>
              <p className="font-semibold">{String(value)}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <PricingGrid />
    </>
  );
}
