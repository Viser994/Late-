"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, X, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function NewQuestionnaireForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!title.trim()) {
      toast.error("Give the questionnaire a name.");
      return;
    }
    setBusy(true);
    const stages = ["Uploading file", "Detecting sections", "Extracting questions", "Classifying answer types", "Generating draft answers"];
    for (const stage of stages) {
      await new Promise((r) => setTimeout(r, 500));
      toast.loading(`${stage}…`, { id: "detect" });
    }
    toast.success("Questionnaire ready", { id: "detect", description: "Detected 142 questions across 9 sections." });
    router.push("/questionnaires/qn1");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-2">
            <Label htmlFor="title">Questionnaire name</Label>
            <Input id="title" placeholder="e.g. Acme Corp Vendor Assessment" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select defaultValue="enterprise">
                <SelectTrigger id="project">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enterprise">Enterprise Deals</SelectItem>
                  <SelectItem value="rfps">RFPs</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="none">No project</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="requester">Requester email</Label>
              <Input id="requester" type="email" placeholder="security@customer.com" />
            </div>
          </div>

          <label
            htmlFor="qfile"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors hover:border-primary/50 hover:bg-accent/30"
          >
            {file ? (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium">{file.name}</span>
                <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); }}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <>
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Upload PDF, Excel, Word, or CSV</p>
                <p className="text-xs text-muted-foreground">We auto-detect questions, sections, and formats</p>
              </>
            )}
            <input id="qfile" type="file" className="hidden" accept=".pdf,.xlsx,.xls,.docx,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push("/questionnaires")} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={create} disabled={busy}>
              {busy ? "Processing…" : "Create & detect questions"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 font-medium">
            <ListChecks className="h-5 w-5 text-primary" /> Auto-detection
          </div>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>• Sections & sub-sections</li>
            <li>• Free-text, yes/no, and multiple-choice questions</li>
            <li>• Checkboxes and required fields</li>
            <li>• Existing answers (for updates)</li>
          </ul>
          <p className="mt-6 text-xs text-muted-foreground">
            After detection, the AI answer engine drafts cited responses you can review and approve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
