import { FileText, Upload, Search, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

const documents = [
  {
    id: "1",
    name: "SOC 2 Type II Report 2026",
    type: "PDF",
    size: "4.2 MB",
    status: "READY",
    tags: ["SOC 2", "Audit", "2026"],
    uploadedAt: "Jul 15, 2026",
    chunks: 284,
    pages: 48,
  },
  {
    id: "2",
    name: "Information Security Policy v3.2",
    type: "DOCX",
    size: "1.1 MB",
    status: "READY",
    tags: ["Policy", "ISO 27001"],
    uploadedAt: "Jul 10, 2026",
    chunks: 156,
    pages: 22,
  },
  {
    id: "3",
    name: "Penetration Test Report Q2 2026",
    type: "PDF",
    size: "6.8 MB",
    status: "READY",
    tags: ["Pentest", "Security"],
    uploadedAt: "Jul 5, 2026",
    chunks: 312,
    pages: 62,
  },
  {
    id: "4",
    name: "Disaster Recovery Plan",
    type: "DOCX",
    size: "2.3 MB",
    status: "READY",
    tags: ["DR", "BCP"],
    uploadedAt: "Jul 1, 2026",
    chunks: 198,
    pages: 35,
  },
  {
    id: "5",
    name: "Incident Response Procedures",
    type: "PDF",
    size: "0.9 MB",
    status: "PROCESSING",
    tags: ["IR", "Policy"],
    uploadedAt: "Jul 18, 2026",
    chunks: 0,
    pages: 18,
  },
  {
    id: "6",
    name: "Encryption Standards Guide",
    type: "PDF",
    size: "1.5 MB",
    status: "READY",
    tags: ["Encryption", "Technical"],
    uploadedAt: "Jun 28, 2026",
    chunks: 124,
    pages: 24,
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  UPLOADING: { label: "Uploading", color: "bg-blue-500/10 text-blue-600" },
  PROCESSING: { label: "Processing", color: "bg-yellow-500/10 text-yellow-600" },
  READY: { label: "Ready", color: "bg-green-500/10 text-green-600" },
  FAILED: { label: "Failed", color: "bg-red-500/10 text-red-600" },
  ARCHIVED: { label: "Archived", color: "bg-gray-500/10 text-gray-600" },
};

const typeColors: Record<string, string> = {
  PDF: "bg-red-500/10 text-red-600",
  DOCX: "bg-blue-500/10 text-blue-600",
  XLSX: "bg-green-500/10 text-green-600",
  CSV: "bg-orange-500/10 text-orange-600",
  TXT: "bg-gray-500/10 text-gray-600",
  MARKDOWN: "bg-purple-500/10 text-purple-600",
};

export default function KnowledgeBasePage() {
  const totalDocs = documents.length;
  const readyDocs = documents.filter((d) => d.status === "READY").length;
  const totalChunks = documents.reduce((acc, d) => acc + d.chunks, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload and manage your security documentation
          </p>
        </div>
        <Button asChild>
          <Link href="/knowledge-base/upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload Documents
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Documents", value: totalDocs, sub: `${readyDocs} indexed` },
          { label: "Text Chunks", value: totalChunks.toLocaleString(), sub: "Available for AI" },
          { label: "Storage Used", value: "17.8 MB", sub: "of 10 GB" },
          { label: "Last Updated", value: "Today", sub: "Jul 18, 2026" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs font-medium text-muted-foreground mt-0.5">
                {s.label}
              </div>
              <div className="text-xs text-muted-foreground/60">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Search documents..." className="pl-9" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {/* Documents grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {documents.map((doc) => {
          const status = statusConfig[doc.status];
          const typeColor = typeColors[doc.type] ?? "bg-gray-500/10 text-gray-600";

          return (
            <Card
              key={doc.id}
              className="border-border/60 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColor}`}
                    >
                      {doc.type}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>

                <div className="font-medium text-sm mb-2 leading-snug">
                  {doc.name}
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {doc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {doc.status === "PROCESSING" && (
                  <Progress value={35} className="h-1 mb-3" />
                )}

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{doc.size} · {doc.pages} pages</span>
                  <span>{doc.uploadedAt}</span>
                </div>

                {doc.status === "READY" && (
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {doc.chunks} chunks indexed
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Upload card */}
        <Link href="/knowledge-base/upload">
          <Card className="border-dashed border-2 border-border/60 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer h-full min-h-[180px]">
            <CardContent className="p-5 flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Plus className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <div className="font-medium text-sm">Upload Document</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  PDF, Word, Excel, CSV, TXT
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
