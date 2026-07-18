import { Bot, Send, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChatPage() {
  return (
    <>
      <PageHeader
        eyebrow="AI chat"
        title="Ask your security knowledge base"
        description="Ask questions like 'Do we encrypt backups?' or 'What evidence supports SOC2 CC6?' and receive cited responses."
      />

      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Evidence chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-2xl bg-muted p-4 text-sm">
              Do we encrypt backups?
            </div>
            <div className="rounded-2xl border bg-background p-4 text-sm leading-6">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <Sparkles className="h-4 w-4 text-primary" />
                SecureDDQ AI
              </div>
              Yes. Backup data is encrypted at rest with AES-256 using
              cloud-managed KMS keys, and backup restoration is tested quarterly.
              <div className="mt-3 rounded-xl bg-primary/10 p-3 text-xs text-primary">
                Sources: Backup and DR Policy v3, SOC 2 Type II Report p. 28
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3 rounded-2xl border bg-background p-2">
            <input
              className="flex-1 bg-transparent px-3 text-sm outline-none"
              placeholder="Ask about controls, policies, evidence, or answers..."
            />
            <Button size="sm">
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
