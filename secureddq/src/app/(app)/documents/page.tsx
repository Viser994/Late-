import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { UploadDialog } from "@/components/app/upload-dialog";
import { DocumentsExplorer } from "@/components/app/documents-explorer";
import { getDocuments } from "@/lib/data";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const documents = await getDocuments();
  return (
    <>
      <PageHeader
        title="Knowledge Base"
        description="Your security documentation, chunked and embedded for semantic search and AI answers."
        actions={<UploadDialog />}
      />
      <DocumentsExplorer documents={documents} />
    </>
  );
}
