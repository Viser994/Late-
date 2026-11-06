"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderStatus = "idle" | "requesting" | "recording" | "paused";

export interface RecordingResult {
  blob: Blob;
  mimeType: string;
  durationMs: number;
}

interface UseRecorderOptions {
  onComplete: (result: RecordingResult) => void;
}

const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

export function useRecorder({ onComplete }: UseRecorderOptions) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const onCompleteRef = useRef(onComplete);
  const tickRef = useRef<number | null>(null);
  const segmentStartRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const stopTicker = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const startTicker = useCallback(() => {
    segmentStartRef.current = performance.now();
    stopTicker();
    tickRef.current = window.setInterval(() => {
      setElapsedMs(
        accumulatedRef.current + (performance.now() - segmentStartRef.current),
      );
    }, 200);
  }, [stopTicker]);

  const teardown = useCallback(() => {
    stopTicker();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    recorderRef.current = null;
    setAnalyser(null);
  }, [stopTicker]);

  useEffect(() => teardown, [teardown]);

  const start = useCallback(async () => {
    setError(null);
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("Your browser does not support in-browser audio recording.");
      return;
    }

    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const node = audioContext.createAnalyser();
      node.fftSize = 2048;
      node.smoothingTimeConstant = 0.85;
      source.connect(node);
      audioContextRef.current = audioContext;
      setAnalyser(node);

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      chunksRef.current = [];
      accumulatedRef.current = 0;
      setElapsedMs(0);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const durationMs = accumulatedRef.current;
        teardown();
        setStatus("idle");
        setElapsedMs(0);
        if (blob.size > 0) {
          onCompleteRef.current({ blob, mimeType: type, durationMs });
        }
      };
      recorder.onerror = () => {
        setError("Recording failed unexpectedly.");
        teardown();
        setStatus("idle");
      };

      recorderRef.current = recorder;
      recorder.start(250);
      startTicker();
      setStatus("recording");
    } catch (err) {
      teardown();
      setStatus("idle");
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Microphone access was denied. Allow it in your browser settings and try again.");
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setError("No microphone was found on this device.");
      } else {
        setError("Could not start recording.");
      }
    }
  }, [startTicker, teardown]);

  const pause = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    recorder.pause();
    accumulatedRef.current += performance.now() - segmentStartRef.current;
    stopTicker();
    setElapsedMs(accumulatedRef.current);
    void audioContextRef.current?.suspend();
    setStatus("paused");
  }, [stopTicker]);

  const resume = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    recorder.resume();
    void audioContextRef.current?.resume();
    startTicker();
    setStatus("recording");
  }, [startTicker]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    if (recorder.state === "recording") {
      accumulatedRef.current += performance.now() - segmentStartRef.current;
    }
    stopTicker();
    recorder.stop();
  }, [stopTicker]);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    teardown();
    setStatus("idle");
    setElapsedMs(0);
  }, [teardown]);

  return { status, elapsedMs, error, analyser, start, pause, resume, stop, cancel };
}
