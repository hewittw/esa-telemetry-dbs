"use client";
// The immersive frame: a fixed white field (our score timelines as snow drifts), an Igloo corner HUD,
// Skyviewer floating circles, camera fly-to between sections, a guided tour, an atlas (zoom-out index),
// and a coordinate-grid overlay. Content stays a normal, scannable, keyboard-first scroll document.
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { BoardData } from "../../mood-boards/white-immersion/load-data";
import { Circle, Icon, Scramble, pad, useInView, useReduced } from "./kit";

export const SECTIONS = [
  { id: "color", n: 1, title: "Color roles", short: "Color" },
  { id: "type", n: 2, title: "Type roles", short: "Type" },
  { id: "space", n: 3, title: "Spacing & shape", short: "Space" },
  { id: "components", n: 4, title: "Components", short: "Components" },
  { id: "states", n: 5, title: "Control states", short: "States" },
  { id: "ui", n: 6, title: "UI states", short: "UI states" },
  { id: "parts", n: 7, title: "Parts of an interface", short: "Parts" },
  { id: "novel", n: 8, title: "Novel", short: "Novel" },
  { id: "telemetry", n: 9, title: "Telemetry", short: "Telemetry" },
  { id: "principles", n: 10, title: "Principles", short: "Principles" },
] as const;
export const tagOf = (n: number) => (n === 10 ? "L" : pad(n));
const NS = SECTIONS.length;
const DWELL = 5200;

type Cam = { z: number; flying: boolean };
type Shell = { flyTo: (id: string) => void; grid: boolean; setGrid: (b: boolean) => void; openAtlas: () => void; cam: React.MutableRefObject<Cam> };
const Ctx = createContext<Shell | null>(null);
export const useShell = () => useContext(Ctx)!;

/* ====================================================================== */
export function Frame({ field, children }: { field: BoardData; children: React.ReactNode }) {
  const reduced = useReduced();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const mainRef = useRef<HTMLDivElement>(null);
  const cam = useRef<Cam>({ z: 1, flying: false });
  const anim = useRef(0);
  const [grid, setGrid] = useState(false);
  const [atlas, setAtlas] = useState(false);
  const [cur, setCur] = useState(-1);
  const [touring, setTouring] = useState(false);
  const [step, setStep] = useState(0);
  const [item, setItem] = useState({ code: "—", total: 0 });
  const yRef = useRef<HTMLSpanElement>(null);
  const zRef = useRef<HTMLSpanElement>(null);
  const fRef = useRef<HTMLSpanElement>(null);
  const stripRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const ol = stripRef.current; const a = ol?.querySelector<HTMLElement>('[aria-current="true"]');
    if (ol && a) { const r = a.getBoundingClientRect(), o = ol.getBoundingClientRect(); ol.scrollBy({ left: r.left - o.left - o.width / 2 + r.width / 2, behavior: "smooth" }); }
  }, [cur]);

  /* readouts that change every frame are written straight to the DOM (no re-render) */
  const readout = useCallback(() => {
    const y = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    if (yRef.current) yRef.current.textContent = "+" + pad(Math.round(y), 5);
    if (zRef.current) zRef.current.textContent = cam.current.z.toFixed(2) + "×";
    if (fRef.current) fRef.current.textContent = pad(Math.round((y / max) * 1500), 4);
  }, []);

  /* camera fly-to: eased scroll with a zoom-out arc (Skyviewer), field + content pull back mid-flight */
  const flyTo = useCallback((id: string, onDone?: () => void) => {
    const el = document.getElementById(id);
    if (!el) return 0;
    cancelAnimationFrame(anim.current);
    const off = window.innerWidth >= 1280 ? 28 : 84;
    const from = window.scrollY;
    const to = Math.max(0, Math.min(el.getBoundingClientRect().top + from - off, document.documentElement.scrollHeight - window.innerHeight));
    const focusIt = () => { el.focus({ preventScroll: true }); onDone?.(); };
    if (reducedRef.current) { window.scrollTo(0, to); readout(); focusIt(); return 0; }
    const dist = Math.abs(to - from);
    const dur = Math.min(1900, 850 + dist * 0.08);
    const bump = Math.min(0.35, dist / 16000);
    const t0 = performance.now();
    const m = mainRef.current;
    cam.current.flying = true;
    if (m) m.dataset.flying = "true";
    const stepF = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const y = from + (to - from) * e;
      window.scrollTo(0, y);
      const z = 1 - bump * Math.sin(Math.PI * e);
      cam.current.z = z;
      readout();
      if (k < 1) anim.current = requestAnimationFrame(stepF);
      else { cam.current = { z: 1, flying: false }; if (m) m.dataset.flying = "false"; readout(); focusIt(); }
    };
    anim.current = requestAnimationFrame(stepF);
    return dur;
  }, [readout]);

  /* which section / which component is under the HUD */
  useEffect(() => {
    const items = () => [...document.querySelectorAll<HTMLElement>("[data-wids-item]")];
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        readout();
        const line = window.innerHeight * 0.38;
        let s = -1;
        SECTIONS.forEach((sec, i) => { const el = document.getElementById(sec.id); if (el && el.getBoundingClientRect().top < line) s = i; });
        setCur(s);
        const all = items();
        let code = "—";
        for (const el of all) if (el.getBoundingClientRect().top < line) code = el.dataset.widsItem!;
        setItem({ code, total: all.length });
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, [readout]);

  /* guided tour through the nine sections; any manual scroll hands control back (free explore) */
  useEffect(() => {
    if (!touring) return;
    const dur = flyTo(SECTIONS[step].id) || 0;
    const id = window.setTimeout(() => {
      if (step >= NS - 1) setTouring(false); else setStep(step + 1);
    }, dur + DWELL);
    const stop = () => setTouring(false);
    const key = (e: KeyboardEvent) => { if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(e.key)) stop(); };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchmove", stop, { passive: true });
    window.addEventListener("keydown", key);
    return () => { window.clearTimeout(id); window.removeEventListener("wheel", stop); window.removeEventListener("touchmove", stop); window.removeEventListener("keydown", key); };
  }, [touring, step, flyTo]);
  useEffect(() => { if (!touring) cancelAnimationFrame(anim.current); }, [touring]);

  const tour = () => { if (touring) { setTouring(false); return; } setStep(cur >= NS - 1 || cur < 0 ? 0 : cur); setTouring(true); };
  const go = (d: number) => { setTouring(false); if (cur + d < 0) { window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); return; } flyTo(SECTIONS[Math.max(0, Math.min(NS - 1, cur + d))].id); };

  const ctx: Shell = { flyTo: (id) => { setTouring(false); flyTo(id); }, grid, setGrid, openAtlas: () => setAtlas(true), cam };
  const sec = cur >= 0 ? SECTIONS[cur] : { n: 0, short: "Intro" };

  return (
    <Ctx.Provider value={ctx}>
      <FieldCanvas field={field} cam={cam} reduced={reduced} />
      {grid && <div className="wids-gridOverlay" aria-hidden="true" />}

      <div className="relative z-[1] xl:grid xl:grid-cols-[256px_minmax(0,1fr)]">
        {/* ---------- left rail (≥1280): index + Igloo corner HUD ---------- */}
        <aside className="wids-rail sticky top-0 hidden flex-col justify-between px-6 py-6 xl:flex" aria-label="Design system index">
          <div>
            <p className="wids-display wids-backing mt-2 text-[12.5px] leading-[1.5] tracking-[0.06em]">Whiteout<br />Crystalline<br />Instrumented</p>
            <p className="wids-label mt-1">Design system · v1</p>
            <nav className="mt-6" aria-label="Sections">
              <ol className="grid gap-0.5">
                {SECTIONS.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="wids-idx" aria-current={cur === i ? "true" : undefined}
                      onClick={(e) => { e.preventDefault(); setTouring(false); flyTo(s.id); }}>
                      <span className="w-5 tabular-nums">{tagOf(s.n)}</span><span>{s.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          <dl className="wids-glass wids-hud grid grid-cols-[auto_1fr] gap-x-3 whitespace-nowrap px-3 py-3 mb-10" aria-label="Position readout">
            <dt className="text-[var(--muted)]">Section</dt><dd className="text-right"><Scramble text={`${tagOf(sec.n)} · ${sec.short}`} /></dd>
            <dt className="text-[var(--muted)]">Item</dt><dd className="wids-tick text-right">{item.code} / {item.total}</dd>
            <dt className="text-[var(--muted)]">Y</dt><dd className="wids-tick text-right"><span ref={yRef}>+00000</span></dd>
            <dt className="text-[var(--muted)]">Zoom</dt><dd className="wids-tick text-right"><span ref={zRef}>1.00×</span></dd>
            <dt className="text-[var(--muted)]">Frame</dt><dd className="wids-tick text-right"><span ref={fRef}>0000</span> / 1500</dd>
            <dt className="text-[var(--muted)]">Mode</dt><dd className="text-right"><Scramble text={touring ? "Guided tour" : "Free explore"} /></dd>
          </dl>
        </aside>

        <div className="min-w-0">
          {/* ---------- sticky index strip (<1280) ---------- */}
          <div className="sticky top-0 z-30 xl:hidden">
            <div className="wids-glass flex items-center gap-1 border-x-0 border-t-0 pl-2 pr-2 sm:pl-4">
              <Link href="/" className="wids-btn is-ghost shrink-0 px-2.5" aria-label="Back to hub">←<span className="hidden sm:inline">&nbsp;Hub</span></Link>
              <nav aria-label="Sections" className="min-w-0 flex-1">
                <ol ref={stripRef} className="wids-strip flex overflow-x-auto [scrollbar-width:none]">
                  {SECTIONS.map((s, i) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`} className="wids-idx" aria-current={cur === i ? "true" : undefined}
                        onClick={(e) => { e.preventDefault(); setTouring(false); flyTo(s.id); }}>
                        <span className="tabular-nums">{tagOf(s.n)}</span><span className={cur === i ? "" : "hidden md:inline"}>{s.short}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
              <span className="wids-hud wids-tick hidden shrink-0 pl-2 text-[var(--muted)] sm:inline">{item.code}/{item.total}</span>
            </div>
          </div>

          <main ref={mainRef} id="wids-main" className="mx-auto w-full max-w-[1180px] px-4 pb-40 sm:px-8 xl:pl-6 xl:pr-[104px] 2xl:pr-[120px]">
            {children}
          </main>
        </div>
      </div>

      {/* ---------- right column of floating circles (≥1024) ---------- */}
      <div className="fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2.5 lg:flex" role="group" aria-label="Camera controls">
        <Circle label="Previous section" icon="up" onClick={() => go(-1)} disabled={cur < 0} />
        <Circle label="Next section" icon="down" onClick={() => go(1)} disabled={cur === NS - 1} />
        <Circle label="Atlas: zoom out to every component" icon="fit" onClick={() => setAtlas(true)} />
        <Circle label="Coordinate grid (8px baseline, 96px columns)" icon="grid" pressed={grid} onClick={() => setGrid(!grid)} />
      </div>

      {/* ---------- bottom: the one cyan thing ---------- */}
      <div className="pointer-events-none fixed inset-x-3 bottom-3 z-40 flex items-center justify-center gap-2 sm:bottom-5">
        <button type="button" className="wids-pill pointer-events-auto" onClick={tour} aria-pressed={touring}
          aria-label={touring ? `Pause guided tour, stop ${step + 1} of ${NS}` : `Start guided tour, ${NS} stops`}>
          <Icon n={touring ? "pause" : "play"} size={12} />
          <span>{touring ? <>Pause<span className="hidden sm:inline"> tour</span> · {pad(step + 1)}/{pad(NS)}</> : <>Guided tour<span className="hidden sm:inline"> · {NS} stops</span></>}</span>
          {touring && !reduced && <span key={step} className="wids-progress" style={{ animationDuration: `${DWELL + 1200}ms` }} />}
        </button>
        <button type="button" className="wids-btn pointer-events-auto rounded-full px-4" aria-pressed={!touring} onClick={() => setTouring(false)}
          style={!touring ? { background: "rgba(255,255,255,.85)", color: "var(--ink)", boxShadow: "inset 0 0 0 1px var(--ink)" } : undefined}>
          <span className="inline-block h-[7px] w-[7px] rounded-full border border-[var(--ink)]" style={{ background: !touring ? "var(--ink)" : "transparent" }} aria-hidden="true" />
          <span className="hidden min-[360px]:inline">Explore</span>
        </button>
        <span className="pointer-events-auto lg:hidden"><Circle label="Atlas: zoom out to every component" icon="fit" onClick={() => setAtlas(true)} /></span>
        <span className="pointer-events-auto hidden min-[360px]:inline lg:hidden"><Circle label="Coordinate grid" icon="grid" pressed={grid} onClick={() => setGrid(!grid)} /></span>
      </div>

      {atlas && <Atlas onClose={() => setAtlas(false)} onPick={(id) => { setAtlas(false); setTouring(false); window.setTimeout(() => flyTo(id), reduced ? 0 : 380); }} />}
    </Ctx.Provider>
  );
}

/* ====================================================================== */
/* the field: real anomaly-score timelines as snow drifts + wireframe shards */
function FieldCanvas({ field, cam, reduced }: { field: BoardData; cam: React.MutableRefObject<Cam>; reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let w = 0, h = 0;
    const size = () => {
      w = c.clientWidth || window.innerWidth; h = c.clientHeight || window.innerHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const rnd = (() => { let sd = 7; return () => { sd = (sd * 1664525 + 1013904223) % 4294967296; return sd / 4294967296; }; })();
    const shards = Array.from({ length: 9 }, () => ({
      x: rnd(), y: rnd() * 3000, r: 50 + rnd() * 110, a: rnd() * 6.28, v: (rnd() - 0.5) * 0.00009,
      pts: Array.from({ length: 4 }, () => [rnd() * 6.28, 0.5 + rnd() * 0.5] as [number, number]),
    }));
    const specks = Array.from({ length: 220 }, () => [rnd(), rnd() * 3000, rnd()]);
    const nR = field.field.length;
    const BAND = 380; // vertical spacing between drifts
    let raf = 0, last = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 40) return; // ~25fps: the world is quiet
      last = now;
      const z = cam.current.z;
      const sy = window.scrollY;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2); ctx.scale(z, z); ctx.translate(-w / 2, -h / 2);
      // specks (parallax 0.35)
      ctx.fillStyle = "rgba(86,97,111,0.32)";
      for (const [px, py, pr] of specks) {
        const Y = (((py - sy * 0.35) % 3000) + 3000) % 3000 - 200;
        if (Y < -2 || Y > h + 2) continue;
        const s = pr < 0.15 ? 1.5 : 1;
        ctx.fillRect(px * w, Y, s, s);
      }
      // drifts: each of the six score timelines, repeated down the page (parallax 0.5)
      const ext = (w / z - w) / 2 + 40, ey = (h / z - h) / 2;
      const off = sy * 0.5;
      const first = Math.floor((off - 300) / BAND);
      for (let b = first - Math.ceil(ey / BAND); b < first + Math.ceil((h + ey) / BAND) + 3; b++) {
        const r = ((b % nR) + nR) % nR;
        const base = b * BAND - off + 160;
        const vals = field.field[r], an = field.fieldAnom[r];
        const n = vals.length;
        ctx.beginPath(); ctx.strokeStyle = "rgba(17,24,36,0.055)"; ctx.lineWidth = 1;
        for (let i = 0; i < n; i++) { const X = (i / (n - 1)) * (w + 2 * ext) - ext; const Y = base - vals[i] * 120; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
        ctx.stroke();
        for (let i = 0; i < n; i += 2) {
          const X = (i / (n - 1)) * (w + 2 * ext) - ext, Y = base - vals[i] * 120;
          if (an[i]) { ctx.fillStyle = "rgba(17,24,36,0.42)"; ctx.fillRect(X - 1, Y - 1, 2, 2); }
          else { ctx.fillStyle = "rgba(86,97,111,0.26)"; ctx.fillRect(X - 0.6, Y - 0.6, 1.2, 1.2); }
        }
      }
      // shards (parallax 0.15), slow drift
      ctx.strokeStyle = "rgba(17,24,36,0.12)"; ctx.lineWidth = 0.8;
      const t = reduced ? 0 : now;
      for (const s of shards) {
        const X = s.x * w;
        const Y = (((s.y - sy * 0.15) % 3000) + 3000) % 3000 - 300;
        if (Y < -200 || Y > h + 200) continue;
        const a = s.a + t * s.v;
        const p = s.pts.map(([ang, rr]) => [X + Math.cos(ang + a) * s.r * rr, Y + Math.sin(ang + a) * s.r * rr * 0.7]);
        ctx.beginPath();
        for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) { ctx.moveTo(p[i][0], p[i][1]); ctx.lineTo(p[j][0], p[j][1]); }
        ctx.stroke();
      }
      ctx.restore();
    };
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", size);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
  }, [field, cam, reduced]);
  return <div className="wids-field" aria-hidden="true"><canvas ref={ref} /></div>;
}

/* ====================================================================== */
/* atlas: zoom out to see every component at once, pick one, zoom back in */
function Atlas({ onClose, onPick }: { onClose: () => void; onPick: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);
  const [groups, setGroups] = useState<{ id: string; n: number; title: string; items: { id: string; code: string; name: string; tag?: string }[] }[]>([]);
  const opener = useRef<HTMLElement | null>(null);
  const reduced = useReduced();
  useEffect(() => {
    opener.current = document.activeElement as HTMLElement;
    setGroups(SECTIONS.map((s) => ({
      id: s.id, n: s.n, title: s.title,
      items: [...document.querySelectorAll<HTMLElement>(`#${s.id} [data-wids-item]`)].map((el) => ({ id: el.id, code: el.dataset.widsItem!, name: el.dataset.widsName!, tag: el.dataset.widsTag })),
    })));
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = ""; };
  }, []);
  useEffect(() => { ref.current?.querySelector<HTMLElement>("[data-first]")?.focus(); }, [groups]);
  const leave = (then: () => void) => { if (reduced) { then(); return; } setLeaving(true); window.setTimeout(then, 360); };
  const close = () => leave(() => { onClose(); opener.current?.focus(); });
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key !== "Tab") return;
    const f = [...ref.current!.querySelectorAll<HTMLElement>("button")];
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  };
  const total = groups.reduce((a, g) => a + g.items.length, 0);
  return (
    <div ref={ref} className="wids-atlas" role="dialog" aria-modal="true" aria-labelledby="wids-atlas-title" data-leaving={leaving} onKeyDown={onKey}>
      <div className="mx-auto max-w-[1500px] px-4 pb-16 pt-5 sm:px-8 sm:pt-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="wids-label">Atlas · zoom 0.18× · {total} components</p>
            <h2 id="wids-atlas-title" className="wids-display mt-2 text-[20px] tracking-[0.05em] sm:text-[26px]">Every component, at once</h2>
            <p className="wids-caption mt-1">Pick any slab to fly the camera to it. Esc returns you where you were.</p>
          </div>
          <Circle label="Close atlas (Esc)" icon="close" onClick={close} />
        </div>
        <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g, gi) => (
            <section key={g.id} aria-label={`${tagOf(g.n)} ${g.title}`}>
              <button type="button" className="wids-row grid-cols-[auto_1fr_auto] border-b-[var(--ink)] px-0" data-first={gi === 0 ? "" : undefined}
                onClick={() => leave(() => onPick(g.id))}>
                <span className="wids-num text-[22px]">{tagOf(g.n)}</span>
                <span className="wids-display text-[12px] tracking-[0.06em]">{g.title}</span>
                <span className="wids-label">{g.items.length}</span>
              </button>
              <ul className="mt-2 grid grid-cols-2 gap-1.5">
                {g.items.map((it) => (
                  <li key={it.id}>
                    <button type="button" className="wids-card min-h-[52px] p-2.5 text-left shadow-none" onClick={() => leave(() => onPick(it.id))}>
                      <span className="wids-label block text-[10px]">{it.code}{it.tag ? ` · ${it.tag}` : ""}</span>
                      <span className="block text-[11.5px] leading-snug">{it.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* section head with a wireframe shard divider (Novel · from Igloo) */
export function ShardDivider({ n, label }: { n: number; label: string }) {
  const [ref, inView] = useInView<SVGSVGElement>();
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <svg ref={ref} className="wids-shard h-[34px] flex-1" viewBox="0 0 600 34" preserveAspectRatio="none" data-in={inView} fill="none" stroke="#111824" strokeWidth="1" vectorEffect="non-scaling-stroke">
        <line x1="0" y1="17" x2="560" y2="17" pathLength={1} stroke="#d5dce4" vectorEffect="non-scaling-stroke" />
      </svg>
      <svg ref={undefined} className="wids-shard h-[34px] w-[46px] shrink-0" viewBox="0 0 46 34" data-in={inView} fill="none" stroke="#111824" strokeWidth="1">
        <path pathLength={1} d="M23 2 42 13 35 32H11L4 13Z" />
        <path pathLength={1} d="M23 2 11 32M23 2l12 30M4 13h38M11 32 42 13M35 32 4 13" stroke="#56616f" strokeWidth=".7" />
      </svg>
      <span className="wids-label tabular-nums">{tagOf(n)} · {label}</span>
    </div>
  );
}

export function Section({ id, n, title, intro, children }: { id: string; n: number; title: string; intro: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="wids-section pt-20 outline-none sm:pt-28" tabIndex={-1} aria-labelledby={`${id}-h`}>
      <ShardDivider n={n} label={title} />
      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end">
        <h2 id={`${id}-h`} className="wids-display flex items-baseline gap-3 text-[19px] leading-[1.12] tracking-[0.04em] min-[400px]:text-[24px] sm:gap-4 sm:text-[32px]">
          <span className="wids-num text-[var(--muted)]">{tagOf(n)}</span>
          <span className="wids-backing">{title}</span>
        </h2>
        <p className="wids-backing max-w-[56ch] text-[13px] leading-[1.65]">{intro}</p>
      </div>
      <div className="mt-10">{children}</div>
    </section>
  );
}

/* ====================================================================== */
/* a spec slab: code, name, when to use it, tokens, then the live component */
export function Spec({ code, name, sub, use, tokens, from, children, wide, tall, className = "" }: {
  code: string; name: string; sub?: string; use: string; tokens: string; from?: string; children: React.ReactNode; wide?: boolean; tall?: boolean; className?: string;
}) {
  const id = `wids-${code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <article id={id} data-wids-item={code} data-wids-name={name} data-wids-tag={from} tabIndex={-1}
      className={`wids-slab relative flex min-w-0 flex-col outline-none ${wide ? "md:col-span-2" : ""} ${tall ? "md:row-span-2" : ""} ${className}`} aria-labelledby={`${id}-n`}>
      <header className="border-b border-[var(--rime)] px-4 pb-3 pt-3.5 sm:px-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="wids-label tabular-nums text-[var(--ink)]">{code}</span>
          <h3 id={`${id}-n`} className="wids-title">{name}{sub && <span className="wids-caption ml-2 font-normal">{sub}</span>}</h3>
          {from && <span className="wids-badge ml-auto">Novel · from {from}</span>}
        </div>
        <p className="wids-caption mt-1.5"><span className="text-[var(--ink)]">Use</span> {use}</p>
        <p className="wids-caption"><span className="text-[var(--ink)]">Tokens</span> {tokens}</p>
      </header>
      <div className="flex min-w-0 flex-1 flex-col px-4 py-5 sm:px-5">{children}</div>
    </article>
  );
}

/* state cell caption */
export const StateCell = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="wids-stateCell">
    <span className="wids-label">{label}</span>
    {children}
  </div>
);
