"use client";

import { useRef, useState, useTransition } from "react";
import { Send, FileText, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { askKnowledgeBase } from "@/lib/actions/chat";
import type { ChatMessageView } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Do we encrypt backups?",
  "What is our password policy?",
  "Show our disaster recovery procedure.",
  "What evidence supports SOC 2 CC6?",
];

export function ChatPanel({ initialMessages }: { initialMessages: ChatMessageView[] }) {
  const [messages, setMessages] = useState<ChatMessageView[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  const send = (text: string) => {
    const question = text.trim();
    if (!question || isPending) return;
    const userMsg: ChatMessageView = {
      id: `u-${Date.now()}`,
      role: "user",
      content: question,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    startTransition(async () => {
      const answer = await askKnowledgeBase(question);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: answer.content,
          citations: answer.citations,
          createdAt: new Date().toISOString(),
        },
      ]);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    });
  };

  return (
    <Card className="flex h-[calc(100vh-13rem)] flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-semibold">Ask anything about your security posture</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Answers are grounded in your knowledge base and always include document citations.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-3", msg.role === "user" && "justify-end")}>
            {msg.role === "assistant" && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
            )}
            <div className={cn("max-w-[80%] space-y-2", msg.role === "user" && "order-1")}>
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm",
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                {msg.content}
              </div>
              {msg.citations && msg.citations.length > 0 && (
                <div className="space-y-1.5">
                  {msg.citations.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border bg-card p-2 text-xs">
                      <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <div>
                        <p className="font-medium">{c.documentTitle}</p>
                        <p className="text-muted-foreground">“{c.quote}”</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <User className="h-4 w-4" />
              </span>
            )}
          </div>
        ))}
        {isPending && (
          <div className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4 animate-pulse" />
            </span>
            <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">Searching your knowledge base…</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t p-4">
        {messages.length <= 2 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about encryption, incident response, SOC 2…"
            disabled={isPending}
          />
          <Button type="submit" size="icon" disabled={isPending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
