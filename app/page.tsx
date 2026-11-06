"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";

type Utterance = {
  id: string;
  speaker: string;
  start: number;
  end: number;
  text: string;
  confidence: number | null;
};

type TranscriptResult = {
  id: string;
  languageCode: string;
  languageConfidence: number | null;
  duration: number | null;
  text: string;
  utterances: Utterance[];
};

type RecorderState = "idle" | "recording" | "paused" | "stopped";

const accept = ".mp3,.wav,.m4a,.mp4,.webm,audio/*,video/mp4,video/webm";

const formatClock = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const formatCaptionTimestamp = (milliseconds: number, separator: "," | ".") => {
  const totalMilliseconds = Math.max(0, Math.floor(milliseconds));
  const hours = Math.floor(totalMilliseconds / 3_600_000);
  const minutes = Math.floor((totalMilliseconds % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMilliseconds % 60_000) / 1000);
  const millis = totalMilliseconds % 1000;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}${separator}${String(millis).padStart(3, "0")}`;
};

const createFallbackUtterances = (result: TranscriptResult): Utterance[] => {
  if (result.utterances.length > 0) {
    return result.utterances;
  }

  return [
    {
      id: result.id,
      speaker: "Transcript",
      start: 0,
      end: Math.round((result.duration ?? 0) * 1000),
      text: result.text,
      confidence: null,
    },
  ];
};

const buildExport = (result: TranscriptResult, type: "srt" | "vtt" | "txt") => {
  const cues = createFallbackUtterances(result);

  if (type === "txt") {
    return cues
      .map(
        (cue) =>
          `[${formatClock(cue.start)}] ${cue.speaker}: ${cue.text.trim()}`,
      )
      .join("\n\n");
  }

  const body = cues
    .map((cue, index) => {
      const start = formatCaptionTimestamp(cue.start, type === "srt" ? "," : ".");
      const end = formatCaptionTimestamp(cue.end, type === "srt" ? "," : ".");
      const prefix = type === "srt" ? `${index + 1}\n` : "";

      return `${prefix}${start} --> ${end}\n${cue.speaker}: ${cue.text.trim()}`;
    })
    .join("\n\n");

  return type === "vtt" ? `WEBVTT\n\n${body}\n` : `${body}\n`;
};

export default function Home() {
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [result, setResult] = useState<TranscriptResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const stopWaveform = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  useEffect(() => {
    return () => {
      stopWaveform();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      void audioContextRef.current?.close();
    };
  }, []);

  const setMediaSource = (file: File) => {
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }

    setSelectedFile(file);
    setMediaUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const drawWaveform = (analyser: AnalyserNode) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const buffer = new Uint8Array(analyser.frequencyBinCount);

    const render = () => {
      analyser.getByteTimeDomainData(buffer);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "rgba(15, 23, 42, 0.84)";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.lineWidth = 3;
      context.strokeStyle = "#2dd4bf";
      context.beginPath();

      const sliceWidth = canvas.width / buffer.length;
      let x = 0;

      buffer.forEach((value, index) => {
        const y = (value / 128) * (canvas.height / 2);

        if (index === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }

        x += sliceWidth;
      });

      context.lineTo(canvas.width, canvas.height / 2);
      context.stroke();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  const startRecording = async () => {
    setError(null);
    setResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : undefined;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 2048;
      source.connect(analyser);
      drawWaveform(analyser);

      chunksRef.current = [];
      streamRef.current = stream;
      audioContextRef.current = audioContext;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const file = new File([blob], `dictation-${Date.now()}.webm`, {
          type: blob.type,
        });

        stream.getTracks().forEach((track) => track.stop());
        stopWaveform();
        void audioContext.close();
        setMediaSource(file);
      };

      recorder.start();
      setRecorderState("recording");
    } catch {
      setError("Microphone access was blocked or unavailable.");
      setRecorderState("idle");
    }
  };

  const pauseRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (!recorder) {
      return;
    }

    if (recorder.state === "recording") {
      recorder.pause();
      setRecorderState("paused");
      void audioContextRef.current?.suspend();
    } else if (recorder.state === "paused") {
      recorder.resume();
      setRecorderState("recording");
      void audioContextRef.current?.resume();
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      setRecorderState("stopped");
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) {
      return;
    }

    setMediaSource(file);
    setRecorderState("idle");
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files[0]);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const transcribe = async () => {
    if (!selectedFile) {
      setError("Record or upload a file before generating captions.");
      return;
    }

    setIsTranscribing(true);
    setError(null);

    const formData = new FormData();
    formData.append("media", selectedFile);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as
        | TranscriptResult
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Transcription failed.",
        );
      }

      setResult(payload as TranscriptResult);
    } catch (transcriptionError) {
      setError(
        transcriptionError instanceof Error
          ? transcriptionError.message
          : "Transcription failed.",
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const seekTo = (milliseconds: number) => {
    if (!mediaRef.current) {
      return;
    }

    mediaRef.current.currentTime = milliseconds / 1000;
    void mediaRef.current.play();
  };

  const download = (type: "srt" | "vtt" | "txt") => {
    if (!result) {
      return;
    }

    const content = buildExport(result, type);
    const blob = new Blob([content], {
      type: type === "txt" ? "text/plain" : "text/vtt",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `captions-${result.id}.${type}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const mediaIsVideo = selectedFile?.type.startsWith("video/");
  const cues = result ? createFallbackUtterances(result) : [];

  return (
    <main className="min-h-screen px-6 py-8 text-slate-100 lg:px-10">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10">
        <header className="flex flex-col gap-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur md:p-12">
          <nav className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400 text-lg font-black text-slate-950">
                LS
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.45em] text-cyan-200/80">
                  LinguaScribe AI
                </p>
                <p className="text-sm text-slate-400">
                  multilingual dictation studio
                </p>
              </div>
            </div>
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
              AssemblyAI powered
            </span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="space-y-6">
              <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                Speaker diarization + automatic language detection
              </div>
              <h1 className="max-w-4xl text-5xl font-black tracking-tight text-white md:text-7xl">
                Turn multilingual speech into searchable subtitles.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                Record from your microphone or upload audio/video. Get
                timestamped speaker cards, jump-to-audio review, and export
                captions as SRT, VTT, or plain text.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[".srt", ".vtt", ".txt"].map((format) => (
                <div
                  className="rounded-3xl border border-white/10 bg-slate-950/60 p-5"
                  key={format}
                >
                  <p className="text-2xl font-black text-cyan-200">{format}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                    export
                  </p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-xl">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">
                    recorder
                  </p>
                  <h2 className="text-2xl font-bold">Live microphone capture</h2>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-sm capitalize text-slate-300">
                  {recorderState}
                </span>
              </div>

              <canvas
                aria-label="Live audio waveform"
                className="h-36 w-full rounded-3xl border border-white/10 bg-slate-900"
                height={180}
                ref={canvasRef}
                width={900}
              />

              <div className="mt-5 grid grid-cols-3 gap-3">
                <button
                  className="rounded-2xl bg-cyan-300 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={recorderState === "recording"}
                  onClick={startRecording}
                  type="button"
                >
                  Start
                </button>
                <button
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    recorderState !== "recording" && recorderState !== "paused"
                  }
                  onClick={pauseRecording}
                  type="button"
                >
                  {recorderState === "paused" ? "Resume" : "Pause"}
                </button>
                <button
                  className="rounded-2xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 font-bold text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    recorderState !== "recording" && recorderState !== "paused"
                  }
                  onClick={stopRecording}
                  type="button"
                >
                  Stop
                </button>
              </div>
            </div>

            <label
              className={`flex cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-dashed p-8 text-center transition ${
                isDragging
                  ? "border-cyan-200 bg-cyan-300/10"
                  : "border-white/15 bg-white/[0.04] hover:border-cyan-200/70"
              }`}
              onDragEnter={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                accept={accept}
                className="sr-only"
                onChange={handleFileChange}
                type="file"
              />
              <span className="mb-4 rounded-full bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
                Dropzone
              </span>
              <h2 className="text-2xl font-bold">Upload audio or video</h2>
              <p className="mt-3 max-w-md text-slate-400">
                Drag in .mp3, .wav, .m4a, .mp4, or .webm files, or click to
                browse from your computer.
              </p>
            </label>

            {selectedFile ? (
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500">
                  selected media
                </p>
                <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{selectedFile.name}</h3>
                    <p className="text-sm text-slate-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    className="rounded-2xl bg-white px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isTranscribing}
                    onClick={transcribe}
                    type="button"
                  >
                    {isTranscribing ? "Generating..." : "Generate captions"}
                  </button>
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-3xl border border-rose-300/30 bg-rose-400/10 p-5 text-rose-100">
                {error}
              </div>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">
                  playback + subtitles
                </p>
                <h2 className="text-2xl font-bold">Review and export</h2>
              </div>
              <div className="flex gap-2">
                {(["srt", "vtt", "txt"] as const).map((type) => (
                  <button
                    className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold uppercase text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!result}
                    key={type}
                    onClick={() => download(type)}
                    type="button"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-black/40">
              {mediaUrl ? (
                mediaIsVideo ? (
                  <video
                    className="max-h-[28rem] w-full bg-black"
                    controls
                    ref={(node) => {
                      mediaRef.current = node;
                    }}
                    src={mediaUrl}
                  />
                ) : (
                  <div className="p-5">
                    <audio
                      className="w-full"
                      controls
                      ref={(node) => {
                        mediaRef.current = node;
                      }}
                      src={mediaUrl}
                    />
                  </div>
                )
              ) : (
                <div className="grid min-h-40 place-items-center p-8 text-center text-slate-500">
                  Record or upload media to enable playback.
                </div>
              )}
            </div>

            {result ? (
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-300">
                <span className="rounded-full bg-white/10 px-4 py-2">
                  Language: {result.languageCode}
                </span>
                {result.languageConfidence !== null ? (
                  <span className="rounded-full bg-white/10 px-4 py-2">
                    Confidence: {(result.languageConfidence * 100).toFixed(1)}%
                  </span>
                ) : null}
                <span className="rounded-full bg-white/10 px-4 py-2">
                  {cues.length} caption cards
                </span>
              </div>
            ) : null}

            <div className="mt-6 max-h-[38rem] space-y-3 overflow-y-auto pr-2">
              {isTranscribing ? (
                <div className="rounded-3xl border border-cyan-200/20 bg-cyan-300/10 p-6 text-cyan-100">
                  Uploading media and waiting for diarized multilingual
                  transcription...
                </div>
              ) : null}

              {!isTranscribing && cues.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-slate-500">
                  Timestamped speaker cards will appear here after
                  transcription.
                </div>
              ) : null}

              {cues.map((cue) => (
                <button
                  className="block w-full rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-cyan-200/70 hover:bg-cyan-300/10"
                  key={cue.id}
                  onClick={() => seekTo(cue.start)}
                  type="button"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-2xl bg-cyan-300 px-3 py-1 text-sm font-black text-slate-950">
                        {cue.speaker}
                      </span>
                      <span className="font-mono text-sm text-cyan-100">
                        {formatClock(cue.start)} - {formatClock(cue.end)}
                      </span>
                    </div>
                    {cue.confidence !== null ? (
                      <span className="text-sm text-slate-500">
                        {(cue.confidence * 100).toFixed(0)}% confidence
                      </span>
                    ) : null}
                  </div>
                  <p className="leading-7 text-slate-200">{cue.text}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
