import { ChatInterface } from "@/components/chat/chat-interface";

export default function ChatPage() {
  return (
    <div>
      <div className="border-b px-8 py-6">
        <h1 className="text-2xl font-bold">AI Chat</h1>
        <p className="text-sm text-muted-foreground">
          Ask questions about your security documentation
        </p>
      </div>
      <ChatInterface />
    </div>
  );
}
