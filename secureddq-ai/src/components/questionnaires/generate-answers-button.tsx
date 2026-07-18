"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function GenerateAnswersButton({
  questionnaireId,
  organizationId,
}: {
  questionnaireId: string;
  organizationId: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/questionnaires/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionnaireId, organizationId }),
      });
      if (!res.ok) throw new Error("Failed to start generation");
      toast.success("AI answer generation started");
      router.refresh();
    } catch {
      toast.error("Failed to generate answers");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleGenerate} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      Generate AI Answers
    </Button>
  );
}
