"use client";

import { useEffect, useRef } from "react";

/**
 * Live microphone waveform drawn from a Web Audio AnalyserNode.
 * When no analyser is supplied it renders a calm idle animation.
 */
export default function LiveWaveform({
  analyser,
  active,
  paused,
}: {
  analyser: AnalyserNode | null;
  active: boolean;
  paused: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ analyser, active, paused });

  useEffect(() => {
    stateRef.current = { analyser, active, paused };
  }, [analyser, active, paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const data = new Uint8Array(1024);

    const draw = (time: number) => {
      const { analyser: node, active: isActive, paused: isPaused } =
        stateRef.current;
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const bars = 56;
      const gap = 3;
      const barWidth = (width - gap * (bars - 1)) / bars;
      const mid = height / 2;

      let samples: number[] = [];
      if (node && isActive && !isPaused) {
        node.getByteTimeDomainData(data as Uint8Array<ArrayBuffer>);
        for (let i = 0; i < bars; i++) {
          const slice = data.slice(
            Math.floor((i / bars) * data.length),
            Math.floor(((i + 1) / bars) * data.length),
          );
          let peak = 0;
          for (const v of slice) peak = Math.max(peak, Math.abs(v - 128) / 128);
          samples.push(Math.max(0.06, peak));
        }
      } else if (node && isActive && isPaused) {
        samples = Array.from({ length: bars }, () => 0.06);
      } else {
        samples = Array.from(
          { length: bars },
          (_, i) =>
            0.08 + 0.05 * Math.abs(Math.sin(time / 900 + i * 0.55)),
        );
      }

      for (let i = 0; i < bars; i++) {
        const h = Math.max(3, samples[i] * (height - 8));
        const x = i * (barWidth + gap);
        const gradient = ctx.createLinearGradient(0, mid - h / 2, 0, mid + h / 2);
        gradient.addColorStop(0, "#22d3ee");
        gradient.addColorStop(1, "#a78bfa");
        ctx.fillStyle = isActive && !isPaused ? gradient : "rgba(148,163,184,0.45)";
        ctx.beginPath();
        ctx.roundRect(x, mid - h / 2, barWidth, h, barWidth / 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-20 w-full"
      aria-label={active ? "Live microphone waveform" : "Microphone waveform (idle)"}
    />
  );
}
