"use client";

import { useState } from "react";
import { Plus, Copy, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface KeyRow {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsed: string | null;
}

const initial: KeyRow[] = [
  { id: "k1", name: "Production", prefix: "sddq_live_a1b2", createdAt: "2026-03-02", lastUsed: "2026-07-17" },
  { id: "k2", name: "CI pipeline", prefix: "sddq_live_9f8e", createdAt: "2026-05-14", lastUsed: "2026-07-10" },
];

function randomKey() {
  return `sddq_live_${Math.random().toString(36).slice(2, 10)}`;
}

export function ApiKeysManager() {
  const [keys, setKeys] = useState<KeyRow[]>(initial);

  const create = () => {
    const full = randomKey();
    const row: KeyRow = {
      id: `k-${Date.now()}`,
      name: "New key",
      prefix: full.slice(0, 14),
      createdAt: new Date().toISOString().slice(0, 10),
      lastUsed: null,
    };
    setKeys((prev) => [row, ...prev]);
    navigator.clipboard?.writeText(full).catch(() => undefined);
    toast.success("API key created", { description: "Copied to clipboard — you won't see it again." });
  };

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <KeyRound className="h-4 w-4" /> API keys
        </div>
        <Button size="sm" onClick={create}>
          <Plus className="h-4 w-4" /> New key
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last used</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((k) => (
            <TableRow key={k.id}>
              <TableCell className="font-medium">{k.name}</TableCell>
              <TableCell>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{k.prefix}••••••••</code>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{k.createdAt}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{k.lastUsed ?? <Badge variant="secondary">Never</Badge>}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.success("Copied prefix")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => {
                      setKeys((prev) => prev.filter((x) => x.id !== k.id));
                      toast.success("Key revoked");
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
