import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe/plans";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BillingActions } from "@/components/billing/billing-actions";
import { CheckCircle2 } from "lucide-react";

export default async function BillingPage() {
  const { organizationId } = await requireAuth();

  const subscription = await db.subscription.findUnique({
    where: { organizationId },
    include: { invoices: { orderBy: { createdAt: "desc" }, take: 10 } },
  });

  const plan = subscription?.plan ?? "FREE";
  const planConfig = PLANS[plan];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>
                  {planConfig.description}
                </CardDescription>
              </div>
              <Badge>{subscription?.status ?? "ACTIVE"}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-4xl font-bold">{planConfig.priceLabel}</span>
              {planConfig.price > 0 && (
                <span className="text-muted-foreground">/month</span>
              )}
              <p className="mt-1 text-lg font-medium">{planConfig.name}</p>
            </div>
            <ul className="mb-6 space-y-2">
              {planConfig.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
            <BillingActions
              organizationId={organizationId}
              currentPlan={plan}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Documents</p>
              <p className="font-medium">
                {await db.document.count({ where: { organizationId } })}
                {planConfig.limits.documents > 0
                  ? ` / ${planConfig.limits.documents}`
                  : " / Unlimited"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Team Members</p>
              <p className="font-medium">
                {await db.organizationMember.count({ where: { organizationId } })}
                {planConfig.limits.users > 0
                  ? ` / ${planConfig.limits.users}`
                  : " / Unlimited"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {subscription?.invoices && subscription.invoices.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscription.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">
                      ${(invoice.amount / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={invoice.status === "paid" ? "success" : "secondary"}>
                    {invoice.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
