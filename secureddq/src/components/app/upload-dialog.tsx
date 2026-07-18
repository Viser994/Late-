"use client";

import { useState } from "react";
import { UploadCloud, Plus, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_EXTENSIONS } from "@/lib/documents/extract";

export function UploadDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const onUpload = async () => {
    if (!file) {
      toast.error("Choose a file to upload.");
      return;
    }
    setUploading(true);
    // Simulated ingestion pipeline: upload → extract → chunk → embed → index.
    const stages = ["Uploading", "Extracting text", "Chunking", "Generating embeddings", "Indexing"];
    for (const stage of stages) {
      await new Promise((r) => setTimeout(r, 450));
      toast.loading(`${stage}…`, { id: "ingest" });
    }
    toast.success("Document added to the knowledge base", {
      id: "ingest",
      description: `${file.name} is now searchable and ready for AI answers.`,
    });
    setUploading(false);
    setFile(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Upload document
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a document</DialogTitle>
          <DialogDescription>
            Supported formats: {SUPPORTED_EXTENSIONS.map((e) => e.toUpperCase()).join(", ")}. Files are extracted,
            chunked, embedded, and indexed automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-type">Document type</Label>
            <Select defaultValue="SECURITY_POLICY">
              <SelectTrigger id="doc-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SECURITY_POLICY">Security policy</SelectItem>
                <SelectItem value="POLICY">Policy</SelectItem>
                <SelectItem value="SOC_REPORT">SOC report</SelectItem>
                <SelectItem value="ISO_DOCUMENT">ISO document</SelectItem>
                <SelectItem value="ARCHITECTURE">Architecture document</SelectItem>
                <SelectItem value="PENTEST_REPORT">Penetration test report</SelectItem>
                <SelectItem value="EVIDENCE">Evidence</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label
            htmlFor="file"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors hover:border-primary/50 hover:bg-accent/30"
          >
            {file ? (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setFile(null);
                  }}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <>
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Click to browse or drag & drop</p>
                <p className="text-xs text-muted-foreground">Up to 25 MB</p>
              </>
            )}
            <input
              id="file"
              type="file"
              className="hidden"
              accept={SUPPORTED_EXTENSIONS.map((e) => `.${e}`).join(",")}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={onUpload} disabled={uploading}>
            {uploading ? "Processing…" : "Upload & index"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
