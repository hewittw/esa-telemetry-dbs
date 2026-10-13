"use client";
// The white world. On desktop the nine places sit in one pan/zoom field and the camera flies between them
// (Skyviewer fly-to with a zoom-out arc). Under 1180 × 740 the same places stack as a scroll document over the
// fixed snowfield, and the tour flies the page instead. The CSS media query decides the first paint.
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { SiteData } from "./data";
import { Circle, Corners, Icon, Scramble, pad, useReduced } from "./kit";
import { Reader } from "./reader";
import { Body } from "./places";

export type Place = { id: string; short: string; title: string; intro?: string; x: number; y: number; w: number; story: boolean; pages: number[] };
export const PLACES: Place[] = [
  { id: "finding", short: "Finding", title: "The finding", x: 0, y: 0, w: 1040, story: true, pages: [] },
  { id: "crystal", short: "Structure", title: "Where the structure lives", x: -1340, y: -800, w: 1040, story: true, pages: [5, 11],
    intro: "Every channel belongs to an operational group, and every group to a subsystem. Step through the levels, then see where each method's K lands." },
  { id: "glacier", short: "BIC", title: "The BIC glacier", x: 0, y: -900, w: 1040, story: true, pages: [5],
    intro: "A full-covariance GMM, fit once for every K. BIC drops fast through the subsystem range and keeps finding lower ground out to the group scale." },
  { id: "failure", short: "Failure", title: "Why global detectors fail", x: 1340, y: -800, w: 1040, story: true, pages: [7],
    intro: "The longest Mission 1 fault. A global model spikes at onset, then treats the new state as normal. A mixture of local modes keeps flagging it." },
  { id: "deep", short: "Deep field", title: "The whole test set", x: 1560, y: 70, w: 1040, story: false, pages: [7],
    intro: "Every Mission 1 test step under the GMM score. Zoom in anywhere. Each dark band is an anomaly labelled by ESA engineers." },
  { id: "compare", short: "Compare", title: "Five families, two missions", x: 1340, y: 900, w: 1040, story: true, pages: [5],
    intro: "Table 1, live. Filter by family, sort a column, open any method." },
  { id: "threshold", short: "Threshold", title: "Set the alarm", x: 0, y: 980, w: 1040, story: false, pages: [3, 9],
    intro: "Move the alert threshold and watch precision trade against recall. Recomputed in your browser from the saved score curves." },
  { id: "paper", short: "Paper", title: "The paper", x: -1340, y: 900, w: 1040, story: true, pages: [],
    intro: "Eleven pages, floating in the field. Open any page and fly between them." },
  { id: "credits", short: "Credits", title: "Designed & built by Hewitt Watkins", x: -1560, y: 70, w: 1040, story: true, pages: [] },
];
const N = PLACES.length;
export const TOUR = [0, 1, 2, 3, 5, 7, 8];
const DWELL = 7000;
const Q = "(min-width: 1180px) and (min-height: 740px)";
const BOUNDS = { minX: -2200, maxX: 2200, minY: -1350, maxY: 1400 };
const Z_MIN = 0.16, Z_MAX = 2.4;

type Mode = "world" | "scroll";
type Cam = { x: number; y: number; z: number };
type Ctx = { go: (id: string) => void; openPaper: (page: number) => void; mode: Mode; cur: number };
const SiteCtx = createContext<Ctx>({ go: () => {}, openPaper: () => {}, mode: "scroll", cur: 0 });
export const useSite = () => useContext(SiteCtx);

const INTERACTIVE = "button, a, input, select, textarea, label, summary, [role=slider], [role=radio], [role=tab], [role=option], [role=application], [data-nodrag]";

/* ====================================================================== */
export function Site({ d }: { d: SiteData }) {
  const reduced = useReduced();
  const reducedRef = useRef(reduced); reducedRef.current = reduced;
  const [mode, setMode] = useState<Mode>("scroll");
  const modeRef = useRef<Mode>("scroll"); modeRef.current = mode;
  const [cur, setCur] = useState(0);
  const curRef = useRef(0); curRef.current = cur;
  const [seen, setSeen] = useState<boolean[]>(() => PLACES.map((_, i) => i === 0));
  const [touring, setTouring] = useState(false);
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState(false);
  const [grid, setGrid] = useState(false);
  const gridRef = useRef(false); gridRef.current = grid;
  const [paper, setPaper] = useState<number | null>(null);
  const paperRef = useRef<number | null>(null); paperRef.current = paper;
  const [framed, setFramed] = useState(true);

  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const placeRefs = useRef<(HTMLElement | null)[]>([]);
  const cam = useRef<Cam>({ x: 0, y: 0, z: 1 });
  const size = useRef({ w: 1440, h: 900 });
  const anim = useRef(0);
  const dirty = useRef(true);
  const dragged = useRef(false);
  const fromPointer = useRef(false);
  const xRef = useRef<HTMLSpanElement>(null), yRef = useRef<HTMLSpanElement>(null), zRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const m = window.matchMedia(Q);
    const f = () => setMode(m.matches ? "world" : "scroll");
    f(); m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);

  const markSeen = useCallback((i: number) => setSeen((s) => (s[i] ? s : s.map((v, j) => v || j === i))), []);

  /* ---------------- world camera ---------------- */
  const apply = useCallback(() => {
    const { x, y, z } = cam.current, { w, h } = size.current;
    const el = worldRef.current;
    if (el && modeRef.current === "world") {
      el.style.transform = `translate3d(${(w / 2 - x * z).toFixed(2)}px, ${(h / 2 - y * z).toFixed(2)}px, 0) scale(${z.toFixed(4)})`;
      el.style.setProperty("--inv", (1 / z).toFixed(4));
      el.dataset.far = String(z < 0.55);
    }
    const sg = (v: number) => (v >= 0 ? "+" : "−") + pad(Math.abs(Math.round(v)), 4);
    if (xRef.current) xRef.current.textContent = sg(x);
    if (yRef.current) yRef.current.textContent = sg(y);
    if (zRef.current) zRef.current.textContent = z.toFixed(2) + "×";
    dirty.current = true;
  }, []);

  const clampCam = (c: Cam): Cam => ({
    z: Math.min(Z_MAX, Math.max(Z_MIN, c.z)),
    x: Math.min(BOUNDS.maxX, Math.max(BOUNDS.minX, c.x)),
    y: Math.min(BOUNDS.maxY, Math.max(BOUNDS.minY, c.y)),
  });

  const flyCam = useCallback((t: Cam, onDone?: () => void) => {
    cancelAnimationFrame(anim.current);
    const to = clampCam(t), from = { ...cam.current };
    const wEl = worldRef.current;
    if (reducedRef.current) { cam.current = to; apply(); onDone?.(); return 0; }
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const dur = Math.min(1900, 850 + dist * 0.42);
    const l0 = Math.log(from.z), l1 = Math.log(to.z);
    const zOut = Math.min(from.z, to.z, size.current.w / (dist * 1.25 + 700));
    const bump = Math.max(0, (l0 + l1) / 2 - Math.log(zOut));
    const t0 = performance.now();
    if (wEl) wEl.dataset.flying = "true";
    const stepF = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      cam.current = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, z: Math.exp(l0 + (l1 - l0) * e - bump * Math.sin(Math.PI * e)) };
      apply();
      if (k < 1) anim.current = requestAnimationFrame(stepF);
      else { if (wEl) wEl.dataset.flying = "false"; onDone?.(); }
    };
    anim.current = requestAnimationFrame(stepF);
    return dur;
  }, [apply]);

  const frameFor = useCallback((i: number): Cam => {
    const p = PLACES[i], el = placeRefs.current[i];
    const H = el?.offsetHeight ?? 600, W = p.w;
    const { w, h } = size.current;
    const box = { l: 92, r: w - 88, t: 78, b: h - 92 };
    const z = Math.min(1.4, (box.r - box.l) / (W + 56), (box.b - box.t) / (H + 40));
    return { x: p.x - ((box.l + box.r) / 2 - w / 2) / z, y: p.y - ((box.t + box.b) / 2 - h / 2) / z, z };
  }, []);

  const fitAll = useCallback((): Cam => {
    const { w, h } = size.current;
    const z = Math.min((w - 220) / 4300, (h - 200) / 2900);
    return { x: 0, y: 40, z };
  }, []);

  /* ---------------- scroll camera (fallback) ---------------- */
  const flyScroll = useCallback((i: number) => {
    const el = placeRefs.current[i];
    if (!el) return 0;
    cancelAnimationFrame(anim.current);
    const off = 64;
    const from = window.scrollY;
    const to = Math.max(0, Math.min(el.getBoundingClientRect().top + from - off, document.documentElement.scrollHeight - window.innerHeight));
    if (reducedRef.current) { window.scrollTo(0, to); return 0; }
    const dist = Math.abs(to - from);
    const dur = Math.min(1900, 850 + dist * 0.08);
    const bump = Math.min(0.3, dist / 16000);
    const t0 = performance.now();
    const stepF = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      window.scrollTo(0, from + (to - from) * e);
      cam.current.z = 1 - bump * Math.sin(Math.PI * e);
      dirty.current = true;
      if (k < 1) anim.current = requestAnimationFrame(stepF); else cam.current.z = 1;
    };
    anim.current = requestAnimationFrame(stepF);
    return dur;
  }, []);

  /* ---------------- go to a place ---------------- */
  const goIdx = useCallback((i: number, opts: { focus?: boolean; tour?: boolean } = {}) => {
    const n = (i + N) % N;
    setCur(n); markSeen(n); setFramed(true);
    if (!opts.tour) setTouring(false);
    const el = placeRefs.current[n];
    if (opts.focus) el?.focus({ preventScroll: true });
    try { history.replaceState(null, "", `#${PLACES[n].id}`); } catch {}
    return modeRef.current === "world" ? flyCam(frameFor(n)) : flyScroll(n);
  }, [flyCam, flyScroll, frameFor, markSeen]);

  const overview = useCallback(() => {
    setTouring(false); setFramed(false);
    if (modeRef.current === "world") flyCam(fitAll());
    else window.scrollTo({ top: 0, behavior: reducedRef.current ? "auto" : "smooth" });
  }, [fitAll, flyCam]);

  const zoomBy = useCallback((k: number) => {
    setTouring(false); setFramed(false);
    const c = cam.current; flyCam({ ...c, z: c.z * k });
  }, [flyCam]);

  /* ---------------- world: size, intro, resize ---------------- */
  useEffect(() => {
    if (mode !== "world") return;
    const st = stageRef.current!;
    size.current = { w: st.clientWidth, h: st.clientHeight };
    const hash = location.hash.slice(1);
    const start = Math.max(0, PLACES.findIndex((p) => p.id === hash));
    const home = frameFor(start);
    setCur(start); markSeen(start);
    // intro: open close on the finding, then pull back so the neighbouring places show at the edges
    cam.current = reducedRef.current ? home : { ...home, z: home.z * 1.14 };
    apply();
    const id = reducedRef.current ? 0 : window.setTimeout(() => flyCam(home), 450);
    let rz = 0;
    const ro = new ResizeObserver(() => {
      size.current = { w: st.clientWidth, h: st.clientHeight };
      cancelAnimationFrame(rz);
      rz = requestAnimationFrame(() => { cam.current = frameFor(curRef.current); apply(); });
    });
    ro.observe(st);
    return () => { window.clearTimeout(id); ro.disconnect(); cancelAnimationFrame(rz); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /* scroll mode: which place is under the reading line; seen on view; deep link on load */
  useEffect(() => {
    if (mode !== "scroll") return;
    const el = worldRef.current; if (el) el.style.transform = "";
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const line = window.innerHeight * 0.4;
        let s = 0;
        placeRefs.current.forEach((p, i) => { if (p && p.getBoundingClientRect().top < line) s = i; });
        setCur(s);
        dirty.current = true;
      });
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) markSeen(+(e.target as HTMLElement).dataset.idx!); }), { rootMargin: "0px 0px -20% 0px" });
    placeRefs.current.forEach((p) => p && io.observe(p));
    const hash = location.hash.slice(1);
    const i = PLACES.findIndex((p) => p.id === hash);
    if (i > 0) window.setTimeout(() => placeRefs.current[i]?.scrollIntoView(), 60);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => { window.removeEventListener("scroll", on); io.disconnect(); cancelAnimationFrame(raf); };
  }, [mode, markSeen]);

  /* deep link to a paper page: #paper-5 */
  useEffect(() => {
    const check = () => { const m = /^#paper-(\d+)$/.exec(location.hash); if (m) setPaper(Math.min(11, Math.max(1, +m[1]))); };
    check(); window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, []);

  /* ---------------- world: pointer (drag pans, pinch zooms, inertia), wheel travels ---------------- */
  useEffect(() => {
    if (mode !== "world") return;
    const st = stageRef.current!;
    const pts = new Map<number, { x: number; y: number }>();
    let start = { x: 0, y: 0 }, last = { x: 0, y: 0, t: 0 }, vel = { x: 0, y: 0 }, pinch0 = 0, z0 = 1, inertia = 0;
    let acc = 0, coolUntil = 0;
    const zoomAt = (sx: number, sy: number, nz: number) => {
      const { w, h } = size.current, c = cam.current;
      const wx = c.x + (sx - w / 2) / c.z, wy = c.y + (sy - h / 2) / c.z;
      const z = Math.min(Z_MAX, Math.max(Z_MIN, nz));
      cam.current = clampCam({ x: wx - (sx - w / 2) / z, y: wy - (sy - h / 2) / z, z });
      apply();
    };
    const interrupt = () => { cancelAnimationFrame(anim.current); cancelAnimationFrame(inertia); setTouched(true); setTouring(false); setFramed(false); };
    const nearest = () => {
      const c = cam.current; let b = curRef.current, bd = Infinity;
      PLACES.forEach((p, i) => { const dd = Math.hypot(p.x - c.x, (p.y - c.y) * 1.3); if (dd < bd) { bd = dd; b = i; } });
      if (bd < 700) { setCur(b); markSeen(b); }
    };
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest(INTERACTIVE)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      dragged.current = false;
      start = { x: e.clientX, y: e.clientY }; last = { x: e.clientX, y: e.clientY, t: performance.now() }; vel = { x: 0, y: 0 };
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); z0 = cam.current.z; }
    };
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      const prev = pts.get(e.pointerId)!;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        if (!dragged.current) { interrupt(); dragged.current = true; }
        const r = st.getBoundingClientRect();
        zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, z0 * (Math.hypot(a.x - b.x, a.y - b.y) / (pinch0 || 1)));
        return;
      }
      if (!dragged.current && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 5) return;
      if (!dragged.current) { dragged.current = true; interrupt(); st.setPointerCapture(e.pointerId); st.dataset.drag = "true"; }
      const c = cam.current;
      cam.current = clampCam({ ...c, x: c.x - (e.clientX - prev.x) / c.z, y: c.y - (e.clientY - prev.y) / c.z });
      const now = performance.now(), dt = Math.max(1, now - last.t);
      vel = { x: (e.clientX - last.x) / dt, y: (e.clientY - last.y) / dt };
      last = { x: e.clientX, y: e.clientY, t: now };
      apply();
    };
    const up = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      st.dataset.drag = "false";
      if (!dragged.current) return;
      if (pts.size === 0 && !reducedRef.current && performance.now() - last.t < 80) {
        let v = { x: vel.x * 16, y: vel.y * 16 };
        const glide = () => {
          v = { x: v.x * 0.93, y: v.y * 0.93 };
          const c = cam.current;
          cam.current = clampCam({ ...c, x: c.x - v.x / c.z, y: c.y - v.y / c.z });
          apply();
          if (Math.hypot(v.x, v.y) > 0.3) inertia = requestAnimationFrame(glide); else nearest();
        };
        inertia = requestAnimationFrame(glide);
      } else nearest();
    };
    const scrollable = (t: HTMLElement | null, dy: number) => {
      for (let el = t; el && el !== st; el = el.parentElement) {
        const s = getComputedStyle(el);
        if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1) {
          if ((dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) || (dy < 0 && el.scrollTop > 0)) return true;
        }
      }
      return false;
    };
    const wheel = (e: WheelEvent) => {
      const t = e.target as HTMLElement;
      if (e.ctrlKey || e.metaKey) {
        if (t.closest("[data-ownzoom]")) return; // the deep-zoom viewer handles its own pinch
        e.preventDefault(); interrupt();
        const r = st.getBoundingClientRect();
        zoomAt(e.clientX - r.left, e.clientY - r.top, cam.current.z * Math.exp(-e.deltaY * 0.012));
        return;
      }
      if (scrollable(t, e.deltaY)) return;
      e.preventDefault();
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.2) {
        interrupt();
        const c = cam.current; cam.current = clampCam({ ...c, x: c.x + e.deltaX / c.z }); apply();
        return;
      }
      const now = performance.now();
      if (now < coolUntil) { coolUntil = Math.max(coolUntil, now + 220); acc = 0; return; }
      acc += e.deltaY;
      if (Math.abs(acc) > 50) {
        setTouched(true);
        const dur = goIdx(curRef.current + (acc > 0 ? 1 : -1)) || 0;
        coolUntil = now + dur + 300; acc = 0;
      }
    };
    const noScroll = () => { st.scrollTop = 0; st.scrollLeft = 0; };
    st.addEventListener("pointerdown", down); st.addEventListener("pointermove", move);
    st.addEventListener("pointerup", up); st.addEventListener("pointercancel", up);
    st.addEventListener("wheel", wheel, { passive: false });
    st.addEventListener("scroll", noScroll);
    return () => {
      st.removeEventListener("pointerdown", down); st.removeEventListener("pointermove", move);
      st.removeEventListener("pointerup", up); st.removeEventListener("pointercancel", up);
      st.removeEventListener("wheel", wheel); st.removeEventListener("scroll", noScroll);
      cancelAnimationFrame(inertia);
    };
  }, [mode, apply, goIdx, markSeen]);

  /* ---------------- keyboard ---------------- */
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (paperRef.current !== null || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, select, textarea, [role=slider], [role=radio], [role=tab], [role=option], [role=application], dialog")) return;
      const world = modeRef.current === "world";
      const k = e.key;
      if (k === "Escape") { if (touring) setTouring(false); return; }
      if (!world) return; // the scroll document keeps the browser's own keys
      const onBtn = !!t.closest("button, a, summary");
      if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown" || (k === " " && !onBtn)) { e.preventDefault(); setTouched(true); goIdx(curRef.current + 1, { focus: true }); }
      else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp") { e.preventDefault(); setTouched(true); goIdx(curRef.current - 1, { focus: true }); }
      else if (k === "Home") { e.preventDefault(); goIdx(0, { focus: true }); }
      else if (k === "+" || k === "=") zoomBy(1.35);
      else if (k === "-" || k === "_") zoomBy(1 / 1.35);
      else if (k === "0") overview();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [touring, goIdx, zoomBy, overview]);

  /* ---------------- guided tour ---------------- */
  useEffect(() => {
    if (!touring) return;
    const dur = goIdx(TOUR[step], { tour: true }) || 0;
    const id = window.setTimeout(() => { if (step >= TOUR.length - 1) setTouring(false); else setStep(step + 1); }, dur + DWELL);
    const stopS = () => setTouring(false);
    // scroll mode: a manual swipe hands control back (free explore)
    if (modeRef.current === "scroll") { window.addEventListener("wheel", stopS, { passive: true }); window.addEventListener("touchmove", stopS, { passive: true }); }
    return () => { window.clearTimeout(id); window.removeEventListener("wheel", stopS); window.removeEventListener("touchmove", stopS); };
  }, [touring, step, goIdx]);
  useEffect(() => { if (!touring) cancelAnimationFrame(anim.current); }, [touring]);
  const tour = () => {
    setTouched(true);
    if (touring) { setTouring(false); return; }
    const at = TOUR.indexOf(cur);
    setStep(at >= 0 && at < TOUR.length - 1 ? at : 0);
    setTouring(true);
  };

  const openPaper = useCallback((p: number) => { setTouring(false); setPaper(p); }, []);
  const closePaper = useCallback(() => {
    setPaper(null);
    if (/^#paper-/.test(location.hash)) try { history.replaceState(null, "", `#${PLACES[curRef.current].id}`); } catch {}
  }, []);
  const ctx: Ctx = { go: (id) => goIdx(PLACES.findIndex((p) => p.id === id)), openPaper, mode, cur };
  const P = PLACES[cur];
  const world = mode === "world";

  return (
    <SiteCtx.Provider value={ctx}>
      <Field d={d} cam={cam} dirty={dirty} mode={mode} grid={gridRef} reduced={reduced} />

      {/* ============ scroll-mode header ============ */}
      <header className="wiv-scrollHud wiv-glass sticky top-0 z-30 border-x-0 border-t-0">
        <div className="flex items-center gap-1 pl-2 pr-2 sm:pl-4">
          <Link href="/" className="wiv-btn is-ghost shrink-0 px-2.5" aria-label="Back to hub">←<span className="hidden sm:inline">&nbsp;Hub</span></Link>
          <nav aria-label="Places" className="min-w-0 flex-1">
            <ol className="flex overflow-x-auto [scrollbar-width:none]">
              {PLACES.map((p, i) => (
                <li key={p.id}>
                  <a href={`#${p.id}`} className="wiv-chipIdx" aria-current={cur === i ? "true" : undefined}
                    onClick={(e) => { e.preventDefault(); goIdx(i); }}>
                    <span className="tabular-nums">{pad(i)}</span><span className="wiv-idxName">{p.short}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <button type="button" className="wiv-circle is-sm shrink-0" aria-label="Open the paper" title="Open the paper" onClick={() => openPaper(1)}><Icon n="atlas" size={14} /></button>
        </div>
      </header>

      {/* ============ the stage + world (all places) ============ */}
      <div ref={stageRef} className="wiv-stage" data-mode={mode}
        role={world ? "region" : undefined} aria-roledescription={world ? "explorable field" : undefined}
        aria-label={world ? "The findings field: nine places. Tab or the arrow keys travel between places; scroll also travels; drag pans; Ctrl or Command with scroll zooms; 0 shows the whole field." : undefined}
        onClickCapture={(e) => { if (dragged.current) { e.preventDefault(); e.stopPropagation(); dragged.current = false; } }}>
        <div ref={worldRef} className="wiv-world" data-has-cur={world && framed ? "true" : "false"} data-far="false">
          <main className="wiv-scrollStack" id="wiv-main">
            {PLACES.map((p, i) => (
              <section key={p.id} id={p.id} data-idx={i} ref={(el) => { placeRefs.current[i] = el; }} tabIndex={-1}
                className="wiv-place" aria-labelledby={`${p.id}-h`} data-current={cur === i} data-seen={seen[i]}
                style={{ "--x": p.x, "--y": p.y, "--w": `${p.w}px` } as React.CSSProperties}
                onPointerDown={() => { fromPointer.current = true; window.setTimeout(() => { fromPointer.current = false; }, 400); }}
                onFocus={() => { if (modeRef.current === "world" && curRef.current !== i && !fromPointer.current) { setTouched(true); goIdx(i); } stageRef.current?.scrollTo(0, 0); }}
                onClickCapture={(e) => {
                  if (modeRef.current !== "world" || curRef.current === i || dragged.current) return;
                  const onControl = !!(e.target as HTMLElement).closest(INTERACTIVE);
                  if (!onControl || cam.current.z < 0.6) { e.preventDefault(); e.stopPropagation(); }
                  setTouched(true); goIdx(i);
                }}>
                <span className="wiv-placeTag wiv-stamp text-[var(--ink)]" aria-hidden="true">{pad(i)} · {p.short}{p.story ? "" : " · Evidence"}</span>
                <Corners />
                {p.id !== "finding" && <PlaceHead p={p} i={i} openPaper={openPaper} />}
                <Body id={p.id} d={d} active={cur === i} seen={seen[i]} />
              </section>
            ))}
          </main>
        </div>
      </div>

      {/* ============ world HUD: corners ============ */}
      <div className="wiv-hudZ wiv-worldHud wiv-hud-layer left-6 top-5 items-center gap-3">
        <Link href="/" className="wiv-btn">← Hub</Link>
        <p className="wiv-stamp wiv-backing ml-1 text-[11px] leading-snug">ESA telemetry<span className="text-[var(--muted)]"> · latent structure</span></p>
      </div>
      <dl className="wiv-hudZ wiv-worldHud wiv-hud-layer wiv-glass wiv-hud right-6 top-5 items-center gap-x-5 whitespace-nowrap px-4 py-2" aria-label="Camera readout">
        <div className="flex gap-2"><dt className="text-[var(--muted)]">Place</dt><dd className="min-w-[150px]"><Scramble text={framed || cur >= 0 ? `${pad(cur)} · ${P.short}` : "—"} /></dd></div>
        <div className="flex gap-2"><dt className="text-[var(--muted)]">X</dt><dd className="wiv-tick"><span ref={xRef}>+0000</span></dd></div>
        <div className="flex gap-2"><dt className="text-[var(--muted)]">Y</dt><dd className="wiv-tick"><span ref={yRef}>+0000</span></dd></div>
        <div className="flex gap-2"><dt className="text-[var(--muted)]">Zoom</dt><dd className="wiv-tick"><span ref={zRef}>1.00×</span></dd></div>
        <div className="flex gap-2"><dt className="text-[var(--muted)]">Mode</dt><dd className="min-w-[96px]"><Scramble text={touring ? "Guided tour" : "Free explore"} /></dd></div>
      </dl>

      {/* left edge: the index of places */}
      <nav className="wiv-hudZ wiv-worldHud wiv-hud-layer left-6 top-1/2 -translate-y-1/2" aria-label="Places">
        <ol className="wiv-glass grid py-1">
          {PLACES.map((p, i) => (
            <li key={p.id} className="relative">
              <a href={`#${p.id}`} className="wiv-chipIdx group w-[52px] justify-center" aria-current={cur === i ? "true" : undefined} aria-label={`${pad(i)} ${p.title}${p.story ? "" : " (evidence)"}`}
                onClick={(e) => { e.preventDefault(); setTouched(true); goIdx(i); }}>
                <span className="tabular-nums">{pad(i)}</span>
                <span className="wiv-glass pointer-events-none absolute left-[calc(100%+8px)] top-1/2 hidden -translate-y-1/2 px-2 py-1 text-[var(--ink)] group-hover:block group-focus-visible:block">{p.short}{p.story ? "" : " · evidence"}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* right edge: Skyviewer floating circles */}
      <div className="wiv-hudZ wiv-worldHud wiv-hud-layer right-6 top-1/2 -translate-y-1/2 flex-col gap-2.5" role="group" aria-label="Camera controls">
        <Circle label="Previous place (←)" icon="up" onClick={() => { setTouched(true); goIdx(cur - 1); }} />
        <Circle label="Next place (→)" icon="down" onClick={() => { setTouched(true); goIdx(cur + 1); }} />
        <span className="h-2" aria-hidden="true" />
        <Circle label="Zoom in (+)" icon="plus" onClick={() => zoomBy(1.35)} />
        <Circle label="Zoom out (−)" icon="minus" onClick={() => zoomBy(1 / 1.35)} />
        <Circle label="See the whole field (0)" icon="fit" onClick={overview} />
        <Circle label="Coordinate grid" icon="grid" pressed={grid} onClick={() => { setGrid(!grid); dirty.current = true; }} />
      </div>

      <p className="wiv-hudZ wiv-worldHud wiv-hud-layer wiv-hud wiv-backing bottom-6 left-6 text-[var(--muted)]">← → travel · 0 whole field</p>
      <div className="wiv-hudZ wiv-worldHud wiv-hud-layer bottom-5 right-6 gap-2">
        <button type="button" className="wiv-btn" onClick={() => openPaper(1)}><Icon n="atlas" size={13} />Read the paper</button>
      </div>

      {/* first-run hint */}
      <div className="wiv-hudZ wiv-hint pointer-events-none fixed inset-x-0 bottom-[78px] z-30 text-center sm:bottom-[88px]" style={{ opacity: touched ? 0 : 1 }} aria-hidden="true">
        <span className="wiv-glass wiv-hud inline-flex items-center gap-2.5 px-3 py-1.5 text-[var(--ink)]">
          <Icon n="move" size={14} />
          <span className="whitespace-nowrap">{world ? "Scroll to travel · drag to pan · pinch to zoom" : "Scroll, or take the tour"}</span>
        </span>
      </div>

      {/* ============ bottom centre: the one cyan thing ============ */}
      <div className="wiv-hudZ pointer-events-none fixed inset-x-3 bottom-3 z-40 flex items-center justify-center gap-2 sm:bottom-5">
        <button type="button" className="wiv-pill pointer-events-auto" onClick={tour} aria-pressed={touring}
          aria-label={touring ? `Pause guided tour, stop ${step + 1} of ${TOUR.length}` : `Take the guided tour, ${TOUR.length} stops, about two minutes`}>
          <Icon n={touring ? "pause" : "play"} size={12} />
          <span>{touring ? <>Pause<span className="hidden sm:inline"> tour</span> · {pad(step + 1)}/{pad(TOUR.length)}</> : <>Take the tour<span className="hidden min-[400px]:inline"> · 2 min</span></>}</span>
          {touring && !reduced && <span key={step} className="wiv-progress" style={{ animationDuration: `${DWELL + 1300}ms` }} />}
        </button>
        <button type="button" className="wiv-btn pointer-events-auto rounded-full px-4" aria-pressed={!touring} onClick={() => setTouring(false)}
          style={!touring ? { background: "rgba(255,255,255,.88)", color: "var(--ink)", boxShadow: "inset 0 0 0 1px var(--ink)" } : undefined}>
          <span className="inline-block h-[7px] w-[7px] rounded-full border border-[var(--ink)]" style={{ background: !touring ? "var(--ink)" : "transparent" }} aria-hidden="true" />
          <span>Explore</span>
        </button>
      </div>

      <p className="sr-only" aria-live="polite">{touring ? `Tour stop ${step + 1} of ${TOUR.length}: ${PLACES[TOUR[step]].title}` : ""}</p>

      {paper !== null && <Reader page={paper} setPage={setPaper} onClose={closePaper} />}
    </SiteCtx.Provider>
  );
}

/* ====================================================================== */
function PlaceHead({ p, i, openPaper }: { p: Place; i: number; openPaper: (n: number) => void }) {
  return (
    <header className="mb-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="wiv-label tabular-nums text-[var(--ink)]">{pad(i)}</span>
        <span className={`wiv-badge ${p.story ? "" : "is-quiet"}`}>{p.story ? "Story" : "Evidence"}</span>
        {p.pages.length > 0 && (
          <span className="ml-auto flex flex-wrap items-center gap-1.5">
            <span className="wiv-label">In the paper</span>
            {p.pages.map((n) => (
              <button key={n} type="button" className="wiv-btn min-h-[32px] px-2.5 text-[10.5px]" onClick={() => openPaper(n)} aria-label={`Open the paper at page ${n}`}>p.{n}<Icon n="arrow" size={11} /></button>
            ))}
          </span>
        )}
      </div>
      <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end lg:gap-8">
        <h2 id={`${p.id}-h`} className="wiv-display text-[20px] leading-[1.15] tracking-[0.04em] sm:text-[24px]">{p.title}</h2>
        {p.intro && <p className="wiv-body max-w-[62ch] text-[var(--muted)]">{p.intro}</p>}
      </div>
    </header>
  );
}

/* ====================================================================== */
/* the snowfield: real anomaly-score timelines as drifts, specks, slow wireframe shards                    */
function Field({ d, cam, dirty, mode, grid, reduced }: {
  d: SiteData; cam: React.MutableRefObject<Cam>; dirty: React.MutableRefObject<boolean>; mode: Mode; grid: React.MutableRefObject<boolean>; reduced: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!, ctx = c.getContext("2d")!;
    let w = 0, h = 0;
    const sizeIt = () => {
      w = c.clientWidth || innerWidth; h = c.clientHeight || innerHeight;
      const dpr = Math.min(2, devicePixelRatio || 1);
      c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); dirty.current = true;
    };
    sizeIt();
    const rnd = (() => { let sd = 7; return () => { sd = (sd * 1664525 + 1013904223) % 4294967296; return sd / 4294967296; }; })();
    const shards = Array.from({ length: 11 }, () => ({
      x: rnd() * 3000, y: rnd() * 3000, r: 50 + rnd() * 110, a: rnd() * 6.28, v: (rnd() - 0.5) * 0.00009,
      pts: Array.from({ length: 4 }, () => [rnd() * 6.28, 0.5 + rnd() * 0.5] as [number, number]),
    }));
    const specks = Array.from({ length: 260 }, () => [rnd() * 3000, rnd() * 3000, rnd()]);
    const nR = d.field.length;
    let raf = 0, last = 0;
    const wrap = (v: number, m: number) => ((v % m) + m) % m;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!dirty.current && (reduced || now - last < 40)) return;
      last = now; dirty.current = false;
      ctx.clearRect(0, 0, w, h);
      const world = mode === "world";
      const { x, y, z } = cam.current;
      const sy = world ? y * z : scrollY;
      const sx = world ? x * z : 0;
      // specks, parallax 0.35
      ctx.fillStyle = "rgba(86,97,111,0.32)";
      for (const [px, py, pr] of specks) {
        const X = wrap(px - sx * 0.35, 3000) - 600, Y = wrap(py - sy * 0.35, 3000) - 600;
        if (X < -2 || X > w + 2 || Y < -2 || Y > h + 2) continue;
        const s = pr < 0.15 ? 1.5 : 1; ctx.fillRect(X, Y, s, s);
      }
      if (world) {
        const X = (wx: number) => (wx - x) * z + w / 2, Y = (wy: number) => (wy - y) * z + h / 2;
        if (grid.current) {
          ctx.strokeStyle = "rgba(17,24,36,0.10)"; ctx.lineWidth = 1; ctx.fillStyle = "#56616f"; ctx.font = "300 10.5px ui-monospace, monospace";
          const stp = z < 0.4 ? 700 : 350;
          for (let gx = Math.ceil((x - w / 2 / z) / stp) * stp; gx < x + w / 2 / z; gx += stp) { const px = Math.round(X(gx)) + 0.5; ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke(); ctx.fillText(String(gx), px + 4, 84); }
          for (let gy = Math.ceil((y - h / 2 / z) / stp) * stp; gy < y + h / 2 / z; gy += stp) { const py = Math.round(Y(gy)) + 0.5; ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke(); ctx.fillText(String(gy), 84, py - 4); }
        }
        // drifts in world space: the six score timelines laid across the field
        for (let r = 0; r < nR; r++) {
          const vals = d.field[r], an = d.fieldAnom[r], n = vals.length;
          const base = BOUNDS.minY + 220 + (r * (BOUNDS.maxY - BOUNDS.minY - 260)) / (nR - 1);
          ctx.beginPath(); ctx.strokeStyle = "rgba(17,24,36,0.07)"; ctx.lineWidth = 1;
          for (let i = 0; i < n; i++) { const px = X(BOUNDS.minX - 400 + (i / (n - 1)) * (BOUNDS.maxX - BOUNDS.minX + 800)), py = Y(base - vals[i] * 260); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
          ctx.stroke();
          for (let i = 0; i < n; i++) {
            const px = X(BOUNDS.minX - 400 + (i / (n - 1)) * (BOUNDS.maxX - BOUNDS.minX + 800)); if (px < -4 || px > w + 4) continue;
            const py = Y(base - vals[i] * 260); if (py < -4 || py > h + 4) continue;
            if (an[i]) { ctx.fillStyle = "rgba(17,24,36,0.55)"; ctx.fillRect(px - 1.2, py - 1.2, 2.4, 2.4); }
            else { ctx.fillStyle = "rgba(86,97,111,0.36)"; ctx.fillRect(px - 0.7, py - 0.7, 1.4, 1.4); }
          }
        }
      } else {
        const zz = cam.current.z;
        ctx.save(); ctx.translate(w / 2, h / 2); ctx.scale(zz, zz); ctx.translate(-w / 2, -h / 2);
        const BAND = 380, off = sy * 0.5, first = Math.floor((off - 300) / BAND);
        for (let b = first - 1; b < first + Math.ceil(h / BAND) + 3; b++) {
          const r = wrap(b, nR), base = b * BAND - off + 160, vals = d.field[r], an = d.fieldAnom[r], n = vals.length;
          ctx.beginPath(); ctx.strokeStyle = "rgba(17,24,36,0.055)"; ctx.lineWidth = 1;
          for (let i = 0; i < n; i++) { const X = (i / (n - 1)) * (w + 80) - 40, Y = base - vals[i] * 120; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
          ctx.stroke();
          for (let i = 0; i < n; i += 2) {
            const X = (i / (n - 1)) * (w + 80) - 40, Y = base - vals[i] * 120;
            if (an[i]) { ctx.fillStyle = "rgba(17,24,36,0.42)"; ctx.fillRect(X - 1, Y - 1, 2, 2); }
            else { ctx.fillStyle = "rgba(86,97,111,0.26)"; ctx.fillRect(X - 0.6, Y - 0.6, 1.2, 1.2); }
          }
        }
        ctx.restore();
      }
      // shards, parallax 0.15, slow drift (frozen under reduced motion)
      ctx.strokeStyle = "rgba(17,24,36,0.14)"; ctx.lineWidth = 0.8;
      const t = reduced ? 0 : now;
      for (const s of shards) {
        const X = wrap(s.x - sx * 0.15, w + 400) - 200, Y = wrap(s.y - sy * 0.15, h + 400) - 200;
        const a = s.a + t * s.v;
        const p = s.pts.map(([ang, rr]) => [X + Math.cos(ang + a) * s.r * rr, Y + Math.sin(ang + a) * s.r * rr * 0.7]);
        ctx.beginPath();
        for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) { ctx.moveTo(p[i][0], p[i][1]); ctx.lineTo(p[j][0], p[j][1]); }
        ctx.stroke();
      }
    };
    raf = requestAnimationFrame(draw);
    addEventListener("resize", sizeIt);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", sizeIt); };
  }, [d, cam, dirty, mode, grid, reduced]);
  return <div className="wiv-field" aria-hidden="true"><canvas ref={ref} /></div>;
}
