import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_LIMITS } from "@/lib/billing/plans";

export default function BillingPage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 px-6 py-8 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Billing and subscriptions</CardTitle>
          <CardDescription>
            Manage plan upgrades, invoices, and payment methods through the Stripe billing portal.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(PLAN_LIMITS).map(([plan, limits]) => (
          <Card key={plan}>
            <CardHeader>
              <CardTitle>{plan}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <p>Users: {String(limits.users)}</p>
              <p>Documents: {String(limits.documents)}</p>
              <p>Questionnaires: {String(limits.questionnairesPerMonth)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
