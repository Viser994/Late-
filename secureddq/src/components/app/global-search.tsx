"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, FileText, FileStack, MessageSquare, ShieldCheck, Users, FolderKanban } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Result {
  category: string;
  icon: typeof FileText;
  title: string;
  subtitle: string;
  href: string;
}

const INDEX: Result[] = [
  { category: "Documents", icon: FileText, title: "Encryption Standard", subtitle: "AES-256 at rest, TLS 1.2+ in transit", href: "/documents" },
  { category: "Documents", icon: FileText, title: "Incident Response Plan", subtitle: "NIST 800-61 lifecycle", href: "/documents" },
  { category: "Questionnaires", icon: FileStack, title: "Acme Corp Vendor Assessment", subtitle: "142 questions · In progress", href: "/questionnaires/qn1" },
  { category: "Answers", icon: MessageSquare, title: "Do you encrypt data at rest?", subtitle: "Approved · 97% confidence", href: "/questionnaires/qn1" },
  { category: "Compliance", icon: ShieldCheck, title: "SOC 2 CC6.1 — Logical access", subtitle: "Implemented · 4 documents mapped", href: "/compliance" },
  { category: "People", icon: Users, title: "Marcus Reed", subtitle: "Security Manager", href: "/members" },
  { category: "Projects", icon: FolderKanban, title: "Enterprise Deals", subtitle: "12 questionnaires", href: "/projects" },
];

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    if (!query.trim()) return INDEX;
    const q = query.toLowerCase();
    return INDEX.filter((r) => `${r.title} ${r.subtitle} ${r.category}`.toLowerCase().includes(q));
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Result[]>();
    for (const r of results) {
      const arr = map.get(r.category) ?? [];
      arr.push(r);
      map.set(r.category, arr);
    }
    return [...map.entries()];
  }, [results]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search across projects, documents, answers, evidence, controls, and people…"
          className="h-12 pl-12 text-base"
        />
      </div>

      {grouped.length === 0 && <p className="text-sm text-muted-foreground">No results for “{query}”.</p>}

      {grouped.map(([category, items]) => (
        <div key={category}>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{category}</h3>
            <Badge variant="secondary">{items.length}</Badge>
          </div>
          <Card>
            <CardContent className="divide-y p-0">
              {items.map((r, i) => (
                <Link key={i} href={r.href} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <r.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.subtitle}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
