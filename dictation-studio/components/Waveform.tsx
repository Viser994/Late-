"use client";

import { useEffect, useRef } from "react";

interface WaveformProps {
  analyser: AnalyserNode | null;
  active: boolean;
}

export function Waveform({ analyser, active }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { clientWidth, clientHeight } = canvas;
      canvas.width = clientWidth * dpr;
      canvas.height = clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const bars = 64;
    const history = new Array<number>(bars).fill(0);
    const data = analyser ? new Uint8Array(analyser.fftSize) : null;
    let raf = 0;
    let lastPush = 0;

    const draw = (now: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      if (analyser && data && active && now - lastPush > 45) {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i] - 128) / 128);
        history.push(Math.min(1, peak * 1.6));
        history.shift();
        lastPush = now;
      }

      const gap = 3;
      const barW = Math.max(2, (w - gap * (bars - 1)) / bars);
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, "#6366f1");
      gradient.addColorStop(1, "#c084fc");

      for (let i = 0; i < bars; i++) {
        const level = history[i];
        const barH = Math.max(3, level * h * 0.92);
        const x = i * (barW + gap);
        const y = (h - barH) / 2;
        ctx.fillStyle = level > 0.02 ? gradient : "rgba(113,113,122,0.45)";
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, barW / 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [analyser, active]);

  return <canvas ref={canvasRef} className="h-24 w-full" aria-label="Live audio waveform" role="img" />;
}
