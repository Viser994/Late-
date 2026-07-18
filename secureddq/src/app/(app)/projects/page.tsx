import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getQuestionnaires } from "@/lib/data";

export const metadata: Metadata = { title: "Projects" };

const PROJECTS = [
  { name: "Enterprise Deals", color: "bg-indigo-500", description: "Large customer security reviews and DDQs." },
  { name: "RFPs", color: "bg-emerald-500", description: "Security sections of active RFP responses." },
  { name: "Healthcare", color: "bg-rose-500", description: "HIPAA and healthcare vendor assessments." },
  { name: "Legal", color: "bg-amber-500", description: "DPAs and privacy questionnaires." },
  { name: "SMB", color: "bg-sky-500", description: "Small-business security addenda." },
];

export default async function ProjectsPage() {
  const questionnaires = await getQuestionnaires();
  const countFor = (name: string) => questionnaires.filter((q) => q.project === name).length;

  return (
    <>
      <PageHeader
        title="Projects"
        description="Group questionnaires by team, deal, or workstream."
        actions={
          <Button>
            <Plus className="h-4 w-4" /> New project
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((p) => (
          <Link key={p.name} href="/questionnaires">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${p.color} text-white`}>
                    <FolderKanban className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <Badge variant="secondary" className="mt-0.5">
                      {countFor(p.name)} questionnaires
                    </Badge>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{p.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
