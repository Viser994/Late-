"use client";

import {
  downloadTextFile,
  utterancesToSrt,
  utterancesToTxt,
  utterancesToVtt,
  type CaptionUtterance,
} from "@/lib/caption-export";
import type { TranscribeApiResponse, TranscriptUtterance } from "@/lib/transcript-types";
import { useCallback, useEffect, useRef, useState } from "react";

const ACCEPT =
  "audio/mpeg,audio/wav,audio/x-m4a,audio/mp4,audio/mp4,video/mp4,video/webm,.mp3,.wav,.m4a,.mp4,.webm";

type RecordState = "idle" | "recording" | "paused" | "stopped";

export function DictationApp() {
  const [recordState, setRecordState] = useState<RecordState>("idle");
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [transcript, setTranscript] = useState<TranscribeApiResponse | null>(null);
  const [transcribeLoading, setTranscribeLoading] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopVisualizer = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      analyser.getByteTimeDomainData(dataArray);
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = "#0f1419";
      ctx.fillRect(0, 0, w, h);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#6366f1";
      ctx.beginPath();
      const slice = w / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * h) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += slice;
      }
      ctx.stroke();

      ctx.strokeStyle = "rgba(99, 102, 241, 0.2)";
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
  }, []);

  const startRecording = async () => {
    setMediaError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mime =
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "";

      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        revokePrev();
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setUploadFile(new File([blob], "recording.webm", { type: blob.type || "audio/webm" }));
        stopVisualizer();
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setRecordState("stopped");
      };

      mediaRecorderRef.current = recorder;

      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      drawWaveform();

      recorder.start(100);
      setRecordState("recording");
    } catch (e) {
      setMediaError(
        e instanceof Error ? e.message : "Microphone access was denied or unavailable."
      );
    }
  };

  const pauseRecording = () => {
    const r = mediaRecorderRef.current;
    if (r && r.state === "recording") {
      r.pause();
      setRecordState("paused");
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    const r = mediaRecorderRef.current;
    if (r && r.state === "paused") {
      r.resume();
      setRecordState("recording");
      drawWaveform();
    }
  };

  const stopRecording = () => {
    const r = mediaRecorderRef.current;
    if (r && r.state !== "inactive") {
      r.stop();
    }
    mediaRecorderRef.current = null;
  };

  const resetRecorder = () => {
    stopRecording();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    stopVisualizer();
    chunksRef.current = [];
    revokePrev();
    setAudioUrl(null);
    setUploadFile(null);
    setRecordState("idle");
    setTranscript(null);
    setTranscribeError(null);
    setActiveIndex(null);
  };

  function revokePrev() {
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  const onDropFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    const ok =
      /\.(mp3|wav|m4a|mp4|webm)$/i.test(f.name) ||
      /^(audio\/|video\/(mp4|webm))/.test(f.type);
    if (!ok) {
      setMediaError("Please upload MP3, WAV, M4A, MP4, or WebM.");
      return;
    }
    setMediaError(null);
    revokePrev();
    const url = URL.createObjectURL(f);
    setAudioUrl(url);
    setUploadFile(f);
    setRecordState("stopped");
    setTranscript(null);
    setTranscribeError(null);
  };

  const runTranscribe = async () => {
    if (!uploadFile) {
      setTranscribeError("Add a recording or upload a file first.");
      return;
    }
    setTranscribeLoading(true);
    setTranscribeError(null);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = (await res.json()) as TranscribeApiResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      setTranscript(data);
    } catch (e) {
      setTranscript(null);
      setTranscribeError(e instanceof Error ? e.message : "Transcription failed.");
    } finally {
      setTranscribeLoading(false);
    }
  };

  const seekTo = (seconds: number, index: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = seconds;
    void el.play();
    setActiveIndex(index);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
      }
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !transcript?.utterances?.length) return;

    const onTime = () => {
      const t = audio.currentTime * 1000;
      const list = transcript.utterances;
      let idx: number | null = null;
      for (let i = 0; i < list.length; i++) {
        const u = list[i];
        if (t >= u.start && t <= u.end) {
          idx = i;
          break;
        }
      }
      setActiveIndex(idx);
    };

    audio.addEventListener("timeupdate", onTime);
    return () => audio.removeEventListener("timeupdate", onTime);
  }, [transcript]);

  useEffect(() => {
    return () => {
      stopVisualizer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl, stopVisualizer]);

  const utterances: TranscriptUtterance[] = transcript?.utterances ?? [];
  const captionItems: CaptionUtterance[] = utterances.map((u) => ({
    start: u.start,
    end: u.end,
    speaker: u.speaker,
    text: u.text,
  }));

  const exportDisabled = utterances.length === 0;
  const baseName = uploadFile?.name.replace(/\.[^.]+$/, "") || "captions";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2 border-b border-zinc-800 pb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
          Speech to subtitles
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
          Multilingual dictation &amp; captions
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
          Record from your microphone or drop an audio or video file. We transcribe with speaker
          labels and automatic language detection, then let you seek the player from each line and
          export SRT, VTT, or plain text.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-sm">
          <h2 className="mb-4 text-sm font-medium text-zinc-200">Microphone</h2>
          <div className="relative mb-4 h-28 w-full overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-950">
            <canvas ref={canvasRef} className="h-full w-full" />
            {recordState === "idle" && (
              <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
                Waveform appears when you start recording
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {recordState === "idle" && (
              <button
                type="button"
                onClick={startRecording}
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
              >
                Start
              </button>
            )}
            {recordState === "recording" && (
              <>
                <button
                  type="button"
                  onClick={pauseRecording}
                  className="rounded-lg bg-amber-500/90 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-amber-400"
                >
                  Pause
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-400"
                >
                  Stop
                </button>
              </>
            )}
            {recordState === "paused" && (
              <>
                <button
                  type="button"
                  onClick={resumeRecording}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-400"
                >
                  Resume
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-400"
                >
                  Stop
                </button>
              </>
            )}
            {(recordState === "stopped" || recordState === "idle") && recordState !== "idle" && (
              <button
                type="button"
                onClick={resetRecorder}
                className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800/80"
              >
                Clear
              </button>
            )}
          </div>
          {mediaError && <p className="mt-3 text-sm text-rose-400">{mediaError}</p>}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-sm">
          <h2 className="mb-4 text-sm font-medium text-zinc-200">Upload</h2>
          <label
            htmlFor="file-drop"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              onDropFiles(e.dataTransfer.files);
            }}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-600 bg-zinc-950/80 px-6 py-14 text-center transition hover:border-indigo-500/60 hover:bg-zinc-900/60"
          >
            <input
              id="file-drop"
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => onDropFiles(e.target.files)}
            />
            <span className="text-sm font-medium text-zinc-200">Drop audio or video here</span>
            <span className="mt-1 text-xs text-zinc-500">MP3, WAV, M4A, MP4, WebM</span>
          </label>
          {uploadFile && (
            <p className="mt-4 truncate text-xs text-zinc-400" title={uploadFile.name}>
              Selected: {uploadFile.name}
            </p>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-sm">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium text-zinc-200">Player</h2>
            {transcript?.language_code && (
              <p className="mt-1 text-xs text-zinc-500">
                Detected language:{" "}
                <span className="font-mono text-zinc-300">{transcript.language_code}</span>
                {typeof transcript.language_confidence === "number" && (
                  <>
                    {" "}
                    · confidence{" "}
                    {(transcript.language_confidence * 100).toFixed(0)}%
                  </>
                )}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!uploadFile || transcribeLoading}
              onClick={runTranscribe}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {transcribeLoading ? "Transcribing…" : "Transcribe"}
            </button>
            <button
              type="button"
              onClick={resetRecorder}
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800/80"
            >
              Reset all
            </button>
          </div>
        </div>
        <audio
          ref={audioRef}
          src={audioUrl ?? undefined}
          controls
          className="mt-2 w-full rounded-lg"
        />
        {transcribeError && <p className="mt-3 text-sm text-rose-400">{transcribeError}</p>}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-medium text-zinc-200">Transcript</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={exportDisabled}
              onClick={() =>
                downloadTextFile(`${baseName}.srt`, utterancesToSrt(captionItems), "text/srt")
              }
              className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Download .srt
            </button>
            <button
              type="button"
              disabled={exportDisabled}
              onClick={() =>
                downloadTextFile(`${baseName}.vtt`, utterancesToVtt(captionItems), "text/vtt")
              }
              className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Download .vtt
            </button>
            <button
              type="button"
              disabled={exportDisabled}
              onClick={() =>
                downloadTextFile(`${baseName}.txt`, utterancesToTxt(captionItems), "text/plain")
              }
              className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Download .txt
            </button>
          </div>
        </div>
        {!transcript && !transcribeLoading && (
          <p className="py-8 text-center text-sm text-zinc-500">
            Run transcribe to see timestamped speaker cards. Click a card to jump in the player.
          </p>
        )}
        {transcribeLoading && (
          <p className="py-8 text-center text-sm text-zinc-400">Processing audio with AssemblyAI…</p>
        )}
        <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
          {utterances.map((u, i) => {
            const startSec = u.start / 1000;
            const active = activeIndex === i;
            return (
              <li key={`${u.start}-${i}`}>
                <button
                  type="button"
                  onClick={() => seekTo(startSec, i)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-indigo-500/80 bg-indigo-500/10"
                      : "border-zinc-700/80 bg-zinc-950/50 hover:border-zinc-500 hover:bg-zinc-900/80"
                  }`}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span className="font-medium text-indigo-300">Speaker {u.speaker}</span>
                    <span className="font-mono text-zinc-500">
                      {formatTs(u.start)} → {formatTs(u.end)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-100">{u.text}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

    </div>
  );
}

function formatTs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const sub = Math.floor((ms % 1000) / 10);
  return `${m}:${String(sec).padStart(2, "0")}.${String(sub).padStart(2, "0")}`;
}
