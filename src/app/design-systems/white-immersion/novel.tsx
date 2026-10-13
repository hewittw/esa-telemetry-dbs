"use client";
// Section 8 · Novel components, each borrowed from Igloo or Skyviewer and transformed for a white, data-first field.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DSData, Hier } from "./data";
import { Circle, GlyphLoader, Icon, Scramble, Segmented, fmt, pad, useReduced, useScramble, useToast, useWidth } from "./kit";
import { Section, ShardDivider, Spec } from "./shell";

/* ---------- hierarchy layout: subsystems → groups → channels ---------- */
type Node = { x: number; y: number };
const q = (n: number) => Math.round(n * 100) / 100;
function layoutHier(h: Hier, W: number, H: number) {
  const narrow = W < 520;
  const subs = h.map((s, i) => ({ x: q(narrow ? W * (i % 2 ? 0.72 : 0.28) : W * (0.14 + (0.72 * i) / Math.max(1, h.length - 1))), y: q(narrow ? H * (0.27 + 0.5 * Math.floor(i / 2)) + (i % 2 ? 8 : -8) : H * (i % 2 ? 0.6 : 0.42)), name: s.subsystem, n: s.groups.reduce((a, g) => a + g.channels.length, 0) }));
  const groups: (Node & { s: number; id: number; n: number })[] = [];
  const chans: (Node & { g: number; s: number; name: string })[] = [];
  h.forEach((s, si) => {
    const R = s.groups.length === 1 ? 0 : (narrow ? Math.min(W, H) * 0.55 : Math.min(W, H)) * (0.1 + 0.012 * s.groups.length);
    s.groups.forEach((g, gi) => {
      const a = (gi / s.groups.length) * Math.PI * 2 - Math.PI / 2 + si;
      const gx = subs[si].x + Math.cos(a) * R, gy = subs[si].y + Math.sin(a) * R * 0.8;
      groups.push({ x: q(gx), y: q(gy), s: si, id: g.group, n: g.channels.length });
      g.channels.forEach((c, ci) => {
        const b = (ci / g.channels.length) * Math.PI * 2 + gi;
        const r = 7 + g.channels.length * 0.9;
        chans.push({ x: q(gx + Math.cos(b) * r), y: q(gy + Math.sin(b) * r), g: groups.length - 1, s: si, name: c.name });
      });
    });
  });
  return { subs, groups, chans };
}

/* ====================================================================== */
/* N01 · Corner HUD readout (Igloo)                                        */
/* ====================================================================== */
function CornerHud({ d }: { d: DSData }) {
  const [wref, W] = useWidth<HTMLDivElement>(640);
  const H = W < 520 ? 380 : 320;
  const L = useMemo(() => layoutHier(d.hier["1"], W, H), [d, W, H]);
  const [hot, setHot] = useState<number | null>(null);
  const [xy, setXy] = useState({ x: 0, y: 0 });
  const g = hot !== null ? L.groups[hot] : null;
  const name = g ? `Group ${pad(g.id)} · ${d.hier["1"][g.s].subsystem}` : "Channel hierarchy";
  return (
    <div ref={wref} className="relative overflow-hidden border border-[var(--rime)] bg-[radial-gradient(110%_100%_at_50%_45%,#fff_0%,#f4f6f8_65%,#e3e8ee_100%)]"
      onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setXy({ x: Math.round(((e.clientX - r.left) / r.width) * W), y: Math.round(((e.clientY - r.top) / r.height) * H) }); }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="group" aria-label="Mission 1 operational groups. Focus a node to read it in the corner HUD.">
        {L.chans.map((c, i) => <line key={i} x1={L.groups[c.g].x} y1={L.groups[c.g].y} x2={c.x} y2={c.y} stroke="#111824" strokeOpacity={hot === c.g ? 0.55 : 0.12} strokeWidth=".7" />)}
        {L.groups.map((gr, i) => <line key={i} x1={L.subs[gr.s].x} y1={L.subs[gr.s].y} x2={gr.x} y2={gr.y} stroke="#111824" strokeOpacity={hot === i ? 0.7 : 0.18} strokeWidth=".8" />)}
        {L.chans.map((c, i) => <rect key={i} x={c.x - 1.2} y={c.y - 1.2} width="2.4" height="2.4" fill={hot === c.g ? "#111824" : "#56616f"} />)}
        {L.groups.map((gr, i) => (
          <g key={i} tabIndex={0} role="button" aria-label={`Group ${gr.id}, ${gr.n} channels, ${d.hier["1"][gr.s].subsystem}`} aria-pressed={hot === i}
            onMouseEnter={() => setHot(i)} onFocus={() => setHot(i)} onClick={() => setHot(i)} className="wids-svgFocus cursor-pointer">
            <rect x={gr.x - 11} y={gr.y - 8} width="22" height="16" fill={hot === i ? "#111824" : "#fff"} stroke="#111824" strokeWidth="1" />
            <text x={gr.x} y={gr.y + 3.5} textAnchor="middle" fontSize="10.5" fill={hot === i ? "#fff" : "#111824"} style={{ fontFamily: "var(--wi-mono)" }}>{pad(gr.id)}</text>
          </g>
        ))}
      </svg>
      {/* four corners */}
      <div className="wids-hud pointer-events-none absolute left-2 top-2 sm:left-3 sm:top-3"><span className="wids-backing block"><Scramble text={name} /></span></div>
      <div className="wids-hud pointer-events-none absolute right-2 top-2 hidden text-right sm:right-3 sm:top-3 min-[480px]:block">
        <span className="wids-backing ml-auto block">{g ? `${g.n} channels` : `${d.missions["1"].channels} channels`}</span>
        <span className="wids-backing ml-auto block text-[var(--muted)]">{d.missions["1"].groups} groups · {d.missions["1"].subsystems} subsystems</span>
      </div>
      <div className="wids-hud pointer-events-none absolute bottom-2 left-2 sm:bottom-3 sm:left-3"><span className="wids-backing block">{g ? "● Locked" : "○ Hover or Tab a node"}</span></div>
      <div className="wids-hud wids-tick pointer-events-none absolute bottom-2 right-2 sm:bottom-3 sm:right-3"><span className="wids-backing block">X {pad(xy.x, 3)} · Y {pad(xy.y, 3)}</span></div>
    </div>
  );
}

/* ====================================================================== */
/* N02 · Scramble-in label (Igloo)                                         */
/* ====================================================================== */
function ScrambleDemo({ d }: { d: DSData }) {
  const [k, setK] = useState(0);
  const [ms, setMs] = useState(650);
  const best = d.rows.find((r) => r.trend === "Best M2")!;
  const a = useScramble("TransformerVAE · Mission 2", k, ms);
  const b = useScramble(`PR-AUC ${best.prAuc.toFixed(3)}`, k, ms + 150);
  const c = useScramble(`K* = ${d.missions["1"].k} · ${d.missions["2"].k}`, k, ms + 300);
  return (
    <div className="grid gap-4">
      <div className="grid gap-1 border border-[var(--rime)] bg-white p-4" aria-live="off">
        <span className="wids-hud" aria-label="TransformerVAE · Mission 2">{a}</span>
        <span className="wids-num text-[24px]" aria-label={`PR-AUC ${best.prAuc}`}>{b}</span>
        <span className="wids-label" aria-label="K star 21 and 29">{c}</span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="wids-btn" onClick={() => setK(k + 1)}><Icon n="retry" size={13} />Replay</button>
        <label className="flex min-w-[200px] flex-1 items-center gap-3">
          <span className="wids-label shrink-0 text-[var(--ink)]">{ms}ms</span>
          <input type="range" className="wids-range" min={400} max={900} step={50} value={ms} onChange={(e) => { setMs(+e.target.value); setK(k + 1); }} aria-label="Scramble duration" />
        </label>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* N03 · Structure that crystallizes on scroll (Igloo's exploding igloo)  */
/* ====================================================================== */
function Crystallize({ d }: { d: DSData }) {
  const [wref, W] = useWidth<HTMLDivElement>(640);
  const H = W < 520 ? 380 : 340;
  const reduced = useReduced();
  const L = useMemo(() => layoutHier(d.hier["1"], W, H), [d, W, H]);
  const scatter = useMemo(() => { let sd = 11; const r = () => { sd = (sd * 1664525 + 1013904223) % 4294967296; return sd / 4294967296; }; return L.chans.map(() => ({ x: q(20 + r() * (W - 40)), y: q(20 + r() * (H - 40)) })); }, [L, W, H]);
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(reduced ? 1 : 0);
  const [manual, setManual] = useState(false);
  useEffect(() => {
    if (manual) return;
    const on = () => {
      const r = ref.current?.getBoundingClientRect(); if (!r) return;
      const vh = window.innerHeight;
      setP(Math.max(0, Math.min(1, (vh * 0.95 - r.top) / (vh * 0.75))));
    };
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [manual]);
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  const p1 = ease(Math.min(1, p / 0.55)), p2 = ease(Math.max(0, (p - 0.55) / 0.45));
  const stage = p < 0.3 ? "Dissolved · 76 channels" : p < 0.8 ? "Crystallizing · 18 groups" : "Crystallized · 4 subsystems";
  return (
    <div ref={ref} className="grid gap-3">
      <div ref={wref}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full border border-[var(--rime)] bg-white" role="img" aria-label={`Mission 1 channels, ${stage}`}>
        {p2 > 0 && L.subs.map((s, i) => {
          const gs = L.groups.filter((g) => g.s === i);
          const r = Math.min(H * 0.4, Math.max(30, ...gs.map((g) => Math.hypot(g.x - s.x, g.y - s.y) + 22)));
          const pts = Array.from({ length: 6 }, (_, k) => { const a = (k / 6) * Math.PI * 2 + i; return `${(s.x + Math.cos(a) * r).toFixed(1)},${(s.y + Math.sin(a) * r * 0.82).toFixed(1)}`; });
          return (
            <g key={i} opacity={p2}>
              <polygon points={pts.join(" ")} fill="none" stroke="#111824" strokeWidth="1" />
              {pts.map((q, k) => <line key={k} x1={s.x} y1={s.y} x2={+q.split(",")[0]} y2={+q.split(",")[1]} stroke="#111824" strokeOpacity=".14" strokeWidth=".7" />)}
              <text x={Math.min(W - 70, Math.max(70, s.x))} y={Math.max(14, s.y - r * 0.82 - 8)} textAnchor="middle" fontSize="10.5" fill="#111824" style={{ fontFamily: "var(--wi-mono)", letterSpacing: ".08em" }}>{s.name.toUpperCase().replace("SUBSYSTEM", W < 560 ? "SS" : "SUBSYSTEM")} · {s.n}</text>
            </g>
          );
        })}
        {L.chans.map((c, i) => {
          const g = L.groups[c.g];
          const x = scatter[i].x + (c.x - scatter[i].x) * p1, y = scatter[i].y + (c.y - scatter[i].y) * p1;
          return (
            <g key={i}>
              {p1 > 0.6 && <line x1={g.x} y1={g.y} x2={x} y2={y} stroke="#111824" strokeOpacity={(p1 - 0.6) * 0.5} strokeWidth=".7" />}
              <rect x={x - 1.5} y={y - 1.5} width="3" height="3" fill="#111824" opacity={0.45 + 0.55 * p1} />
            </g>
          );
        })}
      </svg>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="wids-hud wids-tick w-[230px] shrink-0">{stage}</span>
        <label className="flex min-w-[180px] flex-1 items-center gap-3">
          <span className="wids-label shrink-0">{Math.round(p * 100)}%</span>
          <input type="range" className="wids-range" min={0} max={100} value={Math.round(p * 100)} aria-label="Crystallize progress" onChange={(e) => { setManual(true); setP(+e.target.value / 100); }} />
        </label>
        {manual && <button type="button" className="wids-btn is-ghost" onClick={() => setManual(false)}>Follow scroll</button>}
      </div>
    </div>
  );
}

/* ====================================================================== */
/* N05 · Frame counter + glyph loader (Igloo)                              */
/* ====================================================================== */
function FrameCounter() {
  const [f, setF] = useState(0);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  useEffect(() => {
    const on = () => { const max = Math.max(1, document.documentElement.scrollHeight - innerHeight); setF(Math.round((scrollY / max) * 1500)); };
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => { if (!loading) return; const id = window.setTimeout(() => { setLoading(false); toast("Score tiles streamed: 1,500 bins ready."); }, 2200); return () => window.clearTimeout(id); }, [loading, toast]);
  return (
    <div className="grid gap-4">
      <div className="border border-[var(--rime)] bg-white p-4">
        <span className="wids-label block">Page frame (scroll position as a timeline bin)</span>
        <span className="wids-num wids-tick mt-1 block text-[30px] leading-none sm:text-[38px]">{pad(f, 4)}<span className="text-[var(--muted)]"> / 1500</span></span>
        <span className="mt-3 block h-[2px] bg-[var(--rime)]"><span className="block h-full bg-[var(--ink)]" style={{ width: `${(f / 1500) * 100}%` }} /></span>
      </div>
      <div className="flex min-h-[44px] flex-wrap items-center gap-3">
        <button type="button" className="wids-btn" onClick={() => setLoading(true)} disabled={loading}>Stream score tiles</button>
        {loading ? <GlyphLoader label="Streaming" /> : <span className="wids-caption">Loader never gates the first paint.</span>}
      </div>
    </div>
  );
}

/* ====================================================================== */
/* N06–N09 · Deep-zoom field viewer (Skyviewer)                            */
/* ====================================================================== */
const NICE_H = [1, 2, 6, 12, 24, 48, 168, 336, 720, 2160, 4320, 8760];
const hLabel = (h: number) => (h >= 8760 ? `${h / 8760} yr` : h >= 720 ? `${h / 720} mo` : h >= 168 ? `${h / 168} wk` : h >= 24 ? `${h / 24} d` : `${h} h`);
type VCam = { c: number; z: number };
const Z_MAX = 60;

function useDeepZoom(segs: [number, number][], reduced: boolean) {
  const [cam, setCam] = useState<VCam>({ c: 0.5, z: 1 });
  const camRef = useRef(cam); camRef.current = cam;
  const anim = useRef(0);
  const clamp = (c: VCam): VCam => { const z = Math.min(Z_MAX, Math.max(1, c.z)); const h = 0.5 / z; return { z, c: Math.min(1 - h, Math.max(h, c.c)) }; };
  const set = useCallback((c: VCam) => { cancelAnimationFrame(anim.current); setCam(clamp(c)); }, []);
  const fly = useCallback((t: VCam, onDone?: () => void) => {
    cancelAnimationFrame(anim.current);
    const to = clamp(t), from = camRef.current;
    if (reduced) { setCam(to); onDone?.(); return 0; }
    const dist = Math.abs(to.c - from.c);
    const dur = Math.min(1700, 800 + dist * 1600);
    const l0 = Math.log(from.z), l1 = Math.log(to.z);
    const zOut = Math.min(from.z, to.z, 1 / (dist * 1.6 + 0.0001));
    const bump = Math.max(0, (l0 + l1) / 2 - Math.log(Math.max(1, zOut)));
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      setCam(clamp({ c: from.c + (to.c - from.c) * e, z: Math.exp(l0 + (l1 - l0) * e - bump * Math.sin(Math.PI * e)) }));
      if (k < 1) anim.current = requestAnimationFrame(step); else onDone?.();
    };
    anim.current = requestAnimationFrame(step);
    return dur;
  }, [reduced]);
  useEffect(() => () => cancelAnimationFrame(anim.current), []);
  const longest = useMemo(() => segs.reduce((a, s) => (s[1] - s[0] > a[1] - a[0] ? s : a), segs[0]), [segs]);
  return { cam, set, fly, longest, camRef };
}

function DeepZoom({ d }: { d: DSData }) {
  const reduced = useReduced();
  const { v, segs, n } = d.deep;
  const { cam, set, fly, longest, camRef } = useDeepZoom(segs, reduced);
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [W, setW] = useState(800);
  const [grid, setGrid] = useState(true);
  const [mode, setMode] = useState<"explore" | "tour">("explore");
  const [stop, setStop] = useState(0);
  const tourStops = useMemo(() => [...segs].sort((a, b) => b[1] - b[0] - (a[1] - a[0])).slice(0, 5), [segs]);
  const H = W < 560 ? 240 : 320;
  const lo = cam.c - 0.5 / cam.z, hi = cam.c + 0.5 / cam.z;
  const span = hi - lo;
  const hoursTotal = (n * 30) / 3600;

  useEffect(() => {
    const el = wrap.current!;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* draw */
  useEffect(() => {
    const c = canvas.current!; const ctx = c.getContext("2d")!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const X = (f: number) => ((f - lo) / span) * W;
    const top = 54, bot = H - 58, amp = bot - top;
    // grid: nice time ticks
    if (grid) {
      const hrsPerPx = (span * hoursTotal) / W;
      const stepH = NICE_H.find((h) => h / hrsPerPx > 110) ?? 8760;
      const stepF = stepH / hoursTotal;
      ctx.strokeStyle = "rgba(17,24,36,0.08)"; ctx.fillStyle = "#56616f"; ctx.font = "300 10px ui-monospace, monospace"; ctx.lineWidth = 1;
      for (let f = Math.ceil(lo / stepF) * stepF; f < hi; f += stepF) {
        const x = Math.round(X(f)) + 0.5;
        ctx.beginPath(); ctx.moveTo(x, top - 10); ctx.lineTo(x, bot + 6); ctx.stroke();
        const hrs = f * hoursTotal;
        ctx.fillText(hrs >= 48 ? `${Math.round(hrs / 24)} d` : `${Math.round(hrs)} h`, x + 4, bot + 16);
      }
    }
    // anomaly bands
    for (const [a, b] of segs) {
      if (b < lo || a > hi) continue;
      const x0 = X(a), x1 = Math.max(x0 + 1, X(b));
      ctx.fillStyle = a === longest[0] ? "rgba(17,24,36,0.14)" : "rgba(17,24,36,0.07)";
      ctx.fillRect(x0, top - 10, x1 - x0, amp + 16);
      ctx.fillStyle = "#111824"; ctx.fillRect(x0, top - 12, x1 - x0, 2);
    }
    // score: max envelope as specks, median as a line
    const nB = v.length;
    const i0 = Math.max(0, Math.floor(lo * nB) - 1), i1 = Math.min(nB - 1, Math.ceil(hi * nB) + 1);
    const every = Math.max(1, Math.floor((i1 - i0) / (W * 0.9)));
    ctx.fillStyle = "rgba(86,97,111,0.55)";
    for (let i = i0; i <= i1; i += every) { const x = X((i + 0.5) / nB); ctx.fillRect(x - 0.7, bot - v[i][1] * amp - 0.7, 1.4, 1.4); }
    ctx.beginPath(); ctx.strokeStyle = "#111824"; ctx.lineWidth = 1;
    for (let i = i0; i <= i1; i += every) { const x = X((i + 0.5) / nB), y = bot - (0.15 + v[i][0] * 0.6) * amp; if (i === i0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.strokeStyle = "#d5dce4"; ctx.beginPath(); ctx.moveTo(0, bot + 6.5); ctx.lineTo(W, bot + 6.5); ctx.stroke();
    // longest label
    const lx = X(longest[0]);
    if (lx > -40 && lx < W - 10) { ctx.fillStyle = "#111824"; ctx.font = "400 10.5px ui-monospace, monospace"; ctx.fillText(`LONGEST · ${fmt(d.longest.timesteps)} STEPS · ~${d.longest.hours} H`, Math.max(6, lx + 4), top - 18); }
  }, [W, H, lo, hi, span, grid, v, segs, longest, hoursTotal, d.longest]);

  /* tour: fly through the five longest anomalies */
  useEffect(() => {
    if (mode !== "tour") return;
    const s = tourStops[stop % tourStops.length];
    const z = Math.min(Z_MAX, 0.55 / Math.max(0.0005, s[1] - s[0]));
    const dur = fly({ c: (s[0] + s[1]) / 2, z }) || 0;
    const id = window.setTimeout(() => { if (stop >= tourStops.length - 1) { setMode("explore"); fly({ c: 0.5, z: 1 }); setStop(0); } else setStop(stop + 1); }, dur + 2600);
    return () => window.clearTimeout(id);
  }, [mode, stop, tourStops, fly]);

  /* pointer: drag pans, pinch zooms (touch-action: pan-y keeps page scroll) */
  useEffect(() => {
    const el = wrap.current!.querySelector<HTMLElement>("[data-stage]")!;
    const pts = new Map<number, number>();
    let last = 0, pinch0 = 0, z0 = 1, moved = false;
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      pts.set(e.pointerId, e.clientX); last = e.clientX; moved = false;
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.abs(a - b); z0 = camRef.current.z; }
    };
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, e.clientX);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; const dd = Math.abs(a - b); if (pinch0 > 10) set({ ...camRef.current, z: z0 * (dd / pinch0) }); setMode("explore"); return; }
      const dx = e.clientX - last; last = e.clientX;
      if (!moved && Math.abs(dx) < 2) return;
      if (!moved) { moved = true; el.setPointerCapture(e.pointerId); el.dataset.drag = "true"; setMode("explore"); }
      const c = camRef.current; set({ ...c, c: c.c - dx / W / c.z });
    };
    const up = (e: PointerEvent) => { pts.delete(e.pointerId); el.dataset.drag = "false"; };
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return; // plain wheel scrolls the page; ctrl/⌘ or trackpad pinch zooms
      e.preventDefault(); setMode("explore");
      const r = el.getBoundingClientRect(); const c = camRef.current;
      const f = c.c - 0.5 / c.z + ((e.clientX - r.left) / r.width) / c.z;
      const z = Math.min(Z_MAX, Math.max(1, c.z * Math.exp(-e.deltaY * 0.01)));
      set({ z, c: f - ((e.clientX - r.left) / r.width - 0.5) / z });
    };
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => { el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); el.removeEventListener("wheel", wheel); };
  }, [W, set, camRef]);

  const zoomBy = (k: number) => { setMode("explore"); fly({ ...cam, z: cam.z * k }); };
  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (k === "ArrowLeft" || k === "ArrowRight") { e.preventDefault(); setMode("explore"); set({ ...cam, c: cam.c + (k === "ArrowRight" ? 0.1 : -0.1) / cam.z }); }
    else if (k === "+" || k === "=") { e.preventDefault(); zoomBy(1.6); }
    else if (k === "-" || k === "_") { e.preventDefault(); zoomBy(1 / 1.6); }
    else if (k === "0") { e.preventDefault(); setMode("explore"); fly({ c: 0.5, z: 1 }); }
  };

  // scale bar (N09)
  const hrsPerPx = (span * hoursTotal) / W;
  const barH = [...NICE_H].reverse().find((h) => h / hrsPerPx <= Math.min(140, W * 0.28)) ?? 1;
  const barPx = barH / hrsPerPx;
  const atLongest = Math.abs(cam.c - (longest[0] + longest[1]) / 2) < 0.002 && cam.z > 8;
  const frac = cam.z < 1.05 ? "all" : `1/${Math.round(cam.z)}`;

  return (
    <div ref={wrap} className="grid gap-3">
      <div data-stage className="wids-viewer border border-[var(--rime)]" style={{ height: H, touchAction: "pan-y" }} tabIndex={0} onKeyDown={onKey}
        role="application" aria-roledescription="deep-zoom timeline" aria-label={`Mission 1 GMM anomaly score over ${fmt(n)} test timesteps. Viewing ${frac} of the mission. Left and right arrows pan, plus and minus zoom, 0 fits.`}>
        <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        {/* HUD corners */}
        <div className="wids-hud pointer-events-none absolute left-3 top-2.5"><span className="wids-backing block">M1 · GMM K = 21 · neg. log-lik.</span></div>
        <div className="wids-hud wids-tick pointer-events-none absolute right-[64px] top-2.5 hidden text-right sm:block">
          <span className="wids-backing ml-auto block">T +{fmt(Math.round(cam.c * n))} · Zoom {cam.z.toFixed(1)}×</span>
        </div>
        {/* N06 floating circles */}
        <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 flex-col gap-2" role="group" aria-label="Viewer controls">
          <Circle small label="Zoom in (+)" icon="plus" onClick={() => zoomBy(1.6)} disabled={cam.z >= Z_MAX} />
          <Circle small label="Zoom out (−)" icon="minus" onClick={() => zoomBy(1 / 1.6)} disabled={cam.z <= 1} />
          <Circle small label="Fit the whole mission (0)" icon="fit" onClick={() => { setMode("explore"); fly({ c: 0.5, z: 1 }); }} />
          <Circle small label="Time grid" icon="grid" pressed={grid} onClick={() => setGrid(!grid)} />
        </div>
        {/* N09 scale bar */}
        <div className={`pointer-events-none absolute left-3 grid gap-1 ${W < 560 ? "top-9" : "bottom-3"}`}>
          <span className="wids-hud wids-backing block">{hLabel(barH)}</span>
          <span className="block h-[5px] border-x border-b border-[var(--ink)]" style={{ width: barPx }} />
        </div>
        {/* N07 context pill = the viewer's primary action */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <button type="button" className="wids-pill is-sm" onClick={() => { setMode("explore"); if (atLongest) fly({ c: 0.5, z: 1 }); else fly({ c: (longest[0] + longest[1]) / 2, z: Math.min(Z_MAX, 0.6 / (longest[1] - longest[0])) }); }}>
            <span className="normal-case tracking-[0.02em]">Viewing <b className="font-medium">{frac}</b> of M1</span>
            <span aria-hidden="true">·</span>
            <span>{atLongest ? "Fit all" : <>Longest<span className="hidden sm:inline"> anomaly</span></>}</span>
          </button>
        </div>
      </div>

      {/* N09 minimap */}
      <Minimap v={v} segs={segs} lo={lo} hi={hi} onSeek={(c) => { setMode("explore"); set({ ...cam, c }); }} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* N08 tour vs explore */}
        <Segmented label="Viewer mode" value={mode} set={(m) => { setMode(m); setStop(0); if (m === "explore") fly(cam); }} options={[{ v: "tour", label: "Guided tour" }, { v: "explore", label: "Free explore" }]} />
        <span className="wids-caption" aria-live="polite">{mode === "tour" ? `Tour stop ${stop + 1} / ${tourStops.length}: anomaly of ${fmt(Math.round((tourStops[stop][1] - tourStops[stop][0]) * n))} steps` : "Drag to pan · pinch or Ctrl/⌘ + scroll to zoom · arrows, + − 0"}</span>
      </div>
    </div>
  );
}

function Minimap({ v, segs, lo, hi, onSeek }: { v: [number, number][]; segs: [number, number][]; lo: number; hi: number; onSeek: (c: number) => void }) {
  const ref = useRef<SVGSVGElement>(null);
  const drag = useRef(false);
  const path = useMemo(() => { const n = 300, st = v.length / n; return "M" + Array.from({ length: n }, (_, i) => `${(i / (n - 1)) * 1000},${(34 - v[Math.floor(i * st)][0] * 26).toFixed(1)}`).join("L"); }, [v]);
  const seek = (x: number) => { const r = ref.current!.getBoundingClientRect(); onSeek(Math.max(0, Math.min(1, (x - r.left) / r.width))); };
  const c = (lo + hi) / 2;
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-3">
      <span className="wids-label">Minimap</span>
      <svg ref={ref} viewBox="0 0 1000 40" preserveAspectRatio="none" className="h-[40px] w-full cursor-pointer border border-[var(--rime)] bg-white" style={{ touchAction: "none" }}
        role="slider" tabIndex={0} aria-label="Minimap: move the view along the mission" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(c * 100)} aria-valuetext={`${Math.round(c * 100)}% through the mission`}
        onPointerDown={(e) => { drag.current = true; e.currentTarget.setPointerCapture(e.pointerId); seek(e.clientX); }}
        onPointerMove={(e) => { if (drag.current) seek(e.clientX); }} onPointerUp={() => { drag.current = false; }}
        onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); onSeek(Math.max(0, Math.min(1, c + (e.key === "ArrowRight" ? 0.05 : -0.05)))); } }}>
        {segs.map(([a, b], i) => <rect key={i} x={a * 1000} width={Math.max(1, (b - a) * 1000)} y="0" height="40" fill="#111824" opacity=".1" />)}
        <path d={path} fill="none" stroke="#56616f" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <rect x={lo * 1000} width={Math.max(4, (hi - lo) * 1000)} y="1" height="38" fill="rgba(17,24,36,.06)" stroke="#111824" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

/* ====================================================================== */
export function NovelSection({ d }: { d: DSData }) {
  const [div, setDiv] = useState(0);
  return (
    <Section id="novel" n={8} title="Novel" intro={<>Nine components that a stock UI kit does not have, taken from the two reference sites and turned white, quiet and data-first. Igloo gives the instrument language (HUD corners, decoding text, structure that assembles). Skyviewer gives the navigation (floating circles, context pill, tour or explore, minimap and scale).</>}>
      <div className="grid gap-5 md:grid-cols-2">
        <Spec code="N01" name="Corner HUD readout" from="Igloo" use="Frame a hero visualization with four quiet readouts instead of a toolbar. Borrowed: Igloo's four-corner HUD text blocks. Transformed: real DOM text on frost backings, driven by the focused node, not decoration." tokens="HUD 10.5px 300 caps · frost backing 86% · 12px inset" wide>
          <CornerHud d={d} />
        </Spec>
        <Spec code="N02" name="Scramble-in label" from="Igloo" use="Labels and values resolve from glyph noise when they change, so a change reads as the value locking on. Borrowed: Igloo's mid-scramble corner text. Transformed: screen readers get the final text at once; off under reduced motion." tokens="400–900ms · left to right · glyphs ▖▗▘▙░▒/\\<>=+-01">
          <ScrambleDemo d={d} />
        </Spec>
        <Spec code="N05" name="Frame counter + glyph loader" from="Igloo" use="A frame readout that maps scroll to the 1,500 timeline bins, and the ----===+++ loader string. Borrowed: Igloo's loader. Transformed: it never gates first paint; it runs inline next to real content." tokens="Numeral 38 · HUD 300 · 2px Ink progress">
          <FrameCounter />
        </Spec>
        <Spec code="N03" name="Structure that crystallizes on scroll" from="Igloo" use="Show a hierarchy assembling: 76 channels drift in, lock to 18 groups, then 4 subsystem shards form. Borrowed: Igloo's scroll-scrubbed exploded assembly. Transformed: driven by our channel tree, with a slider so keyboard and reduced-motion users get every stage." tokens="3px Ink specks · .7px constellation lines · 1px shard hulls · scroll-scrubbed" wide>
          <Crystallize d={d} />
        </Spec>
        <Spec code="N04" name="Wireframe shard divider" from="Igloo" use="Separate sections with a hairline that draws in and ends in a small wireframe shard plus the section number. Borrowed: Igloo's 1px wireframe line overlays. Transformed: a 1px divider that also numbers the section." tokens="1px Rime line · 1px Ink shard · draw-in 1400ms" wide>
          <div key={div}><ShardDivider n={9} label="Telemetry" /></div>
          <button type="button" className="wids-btn mt-4 self-start" onClick={() => setDiv(div + 1)}><Icon n="retry" size={13} />Redraw</button>
        </Spec>
        <Spec code="N06–09" name="Deep-zoom field viewer (N06–N09 assembled)" from="Skyviewer" use="Fly through the whole 7.36M-step Mission 1 test set with the four Skyviewer pieces below working together. Borrowed: Skyviewer's full-bleed pan-and-zoom canvas. Transformed: a white field of real anomaly scores, labelled controls, and no scroll-jacking (plain wheel still scrolls the page)." tokens="circles 36 · pill Signal · scale bar 1px Ink · minimap 40px · flights 800–1700ms" wide>
          <DeepZoom d={d} />
        </Spec>
        <Spec code="N06" name="Floating circular controls" from="Skyviewer" use="Camera tools float over the field as 44px circles, grouped by job (zoom apart from view toggles). Borrowed: Skyviewer's translucent floating circles. Transformed: Frost glass on white, every one labelled, and a dashed disabled state at the zoom limits." tokens="44 / 36 / 40 phone · glass 78% · Ink 1.3px icons">
          <CirclesSpecimen />
        </Spec>
        <Spec code="N07" name="Context pill" from="Skyviewer" use="Tell people how much of the data they are seeing, and offer the next move. Borrowed: Skyviewer's bottom-center cyan context banner that states the visible fraction. Transformed: because cyan is reserved for the primary action, the pill becomes that action." tokens="Signal fill · Ink 500 · radius 999 · 36–44px">
          <PillSpecimen />
        </Spec>
        <Spec code="N08" name="Guided tour vs free explore" from="Skyviewer" use="Two modes: a tour that flies between stops on its own, and free exploration. Any drag or scroll returns control. Borrowed: Skyviewer's guided-tour mode. Transformed: one segmented control plus a 2px progress line per stop; the page-level tour pill uses the same rule." tokens="segmented · 2px Ink progress · dwell 2.6–5.2s">
          <TourSpecimen />
        </Spec>
        <Spec code="N09" name="Minimap + scale bar" from="Skyviewer" use="A thumbnail of the whole mission with the viewport box, and a bar that reads in hours, days or weeks at any zoom. Borrowed: Skyviewer's deep-zoom overview and scale readout. Transformed: the scale is time (30s per M1 reading), not distance." tokens="minimap 40px · 1.5px Ink viewport · bar 1px Ink + HUD label">
          <ScaleSpecimen d={d} />
        </Spec>
      </div>
    </Section>
  );
}

/* ---------- standalone specimens for N06–N09 ---------- */
function CirclesSpecimen() {
  const [z, setZ] = useState(1);
  const [g, setG] = useState(false);
  return (
    <div className="flex items-center gap-6">
      <div className="flex flex-col gap-2" role="group" aria-label="Specimen zoom controls">
        <Circle label="Zoom in" icon="plus" onClick={() => setZ(Math.min(8, z * 2))} disabled={z >= 8} />
        <Circle label="Zoom out" icon="minus" onClick={() => setZ(Math.max(1, z / 2))} disabled={z <= 1} />
      </div>
      <div className="flex flex-col gap-2" role="group" aria-label="Specimen view toggles">
        <Circle label="Time grid" icon="grid" pressed={g} onClick={() => setG(!g)} />
        <Circle label="Fit" icon="fit" onClick={() => setZ(1)} />
      </div>
      <dl className="wids-hud wids-tick grid grid-cols-[auto_auto] gap-x-4">
        <dt className="text-[var(--muted)]">Zoom</dt><dd>{z.toFixed(2)}×</dd>
        <dt className="text-[var(--muted)]">Grid</dt><dd>{g ? "On" : "Off"}</dd>
      </dl>
    </div>
  );
}
function PillSpecimen() {
  const toast = useToast();
  const [z, setZ] = useState(12);
  return (
    <div className="grid gap-4">
      <div><button type="button" className="wids-pill" onClick={() => toast(`Flying to the longest anomaly from 1/${z} of M1.`, "arrow")}>
        <span className="normal-case tracking-[0.02em]">Viewing <b className="font-medium">1/{z}</b> of M1</span><span aria-hidden="true">·</span><span>Longest<span className="hidden sm:inline"> anomaly</span></span>
      </button></div>
      <label className="flex items-center gap-3"><span className="wids-label w-14 shrink-0">1/{z}</span>
        <input type="range" className="wids-range" min={1} max={60} value={z} onChange={(e) => setZ(+e.target.value)} aria-label="Specimen zoom fraction" /></label>
    </div>
  );
}
function TourSpecimen() {
  const reduced = useReduced();
  const [m, setM] = useState<"tour" | "explore">("explore");
  const [i, setI] = useState(0);
  useEffect(() => { if (m !== "tour") return; const id = window.setTimeout(() => { if (i >= 2) { setM("explore"); setI(0); } else setI(i + 1); }, 2600); return () => window.clearTimeout(id); }, [m, i]);
  const stops = ["Longest anomaly · ~967 h", "BIC minimum · K = 21", "Best M2 · TVAE 0.438"];
  return (
    <div className="grid gap-4">
      <Segmented label="Specimen mode" value={m} set={(v) => { setM(v); setI(0); }} options={[{ v: "tour", label: "Guided tour" }, { v: "explore", label: "Free explore" }]} />
      <div className="relative overflow-hidden border border-[var(--rime)] bg-white px-4 py-3" aria-live="polite">
        <span className="wids-label block">{m === "tour" ? `Stop ${i + 1} / 3` : "Free explore"}</span>
        <span className="text-[12.5px]"><Scramble text={m === "tour" ? stops[i] : "You steer. Drag, pinch, or use the keys."} /></span>
        {m === "tour" && !reduced && <span key={i} className="wids-progress" style={{ animationDuration: "2600ms" }} />}
      </div>
    </div>
  );
}
function ScaleSpecimen({ d }: { d: DSData }) {
  const [z, setZ] = useState(4);
  const W = 300, hoursTotal = (d.deep.n * 30) / 3600;
  const hrsPerPx = hoursTotal / z / W;
  const barH = [...NICE_H].reverse().find((h) => h / hrsPerPx <= 120) ?? 1;
  const c = 0.36, lo = Math.max(0, c - 0.5 / z), hi = Math.min(1, c + 0.5 / z);
  return (
    <div className="grid gap-4">
      <div className="grid gap-1">
        <span className="wids-hud">{hLabel(barH)}</span>
        <span className="block h-[5px] border-x border-b border-[var(--ink)] transition-[width] duration-300" style={{ width: barH / hrsPerPx }} />
      </div>
      <svg viewBox="0 0 1000 24" preserveAspectRatio="none" className="h-6 w-full border border-[var(--rime)] bg-white" aria-hidden="true">
        <rect x={lo * 1000} width={(hi - lo) * 1000} y="1" height="22" fill="rgba(17,24,36,.06)" stroke="#111824" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <label className="flex items-center gap-3"><span className="wids-label w-14 shrink-0">{z}×</span>
        <input type="range" className="wids-range" min={1} max={60} value={z} onChange={(e) => setZ(+e.target.value)} aria-label="Specimen zoom" /></label>
    </div>
  );
}
