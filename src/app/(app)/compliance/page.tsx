import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { complianceCards } from "@/lib/demo-data";

export default function CompliancePage() {
  return (
    <>
      <PageHeader
        eyebrow="Compliance center"
        title="Framework coverage"
        description="Map documents and evidence chunks to SOC2, ISO27001, HIPAA, GDPR, PCI DSS, and NIST controls."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {complianceCards.map((card) => (
          <Card key={card.framework}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{card.framework}</CardTitle>
                <Badge variant={card.coverage > 80 ? "success" : "warning"}>
                  {card.coverage}% covered
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${card.coverage}%` }}
                />
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                {card.missing < 10 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                {card.missing} controls need stronger evidence
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
