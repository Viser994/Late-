import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CompliancePage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Compliance center</CardTitle>
          <CardDescription>
            SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, and NIST control mapping with coverage tracking.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-zinc-600 dark:text-zinc-300">
          The data model supports control-to-document relationships, progress scoring, and missing-control tracking.
        </CardContent>
      </Card>
    </main>
  );
}
