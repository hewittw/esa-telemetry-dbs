"use client";

// The glossary: one compact list (in §03), and a <Term> for each term's first use. A term is a dotted-underlined
// button; it opens a small lifted note under the word (Esc, outside tap or scroll closes it, focus returns),
// and the note links to the full list. Ink only: no vermilion.
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { FOCUS, IconCross, SANS, SERIF, link } from "../../design-systems/refined-paper/kit";

export const GLOSSARY = {
  channel: ["Channel", "One sensor’s stream of readings over time, such as a voltage or a temperature."],
  subsystem: ["Subsystem", "A physical part of the spacecraft, such as power management or attitude control. Mission 1 has 4; Mission 2 has 5."],
  group: ["Operational group", "ESA’s finer division of a subsystem, such as battery charging. Mission 1 has 18; Mission 2 has 29."],
  mode: ["Mode", "A distinct operating state the telemetry settles into, such as an eclipse or routine orbit. What counts as normal depends on the mode."],
  anomaly: ["Anomaly", "A timestep an ESA engineer marked as a genuine system fault or a rare operational event."],
  prauc: ["PR-AUC", "Area under the precision–recall curve (average precision). 1 is perfect; random guessing scores the share of anomalous timesteps. Preferred here because anomalies are rare."],
  kmeans: ["K-Means", "Splits the data into K clusters around centres. Distance to the nearest centre is the anomaly score."],
  pca: ["PCA", "Principal component analysis: finds the few directions that carry most of the variation. Poor reconstruction is the anomaly score."],
  kpca: ["KPCA", "Kernel PCA: PCA after a non-linear (RBF kernel) map, so it can follow curved structure. Nyström is a fast approximation of it."],
  gmm: ["GMM", "Gaussian mixture model: the data as K overlapping ellipsoidal clusters. A timestep the mixture finds unlikely scores high."],
  bic: ["BIC", "Bayesian information criterion: how well a model fits, with a penalty for every extra component. The lowest BIC picks K."],
  vae: ["VAE", "Variational autoencoder: a neural network that squeezes a window of telemetry into a small code and rebuilds it. Trained on normal windows only."],
} as const;
export type TermKey = keyof typeof GLOSSARY;

/** A glossed word. Opens its definition in place; the note links to the full list. */
export function Term({ k, children }: { k: TermKey; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number; up: boolean } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const note = useRef<HTMLSpanElement>(null);
  const id = useId();
  const [t, d] = GLOSSARY[k];
  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect(), w = Math.min(288, innerWidth - 24);
    const up = r.bottom + 190 > innerHeight && r.top > 200;
    setPos({ x: Math.min(Math.max(12, r.left - 8), innerWidth - w - 12), y: up ? innerHeight - r.top + 6 : r.bottom + 6, up });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const down = (e: PointerEvent) => { if (!note.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) close(); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); close(); btn.current?.focus(); } };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    addEventListener("scroll", close, { passive: true });
    addEventListener("resize", close);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); removeEventListener("scroll", close); removeEventListener("resize", close); };
  }, [open]);
  return (
    <>
      <button ref={btn} type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}
        className={`${FOCUS} -mx-0.5 inline rounded-[2px] px-0.5 text-inherit underline decoration-[var(--graphite)] decoration-dotted decoration-[1.5px] underline-offset-[0.22em] transition-colors duration-200 hover:bg-[var(--parchment)] hover:decoration-[var(--ink)] active:bg-[var(--rule)] aria-expanded:bg-[var(--parchment)] aria-expanded:decoration-solid aria-expanded:decoration-[var(--ink)]`}
        style={{ font: "inherit", color: "inherit" }}>
        {children ?? t}<span className="sr-only"> (definition)</span>
      </button>
      {open && pos && (
        <span ref={note} id={id} role="note" aria-label={`${t}, defined`}
          className="rpd-rise fixed z-[60] block w-[min(18rem,calc(100vw-24px))] rounded-[3px] border border-[var(--ink)] bg-[var(--mount)] px-4 pt-3 pb-3 text-left shadow-[var(--lift)]"
          style={{ left: pos.x, ...(pos.up ? { bottom: pos.y } : { top: pos.y }) }}>
          <span className="flex items-start justify-between gap-3">
            <span className={`${SANS} block text-[13px] font-semibold text-[var(--ink)]`}>{t}</span>
            <button type="button" aria-label={`Close ${t}`} onClick={() => { setOpen(false); btn.current?.focus(); }} className={`${FOCUS} -mt-1 -mr-2 grid size-7 shrink-0 place-items-center rounded-[3px] text-[var(--ink)] transition-colors duration-200 hover:bg-[var(--parchment)] active:bg-[var(--rule)]`}><IconCross size={10} /></button>
          </span>
          <span className={`${SANS} mt-1 block text-[13.5px] leading-[1.5] font-normal tracking-normal text-[var(--ink-soft)] normal-case`}>{d}</span>
          <a href="#glossary" onClick={() => setOpen(false)} className={`${SANS} ${link} mt-2 inline-block text-[12px] font-medium`}>Every term, in one list →</a>
        </span>
      )}
    </>
  );
}

/** The compact list: every term, one line each. */
export function Glossary() {
  return (
    <dl className="grid gap-x-10 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
      {(Object.keys(GLOSSARY) as TermKey[]).map((k) => (
        <div key={k} id={`gl-${k}`} className="border-t border-[var(--rule)] py-3">
          <dt className={`${SERIF} text-[18px] leading-[1.25] font-[450]`}>{GLOSSARY[k][0]}</dt>
          <dd className={`${SANS} mt-1 text-[13.5px] leading-[1.5] text-[var(--ink-soft)]`}>{GLOSSARY[k][1]}</dd>
        </div>
      ))}
    </dl>
  );
}
