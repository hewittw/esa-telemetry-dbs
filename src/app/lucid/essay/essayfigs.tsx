"use client";

// The essay's own drawings: the hero satellite, the "one normal vs one per mode" schematic, and the
// granularity line. Same colour key as figs.tsx: Prussian = operational groups and the mode-aware model,
// Ochre = subsystems, Ink/Graphite = everything else. Vermilion never appears here.
import { useMemo, useState } from "react";
import { Svg } from "../../design-systems/refined-paper/fig";
import { FOCUS, MONO, SANS, SERIF } from "../../design-systems/refined-paper/kit";
import { Segmented } from "../../design-systems/refined-paper/ui";
import { Figure, type M } from "./figs";
import { PageRef } from "./reader";

/* ================================================================== hero: an ink line drawing of a satellite
   Generic on purpose (the dataset anonymises its missions). Every stroke draws in once on load (2.4s,
   staggered); reduced motion shows the finished drawing. */
export function Satellite() {
  // One solar wing: a frame, cell grid, and a boom back to the body.
  const wing = (x: number, flip: boolean) => {
    const w = 118, h = 46, y = 128, cols = 5;
    const bx = flip ? x + w : x;
    return (
      <g>
        <path pathLength={1} className="ess-sat" style={{ ["--d" as string]: flip ? "420ms" : "300ms" }} d={`M${x},${y} h${w} v${h} h${-w} Z`} />
        {Array.from({ length: cols - 1 }, (_, k) => (
          <path key={k} pathLength={1} className="ess-sat ess-sat-hair" style={{ ["--d" as string]: `${700 + k * 60}ms` }} d={`M${x + ((k + 1) * w) / cols},${y} v${h}`} />
        ))}
        <path pathLength={1} className="ess-sat ess-sat-hair" style={{ ["--d" as string]: "900ms" }} d={`M${x},${y + h / 2} h${w}`} />
        <path pathLength={1} className="ess-sat" style={{ ["--d" as string]: "200ms" }} d={flip ? `M${bx - w},${y + h / 2} H${bx - w - 22}` : `M${bx + w},${y + h / 2} H${bx + w + 22}`} />
      </g>
    );
  };
  return (
    <svg viewBox="0 36 400 256" role="img" aria-label="Line drawing of a generic satellite: a box-shaped body with two solar panel wings, a dish antenna, and a faint orbit line behind it." className="ess-satellite block h-auto w-full text-[var(--ink)]">
      {/* orbit: a faint dotted ellipse behind the craft */}
      <ellipse cx="200" cy="168" rx="188" ry="70" fill="none" stroke="var(--rule-strong)" strokeWidth="0.75" strokeDasharray="1 5" strokeLinecap="round" transform="rotate(-14 200 168)" />
      <g transform="rotate(-14 200 150)" fill="none" stroke="currentColor" strokeLinejoin="round" strokeLinecap="round">
        {wing(38, false)}
        {wing(244, true)}
        {/* body */}
        <path pathLength={1} className="ess-sat" style={{ ["--d" as string]: "0ms" }} d="M178,112 h44 v78 h-44 Z" />
        <path pathLength={1} className="ess-sat ess-sat-hair" style={{ ["--d" as string]: "600ms" }} d="M178,130 h44 M178,172 h44" />
        <path pathLength={1} className="ess-sat ess-sat-hair" style={{ ["--d" as string]: "760ms" }} d="M186,140 h28 v24 h-28 Z" />
        {/* dish on a short mast */}
        <path pathLength={1} className="ess-sat" style={{ ["--d" as string]: "1000ms" }} d="M200,112 V96" />
        <path pathLength={1} className="ess-sat" style={{ ["--d" as string]: "1100ms" }} d="M176,80 Q200,108 224,80" />
        <path pathLength={1} className="ess-sat ess-sat-hair" style={{ ["--d" as string]: "1300ms" }} d="M176,80 L200,66 L224,80" />
        {/* whip antenna and thruster below */}
        <path pathLength={1} className="ess-sat" style={{ ["--d" as string]: "1200ms" }} d="M212,190 L226,222" />
        <path pathLength={1} className="ess-sat ess-sat-hair" style={{ ["--d" as string]: "1300ms" }} d="M190,190 l-4,10 h16 l-4,-10" />
        {/* telemetry: three quiet arcs leaving the dish */}
        {[0, 1, 2].map((k) => (
          <path key={k} pathLength={1} className="ess-sat ess-sat-hair ess-sat-wave" style={{ ["--d" as string]: `${1500 + k * 160}ms` }} d={`M${232 + k * 12},${56 - k * 8} q${10 + k * 4},${12 + k * 3} ${2 + k * 2},${28 + k * 8}`} />
        ))}
      </g>
    </svg>
  );
}

/* ================================================================== results: one global normal vs a normal per mode
   A schematic, not data: ten "islands" of normal readings, as in the paper's t-SNE map, with a few
   anomalies (×) sitting among them. Toggle the model's idea of normal. */
function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const ISLANDS: [number, number, number][] = [
  [92, 86, 26], [196, 64, 22], [300, 92, 28], [420, 70, 24], [490, 150, 22],
  [118, 196, 26], [232, 166, 24], [356, 196, 28], [446, 240, 22], [216, 252, 22],
];
// Anomalies sit beside an island, inside the global boundary but outside their own mode's normal.
const ANOM: [number, number, number][] = [[0, 1.55, 0.6], [2, 1.5, 3.4], [4, 1.6, 2.2], [5, 1.5, 4.4], [7, 1.55, 0.2], [9, 1.6, 5.2], [3, 1.55, 2.6]];

export function ModesSketch() {
  const [mode, setMode] = useState<"global" | "local">("global");
  const pts = useMemo(() => {
    const r = rng(7);
    return ISLANDS.flatMap(([cx, cy, s], k) => Array.from({ length: 16 }, () => {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * s * 0.78;
      return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 0.8, k };
    }));
  }, []);
  const anoms = ANOM.map(([k, f, a]) => { const [cx, cy, s] = ISLANDS[k]; return { x: cx + Math.cos(a) * s * f, y: cy + Math.sin(a) * s * f * 0.8 }; });
  const local = mode === "local";
  return (
    <Figure title="One idea of normal, or one per mode?"
      cap={<>Schematic, not data. Ten islands echo the paper’s t-SNE map of Mission 1 (Fig. 1b), which shows 10–15 operating modes with anomalies scattered across nearly every island.</>}
      chip={<PageRef p={3}>Fig. 1b</PageRef>}>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Segmented size="sm" label="The model’s idea of normal" value={mode} onChange={setMode} options={[{ value: "global", label: "One global normal" }, { value: "local", label: "A normal per mode" }]} />
        <p className={`${SANS} text-[13px] leading-[1.45] text-[var(--ink-soft)]`} aria-live="polite">
          {local ? <>Each anomaly now falls <b className="font-semibold text-[var(--prussian)]">outside its own mode’s normal</b>, and is ringed.</> : <>Every anomaly sits <b className="font-semibold">inside the one boundary</b>, so none of them looks unusual.</>}
        </p>
      </div>
      <div className="mx-auto max-w-[820px]">
      <Svg vw={560} vh={302} role="img" aria-label={local ? "Schematic: ten clusters, each with its own boundary; the anomalies fall outside their cluster's boundary." : "Schematic: ten clusters inside one large boundary; every anomaly also sits inside it."}>
        <ellipse cx="290" cy="160" rx="262" ry="140" fill="none" stroke="var(--ink)" strokeWidth="1" strokeDasharray="4 4" style={{ opacity: local ? 0 : 1, transition: "opacity 400ms var(--ease)" }} />
        <text x="290" y="16" textAnchor="middle" className={MONO} fill="var(--muted)" style={{ opacity: local ? 0 : 1, transition: "opacity 400ms var(--ease)" }}>one global boundary</text>
        {ISLANDS.map(([cx, cy, s], k) => (
          <ellipse key={k} cx={cx} cy={cy} rx={s * 0.95} ry={s * 0.8} fill="none" stroke="var(--prussian)" strokeWidth="1.1"
            style={{ opacity: local ? 1 : 0, transform: local ? "none" : "scale(1.25)", transformOrigin: `${cx}px ${cy}px`, transition: `opacity 400ms var(--ease) ${local ? k * 40 : 0}ms, transform 500ms var(--ease) ${local ? k * 40 : 0}ms` }} />
        ))}
        {pts.map((p, i) => <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="2.1" fill={local ? "var(--prussian)" : "var(--graphite)"} style={{ transition: "fill 400ms var(--ease)" }} />)}
        {anoms.map((a, i) => (
          <g key={i}>
            <path d={`M${a.x - 4},${a.y - 4} l8,8 M${a.x + 4},${a.y - 4} l-8,8`} stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx={a.x} cy={a.y} r="9" fill="none" stroke="var(--ink)" strokeWidth="1" style={{ opacity: local ? 1 : 0, transition: `opacity 300ms var(--ease) ${local ? 300 : 0}ms` }} />
          </g>
        ))}
      </Svg>
      <p className={`${SANS} mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-[var(--ink)]`} aria-hidden>
        <span className="inline-flex items-center gap-1.5"><span className="size-[6px] rounded-full transition-colors duration-300" style={{ background: local ? "var(--prussian)" : "var(--graphite)" }} />normal reading</span>
        <span className="inline-flex items-center gap-1.5"><svg width="10" height="10" viewBox="0 0 10 10"><path d="M1,1 l8,8 M9,1 l-8,8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>anomaly</span>
        <span className="inline-flex items-center gap-1.5">{local ? <><span className="h-[9px] w-[14px] rounded-[50%] border border-[var(--prussian)]" />one mode’s normal</> : <><span className="h-[9px] w-[14px] rounded-[50%] border border-dashed border-[var(--ink)]" />the one global normal</>}</span>
      </p>
      </div>
    </Figure>
  );
}

/* ================================================================== results: where each method's count of modes lands
   Two missions on one shared 0–30 axis. Above the line: the K each method chose for itself (buttons).
   Below: ESA's own counts, subsystems (ochre) and groups (Prussian). */
type Pick = { id: "kmeans" | "tvae" | "gmm"; name: string; k: Partial<Record<M, number>>; how: string; p: number; sec: string };
const PICKS: Pick[] = [
  { id: "kmeans", name: "K-Means", k: { 1: 2 }, p: 2, sec: "§3", how: "Silhouette (how tight and well separated the clusters are) peaks at K = 2 in the raw 76-channel space of Mission 1: the raw geometry favours a binary split, not four subsystem blobs." },
  { id: "tvae", name: "TransformerVAE", k: { 1: 16, 2: 18 }, p: 11, sec: "Fig. 7", how: "Clustering the VAE’s learned codes finds 16 modes on Mission 1 and 18 on Mission 2: more than the subsystems, fewer than the groups, an intermediate granularity." },
  { id: "gmm", name: "GMM by BIC", k: { 1: 21, 2: 29 }, p: 3, sec: "§4", how: "BIC selects 21 components on Mission 1, which has 18 groups, and 29 on Mission 2, which has 29 groups: near group-level granularity." },
];
const REF: Record<M, { s: number; g: number }> = { 1: { s: 4, g: 18 }, 2: { s: 5, g: 29 } };

export function Granularity({ m }: { m: M }) {
  const [sel, setSel] = useState<Pick["id"]>("gmm");
  const cur = PICKS.find((p) => p.id === sel)!;
  const left = (k: number) => `${(k / 30) * 100}%`;
  return (
    <Figure title="Where each method’s count of modes lands"
      cap={<>Above each line: the number of modes a method chose for itself. Below: ESA’s own counts. Select a method to read how it chose.</>}
      chip={<PageRef p={5}>§6</PageRef>}>
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Choose a method">
        {PICKS.map((p) => (
          <button key={p.id} type="button" aria-pressed={sel === p.id} onClick={() => setSel(p.id)}
            className={`${SANS} ${FOCUS} inline-flex h-9 items-center gap-1.5 rounded-[3px] border border-[var(--rule-strong)] px-3 text-[13px] font-medium text-[var(--ink)] transition-colors duration-200 hover:border-[var(--ink)] hover:bg-[var(--parchment)] active:bg-[var(--rule)] aria-pressed:border-[var(--ink)] aria-pressed:bg-[var(--parchment)]`}>
            <span aria-hidden className="size-[9px] rotate-45 border-[1.5px] border-[var(--ink)]" style={{ background: sel === p.id ? "var(--ink)" : "transparent" }} />
            {p.name}
          </button>
        ))}
      </div>
      <div className="space-y-10 px-3 sm:px-4">
        {([1, 2] as const).map((mm) => (
          <div key={mm}>
            <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] ${mm === m ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}>Mission {mm}{mm === m ? " · shown in the other figures" : ""}</p>
            <div className="relative mt-2 h-[96px]">
              {/* method picks, above the axis */}
              {PICKS.filter((p) => p.k[mm] != null).map((p) => {
                const on = p.id === sel;
                return (
                  <button key={p.id} type="button" onClick={() => setSel(p.id)} aria-pressed={on} aria-label={`${p.name}, Mission ${mm}: K = ${p.k[mm]}`}
                    className={`${FOCUS} group absolute top-0 flex -translate-x-1/2 flex-col items-center rounded-[2px] px-1 pb-0 transition-opacity duration-200 ${on ? "" : "opacity-60 hover:opacity-100"}`} style={{ left: left(p.k[mm]!) }}>
                    <span className={`${MONO} text-[13px] ${on ? "font-semibold text-[var(--ink)]" : "text-[var(--ink-soft)]"}`}>{p.k[mm]}</span>
                    <span aria-hidden className="mt-1 size-[11px] rotate-45 border-[1.5px] border-[var(--ink)] transition-colors duration-200 group-hover:bg-[var(--parchment)]" style={{ background: on ? "var(--ink)" : undefined }} />
                    <span aria-hidden className="h-[14px] w-px bg-[var(--ink)]" />
                  </button>
                );
              })}
              <span aria-hidden className="absolute inset-x-0 top-[48px] h-px bg-[var(--ink)]" />
              {[0, 10, 20, 30].map((t) => <span key={t} aria-hidden className="absolute top-[45px] h-[7px] w-px bg-[var(--ink)]" style={{ left: left(t) }} />)}
              {([["s", "subsystems", "var(--ochre)"], ["g", "groups", "var(--prussian)"]] as const).map(([key, word, c]) => {
                const v = REF[mm][key];
                return (
                  <span key={key} className={`${SANS} absolute top-[49px] flex flex-col text-[12px] whitespace-nowrap ${v > 25 ? "-translate-x-full items-end" : "items-start"}`} style={{ left: left(v), color: c }}>
                    <span aria-hidden className="h-[16px] w-[1.5px]" style={{ background: c }} />
                    <span className="mt-0.5 font-medium">{v} {word}</span>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
        <p aria-hidden className={`${MONO} -mt-6 flex justify-between text-[11px] text-[var(--muted)]`}><span>0 modes</span><span>30</span></p>
      </div>
      <div className="mt-6 border-t border-[var(--rule)] pt-4" aria-live="polite">
        <p className={`${SANS} text-[13px] font-medium`}>{cur.name}</p>
        <p className={`${SERIF} mt-1 max-w-[60ch] text-[17px] leading-[1.5]`}>{cur.how} <PageRef p={cur.p}>{cur.sec}</PageRef></p>
      </div>
    </Figure>
  );
}
