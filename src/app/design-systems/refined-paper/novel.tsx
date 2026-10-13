"use client";

// Novel components, each borrowed from one of the board's reference sites and rebuilt on our data.
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import type { Bic, Channel, Gmm, PrSet, Twin } from "./data";
import { Svg, path, useInView, useReducedMotion } from "./fig";
import {
  FOCUS, IconArrow, IconCheck, IconPause, IconPlay, IconStep, MONO, SANS, SERIF, btnSecondary, btnTransport, btnTransportMain, caption, chip, chipCheck,
} from "./kit";
import { Dialog, Segmented } from "./ui";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const at = (pts: [number, number][], r: number) => pts[Math.round(clamp(r) * (pts.length - 1))][1];

/* ================================================================== N1 · Ciechanowski: draggable figure, words keyed to lines */
export function KeyedDrag({ set }: { set: PrSet }) {
  const gmm = set.curves.find((c) => c.label === "GMM")!;
  const km = set.curves.find((c) => c.label === "K-Means")!;
  const [r, setR] = useState(0.4);
  const [hl, setHl] = useState<"gmm" | "km" | null>(null);
  const [focus, setFocus] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const W = 560, H = 300, L = 40, R = 18, T = 14, B = 36;
  const x = (v: number) => L + v * (W - L - R);
  const y = (v: number) => T + (1 - v) * (H - T - B);
  const pg = at(gmm.points, r), pk = at(km.points, r);
  const fromEvent = (e: PointerEvent) => {
    const b = svg.current!.getBoundingClientRect();
    setR(Math.round(clamp(((e.clientX - b.left) / b.width * W - L) / (W - L - R), 0.01, 0.99) * 100) / 100);
  };
  const onKey = (e: KeyboardEvent) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
    if (e.key === "Home") { e.preventDefault(); setR(0.01); }
    if (e.key === "End") { e.preventDefault(); setR(0.99); }
    if (!d) return;
    e.preventDefault();
    setR((v) => Math.round(clamp(v + d * (e.shiftKey ? 0.1 : 0.01), 0.01, 0.99) * 100) / 100);
  };
  const word = (k: "gmm" | "km", color: string, text: string) => (
    <b onMouseEnter={() => setHl(k)} onMouseLeave={() => setHl(null)} className="cursor-default font-semibold transition-opacity duration-200" style={{ color, opacity: hl && hl !== k ? 0.45 : 1 }}>{text}</b>
  );
  const dim = (k: "gmm" | "km") => (hl && hl !== k ? 0.22 : 1);
  return (
    <div>
      <p className={`${SERIF} max-w-[46ch] text-[18px] leading-[1.6] text-[var(--ink)] sm:text-[19px]`} aria-live="polite">
        At a recall of <span className={`${MONO} text-[0.92em]`}>{r.toFixed(2)}</span>, the {word("gmm", "var(--prussian)", "mixture model")} keeps{" "}
        <span className={`${MONO} text-[0.92em]`}>{pg.toFixed(2)}</span> precision and {word("km", "var(--ochre)", "K-Means")} keeps{" "}
        <span className={`${MONO} text-[0.92em]`}>{pk.toFixed(2)}</span>. Both sink toward the <b className="font-semibold text-[var(--graphite)]">11% positive rate</b>.
      </p>
      <Svg ref={svg} vw={W} vh={H} className="mt-4 cursor-ew-resize touch-pan-y select-none" role="group" aria-label="Precision–recall curves, Mission 1. Drag the handle, or focus it and use the arrow keys."
        onPointerDown={(e) => { (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId); fromEvent(e); }}
        onPointerMove={(e) => e.buttons && fromEvent(e)}
      >
        {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={x(0)} x2={x(1)} y1={y(g)} y2={y(g)} stroke="var(--rule)" strokeWidth="0.5" />)}
        <line x1={x(0)} x2={x(1)} y1={y(set.positiveRate)} y2={y(set.positiveRate)} stroke="var(--graphite)" strokeDasharray="2 3" />
        <path d={path(km.points, x, y)} fill="none" stroke="var(--ochre)" strokeWidth={hl === "km" ? 2.2 : 1.5} opacity={dim("km")} className="transition-[opacity,stroke-width] duration-200" />
        <path d={path(gmm.points, x, y)} fill="none" stroke="var(--prussian)" strokeWidth={hl === "gmm" ? 2.4 : 1.7} opacity={dim("gmm")} className="transition-[opacity,stroke-width] duration-200" />
        <line x1={x(0)} x2={x(1)} y1={y(0)} y2={y(0)} stroke="var(--ink)" strokeWidth="0.75" />
        <line x1={x(0)} x2={x(0)} y1={y(0)} y2={y(1)} stroke="var(--ink)" strokeWidth="0.75" />
        {[0, 0.5, 1].map((v) => (
          <g key={v} className={MONO} fill="var(--muted)">
            <text x={x(v)} y={y(0)} dy="1.4em" textAnchor="middle">{v}</text>
            <text x={x(0) - 7} y={y(v)} dy="0.35em" textAnchor="end">{v}</text>
          </g>
        ))}
        <text x={x(1)} y={y(0)} dy="2.7em" textAnchor="end" className={MONO} fill="var(--muted)">recall</text>
        <text x={x(0)} y={y(1)} dx="6" dy="0.9em" className={MONO} fill="var(--muted)">precision</text>
        <g role="slider" tabIndex={0} aria-label="Recall" aria-valuemin={0} aria-valuemax={1} aria-valuenow={r} aria-valuetext={`recall ${r.toFixed(2)}: GMM precision ${pg.toFixed(2)}, K-Means ${pk.toFixed(2)}`} onKeyDown={onKey} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} className="outline-none">
          <rect x={x(r) - 14} y={T - 4} width={28} height={H - T - B + 8} fill="transparent" />
          {focus && <rect x={x(r) - 12} y={T - 6} width={24} height={H - T - B + 12} rx="3" fill="none" stroke="var(--ink)" strokeWidth="1.5" />}
          <line x1={x(r)} x2={x(r)} y1={T} y2={y(0)} stroke="var(--ink)" strokeWidth="0.75" />
          <circle cx={x(r)} cy={y(pk)} r="4.5" fill="var(--paper)" stroke="var(--ochre)" strokeWidth="1.75" opacity={dim("km")} />
          <circle cx={x(r)} cy={y(pg)} r="4.5" fill="var(--paper)" stroke="var(--prussian)" strokeWidth="1.75" opacity={dim("gmm")} />
          <path d={`M${x(r) - 6},${y(0) - 8} l-5,4 5,4 M${x(r) + 6},${y(0) - 8} l5,4 -5,4`} fill="none" stroke="var(--ink)" strokeWidth="1.2" />
        </g>
      </Svg>
      <p className={`${caption} mt-2`}>Mission 1 test set. GMM is the Table 1 run (AP {gmm.ap.toFixed(3)}); K-Means is an earlier saved K = 8 run (AP {km.ap.toFixed(3)}; Table 1 K = 2 reports {km.reportAp?.toFixed(3)}). Hover a coloured word to isolate its line.</p>
    </div>
  );
}

/* ================================================================== N2 · Ciechanowski: twin views on one shared scrubber, figure-level pause */
export function TwinScrubber({ twin }: { twin: Twin }) {
  const n = twin.gmm.length;
  const onset = twin.kmeans.findIndex((p) => p[0] >= twin.start);
  const [i, setI] = useState(Math.max(0, onset - 6));
  const [playing, setPlaying] = useState(false);
  const [box, seen] = useInView<HTMLDivElement>(0.3);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, [box]);
  useEffect(() => {
    if (!playing || !visible) return;
    const t = setInterval(() => setI((v) => (v >= n - 1 ? (setPlaying(false), v) : v + 1)), 45);
    return () => clearInterval(t);
  }, [playing, visible, n]);
  const W = 460, H = 160, L = 6, R = 6, T = 10, B = 22;
  const x = (j: number) => L + (j / (n - 1)) * (W - L - R);
  const s0 = twin.kmeans.findIndex((p) => p[0] >= twin.start), s1 = twin.kmeans.findIndex((p) => p[0] >= twin.end);
  const hours = ((twin.kmeans[i][0] - twin.start) * 30) / 3600;
  const where = i < s0 ? `${Math.abs(hours).toFixed(0)} h before onset` : i >= s1 ? `${(((twin.kmeans[i][0] - twin.end) * 30) / 3600).toFixed(0)} h after it ends` : `${hours.toFixed(0)} h into the fault`;
  const inside = i >= s0 && i < s1;
  const Panel = ({ name, color, pts, unit }: { name: string; color: string; pts: [number, number][]; unit: string }) => {
    const lg = pts.map((p) => Math.log10(Math.max(p[1], 1)));
    const lo = Math.min(...lg), hi = Math.max(...lg);
    const y = (v: number) => T + (1 - (Math.log10(Math.max(v, 1)) - lo) / (hi - lo || 1)) * (H - T - B);
    const d = pts.map((p, j) => `${j ? "L" : "M"}${x(j).toFixed(1)},${y(p[1]).toFixed(1)}`).join("");
    return (
      <figure className="min-w-0">
        <figcaption className="flex flex-col gap-0.5 border-b border-[var(--rule)] pb-1.5 min-[560px]:flex-row min-[560px]:items-baseline min-[560px]:justify-between min-[560px]:gap-2">
          <span className={`${SERIF} text-[17px]`} style={{ color }}>{name}</span>
          <span className={`${MONO} text-[12px] text-[var(--ink)]`}>{pts[i][1] >= 1e4 ? pts[i][1].toExponential(1) : pts[i][1].toFixed(1)} <span className="text-[var(--muted)]">{unit}</span></span>
        </figcaption>
        <Svg vw={W} vh={H} className="mt-2" role="img" aria-label={`${name} score across the longest Mission 1 fault, log scale.`}>
          <rect x={x(s0)} width={x(s1) - x(s0)} y={T - 4} height={H - T - B + 4} fill="var(--band)" />
          <path d={d} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
          <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="var(--ink)" strokeWidth="0.75" />
          <line x1={x(i)} x2={x(i)} y1={T - 6} y2={H - B} stroke="var(--ink)" strokeWidth="0.75" />
          <circle cx={x(i)} cy={y(pts[i][1])} r="3.5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.4" />
          <text x={x(s0)} y={H - B} dy="1.35em" className={MONO} fill="var(--muted)">onset</text>
          <text x={x(s1)} y={H - B} dy="1.35em" textAnchor="end" className={MONO} fill="var(--muted)">end</text>
        </Svg>
      </figure>
    );
  };
  return (
    <div ref={box} data-inview={seen}>
      <div className="grid gap-6 md:grid-cols-2">
        <Panel name="K-Means, K = 8" color="var(--ochre)" pts={twin.kmeans} unit="dist." />
        <Panel name="GMM, K = 21" color="var(--prussian)" pts={twin.gmm} unit="NLL" />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" aria-pressed={playing} aria-label={playing ? "Pause figure" : "Play figure"} onClick={() => { if (!playing && i >= n - 1) setI(0); setPlaying((p) => !p); }} className={btnTransportMain}>{playing ? <IconPause /> : <IconPlay />}</button>
        <label className="flex min-w-0 flex-1 basis-[12rem] items-center">
          <span className="sr-only">Scrub both views</span>
          <input type="range" min={0} max={n - 1} value={i} onChange={(e) => { setPlaying(false); setI(+e.target.value); }} className="rpd-range w-full" style={{ ["--p" as string]: `${(i / (n - 1)) * 100}%` }} aria-valuetext={where} />
        </label>
        <output className={`${SANS} inline-flex w-full items-center gap-1.5 text-[13px] sm:w-[15rem] sm:justify-end`} aria-live="polite">
          <span className={`inline-block size-2 rounded-[1px] ${inside ? "bg-[var(--band)] ring-1 ring-[var(--rule-strong)]" : "border border-[var(--rule-strong)]"}`} aria-hidden />
          <span className="text-[var(--ink)]">{where}</span>
        </output>
      </div>
      <p className={`${caption} mt-2`}>The longest Mission 1 test fault: 116,061 steps (≈967 h from 2009-05-25). One scrubber drives both views; the figure pauses itself when scrolled away. Both scores log-scaled. K-Means here is the saved K = 8 run.</p>
    </div>
  );
}

/* ================================================================== N3 · R2D3: sticky graphic, scroll-driven object constancy */
export function ScrollyChannels({ channels }: { channels: Channel[] }) {
  const [step, setStep] = useState(0);
  const steps = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setStep(+(e.target as HTMLElement).dataset.step!)), { rootMargin: "-45% 0px -45% 0px" });
    steps.current.forEach((s) => s && io.observe(s));
    return () => io.disconnect();
  }, []);
  const W = 420, H = 300;
  const subs = Array.from(new Set(channels.map((c) => c.s)));
  const groups = Array.from(new Set(channels.map((c) => c.g))).sort((a, b) => subs.indexOf(channels.find((c) => c.g === a)!.s) - subs.indexOf(channels.find((c) => c.g === b)!.s) || a - b);
  const targets = channels.filter((c) => c.target).length;
  const pos = useMemo(() => {
    const out: Record<number, [number, number][]> = { 0: [], 1: [], 2: [] };
    const sorted = [...channels].sort((a, b) => a.id - b.id);
    sorted.forEach((c, i) => (out[0][c.id] = [30 + (i % 19) * 20, 110 + Math.floor(i / 19) * 22]));
    subs.forEach((s, si) => channels.filter((c) => c.s === s).forEach((c, j) => (out[1][c.id] = [62 + si * 100 - 28 + (j % 5) * 14, 62 + Math.floor(j / 5) * 14])));
    groups.forEach((g, gi) => channels.filter((c) => c.g === g).forEach((c, j) => (out[2][c.id] = [12 + (gi % 6) * 66 + 22 + (j % 3) * 11, 40 + Math.floor(gi / 6) * 86 + Math.floor(j / 3) * 11])));
    return out;
  }, [channels, subs, groups]);
  const layout = Math.min(step, 2);
  const TEXT: [string, ReactNode][] = [
    ["76 channels", <>Mission 1 streams <b className="font-semibold">76 channels</b>, one reading every 30 seconds, for years.</>],
    ["4 subsystems", <>ESA files them under <b className="font-semibold">4 subsystems</b>. If the structure lived here, a 4- or 5-mode model would fit. It doesn’t.</>],
    ["18 groups", <>Each subsystem splits into <b className="font-semibold">operational groups</b>, 18 in all. BIC picks K = 21, right at this level.</>],
    ["58 targets", <><b className="font-semibold text-[var(--prussian)]">58 target channels</b> carry ESA’s labels and are scored; the <b className="font-semibold text-[var(--graphite)]">other 18</b> are context.</>],
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10">
      <div className="sticky top-[56px] z-[1] -mx-1 self-start bg-[var(--paper)] px-1 pt-1 pb-2 lg:top-8 lg:order-2 lg:pb-0">
        <div className="rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] p-3">
          <Svg vw={W} vh={H} className="max-h-[38vh] lg:max-h-none" role="img" aria-label={`Mission 1 channels as dots. Step ${step + 1}: ${TEXT[step][0]}.`}>
            {layout === 1 && subs.map((s, si) => (
              <text key={s} x={62 + si * 100} y={232} textAnchor="middle" className={`${MONO} rpd-fade`} fill="var(--muted)">S{s} · {channels.filter((c) => c.s === s).length}</text>
            ))}
            {layout === 2 && groups.map((g, gi) => (
              <text key={g} x={12 + (gi % 6) * 66 + 33} y={40 + Math.floor(gi / 6) * 86 + 50} textAnchor="middle" className={`${MONO} rpd-t-sm rpd-fade`} fill="var(--muted)">G{g}</text>
            ))}
            {layout === 0 && <text x={W / 2} y={84} textAnchor="middle" className={`${MONO} rpd-fade`} fill="var(--muted)">channel_1 … channel_76</text>}
            {channels.map((c) => {
              const [px, py] = pos[layout][c.id];
              const hollow = step === 3 && !c.target;
              return (
                <g key={c.id} style={{ transform: `translate(${px}px, ${py}px)`, transition: `transform 900ms var(--ease) ${(c.id % 19) * 12}ms` }}>
                  <circle r={layout === 2 ? 4 : 5} fill={hollow ? "var(--mount)" : step === 3 ? "var(--prussian)" : "var(--ink)"} stroke={hollow ? "var(--graphite)" : "none"} strokeWidth="1.2" style={{ transition: "fill 400ms, r 600ms" }} />
                </g>
              );
            })}
          </Svg>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className={caption}>Step {step + 1} of 4 · {TEXT[step][0]}</span>
            <span className="flex gap-1" aria-label="Jump to step">
              {TEXT.map(([t], k) => (
                <button key={t} type="button" aria-label={`Step ${k + 1}: ${t}`} aria-current={step === k ? "step" : undefined} onClick={() => steps.current[k]?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })} className={`${FOCUS} grid size-6 place-items-center rounded-[2px] transition-colors duration-200 hover:bg-[var(--parchment)]`}>
                  <span className={`block h-[3px] w-3.5 rounded-[1px] transition-colors duration-300 ${step === k ? "bg-[var(--ink)]" : "bg-[var(--rule-strong)]"}`} />
                </button>
              ))}
            </span>
          </div>
        </div>
      </div>
      <div className="lg:order-1">
        {TEXT.map(([t, body], k) => (
          <div key={t} ref={(el) => { steps.current[k] = el; }} data-step={k} className={`flex min-h-[46vh] items-center py-8 transition-opacity duration-300 lg:min-h-[62vh] ${step === k ? "opacity-100" : "opacity-40"}`}>
            <div>
              <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>{String(k + 1).padStart(2, "0")} · {t}</p>
              <p className={`${SERIF} mt-2 max-w-[30ch] text-[21px] leading-[1.45] text-[var(--ink)] sm:text-[24px]`}>{body}</p>
              {k === 0 && <p className={`${SERIF} mt-5 inline-flex items-center gap-2 text-[15px] italic text-[var(--muted)]`}>Keep scrolling <span aria-hidden className="rpd-cue inline-block">↓</span></p>}
            </div>
          </div>
        ))}
        <p className={`${caption} pb-2`}>Positions tween, never re-draw, so each dot can be followed from step to step. {targets} of {channels.length} are targets.</p>
      </div>
    </div>
  );
}

/* ================================================================== N4 · Distill: step player with counter and ghost curve */
export function BicPlayer({ sweeps }: { sweeps: Bic[] }) {
  const [m, setM] = useState<1 | 2>(1);
  const b = sweeps[m - 1];
  const n = b.sweep.length;
  const [i, setI] = useState(n - 1);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { setI(sweeps[m - 1].sweep.length - 1); setPlaying(false); }, [m, sweeps]);
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
        <Segmented label="Mission" value={m} onChange={setM} options={[{ value: 1, label: "Mission 1" }, { value: 2, label: "Mission 2" }]} />
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
            <line x1={x(b.selectedK)} x2={x(b.selectedK)} y1={T + 16} y2={y(b.sweep[minI].bic) - 9} stroke="var(--accent)" strokeWidth="0.75" strokeDasharray="1 2.5" />
            <text x={x(b.selectedK)} y={T + 10} textAnchor="middle" className={MONO} fill="var(--accent-ink)" stroke="var(--paper)" strokeWidth="4" paintOrder="stroke">K* = {b.selectedK}</text>
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

/* ================================================================== N5 · Distill: small multiples, one linked crosshair */
export function LinkedMultiples({ set }: { set: PrSet }) {
  const [r, setR] = useState(0.3);
  const W = 240, H = 190, L = 24, R = 8, T = 8, B = 22;
  const x = (v: number) => L + v * (W - L - R);
  const y = (v: number) => T + (1 - v) * (H - T - B);
  const move = (e: PointerEvent<SVGSVGElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    setR(Math.round(clamp(((e.clientX - b.left) / b.width * W - L) / (W - L - R), 0, 1) * 100) / 100);
  };
  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-7 xl:grid-cols-4">
        {set.curves.map((c, k) => {
          const p = at(c.points, r);
          return (
            <figure key={c.key} className="min-w-0">
              <figcaption className="flex flex-col gap-0.5 border-b border-[var(--rule)] pb-1.5 min-[560px]:flex-row min-[560px]:items-baseline min-[560px]:justify-between min-[560px]:gap-2">
                <span className={`${SERIF} min-w-0 truncate text-[17px]`}>{c.label}</span>
                <span className={`${MONO} shrink-0 text-[12px] text-[var(--muted)]`}>{c.exact ? "AP" : "saved AP"} {c.ap.toFixed(3)}</span>
              </figcaption>
              <Svg vw={W} vh={H} className="mt-2 cursor-crosshair touch-pan-y" onPointerMove={move} onPointerDown={move} role="img" aria-label={`${c.label} precision–recall, Mission ${set.mission}. At recall ${r.toFixed(2)}, precision ${p.toFixed(2)}.`}>
                {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={x(0)} x2={x(1)} y1={y(g)} y2={y(g)} stroke="var(--rule)" strokeWidth="0.5" />)}
                <line x1={x(0)} x2={x(1)} y1={y(set.positiveRate)} y2={y(set.positiveRate)} stroke="var(--graphite)" strokeDasharray="2 3" />
                <path d={path(c.points, x, y)} fill="none" stroke="var(--prussian)" strokeWidth="1.5" />
                <line x1={x(r)} x2={x(r)} y1={T} y2={y(0)} stroke="var(--ink)" strokeWidth="0.75" />
                <circle cx={x(r)} cy={y(p)} r="3.5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.4" />
                <text x={x(r) + (r > 0.6 ? -6 : 6)} y={y(p)} dy="-0.6em" textAnchor={r > 0.6 ? "end" : "start"} className={MONO} fill="var(--ink)" stroke="var(--paper)" strokeWidth="3" paintOrder="stroke">{p.toFixed(2)}</text>
                <line x1={x(0)} x2={x(1)} y1={y(0)} y2={y(0)} stroke="var(--ink)" strokeWidth="0.75" />
                <line x1={x(0)} x2={x(0)} y1={y(0)} y2={y(1)} stroke="var(--ink)" strokeWidth="0.75" />
                {k === 0 && <><text x={L - 5} y={y(1)} dy="0.35em" textAnchor="end" className={MONO} fill="var(--muted)">1</text><text x={L - 5} y={y(0)} dy="0.1em" textAnchor="end" className={MONO} fill="var(--muted)">0</text></>}
                <text x={x(1)} y={H - 4} textAnchor="end" className={MONO} fill="var(--muted)">recall</text>
              </Svg>
              <p className={`${SANS} mt-1 text-[11.5px] leading-snug text-[var(--muted)]`}>{c.scoring} · {c.exact ? "Table 1 run" : `earlier saved run; Table 1 ${c.reportAp?.toFixed(3)}`}</p>
            </figure>
          );
        })}
      </div>
      <label className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--rule)] pt-3">
        <span className={`${SANS} text-[13px] font-medium`}>Recall, all four</span>
        <input type="range" min={0} max={100} value={Math.round(r * 100)} onChange={(e) => setR(+e.target.value / 100)} className="rpd-range min-w-[10rem] flex-1" style={{ ["--p" as string]: `${r * 100}%` }} />
        <output className={`${MONO} w-12 text-right text-[13px]`}>{r.toFixed(2)}</output>
      </label>
    </div>
  );
}

/* ================================================================== N6 · Distill / transformer-circuits: hover-linked citations */
const REFS = [
  { n: 1, short: "Kotowski et al., 2024", full: "K. Kotowski, C. Haskamp, J. Andrzejewski et al. European Space Agency benchmark for anomaly detection in satellite telemetry. arXiv:2406.17826, 2024." },
  { n: 2, short: "Hundman et al., 2018", full: "K. Hundman, V. Constantinou, C. Laporte, I. Colwell, T. Soderstrom. Detecting spacecraft anomalies using LSTMs and nonparametric dynamic thresholding. KDD 2018, pp. 387–395." },
  { n: 3, short: "Burgess et al., 2018", full: "C. P. Burgess, I. Higgins, A. Pal et al. Understanding disentangling in β-VAE. arXiv:1804.03599, 2018." },
];
export function LinkedCitations() {
  const [hot, setHot] = useState<number | null>(null);
  const [pin, setPin] = useState<number | null>(null);
  const live = pin ?? hot;
  const Cite = ({ n }: { n: number }) => (
    <span className="relative inline-block">
      <button
        type="button"
        aria-expanded={pin === n}
        aria-describedby={`rpd-ref-${n}`}
        onMouseEnter={() => setHot(n)} onMouseLeave={() => setHot(null)} onFocus={() => setHot(n)} onBlur={() => setHot(null)}
        onClick={() => setPin((p) => (p === n ? null : n))}
        onKeyDown={(e) => e.key === "Escape" && (setPin(null), setHot(null))}
        className={`${SANS} ${FOCUS} ml-0.5 -translate-y-[0.45em] rounded-[2px] px-1 text-[12px] font-medium text-[var(--prussian)] transition-colors duration-200 hover:bg-[var(--parchment)] active:bg-[var(--rule)] aria-expanded:bg-[var(--parchment)]`}
      >[{n}]</button>
      {live === n && (
        <span role="tooltip" className={`${SANS} rpd-rise absolute bottom-full left-1/2 z-30 mb-1 w-[16rem] -translate-x-1/2 rounded-[3px] border border-[var(--rule-strong)] bg-[var(--mount)] p-3 text-left text-[12.5px] leading-[1.45] text-[var(--ink)] shadow-[var(--lift)] lg:hidden`}>{REFS[n - 1].full}</span>
      )}
    </span>
  );
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-10">
      <p className={`${SERIF} max-w-[60ch] text-[18px] leading-[1.65] text-[var(--ink)]`}>
        Every unsupervised detector benchmarked on the ESA dataset raises persistent false alarms<Cite n={1} />. We score point-wise and event-wise, where a contiguous segment counts as caught at the best operating threshold<Cite n={2} />. The VAEs use capacity control so the latent code neither collapses nor explodes<Cite n={3} />.
      </p>
      <ol className="space-y-2 border-t border-[var(--ink)] pt-3 lg:border-t-0 lg:border-l lg:border-[var(--rule)] lg:pt-0 lg:pl-5" aria-label="References">
        {REFS.map((r) => (
          <li key={r.n} id={`rpd-ref-${r.n}`} className={`${SANS} grid grid-cols-[1.6rem_1fr] rounded-[2px] py-1.5 pr-2 text-[12.5px] leading-[1.45] transition-[background-color,box-shadow] duration-200 ${live === r.n ? "bg-[var(--parchment)] shadow-[inset_2px_0_0_var(--ink)]" : ""}`}>
            <span className={`${MONO} pl-1.5 text-[var(--prussian)]`}>{r.n}</span>
            <span className={live === r.n ? "text-[var(--ink)]" : "text-[var(--muted)]"}>{r.full}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ================================================================== N7 · transformer-circuits: sticky bold/grey contents */
const TOC = [
  { id: "a", n: "§1", t: "The finding", p: "ESA telemetry has latent structure at the operational-group level, 18 to 29 modes, not the 4 or 5 subsystems the metadata suggests.", tier: 1 },
  { id: "b", n: "§2", t: "Five method families", p: "K-Means, PCA, Nyström KPCA, a Gaussian mixture and three VAEs, compared on both missions by point-wise PR-AUC.", tier: 1 },
  { id: "c", n: "§3", t: "Latent structure", p: "BIC bottoms out at K = 21 on Mission 1 and K = 29 on Mission 2, beside the 18 and 29 operational groups.", tier: 1 },
  { id: "d", n: "§4", t: "Limitations", p: "Point-wise metrics reward long events; the VAEs used a different split from the 80/20 baselines.", tier: 1 },
  { id: "e", n: "A", t: "Data and splits", p: "ESA-ADB temporal 50/50 split; baselines 80/20; GMM an 800K random sample; VAEs 90/10 on pure-nominal windows.", tier: 2 },
  { id: "f", n: "B", t: "Run provenance", p: "Which saved score arrays match Table 1 exactly, which are near, and which runs were never saved.", tier: 2 },
];
export function TocFragment() {
  const box = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("a");
  useEffect(() => {
    const root = box.current;
    if (!root) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive((e.target as HTMLElement).dataset.id!)), { root, rootMargin: "0px 0px -72% 0px" });
    root.querySelectorAll("section").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
  const go = (id: string) => {
    const root = box.current, el = root?.querySelector<HTMLElement>(`[data-id="${id}"]`);
    if (root && el) root.scrollTo({ top: el.offsetTop - 16, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  return (
    <div ref={box} className="rpd-scroll relative h-[320px] overflow-y-auto rounded-[3px] border border-[var(--rule)] bg-[var(--mount)]">
      <div className="grid grid-cols-[7.5rem_1fr] gap-4 p-4 sm:grid-cols-[10rem_1fr] sm:gap-6 sm:p-5">
        <nav aria-label="Paper contents" className="sticky top-0 self-start border-r border-[var(--rule)] pr-3">
          <ol className="space-y-1">
            {TOC.map((s, k) => (
              <li key={s.id} className={s.tier === 2 && TOC[k - 1]?.tier === 1 ? "mt-3 border-t border-[var(--rule)] pt-3" : ""}>
                <button type="button" onClick={() => go(s.id)} aria-current={active === s.id ? "true" : undefined}
                  className={`${SANS} ${FOCUS} w-full rounded-[2px] py-0.5 text-left text-[12.5px] leading-tight transition-colors duration-200 hover:text-[var(--ink)] ${s.tier === 1 ? "font-semibold" : "font-normal"} ${active === s.id ? "text-[var(--ink)] shadow-[inset_-2px_0_0_var(--ink)]" : s.tier === 1 ? "text-[var(--ink-soft)]" : "text-[var(--muted)]"}`}>
                  <span className={`${MONO} mr-1 text-[11px] font-normal`}>{s.n}</span>{s.t}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div className="space-y-7 pb-52">
          {TOC.map((s) => (
            <section key={s.id} data-id={s.id}>
              <h4 className={`${SERIF} text-[18px] leading-tight font-[450]`}>{s.n} {s.t}</h4>
              <p className={`${SERIF} mt-1.5 text-[15px] leading-[1.6]`}>{s.p}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== N8 · transformer-circuits: findings-card grid */
function MiniNodes({ labels, hot }: { labels: string[]; hot: number }) {
  // A tiny stacked-card circuit: labels[0] at the top, the rest feeding it; one path in the accent.
  const W = 200, H = 120;
  const xs = labels.slice(1).map((_, i, a) => 30 + (i * (W - 60)) / Math.max(1, a.length - 1));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" aria-hidden>
      {xs.map((x, i) => (
        <path key={i} d={`M${x},88 C${x},60 ${W / 2},60 ${W / 2},38`} fill="none" stroke={i === hot ? "var(--accent)" : "var(--oxblood)"} strokeOpacity={i === hot ? 1 : 0.45} strokeWidth={i === hot ? 1.6 : 0.9} className={i === hot ? "transition-[stroke-width] duration-300 group-hover:[stroke-width:2.4]" : ""} />
      ))}
      {[[W / 2, 24, labels[0], true] as const, ...xs.map((x, i) => [x, 100, labels[i + 1], i === hot] as const)].map(([x, y, t, h], i) => (
        <g key={i}>
          <rect x={x - 24 + 2.5} y={y - 11 + 2.5} width="48" height="22" rx="2" fill="var(--paper)" stroke={h ? "var(--accent)" : "var(--oxblood)"} strokeWidth="0.6" />
          <rect x={x - 24} y={y - 11} width="48" height="22" rx="2" fill={h && i > 0 ? "var(--accent-wash)" : "var(--parchment)"} stroke={h ? "var(--accent)" : "var(--oxblood)"} strokeWidth="0.75" />
          <text x={x} y={y} dy="0.35em" textAnchor="middle" fontSize="10" className={MONO} fill="var(--ink)">{t}</text>
        </g>
      ))}
    </svg>
  );
}
const FINDINGS = [
  { href: "#nv-scrolly", t: "Groups, not subsystems", d: "BIC finds 21 and 29 modes, beside 18 and 29 groups.", nodes: ["K* 21", "S1", "G4", "S6"], hot: 1 },
  { href: "#tm-pr", t: "GMM leads Mission 1", d: "PR-AUC 0.384 and ROC-AUC 0.692, above every VAE.", nodes: ["0.384", "PCA", "GMM", "VAE"], hot: 1 },
  { href: "#tm-table", t: "VAEs lead Mission 2", d: "TransformerVAE reaches 0.438 on rare events.", nodes: ["0.438", "Cap", "Hier", "Trans"], hot: 2 },
  { href: "#tm-timeline", t: "One threshold can’t fit", d: "The nominal floor drifts with each operating mode.", nodes: ["alarm", "mode A", "mode B", "fault"], hot: 2 },
  { href: "#nv-twin", t: "K-Means forgets the fault", d: "Its score spikes at onset, then falls back to nominal.", nodes: ["967 h", "onset", "drift", "end"], hot: 0 },
  { href: "#tm-alert", t: "Linear plateau at 0.322", d: "K-Means and PCA both stop at the same PR-AUC.", nodes: ["0.322", "K-M", "PCA", "KPCA"], hot: 2 },
];
export function FindingsGrid() {
  return (
    <ul className="grid gap-4 min-[520px]:grid-cols-2 lg:grid-cols-3">
      {FINDINGS.map((f) => (
        <li key={f.t}>
          <a href={f.href} className={`${FOCUS} group flex h-full flex-col rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[var(--ink)] active:translate-y-0`}>
            <span className="block border-b border-[var(--rule)] px-4 pt-3 pb-2 sm:px-5 sm:pt-4 sm:pb-3"><span className="mx-auto block max-w-[250px]"><MiniNodes labels={f.nodes} hot={f.hot} /></span></span>
            <span className="flex flex-1 flex-col px-5 py-4">
              <span className={`${SANS} text-[14px] font-semibold text-[var(--ink)]`}>{f.t}</span>
              <span className={`${SANS} mt-1 text-[13px] leading-[1.45] text-[var(--muted)]`}>{f.d}</span>
              <span className={`${SANS} mt-auto inline-flex items-center gap-1.5 pt-3 text-[12.5px] font-medium text-[var(--ink)] underline decoration-transparent underline-offset-4 transition-colors duration-200 group-hover:decoration-[var(--ink)]`}>Go to the figure <IconArrow size={11} /></span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/* ================================================================== N9 · transformer-circuits: parchment node diagram, two tiers */
function GmmDiagram({ g, ids, sel, W = 560, compact }: { g: Gmm; ids: number[]; sel: number; W?: number; compact?: boolean }) {
  const H = 340;
  const comps = ids.map((id) => g.comps.find((c) => c.id === id)!);
  const topGroups = (c: Gmm["comps"][number], n = 2) => c.grp.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v).slice(0, n).filter((x) => x.v > 0.05);
  const gIdx = Array.from(new Set(comps.flatMap((c) => topGroups(c, c.id === sel ? 3 : 1).map((x) => x.i)))).sort((a, b) => +g.groups[a] - +g.groups[b]);
  const spread = (n: number, i: number, pad: number) => pad + (i * (W - pad * 2)) / Math.max(1, n - 1);
  const sx = (i: number) => spread(g.subs.length, i, 96);
  const cx = (k: number) => spread(comps.length, k, compact ? 50 : 30);
  const gx = (i: number) => spread(gIdx.length, gIdx.indexOf(i), 40);
  const yS = 300, yC = 175, yG = 52;
  const nw = compact ? 56 : Math.min(56, (W - 60) / comps.length - 6);
  const edge = (x1: number, y1: number, x2: number, y2: number) => `M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`;
  const Node = ({ x, y, w, t, hot, sub }: { x: number; y: number; w: number; t: string; hot?: boolean; sub?: string }) => (
    <g>
      <rect x={x - w / 2 + 3} y={y - 14 + 3} width={w} height={28} rx="2" fill="var(--paper)" stroke={hot ? "var(--accent)" : "var(--oxblood)"} strokeWidth="0.75" />
      <rect x={x - w / 2} y={y - 14} width={w} height={28} rx="2" fill={hot ? "var(--accent-wash)" : "var(--parchment)"} stroke={hot ? "var(--accent)" : "var(--oxblood)"} strokeWidth={hot ? 1.3 : 0.75} />
      <text x={x} y={sub ? y - 2 : y} dy="0.35em" textAnchor="middle" className={SANS} fontWeight={500} fill="var(--ink)">{t}</text>
      {sub && <text x={x} y={y + 9} textAnchor="middle" className={`${MONO} rpd-t-sm`} fill={hot ? "var(--accent-ink)" : "var(--muted)"}>{sub}</text>}
    </g>
  );
  return (
    <Svg vw={W} vh={H} role="img" aria-label={`GMM components on Mission 1 as a circuit: subsystems feed components, components map onto operational groups. Component C${sel} is the highlighted path.`}>
      {comps.map((c, k) => {
        const hot = c.id === sel;
        return (
          <g key={c.id} opacity={hot ? 1 : 0.9}>
            {c.sub.map((v, i) => v > 0.05 && <path key={`s${i}`} d={edge(sx(i), yS - 15, cx(k), yC + 17)} fill="none" stroke={hot ? "var(--accent)" : "var(--oxblood)"} strokeOpacity={hot ? 1 : 0.18 + v * 0.5} strokeWidth={hot ? 1.6 : 0.5 + v * 1.4} />)}
            {topGroups(c, hot ? 3 : 1).map(({ v, i }) => <path key={`g${i}`} d={edge(cx(k), yC - 15, gx(i), yG + 17)} fill="none" stroke={hot ? "var(--accent)" : "var(--oxblood)"} strokeOpacity={hot ? 1 : 0.18 + v * 0.5} strokeWidth={hot ? 1.6 : 0.5 + v * 1.4} />)}
          </g>
        );
      })}
      {gIdx.map((i) => <Node key={i} x={gx(i)} y={yG} w={40} t={`G${g.groups[i]}`} hot={topGroups(g.comps.find((c) => c.id === sel)!, 3).some((x) => x.i === i)} />)}
      {comps.map((c, k) => <Node key={c.id} x={cx(k)} y={yC} w={nw} t={`C${c.id}`} hot={c.id === sel} sub={compact || c.id === sel ? `${(c.anomalyRate * 100).toFixed(0)}%` : undefined} />)}
      {g.subs.map((s, i) => <Node key={s} x={sx(i)} y={yS} w={52} t={`S${s}`} />)}
      <text x={4} y={yG - 26} className={MONO} fill="var(--muted)">groups</text>
      <text x={4} y={yC - 26} className={MONO} fill="var(--muted)">components · % anomalous</text>
      <text x={4} y={yS - 24} className={MONO} fill="var(--muted)">subsystems</text>
    </Svg>
  );
}

export function TwoTierDiagram({ gmm }: { gmm: Gmm }) {
  const top6 = [...gmm.comps].sort((a, b) => b.weight - a.weight).slice(0, 6).map((c) => c.id);
  const hot = gmm.comps.filter((c) => top6.includes(c.id)).reduce((a, b) => (b.anomalyRate > a.anomalyRate ? b : a)).id;
  const [open, setOpen] = useState(false);
  const all = [...gmm.comps].sort((a, b) => b.weight - a.weight);
  const [sel, setSel] = useState(hot);
  const c = gmm.comps.find((x) => x.id === sel)!;
  const topSub = c.sub.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v)[0];
  const topGrp = c.grp.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v)[0];
  return (
    <div>
      <div className="rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] p-3 sm:p-5">
        <GmmDiagram g={gmm} ids={top6} sel={hot} compact />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className={`${caption} max-w-[52ch]`}>Mission 1, K = 21: the six heaviest components. C{hot} carries {(gmm.comps.find((x) => x.id === hot)!.weight * 100).toFixed(1)}% of timesteps and {(gmm.comps.find((x) => x.id === hot)!.anomalyRate * 100).toFixed(1)}% of them are labelled anomalous, so it gets the one accent path.</p>
        <button type="button" className={btnSecondary} onClick={() => setOpen(true)}>Open explorer <IconArrow /></button>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} wide kicker="Explorer · GMM, Mission 1, K = 21" title="Trace any component">
        <div className="grid gap-5 md:grid-cols-[13rem_minmax(0,1fr)]">
          <div>
            <p className={`${SANS} mb-2 text-[13px] font-medium`}>Components by weight</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose a component">
              {all.map((x) => (
                <button key={x.id} type="button" aria-pressed={sel === x.id} onClick={() => setSel(x.id)} className={`${chip} h-7 px-2 ${MONO} text-[12px]`}>
                  <IconCheck size={10} className={chipCheck} />C{x.id}
                </button>
              ))}
            </div>
            <dl className={`${SANS} mt-4 grid grid-cols-[1fr_auto] gap-y-1.5 border-t border-[var(--rule)] pt-3 text-[13px]`}>
              <dt className="text-[var(--muted)]">Weight</dt><dd className={MONO}>{(c.weight * 100).toFixed(1)}%</dd>
              <dt className="text-[var(--muted)]">Labelled anomalous</dt><dd className={MONO}>{(c.anomalyRate * 100).toFixed(1)}%</dd>
              <dt className="text-[var(--muted)]">Main subsystem</dt><dd className={MONO}>S{gmm.subs[topSub.i]} · {(topSub.v * 100).toFixed(0)}%</dd>
              <dt className="text-[var(--muted)]">Main group</dt><dd className={MONO}>G{gmm.groups[topGrp.i]} · {(topGrp.v * 100).toFixed(0)}%</dd>
            </dl>
          </div>
          <div className="min-w-0 overflow-x-auto rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] p-3">
            <div className="min-w-[560px]"><GmmDiagram g={gmm} ids={all.map((x) => x.id)} sel={sel} W={760} /></div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

/* ================================================================== N10 · Apple: giant-type stat reveal */
export function GiantStat() {
  const [ref, seen] = useInView<HTMLDivElement>(0.4);
  return (
    <div ref={ref} data-inview={seen} className="rpd-reveal">
      <div className="grid gap-10 sm:grid-cols-2">
        {[
          { m: 1, k: 21, s: 4, g: 18 },
          { m: 2, k: 29, s: 5, g: 29 },
        ].map((x, j) => (
          <div key={x.m} className="border-t border-[var(--ink)] pt-4">
            <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>Mission {x.m} · BIC minimum</p>
            <p data-d style={{ transitionDelay: `${j * 160}ms` }} className={`${SERIF} mt-2 text-[clamp(6rem,17vw,12.5rem)] leading-[0.85] font-light tracking-[-0.045em] text-[var(--ink)] tabular-nums`}>{x.k}</p>
            <div data-d style={{ transitionDelay: `${300 + j * 160}ms` }} className="mt-5">
              <div className="relative h-10" aria-hidden>
                <span className="absolute inset-x-0 top-3 h-px bg-[var(--ink)]" />
                {[0, 10, 20, 30].map((v) => <span key={v} className="absolute top-2 h-2 w-px bg-[var(--rule-strong)]" style={{ left: `${(v / 30) * 100}%` }} />)}
                {[{ v: x.s, c: "var(--muted)" }, { v: x.g, c: "var(--ink)" }].map((p) => (
                  <span key={p.v} className={`${MONO} absolute top-0 flex -translate-x-1/2 flex-col items-center text-[11px]`} style={{ left: `${(p.v / 30) * 100}%`, color: p.c }}>
                    <span className="h-[18px] w-px" style={{ background: p.c }} />
                    <span className="mt-0.5">{p.v}</span>
                  </span>
                ))}
                <span className="absolute top-[7px] size-[11px] -translate-x-1/2 rounded-full border-[1.5px] border-[var(--accent)] bg-[var(--paper)]" style={{ left: `${(x.k / 30) * 100}%` }} />
              </div>
              <p className={`${SANS} text-[13px] leading-[1.45]`}>
                <span className="text-[var(--ink)]">Beside the {x.g} operational groups,</span> <span className="text-[var(--muted)]">not the {x.s} subsystems.</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
