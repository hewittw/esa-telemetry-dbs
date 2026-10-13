"use client";

// The 60-second tour for the two-minute reader: five stops, one line each, 12s per stop.
// It only scrolls the page (no scroll-jacking): Esc, Exit, or any scroll of your own ends it,
// and focus goes back to whatever started it. It is a secondary control, never the green one.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { BTN, Br, FR, LABEL, MONO, TRANS } from "../design-systems/intense-space/ui";

export const STOPS = [
  { id: "top", t: "The finding", c: "Telemetry runs in 18–29 operating modes, not 4–5 subsystems. That is why global detectors fail." },
  { id: "structure-split", t: "Structure", c: "Same channels, two bundlings. BIC's K lands beside the operational groups, not the subsystems." },
  { id: "methods-ladder", t: "Methods", c: "Five families on two missions: GMM leads on Mission 1, the VAEs pass it on Mission 2." },
  { id: "evidence-threshold", t: "Threshold", c: "Pick an alarm threshold on a real PR curve and watch the false alarms pile up." },
  { id: "paper", t: "Paper", c: "Every number traces to a page. Read the paper here, or download the PDF." },
];
const DWELL = 12000;
const pad = (n: number) => String(n).padStart(2, "0");

type Tour = { on: boolean; start: () => void; stop: (refocus?: boolean) => void };
const Ctx = createContext<Tour>({ on: false, start: () => {}, stop: () => {} });
export const useTour = () => useContext(Ctx);

export function TourProvider({ children, fallbackFocus }: { children: ReactNode; fallbackFocus: () => HTMLElement | null }) {
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
    // focus returns to the launcher; if it's gone (a closed menu), to a sensible fallback
    window.setTimeout(() => {
      if (o && o.isConnected && o.offsetParent !== null) o.focus({ preventScroll: true });
      else fallbackFocus()?.focus({ preventScroll: true });
    }, 0);
  }, [fallbackFocus]);

  const start = useCallback(() => {
    opener.current = document.activeElement as HTMLElement;
    setStep(0);
  }, []);

  // fly to the stop
  useEffect(() => {
    if (step === null) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = document.getElementById(STOPS[step].id);
    programmatic.current = performance.now() + (reduce ? 200 : 1400);
    if (STOPS[step].id === "top") window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    else el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    el?.setAttribute("data-tour-on", "true");
    const t = window.setTimeout(() => (step >= STOPS.length - 1 ? stop() : setStep(step + 1)), DWELL);
    return () => {
      clearTimeout(t);
      el?.removeAttribute("data-tour-on");
    };
  }, [step, stop]);

  // focus the tour bar on start so keyboard users can step through it
  useEffect(() => {
    if (on) bar.current?.querySelector<HTMLElement>("[data-tour-next]")?.focus({ preventScroll: true });
  }, [on]);

  // exit on Esc, or on any scroll the tour didn't start
  useEffect(() => {
    if (!on) return;
    const onScroll = () => {
      if (performance.now() > programmatic.current) stop();
    };
    // scrollend lets the flight finish early; the time window covers browsers without it
    const onEnd = () => {
      if (performance.now() <= programmatic.current) programmatic.current = performance.now() + 80;
    };
    const user = () => stop();
    // a dialog (the reader, a method card) opening takes over focus and ends the tour
    const modal = () => stop(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return e.preventDefault(), stop();
      const inBar = bar.current?.contains(e.target as Node);
      if (!inBar && ["PageDown", "PageUp", "ArrowDown", "ArrowUp", " ", "Home", "End"].includes(e.key)) stop();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", onEnd);
    window.addEventListener("wheel", user, { passive: true });
    window.addEventListener("touchmove", user, { passive: true });
    document.addEventListener("keydown", onKey);
    window.addEventListener("isx-modal", modal);
    return () => {
      window.removeEventListener("isx-modal", modal);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", onEnd);
      window.removeEventListener("wheel", user);
      window.removeEventListener("touchmove", user);
      document.removeEventListener("keydown", onKey);
    };
  }, [on, stop]);

  return (
    <Ctx.Provider value={{ on, start, stop }}>
      {children}
      {step !== null ? (
        <div ref={bar} role="region" aria-label="Guided tour" className="isd-dialog fixed inset-x-2 bottom-2 z-[70] sm:inset-x-auto sm:bottom-5 sm:left-1/2 sm:w-[min(640px,calc(100vw-48px))] sm:-translate-x-1/2">
          <div className="is-corners isx-fill relative overflow-hidden rounded-[3px] border border-(--is-frost) px-4 pb-4 pt-3 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <p className={`${LABEL} text-(--is-steel)`}>
                [ Tour <span className="text-(--is-frost)">{pad(step + 1)}</span> / {pad(STOPS.length)} · {STOPS[step].t} ]
              </p>
              <p className={`${LABEL} text-(--is-steel) max-sm:hidden`}>Esc or scroll to exit</p>
            </div>
            <p className="mt-2 text-[16px] leading-[1.45] text-(--is-frost)" aria-live="polite">
              {STOPS[step].c}
            </p>
            <div className="mt-3 grid grid-cols-5 gap-1" aria-hidden>
              {STOPS.map((s, i) => (
                <span key={s.id} className="relative h-[2px] overflow-hidden bg-(--is-line)">
                  <span
                    key={i === step ? `run-${step}` : "idle"}
                    className={`absolute inset-0 origin-left bg-(--is-frost) ${i === step ? "isx-tourbar" : ""}`}
                    style={{ transform: i < step ? "scaleX(1)" : i > step ? "scaleX(0)" : undefined, animationDuration: `${DWELL}ms` }}
                  />
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))} className={`group ${BTN.ghost}`}>
                ← Back
              </button>
              <button type="button" data-tour-next onClick={() => (step >= STOPS.length - 1 ? stop() : setStep(step + 1))} className={`group ${BTN.secondary}`}>
                <Br>{step >= STOPS.length - 1 ? "Finish" : "Next stop →"}</Br>
              </button>
              <button type="button" onClick={() => stop()} className={`${MONO} ${TRANS} ml-auto inline-flex min-h-10 items-center gap-2 rounded-[3px] px-2 text-[11px] uppercase tracking-[0.14em] text-(--is-steel) hover:text-(--is-frost) active:bg-(--is-charcoal) ${FR}`}>
                <span aria-hidden>✕</span> Exit tour
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Ctx.Provider>
  );
}

/* the launcher: a secondary, bracketed control (never green) */
export function TourButton({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const { on, start, stop } = useTour();
  return (
    <button type="button" aria-pressed={on} onClick={() => (on ? stop() : start())} className={`group ${BTN.secondary} ${className}`}>
      <Br>
        <span aria-hidden>{on ? "❚❚" : "▶"}</span> {compact ? (
          <>
            <span className="xl:hidden">Tour · 60 s</span>
            <span className="max-xl:hidden">60-second tour</span>
          </>
        ) : (
          "60-second tour"
        )}
      </Br>
    </button>
  );
}
