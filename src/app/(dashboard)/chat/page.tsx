"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { document: string; excerpt: string }[];
  timestamp: Date;
}

const suggestions = [
  "Do we encrypt data at rest?",
  "What is our password policy?",
  "Describe our incident response process",
  "What evidence supports SOC 2 CC6.1?",
  "How do we handle data breaches?",
  "What is our disaster recovery RTO/RPO?",
];

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hi! I'm your SecureDDQ AI assistant. I can answer questions about your organization's security posture based on your uploaded documentation. Try asking me anything about your security controls, policies, or compliance status.",
    timestamp: new Date(),
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text ?? input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content:
        "Based on your uploaded documentation, I can confirm that your organization does encrypt data at rest using AES-256 encryption. This is enforced across all cloud storage including AWS S3 buckets, RDS databases, and EBS volumes using AWS KMS-managed keys. Customer data is encrypted before being written to persistent storage.",
      sources: [
        {
          document: "Encryption Standards Guide, Section 3",
          excerpt:
            "All data at rest is encrypted using AES-256. AWS KMS manages key rotation automatically on an annual basis...",
        },
        {
          document: "SOC 2 Report 2026, CC9.1",
          excerpt:
            "The company uses encryption to protect confidential information at rest across all production systems...",
        },
      ],
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">AI Chat</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ask questions about your security posture and get cited answers from your knowledge base
        </p>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 pb-4 min-h-0"
        style={{ maxHeight: "calc(100vh - 320px)" }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {message.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            <div
              className={cn(
                "flex-1 max-w-2xl",
                message.role === "user" && "flex flex-col items-end"
              )}
            >
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                )}
              >
                {message.content}
              </div>

              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs text-muted-foreground font-medium">
                    Sources:
                  </div>
                  {message.sources.map((source, i) => (
                    <div
                      key={i}
                      className="text-xs p-3 rounded-lg bg-blue-500/5 border border-blue-500/20"
                    >
                      <div className="flex items-center gap-1.5 font-medium text-blue-600 mb-1">
                        <FileText className="w-3 h-3" />
                        {source.document}
                      </div>
                      <div className="text-muted-foreground italic">
                        &ldquo;{source.excerpt}&rdquo;
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[11px] text-muted-foreground/50 mt-1 px-1">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Searching knowledge base...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSend(suggestion)}
              className="text-xs px-3 py-2 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-muted/50 transition-all"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your security posture... (Enter to send, Shift+Enter for new line)"
          className="resize-none min-h-[52px] max-h-[200px]"
          rows={2}
        />
        <Button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          size="icon"
          className="h-[52px] w-[52px] shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
