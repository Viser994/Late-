"use client";

import { useEffect, useRef, useState } from "react";
import { mediaKind } from "@/lib/media";
import { createSampleSession } from "@/lib/sample";
import type { MediaSource, TranscriptResult } from "@/lib/types";
import { SourcePanel } from "./SourcePanel";
import { TranscriptPanel } from "./TranscriptPanel";

export function Studio() {
  const [media, setMedia] = useState<MediaSource | null>(null);
  const [transcript, setTranscript] = useState<TranscriptResult | null>(null);
  const [phase, setPhase] = useState<"idle" | "uploading" | "transcribing">("idle");
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const mediaRef = useRef<MediaSource | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/transcribe")
      .then((response) => response.json())
      .then((body: { configured?: boolean }) => {
        if (!cancelled) setConfigured(Boolean(body.configured));
      })
      .catch(() => {
        if (!cancelled) setConfigured(null);
      });
    return () => {
      cancelled = true;
      if (mediaRef.current) URL.revokeObjectURL(mediaRef.current.url);
      xhrRef.current?.abort();
    };
  }, []);

  function replaceMedia(next: MediaSource | null, nextTranscript: TranscriptResult | null = null) {
    requestRef.current += 1;
    xhrRef.current?.abort();
    xhrRef.current = null;
    if (mediaRef.current) URL.revokeObjectURL(mediaRef.current.url);
    mediaRef.current = next;
    setMedia(next);
    setTranscript(nextTranscript);
    setPhase("idle");
    setUploadPct(null);
    setError(null);
  }

  function onFile(file: File, origin: "recording" | "upload", durationMs?: number) {
    replaceMedia({
      url: URL.createObjectURL(file),
      name: file.name,
      kind: mediaKind(file),
      file,
      origin,
      durationHint: durationMs && durationMs > 0 ? durationMs / 1000 : undefined,
    });
  }

  function onSample() {
    const session = createSampleSession();
    replaceMedia(
      {
        url: URL.createObjectURL(session.file),
        name: session.file.name,
        kind: "audio",
        file: session.file,
        origin: "sample",
        durationHint: session.transcript.audioDuration ?? undefined,
      },
      session.transcript,
    );
  }

  function onTranscribe() {
    const current = mediaRef.current;
    if (!current || phase !== "idle") return;
    if (configured === false) {
      setError("Live transcription is unavailable until ASSEMBLYAI_API_KEY is set on the server.");
      return;
    }
    const id = ++requestRef.current;
    setError(null);
    setPhase("uploading");
    setUploadPct(0);
    const body = new FormData();
    body.append("file", current.file, current.file.name);
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/transcribe");
    xhr.upload.onprogress = (event) => {
      if (requestRef.current !== id || !event.lengthComputable) return;
      setUploadPct(event.loaded / event.total);
      if (event.loaded >= event.total) setPhase("transcribing");
    };
    xhr.upload.onload = () => {
      if (requestRef.current === id) setPhase("transcribing");
    };
    xhr.onerror = () => {
      if (requestRef.current !== id) return;
      setPhase("idle");
      setUploadPct(null);
      setError("The upload failed before transcription started.");
    };
    xhr.onabort = () => {
      if (requestRef.current !== id) return;
      setPhase("idle");
      setUploadPct(null);
    };
    xhr.onload = () => {
      if (requestRef.current !== id) return;
      setPhase("idle");
      setUploadPct(null);
      let payload: { error?: string } & Partial<TranscriptResult> = {};
      try {
        payload = JSON.parse(xhr.responseText) as typeof payload;
      } catch {
        setError("The server returned an unreadable response.");
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        setError(payload.error || "Transcription failed.");
        return;
      }
      if (!payload.id || !payload.cues) {
        setError("The transcript came back incomplete.");
        return;
      }
      setTranscript({
        id: payload.id,
        text: payload.text ?? "",
        languageCode: payload.languageCode ?? null,
        languageConfidence: payload.languageConfidence ?? null,
        audioDuration: payload.audioDuration ?? null,
        cues: payload.cues,
      });
    };
    xhr.send(body);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 md:px-8 md:py-10">
      <header className="border-b border-white/10 pb-7">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-acid uppercase">Dictation</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-5xl leading-none text-cream md:text-6xl">Speakline</h1>
            {configured === false && (
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-mist">API key not set</span>
            )}
            {configured === true && (
              <span className="rounded-full border border-acid/40 px-3 py-1 text-xs text-acid">Ready</span>
            )}
          </div>
          <p className="max-w-md text-sm leading-6 text-mist">
            Multilingual speech, separated by speaker, ready as subtitles. Record a take or upload a file, then
            export SRT, VTT, or text.
          </p>
        </div>
      </header>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
        <SourcePanel
          media={media}
          busy={phase !== "idle"}
          phase={phase}
          uploadPct={uploadPct}
          error={error}
          onFile={onFile}
          onClear={() => replaceMedia(null)}
          onTranscribe={onTranscribe}
          onCancel={() => {
            requestRef.current += 1;
            xhrRef.current?.abort();
            setPhase("idle");
            setUploadPct(null);
          }}
          onSample={onSample}
          configured={configured}
        />
        <TranscriptPanel media={media} transcript={transcript} onSample={onSample} />
      </div>

      <footer className="mt-10 border-t border-white/10 pt-4 text-xs leading-5 text-mist">
        Audio is sent to AssemblyAI for transcription and is not stored by Speakline. Speaker labels come from
        diarization — rename them in the cards before you export. Space plays and pauses. Arrow keys skip five
        seconds.
      </footer>
    </main>
  );
}
