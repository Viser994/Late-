"use client";

import { useEffect, useRef } from "react";

type WaveformProps = {
  analyser: AnalyserNode | null;
  active: boolean;
  paused: boolean;
};

export function Waveform({ analyser, active, paused }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let frame = 0;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      context.clearRect(0, 0, width, height);
      context.strokeStyle = "rgba(214, 255, 63, 0.16)";
      context.lineWidth = dpr;
      context.beginPath();
      context.moveTo(0, height / 2);
      context.lineTo(width, height / 2);
      context.stroke();

      context.beginPath();
      context.lineWidth = 1.75 * dpr;
      context.strokeStyle = paused ? "rgba(163, 158, 148, 0.9)" : "#d6ff3f";
      context.lineJoin = "round";
      context.lineCap = "round";

      if (analyser && active) {
        if (!dataRef.current || dataRef.current.length !== analyser.fftSize) {
          dataRef.current = new Uint8Array(new ArrayBuffer(analyser.fftSize));
        }
        analyser.getByteTimeDomainData(dataRef.current);
        const data = dataRef.current;
        let peak = 4;
        for (let index = 0; index < data.length; index += 1) {
          peak = Math.max(peak, Math.abs(data[index] - 128));
        }
        const scale = Math.min(5, 120 / peak);
        const slice = data.length / width;
        for (let x = 0; x < width; x += 1) {
          const index = Math.min(data.length - 1, Math.floor(x * slice));
          const centered = (data[index] - 128) / 128;
          const y = height / 2 + centered * (height / 2) * scale;
          if (x === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
      } else {
        context.moveTo(0, height / 2);
        context.lineTo(width, height / 2);
      }
      context.stroke();
    };

    if (!active) {
      draw();
      return;
    }

    const loop = () => {
      draw();
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frame);
  }, [active, analyser, paused]);

  return (
    <canvas
      ref={canvasRef}
      className="h-28 w-full"
      role="img"
      aria-label={active ? (paused ? "Paused microphone waveform" : "Live microphone waveform") : "Waveform idle"}
    />
  );
}
