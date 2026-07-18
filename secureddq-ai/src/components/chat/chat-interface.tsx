"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, User, FileText } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Array<{
    documentName: string;
    excerpt: string;
  }>;
}

const SUGGESTIONS = [
  "Do we encrypt backups?",
  "What is our password policy?",
  "Show our disaster recovery procedure.",
  "What evidence supports SOC2 CC6?",
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.sessionId) setSessionId(data.sessionId);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content,
          citations: data.citations,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <Bot className="mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-2 text-xl font-semibold">AI Security Assistant</h2>
            <p className="mb-8 text-center text-muted-foreground">
              Ask questions about your security documentation. Answers include source citations.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s}
                  variant="outline"
                  className="text-left text-sm"
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === "user" ? "order-first" : ""}`}>
                  <Card className={msg.role === "user" ? "bg-primary text-primary-foreground" : ""}>
                    <CardContent className="p-4">
                      <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 space-y-2 border-t pt-3">
                          <p className="text-xs font-medium opacity-70">Sources</p>
                          {msg.citations.map((c, j) => (
                            <div key={j} className="flex items-start gap-2 text-xs opacity-80">
                              <FileText className="mt-0.5 h-3 w-3" />
                              <span>
                                <strong>{c.documentName}</strong>: {c.excerpt}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Thinking...</p>
                  </CardContent>
                </Card>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t p-4">
        <form
          className="mx-auto flex max-w-3xl gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your security documentation..."
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
