"use client";

// The site's figures, built from the Intense Space design system's primitives (ui.tsx) and
// the same recipes as its Telemetry / Novel components, re-cut for the story: no spec lines,
// one shared mission, and a deep link from each figure to the page of the paper that backs it.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Bic, Curve, Curves, Row, Timelines, Tree } from "../design-systems/intense-space/data";
import { BTN, Br, Button, Chip, DOT, FR, LABEL, MONO, Modal, Range, Segmented, Select, Status, TRANS } from "../design-systems/intense-space/ui";
import { PageLink } from "./reader";
import { CountUp, RevealCtx, useReveal } from "./reveal";

export type Prov = { s: "verified" | "near" | "recomputed" | "unsaved"; note: string };
export const PROV: Record<Prov["s"], { i: string; w: string; c: string }> = {
  verified: { i: "✓", w: "Verified", c: "text-(--is-frost)" },
  near: { i: "≈", w: "Near", c: "text-(--is-frost)" },
  recomputed: { i: "↻", w: "Mixed", c: "text-(--is-frost)" },
  unsaved: { i: "–", w: "Not saved", c: "text-(--is-steel)" },
};

export type M = 1 | 2;
export const MS: { v: M; t: string }[] = [
  { v: 1, t: "Mission 1" },
  { v: 2, t: "Mission 2" },
];
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
export const short = (m: string) =>
  m.replace("TransformerVAE", "TVAE").replace("HierarchicalVAE", "HVAE").replace("CapacityVAE", "CapVAE").replace("Nystroem-KPCA", "KPCA");
const RANDOM: Record<M, number> = { 1: 0.111, 2: 0.047 };
const PLATEAU = 0.322;

/* ---------------- panel: hairline + corner ticks, bracketed tag, optional paper link ---------------- */
// Every figure has the same three parts, like a drawing sheet: a tag row (code · title · page chip),
// the figure, and one caption of ≤ 12 words in the title block at the bottom.
export function Panel({ id, code, title, page, pageLabel, caption, className = "", children }: { id?: string; code: string; title: string; page?: number; pageLabel?: string; caption?: ReactNode; className?: string; children: ReactNode }) {
  const [ref, reveal] = useReveal<HTMLElement>();
  return (
    <section ref={ref} id={id} data-reveal={reveal} aria-labelledby={id ? `${id}-h` : undefined} className={`is-corners isx-fill isx-anchor relative flex min-w-0 flex-col rounded-[2px] border border-(--is-line) bg-(--is-panel) ${className}`}>
      <header className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-0 border-b border-(--is-line) py-1 pl-4 pr-2">
        <span className={`${LABEL} text-(--is-steel)`}>[ {code} ]</span>
        <h3 id={id ? `${id}-h` : undefined} className={`${LABEL} text-(--is-frost)`}>
          {title}
        </h3>
        {page ? (
          <span className="ml-auto">
            <PageLink page={page}>{pageLabel}</PageLink>
          </span>
        ) : null}
      </header>
      <RevealCtx.Provider value={reveal}>
        <div className="flex flex-1 flex-col gap-5 p-4 sm:p-5">{children}</div>
      </RevealCtx.Provider>
      {caption ? (
        <p className="border-t border-(--is-line) px-4 py-3 text-[13px] leading-snug text-(--is-steel) sm:px-5">
          {caption}
        </p>
      ) : null}
    </section>
  );
}

/* a chart frame: SVG for marks (non-scaling strokes), HTML for every label so text never drops under 10px */
function Frame({ children, labels, className = "aspect-[16/10]", onPoint, foot, fill }: { children: ReactNode; labels?: ReactNode; className?: string; onPoint?: (fx: number, fy: number) => void; foot?: [ReactNode, ReactNode]; fill?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const down = useRef(false);
  const fire = (e: React.PointerEvent) => {
    if (!onPoint) return;
    const r = ref.current!.getBoundingClientRect();
    onPoint(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
  };
  return (
    <div className={fill ? "flex h-full flex-col" : ""}>
      <div className={`relative ${fill ? "flex-1" : ""} ${className}`}>
        <div
          ref={ref}
          className={`is-regdots absolute inset-0 rounded-[2px] border border-(--is-line) bg-(--is-void) ${onPoint ? "cursor-crosshair touch-pan-y" : ""}`}
          onPointerDown={(e) => ((down.current = true), fire(e))}
          onPointerMove={(e) => down.current && fire(e)}
          onPointerUp={() => (down.current = false)}
          onPointerLeave={() => (down.current = false)}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="isx-wipe absolute inset-0 h-full w-full overflow-visible" aria-hidden>
            {children}
          </svg>
        </div>
        {labels}
      </div>
      {foot ? (
        <div className={`${MONO} mt-1.5 flex justify-between gap-3 text-[10px] uppercase tracking-[0.1em] text-(--is-steel)`}>
          <span>{foot[0]}</span>
          <span className="text-right">{foot[1]}</span>
        </div>
      ) : null}
    </div>
  );
}
const at = (x: number, y: number, cls: string, txt: ReactNode, align: "l" | "r" | "c" = "l") => (
  <span
    className={`${MONO} pointer-events-none absolute whitespace-nowrap bg-(--is-void)/85 px-1 text-[10px] uppercase tracking-[0.1em] ${cls}`}
    style={{ left: `${x}%`, top: `${y}%`, transform: `translate(${align === "l" ? "0" : align === "r" ? "-100%" : "-50%"}, -50%)` }}
  >
    {txt}
  </span>
);

/* ===================== S.01 · before / after: subsystems vs operational groups ===================== */
export function Compare({ tree, m }: { tree: Tree; m: M }) {
  const t = tree[m];
  const { chans, groups } = useMemo(() => {
    const chans: { sub: number; group: number }[] = [];
    const groups: { sub: number; n: number }[] = [];
    t.subsystems.forEach((s, si) =>
      s.groups.forEach((g) => {
        groups.push({ sub: si, n: g.channels.length });
        g.channels.forEach(() => chans.push({ sub: si, group: groups.length - 1 }));
      }),
    );
    return { chans, groups };
  }, [t]);
  const W = 760;
  const H = 240;
  const cx = (i: number) => 10 + (i / (chans.length - 1)) * (W - 20);
  const node = (pred: (c: { sub: number; group: number }) => boolean) => {
    const xs = chans.map((c, i) => (pred(c) ? cx(i) : null)).filter((x): x is number => x !== null);
    return xs.reduce((a, b) => a + b, 0) / xs.length;
  };
  const subX = t.subsystems.map((_, si) => node((c) => c.sub === si));
  const grpX = groups.map((_, gi) => node((c) => c.group === gi));
  const curve = (x0: number, x1: number) => `M${x0.toFixed(1)} 0 C${x0.toFixed(1)} ${H * 0.55} ${x1.toFixed(1)} ${H * 0.45} ${x1.toFixed(1)} ${H - 12}`;
  const nSub = t.subsystems.length;
  const nGrp = groups.length;

  const [p, setP] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const fromX = (clientX: number) => {
    const r = box.current!.getBoundingClientRect();
    setP(Math.round(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100))));
  };
  return (
    <Panel
      id="results-split"
      code="R.02"
      title={`Same ${t.nChannels} channels, two bundlings`}
      page={5}
      pageLabel="Discussion"
      className="lg:col-span-5"
      caption={
        <>
          Each line is one channel, bundled into <span className="text-(--is-steel)">{nSub} subsystems</span> or <span className="text-(--is-teal)">{nGrp} groups</span>.
        </>
      }
    >
      <div className={`${LABEL} -mb-3 flex justify-between gap-3`}>
        <span className="text-(--is-steel)">← {nSub} subsystems</span>
        <span className="text-right text-(--is-teal)">{nGrp} groups →</span>
      </div>
      <div
        ref={box}
        className="relative flex touch-pan-y select-none flex-col overflow-hidden rounded-[2px] border border-(--is-line) bg-(--is-void) lg:flex-1"
        onPointerDown={(e) => {
          drag.current = true;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          fromX(e.clientX);
        }}
        onPointerMove={(e) => drag.current && fromX(e.clientX)}
        onPointerUp={() => (drag.current = false)}
        onPointerCancel={() => (drag.current = false)}
      >
        <div className="is-regdots relative aspect-[4/3] cursor-ew-resize sm:aspect-[760/230] lg:aspect-auto lg:min-h-[300px] lg:flex-1">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="isx-wipe-down absolute inset-x-0 top-[6%] h-[80%] w-full" aria-hidden>
            <g fill="none" stroke="#CFD9E0" strokeOpacity="0.7">
              {chans.map((c, i) => (
                <path key={i} d={curve(cx(i), grpX[c.group])} strokeWidth="1" vectorEffect="non-scaling-stroke" />
              ))}
            </g>
            {grpX.map((x, i) => (
              <rect key={i} x={x - 3} y={H - 15} width="6" height="6" fill="#4BCFE0" />
            ))}
          </svg>
          <div className="absolute inset-0 bg-(--is-void)" style={{ clipPath: `inset(0 ${100 - p}% 0 0)` }}>
            <div className="is-regdots absolute inset-0" />
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="isx-wipe-down absolute inset-x-0 top-[6%] h-[80%] w-full" aria-hidden>
              <g fill="none" stroke="#8C979F" strokeOpacity="0.75">
                {chans.map((c, i) => (
                  <path key={i} d={curve(cx(i), subX[c.sub])} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                ))}
              </g>
              {subX.map((x, i) => (
                <rect key={i} x={x - 4} y={H - 16} width="8" height="8" fill="#8C979F" />
              ))}
            </svg>
          </div>
          <div className="pointer-events-none absolute inset-y-0 w-px bg-(--is-frost)" style={{ left: `${p}%` }} />
          <div
            role="slider"
            tabIndex={0}
            aria-label="Compare subsystems (left) with operational groups (right)"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={p}
            aria-valuetext={`${p}% showing subsystems`}
            onKeyDown={(e) => {
              const s = e.shiftKey ? 10 : 4;
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                setP((x) => Math.max(0, x - s));
              }
              if (e.key === "ArrowRight") {
                e.preventDefault();
                setP((x) => Math.min(100, x + s));
              }
              if (e.key === "Home") {
                e.preventDefault();
                setP(0);
              }
              if (e.key === "End") {
                e.preventDefault();
                setP(100);
              }
            }}
            className={`${MONO} ${TRANS} absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-[2px] border border-(--is-frost) bg-(--is-void) text-[13px] text-(--is-frost) hover:bg-(--is-panel) active:bg-(--is-charcoal) ${FR}`}
            style={{ left: `${p}%` }}
          >
            ⟷
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ===================== S.02 · BIC vs K ===================== */
export function BicPicker({ bic, m }: { bic: Bic; m: M }) {
  const d = bic[m];
  // K resets to the mission's minimum whenever the mission changes (derived, no effect)
  const [st, setSt] = useState({ m, k: d.selectedK });
  const k = st.m === m ? st.k : d.selectedK;
  const setK = (v: number) => setSt({ m, k: v });
  const lo = Math.min(...d.points.map((p) => p.bic));
  const hi = Math.max(...d.points.map((p) => p.bic));
  const p = d.points.find((x) => x.k === k) ?? d.points[0];
  const X = (kk: number) => ((kk - 2) / 28) * 100;
  const Yn = (v: number) => 92 - ((v - lo) / (hi - lo)) * 80;
  const delta = p.bic - d.points.find((x) => x.k === d.selectedK)!.bic;
  const zone = k <= d.subsystems ? "subsystem" : k >= d.groups - 2 && k <= 30 ? "group" : "between";
  return (
    <Panel
      id="results-bic"
      code="R.01"
      title="How many modes? BIC vs K"
      page={5}
      pageLabel="Discussion"
      className="lg:col-span-7"
      caption={
        <>
          BIC is lowest at K* = {d.selectedK}: the <span className="text-(--is-teal)">group</span> scale, not the <span className="text-(--is-steel)">subsystem</span> scale.
        </>
      }
    >
      <Frame
        className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[2/1]"
        onPoint={(fx) => setK(Math.round(2 + fx * 28))}
        foot={["↑ BIC · penalised fit, lower = better", "K = 2 – 30 →"]}
        labels={
          <>
            {at(X(d.subsystems) + 1.5, 8, "text-(--is-steel)", `${d.subsystems} subsystems`)}
            {at(X(d.groups) - 1.5, 17, "text-(--is-teal)", `${d.groups} groups`, "r")}
          </>
        }
      >
        <rect x={X(d.subsystems) - 0.8} width="1.6" y="0" height="100" fill="#8C979F" fillOpacity="0.3" />
        <rect x={X(d.groups) - 0.8} width="1.6" y="0" height="100" fill="#4BCFE0" fillOpacity="0.35" />
        <polyline points={d.points.map((q) => `${X(q.k)},${Yn(q.bic)}`).join(" ")} fill="none" stroke="#CFD9E0" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
        <line x1={X(k)} x2={X(k)} y1="0" y2="100" stroke="#CFD9E0" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
        <circle cx={X(k)} cy={Yn(p.bic)} r="1.1" fill="#CFD9E0" />
      </Frame>
      <Range min={2} max={30} value={k} onChange={setK} label="Number of GMM components K" valueText={`K = ${k}, BIC ${(p.bic / 1e6).toFixed(2)} million`} />
      <div className="mt-auto grid grid-cols-[auto_1fr] items-end gap-x-5 gap-y-2 sm:grid-cols-[auto_1fr_auto] sm:gap-x-6">
        <div>
          <p className={`${LABEL} text-(--is-steel)`}>K</p>
          <p className={`${DOT} text-[44px] font-semibold leading-[0.85] text-(--is-frost)`}>
            <CountUp value={k} pad={2} />
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-1" aria-live="polite">
          <p className={`${MONO} text-[13px] text-(--is-frost)`}>
            BIC {(p.bic / 1e6).toFixed(3)}M{" "}
            {k === d.selectedK ? <Status kind="best">Minimum · K* = {k}</Status> : <span className="text-(--is-steel)">· +{(delta / 1e6).toFixed(3)}M vs K* = {d.selectedK}</span>}
          </p>
          <p className={`${LABEL} ${zone === "group" ? "text-(--is-teal)" : "text-(--is-steel)"}`}>
            {zone === "subsystem" ? "Subsystem scale" : zone === "group" ? "Group scale" : "Between the scales"} · K* = BIC&apos;s pick
          </p>
        </div>
        <Button variant="ghost" className="max-sm:col-span-2 max-sm:-ml-2 max-sm:justify-self-start" onClick={() => setK(d.selectedK)} disabled={k === d.selectedK}>
          Reset to K*
        </Button>
      </div>
    </Panel>
  );
}

/* ===================== S.03 · Broader · Closer · Deeper ===================== */
export function Zoom({ tree, m }: { tree: Tree; m: M }) {
  // zoom resets to Broader whenever the mission changes (derived, no effect)
  const [st, setSt] = useState<{ m: M; sub: number | null; grp: number | null }>({ m, sub: null, grp: null });
  const sub = st.m === m ? st.sub : null;
  const grp = st.m === m ? st.grp : null;
  const setSub = (v: number | null) => setSt((x) => ({ m, sub: v, grp: x.m === m ? x.grp : null }));
  const setGrp = (v: number | null) => setSt((x) => ({ m, sub: x.m === m ? x.sub : null, grp: v }));
  const t = tree[m];
  const level = grp !== null ? "deeper" : sub !== null ? "closer" : "broader";
  const s = sub !== null ? t.subsystems[sub] : null;
  const g = s && grp !== null ? s.groups[grp] : null;
  const setLevel = (l: string) => {
    if (l === "broader") {
      setSub(null);
      setGrp(null);
    }
    if (l === "closer") {
      setSub(sub ?? 0);
      setGrp(null);
    }
    if (l === "deeper") {
      setSub(sub ?? 0);
      setGrp(grp ?? 0);
    }
  };
  const block = `${MONO} ${TRANS} group relative flex min-h-24 min-w-[84px] flex-col justify-between overflow-hidden rounded-[2px] border border-(--is-line) p-2 text-left text-[10px] uppercase tracking-[0.1em] text-(--is-frost) hover:border-(--is-frost) active:bg-(--is-charcoal) ${FR}`;
  const ticks = (n: number, tone: string) => (
    <span aria-hidden className="isx-rise-y absolute inset-x-2 bottom-2 top-10 flex justify-between">
      {Array.from({ length: n }).map((_, k) => (
        <span key={k} className={`w-px ${tone} group-hover:bg-(--is-frost)/70`} />
      ))}
    </span>
  );
  return (
    <Panel
      id="background-zoom"
      code="B.02"
      title="Mission › subsystem › group › channel"
      page={2}
      pageLabel="Dataset"
      className="lg:col-span-7"
      caption={
        <>
          ESA subdivides each <span className="text-(--is-steel)">subsystem</span> into finer <span className="text-(--is-teal)">operational groups</span>.
        </>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented
          label="Zoom level"
          value={level}
          onChange={setLevel}
          options={[
            { v: "broader", t: "Broader" },
            { v: "closer", t: "Closer" },
            { v: "deeper", t: "Deeper" },
          ]}
        />
        <p className={`${LABEL} text-(--is-steel)`} aria-live="polite">
          {s ? `${s.name.replace("Subsystem ", "SS-")}${g ? ` › G${g.group}` : ""} · ${g ? g.channels.length : s.n} ch` : `${t.subsystems.length} subsystems · ${t.nChannels} ch`}
        </p>
      </div>
      <div className="flex min-h-[220px] flex-1 flex-col">
        {level === "broader" ? (
          <div key="b" className="isd-dialog flex flex-1 flex-wrap content-stretch gap-1.5">
            {t.subsystems.map((x, k) => (
              <button key={x.name} type="button" onClick={() => (setSub(k), setGrp(null))} className={block} style={{ flexGrow: x.n, flexBasis: `${x.n * 4}px` }} aria-label={`${x.name}, ${x.n} channels, ${x.groups.length} ${x.groups.length === 1 ? "group" : "groups"}. Go closer`}>
                <span className="relative z-10 bg-(--is-panel) pr-1 leading-tight">
                  {x.name.replace("Subsystem ", "SS-")}
                  <span className="block text-(--is-steel)">
                    {x.groups.length} {x.groups.length === 1 ? "group" : "groups"}
                  </span>
                </span>
                {ticks(x.n, "bg-(--is-steel)/60")}
              </button>
            ))}
          </div>
        ) : level === "closer" && s ? (
          <div key={`c${sub}`} className="isd-dialog flex flex-1 flex-col rounded-[2px] border border-(--is-teal) p-1.5">
            <p className={`${LABEL} px-1 pb-1.5 text-(--is-teal)`}>[ {s.name} · {s.groups.length} groups ]</p>
            <div className="flex flex-1 flex-wrap content-stretch gap-1.5">
              {s.groups.map((x, k) => (
                <button key={x.group} type="button" onClick={() => setGrp(k)} className={block} style={{ flexGrow: x.channels.length, flexBasis: `${x.channels.length * 10}px` }} aria-label={`Group ${x.group}, ${x.channels.length} channels. Go deeper`}>
                  <span className="relative z-10 bg-(--is-panel) pr-1 leading-tight">
                    G{x.group}
                    <span className="block text-(--is-steel)">{x.channels.length} ch</span>
                  </span>
                  {ticks(x.channels.length, "bg-(--is-teal)/70")}
                </button>
              ))}
            </div>
          </div>
        ) : s && g ? (
          <div key={`d${sub}-${grp}`} className="isd-dialog flex-1 rounded-[2px] border border-(--is-teal) p-3">
            <p className={`${LABEL} pb-3 text-(--is-teal)`}>
              [ {s.name.replace("Subsystem ", "SS-")} › Group {g.group} ]
            </p>
            <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {g.channels.map((c) => (
                <li key={c.ch} className={`${MONO} rounded-[2px] border border-(--is-line) px-2 py-1.5 text-[11px] uppercase tracking-[0.08em] text-(--is-frost)`}>
                  {c.ch}
                  <span className="block text-[10px] text-(--is-steel)">
                    {c.unit}
                    {c.target ? " · target" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

/* ===================== method copy + credit (from the report) ===================== */
const ABOUT: Record<string, string> = {
  "K-Means": "MiniBatch K-Means, K = 2 picked by silhouette. Score: distance to the nearest centroid.",
  "PCA Recon": "33 principal components keep 95% of the variance. Score: reconstruction error.",
  "PCA + K-Means": "K-Means inside the 33-D PCA space. Score: centroid distance.",
  "Nystroem-KPCA Dist": "RBF kernel approximated with 300 Nyström components (γ = 0.1/n, PCA-5). Score: centroid distance.",
  "Nystroem-KPCA Feat-Recon": "The same kernel map, scored by reconstruction in feature space. It collapses.",
  GMM: "Full-covariance mixture on PCA-30, K chosen by BIC. Score: negative log-likelihood; alarm above the 99th percentile of training NLL.",
  CapacityVAE: "Conv1D encoder [64, 128, 256] with denoising and a capacity-controlled KL (C max 50) on 32-step windows.",
  HierarchicalVAE: "A 16-D global code for the operating mode plus a 16-D local code for how the window deviates from it.",
  TransformerVAE: "Three layers of 4-head self-attention over 32-step windows (≈ 16 min); the [CLS] token maps to the latent.",
};
const FAM: Record<string, string> = { baseline: "Baseline", parametric: "Parametric", generative: "Generative" };

function topSet(rows: Row[]) {
  return new Set([1, 2].map((mm) => rows.filter((r) => r.mission === mm).sort((a, b) => b.prAuc - a.prAuc)[0].label));
}

/* ===================== M.01 · dumbbell: each method on both missions ===================== */
export function Ladder({ rows, m, onOpen }: { rows: Row[]; m: M; onOpen: (r: Row) => void }) {
  const methods = [...new Set(rows.map((r) => r.method))];
  const LO = 0.1;
  const X = (v: number) => ((v - LO) / (0.5 - LO)) * 100;
  const [hi, setHi] = useState<string | null>(null);
  const top = topSet(rows);
  const grid = "grid grid-cols-[5.5rem_1fr_7.25rem] sm:grid-cols-[7.5rem_1fr_7.5rem]";
  return (
    <Panel
      id="results-ladder"
      code="R.03"
      title="PR-AUC by method · Mission 1 vs 2"
      page={5}
      pageLabel="Table 1"
      className="lg:col-span-12 xl:col-span-5"
      caption="Linear plateau 0.322; GMM leads Mission 1, the VAEs Mission 2."
    >
      <div className={`${MONO} flex flex-wrap gap-x-5 gap-y-1 text-[11px] uppercase tracking-[0.1em]`}>
        <span className={m === 1 ? "text-(--is-frost)" : "text-(--is-steel)"}>
          <span aria-hidden>○ </span>Mission 1
        </span>
        <span className={m === 2 ? "text-(--is-frost)" : "text-(--is-steel)"}>
          <span aria-hidden>● </span>Mission 2
        </span>
        <span className="text-(--is-steel)">
          <span aria-hidden>┊ </span>Linear plateau 0.322
        </span>
      </div>
      <ol className="flex flex-1 flex-col border-t border-(--is-line)" onMouseLeave={() => setHi(null)}>
        {methods.map((name, idx) => {
          const r1 = rows.find((r) => r.method === name && r.mission === 1);
          const r2 = rows.find((r) => r.method === name && r.mission === 2);
          const on = hi === name;
          const isTop = (r1 && top.has(r1.label)) || (r2 && top.has(r2.label));
          const tone = on ? "#4BCFE0" : "#CFD9E0";
          const dim = "#8C979F";
          const c1 = on || m === 1 ? tone : dim;
          const c2 = on || m === 2 ? tone : dim;
          return (
            <li key={name} className="flex flex-1">
              <button
                type="button"
                onMouseEnter={() => setHi(name)}
                onFocus={() => setHi(name)}
                onBlur={() => setHi(null)}
                onClick={() => onOpen((m === 2 ? (r2 ?? r1) : (r1 ?? r2))!)}
                aria-label={`${name}: Mission 1 ${r1 ? r1.prAuc.toFixed(3) : "not run"}, Mission 2 ${r2 ? r2.prAuc.toFixed(3) : "not run"}. Open the method card`}
                className={`group ${grid} min-h-12 w-full flex-1 items-center rounded-[2px] border-b border-(--is-line) text-left ${TRANS} hover:bg-(--is-void) active:bg-(--is-charcoal) ${FR} focus-visible:outline-offset-0`}
              >
                <span className={`${MONO} truncate pl-1 text-[11px] uppercase tracking-[0.06em] ${on ? "text-(--is-teal)" : "text-(--is-frost)"}`}>
                  {short(name).replace(" Feat-Recon", " Feat")}
                  {isTop ? <span aria-hidden className="text-(--is-teal)"> ◆</span> : null}
                </span>
                <span className="isx-wipe relative mx-2 h-12" style={{ "--d": `${idx * 45}ms` } as React.CSSProperties}>
                  <span aria-hidden className="absolute inset-y-0 border-l border-dashed border-(--is-steel)/70" style={{ left: `${X(PLATEAU)}%` }} />
                  <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
                    {r1 && r2 ? <line x1={X(r1.prAuc)} x2={X(r2.prAuc)} y1="5" y2="5" stroke={tone} strokeOpacity={on ? 1 : 0.55} strokeWidth={on ? 2 : 1.2} vectorEffect="non-scaling-stroke" /> : null}
                  </svg>
                  {r1 ? <span className={`absolute top-1/2 size-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] bg-(--is-panel) ${TRANS}`} style={{ left: `${X(r1.prAuc)}%`, borderColor: c1 }} /> : null}
                  {r2 ? <span className={`absolute top-1/2 size-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full ${TRANS}`} style={{ left: `${X(r2.prAuc)}%`, background: c2 }} /> : null}
                </span>
                <span className={`${MONO} pr-1 text-right text-[11px] tracking-[0.04em]`}>
                  <span className={on ? "text-(--is-teal)" : m === 1 ? "text-(--is-frost)" : "text-(--is-steel)"}>{r1 ? r1.prAuc.toFixed(3) : "—"}</span>
                  <span className="text-(--is-steel)"> → </span>
                  <span className={on ? "text-(--is-teal)" : m === 2 ? "text-(--is-frost)" : "text-(--is-steel)"}>{r2 ? r2.prAuc.toFixed(3) : "—"}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className={`${MONO} -mt-3 ${grid} text-[10px] uppercase tracking-[0.1em] text-(--is-steel)`}>
        <span />
        <span className="relative mx-2 h-4">
          {[0.1, 0.2, 0.3, 0.4, 0.5].map((v) => (
            <span key={v} className={`absolute -translate-x-1/2 ${v > 0.1 && v < 0.5 ? "max-sm:hidden" : ""}`} style={{ left: `${X(v)}%` }}>
              {v.toFixed(1)}
            </span>
          ))}
        </span>
        <span className="pr-1 text-right">M1 → M2</span>
      </div>
    </Panel>
  );
}

/* ===================== M.02 · Table 1, sortable + filterable ===================== */
type Key = "label" | "family" | "prAuc" | "rocAuc" | "eventF1";
type TRow = Row & { ghost?: boolean };
export function ResultsTable({ rows, m, prov, onOpen }: { rows: Row[]; m: M; prov: Record<string, Prov>; onOpen: (r: Row) => void }) {
  const [key, setKey] = useState<Key>("prAuc");
  const [asc, setAsc] = useState(false);
  const [fams, setFams] = useState<string[]>(["baseline", "parametric", "generative"]);
  const top = topSet(rows);
  const here = rows.filter((r) => r.mission === m);
  // methods that were only run on Mission 1 stay in the table on Mission 2, quietly marked
  const ghosts: TRow[] = m === 2 ? rows.filter((r) => r.mission === 1 && !here.some((h) => h.method === r.method)).map((r) => ({ ...r, ghost: true })) : [];
  const list: TRow[] = ([...here, ...ghosts] as TRow[])
    .filter((r) => fams.includes(r.family))
    .slice()
    .sort((a, b) => {
      if (!!a.ghost !== !!b.ghost) return a.ghost ? 1 : -1;
      const x = a[key] ?? -1;
      const y = b[key] ?? -1;
      const c = typeof x === "string" ? x.localeCompare(y as string) : (x as number) - (y as number);
      return asc ? c : -c;
    });
  const shown = list.filter((r) => !r.ghost).length;
  const cols: { k: Key; t: string; cls?: string; num?: boolean }[] = [
    { k: "label", t: "Method" },
    { k: "family", t: "Family", cls: "max-xl:hidden" },
    { k: "prAuc", t: "PR-AUC", num: true },
    { k: "rocAuc", t: "ROC-AUC", num: true, cls: "max-sm:hidden" },
    { k: "eventF1", t: "Ev. F1", num: true, cls: "max-md:hidden" },
  ];
  const sortBy = (k: Key) => (k === key ? setAsc((a) => !a) : (setKey(k), setAsc(k === "label" || k === "family")));
  return (
    <Panel
      id="results-table"
      code="R.04"
      title={`Table 1 · Mission ${m}`}
      page={5}
      pageLabel="Table 1"
      className="lg:col-span-12 xl:col-span-7"
      caption="Table 1 as printed, each row checked against our notebooks."
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Method family">
          {(["baseline", "parametric", "generative"] as const).map((f) => (
            <Chip key={f} on={fams.includes(f)} onClick={() => setFams((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]))}>
              {FAM[f]}
            </Chip>
          ))}
        </div>
        <p className={`${LABEL} text-(--is-steel)`} aria-live="polite">
          {shown} of {here.length} rows · {cols.find((c) => c.k === key)!.t} {asc ? "↑" : "↓"}
        </p>
      </div>
      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table className="w-full min-w-[290px] border-collapse text-left">
          <thead>
            <tr className="border-b border-(--is-frost)">
              {cols.map((c) => (
                <th key={c.k} scope="col" aria-sort={key === c.k ? (asc ? "ascending" : "descending") : "none"} className={`${c.cls ?? ""} ${c.num ? "text-right" : ""} px-2 py-1 first:pl-4 sm:first:pl-2`}>
                  <button type="button" onClick={() => sortBy(c.k)} className={`${MONO} ${TRANS} inline-flex min-h-9 items-center gap-1 whitespace-nowrap rounded-[2px] text-[11px] uppercase tracking-[0.12em] underline decoration-transparent underline-offset-4 hover:decoration-(--is-frost) ${key === c.k ? "text-(--is-frost)" : "text-(--is-steel) hover:text-(--is-frost)"} active:opacity-70 ${FR}`}>
                    {c.t}
                    <span aria-hidden className={key === c.k ? "" : "opacity-0"}>
                      {asc ? "↑" : "↓"}
                    </span>
                  </button>
                </th>
              ))}
              <th scope="col" className={`${MONO} px-2 pr-4 text-left text-[11px] font-normal uppercase tracking-[0.12em] text-(--is-steel) max-sm:hidden sm:pr-2`}>
                Checked
              </th>
            </tr>
          </thead>
          <tbody>
            {list.length ? (
              list.map((r, idx) =>
                r.ghost ? (
                  <tr key={`g-${r.label}`} className="border-b border-(--is-line)">
                    <td className="py-0 pl-4 pr-2 sm:pl-2">
                      <span className="flex min-h-12 flex-col justify-center text-[14px] text-(--is-steel)">
                        {short(r.method)}
                        <span className={`${MONO} block text-[10px] uppercase tracking-[0.1em]`}>Mission 1 only</span>
                      </span>
                    </td>
                    <td className="px-2 text-[14px] text-(--is-steel) max-xl:hidden">{FAM[r.family]}</td>
                    <td className={`${MONO} px-2 text-right text-[13px] text-(--is-steel)`}>—</td>
                    <td className={`${MONO} px-2 text-right text-[13px] text-(--is-steel) max-sm:hidden`}>—</td>
                    <td className={`${MONO} px-2 text-right text-[13px] text-(--is-steel) max-md:hidden`}>—</td>
                    <td className="px-2 pr-4 max-sm:hidden sm:pr-2" />
                  </tr>
                ) : (
                  <tr key={r.label} className={`border-b border-(--is-line) ${TRANS} hover:bg-(--is-void)`}>
                    <td className="py-0 pl-4 pr-2 sm:pl-2">
                      <button type="button" onClick={() => onOpen(r)} aria-label={`${r.label}: open the method card`} className={`group flex min-h-12 w-full items-center gap-2 rounded-[2px] py-1.5 text-left text-[14px] text-(--is-frost) active:opacity-70 max-sm:flex-col max-sm:items-start max-sm:gap-1 ${FR} focus-visible:outline-offset-0`}>
                        <span className="min-w-0">
                          <span className="whitespace-nowrap underline decoration-transparent underline-offset-4 group-hover:decoration-(--is-frost)">{short(r.method)}</span>
                          {r.latentK ? <span className="whitespace-nowrap text-(--is-steel)"> · K {r.latentK}</span> : null}
                          <span className="block text-[12px] text-(--is-steel)">
                            {r.scoring}
                            {prov[r.label] ? (
                              <span className="sm:hidden">
                                {" · "}
                                <span aria-hidden>{PROV[prov[r.label].s].i}</span> {PROV[prov[r.label].s].w}
                              </span>
                            ) : null}
                          </span>
                        </span>
                        {top.has(r.label) || r.trendDirection === "best" ? (
                          <span className="flex flex-col items-end gap-1 whitespace-nowrap pr-1 text-right max-sm:flex-row max-sm:gap-3 sm:ml-auto">
                            {top.has(r.label) ? <Status kind="best">Top PR-AUC</Status> : null}
                            {r.trendDirection === "best" ? <Status kind="vae">Best VAE</Status> : null}
                          </span>
                        ) : null}
                      </button>
                    </td>
                    <td className="px-2 text-[14px] text-(--is-steel) max-xl:hidden">{FAM[r.family]}</td>
                    <td className={`${MONO} px-2 text-right text-[13px] text-(--is-frost)`}>
                      <span className="inline-flex items-center gap-2">
                        <span aria-hidden className="relative hidden h-1 w-12 bg-(--is-line) sm:inline-block">
                          <span className="isx-grow absolute inset-y-0 left-0 bg-(--is-steel)" style={{ width: `${(r.prAuc / 0.5) * 100}%`, "--d": `${idx * 40}ms` } as React.CSSProperties} />
                        </span>
                        {r.prAuc.toFixed(3)}
                      </span>
                    </td>
                    <td className={`${MONO} px-2 text-right text-[13px] text-(--is-frost) max-sm:hidden`}>{r.rocAuc.toFixed(3)}</td>
                    <td className={`${MONO} px-2 text-right text-[13px] text-(--is-steel) max-md:hidden`}>{r.eventF1 === null ? "—" : r.eventF1.toFixed(3)}</td>
                    <td className="px-2 pr-4 max-sm:hidden sm:pr-2">
                      <ProvTag p={prov[r.label]} />
                    </td>
                  </tr>
                ),
              )
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-[16px] text-(--is-steel) sm:px-2">
                  No rows match.{" "}
                  <button type="button" onClick={() => setFams(["baseline", "parametric", "generative"])} className={`${MONO} rounded-[2px] text-[11px] uppercase tracking-[0.12em] text-(--is-frost) underline underline-offset-4 hover:decoration-2 ${FR}`}>
                    Show all families
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className={`${MONO} mt-auto text-[10px] uppercase leading-[1.7] tracking-[0.1em] text-(--is-steel)`}>
        <span className="text-(--is-teal)">◆ Top PR-AUC</span> = best row on the mission · <span className="text-(--is-frost)">◇ Best VAE</span> = the paper&apos;s bold ·{" "}
        <span className="text-(--is-frost)">✓</span> verified · <span className="text-(--is-frost)">≈</span> near · <span className="text-(--is-frost)">↻</span> mixed (two runs) · – not saved, against our notebooks
      </p>
    </Panel>
  );
}

function ProvTag({ p }: { p?: Prov }) {
  if (!p) return null;
  const v = PROV[p.s];
  return (
    <span className={`${MONO} inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] uppercase tracking-[0.1em] ${v.c}`} title={p.note}>
      <span aria-hidden>{v.i}</span>
      <span>{v.w}</span>
      <span className="sr-only">. {p.note}</span>
    </span>
  );
}

/* ===================== method detail (modal body) ===================== */
export function MethodModal({ row, rows, prov, onClose, onSwitch }: { row: Row | null; rows: Row[]; prov: Record<string, Prov>; onClose: () => void; onSwitch: (r: Row) => void }) {
  const top = topSet(rows);
  const other = row ? rows.find((x) => x.method === row.method && x.mission !== row.mission) : undefined;
  const open = !!row;
  useEffect(() => {
    if (open) window.dispatchEvent(new Event("isx-modal"));
  }, [open]);
  const pv = row ? prov[row.label] : undefined;
  return (
    <Modal open={open} onClose={onClose} title={row ? row.method : ""} kicker={row ? `[ Mission ${row.mission} · ${FAM[row.family]} · ${row.latentK ? `K = ${row.latentK}` : "no K"} ]` : ""}>
      {row ? (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-3">
            {top.has(row.label) ? <Status kind="best">Top PR-AUC · M{row.mission}</Status> : null}
            {row.trendDirection === "best" ? <Status kind="vae">Best VAE · M{row.mission} (paper bold)</Status> : null}
            {row.trendDirection !== "best" ? <span className={`${MONO} text-[11px] uppercase tracking-[0.12em] text-(--is-frost)`}>Trend · {row.trend}</span> : null}
          </div>
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[2px] border border-(--is-line) bg-(--is-line)">
            {[
              ["PR-AUC", row.prAuc.toFixed(3), true],
              ["ROC-AUC", row.rocAuc.toFixed(3), false],
              ["Event F1", row.eventF1 === null ? "—" : row.eventF1.toFixed(3), false],
            ].map(([k, v, big]) => (
              <div key={k as string} className="bg-(--is-panel) p-3">
                <p className={`${LABEL} text-(--is-steel)`}>{k}</p>
                <p className={`${big ? `${DOT} text-[34px] font-semibold` : `${MONO} text-[20px]`} mt-1 leading-[1] text-(--is-frost)`}>{v}</p>
              </div>
            ))}
          </div>
          <div>
            <div className="relative h-7">
              <div className="absolute inset-x-0 top-3 h-1.5 rounded-[1px] bg-(--is-line)" />
              <div className="absolute left-0 top-3 h-1.5 rounded-[1px] bg-(--is-frost)" style={{ width: `${(row.prAuc / 0.5) * 100}%` }} />
              <span className="absolute top-1 h-5 w-px bg-(--is-steel)" style={{ left: `${(RANDOM[row.mission as M] / 0.5) * 100}%` }} />
              <span className="absolute top-1 h-5 w-px bg-(--is-frost)" style={{ left: `${(PLATEAU / 0.5) * 100}%` }} />
            </div>
            <div className={`${MONO} relative h-4 text-[10px] uppercase tracking-[0.08em]`}>
              <span className="absolute -translate-x-1/3 text-(--is-steel)" style={{ left: `${(RANDOM[row.mission as M] / 0.5) * 100}%` }}>
                Random {RANDOM[row.mission as M]}
              </span>
              <span className="absolute -translate-x-1/2 text-(--is-frost)" style={{ left: `${(PLATEAU / 0.5) * 100}%` }}>
                Plateau .322
              </span>
            </div>
          </div>
          <p className="text-[16px] leading-[1.45] text-(--is-frost)">{ABOUT[row.method]}</p>
          <dl className={`${MONO} grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-(--is-line) pt-3 text-[11px] uppercase tracking-[0.08em]`}>
            <dt className="text-(--is-steel)">Scoring</dt>
            <dd className="text-(--is-frost)">{row.scoring}</dd>
            <dt className="text-(--is-steel)">Checked</dt>
            <dd className="text-(--is-frost)">{pv ? `${PROV[pv.s].i} ${PROV[pv.s].w}` : "—"}</dd>
          </dl>
          {pv ? <p className="-mt-3 text-[13px] leading-snug text-(--is-steel)">{pv.note}</p> : null}
          <div className="flex flex-wrap items-center gap-3">
            {other ? (
              <button type="button" onClick={() => onSwitch(other)} className={`group ${BTN.secondary}`}>
                <Br>Same method on Mission {other.mission} →</Br>
              </button>
            ) : (
              <span className={`${LABEL} text-(--is-steel)`}>Mission 1 only</span>
            )}
            <PageLink page={5}>Table 1</PageLink>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

/* ===================== E.01 · alarm threshold on a real PR curve ===================== */
const provLine = (c: Curve) =>
  c.match === "exact"
    ? `✓ AP ${c.prAuc.toFixed(3)} · matches Table 1`
    : c.t1Pr !== null
      ? `↻ AP ${c.prAuc.toFixed(3)} recomputed from saved scores · Table 1: ${c.t1Pr.toFixed(3)}`
      : `AP ${c.prAuc.toFixed(3)} · saved run, not in Table 1`;

export function Threshold({ curves, m }: { curves: Curves; m: M }) {
  const runs = curves.list.filter((c) => c.mission === m && c.table1);
  const [id, setId] = useState(runs[0].id);
  const run = runs.find((r) => r.id === id) ?? runs[0];
  const [rec, setRec] = useState(30);
  const pt = run.points.reduce((b, p) => (Math.abs(p[0] - rec / 100) < Math.abs(b[0] - rec / 100) ? p : b), run.points[0]);
  const P = curves.nTest[m] * curves.pos[m];
  const tp = pt[0] * P;
  const flagged = tp / Math.max(pt[1], 1e-6);
  const fp = flagged - tp;
  const f1 = (2 * pt[0] * pt[1]) / (pt[0] + pt[1] || 1);
  const hz = m === 1 ? 0.033 : 0.056;
  const days = curves.nTest[m] / hz / 86400;
  const bestF1 = () => {
    const b = run.points.reduce((a, p) => ((2 * p[0] * p[1]) / (p[0] + p[1] || 1) > (2 * a[0] * a[1]) / (a[0] + a[1] || 1) ? p : a));
    setRec(Math.max(1, Math.round(b[0] * 100)));
  };
  const X = (r: number) => r * 100;
  const Y = (p: number) => (1 - p) * 100;
  return (
    <Panel
      id="results-threshold"
      code="R.05"
      title="Set the alarm threshold"
      page={5}
      pageLabel="Table 1 AP"
      className="lg:col-span-12"
      caption="Precision against recall at every alarm threshold, from saved test scores."
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1 sm:max-w-[320px]">
          <label htmlFor="isx-run" className="sr-only">
            Method
          </label>
          <Select id="isx-run" value={run.id} onChange={setId} options={runs.map((r) => ({ v: r.id, t: `${short(r.method)} · ${r.scoring}` }))} />
        </div>
        <p className={`${MONO} text-[10px] uppercase tracking-[0.1em] ${run.match === "exact" ? "text-(--is-steel)" : "text-(--is-frost)"}`} aria-live="polite">
          {provLine(run)}
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-[1.35fr_1fr] lg:grid-cols-[1.6fr_1fr]">
        <Frame
          fill
          className="aspect-[4/3] md:aspect-auto md:min-h-[300px]"
          onPoint={(fx) => setRec(Math.max(1, Math.min(99, Math.round(fx * 100))))}
          foot={["↑ Precision 0–1", "Recall 0–1 →"]}
          labels={
            <>
              {at(Math.min(X(pt[0]) + 2, 66), Math.max(Y(pt[1]) - 7, 10), "text-(--is-teal)", `P ${pt[1].toFixed(2)} · R ${pt[0].toFixed(2)}`)}
              {at(98, Y(curves.pos[m]) - 5, "text-(--is-steel)", `Random ${curves.pos[m].toFixed(3)}`, "r")}
            </>
          }
        >
          <polyline points={run.points.map(([r, p]) => `${X(r)},${Y(p)}`).join(" ")} fill="none" stroke="#CFD9E0" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
          <line x1="0" x2="100" y1={Y(curves.pos[m])} y2={Y(curves.pos[m])} stroke="#8C979F" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
          <line x1={X(pt[0])} x2={X(pt[0])} y1="0" y2="100" stroke="#4BCFE0" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
          <line x1="0" x2="100" y1={Y(pt[1])} y2={Y(pt[1])} stroke="#4BCFE0" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
        </Frame>
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3" aria-live="polite">
            <div>
              <p className={`${LABEL} text-(--is-steel)`}>Precision</p>
              <p className={`${DOT} text-[40px] font-semibold leading-[0.9] text-(--is-frost) sm:text-[52px]`}>
                <CountUp value={pt[1]} digits={2} />
              </p>
            </div>
            <div>
              <p className={`${LABEL} text-(--is-steel)`}>Recall</p>
              <p className={`${DOT} text-[40px] font-semibold leading-[0.9] text-(--is-frost) sm:text-[52px]`}>
                <CountUp value={pt[0]} digits={2} />
              </p>
            </div>
          </div>
          <dl className={`${MONO} grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 border-t border-(--is-line) pt-3 text-[11px] uppercase tracking-[0.08em]`}>
            <dt className="text-(--is-steel)">Fault steps caught</dt>
            <dd className="text-right text-(--is-frost)">{fmt(tp)}</dd>
            <dt className="text-(--is-steel)">False alarms</dt>
            <dd className="text-right text-(--is-frost)">{fmt(fp)}</dd>
            <dt className="text-(--is-steel)">Fault steps missed</dt>
            <dd className="text-right text-(--is-frost)">{fmt(P - tp)}</dd>
            <dt className="text-(--is-steel)">Alarms per day</dt>
            <dd className="text-right text-(--is-frost)">{fmt(flagged / days)}</dd>
            <dt className="text-(--is-steel)">F1</dt>
            <dd className="text-right text-(--is-frost)">{f1.toFixed(3)}</dd>
          </dl>
          <div className="mt-auto flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="isx-rec" className={`${LABEL} text-(--is-steel)`}>
                Target recall · {rec}%
              </label>
              <Button variant="ghost" onClick={bestF1}>
                Snap to best F1
              </Button>
            </div>
            <Range id="isx-rec" min={1} max={99} value={rec} onChange={setRec} label="Target recall" valueText={`Recall ${rec}%, precision ${pt[1].toFixed(2)}`} />
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ===================== E.02 · mission timeline scrubber ===================== */
export function Timeline({ tl, m }: { tl: Timelines; m: M }) {
  const pick = (mm: M) => tl[mm].series.find((s) => s.id.startsWith("gmm"))!.id;
  const [st, setSt] = useState({ m, sid: pick(m) });
  const sid = st.m === m ? st.sid : pick(m);
  const setSid = (v: string) => setSt({ m, sid: v });
  const series = tl[m].series.find((s) => s.id === sid) ?? tl[m].series[0];
  const n = series.bins.length;
  const [i, setI] = useState(Math.round(n * 0.35));
  const [play, setPlay] = useState(false);
  useEffect(() => {
    if (!play) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % n), 60);
    return () => clearInterval(t);
  }, [play, n]);
  const b = series.bins[Math.min(i, n - 1)];
  const hz = m === 1 ? 0.033 : 0.056;
  const day = b.i / hz / 86400;
  const fault = b.a > 0.05;
  const nextFault = () => {
    setPlay(false);
    for (let k = 1; k <= n; k++) {
      const j = (i + k) % n;
      if (series.bins[j].a > 0.05 && !(series.bins[(j - 1 + n) % n].a > 0.05)) return setI(j);
    }
  };
  // Fig. 3's segment: the longest Mission 1 test anomaly starts at step 2,521,579
  const longest = () => {
    setPlay(false);
    const j = series.bins.findIndex((x, k) => x.i <= 2521579 && (series.bins[k + 1]?.i ?? Infinity) > 2521579);
    setI(Math.max(0, j));
  };
  const X = (k: number) => (k / (n - 1)) * 100;
  const NAMES: Record<string, string> = {
    kmeans_k8_m1: "K-Means K = 8 · not Table 1",
    gmm_m1: "GMM K = 21 · Table 1",
    hvae_run1_m1: "HVAE GMM-OOD · Table 1",
    gmm_m2: "GMM K = 29 · Table 1",
    hvae_run1_m2: "HVAE Recon · saved run",
    tvae_run1_m2: "TVAE Neg. ELBO · earlier run",
  };
  const label = (s: { id: string; method: string }) => NAMES[s.id] ?? short(s.method);
  return (
    <Panel
      id="results-timeline"
      code="R.06"
      title="Scrub the whole test set"
      page={7}
      pageLabel="Fig. 3"
      className="lg:col-span-12"
      caption={m === 1 ? "Fig. 3: global methods go blind once the satellite settles into a fault." : "Mission 2 labels are ≈95% rare operational events, not true failures."}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-[260px]">
          <label htmlFor="isx-series" className="sr-only">
            Score series
          </label>
          <Select id="isx-series" value={series.id} onChange={setSid} options={tl[m].series.map((s) => ({ v: s.id, t: label(s) }))} />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Button bracket aria-pressed={play} onClick={() => setPlay((p) => !p)}>
            {play ? "❚❚ Pause" : "▶ Play"}
          </Button>
          <Button variant="ghost" onClick={nextFault}>
            Next fault →
          </Button>
          {m === 1 ? (
            <Button variant="ghost" onClick={longest}>
              Longest fault · Fig. 3
            </Button>
          ) : (
            <span className={`${LABEL} px-2 text-(--is-steel)`}>Fig. 3 · Mission 1 only</span>
          )}
        </div>
      </div>
      <Frame
        className="aspect-[2/1] sm:aspect-[5/1]"
        onPoint={(fx) => (setPlay(false), setI(Math.round(fx * (n - 1))))}
        foot={["↑ Anomaly score (log, rank-scaled)", `Test step 0 – ${(tl[m].nTest / 1e6).toFixed(2)}M →`]}
      >
        {series.bins.map((x, k) => (x.a > 0.05 ? <rect key={k} x={X(k) - 0.21} width="0.42" y="0" height="100" fill="#E04FD6" fillOpacity={0.2 + x.a * 0.55} /> : null))}
        <polyline points={series.bins.map((x, k) => `${X(k)},${92 - x.s * 80}`).join(" ")} fill="none" stroke="#CFD9E0" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        <line x1={X(i)} x2={X(i)} y1="0" y2="100" stroke="#4BCFE0" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </Frame>
      <Range min={0} max={n - 1} value={i} onChange={(v) => (setPlay(false), setI(v))} label="Timeline position" valueText={`Step ${fmt(b.i)}, day ${Math.round(day)}, ${fault ? "inside a labelled fault" : "nominal"}`} />
      <dl className={`${MONO} grid grid-cols-2 gap-x-6 gap-y-3 text-[11px] uppercase tracking-[0.08em] sm:grid-cols-4`} aria-live="polite">
        <div>
          <dt className="text-[10px] text-(--is-steel)">Test step</dt>
          <dd className="text-(--is-frost)">{fmt(b.i)}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-(--is-steel)">Day of test</dt>
          <dd className="text-(--is-frost)">{fmt(day)}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-(--is-steel)">Median score</dt>
          <dd className="text-(--is-frost)">{b.raw.toLocaleString("en-US")}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-(--is-steel)">Label</dt>
          <dd>{fault ? <Status kind="fault">Labelled fault · {Math.round(b.a * 100)}%</Status> : <Status kind="nominal" />}</dd>
        </div>
      </dl>
    </Panel>
  );
}
