import { Studio } from "@/components/Studio";
import { GlobeIcon, MicIcon, SparklesIcon, UsersIcon } from "@/components/icons";

const HIGHLIGHTS = [
  {
    icon: GlobeIcon,
    title: "Any language",
    body: "Automatic language detection — no need to pick a locale up front.",
  },
  {
    icon: UsersIcon,
    title: "Speaker labels",
    body: "Diarization separates who said what, with timestamps per turn.",
  },
  {
    icon: SparklesIcon,
    title: "Ready-to-use captions",
    body: "Export SRT, VTT, or plain text with one click.",
  },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-white/5 bg-surface-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 to-fuchsia-500 text-white shadow-lg shadow-accent-500/30">
              <MicIcon width={16} height={16} />
            </span>
            <span className="text-sm font-semibold tracking-tight text-white">Dictate</span>
            <span className="hidden rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-zinc-400 sm:inline">
              Speech → Subtitles
            </span>
          </div>
          <a
            href="https://www.assemblyai.com/"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-400 transition hover:text-zinc-200"
          >
            Powered by AssemblyAI
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-10 sm:px-6">
        <section className="mb-10 text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-3 py-1 text-xs font-medium text-accent-200">
            <SparklesIcon width={14} height={14} />
            Multilingual dictation &amp; subtitle studio
          </p>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Turn speech into timestamped, speaker-labelled subtitles
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-zinc-400 sm:text-lg">
            Record from your microphone or drop in an audio or video file. We detect the
            language, separate the speakers, and give you captions you can click through
            and export.
          </p>
        </section>

        <Studio />

        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-5">
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15 text-accent-300">
                <Icon width={18} height={18} />
              </span>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-zinc-500">
        Audio is sent to AssemblyAI for processing and is not stored by this app.
      </footer>
    </>
  );
}
