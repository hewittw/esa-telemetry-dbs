"use client";

// Figure primitives shared by every chart: an SVG that keeps its labels at a true pixel size,
// an in-view flag for the one-time line draw, and a reduced-motion check.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode, type SVGProps } from "react";

/** SVG whose <text> renders at a fixed CSS size: sets --rpd-k = viewBox width / rendered width. */
export const Svg = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement> & { vw: number; vh: number }>(function Svg({ vw, vh, children, className = "", ...rest }, outer) {
  const ref = useRef<SVGSVGElement>(null);
  useImperativeHandle(outer, () => ref.current as SVGSVGElement);
  useEffect(() => {
    const s = ref.current;
    if (!s) return;
    // With preserveAspectRatio "meet" the drawing scales by the tighter of the two axes.
    const set = () => {
      const { width: w, height: h } = s.getBoundingClientRect();
      if (!w) return;
      const meet = s.getAttribute("preserveAspectRatio") !== "none";
      s.style.setProperty("--rpd-k", String(meet && h ? Math.max(vw / w, vh / h) : vw / w));
    };
    set();
    const ro = new ResizeObserver(set);
    ro.observe(s);
    return () => ro.disconnect();
  }, [vw, vh]);
  return (
    <svg ref={ref} viewBox={`0 0 ${vw} ${vh}`} className={`block w-full overflow-visible ${className}`} {...rest}>
      {children}
    </svg>
  );
});

/** True once the element has scrolled into view (or immediately if it already is on load). */
export function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (setSeen(true), io.disconnect())), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

export function InView({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.2);
  return (
    <div ref={ref} data-inview={seen ? "true" : "false"} className={className}>
      {children}
    </div>
  );
}

export function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const on = () => setR(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return r;
}

export const path = (pts: [number, number][], x: (v: number) => number, y: (v: number) => number) =>
  pts.map((p, i) => `${i ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join("");

export const fmt = (v: number, d = 3) => v.toFixed(d);
export const pct = (v: number, d = 1) => `${(v * 100).toFixed(d)}%`;
export const big = (v: number) => v.toLocaleString("en-US");
