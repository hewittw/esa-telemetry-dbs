"use client";

// Motion for the final site. Figures draw in ONCE as they enter the viewport (lines wipe in,
// bars grow, numerals count up), 400–900ms, ease-out. Anything already on screen when the page
// loads is never animated, so nobody who just arrived sees a half-drawn figure; and under
// prefers-reduced-motion everything renders in its final state immediately.
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

export type RevealState = "static" | "armed" | "in";
export const RevealCtx = createContext<RevealState>("static");

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [st, setSt] = useState<RevealState>("static");
  useIso(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    // on screen at load: leave it drawn
    if (r.top < window.innerHeight && r.bottom > 0) return;
    setSt("armed");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSt("in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, st] as const;
}

/* a numeral that counts up once when its figure draws in; screen readers only ever get the final value */
export function CountUp({ value, digits = 0, pad = 0, ms = 800 }: { value: number; digits?: number; pad?: number; ms?: number }) {
  const st = useContext(RevealCtx);
  const [shown, setShown] = useState<number | null>(null);
  const done = useRef(false);
  const target = useRef(value);
  useEffect(() => {
    target.current = value;
  }, [value]);
  useEffect(() => {
    if (st === "armed" && !done.current) setShown(0);
    if (st !== "in" || done.current) return;
    done.current = true;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const e = 1 - (1 - p) ** 3;
      if (p < 1) {
        setShown(target.current * e);
        raf = requestAnimationFrame(tick);
      } else setShown(null);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [st, ms]);
  const f = (v: number) => {
    const s = v.toFixed(digits);
    return pad ? s.padStart(pad, "0") : s;
  };
  return (
    <>
      <span aria-hidden>{f(shown ?? value)}</span>
      <span className="sr-only">{f(value)}</span>
    </>
  );
}

/* Copy of the board's WordReveal (read-only), with colour keys: words listed in `keys` render
   Teal, the same Teal as the group-level marks in the figures, so prose and plots share one key. */
export function KeyedReveal({ lead, text, keys = [] }: { lead?: string; text: string; keys?: string[] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(" ");
  const keyed = new Set<number>();
  keys.forEach((k) => {
    const kw = k.split(" ");
    for (let i = 0; i + kw.length <= words.length; i++) {
      if (kw.every((w, j) => words[i + j].replace(/[.,:;]$/, "") === w)) kw.forEach((_, j) => keyed.add(i + j));
    }
  });
  const [lit, setLit] = useState(words.length);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let best = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (vh * 0.35)));
      best = Math.max(best, Math.round(p * words.length));
      setLit(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [words.length]);
  return (
    <p ref={ref} className="text-[clamp(22px,2.3vw,34px)] font-medium leading-[1.08] tracking-[-0.02em]" aria-label={lead ? `${lead} ${text}` : text}>
      {lead ? <span aria-hidden className="text-(--is-steel)">{lead} </span> : null}
      {words.map((w, i) => (
        <span key={i} aria-hidden className="transition-[opacity] duration-300 ease-out" style={{ color: keyed.has(i) ? "var(--is-teal)" : "var(--is-frost)", opacity: i < lit ? 1 : 0.42 }}>
          {w}{" "}
        </span>
      ))}
    </p>
  );
}

export function Keyed({ children, kind = "group" }: { children: ReactNode; kind?: "group" | "sub" }) {
  return <span className={kind === "group" ? "text-(--is-teal)" : "text-(--is-steel)"}>{children}</span>;
}
