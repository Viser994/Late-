import { DictationApp } from "@/components/DictationApp";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(99,102,241,0.18),transparent)]">
      <DictationApp />
    </div>
  );
}
