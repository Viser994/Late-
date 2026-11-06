"use client";

import {
  Captions,
  Check,
  ChevronDown,
  CircleStop,
  Clock3,
  Download,
  FileAudio,
  FileText,
  Globe2,
  Headphones,
  Languages,
  Mic,
  MoreHorizontal,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Upload,
  Volume2,
  WandSparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Segment = {
  id: string;
  speaker: string;
  start: number;
  end: number;
  text: string;
};

type TranscriptResponse = {
  id: string;
  language: string | null;
  duration: number | null;
  segments: Segment[];
  text: string;
};

const ACCEPTED_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "video/mp4",
  "video/webm",
  "audio/webm",
];
const ACCEPTED_EXTENSIONS = [".mp3", ".wav", ".m4a", ".mp4", ".webm"];
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const SPEAKER_COLORS = [
  { dot: "#c9ff58", bg: "rgba(201,255,88,.08)", text: "#c9ff58" },
  { dot: "#8aa8ff", bg: "rgba(138,168,255,.08)", text: "#aebfff" },
  { dot: "#f4a8ff", bg: "rgba(244,168,255,.08)", text: "#f5baff" },
  { dot: "#ffb86b", bg: "rgba(255,184,107,.08)", text: "#ffc58c" },
];

function formatTime(seconds: number, includeMs = false) {
  if (!Number.isFinite(seconds)) return "00:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const base = `${hours ? `${String(hours).padStart(2, "0")}:` : ""}${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return includeMs
    ? `${base}.${String(Math.floor((seconds % 1) * 1000)).padStart(3, "0")}`
    : base;
}

function srtTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function vttTime(seconds: number) {
  return srtTime(seconds).replace(",", ".");
}

function speakerIndex(speaker: string) {
  const code = speaker.replace("Speaker ", "").charCodeAt(0);
  return Number.isFinite(code) ? Math.max(0, code - 65) % SPEAKER_COLORS.length : 0;
}

export default function Home() {
  const [file, setFile] = useState<Blob | null>(null);
  const [fileName, setFileName] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptResponse | null>(null);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRecording || isPaused) return;
    const interval = window.setInterval(() => setRecordingTime((time) => time + 1), 1000);
    return () => window.clearInterval(interval);
  }, [isRecording, isPaused]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      void audioContextRef.current?.close();
    };
  }, [audioUrl]);

  const setSource = useCallback(
    (blob: Blob, name: string) => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setFile(blob);
      setFileName(name);
      setAudioUrl(URL.createObjectURL(blob));
      setTranscript(null);
      setCurrentTime(0);
      setError("");
    },
    [audioUrl],
  );

  const validateAndSetFile = useCallback(
    (selected: File) => {
      const extension = `.${selected.name.split(".").pop()?.toLowerCase()}`;
      if (!ACCEPTED_EXTENSIONS.includes(extension) && !ACCEPTED_TYPES.includes(selected.type)) {
        setError("Please choose an MP3, WAV, M4A, MP4, or WEBM file.");
        return;
      }
      if (selected.size > MAX_FILE_SIZE) {
        setError("This file is larger than the 500 MB upload limit.");
        return;
      }
      setSource(selected, selected.name);
    },
    [setSource],
  );

  const stopVisualizer = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
  }, []);

  const startVisualizer = useCallback((stream: MediaStream) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.82;
    source.connect(analyser);
    audioContextRef.current = context;

    const values = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const ratio = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
        canvas.width = width * ratio;
        canvas.height = height * ratio;
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      analyser.getByteFrequencyData(values);
      const barCount = 42;
      const gap = 3;
      const barWidth = Math.max(2, (width - gap * (barCount - 1)) / barCount);
      for (let index = 0; index < barCount; index++) {
        const value = values[Math.floor((index / barCount) * values.length)] / 255;
        const barHeight = Math.max(3, value * height * 0.92);
        ctx.fillStyle = index % 4 === 0 ? "#e5ffad" : "#c9ff58";
        ctx.globalAlpha = 0.55 + value * 0.45;
        ctx.beginPath();
        ctx.roundRect(index * (barWidth + gap), (height - barHeight) / 2, barWidth, barHeight, 4);
        ctx.fill();
      }
      animationRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  const startRecording = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setSource(blob, `recording-${new Date().toISOString().slice(0, 19).replaceAll(":", "-")}.webm`);
        stream.getTracks().forEach((track) => track.stop());
        stopVisualizer();
      };
      recorder.start(250);
      recorderRef.current = recorder;
      streamRef.current = stream;
      setRecordingTime(0);
      setIsRecording(true);
      setIsPaused(false);
      startVisualizer(stream);
    } catch {
      setError("Microphone access was denied. Allow access in your browser and try again.");
    }
  };

  const toggleRecordingPause = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state === "recording") {
      recorder.pause();
      void audioContextRef.current?.suspend();
      setIsPaused(true);
    } else if (recorder.state === "paused") {
      recorder.resume();
      void audioContextRef.current?.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
    setIsRecording(false);
    setIsPaused(false);
  };

  const clearSource = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl("");
    setFile(null);
    setFileName("");
    setTranscript(null);
    setDuration(0);
    setCurrentTime(0);
  };

  const transcribe = async () => {
    if (!file || !fileName) return;
    setIsTranscribing(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file, fileName);
      const response = await fetch("/api/transcribe", { method: "POST", body });
      const data = (await response.json()) as TranscriptResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || "Transcription failed.");
      setTranscript(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Transcription failed. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  };

  const seekTo = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = seconds;
    setCurrentTime(seconds);
    void audioRef.current.play();
  };

  const download = (kind: "srt" | "vtt" | "txt") => {
    if (!transcript) return;
    let content = "";
    if (kind === "txt") {
      content = transcript.segments
        .map((segment) => `[${formatTime(segment.start)}] ${segment.speaker}: ${segment.text}`)
        .join("\n\n");
    } else {
      const cues = transcript.segments
        .map((segment, index) => {
          const start = kind === "srt" ? srtTime(segment.start) : vttTime(segment.start);
          const end = kind === "srt" ? srtTime(segment.end) : vttTime(segment.end);
          return `${index + 1}\n${start} --> ${end}\n${segment.speaker}: ${segment.text}`;
        })
        .join("\n\n");
      content = kind === "vtt" ? `WEBVTT\n\n${cues}` : cues;
    }
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileName.replace(/\.[^/.]+$/, "") || "transcript"}.${kind}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const activeSegment = transcript?.segments.find(
    (segment) => currentTime >= segment.start && currentTime < segment.end,
  )?.id;

  return (
    <main className="min-h-screen">
      <nav className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#08090c]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-[1480px] items-center justify-between px-5 lg:px-9">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#c9ff58] text-[#0b0c0e] shadow-[0_0_24px_rgba(201,255,88,.16)]">
              <Captions size={20} strokeWidth={2.4} />
            </div>
            <span className="text-[18px] font-semibold tracking-[-0.04em]">VoxScribe</span>
            <span className="hidden rounded-full border border-[#c9ff58]/25 bg-[#c9ff58]/[0.07] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#c9ff58] sm:inline">
              AI powered
            </span>
          </div>
          <div className="hidden items-center gap-7 text-[13px] text-[#9da1ab] md:flex">
            <a className="transition hover:text-white" href="#workspace">Workspace</a>
            <a className="transition hover:text-white" href="#features">Features</a>
            <button className="flex items-center gap-1 transition hover:text-white">
              Resources <ChevronDown size={13} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden text-[13px] text-[#a9adb5] transition hover:text-white sm:block">
              Sign in
            </button>
            <button
              onClick={() => document.querySelector("#workspace")?.scrollIntoView({ behavior: "smooth" })}
              className="rounded-lg bg-[#c9ff58] px-4 py-2.5 text-[12px] font-semibold text-[#0b0c0e] transition hover:bg-[#dbff8f]"
            >
              Start transcribing
            </button>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-[1480px] px-5 pb-12 pt-14 text-center lg:px-9 lg:pt-20">
        <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[#aeb2bb]">
          <Sparkles size={12} className="text-[#c9ff58]" />
          Multilingual speech intelligence
        </div>
        <h1 className="mx-auto max-w-[850px] text-[43px] font-medium leading-[1.03] tracking-[-0.055em] text-[#f5f6f7] sm:text-[58px] lg:text-[72px]">
          Turn every voice into{" "}
          <span className="text-[#c9ff58]">clear words.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-[590px] text-[14px] leading-6 text-[#8d919b] sm:text-[15px]">
          Record or upload audio, identify every speaker, and create accurate subtitles
          in minutes — in virtually any language.
        </p>
        <div className="mt-7 flex items-center justify-center gap-5 text-[11px] text-[#727781]">
          <span className="flex items-center gap-1.5"><Check size={13} className="text-[#c9ff58]" /> Auto language detection</span>
          <span className="flex items-center gap-1.5"><Check size={13} className="text-[#c9ff58]" /> Speaker recognition</span>
          <span className="hidden items-center gap-1.5 sm:flex"><Check size={13} className="text-[#c9ff58]" /> 3 export formats</span>
        </div>
      </section>

      <section id="workspace" className="mx-auto max-w-[1480px] px-5 pb-24 lg:px-9">
        <div className="overflow-hidden rounded-[20px] border border-white/[0.09] bg-[#0d0f13] shadow-[0_30px_90px_rgba(0,0,0,.38)]">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#c9ff58] shadow-[0_0_8px_#c9ff58]" />
              <span className="text-[11px] font-medium text-[#c6c9cf]">New transcription</span>
              <span className="text-[10px] text-[#4f535c]">/</span>
              <span className="text-[10px] text-[#6f747e]">{fileName || "Untitled session"}</span>
            </div>
            <button aria-label="More options" className="rounded-md p-1.5 text-[#686d76] hover:bg-white/5 hover:text-white">
              <MoreHorizontal size={16} />
            </button>
          </div>

          <div className="grid min-h-[570px] lg:grid-cols-[390px_1fr]">
            <div className="border-b border-white/[0.07] p-5 lg:border-b-0 lg:border-r lg:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-medium text-[#e5e7eb]">Audio source</p>
                  <p className="mt-1 text-[10px] text-[#696e78]">Record live or add a media file</p>
                </div>
                {file && (
                  <button onClick={clearSource} className="rounded-md p-1.5 text-[#646973] transition hover:bg-white/5 hover:text-white" aria-label="Remove audio">
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#121419] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${isRecording ? "bg-red-400" : "bg-[#4b4f57]"}`} />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7d828c]">
                      {isRecording ? (isPaused ? "Recording paused" : "Recording live") : "Microphone"}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#a1a5ad]">{formatTime(recordingTime)}</span>
                </div>

                <div className="relative mb-4 flex h-[82px] items-center justify-center overflow-hidden rounded-lg border border-white/[0.05] bg-[#0c0e11]">
                  <canvas ref={canvasRef} className={`h-full w-full px-3 py-5 ${isRecording ? "opacity-100" : "opacity-0"}`} />
                  {!isRecording && (
                    <div className="absolute inset-0 flex items-center justify-center gap-[3px]">
                      {Array.from({ length: 34 }).map((_, index) => (
                        <span
                          key={index}
                          className="w-[2px] rounded-full bg-[#31343b]"
                          style={{ height: `${4 + ((index * 7) % 14)}px` }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {!isRecording ? (
                  <button onClick={startRecording} className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[11px] font-semibold text-[#111318] transition hover:bg-[#e7e9ec]">
                    <Mic size={14} /> Start recording
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={toggleRecordingPause} className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] py-2.5 text-[11px] font-medium text-[#d2d5da] hover:bg-white/[0.07]">
                      {isPaused ? <Play size={13} /> : <Pause size={13} />}
                      {isPaused ? "Resume" : "Pause"}
                    </button>
                    <button onClick={stopRecording} className="flex items-center justify-center gap-2 rounded-lg bg-red-400/10 py-2.5 text-[11px] font-medium text-red-300 hover:bg-red-400/15">
                      <CircleStop size={13} /> Stop
                    </button>
                  </div>
                )}
              </div>

              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#4f545d]">or upload</span>
                <span className="h-px flex-1 bg-white/[0.06]" />
              </div>

              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".mp3,.wav,.m4a,.mp4,.webm,audio/*,video/mp4,video/webm"
                onChange={(event) => event.target.files?.[0] && validateAndSetFile(event.target.files[0])}
              />
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && inputRef.current?.click()}
                onClick={() => inputRef.current?.click()}
                onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  if (event.dataTransfer.files[0]) validateAndSetFile(event.dataTransfer.files[0]);
                }}
                className={`group rounded-xl border border-dashed p-5 text-center transition ${
                  isDragging ? "border-[#c9ff58] bg-[#c9ff58]/[0.06]" : "border-white/[0.11] bg-[#101216] hover:border-white/[0.2]"
                }`}
              >
                <div className="mx-auto mb-2.5 grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#8e939d] transition group-hover:text-[#c9ff58]">
                  <Upload size={16} />
                </div>
                <p className="text-[11px] font-medium text-[#d3d5da]">Drop a file here, or <span className="text-[#c9ff58]">browse</span></p>
                <p className="mt-1.5 text-[9px] text-[#5e636c]">MP3, WAV, M4A, MP4, WEBM · up to 500 MB</p>
              </div>

              {file && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-[#c9ff58]/15 bg-[#c9ff58]/[0.035] p-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#c9ff58]/10 text-[#c9ff58]">
                    <FileAudio size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-medium text-[#dadddf]">{fileName}</p>
                    <p className="mt-1 text-[9px] text-[#686d76]">{(file.size / 1024 / 1024).toFixed(1)} MB · Ready</p>
                  </div>
                  <Check size={14} className="text-[#c9ff58]" />
                </div>
              )}

              <button
                onClick={transcribe}
                disabled={!file || isTranscribing}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#c9ff58] px-4 py-3 text-[11px] font-semibold text-[#10120c] transition hover:bg-[#dcff94] disabled:cursor-not-allowed disabled:bg-[#24272d] disabled:text-[#61666f]"
              >
                {isTranscribing ? (
                  <>
                    <span className="loading-dots flex gap-1"><span>●</span><span>●</span><span>●</span></span>
                    Transcribing audio
                  </>
                ) : (
                  <><WandSparkles size={14} /> Generate transcript</>
                )}
              </button>
              {error && <p className="mt-3 rounded-lg border border-red-400/15 bg-red-400/[0.06] p-2.5 text-[10px] leading-4 text-red-300">{error}</p>}
            </div>

            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-4 lg:px-7">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-[12px] font-medium text-[#e6e8eb]">Transcript</p>
                    <p className="mt-1 text-[9px] text-[#666b74]">
                      {transcript ? `${transcript.segments.length} segments · ${transcript.language?.toUpperCase() || "Language detected"}` : "Your speaker-aware transcript will appear here"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {transcript && (
                    <>
                      <span className="mr-1 hidden items-center gap-1.5 rounded-md border border-white/[0.07] px-2.5 py-1.5 text-[9px] text-[#888d96] sm:flex">
                        <Globe2 size={11} /> {transcript.language?.toUpperCase() || "AUTO"}
                      </span>
                      {(["srt", "vtt", "txt"] as const).map((kind) => (
                        <button key={kind} onClick={() => download(kind)} className="flex items-center gap-1.5 rounded-md border border-white/[0.09] bg-white/[0.025] px-2.5 py-1.5 text-[9px] font-medium uppercase text-[#aeb2ba] transition hover:border-[#c9ff58]/30 hover:text-[#c9ff58]">
                          <Download size={10} /> {kind}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 lg:max-h-[480px] lg:p-7">
                {isTranscribing ? (
                  <div className="flex min-h-[330px] flex-col items-center justify-center text-center">
                    <div className="relative mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-[#c9ff58]/20 bg-[#c9ff58]/[0.06] text-[#c9ff58]">
                      <span className="pulse-ring absolute inset-0 rounded-2xl border border-[#c9ff58]/40" />
                      <Languages size={23} />
                    </div>
                    <p className="text-[13px] font-medium text-[#e0e2e5]">Listening in every language</p>
                    <p className="mt-2 max-w-[280px] text-[10px] leading-5 text-[#6e737d]">
                      Detecting language, separating speakers, and aligning every word.
                    </p>
                  </div>
                ) : transcript?.segments.length ? (
                  <div className="space-y-3">
                    {transcript.segments.map((segment) => {
                      const color = SPEAKER_COLORS[speakerIndex(segment.speaker)];
                      const isActive = activeSegment === segment.id;
                      return (
                        <button
                          key={segment.id}
                          onClick={() => seekTo(segment.start)}
                          className={`group w-full rounded-xl border p-4 text-left transition ${
                            isActive
                              ? "border-[#c9ff58]/35 bg-[#c9ff58]/[0.055]"
                              : "border-white/[0.065] bg-[#111318] hover:border-white/[0.14] hover:bg-[#14161b]"
                          }`}
                        >
                          <div className="mb-2.5 flex items-center justify-between">
                            <span className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: color.text }}>
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color.dot }} />
                              {segment.speaker}
                            </span>
                            <span className="flex items-center gap-1 font-mono text-[9px] text-[#646973] group-hover:text-[#9499a2]">
                              <Play size={8} fill="currentColor" /> {formatTime(segment.start, true)}
                            </span>
                          </div>
                          <p className="text-[12px] leading-[1.7] text-[#c9ccd2]">{segment.text}</p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex min-h-[330px] flex-col items-center justify-center text-center">
                    <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.025] text-[#626771]">
                      <FileText size={22} />
                    </div>
                    <p className="text-[13px] font-medium text-[#cdd0d5]">Your words, perfectly timed</p>
                    <p className="mt-2 max-w-[300px] text-[10px] leading-5 text-[#626771]">
                      Add audio on the left, then generate a timestamped transcript with automatic speaker labels.
                    </p>
                    <div id="features" className="mt-7 grid grid-cols-3 gap-5 text-[#595e68]">
                      <div className="flex flex-col items-center gap-2"><Languages size={14} /><span className="text-[8px] uppercase tracking-wider">Multilingual</span></div>
                      <div className="flex flex-col items-center gap-2"><Headphones size={14} /><span className="text-[8px] uppercase tracking-wider">Speakers</span></div>
                      <div className="flex flex-col items-center gap-2"><Clock3 size={14} /><span className="text-[8px] uppercase tracking-wider">Timestamps</span></div>
                    </div>
                  </div>
                )}
              </div>

              {audioUrl && (
                <div className="border-t border-white/[0.07] bg-[#0b0d10] px-5 py-4 lg:px-7">
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
                    onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />
                  <div className="flex items-center gap-3">
                    <button onClick={togglePlayback} aria-label={isPlaying ? "Pause" : "Play"} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#c9ff58] text-[#0c0e09] transition hover:bg-[#dcff94]">
                      {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} className="ml-0.5" fill="currentColor" />}
                    </button>
                    <button onClick={() => seekTo(Math.max(0, currentTime - 10))} aria-label="Rewind 10 seconds" className="text-[#737882] hover:text-white">
                      <RotateCcw size={15} />
                    </button>
                    <span className="w-[38px] font-mono text-[9px] text-[#92969e]">{formatTime(currentTime)}</span>
                    <input
                      aria-label="Audio progress"
                      className="min-w-0 flex-1"
                      type="range"
                      min="0"
                      max={duration || 0}
                      step="0.01"
                      value={Math.min(currentTime, duration || 0)}
                      onChange={(event) => seekTo(Number(event.target.value))}
                      style={{ background: `linear-gradient(to right, #c9ff58 ${(currentTime / (duration || 1)) * 100}%, #30333b 0%)` }}
                    />
                    <span className="w-[38px] font-mono text-[9px] text-[#5e636c]">{formatTime(duration)}</span>
                    <Volume2 size={14} className="text-[#747983]" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[9px] uppercase tracking-[0.14em] text-[#454a52]">
          <span>Encrypted upload</span>
          <span>Auto language detection</span>
          <span>Speaker diarization</span>
          <span>Frame-accurate exports</span>
        </div>
      </section>
    </main>
  );
}
