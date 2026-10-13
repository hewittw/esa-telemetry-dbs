"use client";

// Copy of the mood board's FiberField (src/app/mood-boards/intense-space/fiber-field.tsx, read-only),
// adapted for the final site: the strands are monochrome (Frost over Steel, brightness = GMM score)
// so Fiber Green is left for the primary action alone. Magenta still marks labelled-fault slices.
import { useEffect, useRef, useState } from "react";
import { FR, MONO, TRANS } from "../design-systems/intense-space/ui";

type Strand = { s: number; a: number };

export function FiberField({ strands, mission }: { strands: Strand[]; mission: 1 | 2 }) {
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
          // low scores sit back in Steel, high scores burn up to Frost: one hue, brightness = score
          const k = s ** 2.4;
          const rr = Math.round(140 + 67 * k);
          const gg = Math.round(151 + 66 * k);
          const bb = Math.round(159 + 65 * k);
          ctx.strokeStyle = `rgba(${rr},${gg},${bb},${0.1 + k * 0.85})`;
          ctx.lineWidth = s > 0.93 ? 3.2 : s > 0.8 ? 1.8 : 0.9;
        }
        ctx.stroke();
      }
    };

    // the loop only runs while the canvas is on screen; off screen it stops scheduling frames entirely
    const loop = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      if (!pausedRef.current) {
        t += dt / 1000;
        draw();
      }
      raf = visible ? requestAnimationFrame(loop) : 0;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !reduce && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
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
        aria-label={`Animated field of vertical fiber lines, one per slice of the Mission ${mission} test set. Brightness follows the GMM anomaly score; magenta lines mark labelled faults.`}
      />
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? "Play the fiber field" : "Pause the fiber field"}
        className={`${MONO} ${TRANS} absolute right-3 top-3 z-20 sm:right-6 xl:right-10 min-h-8 rounded-[3px] border border-(--is-line) bg-(--is-void)/80 px-2.5 text-[10px] uppercase tracking-[0.18em] text-(--is-frost) hover:border-(--is-frost) active:bg-(--is-charcoal) aria-pressed:border-(--is-frost) aria-pressed:bg-(--is-frost) aria-pressed:text-(--is-void) ${FR} motion-reduce:hidden`}
      >
        {paused ? "[ ▶ Play ]" : "[ ❚❚ Pause ]"}
      </button>
    </>
  );
}
