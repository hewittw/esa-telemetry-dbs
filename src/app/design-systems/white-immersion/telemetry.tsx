"use client";
// Section 9 · Telemetry components, built for our findings on the real exported data.
// One mission switcher (T01) drives the whole section.
import { useEffect, useMemo, useRef, useState } from "react";
import type { Curve, DSData, Row } from "./data";
import { Circle, Icon, Scramble, Segmented, StatusTag, fmt, pad, useReduced, useToast, useWidth } from "./kit";
import { Section, Spec } from "./shell";

type M = "1" | "2";
const famWord: Record<string, string> = { baseline: "Baseline", parametric: "Parametric", generative: "Generative" };
const short = (m: string) => m.replace("HierarchicalVAE", "HVAE").replace("TransformerVAE", "TVAE").replace("CapacityVAE", "CapVAE").replace("Nystroem-KPCA", "KPCA");
const DASH = ["", "5 3", "1.5 2.5", "8 3 2 3", "3 3"]; // line styles: never rely on color

/* ====================================================================== */
/* T01 · mission switcher with headline stats                              */
/* ====================================================================== */
function MissionSwitch({ d, m, setM }: { d: DSData; m: M; setM: (m: M) => void }) {
  const M = d.missions[m];
  const best = d.rows.filter((r) => r.mission === M.id).sort((a, b) => b.prAuc - a.prAuc)[0];
  const stats: [string, string][] = [
    ["Channels", String(M.channels)], ["Subsystems", String(M.subsystems)], ["Groups", String(M.groups)], ["BIC K*", String(M.k)],
    ["Test steps", fmt(M.test)], ["Anomalous", `${(M.testRate * 100).toFixed(2)}%`], ["Sampling", `${M.hz} Hz`], ["Best PR-AUC", best.prAuc.toFixed(3)],
  ];
  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Mission" value={m} set={setM} options={[{ v: "1", label: "Mission 1" }, { v: "2", label: "Mission 2" }]} />
        <span className="wids-caption">Drives every component in this section.</span>
      </div>
      <dl className="grid grid-cols-2 gap-px border border-[var(--rime)] bg-[var(--rime)] sm:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="bg-white px-3 py-3">
            <dt className="wids-label">{k}</dt>
            <dd className="wids-num mt-1 text-[18px] leading-none sm:text-[22px]"><Scramble text={v} k={m} ms={520} /></dd>
          </div>
        ))}
      </dl>
      <p className="wids-caption">Labels: {M.labels}. Best method: <span className="text-[var(--ink)]">{best.label}</span>.</p>
    </div>
  );
}

/* ====================================================================== */
/* T02 · method spec card                                                  */
/* ====================================================================== */
function MethodSpec({ d, m }: { d: DSData; m: M }) {
  const rows = d.rows.filter((r) => r.mission === +m);
  const [id, setId] = useState(rows[0].id);
  const r = rows.find((x) => x.id === id) ?? rows[0];
  useEffect(() => { setId(d.rows.filter((x) => x.mission === +m).sort((a, b) => b.prAuc - a.prAuc)[0].id); }, [m, d]);
  const chance = d.pr[m].pos;
  const bar = (v: number, max = 0.5) => `${Math.min(100, (v / max) * 100)}%`;
  return (
    <div className="grid gap-4">
      <div role="group" aria-label="Method" className="flex flex-wrap gap-1.5">
        {rows.map((x) => (
          <button key={x.id} type="button" className="wids-chip min-h-[32px] px-2.5 text-[10.5px]" aria-pressed={x.id === r.id} onClick={() => setId(x.id)}>{short(x.method)}</button>
        ))}
      </div>
      <article className="wids-card relative" data-sel="true">
        <span className="wids-corners" aria-hidden="true"><i /><i /><i /><i /></span>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div><span className="wids-label">{famWord[r.family]} · Mission {r.mission}</span><h4 className="wids-title mt-1">{r.label}</h4></div>
          {r.trendDirection === "up" ? <StatusTag s="best" label={r.trend} solid /> : r.trendDirection === "down" ? <StatusTag s="anomaly" label={r.trend} /> : <span className="wids-badge is-quiet">{r.trend}</span>}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3">
          <div><dt className="wids-label">PR-AUC</dt><dd className="wids-num text-[26px] leading-tight">{r.prAuc.toFixed(3)}</dd></div>
          <div><dt className="wids-label">ROC-AUC</dt><dd className="wids-num text-[26px] leading-tight">{r.rocAuc.toFixed(3)}</dd></div>
          <div><dt className="wids-label">Latent K</dt><dd className="wids-num text-[26px] leading-tight">{r.latentK ?? "—"}</dd></div>
          <div><dt className="wids-label">Event F1</dt><dd className="wids-num text-[26px] leading-tight">{r.eventF1?.toFixed(3) ?? "—"}</dd></div>
        </dl>
        <div className="mt-5 grid gap-1.5">
          <div className="flex justify-between"><span className="wids-label">PR-AUC vs chance ({chance.toFixed(3)}) and linear plateau (0.322)</span></div>
          <div className="relative h-[10px] bg-[var(--bg)]">
            <span className="absolute inset-y-0 left-0 bg-[var(--ink)] transition-[width] duration-500" style={{ width: bar(r.prAuc) }} />
            <span className="absolute -inset-y-1 w-px bg-[var(--muted)]" style={{ left: bar(chance) }} title="chance" />
            <span className="absolute -inset-y-1 w-0 border-l border-dashed border-[var(--ink)]" style={{ left: bar(0.322) }} title="linear plateau" />
          </div>
          <div className="wids-caption flex justify-between"><span>0</span><span>{(r.prAuc / chance).toFixed(1)}× chance · {r.prAuc >= 0.322 ? "+" : "−"}{Math.abs(r.prAuc - 0.322).toFixed(3)} vs plateau</span><span>0.5</span></div>
        </div>
        <p className="wids-caption mt-3">Scoring: {r.scoring}</p>
      </article>
    </div>
  );
}

/* ====================================================================== */
/* T03 · anomaly-threshold slider (recomputes P/R live from the PR curve)  */
/* ====================================================================== */
function pointAt(c: Curve, pos: number, flag: number) {
  // flag rate = recall · pos / precision. Find the curve point closest to the requested flag rate.
  let best = c.pts[0], bd = Infinity;
  for (const p of c.pts) { const f = p[1] > 0 ? (p[0] * pos) / p[1] : 1; const dd = Math.abs(f - flag); if (dd < bd) { bd = dd; best = p; } }
  return best;
}
function Threshold({ d, m }: { d: DSData; m: M }) {
  const toast = useToast();
  const P = d.pr[m];
  const [ci, setCi] = useState(0);
  const c = P.curves[Math.min(ci, P.curves.length - 1)];
  const [flag, setFlag] = useState(0.11);
  useEffect(() => { setCi(P.curves.findIndex((x) => x.method.startsWith("GMM"))); }, [m, P.curves]);
  const [r, p] = pointAt(c, P.pos, flag);
  const f1 = r + p > 0 ? (2 * r * p) / (r + p) : 0;
  const flagged = Math.round(flag * P.n), tp = Math.round(r * P.pos * P.n), fp = Math.max(0, flagged - tp);
  const bestF1 = () => { let b = c.pts[0], bf = 0; for (const q of c.pts) { const f = q[0] + q[1] ? (2 * q[0] * q[1]) / (q[0] + q[1]) : 0; if (f > bf) { bf = f; b = q; } } setFlag(Math.min(0.6, (b[0] * P.pos) / b[1])); toast(`Best F1 ${bf.toFixed(3)} at ${((b[0] * P.pos) / b[1] * 100).toFixed(1)}% flagged`); };
  return (
    <div className="grid gap-4">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="grid gap-1.5"><span className="wids-label text-[var(--ink)]">Method</span>
          <select className="wids-select" value={ci} onChange={(e) => setCi(+e.target.value)}>
            {P.curves.map((x, i) => <option key={x.id} value={i}>{x.method} · PR-AUC {x.prAuc.toFixed(3)}{x.table1 ? " · Table 1 run" : " · best saved run"}</option>)}
          </select>
        </label>
        <button type="button" className="wids-btn" onClick={bestF1}>Snap to best F1</button>
      </div>
      <label className="grid gap-1">
        <span className="flex items-baseline justify-between gap-3"><span className="wids-label text-[var(--ink)]">Alert threshold · top {(flag * 100).toFixed(1)}% of scores flagged</span><span className="wids-caption">{fmt(flagged)} steps</span></span>
        <input type="range" className="wids-range" min={0.5} max={60} step={0.5} value={+(flag * 100).toFixed(1)} onChange={(e) => setFlag(+e.target.value / 100)} aria-valuetext={`Top ${(flag * 100).toFixed(1)} percent flagged, precision ${p.toFixed(2)}, recall ${r.toFixed(2)}`} />
      </label>
      <dl className="grid grid-cols-3 gap-px border border-[var(--rime)] bg-[var(--rime)]">
        {[["Precision", p], ["Recall", r], ["F1", f1]].map(([k, v]) => (
          <div key={k as string} className="bg-white px-3 py-3"><dt className="wids-label">{k}</dt><dd className="wids-num text-[22px] leading-tight sm:text-[26px]">{(v as number).toFixed(3)}</dd></div>
        ))}
      </dl>
      <p className="wids-caption" aria-live="polite">{fmt(tp)} true alarms and {fmt(fp)} false alarms out of {fmt(P.n)} test steps (anomaly rate {(P.pos * 100).toFixed(2)}%).</p>
    </div>
  );
}

/* ====================================================================== */
/* T04 · PR-curve viewer with method toggles + crosshair                   */
/* ====================================================================== */
function PrViewer({ d, m }: { d: DSData; m: M }) {
  const P = d.pr[m];
  const [on, setOn] = useState<string[]>(P.curves.map((c) => c.id));
  const [rx, setRx] = useState<number | null>(null);
  useEffect(() => { setOn(d.pr[m].curves.map((c) => c.id)); setRx(null); }, [m, d]);
  const [wref, W] = useWidth<HTMLDivElement>(560);
  const H = Math.round(Math.min(360, Math.max(230, W * 0.46))), L = 40, B = 30, T = 12, R = 12;
  const X = (r: number) => L + r * (W - L - R), Y = (p: number) => T + (1 - Math.min(1, p)) * (H - T - B);
  const at = (c: Curve, r: number) => { let b = c.pts[0]; for (const q of c.pts) if (Math.abs(q[0] - r) < Math.abs(b[0] - r)) b = q; return b; };
  const svgRef = useRef<SVGSVGElement>(null);
  return (
    <div className="grid gap-3">
      <div role="group" aria-label="Curves" className="flex flex-wrap gap-1.5">
        {P.curves.map((c, i) => {
          const sel = on.includes(c.id);
          return (
            <button key={c.id} type="button" className="wids-chip min-h-[32px] px-2.5 text-[10.5px]" aria-pressed={sel} onClick={() => setOn(sel ? on.filter((x) => x !== c.id) : [...on, c.id])}>
              <svg width="18" height="6" aria-hidden="true"><line x1="0" y1="3" x2="18" y2="3" stroke="currentColor" strokeWidth="1.6" strokeDasharray={DASH[i % DASH.length]} /></svg>
              {short(c.method)} {c.prAuc.toFixed(3)}
            </button>
          );
        })}
      </div>
      <div ref={wref}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full touch-none border border-[var(--rime)] bg-white" tabIndex={0}
        role="img" aria-label={`Precision-recall curves for Mission ${m}. Arrow keys move the recall crosshair.`}
        onPointerMove={(e) => { const r = svgRef.current!.getBoundingClientRect(); const x = ((e.clientX - r.left) / r.width) * W; setRx(Math.max(0, Math.min(1, (x - L) / (W - L - R)))); }}
        onPointerLeave={() => setRx(null)}
        onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); setRx(Math.max(0, Math.min(1, (rx ?? 0.5) + (e.key === "ArrowRight" ? 0.02 : -0.02)))); } }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={X(t)} x2={X(t)} y1={T} y2={H - B} stroke="#d5dce4" />
            <line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} stroke="#d5dce4" />
            <text x={X(t)} y={H - B + 16} textAnchor="middle" fontSize="10.5" fill="#56616f" style={{ fontFamily: "var(--wi-mono)" }}>{t}</text>
            <text x={L - 6} y={Y(t) + 3} textAnchor="end" fontSize="10.5" fill="#56616f" style={{ fontFamily: "var(--wi-mono)" }}>{t}</text>
          </g>
        ))}
        <line x1={L} x2={W - R} y1={Y(P.pos)} y2={Y(P.pos)} stroke="#56616f" strokeDasharray="2 3" />
        <text x={W - R - 4} y={Y(P.pos) - 5} textAnchor="end" fontSize="10.5" fill="#56616f" style={{ fontFamily: "var(--wi-mono)" }}>CHANCE {P.pos.toFixed(3)}</text>
        {P.curves.map((c, i) => on.includes(c.id) && (
          <path key={c.id} d={"M" + c.pts.map(([r, p]) => `${X(r).toFixed(1)},${Y(p).toFixed(1)}`).join("L")} fill="none" stroke="#111824" strokeWidth={c.table1 ? 1.6 : 1.1} strokeDasharray={DASH[i % DASH.length]} />
        ))}
        {rx !== null && <line x1={X(rx)} x2={X(rx)} y1={T} y2={H - B} stroke="#111824" strokeWidth=".8" />}
        {rx !== null && P.curves.map((c) => on.includes(c.id) && (() => { const q = at(c, rx); return <rect key={c.id} x={X(q[0]) - 3} y={Y(q[1]) - 3} width="6" height="6" fill="#fff" stroke="#111824" />; })())}
        <text x={L} y={H - 4} fontSize="10.5" fill="#56616f" style={{ fontFamily: "var(--wi-mono)" }}>RECALL →</text>
        <text x={L + 4} y={T + 10} fontSize="10.5" fill="#56616f" style={{ fontFamily: "var(--wi-mono)" }}>PRECISION ↑</text>
      </svg>
      </div>
      <div className="wids-caption min-h-[40px]" aria-live="polite">
        {rx === null ? "Hover the plot, or focus it and use ← →, to read precision at a recall." : <>Recall {rx.toFixed(2)}: {P.curves.filter((c) => on.includes(c.id)).map((c) => `${short(c.method)} P = ${at(c, rx)[1].toFixed(3)}`).join(" · ")}</>}
      </div>
    </div>
  );
}

/* ====================================================================== */
/* T05 · mission timeline scrubber with anomaly segments + frame counter    */
/* ====================================================================== */
function Timeline({ d, m }: { d: DSData; m: M }) {
  const reduced = useReduced();
  const T = d.tl[m];
  const [si, setSi] = useState(0);
  const s = T.series[Math.min(si, T.series.length - 1)];
  const N = s.v.length;
  const [f, setF] = useState(Math.round(N * 0.35));
  const [play, setPlay] = useState(false);
  useEffect(() => { setSi(0); setPlay(false); }, [m]);
  useEffect(() => {
    if (!play) return;
    const id = window.setInterval(() => setF((x) => { if (x >= N - 1) { setPlay(false); return x; } return x + 1; }), reduced ? 200 : 42);
    return () => window.clearInterval(id);
  }, [play, N, reduced]);
  const W = 720, H = 170, top = 14, bot = H - 22;
  const frac = (f + 0.5) / N;
  const inSeg = T.segs.find(([a, b]) => frac >= a && frac <= b);
  const nextSeg = () => { const n = T.segs.find(([a]) => a > frac + 0.5 / N) ?? T.segs[0]; setPlay(false); setF(Math.min(N - 1, Math.floor(n[0] * N))); };
  const secPer = m === "1" ? 30 : 1 / 0.056;
  const idx = Math.round(frac * T.n);
  const days = (idx * secPer) / 86400;
  const env = "M" + s.v.map((p, i) => `${((i / (N - 1)) * W).toFixed(1)},${(bot - p[1] * (bot - top)).toFixed(1)}`).join("L");
  const med = "M" + s.v.map((p, i) => `${((i / (N - 1)) * W).toFixed(1)},${(bot - (0.1 + p[0] * 0.7) * (bot - top)).toFixed(1)}`).join("L");
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented label="Score series" value={String(si)} set={(v) => setSi(+v)} options={T.series.map((x, i) => ({ v: String(i), label: short(x.method.replace(/ \(.*\)/, "")) }))} />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-[170px] w-full border border-[var(--rime)] bg-white" aria-hidden="true">
        {T.segs.map(([a, b], i) => <rect key={i} x={a * W} width={Math.max(0.8, (b - a) * W)} y={top - 6} height={bot - top + 6} fill="#111824" opacity=".08" />)}
        {T.segs.map(([a, b], i) => <rect key={"t" + i} x={a * W} width={Math.max(0.8, (b - a) * W)} y={top - 8} height="2" fill="#111824" />)}
        <path d={env} fill="none" stroke="#56616f" strokeWidth=".8" vectorEffect="non-scaling-stroke" opacity=".7" />
        <path d={med} fill="none" stroke="#111824" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        <line x1={frac * W} x2={frac * W} y1={0} y2={H} stroke="#111824" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <line x1="0" x2={W} y1={bot + 0.5} y2={bot + 0.5} stroke="#d5dce4" vectorEffect="non-scaling-stroke" />
      </svg>
      <input type="range" className="wids-range" min={0} max={N - 1} value={f} onChange={(e) => { setPlay(false); setF(+e.target.value); }}
        aria-label="Timeline scrubber" aria-valuetext={`Frame ${f + 1} of ${N}, timestep ${fmt(idx)}, ${inSeg ? "inside a labelled anomaly" : "nominal"}`} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Circle small label={play ? "Pause playback" : "Play through the mission"} icon={play ? "pause" : "play"} pressed={play} onClick={() => { if (f >= N - 1) setF(0); setPlay(!play); }} />
          <button type="button" className="wids-btn" onClick={nextSeg}>Next anomaly <Icon n="right" size={12} /></button>
        </div>
        <dl className="wids-hud wids-tick flex flex-wrap gap-x-5">
          <div className="flex gap-2"><dt className="text-[var(--muted)]">Frame</dt><dd>{pad(f + 1, 3)} / {N}</dd></div>
          <div className="flex gap-2"><dt className="text-[var(--muted)]">T</dt><dd>+{fmt(idx)}</dd></div>
          <div className="flex gap-2"><dt className="text-[var(--muted)]">Day</dt><dd>{days.toFixed(0)}</dd></div>
        </dl>
        {inSeg ? <StatusTag s="anomaly" label="Inside anomaly" solid /> : <StatusTag s="nominal" />}
      </div>
      <p className="wids-caption">{T.segs.length} labelled anomaly segments in {fmt(T.n)} test steps · score scaled to the 1st–99th percentile · line = median, grey = bin max.</p>
    </div>
  );
}

/* ====================================================================== */
/* T06 · BIC-vs-K picker                                                   */
/* ====================================================================== */
function BicPicker({ d, m }: { d: DSData; m: M }) {
  const sw = d.bic[m], ref = d.bicRef[m];
  const [k, setK] = useState(ref.selected);
  useEffect(() => setK(d.bicRef[m].selected), [m, d]);
  const [wref, W] = useWidth<HTMLDivElement>(560);
  const H = 240, L = 14, R = 14, T = 18, B = 34;
  const ks = sw.map((p) => p.k), bs = sw.map((p) => p.bic);
  const k0 = Math.min(...ks), k1 = Math.max(...ks), b0 = Math.min(...bs), b1 = Math.max(...bs);
  // log-ish vertical scale so the long tail after the elbow stays readable
  const X = (x: number) => Math.round((L + ((x - k0) / (k1 - k0)) * (W - L - R)) * 100) / 100;
  const Y = (b: number) => Math.round((T + (1 - Math.log1p(((b - b0) / (b1 - b0)) * 60) / Math.log1p(60)) * (H - T - B)) * 100) / 100;
  const cur = sw.find((p) => p.k === k)!, best = sw.find((p) => p.k === ref.selected)!;
  const rel = ((cur.bic - best.bic) / best.bic) * 100;
  const zone = k < ref.subsystems ? "below the subsystem count" : k <= ref.subsystems + 1 ? "at subsystem scale" : k < ref.groups - 3 ? "between subsystems and groups" : k <= ref.groups + 3 ? "at operational-group scale" : "past the group count";
  return (
    <div className="grid gap-3" ref={wref}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full border border-[var(--rime)] bg-white" role="group" aria-label={`BIC against K for Mission ${m}. Selected K* = ${ref.selected}.`}>
        <rect x={X(ref.subsystems) - 4} width="8" y={T} height={H - T - B} fill="#111824" opacity=".06" />
        <rect x={X(Math.min(ref.groups, k1)) - 4} width="8" y={T} height={H - T - B} fill="#111824" opacity=".06" />
        <text x={X(ref.subsystems) + 6} y={T + 10} fontSize="10.5" fill="#56616f" style={{ fontFamily: "var(--wi-mono)" }}>{ref.subsystems} SUBSYSTEMS</text>
        <text x={X(Math.min(ref.groups, k1)) - 6} y={T + 24} textAnchor="end" fontSize="10.5" fill="#56616f" style={{ fontFamily: "var(--wi-mono)" }}>{ref.groups} GROUPS</text>
        <path d={"M" + sw.map((p) => `${X(p.k).toFixed(1)},${Y(p.bic).toFixed(1)}`).join("L")} fill="none" stroke="#111824" strokeWidth="1.2" />
        {sw.map((p) => (
          <g key={p.k}>
            <rect x={X(p.k) - 9} y={T} width="18" height={H - T - B + 20} fill="transparent" className="cursor-pointer" onClick={() => setK(p.k)} />
            <rect x={X(p.k) - (p.k === k ? 4.5 : 2.5)} y={Y(p.bic) - (p.k === k ? 4.5 : 2.5)} width={p.k === k ? 9 : 5} height={p.k === k ? 9 : 5}
              fill={p.k === ref.selected ? "#111824" : "#fff"} stroke="#111824" pointerEvents="none" />
            {((p.k % 4 === 0 && Math.abs(p.k - ref.selected) > 1) || p.k === ref.selected) && <text x={X(p.k)} y={H - B + 18} textAnchor="middle" fontSize="10.5" fill={p.k === ref.selected ? "#111824" : "#56616f"} style={{ fontFamily: "var(--wi-mono)" }}>{p.k}</text>}
          </g>
        ))}
        <line x1={X(k)} x2={X(k)} y1={T} y2={H - B} stroke="#111824" strokeDasharray="2 3" />
        <text x={W - R} y={H - 4} textAnchor="end" fontSize="10.5" fill="#56616f" style={{ fontFamily: "var(--wi-mono)" }}>K →  ■ = BIC MIN</text>
      </svg>
      <label className="grid gap-1"><span className="wids-label text-[var(--ink)]">K = {k}</span>
        <input type="range" className="wids-range" min={k0} max={k1} value={k} onChange={(e) => setK(+e.target.value)} aria-valuetext={`K ${k}, BIC ${rel <= 0 ? "minimum" : `${((cur.bic - best.bic) / 1e6).toFixed(2)} million above minimum`}, ${zone}`} />
      </label>
      <div className="flex flex-wrap items-center gap-3" aria-live="polite">
        {k === ref.selected ? <StatusTag s="best" label={`K* = ${k} · BIC minimum`} solid /> : <span className="wids-badge">ΔBIC +{((cur.bic - best.bic) / 1e6).toFixed(2)}M vs K*</span>}
        <span className="wids-caption">K = {k} is {zone}.</span>
        {k !== ref.selected && <button type="button" className="wids-btn is-ghost" onClick={() => setK(ref.selected)}>Snap to K*</button>}
      </div>
    </div>
  );
}

/* ====================================================================== */
/* T07 · channel hierarchy explorer (76 → 18 → 4)                          */
/* ====================================================================== */
function Hierarchy({ d, m }: { d: DSData; m: M }) {
  const H = d.hier[m];
  const [s, setS] = useState(0);
  const [g, setG] = useState(0);
  useEffect(() => { setS(0); setG(0); }, [m]);
  const sub = H[Math.min(s, H.length - 1)];
  const grp = sub.groups[Math.min(g, sub.groups.length - 1)];
  const nCh = H.reduce((a, x) => a + x.groups.reduce((b, y) => b + y.channels.length, 0), 0);
  const nG = H.reduce((a, x) => a + x.groups.length, 0);
  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3 wids-num text-[22px] sm:text-[28px]" aria-label={`${nCh} channels in ${nG} groups in ${H.length} subsystems`}>
        <span>{nCh}</span><Icon n="arrow" size={14} /><span>{nG}</span><Icon n="arrow" size={14} /><span>{H.length}</span>
        <span className="wids-label ml-1 self-end pb-1" style={{ fontFamily: "var(--wi-mono)" }}>channels · groups · subsystems</span>
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)]">
        <div>
          <span className="wids-label">Subsystem</span>
          <div role="listbox" aria-label="Subsystems" className="mt-1 border-t border-[var(--ink)]">
            {H.map((x, i) => (
              <button key={x.subsystem} type="button" role="option" aria-selected={s === i} className="wids-row grid-cols-[1fr_auto] min-h-[40px]" onClick={() => { setS(i); setG(0); }}>
                <span className="text-[12px]">{x.subsystem}</span><span className="wids-label">{x.groups.reduce((a, y) => a + y.channels.length, 0)} ch</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="wids-label">Group in {sub.subsystem}</span>
          <div role="listbox" aria-label="Groups" className="mt-1 max-h-[240px] overflow-y-auto border-t border-[var(--ink)]">
            {sub.groups.map((x, i) => (
              <button key={x.group} type="button" role="option" aria-selected={g === i} className="wids-row grid-cols-[1fr_auto] min-h-[40px]" onClick={() => setG(i)}>
                <span className="text-[12px]">Group {pad(x.group)}</span><span className="wids-label">{x.channels.length} ch</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="wids-label">Channels in group {pad(grp.group)}</span>
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-live="polite">
            {grp.channels.map((c) => (
              <li key={c.name} className="wids-badge" style={c.target ? { background: "var(--ink)", color: "#fff" } : undefined}>
                {c.target && <svg width="8" height="8" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1.2 9 8.6H1Z" fill="currentColor" /></svg>}
                {c.name}{c.target ? " · target" : ""}
              </li>
            ))}
          </ul>
          <p className="wids-caption mt-2">▲ target = channel carries anomaly labels.</p>
        </div>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* T08 · results table with sort                                           */
/* ====================================================================== */
type Key = "label" | "prAuc" | "rocAuc" | "eventF1" | "latentK";
function ResultsTable({ d, m }: { d: DSData; m: M }) {
  const [scope, setScope] = useState<"mission" | "all">("all");
  const [key, setKey] = useState<Key>("prAuc");
  const [dir, setDir] = useState<1 | -1>(-1);
  const rows = useMemo(() => {
    const base = d.rows.filter((r) => scope === "all" || r.mission === +m);
    return [...base].sort((a, b) => {
      const av = a[key], bv = b[key];
      if (av === null) return 1; if (bv === null) return -1;
      return (typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number)) * dir;
    });
  }, [d, scope, m, key, dir]);
  const th = (k: Key, label: string, right = false) => (
    <th scope="col" aria-sort={key === k ? (dir === 1 ? "ascending" : "descending") : "none"} className={`py-0 font-normal ${right ? "text-right" : ""}`}>
      <button type="button" className={`wids-label inline-flex min-h-[40px] items-center gap-1.5 px-1 text-[var(--ink)] hover:bg-white ${right ? "flex-row-reverse" : ""}`}
        onClick={() => { if (key === k) setDir(dir === 1 ? -1 : 1); else { setKey(k); setDir(k === "label" ? 1 : -1); } }}>
        {label}<span aria-hidden="true" className={key === k ? "" : "opacity-40"}>{key === k ? (dir === 1 ? "↑" : "↓") : "↕"}</span>
      </button>
    </th>
  );
  const top: Record<string, number> = {};
  for (const r of d.rows) top[r.mission] = Math.max(top[r.mission] ?? 0, r.prAuc);
  return (
    <div className="grid gap-3">
      <Segmented label="Rows" value={scope} set={setScope} options={[{ v: "all", label: "Both missions" }, { v: "mission", label: `Mission ${m} only` }]} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-[12px]">
          <caption className="wids-caption pb-2 text-left">Table 1 · point-wise and event-wise performance. Click a header to sort.</caption>
          <thead><tr className="border-b border-[var(--ink)] text-left">{th("label", "Method")}<th scope="col" className="wids-label px-1 font-normal">Scoring</th>{th("latentK", "K", true)}{th("prAuc", "PR-AUC", true)}{th("rocAuc", "ROC", true)}{th("eventF1", "Event F1", true)}<th scope="col" className="wids-label px-1 text-right font-normal">Trend</th></tr></thead>
          <tbody>
            {rows.map((r: Row) => (
              <tr key={r.id} className="border-b border-[var(--rime)] hover:bg-white" style={r.prAuc === top[r.mission] ? { boxShadow: "inset 4px 0 0 #111824" } : undefined}>
                <td className="py-2 pl-2 pr-1">{r.label}</td>
                <td className="wids-caption px-1">{r.scoring}</td>
                <td className="px-1 text-right tabular-nums">{r.latentK ?? "—"}</td>
                <td className="px-1 text-right">
                  <span className="inline-flex items-center gap-2"><span className="hidden h-[3px] w-[60px] bg-[var(--rime)] sm:inline-block"><span className="block h-full bg-[var(--ink)]" style={{ width: `${(r.prAuc / 0.45) * 100}%` }} /></span>
                    <span className={`wids-num ${r.prAuc === top[r.mission] ? "font-medium" : ""}`}>{r.prAuc.toFixed(3)}</span></span>
                </td>
                <td className="px-1 text-right tabular-nums">{r.rocAuc.toFixed(3)}</td>
                <td className="px-1 text-right tabular-nums">{r.eventF1?.toFixed(3) ?? "—"}</td>
                <td className="py-2 pl-1 pr-2 text-right">{r.trendDirection === "up" ? "↑ " : r.trendDirection === "down" ? "↓ " : ""}{r.trend.replace(/ [↑↓]/, "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="wids-caption">4px rail = best PR-AUC per mission. — = not computed for that method.</p>
    </div>
  );
}

/* ====================================================================== */
/* T09 · anomaly event card                                                */
/* ====================================================================== */
function EventCard({ d, m }: { d: DSData; m: M }) {
  const c = m === "1" ? d.catalogue.m1 : d.catalogue.m2;
  const cats = Object.entries(c.cat).sort((a, b) => b[1] - a[1]);
  const [cat, setCat] = useState(cats[0][0]);
  useEffect(() => setCat((m === "1" ? d.catalogue.m1 : d.catalogue.m2).cat["Anomaly"] ? "Anomaly" : "Rare Event"), [m, d]);
  const dur = c.dur[cat];
  const kind = (k: string) => (k === "Anomaly" ? "anomaly" : k === "Rare Event" ? "rare" : "gap") as "anomaly" | "rare" | "gap";
  return (
    <div className="grid gap-4">
      <div role="group" aria-label="Event category" className="flex flex-wrap gap-1.5">
        {cats.map(([k, v]) => (
          <button key={k} type="button" className="wids-chip" aria-pressed={cat === k} onClick={() => setCat(k)}>{k} · {v}</button>
        ))}
      </div>
      <article className="wids-card relative" data-sel="true">
        <span className="wids-corners" aria-hidden="true"><i /><i /><i /><i /></span>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusTag s={kind(cat)} label={cat} solid />
          <span className="wids-label">Mission {m} · {c.n} events</span>
        </div>
        <p className="mt-3"><span className="wids-num text-[34px] leading-none">{c.cat[cat]}</span><span className="wids-label ml-2">events · {((c.cat[cat] / c.n) * 100).toFixed(0)}%</span></p>
        <div className="mt-3 h-[6px] bg-[var(--bg)]"><span className="block h-full bg-[var(--ink)] transition-[width] duration-500" style={{ width: `${(c.cat[cat] / c.n) * 100}%` }} /></div>
        {dur && (
          <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-[var(--rime)] pt-3">
            <div><dt className="wids-label">Median</dt><dd className="wids-num text-[17px]">{dur.p50} h</dd></div>
            <div><dt className="wids-label">Longest</dt><dd className="wids-num text-[17px]">{dur.max} h</dd></div>
            <div><dt className="wids-label">Segments</dt><dd className="wids-num text-[17px]">{fmt(dur.count)}</dd></div>
          </dl>
        )}
        <dl className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
          <div><dt className="wids-label">Dimensionality</dt><dd>{Object.entries(c.dim).map(([k, v]) => `${k} ${v}`).join(" · ")}</dd></div>
          <div><dt className="wids-label">Locality</dt><dd>{Object.entries(c.loc).map(([k, v]) => `${k} ${v}`).join(" · ")}</dd></div>
        </dl>
        {m === "1" && cat === "Anomaly" && <p className="wids-caption mt-3 border-t border-[var(--rime)] pt-3">Longest test anomaly: {fmt(d.longest.timesteps)} timesteps (~{d.longest.hours} h), from {d.longest.start}.</p>}
      </article>
    </div>
  );
}

/* ====================================================================== */
export function TelemetrySection({ d }: { d: DSData }) {
  const [m, setM] = useState<M>("1");
  return (
    <Section id="telemetry" n={9} title="Telemetry" intro={<>Nine components that only make sense for this project, each running on the exported data: Table 1, the saved PR curves, 1,500-bin score timelines, the GMM BIC sweeps, the ESA channel tree and the anomaly catalogue. The mission switcher at the top drives all of them.</>}>
      <div className="grid gap-5 md:grid-cols-2">
        <Spec code="T01" name="Mission switcher" use="Switch every view between Mission 1 and Mission 2; headline stats decode in place." tokens="segmented · Numeral 22 · scramble 520ms" wide><MissionSwitch d={d} m={m} setM={setM} /></Spec>
        <Spec code="T02" name="Method spec card" use="One method at a glance: family, K, both AUCs, trend, and distance to chance and to the linear plateau." tokens="slab + corners · Numeral 26 · Ink bar · dashed plateau tick"><MethodSpec d={d} m={m} /></Spec>
        <Spec code="T03" name="Anomaly-threshold slider" use="Pick an alert budget and read precision, recall and F1 live from the saved PR curve (flag rate = recall × base rate ÷ precision)." tokens="range 1px Ink track · 18px thumb · Numeral 26"><Threshold d={d} m={m} /></Spec>
        <Spec code="T04" name="PR-curve viewer" use="Compare saved PR curves; each method is a line style, not a color. Crosshair reads precision at any recall." tokens="1.1–1.6px Ink · dash patterns · chance line Glacier" wide><PrViewer d={d} m={m} /></Spec>
        <Spec code="T05" name="Mission timeline scrubber" use="Scrub or play the test set; the frame counter and status say when you are inside a labelled anomaly." tokens="anomaly band Ink 8% + 2px tick · 1.5px playhead · HUD readout" wide><Timeline d={d} m={m} /></Spec>
        <Spec code="T06" name="BIC-vs-K picker" use="Pick K and see how far BIC is from its minimum, against the subsystem and group counts." tokens="■ = minimum · bands at reference counts · dashed cursor"><BicPicker d={d} m={m} /></Spec>
        <Spec code="T09" name="Anomaly event card" use="One event category: count, share, duration and type, from the ESA catalogue." tokens="slab + corners · solid status tag · Numeral 34"><EventCard d={d} m={m} /></Spec>
        <Spec code="T07" name="Channel hierarchy explorer" use={`Walk the ESA tree, ${d.missions[m].channels} channels → ${d.missions[m].groups} groups → ${d.missions[m].subsystems} subsystems.`} tokens="list rows · 4px rail selected · tags" wide><Hierarchy d={d} m={m} /></Spec>
        <Spec code="T08" name="Results table with sort" use="All of Table 1. Headers sort (aria-sort), and the best per mission gets the rail." tokens="Ink header rule · Rime rows · tabular numerals" wide><ResultsTable d={d} m={m} /></Spec>
      </div>
    </Section>
  );
}
