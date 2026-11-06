"use client";

import { useEffect, useRef, useState } from "react";
import { baseName, displayName, toSrt, toTxt, toVtt } from "@/lib/captions";
import { activeCueIndex, speakerColor } from "@/lib/cues";
import { languageLabel } from "@/lib/language";
import { formatTimestamp } from "@/lib/time";
import type { MediaSource, TranscriptResult } from "@/lib/types";

type TranscriptPanelProps = {
  media: MediaSource | null;
  transcript: TranscriptResult | null;
  onSample: () => void;
};

const RATES = [1, 1.25, 1.5, 2];

function download(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function TranscriptPanel({ media, transcript, onSample }: TranscriptPanelProps) {
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
    setRate(1);
  }, [media?.url]);

  useEffect(() => {
    setNames({});
  }, [transcript?.id]);

  useEffect(() => {
    if (mediaRef.current) mediaRef.current.playbackRate = rate;
  }, [rate, media?.url]);

  useEffect(() => {
    const element = mediaRef.current;
    if (!element) return;
    let finish: (() => void) | null = null;
    const onTime = () => {
      const time = element.currentTime || 0;
      if (time > 1e6) return;
      setCurrentTime(time);
    };
    const onMeta = () => {
      const next = element.duration;
      if (Number.isFinite(next) && next > 0 && next < 1e8) {
        setDuration(next);
        return;
      }
      // MediaRecorder WebM often reports Infinity until the browser is asked to seek past the end.
      if (element.readyState < 1 || element.dataset.fixing === "1") return;
      element.dataset.fixing = "1";
      finish = () => {
        const revealed = element.duration;
        if (!(Number.isFinite(revealed) && revealed > 0 && revealed < 1e8)) return;
        element.removeEventListener("durationchange", finish!);
        element.currentTime = 0;
        delete element.dataset.fixing;
        setDuration(revealed);
        setCurrentTime(0);
      };
      element.addEventListener("durationchange", finish);
      try {
        element.currentTime = 1e101;
      } catch {
        element.removeEventListener("durationchange", finish);
        delete element.dataset.fixing;
      }
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    element.addEventListener("timeupdate", onTime);
    element.addEventListener("seeked", onTime);
    element.addEventListener("loadedmetadata", onMeta);
    element.addEventListener("play", onPlay);
    element.addEventListener("pause", onPause);
    element.addEventListener("ended", onPause);
    onMeta();
    return () => {
      element.removeEventListener("timeupdate", onTime);
      element.removeEventListener("seeked", onTime);
      element.removeEventListener("loadedmetadata", onMeta);
      element.removeEventListener("play", onPlay);
      element.removeEventListener("pause", onPause);
      element.removeEventListener("ended", onPause);
      if (finish) element.removeEventListener("durationchange", finish);
      delete element.dataset.fixing;
    };
  }, [media?.url, media?.kind]);

  function seekToSeconds(seconds: number) {
    const element = mediaRef.current;
    if (!element) return;
    const next = Math.max(0, seconds);
    element.currentTime = next;
    setCurrentTime(next);
    void element.play().catch(() => undefined);
  }

  function toggle() {
    const element = mediaRef.current;
    if (!element) return;
    if (element.paused) void element.play().catch(() => undefined);
    else element.pause();
  }

  useEffect(() => {
    if (!media) return;
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, input, textarea, select, [contenteditable='true']")) return;
      if (event.code === "Space") {
        event.preventDefault();
        toggle();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        seekToSeconds((mediaRef.current?.currentTime ?? 0) + 5);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        seekToSeconds((mediaRef.current?.currentTime ?? 0) - 5);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [media]);

  const cues = transcript?.cues ?? [];
  const shownDuration =
    duration > 0 && Number.isFinite(duration)
      ? duration
      : media?.durationHint ?? transcript?.audioDuration ?? 0;
  const active = activeCueIndex(cues, currentTime * 1000);
  const speakers = [...new Set(cues.map((cue) => cue.speaker))];
  const stem = baseName(media?.name ?? "speakline");

  useEffect(() => {
    if (active < 0) return;
    document.getElementById(`cue-${active}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active]);

  return (
    <section className="flex flex-col gap-4">
      <article className="rounded-3xl border border-white/10 bg-panel/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)] lg:sticky lg:top-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-acid uppercase">Player</p>
            <h2 className="mt-1 truncate font-serif text-3xl text-cream" title={media?.name ?? undefined}>
              {media ? media.name : "Nothing loaded"}
            </h2>
          </div>
          {transcript && !transcript.sample && (
            <div className="rounded-full border border-white/10 px-3 py-1 text-right text-xs text-mist">
              <p className="text-cream">{languageLabel(transcript.languageCode)}</p>
              {transcript.languageConfidence != null && (
                <p>{Math.round(transcript.languageConfidence * 100)}% language match</p>
              )}
            </div>
          )}
          {transcript?.sample && (
            <p className="rounded-full border border-acid/40 px-3 py-1 text-xs text-acid">Sample</p>
          )}
        </div>

        {media ? (
          <>
            {media.kind === "video" ? (
              <video
                ref={(node) => {
                  mediaRef.current = node;
                }}
                key={media.url}
                src={media.url}
                playsInline
                preload="metadata"
                className="mt-4 aspect-video w-full rounded-2xl bg-black"
              />
            ) : (
              <>
                <audio
                  ref={(node) => {
                    mediaRef.current = node;
                  }}
                  key={media.url}
                  src={media.url}
                  preload="metadata"
                />
                <div className="mt-4 flex aspect-[2.4/1] flex-col justify-end rounded-2xl bg-ink px-5 py-4">
                  <p data-testid="player-time" className="font-serif text-5xl tabular-nums text-cream">
                    {formatTimestamp(currentTime * 1000)}
                  </p>
                  <p className="mt-1 text-sm text-mist">
                    {playing ? "Playing" : "Paused"} · {formatTimestamp(shownDuration * 1000)}
                  </p>
                </div>
              </>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={toggle}
                className="shrink-0 rounded-full bg-acid px-5 py-3 text-sm font-semibold text-ink"
                aria-label={playing ? "Pause playback" : "Play"}
              >
                {playing ? "Pause" : "Play"}
              </button>
              <div className="min-w-0 flex-1">
                {media.kind === "video" && (
                  <p data-testid="player-time" className="mb-1 font-mono text-xs tabular-nums text-mist">
                    {formatTimestamp(currentTime * 1000)} / {formatTimestamp(shownDuration * 1000)}
                  </p>
                )}
                <input
                  type="range"
                  min={0}
                  max={shownDuration || 0}
                  step={0.01}
                  value={Math.min(currentTime, shownDuration || 0)}
                  aria-label="Seek"
                  onChange={(event) => seekToSeconds(Number(event.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Playback speed">
              {RATES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRate(value)}
                  aria-pressed={rate === value}
                  className={`rounded-full px-3 py-1 text-xs ${
                    rate === value ? "bg-cream text-ink" : "border border-white/15 text-mist hover:text-cream"
                  }`}
                >
                  {value}×
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-ink/40 px-5 py-10">
            <p className="max-w-md text-sm leading-6 text-mist">
              Record from the microphone or drop in an audio or video file. Speakline detects the language,
              separates speakers, and builds captions you can export.
            </p>
            <button
              type="button"
              onClick={onSample}
              className="mt-5 rounded-full border border-white/15 px-4 py-2 text-sm text-cream hover:border-white/40"
            >
              Preview a sample session
            </button>
          </div>
        )}
      </article>

      <article className="rounded-3xl border border-white/10 bg-panel/90 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-acid uppercase">Captions</p>
            <h2 className="mt-1 font-serif text-3xl text-cream">Transcript</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="export-srt"
              disabled={!cues.length}
              onClick={() => download(`${stem}.srt`, toSrt(cues, names), "application/x-subrip")}
              className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold tracking-wide text-cream uppercase hover:border-acid hover:text-acid disabled:cursor-not-allowed disabled:opacity-40"
            >
              SRT
            </button>
            <button
              type="button"
              data-testid="export-vtt"
              disabled={!cues.length}
              onClick={() => download(`${stem}.vtt`, toVtt(cues, names), "text/vtt")}
              className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold tracking-wide text-cream uppercase hover:border-acid hover:text-acid disabled:cursor-not-allowed disabled:opacity-40"
            >
              VTT
            </button>
            <button
              type="button"
              data-testid="export-txt"
              disabled={!cues.length}
              onClick={() => download(`${stem}.txt`, toTxt(cues, names), "text/plain")}
              className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold tracking-wide text-cream uppercase hover:border-acid hover:text-acid disabled:cursor-not-allowed disabled:opacity-40"
            >
              TXT
            </button>
          </div>
        </div>

        {transcript?.sample && (
          <p className="mt-4 rounded-2xl bg-acid/10 px-4 py-3 text-sm text-cream">
            Sample session. The tones stand in for speech so you can try seeking and export. Live transcription
            uses AssemblyAI once the server has an API key.
          </p>
        )}

        {speakers.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {speakers.map((speaker) => (
              <li
                key={speaker}
                className="rounded-full border border-white/10 px-3 py-1 text-xs"
                style={{ color: speakerColor(speaker, speakers) }}
              >
                {displayName(speaker, names)} · {cues.filter((cue) => cue.speaker === speaker).length}
              </li>
            ))}
          </ul>
        )}

        {transcript && cues.length === 0 && (
          <p className="mt-6 text-sm text-mist">No speech was detected in that file.</p>
        )}

        {!transcript && media && (
          <p className="mt-6 text-sm text-mist">Transcribe to turn this file into speaker-labeled captions.</p>
        )}

        <ol className="mt-4 flex flex-col gap-3">
          {cues.map((cue, index) => {
            const color = speakerColor(cue.speaker, speakers);
            const isActive = index === active;
            return (
              <li key={cue.id} id={`cue-${index}`}>
                <article
                  data-testid="cue"
                  onClick={() => seekToSeconds(cue.start / 1000)}
                  className={`w-full cursor-pointer rounded-2xl border px-4 py-3 text-left transition ${
                    isActive ? "border-transparent bg-ink" : "border-white/10 bg-panel-2/70 hover:border-white/25"
                  }`}
                  style={isActive ? { boxShadow: `inset 3px 0 0 ${color}` } : undefined}
                >
                  <div className="flex items-center justify-between gap-3">
                    <input
                      aria-label={`Rename ${displayName(cue.speaker, names)}`}
                      value={names[cue.speaker] ?? `Speaker ${cue.speaker}`}
                      maxLength={40}
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                      onChange={(event) =>
                        setNames((current) => ({ ...current, [cue.speaker]: event.target.value }))
                      }
                      className="w-40 bg-transparent text-sm font-semibold outline-none"
                      style={{ color }}
                    />
                    <time className="font-mono text-xs tabular-nums text-mist">
                      {formatTimestamp(cue.start)}–{formatTimestamp(cue.end)}
                    </time>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      seekToSeconds(cue.start / 1000);
                    }}
                    className="mt-2 w-full text-left text-sm leading-6 text-cream"
                  >
                    <span className="sr-only">Seek to {formatTimestamp(cue.start)}. </span>
                    {cue.text}
                  </button>
                  {cue.confidence != null && (
                    <p className="mt-2 text-[11px] text-mist">{Math.round(cue.confidence * 100)}% word confidence</p>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      </article>
    </section>
  );
}
