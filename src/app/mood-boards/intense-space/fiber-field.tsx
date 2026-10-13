"use client";

import { useEffect, useRef, useState } from "react";

type Strand = { s: number; a: number };

// One vertical fiber per slice of the Mission 1 test set. Brightness and width follow
// the GMM anomaly score; slices that hold labelled faults burn magenta. The field
// shears sideways like Rapid Tow Shearing, harder where the score is high.
export function FiberField({ strands }: { strands: Strand[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    let t = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const n = strands.length;
      const gap = w / n;
      const rows = 28;
      for (let i = 0; i < n; i++) {
        const { s, a } = strands[i];
        const fault = a > 0.6;
                const x0 = i * gap + gap / 2;
        if (!fault && s < 0.45 && i % 2) continue;
        const amp = (fault ? 12 : 1.5 + s * 9) * (reduce ? 0.4 : 1);
        ctx.beginPath();
        for (let r = 0; r <= rows; r++) {
          const y = (r / rows) * h;
          const phase = t * (0.35 + s * 0.6) + y * 0.006 + i * 0.07;
          const x = x0 + Math.sin(phase) * amp * (0.35 + 0.65 * (y / h));
          if (r === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        if (fault) {
          ctx.strokeStyle = `rgba(224,79,214,${0.45 + 0.5 * a})`;
          ctx.lineWidth = a > 0.95 ? 1.8 : 1;
        } else {
          ctx.strokeStyle = `rgba(55,253,8,${0.1 + s ** 2.4 * 0.9})`;
          ctx.lineWidth = s > 0.93 ? 3.2 : s > 0.8 ? 1.8 : 0.9;
        }
        ctx.stroke();
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      if (!pausedRef.current && visible) {
        t += dt / 1000;
        draw();
      }
      raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    resize();
    if (!reduce) raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [strands]);

  return (
    <>
      <canvas
        ref={ref}
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label="Animated field of vertical fiber lines, one per slice of the Mission 1 test set; green brightness follows the GMM anomaly score and magenta lines mark labelled faults."
      />
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        className="font-(family-name:--font-is-mono) absolute right-3 top-3 z-20 rounded-[3px] border border-(--is-line) bg-(--is-void)/80 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-(--is-frost) transition-colors duration-200 hover:border-(--is-frost) active:bg-(--is-charcoal) aria-pressed:text-(--is-fiber) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--is-frost) motion-reduce:hidden"
      >
        {paused ? "[ ▶ Play ]" : "[ ❚❚ Pause ]"}
      </button>
    </>
  );
}
