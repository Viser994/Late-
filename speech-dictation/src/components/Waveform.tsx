"use client";

import { useEffect, useRef } from "react";

interface WaveformProps {
  analyser: AnalyserNode | null;
  /** When false the last frame stays frozen on the canvas. */
  active: boolean;
  className?: string;
}

const BAR_COUNT = 56;

export function Waveform({ analyser, active, className }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const levelsRef = useRef<number[]>(new Array(BAR_COUNT).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const { clientWidth, clientHeight } = canvas;
      if (canvas.width !== clientWidth * dpr || canvas.height !== clientHeight * dpr) {
        canvas.width = clientWidth * dpr;
        canvas.height = clientHeight * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, clientWidth, clientHeight);

      const levels = levelsRef.current;
      if (analyser && active) {
        const data = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        levels.push(Math.min(1, rms * 3.2));
        if (levels.length > BAR_COUNT) levels.shift();
      }

      const gap = 3;
      const barWidth = (clientWidth - gap * (BAR_COUNT - 1)) / BAR_COUNT;
      const midY = clientHeight / 2;
      const gradient = ctx.createLinearGradient(0, 0, clientWidth, 0);
      gradient.addColorStop(0, "rgba(129,140,248,0.35)");
      gradient.addColorStop(1, active ? "#a5b4fc" : "#6b7280");
      ctx.fillStyle = gradient;

      for (let i = 0; i < BAR_COUNT; i += 1) {
        const level = levels[i] ?? 0;
        const h = Math.max(3, level * (clientHeight - 6));
        const x = i * (barWidth + gap);
        const radius = Math.min(barWidth / 2, 3);
        ctx.beginPath();
        ctx.roundRect(x, midY - h / 2, barWidth, h, radius);
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [analyser, active]);

  useEffect(() => {
    if (!analyser) levelsRef.current = new Array(BAR_COUNT).fill(0);
  }, [analyser]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label="Live microphone waveform"
    />
  );
}
