"use client";

import { UploadButton } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function DocumentUploadButton({
  organizationId,
}: {
  organizationId: string;
}) {
  const router = useRouter();

  return (
    <UploadButton
      endpoint="documentUploader"
      input={{ organizationId }}
      onClientUploadComplete={() => {
        toast.success("Document uploaded successfully");
        router.refresh();
      }}
      onUploadError={(error) => {
        toast.error(`Upload failed: ${error.message}`);
      }}
      appearance={{
        button:
          "bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ut-ready:bg-primary ut-uploading:cursor-not-allowed",
        allowedContent: "hidden",
      }}
      content={{
        button({ ready }) {
          return (
            <>
              <Upload className="h-4 w-4" />
              {ready ? "Upload Document" : "Preparing..."}
            </>
          );
        },
      }}
    />
  );
}

export function QuestionnaireUploadButton({
  organizationId,
}: {
  organizationId: string;
}) {
  const router = useRouter();

  return (
    <UploadButton
      endpoint="questionnaireUploader"
      input={{ organizationId }}
      onClientUploadComplete={() => {
        toast.success("Questionnaire uploaded — parsing in progress");
        router.refresh();
      }}
      onUploadError={(error) => {
        toast.error(`Upload failed: ${error.message}`);
      }}
      appearance={{
        button:
          "bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2",
        allowedContent: "hidden",
      }}
      content={{
        button({ ready }) {
          return (
            <>
              <Upload className="h-4 w-4" />
              {ready ? "Upload Questionnaire" : "Preparing..."}
            </>
          );
        },
      }}
    />
  );
}
