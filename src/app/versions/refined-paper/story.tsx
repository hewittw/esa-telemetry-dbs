"use client";

// The story's figures: findings cards with page footnotes, the R2D3 sticky channel graphic,
// the parchment GMM node diagram (inline explorer), and a mission-switched set of small multiples.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Bic, Channel, Gmm, PrSet } from "../../design-systems/refined-paper/data";
import { Svg, useInView } from "../../design-systems/refined-paper/fig";
import { FOCUS, IconArrow, IconCheck, IconPause, IconPlay, IconStep, MONO, SANS, SERIF, btnTransport, btnTransportMain, caption, chip, chipCheck } from "../../design-systems/refined-paper/kit";
import { LinkedMultiples } from "../../design-systems/refined-paper/novel";
import { Segmented, XScroll } from "../../design-systems/refined-paper/ui";
import { PageRef } from "./reader";

/* ================================================================== findings grid */
function MiniNodes({ labels, hot }: { labels: string[]; hot: number }) {
  // A tiny stacked-card circuit; the one path that matters is drawn in ink, the rest in faint oxblood.
  const W = 200, H = 120;
  const xs = labels.slice(1).map((_, i, a) => 30 + (i * (W - 60)) / Math.max(1, a.length - 1));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden>
      {xs.map((x, i) => (
        <path key={i} d={`M${x},88 C${x},60 ${W / 2},60 ${W / 2},38`} fill="none" stroke={i === hot ? "var(--ink)" : "var(--oxblood)"} strokeOpacity={i === hot ? 1 : 0.4} strokeWidth={i === hot ? 1.5 : 0.9} />
      ))}
      {[[W / 2, 24, labels[0], true] as const, ...xs.map((x, i) => [x, 100, labels[i + 1], i === hot] as const)].map(([x, y, t, h], i) => (
        <g key={i}>
          <rect x={x - 25 + 2.5} y={y - 11 + 2.5} width="50" height="22" rx="2" fill="var(--paper)" stroke={h ? "var(--ink)" : "var(--oxblood)"} strokeWidth="0.6" strokeOpacity={h ? 1 : 0.6} />
          <rect x={x - 25} y={y - 11} width="50" height="22" rx="2" fill={h ? "var(--mount)" : "var(--parchment)"} stroke={h ? "var(--ink)" : "var(--oxblood)"} strokeWidth={h ? 1 : 0.75} strokeOpacity={h ? 1 : 0.6} />
          <text x={x} y={y} dy="0.35em" textAnchor="middle" style={{ fontSize: 11.5 }} className={MONO} fill="var(--ink)">{t}</text>
        </g>
      ))}
    </svg>
  );
}

const FINDINGS: { t: string; d: ReactNode; href: string; fig: string; p: number; ref: string; nodes: string[]; hot: number }[] = [
  { t: "Groups, not subsystems", d: "BIC picks K = 21 and K = 29: beside the 18 and 29 operational groups, far from the 4 and 5 subsystems.", href: "#structure", fig: "The channel figure", p: 5, ref: "§6", nodes: ["K 21", "4 sub", "18 grp", "76 ch"], hot: 1 },
  { t: "A mixture model leads Mission 1", d: "GMM reaches PR-AUC 0.384 and ROC-AUC 0.692, above every VAE (best ROC-AUC 0.628).", href: "#methods", fig: "The methods", p: 5, ref: "Table 1", nodes: ["0.384", "PCA", "GMM", "VAE"], hot: 1 },
  { t: "A VAE leads Mission 2", d: "TransformerVAE reaches 0.438 on Mission 2’s rare operational events, against GMM’s 0.390.", href: "#methods", fig: "The methods", p: 5, ref: "Table 1", nodes: ["0.438", "Cap", "Hier", "Trans"], hot: 2 },
  { t: "Linear methods stop at 0.322", d: "K-Means and PCA reconstruction land on the same PR-AUC, ROC-AUC ≈ 0.62, however they are tuned.", href: "#evidence", fig: "The PR figure", p: 3, ref: "Fig. 1a", nodes: ["0.322", "K-M", "PCA", "KPCA"], hot: 0 },
  { t: "Global scores forget a fault", d: "On the longest Mission 1 fault, 967 hours, K-Means and PCA spike at onset, then go blind once the satellite settles in.", href: "#fault", fig: "The fault scrubber", p: 7, ref: "Fig. 3", nodes: ["967 h", "onset", "drift", "end"], hot: 1 },
  { t: "Latent maps agree", d: "TransformerVAE recovers latent K = 16 on Mission 1 and 18 on Mission 2: between the subsystems and the groups.", href: "#structure", fig: "The structure", p: 11, ref: "Fig. 7", nodes: ["16 · 18", "M1", "VAE", "M2"], hot: 1 },
];

export function FindingsGrid() {
  return (
    <div className="@container">
      <ul className="grid gap-4 @[34rem]:grid-cols-2 @[52rem]:grid-cols-3">
        {FINDINGS.map((f, k) => (
          <li key={f.t} className="flex h-full flex-col rounded-[3px] border border-[var(--rule)] bg-[var(--mount)]">
            <span className="block border-b border-[var(--rule)] px-6 pt-3 pb-2"><span className="mx-auto block max-w-[220px]"><MiniNodes labels={f.nodes} hot={f.hot} /></span></span>
            <div className="flex flex-1 flex-col px-5 pt-4 pb-3">
              <p className={`${MONO} text-[11px] text-[var(--muted)]`}>{String(k + 1).padStart(2, "0")}</p>
              <h3 className={`${SERIF} mt-1 text-[21px] leading-[1.2] font-[450] text-[var(--ink)]`}>{f.t}</h3>
              <p className={`${SANS} mt-1.5 text-[13.5px] leading-[1.5] text-[var(--ink-soft)]`}>{f.d}</p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
                <a href={f.href} className={`${SANS} ${FOCUS} -ml-1 inline-flex min-h-9 items-center gap-1.5 rounded-[2px] px-1 text-[13px] font-medium text-[var(--ink)] underline decoration-[var(--rule-strong)] underline-offset-4 transition-colors duration-200 hover:decoration-[var(--ink)] active:text-[var(--muted)]`}>
                  {f.fig} <IconArrow size={11} />
                </a>
                <PageRef p={f.p}>{f.ref}</PageRef>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ================================================================== R2D3 sticky graphic: 76 dots regroup */
export function ScrollyChannels({ channels }: { channels: Channel[] }) {
  const [step, setStep] = useState(0);
  const steps = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setStep(+(e.target as HTMLElement).dataset.step!)), { rootMargin: "-45% 0px -45% 0px" });
    steps.current.forEach((s) => s && io.observe(s));
    return () => io.disconnect();
  }, []);
  const W = 420, H = 300;
  const subs = useMemo(() => Array.from(new Set(channels.map((c) => c.s))), [channels]);
  const groups = useMemo(() => Array.from(new Set(channels.map((c) => c.g))).sort((a, b) => subs.indexOf(channels.find((c) => c.g === a)!.s) - subs.indexOf(channels.find((c) => c.g === b)!.s) || a - b), [channels, subs]);
  const pos = useMemo(() => {
    const out: Record<number, [number, number][]> = { 0: [], 1: [], 2: [] };
    const sorted = [...channels].sort((a, b) => a.id - b.id);
    sorted.forEach((c, i) => (out[0][c.id] = [30 + (i % 19) * 20, 110 + Math.floor(i / 19) * 22]));
    subs.forEach((s, si) => channels.filter((c) => c.s === s).forEach((c, j) => (out[1][c.id] = [62 + si * 100 - 28 + (j % 5) * 14, 62 + Math.floor(j / 5) * 14])));
    groups.forEach((g, gi) => channels.filter((c) => c.g === g).forEach((c, j) => (out[2][c.id] = [12 + (gi % 6) * 66 + 22 + (j % 3) * 11, 40 + Math.floor(gi / 6) * 86 + Math.floor(j / 3) * 11])));
    return out;
  }, [channels, subs, groups]);
  const COLOR = ["var(--ink)", "var(--ochre)", "var(--prussian)"];
  const TEXT: [string, ReactNode][] = [
    ["76 channels", <>Mission 1 streams <b className="font-semibold">76 channels</b>, one reading every 30 seconds, for years.</>],
    ["4 subsystems", <>ESA files them under <b className="font-semibold text-[var(--ochre)]">4 subsystems</b>. If the structure lived here, a model with 4 or 5 modes would fit best. It doesn’t.</>],
    ["18 groups", <>Inside the subsystems sit <b className="font-semibold text-[var(--prussian)]">18 operational groups</b>. That is the level the data organises itself at.</>],
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
      <div className="sticky top-[56px] z-[1] -mx-1 self-start bg-[var(--paper)] px-1 pt-2 pb-2 min-[1100px]:top-10 lg:order-2 lg:pb-0">
        <div className="rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] p-3">
          <Svg vw={W} vh={H} className="max-h-[36vh] lg:max-h-none" role="img" aria-label={`Mission 1 channels as dots. Step ${step + 1}: ${TEXT[step][0]}.`}>
            {step === 1 && subs.map((s, si) => (
              <text key={s} x={62 + si * 100} y={232} textAnchor="middle" className={`${MONO} rpd-fade`} fill="var(--ochre)">S{s} · {channels.filter((c) => c.s === s).length}</text>
            ))}
            {step === 2 && groups.map((g, gi) => (
              <text key={g} x={12 + (gi % 6) * 66 + 33} y={40 + Math.floor(gi / 6) * 86 + 50} textAnchor="middle" className={`${MONO} rpd-t-sm rpd-fade`} fill="var(--muted)">G{g}</text>
            ))}
            {step === 0 && <text x={W / 2} y={84} textAnchor="middle" className={`${MONO} rpd-fade`} fill="var(--muted)">channel_1 … channel_76</text>}
            {channels.map((c) => {
              const [px, py] = pos[step][c.id];
              return (
                <g key={c.id} style={{ transform: `translate(${px}px, ${py}px)`, transition: `transform 900ms var(--ease) ${(c.id % 19) * 12}ms` }}>
                  <circle r={step === 2 ? 4 : 5} fill={COLOR[step]} style={{ transition: "fill 500ms" }} />
                </g>
              );
            })}
          </Svg>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className={caption}>Step {step + 1} of 3 · {TEXT[step][0]}</span>
            <span className="flex gap-1">
              {TEXT.map(([t], k) => (
                <button key={t} type="button" aria-label={`Go to step ${k + 1}: ${t}`} aria-current={step === k ? "step" : undefined}
                  onClick={() => steps.current[k]?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
                  className={`${FOCUS} grid size-8 place-items-center rounded-[2px] transition-colors duration-200 hover:bg-[var(--parchment)] active:bg-[var(--rule)]`}>
                  <span className={`block h-[3px] w-4 rounded-[1px] transition-colors duration-300 ${step === k ? "bg-[var(--ink)]" : "bg-[var(--rule-strong)]"}`} />
                </button>
              ))}
            </span>
          </div>
        </div>
      </div>
      <div className="lg:order-1">
        {TEXT.map(([t, body], k) => (
          <div key={t} ref={(el) => { steps.current[k] = el; }} data-step={k} className={`flex min-h-[46vh] items-center py-6 transition-opacity duration-300 lg:min-h-[62vh] ${step === k ? "opacity-100" : "opacity-35"}`}>
            <div>
              <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>{String(k + 1).padStart(2, "0")} · {t}</p>
              <p className={`${SERIF} mt-2 max-w-[24ch] text-[23px] leading-[1.4] text-[var(--ink)] sm:text-[27px]`}>{body}</p>
              {k === 0 && <p className={`${SERIF} mt-5 inline-flex items-center gap-2 text-[15px] italic text-[var(--muted)]`}>Keep scrolling <span aria-hidden className="rpd-cue inline-block">↓</span></p>}
            </div>
          </div>
        ))}
        <p className={`${caption} pb-2`}>Channel metadata from ESA-Mission1/channels.csv. Dots move, never re-draw, so each one can be followed from step to step.</p>
      </div>
    </div>
  );
}

/* ================================================================== Distill step player: BIC against K (K* label sits beside its ring, never on the group label) */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export function BicPlayer({ sweeps }: { sweeps: Bic[] }) {
  const [m, setM] = useState<1 | 2>(1);
  const b = sweeps[m - 1];
  const n = b.sweep.length;
  const [i, setI] = useState(n - 1);
  const [playing, setPlaying] = useState(false);
  const pickMission = (v: 1 | 2) => { setM(v); setI(sweeps[v - 1].sweep.length - 1); setPlaying(false); };
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setI((v) => (v >= n - 1 ? (setPlaying(false), v) : v + 1)), 360);
    return () => clearInterval(t);
  }, [playing, n]);
  const W = 580, H = 280, L = 52, R = 16, T = 24, B = 40;
  const ks = b.sweep.map((s) => s.k), bics = b.sweep.map((s) => s.bic);
  const x = (k: number) => L + ((k - ks[0]) / (ks[n - 1] - ks[0])) * (W - L - R);
  const lo = Math.min(...bics), hi = Math.max(...bics);
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const d = (upto: number) => b.sweep.slice(0, upto + 1).map((s, j) => `${j ? "L" : "M"}${x(s.k).toFixed(1)},${y(s.bic).toFixed(1)}`).join("");
  const minI = b.sweep.findIndex((s) => s.k === b.selectedK);
  const cur = b.sweep[Math.min(i, n - 1)];
  const go = (v: number) => { setPlaying(false); setI(clamp(v, 0, n - 1)); };
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Mission" value={m} onChange={pickMission} options={[{ value: 1, label: "Mission 1" }, { value: 2, label: "Mission 2" }]} />
        <p className={`${MONO} text-[12px] text-[var(--muted)]`}>Step <span className="text-[var(--ink)]">{String(i + 1).padStart(2, "0")}</span> / {n}</p>
      </div>
      <Svg vw={W} vh={H} className="mt-4" role="img" aria-label={`BIC against K for Mission ${m}. Current K ${cur.k}, BIC ${cur.bic.toFixed(2)} million. Minimum at K ${b.selectedK}.`}>
        {[[b.subsystems, "subsystems"], [b.groups, "groups"]].map(([k, t]) => (
          <g key={t}>
            <line x1={x(+k)} x2={x(+k)} y1={T - 8} y2={H - B} stroke="var(--rule-strong)" strokeDasharray="2 3" />
            <text x={x(+k) + (t === "groups" && +k > 26 ? -5 : 5)} y={T - 12} textAnchor={t === "groups" && +k > 26 ? "end" : "start"} className={MONO} fill="var(--muted)">{k} {t}</text>
          </g>
        ))}
        <path d={d(n - 1)} fill="none" stroke="var(--rule)" strokeWidth="1.25" />
        <path d={d(i)} fill="none" stroke="var(--prussian)" strokeWidth="1.8" strokeLinejoin="round" />
        {b.sweep.slice(0, i + 1).map((s) => <circle key={s.k} cx={x(s.k)} cy={y(s.bic)} r="2" fill="var(--prussian)" />)}
        {i >= minI && (
          <g className="rpd-fade">
            <circle cx={x(b.selectedK)} cy={y(b.sweep[minI].bic)} r="7" fill="none" stroke="var(--accent)" strokeWidth="1.6" />
            <text x={x(b.selectedK) + (b.selectedK > 25 ? -12 : 12)} y={y(b.sweep[minI].bic) - 12} textAnchor={b.selectedK > 25 ? "end" : "start"} className={MONO} fill="var(--accent-ink)" stroke="var(--paper)" strokeWidth="4" paintOrder="stroke">K* = {b.selectedK}</text>
          </g>
        )}
        <circle cx={x(cur.k)} cy={y(cur.bic)} r="4.5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
        <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="var(--ink)" strokeWidth="0.75" />
        {[2, 5, 10, 15, 20, 25, 30].map((k) => <text key={k} x={x(k)} y={H - B} dy="1.4em" textAnchor="middle" className={MONO} fill="var(--muted)">{k}</text>)}
        <text x={W - R} y={H - B} dy="2.8em" textAnchor="end" className={MONO} fill="var(--muted)">components K</text>
        <text x={L - 8} y={y(hi)} dy="0.35em" textAnchor="end" className={MONO} fill="var(--muted)">{hi.toFixed(0)}M</text>
        <text x={L - 8} y={y(lo)} dy="0.35em" textAnchor="end" className={MONO} fill="var(--muted)">{lo.toFixed(1)}M</text>
      </Svg>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" aria-pressed={playing} aria-label={playing ? "Pause sweep" : "Play sweep"} onClick={() => { if (!playing && i >= n - 1) setI(0); setPlaying((p) => !p); }} className={btnTransportMain}>{playing ? <IconPause /> : <IconPlay />}</button>
        <button type="button" aria-label="Previous K" disabled={i === 0} onClick={() => go(i - 1)} className={btnTransport}><IconStep back /></button>
        <button type="button" aria-label="Next K" disabled={i === n - 1} onClick={() => go(i + 1)} className={btnTransport}><IconStep /></button>
        <label className="flex min-w-0 flex-1 basis-[10rem] items-center px-1">
          <span className="sr-only">Scrub K</span>
          <input type="range" min={0} max={n - 1} value={i} onChange={(e) => go(+e.target.value)} className="rpd-range w-full" style={{ ["--p" as string]: `${(i / (n - 1)) * 100}%` }} aria-valuetext={`K ${cur.k}`} />
        </label>
        <output className={`${MONO} w-[9.5rem] text-right text-[12.5px] text-[var(--muted)]`} aria-live="polite">K <span className="text-[var(--ink)]">{cur.k}</span> · BIC {cur.bic.toFixed(2)}M</output>
      </div>
      <p className={`${caption} mt-2`}>GMM on PCA-30, 800K-row training sample. The grey ghost is the whole sweep, so the drawn line never loses its place. BIC bottoms out at K = {b.selectedK}, beside the {b.groups} operational groups, far from the {b.subsystems} subsystems.</p>
    </div>
  );
}


/* ================================================================== parchment GMM node diagram, inline explorer */
function GmmDiagram({ g, ids, sel, onPick }: { g: Gmm; ids: number[]; sel: number; onPick: (id: number) => void }) {
  const W = 600, H = 340;
  const comps = ids.map((id) => g.comps.find((c) => c.id === id)!);
  const topGroups = (c: Gmm["comps"][number], n = 2) => c.grp.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v).slice(0, n).filter((x) => x.v > 0.05);
  const gIdx = Array.from(new Set(comps.flatMap((c) => topGroups(c, c.id === sel ? 3 : 1).map((x) => x.i)))).sort((a, b) => +g.groups[a] - +g.groups[b]);
  const spread = (n: number, i: number, pad: number) => pad + (i * (W - pad * 2)) / Math.max(1, n - 1);
  const sx = (i: number) => spread(g.subs.length, i, 110);
  const cx = (k: number) => spread(comps.length, k, 44);
  const gx = (i: number) => spread(gIdx.length, gIdx.indexOf(i), 44);
  const yS = 300, yC = 175, yG = 52;
  const nw = Math.min(58, (W - 60) / comps.length - 8);
  const edge = (x1: number, y1: number, x2: number, y2: number) => `M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`;
  const hotGroups = topGroups(g.comps.find((c) => c.id === sel)!, 3).map((x) => x.i);
  const Node = ({ x, y, w, t, hot, sub }: { x: number; y: number; w: number; t: string; hot?: boolean; sub?: string }) => (
    <g>
      <rect x={x - w / 2 + 3} y={y - (sub ? 19 : 15) + 3} width={w} height={sub ? 38 : 30} rx="2" fill="var(--paper)" stroke={hot ? "var(--accent)" : "var(--oxblood)"} strokeWidth="0.75" />
      <rect x={x - w / 2} y={y - (sub ? 19 : 15)} width={w} height={sub ? 38 : 30} rx="2" fill={hot ? "var(--accent-wash)" : "var(--parchment)"} stroke={hot ? "var(--accent)" : "var(--oxblood)"} strokeWidth={hot ? 1.3 : 0.75} />
      <text x={x} y={sub ? y - 6 : y} dy="0.35em" textAnchor="middle" className={SANS} fontWeight={500} fill="var(--ink)">{t}</text>
      {sub && <text x={x} y={y + 13} textAnchor="middle" className={`${MONO} rpd-t-sm`} fill={hot ? "var(--accent-ink)" : "var(--muted)"}>{sub}</text>}
    </g>
  );
  return (
    <Svg vw={W} vh={H} role="img" aria-label={`GMM components on Mission 1: subsystems feed components, components map onto operational groups. Component C${sel} is highlighted.`}>
      {comps.map((c, k) => {
        const hot = c.id === sel;
        return (
          <g key={c.id}>
            {c.sub.map((v, i) => v > 0.05 && <path key={`s${i}`} d={edge(sx(i), yS - 16, cx(k), yC + 20)} fill="none" stroke={hot ? "var(--accent)" : "var(--oxblood)"} strokeOpacity={hot ? 1 : 0.16 + v * 0.45} strokeWidth={hot ? 1.6 : 0.5 + v * 1.3} className="transition-[stroke,stroke-opacity] duration-300" />)}
            {topGroups(c, hot ? 3 : 1).map(({ v, i }) => <path key={`g${i}`} d={edge(cx(k), yC - 20, gx(i), yG + 16)} fill="none" stroke={hot ? "var(--accent)" : "var(--oxblood)"} strokeOpacity={hot ? 1 : 0.16 + v * 0.45} strokeWidth={hot ? 1.6 : 0.5 + v * 1.3} />)}
          </g>
        );
      })}
      {gIdx.map((i) => <Node key={i} x={gx(i)} y={yG} w={42} t={`G${g.groups[i]}`} hot={hotGroups.includes(i)} />)}
      {comps.map((c, k) => (
        <g key={c.id} onClick={() => onPick(c.id)} className="cursor-pointer">
          <Node x={cx(k)} y={yC} w={nw} t={`C${c.id}`} hot={c.id === sel} sub={`${(c.anomalyRate * 100).toFixed(0)}%`} />
        </g>
      ))}
      {g.subs.map((s, i) => <Node key={s} x={sx(i)} y={yS} w={52} t={`S${s}`} />)}
      <text x={4} y={yG - 27} className={MONO} fill="var(--muted)">operational groups</text>
      <text x={4} y={yC - 32} className={MONO} fill="var(--muted)">GMM components · % labelled anomalous</text>
      <text x={4} y={yS - 25} className={MONO} fill="var(--muted)">subsystems</text>
    </Svg>
  );
}

export function GmmExplorer({ gmm }: { gmm: Gmm }) {
  const byWeight = useMemo(() => [...gmm.comps].sort((a, b) => b.weight - a.weight), [gmm]);
  const [sel, setSel] = useState(3);
  const top = byWeight.slice(0, 7).map((c) => c.id);
  const ids = top.includes(sel) ? top : [...top.slice(0, 6), sel];
  const c = gmm.comps.find((x) => x.id === sel)!;
  const topSub = c.sub.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v)[0];
  const topGrp = c.grp.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v)[0];
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-8">
      <div className="min-w-0">
        <XScroll label="GMM component diagram">
          <div className="min-w-[540px] rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] p-3 sm:p-5">
            <GmmDiagram g={gmm} ids={ids} sel={sel} onPick={setSel} />
          </div>
        </XScroll>
        <div className="mt-4">
          <p className={`${SANS} mb-2 text-[13px] font-medium`}>All 21 components, heaviest first</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose a component">
            {byWeight.map((x) => (
              <button key={x.id} type="button" aria-pressed={sel === x.id} onClick={() => setSel(x.id)} className={`${chip} h-8 px-2.5 ${MONO} text-[12px]`}>
                <IconCheck size={10} className={chipCheck} />C{x.id}
              </button>
            ))}
          </div>
        </div>
      </div>
      <aside aria-live="polite" aria-label="Selected component" className="self-start border-t border-[var(--ink)] pt-3">
        <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>Component</p>
        <p className={`${SERIF} text-[56px] leading-none font-light tracking-[-0.02em]`}>C{c.id}</p>
        <dl className={`${SANS} mt-4 grid grid-cols-[1fr_auto] gap-y-2 text-[13.5px]`}>
          <dt className="text-[var(--muted)]">Share of timesteps</dt><dd className={MONO}>{(c.weight * 100).toFixed(1)}%</dd>
          <dt className="text-[var(--muted)]">Labelled anomalous</dt><dd className={MONO}>{(c.anomalyRate * 100).toFixed(1)}%</dd>
          <dt className="text-[var(--muted)]">Main subsystem</dt><dd className={MONO}>S{gmm.subs[topSub.i]} · {(topSub.v * 100).toFixed(0)}%</dd>
          <dt className="text-[var(--muted)]">Main group</dt><dd className={MONO}>G{gmm.groups[topGrp.i]} · {(topGrp.v * 100).toFixed(0)}%</dd>
        </dl>
        <p className={`${caption} mt-4`}>
          {c.anomalyRate > 0.5 ? "Most of this mode is fault: the mixture gave anomalies a mode of their own." : c.anomalyRate > 0.15 ? "A mode where faults collect, against a 9.9% training rate." : "A mostly nominal mode, with its own idea of normal."}
        </p>
      </aside>
    </div>
  );
}

/* ================================================================== small multiples, mission switch */
const SHORT: Record<string, string> = { CapacityVAE: "Capacity VAE", HierarchicalVAE: "Hier. VAE", TransformerVAE: "Transf. VAE" };
export function Multiples({ sets }: { sets: PrSet[] }) {
  const [m, setM] = useState<1 | 2>(2);
  return (
    <div>
      <div className="mb-5"><Segmented label="Mission" value={m} onChange={setM} options={[{ value: 1, label: "Mission 1" }, { value: 2, label: "Mission 2" }]} /></div>
      <LinkedMultiples key={m} set={{ ...sets[m - 1], curves: sets[m - 1].curves.map((c) => ({ ...c, label: SHORT[c.label] ?? c.label })) }} />
    </div>
  );
}

/* ================================================================== Apple giant numerals: 21 and 29 */
export function GiantStat() {
  const [ref, seen] = useInView<HTMLDivElement>(0.4);
  return (
    <div ref={ref} data-inview={seen} className="rpd-reveal grid gap-14 sm:grid-cols-2 sm:gap-10">
      {[{ m: 1, k: 21, s: 4, g: 18 }, { m: 2, k: 29, s: 5, g: 29 }].map((x, j) => (
        <div key={x.m} className="border-t border-[var(--ink)] pt-4">
          <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>Mission {x.m} · BIC picks</p>
          <p data-d style={{ transitionDelay: `${j * 160}ms` }} className={`${SERIF} mt-6 text-[clamp(7rem,17vw,13rem)] leading-[0.8] font-light tracking-[-0.045em] tabular-nums`}>{x.k}</p>
          <div data-d style={{ transitionDelay: `${300 + j * 160}ms` }} className="mt-8">
            <div className="relative h-11" aria-hidden>
              <span className="absolute inset-x-0 top-3 h-px bg-[var(--ink)]" />
              {[0, 10, 20, 30].map((v) => <span key={v} className="absolute top-2 h-2 w-px bg-[var(--rule-strong)]" style={{ left: `${(v / 30) * 100}%` }} />)}
              {[{ v: x.s, c: "var(--ochre)" }, { v: x.g, c: "var(--prussian)" }].map((p) => (
                <span key={p.v} className={`${MONO} absolute top-0 flex -translate-x-1/2 flex-col items-center text-[11px]`} style={{ left: `${(p.v / 30) * 100}%`, color: p.c }}>
                  <span className="h-[18px] w-px" style={{ background: p.c }} />
                  <span className="mt-0.5">{p.v}</span>
                </span>
              ))}
              <span className="absolute top-[7px] size-[11px] -translate-x-1/2 rounded-full border-[1.5px] border-[var(--ink)] bg-[var(--paper)]" style={{ left: `${(x.k / 30) * 100}%` }} />
            </div>
            <p className={`${SANS} text-[13.5px] leading-[1.45] text-[var(--ink)]`}>
              K = {x.k}, beside the <span className="text-[var(--prussian)]">{x.g} operational groups</span>; far from the <span className="text-[var(--ochre)]">{x.s} subsystems</span>.
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
