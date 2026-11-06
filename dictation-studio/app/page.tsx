"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TranscriptUtterance = {
  speaker: string;
  text: string;
  start: number;
  end: number;
};

type TranscriptPayload = {
  id: string;
  text: string;
  language: string;
  durationSeconds: number;
  utterances: TranscriptUtterance[];
};

const ACCEPTED_FORMATS = ".mp3,.wav,.m4a,.mp4,.webm";

function formatPlayerTime(seconds: number): string {
  if (!Number.isFinite(seconds)) {
    return "00:00";
  }
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(wholeSeconds / 60);
  const remain = wholeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`;
}

function formatSubtitleTime(
  milliseconds: number,
  format: "srt" | "vtt",
): string {
  const total = Math.max(0, Math.floor(milliseconds));
  const hours = Math.floor(total / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  const seconds = Math.floor((total % 60_000) / 1_000);
  const millis = total % 1_000;
  const separator = format === "srt" ? "," : ".";

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}${separator}${String(millis).padStart(3, "0")}`;
}

export default function Home() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [transcript, setTranscript] = useState<TranscriptPayload | null>(null);
  const [currentPlayback, setCurrentPlayback] = useState(0);
  const [activeUtterance, setActiveUtterance] = useState<number>(-1);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const stopWaveform = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const drawWaveform = useCallback(() => {
    const canvas = waveformCanvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = analyser.fftSize;
    const data = new Uint8Array(bufferLength);

    const render = () => {
      if (!analyserRef.current) {
        return;
      }

      analyser.getByteTimeDomainData(data);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#22d3ee";
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i += 1) {
        const y = (data[i] / 255) * height;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
      animationRef.current = requestAnimationFrame(render);
    };

    render();
  }, []);

  const cleanupRecorderStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setIsPaused(false);
    stopWaveform();
  }, [stopWaveform]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      cleanupRecorderStream();
    };
  }, [audioUrl, cleanupRecorderStream]);

  const setFileForTranscription = useCallback((file: File) => {
    setError("");
    setTranscript(null);
    setCurrentPlayback(0);
    setActiveUtterance(-1);

    setAudioFile(file);
    setAudioUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(file);
    });
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError("");
      recordedChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      source.connect(analyser);
      drawWaveform();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const recordingBlob = new Blob(recordedChunksRef.current, {
          type: "audio/webm",
        });
        const capturedFile = new File(
          [recordingBlob],
          `recording-${Date.now()}.webm`,
          {
            type: "audio/webm",
          },
        );
        setFileForTranscription(capturedFile);
        cleanupRecorderStream();
      };

      recorder.start(500);
      setIsRecording(true);
      setIsPaused(false);
    } catch (recordingError) {
      cleanupRecorderStream();
      const message =
        recordingError instanceof Error
          ? recordingError.message
          : "Microphone access failed.";
      setError(message);
    }
  }, [cleanupRecorderStream, drawWaveform, setFileForTranscription]);

  const togglePauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !isRecording) {
      return;
    }
    if (recorder.state === "recording") {
      recorder.pause();
      setIsPaused(true);
      return;
    }
    if (recorder.state === "paused") {
      recorder.resume();
      setIsPaused(false);
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      cleanupRecorderStream();
      return;
    }
    recorder.stop();
  }, [cleanupRecorderStream]);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files[0];
      if (!file) {
        return;
      }
      setFileForTranscription(file);
    },
    [setFileForTranscription],
  );

  const transcribe = useCallback(async () => {
    if (!audioFile) {
      setError("Choose or record an audio/video file first.");
      return;
    }

    setError("");
    setIsLoading(true);
    setTranscript(null);

    try {
      const formData = new FormData();
      formData.append("file", audioFile);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as
        | TranscriptPayload
        | { error?: string };

      if (!response.ok) {
        const serverError =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Transcription request failed.";
        throw new Error(serverError);
      }

      setTranscript(payload as TranscriptPayload);
    } catch (transcriptionError) {
      const message =
        transcriptionError instanceof Error
          ? transcriptionError.message
          : "Transcription failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [audioFile]);

  const exportText = useMemo(() => {
    if (!transcript) {
      return "";
    }
    if (!transcript.utterances.length) {
      return transcript.text;
    }
    return transcript.utterances
      .map(
        (item) =>
          `[${formatPlayerTime(item.start / 1000)}] ${item.speaker}: ${item.text}`,
      )
      .join("\n");
  }, [transcript]);

  const exportSrt = useMemo(() => {
    if (!transcript) {
      return "";
    }
    return transcript.utterances
      .map(
        (item, index) =>
          `${index + 1}\n${formatSubtitleTime(item.start, "srt")} --> ${formatSubtitleTime(item.end, "srt")}\n${item.speaker}: ${item.text}\n`,
      )
      .join("\n");
  }, [transcript]);

  const exportVtt = useMemo(() => {
    if (!transcript) {
      return "";
    }
    const body = transcript.utterances
      .map(
        (item) =>
          `${formatSubtitleTime(item.start, "vtt")} --> ${formatSubtitleTime(item.end, "vtt")}\n${item.speaker}: ${item.text}\n`,
      )
      .join("\n");
    return `WEBVTT\n\n${body}`;
  }, [transcript]);

  const downloadTextFile = useCallback((filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  const seekToUtterance = useCallback((seconds: number) => {
    const player = audioPlayerRef.current;
    if (!player) {
      return;
    }
    player.currentTime = seconds;
    void player.play();
  }, []);

  const updateActiveUtterance = useCallback(
    (seconds: number) => {
      if (!transcript) {
        setActiveUtterance(-1);
        return;
      }
      const index = transcript.utterances.findIndex((item) => {
        const start = item.start / 1000;
        const end = item.end / 1000;
        return seconds >= start && seconds <= end;
      });
      setActiveUtterance(index);
    },
    [transcript],
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-cyan-900/20">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">
            Multilingual AI Dictation
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Speech Dictation & Subtitle Studio
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-300 sm:text-base">
            Record from your microphone or upload audio/video, transcribe with
            speaker diarization and language detection, then export polished
            subtitles in SRT, VTT, or TXT.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
            <h2 className="text-lg font-medium text-white">
              1) Web Audio Recorder
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Capture speech directly in the browser with live waveform
              monitoring.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
                onClick={startRecording}
                disabled={isRecording}
              >
                Start
              </button>
              <button
                type="button"
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:text-zinc-500"
                onClick={togglePauseRecording}
                disabled={!isRecording}
              >
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button
                type="button"
                className="rounded-lg border border-rose-700 bg-rose-950/40 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-900/60 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-500"
                onClick={stopRecording}
                disabled={!isRecording}
              >
                Stop
              </button>
            </div>
            <canvas
              ref={waveformCanvasRef}
              width={700}
              height={160}
              className="mt-4 h-32 w-full rounded-xl border border-zinc-800 bg-black"
            />
            <p className="mt-3 text-xs text-zinc-500">
              Status:{" "}
              {isRecording
                ? isPaused
                  ? "Paused"
                  : "Recording..."
                : "Idle"}
            </p>
          </article>

          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
            <h2 className="text-lg font-medium text-white">
              2) File Upload Dropzone
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Drag-and-drop or choose a source file (
              <span className="text-zinc-300">{ACCEPTED_FORMATS}</span>).
            </p>

            <label
              htmlFor="media-file"
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`mt-4 flex min-h-36 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-5 text-center transition ${
                isDragging
                  ? "border-cyan-400 bg-cyan-500/10"
                  : "border-zinc-700 bg-zinc-950/40 hover:border-zinc-500"
              }`}
            >
              <input
                id="media-file"
                type="file"
                accept={ACCEPTED_FORMATS}
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    setFileForTranscription(file);
                  }
                }}
              />
              <span className="text-sm font-medium text-zinc-200">
                Drop file here or click to browse
              </span>
              <span className="mt-2 text-xs text-zinc-500">
                Supports .mp3, .wav, .m4a, .mp4, .webm
              </span>
            </label>

            {audioFile ? (
              <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-950/60 p-3 text-sm">
                <p className="font-medium text-zinc-200">{audioFile.name}</p>
                <p className="text-xs text-zinc-500">
                  {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : null}

            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
              onClick={transcribe}
              disabled={!audioFile || isLoading}
            >
              {isLoading ? "Transcribing..." : "Generate Transcript"}
            </button>

            {error ? (
              <p className="mt-3 rounded-lg border border-rose-900 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            ) : null}
          </article>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
          <h2 className="text-lg font-medium text-white">
            3) Audio Player & Transcript Cards
          </h2>
          {audioUrl ? (
            <div className="mt-4 space-y-4">
              <audio
                ref={audioPlayerRef}
                controls
                className="w-full"
                src={audioUrl}
                onTimeUpdate={(event) => {
                  const nextTime = event.currentTarget.currentTime;
                  setCurrentPlayback(nextTime);
                  updateActiveUtterance(nextTime);
                }}
              />
              <p className="text-xs text-zinc-500">
                Playback: {formatPlayerTime(currentPlayback)}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-400">
              Add audio first to activate playback and transcript sync.
            </p>
          )}

          {transcript ? (
            <div className="mt-6">
              <div className="mb-4 rounded-xl border border-zinc-700 bg-zinc-950/50 p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">
                  Detected language
                </p>
                <p className="mt-1 text-sm font-medium text-cyan-300">
                  {transcript.language}
                </p>
              </div>
              <div className="max-h-[28rem] space-y-3 overflow-auto pr-1">
                {transcript.utterances.length ? (
                  transcript.utterances.map((item, index) => (
                    <button
                      key={`${item.start}-${index}`}
                      type="button"
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        activeUtterance === index
                          ? "border-cyan-400 bg-cyan-500/10"
                          : "border-zinc-700 bg-zinc-950/40 hover:border-zinc-500"
                      }`}
                      onClick={() => seekToUtterance(item.start / 1000)}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-cyan-300">
                          {item.speaker}
                        </span>
                        <span className="text-xs text-zinc-400">
                          {formatPlayerTime(item.start / 1000)} -{" "}
                          {formatPlayerTime(item.end / 1000)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-100">{item.text}</p>
                    </button>
                  ))
                ) : (
                  <p className="rounded-lg border border-zinc-700 bg-zinc-950/50 p-4 text-sm text-zinc-300">
                    {transcript.text || "No transcript text returned."}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-400">
              Generate a transcript to view timestamped subtitle cards.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
          <h2 className="text-lg font-medium text-white">
            4) Export Captions (SRT / VTT / TXT)
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:text-zinc-500"
              disabled={!transcript}
              onClick={() => downloadTextFile("captions.srt", exportSrt)}
            >
              Download .srt
            </button>
            <button
              type="button"
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:text-zinc-500"
              disabled={!transcript}
              onClick={() => downloadTextFile("captions.vtt", exportVtt)}
            >
              Download .vtt
            </button>
            <button
              type="button"
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:text-zinc-500"
              disabled={!transcript}
              onClick={() => downloadTextFile("transcript.txt", exportText)}
            >
              Download .txt
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
