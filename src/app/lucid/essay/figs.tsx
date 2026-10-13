"use client";

// The site's figures, all on one global mission and one colour key:
// Prussian = operational groups (and the mode-aware mixture model), Ochre = subsystems, Ink = everything else.
// Vermilion never appears here; it belongs to "Read the paper" alone.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import type { Bic, PrSet, Twin } from "../../design-systems/refined-paper/data";
import { Svg, path, useInView } from "../../design-systems/refined-paper/fig";
import { IconPause, IconPlay, IconStep, MONO, SANS, SERIF, btnTransport, btnTransportMain, caption } from "../../design-systems/refined-paper/kit";
import { Segmented } from "../../design-systems/refined-paper/ui";
import { PageRef } from "./reader";

export type M = 1 | 2;
export type Ch = { id: number; s: string; g: number };
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const at = (pts: [number, number][], r: number) => pts[Math.round(clamp(r) * (pts.length - 1))][1];
const reduced = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** One figure: a title, the drawing, and a one-line caption that ends in its page chip. */
export function Figure({ id, title, cap, chip, children, className = "" }: { id?: string; title?: string; cap: ReactNode; chip: ReactNode; children: ReactNode; className?: string }) {
  return (
    <figure id={id} tabIndex={id ? -1 : undefined} className={`flex min-w-0 flex-col outline-none ${className}`}>
      {title && <h3 className={`${SERIF} mb-5 text-[22px] leading-[1.2] font-[450]`}>{title}</h3>}
      <div className="min-w-0 flex-1">{children}</div>
      <figcaption className={`${caption} mt-3 flex flex-wrap items-baseline gap-x-1.5`}>
        <span>{cap}</span> {chip}
      </figcaption>
    </figure>
  );
}

/* ================================================================== the channel field
   One layout, three stages: 0 every channel in a grid (ink) · 1 piled by subsystem (ochre) · 2 lifted into
   its operational groups (Prussian). The hero settles 1 → 2 once; §01 steps through 0 → 1 → 2 on scroll.
   Dots move, never redraw, so each channel can be followed. */
const FW = 440, FH = 380, BASE = 318, TOP = 14, ROWS = 4, GAP = 12, DOT = 2.7;
function useField(ch: Ch[]) {
  return useMemo(() => {
    const subs = Array.from(new Set(ch.map((c) => c.s)));
    const groupsOf = subs.map((s) => Array.from(new Set(ch.filter((c) => c.s === s).map((c) => c.g))));
    const colsOf = groupsOf.map((g) => Math.ceil(g.length / ROWS));
    const C = colsOf.reduce((a, b) => a + b, 0);
    const cw = (FW - GAP * (subs.length - 1)) / C, chh = (BASE - TOP - 10) / ROWS;
    const maxN = Math.max(...groupsOf.flat().map((g) => ch.filter((c) => c.g === g).length));
    const sp = Math.min(4.4, (Math.min(cw, chh) / 2 - 3) / Math.sqrt(maxN + 0.5));
    const sunflower = (i: number, c: number): [number, number] => { const r = c * Math.sqrt(i + 0.5), t = i * 2.39996; return [r * Math.cos(t), r * Math.sin(t)]; };
    const pos: [Record<number, [number, number]>, Record<number, [number, number]>, Record<number, [number, number]>] = [{}, {}, {}];
    const spans: { s: string; x0: number; x1: number; n: number; groups: number }[] = [];
    const rings: { g: number; x: number; y: number; r: number }[] = [];
    let x = 0;
    subs.forEach((s, si) => {
      const w = colsOf[si] * cw, mine = ch.filter((c) => c.s === s);
      spans.push({ s, x0: x, x1: x + w, n: mine.length, groups: groupsOf[si].length });
      // pile: one sunflower per subsystem, resting on its bracket
      const pr = 3.6 * Math.sqrt(mine.length + 0.5);
      mine.forEach((c, i) => { const [dx, dy] = sunflower(i, 3.6); pos[1][c.id] = [x + w / 2 + dx, BASE - pr - 8 + dy]; });
      // groups: stacked upward from the bracket, one small sunflower each
      const cols = colsOf[si];
      groupsOf[si].forEach((g, k) => {
        const cx = x + ((k % cols) + 0.5) * cw, cy = BASE - 10 - (Math.floor(k / cols) + 0.5) * chh;
        const mine2 = ch.filter((c) => c.g === g);
        mine2.forEach((c, i) => { const [dx, dy] = sunflower(i, sp); pos[2][c.id] = [cx + dx, cy + dy]; });
        rings.push({ g, x: cx, y: cy, r: sp * Math.sqrt(mine2.length) + DOT + 3.5 });
      });
      x += w + GAP;
    });
    const sorted = [...ch].sort((a, b) => a.id - b.id), gc = Math.ceil(Math.sqrt(ch.length * 1.6));
    sorted.forEach((c, i) => (pos[0][c.id] = [8 + (i % gc) * ((FW - 16) / (gc - 1)), 60 + Math.floor(i / gc) * 20]));
    const gIndex = new Map(groupsOf.flat().map((g, i) => [g, i]));
    return { subs, spans, rings, pos, gIndex, nGroups: groupsOf.flat().length };
  }, [ch]);
}

export function ChannelField({ ch, stage, label }: { ch: Ch[]; stage: 0 | 1 | 2; label: string }) {
  const f = useField(ch);
  const fill = ["var(--ink)", "var(--ochre)", "var(--prussian)"][stage];
  return (
    <Svg vw={FW} vh={FH} role="img" aria-label={label}>
      {/* subsystem brackets: ochre hairlines under each pile, with the count */}
      <g style={{ opacity: stage === 0 ? 0 : 1, transition: "opacity 400ms var(--ease)" }}>
        {f.spans.map((s) => (
          <g key={s.s}>
            <path d={`M${s.x0 + 1},${BASE - 4} V${BASE} H${s.x1 - 1} V${BASE - 4}`} fill="none" stroke="var(--ochre)" strokeWidth="1" />
            <text x={(s.x0 + s.x1) / 2} y={BASE + 18} textAnchor="middle" className={MONO} fill="var(--ochre)">S{s.s}</text>
            <text x={(s.x0 + s.x1) / 2} y={BASE + 33} textAnchor="middle" className={MONO} fill="var(--muted)">{stage === 2 ? s.groups : s.n}</text>
          </g>
        ))}
      </g>
      <g style={{ opacity: stage === 2 ? 1 : 0, transition: `opacity 600ms var(--ease) ${stage === 2 ? 700 : 0}ms` }}>
        {f.rings.map((r) => <circle key={r.g} cx={r.x} cy={r.y} r={r.r} fill="none" stroke="var(--prussian)" strokeOpacity="0.35" strokeWidth="0.75" />)}
      </g>
      {ch.map((c) => {
        const [px, py] = f.pos[stage][c.id];
        const d = stage === 2 ? Math.min(360, (f.gIndex.get(c.g) ?? 0) * 12) : stage === 1 ? 0 : (c.id % 19) * 10;
        return <circle key={c.id} r={DOT} fill={fill} style={{ transform: `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`, transition: `transform 900ms var(--ease) ${d}ms, fill 600ms var(--ease) ${d}ms` }} />;
      })}
    </Svg>
  );
}

/** The hero's figure: Mission N's channels settle from their subsystem piles into their groups, once. */
export function HeroField({ ch, m }: { ch: Ch[]; m: M }) {
  const [stage, setStage] = useState<1 | 2>(1);
  useEffect(() => {
    const t = setTimeout(() => setStage(2), reduced() ? 0 : 420);
    return () => clearTimeout(t);
  }, []);
  const subs = new Set(ch.map((c) => c.s)).size, groups = new Set(ch.map((c) => c.g)).size;
  return (
    <Figure cap={<>Mission {m}: {ch.length} channels, {subs} <span className="text-[var(--ochre)]">subsystems</span>, {groups} <span className="text-[var(--prussian)]">groups</span>.</>} chip={<PageRef p={2}>§2</PageRef>}>
      <ChannelField ch={ch} stage={stage} label={`Mission ${m}: ${ch.length} channels as dots, piled under ${subs} subsystems, then regrouped into ${groups} operational groups.`} />
    </Figure>
  );
}

/** §01: three steps, one field. Desktop: a sticky graphic with the steps scrolling past it.
    Phones and tablets: the same field with a three-way stepper under it (no sticky, no long scroll). */
export function ChannelSteps({ ch, m }: { ch: Ch[]; m: M }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [tap, setTap] = useState<0 | 1 | 2>(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setStep(+(e.target as HTMLElement).dataset.step! as 0 | 1 | 2)), { rootMargin: "-45% 0px -45% 0px" });
    refs.current.forEach((s) => s && io.observe(s));
    return () => io.disconnect();
  }, []);
  const subs = new Set(ch.map((c) => c.s)).size, groups = new Set(ch.map((c) => c.g)).size;
  const STEPS: [string, ReactNode][] = [
    [`${ch.length} channels`, <>Each <b className="font-semibold">channel</b> is one sensor’s time series: a reading every ~{m === 1 ? 30 : 18} s, for years.</>],
    [`${subs} subsystems`, <>ESA files them under {subs} <b className="font-semibold text-[var(--ochre)]">subsystems</b>: physical units such as power or attitude control.</>],
    [`${groups} groups`, <>Each subsystem divides into finer <b className="font-semibold text-[var(--prussian)]">operational groups</b>, such as battery charging.</>],
  ];
  const cap = <>Each dot is one channel of Mission {m}. S1, S2… are ESA’s anonymised subsystem numbers; the number under each counts its channels, then, once they appear, its groups.</>;
  const label = (k: number) => `Mission ${m} channels. Step ${k + 1}: ${STEPS[k][0]}.`;
  return (
    <>
      {/* phones + tablets */}
      <div className="lg:hidden">
        <Figure cap={cap} chip={<PageRef p={2}>§2</PageRef>}>
          <div className="mx-auto max-w-[520px]">
            <ChannelField ch={ch} stage={tap} label={label(tap)} />
          </div>
          <div className="mt-5">
            <Segmented size="sm" label="Step through the channel hierarchy" value={tap} onChange={setTap} options={(["Channels", "Subsystems", "Groups"] as const).map((t, k) => ({ value: k as 0 | 1 | 2, label: t }))} />
          </div>
          <div key={tap} className="rpd-fade mt-4 min-h-[6.5rem]" aria-live="polite">
            <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>{String(tap + 1).padStart(2, "0")} · {STEPS[tap][0]}</p>
            <p className={`${SERIF} mt-1.5 max-w-[34ch] text-[19px] leading-[1.4]`}>{STEPS[tap][1]}</p>
          </div>
        </Figure>
      </div>
      {/* desktop: sticky graphic */}
      <div className="hidden gap-x-10 lg:grid lg:grid-cols-12">
        <div className="sticky top-[88px] order-2 col-span-7 self-start">
          <Figure cap={cap} chip={<PageRef p={2}>§2</PageRef>}>
            <ChannelField ch={ch} stage={step} label={label(step)} />
          </Figure>
        </div>
        <div className="order-1 col-span-5">
          {STEPS.map(([t, body], k) => (
            <div key={t} ref={(el) => { refs.current[k] = el; }} data-step={k} className={`flex min-h-[34vh] items-center py-6 transition-colors duration-300 ${step === k ? "" : "text-[var(--muted)] [&_b]:!text-[var(--muted)]"}`}>
              <div>
                <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>{String(k + 1).padStart(2, "0")} · {t}</p>
                <p className={`${SERIF} mt-2 max-w-[26ch] text-[25px] leading-[1.4]`}>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/* ================================================================== 03 · the giant numerals */
export function GiantK({ m, bic }: { m: M; bic: Bic[] }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  return (
    <div ref={ref} data-inview={seen} className="rpd-reveal grid grid-cols-2 gap-6 sm:gap-10">
      {bic.map((b, j) => {
        const on = b.mission === m;
        return (
          <div key={b.mission} className={`border-t pt-3 transition-colors duration-300 ${on ? "border-[var(--ink)]" : "border-[var(--rule-strong)]"}`}>
            <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>Mission {b.mission} · K*</p>
            <p data-d style={{ transitionDelay: `${j * 140}ms` }} className={`${SERIF} mt-3 text-[clamp(5.5rem,10vw,9.5rem)] leading-[0.82] font-light tracking-[-0.045em] tabular-nums transition-colors duration-300 ${on ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}>{b.selectedK}</p>
            <div data-d style={{ transitionDelay: `${260 + j * 140}ms` }} className="relative mt-6 h-10" aria-hidden>
              <span className="absolute inset-x-0 top-3 h-px bg-[var(--ink)]" />
              {[{ v: b.subsystems, c: "var(--ochre)" }, { v: b.groups, c: "var(--prussian)" }].map((p) => (
                <span key={p.v} className={`${MONO} absolute top-0 flex -translate-x-1/2 flex-col items-center text-[11px]`} style={{ left: `${(p.v / 30) * 100}%`, color: p.c }}>
                  <span className="h-[18px] w-px" style={{ background: p.c }} />
                  <span className="mt-0.5">{p.v}</span>
                </span>
              ))}
              <span className="absolute top-[7px] size-[11px] -translate-x-1/2 rounded-full border-[1.5px] border-[var(--ink)] bg-[var(--paper)]" style={{ left: `${(b.selectedK / 30) * 100}%` }} />
            </div>
            <p className={`${SANS} text-[12px] leading-[1.4] text-[var(--muted)]`}><span className="text-[var(--ochre)]">{b.subsystems} subsystems</span> · <span className="text-[var(--prussian)]">{b.groups} groups</span></p>
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================== 03 · BIC step player (Distill) */
export function BicPlayer({ m, sweeps }: { m: M; sweeps: Bic[] }) {
  const b = sweeps[m - 1];
  const n = b.sweep.length;
  const [i, setI] = useState(n - 1);
  const [playing, setPlaying] = useState(false);
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setI((v) => (v >= n - 1 ? (setPlaying(false), v) : v + 1)), 320);
    return () => clearInterval(t);
  }, [playing, n]);
  const W = 600, H = 300, L = 50, R = 14, T = 26, B = 40;
  const ks = b.sweep.map((s) => s.k), bics = b.sweep.map((s) => s.bic);
  const x = (k: number) => L + ((k - ks[0]) / (ks[n - 1] - ks[0])) * (W - L - R);
  const lo = Math.min(...bics), hi = Math.max(...bics);
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const d = (upto: number) => b.sweep.slice(0, upto + 1).map((s, j) => `${j ? "L" : "M"}${x(s.k).toFixed(1)},${y(s.bic).toFixed(1)}`).join("");
  const minI = b.sweep.findIndex((s) => s.k === b.selectedK);
  const cur = b.sweep[Math.min(i, n - 1)];
  const go = (v: number) => { setPlaying(false); setI(clamp(v, 0, n - 1)); };
  return (
    <div ref={ref} data-inview={seen}>
      <Svg vw={W} vh={H} role="img" aria-label={`BIC against K for Mission ${m}. Current K ${cur.k}. Minimum at K ${b.selectedK}, beside ${b.groups} groups, far from ${b.subsystems} subsystems.`}>
        {([[b.subsystems, "subsystems", "var(--ochre)"], [b.groups, "groups", "var(--prussian)"]] as const).map(([k, t, c]) => (
          <g key={t}>
            <line x1={x(k)} x2={x(k)} y1={T - 8} y2={H - B} stroke={c} strokeDasharray="2 3" />
            <text x={x(k) + (k > 26 ? -5 : 5)} y={T - 12} textAnchor={k > 26 ? "end" : "start"} className={MONO} fill={c}>{k} {t}</text>
          </g>
        ))}
        <path d={d(n - 1)} fill="none" stroke="var(--rule)" strokeWidth="1.25" />
        <path d={d(i)} pathLength={1} fill="none" stroke="var(--ink)" strokeWidth="1.6" strokeLinejoin="round" className="rps-draw" />
        {i >= minI && (
          <g className="rpd-fade">
            <circle cx={x(b.selectedK)} cy={y(b.sweep[minI].bic)} r="7" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            <text x={x(b.selectedK) + (b.selectedK > 25 ? -14 : 12)} y={y(b.sweep[minI].bic) - (b.selectedK > 25 ? 34 : 14)} textAnchor={b.selectedK > 25 ? "end" : "start"} className={`${MONO} rpd-t-lg`} fontWeight={600} fill="var(--ink)" stroke="var(--paper)" strokeWidth="4" paintOrder="stroke">K* = {b.selectedK}</text>
          </g>
        )}
        <circle cx={x(cur.k)} cy={y(cur.bic)} r="4.5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
        <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="var(--ink)" strokeWidth="0.75" />
        {[2, 10, 20, 30].map((k) => <text key={k} x={x(k)} y={H - B} dy="1.4em" textAnchor="middle" className={MONO} fill="var(--muted)">{k}</text>)}
        <text x={W - R} y={H - B} dy="2.8em" textAnchor="end" className={MONO} fill="var(--muted)">components K</text>
        <text x={L - 8} y={y(hi)} dy="0.35em" textAnchor="end" className={MONO} fill="var(--muted)">{hi.toFixed(0)}M</text>
        <text x={L - 8} y={y(lo)} dy="0.35em" textAnchor="end" className={MONO} fill="var(--muted)">{lo.toFixed(1)}M</text>
        <text x={L - 8} y={T - 12} textAnchor="end" className={MONO} fill="var(--muted)">BIC</text>
      </Svg>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" aria-pressed={playing} aria-label={playing ? "Pause the sweep" : "Play the sweep"} onClick={() => { if (!playing && i >= n - 1) setI(0); setPlaying((p) => !p); }} className={btnTransportMain}>{playing ? <IconPause /> : <IconPlay />}</button>
        <button type="button" aria-label="Previous K" disabled={i === 0} onClick={() => go(i - 1)} className={btnTransport}><IconStep back /></button>
        <button type="button" aria-label="Next K" disabled={i === n - 1} onClick={() => go(i + 1)} className={btnTransport}><IconStep /></button>
        <label className="flex min-w-0 flex-1 basis-[8rem] items-center px-1">
          <span className="sr-only">Scrub K</span>
          <input type="range" min={0} max={n - 1} value={i} onChange={(e) => go(+e.target.value)} className="rpd-range w-full" style={{ ["--p" as string]: `${(i / (n - 1)) * 100}%` }} aria-valuetext={`K ${cur.k}`} />
        </label>
        <output className={`${MONO} w-[8.5rem] text-right text-[12px] text-[var(--muted)]`} aria-live="polite">K <span className="text-[var(--ink)]">{cur.k}</span> · BIC {cur.bic.toFixed(2)}M</output>
      </div>
    </div>
  );
}

/* ================================================================== 03 · the draggable PR figure (Ciechanowski): words keyed to lines */
export function PrDrag({ m, sets }: { m: M; sets: PrSet[] }) {
  const set = sets[m - 1];
  const a = set.curves.find((c) => c.label === "GMM")!;
  const b = set.curves.find((c) => c.label === (m === 1 ? "K-Means" : "TransformerVAE"))!;
  const bName = m === 1 ? "K-Means" : "TransformerVAE";
  const [r, setR] = useState(0.4);
  const [hl, setHl] = useState<"a" | "b" | null>(null);
  const [focus, setFocus] = useState(false);
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  const svg = useRef<SVGSVGElement>(null);
  const W = 560, H = 300, L = 46, R = 14, T = 14, B = 36;
  const x = (v: number) => L + v * (W - L - R);
  const y = (v: number) => T + (1 - v) * (H - T - B);
  const pa = at(a.points, r), pb = at(b.points, r);
  const fromEvent = (e: PointerEvent) => {
    const bx = svg.current!.getBoundingClientRect();
    setR(Math.round(clamp((((e.clientX - bx.left) / bx.width) * W - L) / (W - L - R), 0.01, 0.99) * 100) / 100);
  };
  const onKey = (e: KeyboardEvent) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
    if (e.key === "Home") { e.preventDefault(); setR(0.01); }
    if (e.key === "End") { e.preventDefault(); setR(0.99); }
    if (!d) return;
    e.preventDefault();
    setR((v) => Math.round(clamp(v + d * (e.shiftKey ? 0.1 : 0.01), 0.01, 0.99) * 100) / 100);
  };
  const word = (k: "a" | "b", color: string, text: string) => (
    <b onMouseEnter={() => setHl(k)} onMouseLeave={() => setHl(null)} className="font-semibold transition-opacity duration-200" style={{ color, opacity: hl && hl !== k ? 0.45 : 1 }}>{text}</b>
  );
  const dim = (k: "a" | "b") => (hl && hl !== k ? 0.22 : 1);
  const ap = (c: typeof a) => (c.exact ? `AP ${c.ap.toFixed(3)}` : `saved AP ${c.ap.toFixed(3)} (Table 1: ${c.reportAp?.toFixed(3)})`);
  return (
    <div ref={ref} data-inview={seen}>
      <p className={`${SANS} mb-3 text-[14px] leading-[1.5]`} aria-live="polite">
        Recall <span className={MONO}>{r.toFixed(2)}</span>: {word("a", "var(--prussian)", "GMM")} <span className={MONO}>{pa.toFixed(2)}</span> precision, {word("b", "var(--ink)", bName)} <span className={MONO}>{pb.toFixed(2)}</span>.
      </p>
      <Svg ref={svg} vw={W} vh={H} className="cursor-ew-resize touch-pan-y select-none" role="group" aria-label={`Precision–recall curves, Mission ${m}. Drag across, or focus the handle and use the arrow keys.`}
        onPointerDown={(e) => { (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId); fromEvent(e); }}
        onPointerMove={(e) => e.buttons && fromEvent(e)}>
        {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={x(0)} x2={x(1)} y1={y(g)} y2={y(g)} stroke="var(--rule)" strokeWidth="0.5" />)}
        <line x1={x(0)} x2={x(1)} y1={y(set.positiveRate)} y2={y(set.positiveRate)} stroke="var(--muted)" strokeDasharray="2 3" />
        <text x={x(0) + 6} y={y(set.positiveRate)} dy="-0.5em" className={MONO} fill="var(--muted)">random {(set.positiveRate * 100).toFixed(1)}%</text>
        <path key={`b${m}`} d={path(b.points, x, y)} pathLength={1} fill="none" stroke="var(--ink)" strokeWidth={hl === "b" ? 2 : 1.3} opacity={dim("b")} className="rps-draw" />
        <path key={`a${m}`} d={path(a.points, x, y)} pathLength={1} fill="none" stroke="var(--prussian)" strokeWidth={hl === "a" ? 2.4 : 1.8} opacity={dim("a")} className="rps-draw" />
        <line x1={x(0)} x2={x(1)} y1={y(0)} y2={y(0)} stroke="var(--ink)" strokeWidth="0.75" />
        <line x1={x(0)} x2={x(0)} y1={y(0)} y2={y(1)} stroke="var(--ink)" strokeWidth="0.75" />
        {[0, 0.5, 1].map((v) => (
          <g key={v} className={MONO} fill="var(--muted)">
            <text x={x(v)} y={y(0)} dy="1.4em" textAnchor="middle">{v}</text>
            {v !== 0.5 && <text x={x(0) - 7} y={y(v)} dy="0.35em" textAnchor="end">{v}</text>}
          </g>
        ))}
        <text x={x(1)} y={y(0)} dy="2.7em" textAnchor="end" className={MONO} fill="var(--muted)">recall</text>
        <text transform={`translate(10 ${y(0.5)}) rotate(-90)`} textAnchor="middle" className={MONO} fill="var(--muted)">precision</text>
        <g role="slider" tabIndex={0} aria-label="Recall" aria-valuemin={0} aria-valuemax={1} aria-valuenow={r} aria-valuetext={`recall ${r.toFixed(2)}: GMM ${pa.toFixed(2)}, ${bName} ${pb.toFixed(2)}`} onKeyDown={onKey} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} className="outline-none">
          <rect x={x(r) - 14} y={T - 4} width={28} height={H - T - B + 8} fill="transparent" />
          {focus && <rect x={x(r) - 12} y={T - 6} width={24} height={H - T - B + 12} rx="3" fill="none" stroke="var(--ink)" strokeWidth="1.5" />}
          <line x1={x(r)} x2={x(r)} y1={T} y2={y(0)} stroke="var(--ink)" strokeWidth="0.75" />
          <circle cx={x(r)} cy={y(pb)} r="4.5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.6" opacity={dim("b")} />
          <circle cx={x(r)} cy={y(pa)} r="4.5" fill="var(--paper)" stroke="var(--prussian)" strokeWidth="1.8" opacity={dim("a")} />
          <path d={`M${x(r) - 6},${y(0) - 8} l-5,4 5,4 M${x(r) + 6},${y(0) - 8} l5,4 -5,4`} fill="none" stroke="var(--ink)" strokeWidth="1.2" />
        </g>
      </Svg>
      <p className={`${SANS} mt-2 text-[12px] leading-[1.45] text-[var(--muted)]`}>Recomputed from saved scores. GMM {ap(a)} · {bName} {ap(b)}.</p>
    </div>
  );
}

/* ================================================================== 03 · the longest fault: one scrubber, two scores */
export function FaultScrub({ twin }: { twin: Twin }) {
  const n = twin.gmm.length;
  const s0 = twin.kmeans.findIndex((p) => p[0] >= twin.start), s1 = twin.kmeans.findIndex((p) => p[0] >= twin.end);
  const [i, setI] = useState(Math.max(0, s0 - 6));
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
    const t = setInterval(() => setI((v) => (v >= n - 1 ? (setPlaying(false), v) : v + 1)), 40);
    return () => clearInterval(t);
  }, [playing, visible, n]);
  const W = 560, H = 120, L = 4, R = 4, T = 8, B = 20;
  const x = (j: number) => L + (j / (n - 1)) * (W - L - R);
  const hours = ((twin.kmeans[i][0] - twin.start) * 30) / 3600;
  const where = i < s0 ? `${Math.abs(hours).toFixed(0)} h before onset` : i >= s1 ? `${(((twin.kmeans[i][0] - twin.end) * 30) / 3600).toFixed(0)} h after the end` : `${hours.toFixed(0)} h into the fault`;
  const panel = (name: string, color: string, pts: [number, number][]) => {
    const lg = pts.map((p) => Math.log10(Math.max(p[1], 1)));
    const lo = Math.min(...lg), hi = Math.max(...lg);
    const y = (v: number) => T + (1 - (Math.log10(Math.max(v, 1)) - lo) / (hi - lo || 1)) * (H - T - B);
    const d = pts.map((p, j) => `${j ? "L" : "M"}${x(j).toFixed(1)},${y(p[1]).toFixed(1)}`).join("");
    return (
      <div className="min-w-0">
        <p className="flex items-baseline justify-between gap-2 border-b border-[var(--rule)] pb-1">
          <span className={`${SANS} text-[13px] font-medium`} style={{ color }}>{name}</span>
          <span className={`${MONO} text-[11px] text-[var(--muted)]`}>score, log</span>
        </p>
        <Svg vw={W} vh={H} className="mt-1.5" role="img" aria-label={`${name} anomaly score across the longest Mission 1 fault, log scale.`}>
          <rect x={x(s0)} width={x(s1) - x(s0)} y={T - 4} height={H - T - B + 4} fill="var(--band)" />
          <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth="1.3" strokeLinejoin="round" className="rps-draw" />
          <line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="var(--ink)" strokeWidth="0.75" />
          <line x1={x(i)} x2={x(i)} y1={T - 6} y2={H - B} stroke="var(--ink)" strokeWidth="0.75" />
          <circle cx={x(i)} cy={y(pts[i][1])} r="3.5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.4" />
          <text x={x(s0)} y={H - B} dy="1.35em" className={MONO} fill="var(--muted)">onset</text>
          <text x={x(s1)} y={H - B} dy="1.35em" textAnchor="end" className={MONO} fill="var(--muted)">end</text>
        </Svg>
      </div>
    );
  };
  return (
    <div ref={box} data-inview={seen}>
      <div className="grid gap-5">
        {panel("K-Means, K = 8 (saved run)", "var(--ink)", twin.kmeans)}
        {panel("GMM, K = 21", "var(--prussian)", twin.gmm)}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" aria-pressed={playing} aria-label={playing ? "Pause the timeline" : "Play the timeline"} onClick={() => { if (!playing && i >= n - 1) setI(0); setPlaying((p) => !p); }} className={btnTransportMain}>{playing ? <IconPause /> : <IconPlay />}</button>
        <label className="flex min-w-0 flex-1 basis-[8rem] items-center px-1">
          <span className="sr-only">Scrub the fault timeline</span>
          <input type="range" min={0} max={n - 1} value={i} onChange={(e) => { setPlaying(false); setI(+e.target.value); }} className="rpd-range w-full" style={{ ["--p" as string]: `${(i / (n - 1)) * 100}%` }} aria-valuetext={where} />
        </label>
        <output className={`${MONO} w-full text-[12px] text-[var(--ink)] sm:w-[10.5rem] sm:text-right`} aria-live="polite">{where}</output>
      </div>
    </div>
  );
}

/* ================================================================== 02 · the method ladder */
const LADDER = [
  { n: "K-Means", d: "Global clustering, K swept 2–10.", p: 2, sec: "§3", by: 0 },
  { n: "PCA", d: "Linear compression: 33 components hold 95% of variance.", p: 2, sec: "§3", by: 0 },
  { n: "Nyström-KPCA", d: "A non-linear, kernel boundary.", p: 3, sec: "§3", by: 0 },
  { n: "GMM", d: "Full-covariance mixture; BIC picks K.", p: 3, sec: "§4", by: 1 },
  { n: "Three VAEs", d: "Capacity, Hierarchical, Transformer: learned latent codes.", p: 4, sec: "§5", by: 1 },
] as const;
export function Ladder() {
  const [ref, seen] = useInView<HTMLOListElement>(0.3);
  return (
    <div>
      <ol ref={ref} data-inview={seen} className="rps-ladder grid gap-px overflow-hidden rounded-[3px] border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-2 lg:grid-cols-5" aria-label="Methods, in order of richness">
        {LADDER.map((s, k) => (
          <li key={s.n} style={{ ["--k" as string]: k }} className="flex flex-col bg-[var(--mount)] px-4 pt-4 pb-3 sm:last:col-span-2 lg:last:col-span-1">
            {/* the step: a hairline stair that rises with richness */}
            <span aria-hidden className="relative mb-4 hidden h-10 sm:block">
              {LADDER.map((_, j) => (
                <span key={j} className={`rps-step absolute bottom-0 w-[10%] rounded-[1px] ${j === k ? "bg-[var(--ink)]" : j < k ? "bg-[var(--rule-strong)]" : "bg-[var(--rule)]"}`} style={{ left: `${j * 14}%`, height: `${20 + j * 20}%`, ["--j" as string]: j }} />
              ))}
            </span>
            <p className={`${MONO} flex justify-between text-[11px] text-[var(--muted)]`}><span>{String(k + 1).padStart(2, "0")}</span>{s.by ? null : <span>Mission 1 only</span>}</p>
            <h3 className={`${SERIF} mt-0.5 text-[22px] leading-[1.15] font-[450]`}>{s.n}</h3>
            <p className={`${SANS} mt-1.5 text-[13.5px] leading-[1.45] text-[var(--ink-soft)]`}>{s.d}</p>
            <p className="mt-auto flex items-center justify-between gap-2 pt-3">
              <span />
              <PageRef p={s.p}>{s.sec}</PageRef>
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
