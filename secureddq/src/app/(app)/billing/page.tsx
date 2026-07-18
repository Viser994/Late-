import type { Metadata } from "next";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BillingPlans } from "@/components/app/billing-plans";
import { getInvoices, getOrgContext } from "@/lib/data";
import { PLANS } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const [org, invoices] = await Promise.all([getOrgContext(), getInvoices()]);
  const plan = PLANS[org.plan];

  const usage = [
    { label: "Users", used: org.seatsUsed, limit: plan.limits.users },
    { label: "Documents", used: 187, limit: plan.limits.documents },
    { label: "AI tokens (this month)", used: 6_400_000, limit: plan.limits.aiTokensPerMonth },
  ];

  return (
    <>
      <PageHeader title="Billing" description="Manage your subscription, usage, and invoices." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Current plan</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
            </div>
            <Badge className="text-sm">{plan.name}</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            {usage.map((u) => {
              const isUnlimited = u.limit === "unlimited";
              const pct = isUnlimited ? 30 : Math.min(100, Math.round((u.used / (u.limit as number)) * 100));
              return (
                <div key={u.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{u.label}</span>
                    <span className="text-muted-foreground">
                      {formatNumber(u.used)} / {isUnlimited ? "Unlimited" : formatNumber(u.limit as number)}
                    </span>
                  </div>
                  <Progress value={pct} indicatorClassName={pct > 90 ? "bg-warning" : undefined} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Visa •••• 4242</span>
                <Badge variant="secondary">Default</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Expires 08 / 2029</p>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Update your payment method in the billing portal.
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-4 mt-10 text-sm font-semibold text-muted-foreground">Plans</h2>
      <BillingPlans currentPlan={org.plan} />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm">{inv.number}</TableCell>
                  <TableCell>{formatCurrency(inv.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="success">{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(inv.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Download invoice">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US", { notation: n >= 100000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n);
}
