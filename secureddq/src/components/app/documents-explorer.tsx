"use client";

import { useMemo, useState } from "react";
import { Search, FileText, Clock, MoreHorizontal, Download, History, Archive } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentStatusBadge } from "@/components/app/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DocumentView } from "@/lib/data/types";
import { timeAgo } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  POLICY: "Policy",
  SOC_REPORT: "SOC report",
  ISO_DOCUMENT: "ISO document",
  ARCHITECTURE: "Architecture",
  PENTEST_REPORT: "Pentest",
  SECURITY_POLICY: "Security policy",
  EVIDENCE: "Evidence",
  OTHER: "Other",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function expiryLabel(expiresAt: string | null): { text: string; danger: boolean } | null {
  if (!expiresAt) return null;
  const days = Math.round((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { text: "Expired", danger: true };
  if (days <= 30) return { text: `Expires in ${days}d`, danger: true };
  return { text: `Expires in ${days}d`, danger: false };
}

export function DocumentsExplorer({ documents }: { documents: DocumentView[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("ALL");

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      const matchesQuery =
        !query ||
        doc.title.toLowerCase().includes(query.toLowerCase()) ||
        doc.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
      const matchesType = type === "ALL" || doc.type === type;
      return matchesQuery && matchesType;
    });
  }, [documents, query, type]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Semantic search across documents and tags…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="sm:w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Chunks</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((doc) => {
              const expiry = expiryLabel(doc.expiresAt);
              return (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {doc.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                          {expiry && (
                            <span className={`flex items-center gap-1 text-[10px] ${expiry.danger ? "text-destructive" : "text-muted-foreground"}`}>
                              <Clock className="h-3 w-3" /> {expiry.text}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{TYPE_LABELS[doc.type]}</TableCell>
                  <TableCell>
                    <DocumentStatusBadge status={doc.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{doc.chunkCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatSize(doc.sizeBytes)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">v{doc.version}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{timeAgo(doc.updatedAt)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Download /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <History /> Version history
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive /> Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No documents match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
