"use client";

// The 60-second tour for a two-minute reader: six stops, one line each, 10 s per stop.
// It only scrolls the page (no scroll-jacking): Esc, Exit, or any scroll of your own ends it,
// and focus returns to whatever started it. A secondary control: never vermilion.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { FOCUS, IconCross, MONO, SANS, SERIF, btnQuiet, btnSecondary } from "../../design-systems/refined-paper/kit";

export const STOPS = [
  { id: "top", t: "The finding", c: "Telemetry’s structure sits at 18–29 operational groups, not 4–5 subsystems." },
  { id: "background", t: "Background", c: "Each subsystem divides into finer operational groups. Which level does the data follow?" },
  { id: "methods", t: "What we did", c: "Five methods, each richer than the last, all scored by PR-AUC." },
  { id: "results", t: "Results", c: "BIC picks K = 21 and 29: beside the groups, far from the subsystems." },
  { id: "conclusions", t: "Conclusions", c: "Each mode has its own normal. That is why global detectors fail." },
  { id: "paper", t: "The paper", c: "Every number traces to a page. Read it here, or download the PDF." },
];
const DWELL = 10000;

type Tour = { on: boolean; start: () => void; stop: (refocus?: boolean) => void };
const Ctx = createContext<Tour>({ on: false, start: () => {}, stop: () => {} });
export const useTour = () => useContext(Ctx);

export function TourProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const programmatic = useRef(0);
  const bar = useRef<HTMLDivElement>(null);
  const on = step !== null;

  const stop = useCallback((refocus = true) => {
    setStep(null);
    const o = opener.current;
    opener.current = null;
    if (!refocus) return;
    setTimeout(() => {
      if (o && o.isConnected && o.offsetParent !== null) o.focus({ preventScroll: true });
      else document.getElementById("rps-h1")?.focus({ preventScroll: true });
    }, 0);
  }, []);
  const start = useCallback(() => { opener.current = document.activeElement as HTMLElement; setStep(0); }, []);

  useEffect(() => {
    if (step === null) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = document.getElementById(STOPS[step].id);
    programmatic.current = performance.now() + (reduce ? 200 : 1400);
    if (STOPS[step].id === "top") scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    else el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    el?.setAttribute("data-tour-on", "true");
    const t = setTimeout(() => (step >= STOPS.length - 1 ? stop() : setStep(step + 1)), DWELL);
    return () => { clearTimeout(t); el?.removeAttribute("data-tour-on"); };
  }, [step, stop]);

  useEffect(() => { if (on) bar.current?.querySelector<HTMLElement>("[data-tour-next]")?.focus({ preventScroll: true }); }, [on]);

  useEffect(() => {
    if (!on) return;
    const onScroll = () => { if (performance.now() > programmatic.current) stop(); };
    const onEnd = () => { if (performance.now() <= programmatic.current) programmatic.current = performance.now() + 80; };
    const user = () => stop();
    const modal = () => stop(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); stop(); return; }
      if (!bar.current?.contains(e.target as Node) && ["PageDown", "PageUp", "ArrowDown", "ArrowUp", " ", "Home", "End"].includes(e.key)) stop();
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("scrollend", onEnd);
    addEventListener("wheel", user, { passive: true });
    addEventListener("touchmove", user, { passive: true });
    addEventListener("rps-modal", modal);
    document.addEventListener("keydown", onKey);
    return () => {
      removeEventListener("scroll", onScroll); removeEventListener("scrollend", onEnd); removeEventListener("wheel", user);
      removeEventListener("touchmove", user); removeEventListener("rps-modal", modal); document.removeEventListener("keydown", onKey);
    };
  }, [on, stop]);

  return (
    <Ctx.Provider value={{ on, start, stop }}>
      {children}
      {step !== null && (
        <div ref={bar} role="region" aria-label="Guided tour" className="rpd-rise fixed inset-x-3 bottom-3 z-[70] sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:w-[min(560px,calc(100vw-48px))] sm:-translate-x-1/2">
          <div className="rounded-[3px] border border-[var(--ink)] bg-[var(--mount)] px-5 pt-3 pb-3 shadow-[var(--lift)]">
            <div className="flex items-center justify-between gap-3">
              <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>Tour <span className="text-[var(--ink)]">{step + 1}</span> / {STOPS.length} · {STOPS[step].t}</p>
              <button type="button" onClick={() => stop()} aria-label="Exit the tour (Esc)" className={`${SANS} ${FOCUS} -mr-2 grid size-9 place-items-center rounded-[3px] text-[var(--ink)] transition-colors duration-200 hover:bg-[var(--parchment)] active:bg-[var(--rule)]`}><IconCross size={12} /></button>
            </div>
            <p className={`${SERIF} mt-1 text-[18px] leading-[1.45]`} aria-live="polite">{STOPS[step].c}</p>
            <div className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${STOPS.length}, 1fr)` }} aria-hidden>
              {STOPS.map((s, i) => (
                <span key={s.id} className="relative h-[2px] overflow-hidden bg-[var(--rule)]">
                  <span key={i === step ? `run-${step}` : "idle"} className={`absolute inset-0 origin-left bg-[var(--ink)] ${i === step ? "rps-tourbar" : ""}`} style={{ transform: i < step ? "scaleX(1)" : i > step ? "scaleX(0)" : undefined, animationDuration: `${DWELL}ms` }} />
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button type="button" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))} className={`${btnQuiet} min-h-9`}>← Back</button>
              <button type="button" data-tour-next onClick={() => (step >= STOPS.length - 1 ? stop() : setStep(step + 1))} className={`${btnSecondary} min-h-9`}>{step >= STOPS.length - 1 ? "Finish" : "Next →"}</button>
              <span className={`${SANS} ml-auto text-[12px] text-[var(--muted)] max-sm:hidden`}>Esc or scroll to exit</span>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function TourButton({ className = "" }: { className?: string }) {
  const { on, start, stop } = useTour();
  return (
    <button type="button" aria-pressed={on} onClick={() => (on ? stop() : start())} className={`${btnSecondary} ${className}`}>
      <svg aria-hidden width="10" height="10" viewBox="0 0 10 10"><path d={on ? "M2 1.5h2v7H2zM6 1.5h2v7H6z" : "M2 1.2 8.6 5 2 8.8z"} fill="currentColor" /></svg>
      60-second tour
    </button>
  );
}
