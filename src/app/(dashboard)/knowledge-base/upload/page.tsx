"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, FileText, X, Loader2, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface UploadFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "processing" | "done" | "error";
  progress: number;
  tags: string[];
}

export default function UploadDocumentsPage() {
  const router = useRouter();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const addFiles = (newFiles: File[]) => {
    const mapped = newFiles.map((f) => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      status: "pending" as const,
      progress: 0,
      tags: [],
    }));
    setFiles((prev) => [...prev, ...mapped]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const addTag = (fileId: string, tag: string) => {
    if (!tag.trim()) return;
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId && !f.tags.includes(tag.trim())
          ? { ...f, tags: [...f.tags, tag.trim()] }
          : f
      )
    );
  };

  const removeTag = (fileId: string, tag: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, tags: f.tags.filter((t) => t !== tag) }
          : f
      )
    );
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    for (const fileObj of files) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id ? { ...f, status: "uploading", progress: 20 } : f
        )
      );

      await new Promise((r) => setTimeout(r, 800));

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id ? { ...f, status: "processing", progress: 60 } : f
        )
      );

      await new Promise((r) => setTimeout(r, 1200));

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileObj.id ? { ...f, status: "done", progress: 100 } : f
        )
      );
    }

    toast.success(`${files.length} document(s) uploaded and indexed successfully`);
    setIsUploading(false);
    setTimeout(() => router.push("/knowledge-base"), 1500);
  };

  const acceptedTypes = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-4" asChild>
          <Link href="/knowledge-base">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Upload Documents</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add security documentation to your AI knowledge base
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          addFiles(Array.from(e.dataTransfer.files));
        }}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
        }`}
      >
        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <div className="font-semibold text-lg mb-2">
          Drag & drop your security documents
        </div>
        <div className="text-sm text-muted-foreground mb-6">
          PDF, Word, Excel, CSV, TXT, Markdown • Up to 32MB per file
        </div>
        <label>
          <Button variant="outline" asChild>
            <span>Browse Files</span>
          </Button>
          <input
            type="file"
            accept={acceptedTypes}
            multiple
            onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
            className="hidden"
          />
        </label>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((f) => (
            <Card key={f.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {f.status === "done" ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">
                        {f.file.name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {(f.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      {f.status !== "pending" && (
                        <span className={`text-xs font-medium shrink-0 ${
                          f.status === "done" ? "text-green-600" :
                          f.status === "error" ? "text-red-600" :
                          "text-blue-600"
                        }`}>
                          {f.status === "uploading" ? "Uploading..." :
                           f.status === "processing" ? "Processing..." :
                           f.status === "done" ? "Indexed" :
                           "Error"}
                        </span>
                      )}
                    </div>

                    {(f.status === "uploading" || f.status === "processing") && (
                      <Progress value={f.progress} className="h-1 mb-2" />
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {f.tags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(f.id, tag)}
                            className="hover:text-destructive"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                      {f.status === "pending" && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            addTag(f.id, tagInput);
                            setTagInput("");
                          }}
                        >
                          <input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="+ add tag"
                            className="text-[11px] px-2 py-0.5 rounded-full bg-muted border-0 outline-none w-20"
                          />
                        </form>
                      )}
                    </div>
                  </div>

                  {f.status === "pending" && (
                    <button
                      onClick={() => removeFile(f.id)}
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <Button
          onClick={handleUpload}
          disabled={isUploading || files.every((f) => f.status === "done")}
          className="gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading & Indexing...
            </>
          ) : files.every((f) => f.status === "done") ? (
            <>
              <Check className="w-4 h-4" />
              All Done
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload {files.length} Document{files.length !== 1 ? "s" : ""}
            </>
          )}
        </Button>
      )}

      <Card className="border-border/60 bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Tips for best results</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>• Upload SOC 2 reports, ISO certificates, security policies, and pen test summaries</p>
          <p>• Add tags like "SOC 2", "HIPAA", "Encryption" to make documents easier to find</p>
          <p>• Include version dates in filenames for better document management</p>
          <p>• Text-searchable PDFs produce the best AI results; scanned PDFs require OCR processing</p>
        </CardContent>
      </Card>
    </div>
  );
}
