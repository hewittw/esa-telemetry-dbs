"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BTN_BASE, FR, LABEL, MONO, TRANS } from "./ui";

export const INDEX = [
  ["s-color", "01", "Color"],
  ["s-type", "02", "Type"],
  ["s-space", "03", "Space & shape"],
  ["s-components", "04", "Components"],
  ["s-states", "05", "Control states"],
  ["s-ui", "06", "UI states"],
  ["s-parts", "P", "Parts"],
  ["s-novel", "N", "Novel"],
  ["s-telemetry", "T", "Telemetry"],
] as const;

// Helion's nav: mono items in one hairline capsule, the main button split off to its right.
export function Header() {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    sheet.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") (setOpen(false), btn.current?.focus());
      if (e.key === "Tab" && sheet.current) {
        const f = [...sheet.current.querySelectorAll<HTMLElement>("a,button")];
        const all = [btn.current!, ...f];
        const i = all.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) (e.preventDefault(), all[all.length - 1].focus());
        else if (!e.shiftKey && i === all.length - 1) (e.preventDefault(), all[0].focus());
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const link = `${MONO} ${TRANS} inline-flex min-h-9 items-center rounded-[2px] px-2.5 text-[11px] uppercase tracking-[0.14em] ${FR}`;
  return (
    <header className="sticky top-0 z-50 border-b border-(--is-line) bg-(--is-void)/88 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-[1920px] items-center gap-3 px-3 sm:px-6 xl:px-10">
        <Link href="/" className={`${link} -ml-2.5 text-(--is-frost) hover:text-white active:opacity-70`}>
          ← Hub
        </Link>
        <nav aria-label="Design system" className="mx-auto hidden items-center rounded-[3px] border border-(--is-line) p-0.5 md:flex">
          <span className={`${LABEL} px-2.5 text-(--is-steel)`}>Intense space</span>
          <span aria-hidden className="h-4 w-px bg-(--is-line)" />
          {INDEX.slice(3, 4).concat(INDEX.slice(7)).map(([id, , t]) => (
            <a key={id} href={`#${id}`} className={`${link} text-(--is-frost) hover:bg-(--is-panel) active:bg-(--is-charcoal)`}>
              {t}
            </a>
          ))}
        </nav>
        <Link href="/mood-boards/intense-space" className={`${BTN_BASE} ml-auto min-h-9 bg-(--is-frost) px-3 text-(--is-void) hover:bg-white active:translate-y-px md:ml-0 md:px-3.5`}>
          Mood board →
        </Link>
        <button
          ref={btn}
          type="button"
          aria-expanded={open}
          aria-controls="isd-sheet"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
          className={`${MONO} ${TRANS} -mr-1 inline-flex size-10 items-center justify-center rounded-[2px] text-[18px] text-(--is-frost) hover:bg-(--is-panel) active:bg-(--is-charcoal) aria-expanded:bg-(--is-panel) md:hidden ${FR}`}
        >
          {open ? "✕" : "≡"}
        </button>
      </div>
      {open ? (
        <div ref={sheet} id="isd-sheet" className="isd-pop absolute inset-x-0 top-12 max-h-[calc(100dvh-48px)] overflow-auto border-b border-(--is-line) bg-(--is-void) px-3 pb-5 pt-2 md:hidden">
          <nav aria-label="Sections">
            <ol>
              {INDEX.map(([id, n, t]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-12 items-baseline gap-4 rounded-[2px] border-b border-(--is-line) px-1 text-[20px] font-semibold tracking-[-0.02em] text-(--is-frost) ${TRANS} hover:pl-2 active:opacity-70 ${FR}`}
                  >
                    <span className={`${MONO} w-6 text-[11px] text-(--is-steel)`}>{n}</span>
                    {t}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

// Sticky section index with scroll-spy. Horizontal strip; scrolls itself so the current item stays visible.
export function SectionIndex() {
  const [cur, setCur] = useState<string>(INDEX[0][0]);
  const strip = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const els = INDEX.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = 140;
      let best = els[0]?.id;
      for (const el of els) if (el.getBoundingClientRect().top - y <= 0) best = el.id;
      setCur(best);
    };
    const on = () => !raf && (raf = requestAnimationFrame(update));
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);
  useEffect(() => {
    const s = strip.current;
    const a = s?.querySelector<HTMLElement>(`[data-id="${cur}"]`);
    if (s && a) {
      const l = a.offsetLeft - s.clientWidth / 2 + a.clientWidth / 2;
      s.scrollTo({ left: l, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }, [cur]);
  return (
    <nav aria-label="Section index" className="sticky top-12 z-40 border-b border-(--is-line) bg-(--is-void)/88 backdrop-blur-md">
      <ol ref={strip} className="isd-noscroll mx-auto flex h-11 max-w-[1920px] items-stretch gap-1 overflow-x-auto px-2 sm:px-4 xl:justify-between xl:px-8">
        {INDEX.map(([id, n, t]) => (
          <li key={id} className="flex shrink-0">
            <a
              href={`#${id}`}
              data-id={id}
              aria-current={cur === id ? "location" : undefined}
              className={`${MONO} ${TRANS} relative flex items-center gap-2 rounded-[2px] px-2.5 text-[11px] uppercase tracking-[0.12em] text-(--is-steel) hover:text-(--is-frost) active:opacity-70 aria-[current]:text-(--is-frost) ${FR} focus-visible:outline-offset-[-2px]`}
            >
              <span aria-hidden>
                {n}
              </span>
              {t}
              <span aria-hidden className={`absolute inset-x-2.5 bottom-0 h-px ${cur === id ? "bg-(--is-frost)" : "bg-transparent"}`} />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Section 3 motion specimen: the one UI curve and the three durations, replayable.
export function MotionDemo() {
  const [n, setN] = useState(0);
  const rows = [
    ["200ms", "Hover, press, toggle", 200],
    ["300ms", "Reveals, accordion, toast", 300],
    ["1600ms", "SVG trace draw-in", 1600],
  ] as const;
  return (
    <div className="flex flex-col gap-4">
      <svg viewBox="0 0 120 60" className="h-24 w-full max-w-[260px]" role="img" aria-label="Easing curve cubic-bezier(0.2, 0.7, 0.1, 1): fast out, long settle">
        <path d="M0 60 L120 60 M0 60 L0 0" stroke="#2E3135" fill="none" />
        <path d="M0 60 C24 18 12 0 120 0" stroke="#CFD9E0" strokeWidth="1.5" fill="none" />
      </svg>
      <ul className="flex flex-col gap-3">
        {rows.map(([t, u, ms]) => (
          <li key={t} className="flex flex-col gap-1.5">
            <span className={`${MONO} text-[11px] text-(--is-frost)`}>
              {t} <span className="text-(--is-steel)">· {u}</span>
            </span>
            <span className="relative h-5 overflow-hidden rounded-[2px] border border-(--is-line)">
              <span
                key={n}
                aria-hidden
                className="absolute inset-y-[3px] left-1 w-3 bg-(--is-frost)"
                style={{ animation: n ? `isd-slide ${ms}ms cubic-bezier(0.2,0.7,0.1,1) forwards` : undefined }}
              />
            </span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setN((x) => x + 1)} className={`${MONO} ${TRANS} group inline-flex min-h-10 w-fit items-center rounded-[3px] border border-(--is-line) px-4 text-[11px] uppercase tracking-[0.14em] text-(--is-frost) hover:border-(--is-frost) active:translate-y-px active:bg-(--is-charcoal) ${FR}`}>
        [ ▶ Play motion ]
      </button>
    </div>
  );
}
