"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/* Shared control styling: hairline ink, paper fill, a visible focus ring. */
const ring =
  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]";

/** Marks itself data-inview once it scrolls into view, so CSS can draw lines in. */
export function InView({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (setSeen(true), io.disconnect())),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} data-inview={seen ? "true" : "false"} className={`rp-draw ${className}`}>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- BIC step player */

type Bic = { sweep: { k: number; bic: number }[]; selectedK: number; reference: { subsystems: number; groups: number } };

export function BicStepPlayer({ sweep, selectedK, reference }: Bic) {
  const [i, setI] = useState(sweep.length - 1);
  const [playing, setPlaying] = useState(false);
  const W = 560, H = 250, L = 44, R = 16, T = 22, B = 34;
  const ks = sweep.map((s) => s.k);
  const bics = sweep.map((s) => s.bic);
  const x = (k: number) => L + ((k - ks[0]) / (ks[ks.length - 1] - ks[0])) * (W - L - R);
  const lo = Math.min(...bics), hi = Math.max(...bics);
  const y = (b: number) => T + (1 - (b - lo) / (hi - lo)) * (H - T - B);
  const minIdx = sweep.findIndex((s) => s.k === selectedK);
  const d = (n: number) => sweep.slice(0, n + 1).map((s, j) => `${j ? "L" : "M"}${x(s.k).toFixed(1)},${y(s.bic).toFixed(1)}`).join("");

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setI((v) => {
        if (v >= sweep.length - 1) {
          setPlaying(false);
          return v;
        }
        return v + 1;
      });
    }, 380);
    return () => clearInterval(t);
  }, [playing, sweep.length]);

  const cur = sweep[i];
  const toggle = () => {
    if (!playing && i >= sweep.length - 1) setI(0);
    setPlaying((p) => !p);
  };
  const btn = `grid size-9 place-items-center rounded-full border border-[var(--rule-strong)] bg-[var(--paper)] text-[var(--ink)] transition-colors duration-200 hover:bg-[var(--parchment)] active:bg-[var(--rule)] disabled:cursor-not-allowed disabled:opacity-40 ${ring}`;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`BIC against number of GMM components K for Mission 1. Current step K = ${cur.k}, BIC ${cur.bic.toFixed(2)} million. Minimum at K = ${selectedK}.`}>
        {[reference.subsystems, reference.groups].map((k, j) => (
          <g key={k}>
            <line x1={x(k)} x2={x(k)} y1={T - 6} y2={H - B} stroke="var(--rule-strong)" strokeDasharray="2 3" />
            <text x={x(k) + 4} y={T + 2} className="rp-mono" fontSize="12" fill="var(--muted)">{k} {j ? "groups" : "subsystems"}</text>
          </g>
        ))}
        <path d={d(sweep.length - 1)} fill="none" stroke="var(--rule)" strokeWidth="1.25" />
        <path d={d(i)} fill="none" stroke="var(--prussian)" strokeWidth="1.75" strokeLinejoin="round" />
        {sweep.slice(0, i + 1).map((s) => (
          <circle key={s.k} cx={x(s.k)} cy={y(s.bic)} r="1.8" fill="var(--prussian)" />
        ))}
        {i >= minIdx && (
          <g className="rp-fade">
            <circle cx={x(selectedK)} cy={y(sweep[minIdx].bic)} r="6.5" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
            <text x={x(selectedK)} y={H - B - 26} textAnchor="middle" fontSize="12" className="rp-mono" fill="var(--accent-ink)">min</text>
          </g>
        )}
        <circle cx={x(cur.k)} cy={y(cur.bic)} r="4" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
        <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="var(--ink)" strokeWidth="0.75" />
        {[2, 5, 10, 15, 20, 25, 30].map((k) => (
          <text key={k} x={x(k)} y={H - B + 16} textAnchor="middle" fontSize="12" className="rp-mono" fill="var(--muted)">{k}</text>
        ))}
        <text x={W - R} y={H - 4} textAnchor="end" fontSize="12" className="rp-mono" fill="var(--muted)">components K</text>
        <text x={L - 8} y={y(hi) + 4} textAnchor="end" fontSize="12" className="rp-mono" fill="var(--muted)">{hi.toFixed(0)}M</text>
        <text x={L - 8} y={y(lo) + 4} textAnchor="end" fontSize="12" className="rp-mono" fill="var(--muted)">{lo.toFixed(1)}M</text>
      </svg>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={toggle} aria-label={playing ? "Pause sweep" : "Play sweep"} aria-pressed={playing} className={`grid size-10 place-items-center rounded-full bg-[var(--ink)] text-[var(--paper)] transition-colors duration-200 hover:bg-[#45403a] active:bg-black aria-pressed:bg-[var(--oxblood)] ${ring}`}>
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><rect x="2" y="1" width="3" height="10" fill="currentColor" /><rect x="7" y="1" width="3" height="10" fill="currentColor" /></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M3 1.5v9l7.5-4.5z" fill="currentColor" /></svg>
          )}
        </button>
        <button type="button" className={btn} aria-label="Previous K" disabled={i === 0} onClick={() => (setPlaying(false), setI((v) => Math.max(0, v - 1)))}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M8 2 4 6l4 4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </button>
        <button type="button" className={btn} aria-label="Next K" disabled={i === sweep.length - 1} onClick={() => (setPlaying(false), setI((v) => Math.min(sweep.length - 1, v + 1)))}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="m4 2 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
        </button>
        <label className="order-last flex w-full min-w-0 items-center pt-1 sm:order-none sm:ml-1 sm:w-auto sm:flex-1 sm:pt-0">
          <span className="sr-only">Scrub K</span>
          <input type="range" min={0} max={sweep.length - 1} value={i} onChange={(e) => (setPlaying(false), setI(+e.target.value))} className={`rp-range min-w-0 flex-1 ${ring}`} />
        </label>
        <output className="rp-mono ml-auto w-[7.5rem] text-right text-[12px] tabular-nums text-[var(--muted)]" aria-live="polite">
          K <span className="text-[var(--ink)]">{String(cur.k).padStart(2, " ")}</span> · {cur.bic.toFixed(2)}M
        </output>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- threshold slider */

export function ThresholdSlider({ points, positiveRate, label }: { points: [number, number][]; positiveRate: number; label: string }) {
  const [r, setR] = useState(40);
  const W = 320, H = 210, L = 30, R = 10, T = 10, B = 26;
  const x = (v: number) => L + v * (W - L - R);
  const y = (v: number) => T + (1 - v) * (H - T - B);
  const d = useMemo(() => points.map((p, j) => `${j ? "L" : "M"}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join(""), [points]); // eslint-disable-line react-hooks/exhaustive-deps
  const pt = points.reduce((a, b) => (Math.abs(b[0] - r / 100) < Math.abs(a[0] - r / 100) ? b : a));
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Precision-recall curve for ${label}. At recall ${pt[0].toFixed(2)}, precision is ${pt[1].toFixed(2)}.`}>
        <line x1={x(0)} x2={x(1)} y1={y(positiveRate)} y2={y(positiveRate)} stroke="var(--graphite)" strokeDasharray="2 3" />
        <path d={d} fill="none" stroke="var(--prussian)" strokeWidth="1.6" />
        <line x1={x(pt[0])} x2={x(pt[0])} y1={y(0)} y2={y(pt[1])} stroke="var(--ink)" strokeWidth="0.75" />
        <line x1={x(0)} x2={x(pt[0])} y1={y(pt[1])} y2={y(pt[1])} stroke="var(--ink)" strokeWidth="0.75" strokeDasharray="1 2" />
        <circle cx={x(pt[0])} cy={y(pt[1])} r="4" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
        <line x1={x(0)} x2={x(1)} y1={y(0)} y2={y(0)} stroke="var(--ink)" strokeWidth="0.75" />
        <line x1={x(0)} x2={x(0)} y1={y(0)} y2={y(1)} stroke="var(--ink)" strokeWidth="0.75" />
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <text x={x(v)} y={H - 8} textAnchor="middle" fontSize="9" className="rp-mono" fill="var(--muted)">{v}</text>
            <text x={L - 6} y={y(v) + 3} textAnchor="end" fontSize="9" className="rp-mono" fill="var(--muted)">{v}</text>
          </g>
        ))}
      </svg>
      <label className="mt-2 block">
        <span className="rp-sans flex justify-between text-[12px] text-[var(--muted)]">
          <span>Recall</span>
          <span className="rp-mono tabular-nums text-[var(--ink)]">{pt[0].toFixed(2)} → precision {pt[1].toFixed(2)}</span>
        </span>
        <input type="range" min={0} max={100} value={r} onChange={(e) => setR(+e.target.value)} className={`rp-range mt-2 w-full ${ring}`} />
      </label>
    </div>
  );
}

/* ---------------------------------------------------------------- citation chip */

export function CitationChip() {
  const [pinned, setPinned] = useState(false);
  return (
    <p className="rp-serif relative text-[17px] leading-[1.65] text-[var(--ink)]">
      Global detectors fail on this data because the nominal state is itself multi-modal
      <span className="group inline-block">
        <button
          type="button"
          aria-expanded={pinned}
          aria-describedby="rp-cite-1"
          onClick={() => setPinned((p) => !p)}
          className={`rp-sans ml-0.5 -translate-y-1.5 rounded-[3px] px-1 text-[11px] font-medium text-[var(--prussian)] transition-colors duration-200 hover:bg-[var(--parchment)] active:bg-[var(--rule)] aria-expanded:bg-[var(--parchment)] ${ring}`}
        >
          [1]
        </button>
        <span
          id="rp-cite-1"
          role="tooltip"
          className={`rp-sans pointer-events-none absolute bottom-full left-0 z-10 mb-3 max-w-[18rem] translate-y-1 rounded-[4px] border border-[var(--rule)] bg-[var(--paper)] p-3 text-[12px] leading-snug text-[var(--ink)] opacity-0 shadow-[0_1px_0_var(--rule),0_8px_24px_-12px_rgba(33,31,27,.25)] transition duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 ${pinned ? "translate-y-0 opacity-100" : ""}`}
        >
          Madhogarhia, R. &amp; Watkins, H. (2026). <i className="rp-serif text-[13px]">Uncovering Latent Structure in ESA Satellite Telemetry.</i> TTIC 31220, §4.
        </span>
      </span>
      , with 18 to 29 operating modes rather than 4 or 5.
    </p>
  );
}

/* ---------------------------------------------------------------- sticky TOC fragment */

const TOC = [
  { id: "finding", n: "1", t: "The finding", p: "ESA telemetry has latent structure at the operational-group level, 18 to 29 modes, not the 4 or 5 subsystems the channel metadata suggests." },
  { id: "methods", n: "2", t: "Five method families", p: "K-Means, PCA, Nyström KPCA, a Gaussian mixture, and three VAEs, compared on Mission 1 and Mission 2 by point-wise PR-AUC." },
  { id: "latent", n: "3", t: "Latent structure", p: "BIC bottoms out at K = 21 on Mission 1 and K = 29 on Mission 2, close to the 18 and 29 operational groups." },
  { id: "timeline", n: "4", t: "Anomaly timeline", p: "Scores rise inside labelled anomalies, but the nominal floor drifts with each mode, so one global threshold can't separate them." },
  { id: "limits", n: "5", t: "Limitations", p: "Point-wise metrics reward long events; VAE runs used different fitting protocols from the 80/20 baseline split." },
];

export function TocFragment() {
  const box = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("finding");
  useEffect(() => {
    const root = box.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id.replace("rp-toc-", ""))),
      { root, rootMargin: "0px 0px -70% 0px" },
    );
    root.querySelectorAll("section").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
  const go = (id: string) => {
    const root = box.current;
    const el = root?.querySelector<HTMLElement>(`#rp-toc-${id}`);
    if (root && el) root.scrollTo({ top: el.offsetTop - 12, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  return (
    <div ref={box} className="relative h-[300px] overflow-y-auto rounded-[3px] border border-[var(--rule)] bg-[var(--paper)]" tabIndex={-1}>
      <div className="grid grid-cols-[104px_1fr] gap-4 p-4 sm:grid-cols-[132px_1fr]">
        <nav aria-label="Fragment contents" className="sticky top-0 self-start border-r border-[var(--rule)] pr-3">
          <ol className="space-y-1.5">
            {TOC.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => go(s.id)}
                  aria-current={active === s.id ? "true" : undefined}
                  className={`rp-sans w-full rounded-[2px] text-left text-[12px] leading-tight transition-colors duration-200 hover:text-[var(--ink)] ${ring} ${active === s.id ? "font-semibold text-[var(--ink)]" : "text-[var(--muted)]"}`}
                >
                  <span className="rp-mono mr-1 text-[10px]">§{s.n}</span>
                  {s.t}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div className="space-y-6 pb-40">
          {TOC.map((s) => (
            <section key={s.id} id={`rp-toc-${s.id}`}>
              <h4 className="rp-serif text-[17px] font-medium text-[var(--ink)]">{s.n}. {s.t}</h4>
              <p className="rp-serif mt-1 text-[14px] leading-[1.6] text-[var(--ink)]">{s.p}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Keeps SVG labels at a true ~10.5px whatever the figure's rendered width:
 *  sets --rp-k (viewBox units per CSS px) on every labelled SVG in the board. */
export function SvgTextFit() {
  useEffect(() => {
    const svgs = Array.from(document.querySelectorAll<SVGSVGElement>(".rp-root svg[viewBox]")).filter((s) => s.querySelector("text"));
    const set = (s: SVGSVGElement) => {
      const vb = s.viewBox.baseVal.width;
      const w = s.getBoundingClientRect().width;
      if (vb && w) s.style.setProperty("--rp-k", String(vb / w));
    };
    const ro = new ResizeObserver((es) => es.forEach((e) => set(e.target as SVGSVGElement)));
    svgs.forEach((s) => (set(s), ro.observe(s)));
    return () => ro.disconnect();
  }, []);
  return null;
}
