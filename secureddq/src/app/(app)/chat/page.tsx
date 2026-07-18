import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { ChatPanel } from "@/components/app/chat-panel";
import { getChatMessages } from "@/lib/data";

export const metadata: Metadata = { title: "AI Chat" };

export default async function ChatPage() {
  const messages = await getChatMessages();
  return (
    <>
      <PageHeader title="AI Chat" description="Ask questions and get sourced answers from your knowledge base." />
      <ChatPanel initialMessages={messages} />
    </>
  );
}
