"use client";
// The white world. On desktop (≥ 1180 × 740) the places float in one field and the page scrolls normally:
// the camera follows the scroll position along the path of places (each place holds, tall places pan like a page,
// then the camera glides to the next with a slight zoom-out arc). Drag the empty field, pinch, or use ± to explore
// freely; the next scroll eases the camera back onto the path. Below that size the same places stack as a plain
// scroll document over the fixed snowfield. The CSS media query decides the first paint.
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SiteData } from "./data";
import { Circle, Corners, Icon, Scramble, Segmented, pad, useReduced } from "./kit";
import { Reader } from "./reader";
import { Body } from "./places";

export type Mission = "1" | "2";
export type Place = { id: string; sec: number; title: string; lead?: string; pages: number[]; tour?: boolean; m1only?: boolean };
export const SECTIONS = ["Background", "What we did", "Results", "Conclusions", "The paper"];
export const PLACES: Place[] = [
  { id: "finding", sec: 0, title: "The finding", pages: [], tour: true,
    lead: "Telemetry has latent structure at 18–29 operational groups, not 4–5 subsystems." },
  { id: "background", sec: 1, title: "The problem and the data", pages: [1, 2], tour: true,
    lead: "Engineers watch 76+ sensor channels by hand or with thresholds. Unsupervised detectors keep raising false alarms (Kotowski et al., 2024). Why?" },
  { id: "methods", sec: 2, title: "Five richer methods", pages: [3, 4], tour: true,
    lead: "Five progressively richer unsupervised methods, from global clusters to learned latent spaces, all scored on the ESA test set." },
  { id: "structure", sec: 3, title: "Structure at the group level", pages: [5], tour: true,
    lead: "BIC picks K* = 21 on Mission 1 and 29 on Mission 2: the operational-group count, not the subsystem count." },
  { id: "table", sec: 3, title: "Table 1 · every method", pages: [5], tour: true,
    lead: "Linear methods plateau at 0.322. GMM leads Mission 1 at 0.384; TransformerVAE leads Mission 2 at 0.438." },
  { id: "failure", sec: 3, title: "Why global detectors fail", pages: [7], tour: true, m1only: true,
    lead: "On the longest Mission 1 fault, K-Means spikes at onset, then reassigns the fault to a normal cluster." },
  { id: "threshold", sec: 3, title: "Set the alarm", pages: [3, 9],
    lead: "Move the alarm threshold along a saved precision–recall curve and watch false alarms trade against catches." },
  { id: "conclusions", sec: 4, title: "What we found", pages: [5], tour: true,
    lead: "The structure is real and mode-specific; the bottleneck is multi-modality, not model linearity." },
  { id: "paper", sec: 5, title: "Read the paper", pages: [], tour: true,
    lead: "Every number here traces to a page. Read it in the field, or download the PDF." },
  { id: "about", sec: 6, title: "Designed & built by Hewitt Watkins", pages: [] },
];
const N = PLACES.length;
const SHORT = ["Finding", "Background", "Methods", "Structure", "Table 1", "Failure", "Threshold", "Conclusions", "Paper", "About"];
const TOUR = PLACES.map((p, i) => (p.tour ? i : -1)).filter((i) => i >= 0);
const DWELL = 6500;
const Q = "(min-width: 1180px) and (min-height: 740px)";
const W_PLACE = 980, COLX = 620, GAPY = 220, STEPY = 380, TRAVEL = 760, HOLD = 260;
const Z_MIN = 0.05, Z_MAX = 2.4;

type Mode = "world" | "scroll";
type Cam = { x: number; y: number; z: number };
type Drive = "follow" | "fly" | "free";
type Seg = { a: Cam; b: Cam; len: number; travel: boolean; i: number };
type Ctx = { go: (id: string) => void; openPaper: (page: number) => void; mode: Mode; cur: number; m: Mission; tour: () => void; touring: boolean };
const SiteCtx = createContext<Ctx>({ go: () => {}, openPaper: () => {}, mode: "scroll", cur: 0, m: "1", tour: () => {}, touring: false });
export const useSite = () => useContext(SiteCtx);

const INTERACTIVE = "button, a, input, select, textarea, label, summary, [role=slider], [role=radio], [role=tab], [role=option], [data-nodrag]";
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const lerpCam = (a: Cam, b: Cam, e: number, arc = 0): Cam => ({
  x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e,
  z: Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * e - arc * Math.sin(Math.PI * e)),
});
const secLabel = (p: Place) => (p.sec === 0 ? "The finding" : p.sec <= 5 ? `${pad(p.sec)} · ${SECTIONS[p.sec - 1]}` : "About this site");
const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

/* ====================================================================== */
export function Site({ d }: { d: SiteData }) {
  const reduced = useReduced();
  const reducedRef = useRef(reduced); reducedRef.current = reduced;
  const [mode, setMode] = useState<Mode>("scroll");
  const modeRef = useRef<Mode>("scroll"); modeRef.current = mode;
  const [m, setM] = useState<Mission>("1");
  const [cur, setCur] = useState(0);
  const curRef = useRef(0); curRef.current = cur;
  const [seen, setSeen] = useState<boolean[]>(() => PLACES.map((_, i) => i === 0));
  const [armed, setArmed] = useState(false);
  const [touring, setTouring] = useState(false);
  const touringRef = useRef(false); touringRef.current = touring;
  const [step, setStep] = useState(0);
  const [drive, setDriveS] = useState<Drive>("follow");
  const driveRef = useRef<Drive>("follow");
  const setDrive = useCallback((v: Drive) => { driveRef.current = v; setDriveS(v); }, []);
  const [grid, setGrid] = useState(false);
  const gridRef = useRef(false); gridRef.current = grid;
  const [paper, setPaper] = useState<number | null>(null);
  const paperRef = useRef<number | null>(null); paperRef.current = paper;

  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const tourBarRef = useRef<HTMLDivElement>(null);
  const placeRefs = useRef<(HTMLElement | null)[]>([]);
  const cam = useRef<Cam>({ x: 0, y: 0, z: 1 });
  const size = useRef({ w: 1440, h: 900 });
  const anim = useRef(0);
  const dirty = useRef(true);
  const dragged = useRef(false);
  const fromPointer = useRef(false);
  const lay = useRef<{ x: number; y: number; h: number }[]>([]);
  const path = useRef<{ segs: Seg[]; anchors: number[]; total: number }>({ segs: [], anchors: [], total: 0 });
  const bounds = useRef({ minX: -2000, maxX: 2000, minY: -1200, maxY: 6000 });
  const progUntil = useRef(0);
  const blend = useRef<{ from: Cam; t0: number } | null>(null);
  const xRef = useRef<HTMLSpanElement>(null), yRef = useRef<HTMLSpanElement>(null), zRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const q = window.matchMedia(Q);
    const f = () => setMode(q.matches ? "world" : "scroll");
    f(); q.addEventListener("change", f);
    const t = window.setTimeout(() => setArmed(true), 700);
    return () => { q.removeEventListener("change", f); window.clearTimeout(t); };
  }, []);

  const markSeen = useCallback((i: number) => setSeen((s) => (s[i] ? s : s.map((v, j) => v || j === i))), []);

  /* ---------------- camera output ---------------- */
  const apply = useCallback(() => {
    const { x, y, z } = cam.current, { w, h } = size.current;
    const el = worldRef.current;
    if (el && modeRef.current === "world") {
      el.style.transform = `translate3d(${(w / 2 - x * z).toFixed(2)}px, ${(h / 2 - y * z).toFixed(2)}px, 0) scale(${z.toFixed(4)})`;
      el.style.setProperty("--inv", (1 / z).toFixed(4));
      el.dataset.far = String(z < 0.45);
    }
    const sg = (v: number) => (v >= 0 ? "+" : "−") + pad(Math.abs(Math.round(v)), 4);
    if (xRef.current) xRef.current.textContent = sg(x);
    if (yRef.current) yRef.current.textContent = sg(y);
    if (zRef.current) zRef.current.textContent = z.toFixed(2) + "×";
    dirty.current = true;
  }, []);

  const clampCam = (c: Cam): Cam => {
    const b = bounds.current;
    return { z: Math.min(Z_MAX, Math.max(Z_MIN, c.z)), x: Math.min(b.maxX, Math.max(b.minX, c.x)), y: Math.min(b.maxY, Math.max(b.minY, c.y)) };
  };

  /* the clear box between the HUD corners (the HUD is CSS-zoomed on big screens) */
  const box = useCallback(() => {
    const { w, h } = size.current, hz = w >= 2300 ? 1.45 : w >= 1800 ? 1.2 : 1;
    return { l: 92 * hz, r: w - 84 * hz, t: 76 * hz, b: h - 84 * hz, hz };
  }, []);

  /* ---------------- world layout + the scroll path ---------------- */
  const layout = useCallback(() => {
    const els = placeRefs.current;
    const hs = els.map((el) => el?.offsetHeight ?? 600);
    const L: { x: number; y: number; h: number }[] = [];
    hs.forEach((h, i) => {
      const x = i % 2 === 0 ? -COLX : COLX;
      let y = 0;
      if (i > 0) y = L[i - 1].y + Math.max(STEPY, (hs[i - 1] - h) / 2 + 120);
      if (i > 1) y = Math.max(y, L[i - 2].y + L[i - 2].h / 2 + GAPY + h / 2);
      L.push({ x, y, h });
    });
    lay.current = L;
    els.forEach((el, i) => { if (el) { el.style.setProperty("--x", String(L[i].x)); el.style.setProperty("--y", String(L[i].y)); } });
    const last = L[L.length - 1];
    bounds.current = { minX: -COLX - W_PLACE / 2 - 500, maxX: COLX + W_PLACE / 2 + 500, minY: -L[0].h / 2 - 500, maxY: last.y + last.h / 2 + 500 };
    // camera frames: A = place top (or centred if it fits), B = place bottom
    const { w, h } = size.current, bx = box();
    const bw = bx.r - bx.l, bh = bx.b - bx.t;
    const frames = L.map((p) => {
      const z = Math.min(1.15 * bx.hz, bw / (W_PLACE + 48));
      const cx = p.x - ((bx.l + bx.r) / 2 - w / 2) / z;
      if (p.h * z + 48 <= bh) { const cy = p.y - ((bx.t + bx.b) / 2 - h / 2) / z; return { a: { x: cx, y: cy, z }, b: { x: cx, y: cy, z } }; }
      const top = p.y - p.h / 2 - 24 / z, bot = p.y + p.h / 2 + 24 / z;
      return { a: { x: cx, y: top + (h / 2 - bx.t) / z, z }, b: { x: cx, y: bot - (bx.b - h / 2) / z, z } };
    });
    const segs: Seg[] = [], anchors: number[] = [];
    let s = 0;
    frames.forEach((f, i) => {
      anchors.push(s);
      const len = Math.max(HOLD, (f.b.y - f.a.y) * f.a.z);
      segs.push({ a: f.a, b: f.b, len, travel: false, i }); s += len;
      if (i < frames.length - 1) { segs.push({ a: f.b, b: frames[i + 1].a, len: TRAVEL, travel: true, i }); s += TRAVEL; }
    });
    path.current = { segs, anchors, total: s };
    if (spacerRef.current) spacerRef.current.style.height = `${Math.round(s + h)}px`;
  }, [box]);

  const camAt = useCallback((s: number): { c: Cam; i: number } => {
    const { segs } = path.current;
    if (!segs.length) return { c: cam.current, i: 0 };
    let acc = 0;
    for (const g of segs) {
      if (s <= acc + g.len || g === segs[segs.length - 1]) {
        const k = Math.min(1, Math.max(0, (s - acc) / g.len));
        if (!g.travel) return { c: lerpCam(g.a, g.b, k), i: g.i };
        const e = ease(k);
        return { c: lerpCam(g.a, g.b, e, 0.28), i: e < 0.5 ? g.i : g.i + 1 };
      }
      acc += g.len;
    }
    return { c: cam.current, i: 0 };
  }, []);

  /* follow the scroll position (with an ease back onto the path after free exploring) */
  const follow = useCallback(() => {
    if (modeRef.current !== "world" || driveRef.current !== "follow") return;
    const { c, i } = camAt(window.scrollY);
    const bl = blend.current;
    if (bl) {
      const k = Math.min(1, (performance.now() - bl.t0) / 520);
      cam.current = lerpCam(bl.from, c, 1 - Math.pow(1 - k, 3));
      if (k >= 1) blend.current = null; else { cancelAnimationFrame(anim.current); anim.current = requestAnimationFrame(follow); }
    } else cam.current = c;
    apply();
    if (i !== curRef.current) {
      setCur(i); markSeen(i);
      try { history.replaceState(null, "", i === 0 ? location.pathname : `#${PLACES[i].id}`); } catch {}
    }
  }, [apply, camAt, markSeen]);

  const backToPath = useCallback(() => {
    cancelAnimationFrame(anim.current);
    if (driveRef.current === "follow") return;
    if (worldRef.current) worldRef.current.dataset.flying = "false";
    blend.current = reducedRef.current ? null : { from: { ...cam.current }, t0: performance.now() };
    setDrive("follow");
  }, [setDrive]);

  const flyCam = useCallback((t: Cam, onDone?: () => void) => {
    cancelAnimationFrame(anim.current);
    const to = clampCam(t), from = { ...cam.current };
    if (reducedRef.current) { cam.current = to; apply(); onDone?.(); return 0; }
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const dur = Math.min(1900, 850 + dist * 0.3);
    const zOut = Math.min(from.z, to.z, size.current.w / (dist * 1.25 + 700));
    const bump = Math.max(0, (Math.log(from.z) + Math.log(to.z)) / 2 - Math.log(zOut));
    const t0 = performance.now();
    const wEl = worldRef.current;
    if (wEl) wEl.dataset.flying = "true";
    const stepF = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      cam.current = lerpCam(from, to, ease(k), bump);
      apply();
      if (k < 1) anim.current = requestAnimationFrame(stepF);
      else { if (wEl) wEl.dataset.flying = "false"; onDone?.(); }
    };
    anim.current = requestAnimationFrame(stepF);
    return dur;
  }, [apply]);

  /* ---------------- scroll-mode travel (phones, tablets, short screens) ---------------- */
  const flyScroll = useCallback((i: number) => {
    const el = placeRefs.current[i];
    if (!el) return 0;
    cancelAnimationFrame(anim.current);
    const off = 64, from = window.scrollY;
    const to = Math.max(0, Math.min(el.getBoundingClientRect().top + from - off, document.documentElement.scrollHeight - window.innerHeight));
    if (reducedRef.current) { window.scrollTo({ top: to, behavior: "instant" }); return 0; }
    const dist = Math.abs(to - from), dur = Math.min(1600, 700 + dist * 0.08), t0 = performance.now();
    const stepF = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      window.scrollTo({ top: from + (to - from) * ease(k), behavior: "instant" });
      if (k < 1) anim.current = requestAnimationFrame(stepF);
    };
    anim.current = requestAnimationFrame(stepF);
    return dur;
  }, []);

  /* ---------------- go to a place (nav, keys, tour, focus) ---------------- */
  const goIdx = useCallback((i: number, opts: { tour?: boolean; offset?: number } = {}) => {
    const n = Math.max(0, Math.min(N - 1, i));
    setCur(n); markSeen(n);
    if (!opts.tour) setTouring(false);
    try { history.replaceState(null, "", n === 0 ? location.pathname : `#${PLACES[n].id}`); } catch {}
    if (modeRef.current !== "world") return flyScroll(n);
    const P_ = path.current, hold = P_.segs.find((g) => !g.travel && g.i === n);
    const s = P_.anchors[n] + Math.min(opts.offset ?? 0, hold ? hold.len : 0);
    progUntil.current = performance.now() + 120;
    window.scrollTo({ top: s, behavior: "instant" });
    blend.current = null;
    setDrive("fly");
    return flyCam(camAt(s).c, () => { setDrive("follow"); });
  }, [camAt, flyCam, flyScroll, markSeen, setDrive]);

  const fitAll = useCallback((): Cam => {
    const { w, h } = size.current, b = bounds.current;
    const z = Math.min((w - 240) / (b.maxX - b.minX - 1000), (h - 200) / (b.maxY - b.minY - 1000));
    return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2, z };
  }, []);
  const explore = useCallback(() => { cancelAnimationFrame(anim.current); blend.current = null; setTouring(false); setDrive("free"); }, [setDrive]);
  const overview = useCallback(() => { explore(); flyCam(fitAll()); }, [explore, fitAll, flyCam]);
  const zoomBy = useCallback((k: number) => { explore(); const c = cam.current; flyCam({ ...c, z: c.z * k }); }, [explore, flyCam]);

  /* ---------------- world: layout, intro, resize, scroll ---------------- */
  useIso(() => {
    if (mode !== "world") return;
    const st = stageRef.current!;
    size.current = { w: st.clientWidth, h: st.clientHeight };
    layout();
    const hash = location.hash.slice(1);
    const start = Math.max(0, PLACES.findIndex((p) => p.id === hash));
    const s0 = start > 0 ? path.current.anchors[start] : window.scrollY;
    if (start > 0) { progUntil.current = performance.now() + 200; window.scrollTo({ top: s0, behavior: "instant" }); }
    const home = camAt(s0);
    setCur(home.i); markSeen(home.i);
    // intro: open close on the place, then pull back onto the path
    cam.current = reducedRef.current ? home.c : { ...home.c, z: home.c.z * 1.12 };
    apply();
    let id = 0;
    if (!reducedRef.current) { setDrive("fly"); id = window.setTimeout(() => flyCam(camAt(window.scrollY).c, () => setDrive("follow")), 380); }
    let rz = 0;
    const relayout = () => {
      cancelAnimationFrame(rz);
      rz = requestAnimationFrame(() => {
        size.current = { w: st.clientWidth, h: st.clientHeight };
        const i = curRef.current, off = window.scrollY - (path.current.anchors[i] ?? 0);
        layout();
        if (driveRef.current === "follow" || driveRef.current === "fly") {
          const hold = path.current.segs.find((g) => !g.travel && g.i === i);
          const s = path.current.anchors[i] + Math.max(0, Math.min(off, hold ? hold.len : 0));
          if (Math.abs(s - window.scrollY) > 1) { progUntil.current = performance.now() + 120; window.scrollTo({ top: s, behavior: "instant" }); }
          if (driveRef.current === "follow") follow();
        }
      });
    };
    const ro = new ResizeObserver(relayout);
    ro.observe(st);
    placeRefs.current.forEach((p) => p && ro.observe(p));
    const onScroll = () => {
      if (performance.now() < progUntil.current) return;
      if (driveRef.current !== "follow") backToPath();
      cancelAnimationFrame(anim.current);
      anim.current = requestAnimationFrame(follow);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(id); ro.disconnect(); cancelAnimationFrame(rz); cancelAnimationFrame(anim.current);
      window.removeEventListener("scroll", onScroll);
      placeRefs.current.forEach((el) => { el?.style.removeProperty("--x"); el?.style.removeProperty("--y"); });
      if (worldRef.current) worldRef.current.style.transform = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /* scroll mode: which place is under the reading line; seen on view; deep link on load */
  useEffect(() => {
    if (mode !== "scroll") return;
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
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) markSeen(+(e.target as HTMLElement).dataset.idx!); }), { rootMargin: "0px 0px -15% 0px" });
    placeRefs.current.forEach((p) => p && io.observe(p));
    const i = PLACES.findIndex((p) => p.id === location.hash.slice(1));
    if (i > 0) window.setTimeout(() => { if (modeRef.current === "scroll") placeRefs.current[i]?.scrollIntoView(); }, 60);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => { window.removeEventListener("scroll", on); io.disconnect(); cancelAnimationFrame(raf); };
  }, [mode, markSeen]);

  /* deep link to a paper page: #paper-5 */
  useEffect(() => {
    const check = () => { const r = /^#paper-(\d+)$/.exec(location.hash); if (r) setPaper(Math.min(11, Math.max(1, +r[1]))); };
    const onHash = () => { check(); const i = PLACES.findIndex((p) => p.id === location.hash.slice(1)); if (i >= 0) goIdx(i); };
    check(); window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [goIdx]);

  /* ---------------- world: pointer on the empty field pans, pinch zooms; ⌘/Ctrl + wheel zooms ---------------- */
  useEffect(() => {
    if (mode !== "world") return;
    const st = stageRef.current!;
    const pts = new Map<number, { x: number; y: number }>();
    let start = { x: 0, y: 0 }, last = { x: 0, y: 0, t: 0 }, vel = { x: 0, y: 0 }, pinch0 = 0, z0 = 1, inertia = 0;
    const zoomAt = (sx: number, sy: number, nz: number) => {
      const { w, h } = size.current, c = cam.current;
      const wx = c.x + (sx - w / 2) / c.z, wy = c.y + (sy - h / 2) / c.z;
      const z = Math.min(Z_MAX, Math.max(Z_MIN, nz));
      cam.current = clampCam({ x: wx - (sx - w / 2) / z, y: wy - (sy - h / 2) / z, z });
      apply();
    };
    const interrupt = () => { cancelAnimationFrame(inertia); explore(); };
    const down = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      // text and controls keep their native behaviour: only the empty field (or a dimmed place) starts a pan
      if (e.button !== 0 || t.closest(INTERACTIVE) || t.closest('.wiv-place[data-current="true"]')) return;
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
      if (!dragged.current) { dragged.current = true; interrupt(); try { st.setPointerCapture(e.pointerId); } catch {} st.dataset.drag = "true"; }
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
          if (Math.hypot(v.x, v.y) > 0.3) inertia = requestAnimationFrame(glide);
        };
        inertia = requestAnimationFrame(glide);
      }
    };
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault(); interrupt();
        const r = st.getBoundingClientRect();
        zoomAt(e.clientX - r.left, e.clientY - r.top, cam.current.z * Math.exp(-e.deltaY * 0.012));
        return;
      }
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.5 && !(e.target as HTMLElement).closest(".overflow-x-auto")) {
        e.preventDefault(); interrupt();
        const c = cam.current; cam.current = clampCam({ ...c, x: c.x + e.deltaX / c.z }); apply();
        return;
      }
      cancelAnimationFrame(inertia);
      // plain vertical wheel: the browser scrolls the page and the camera follows (see onScroll)
      if (driveRef.current !== "follow") { backToPath(); anim.current = requestAnimationFrame(follow); }
    };
    const noScroll = () => { st.scrollTop = 0; st.scrollLeft = 0; };
    // the empty field never starts a text selection (text inside the current place still selects normally)
    const md = (e: MouseEvent) => { const t = e.target as HTMLElement; if (e.button === 0 && !t.closest(INTERACTIVE) && !t.closest('.wiv-place[data-current="true"]')) e.preventDefault(); };
    st.addEventListener("mousedown", md);
    st.addEventListener("pointerdown", down); st.addEventListener("pointermove", move);
    st.addEventListener("pointerup", up); st.addEventListener("pointercancel", up);
    window.addEventListener("wheel", wheel, { passive: false });
    st.addEventListener("scroll", noScroll);
    return () => {
      st.removeEventListener("pointerdown", down); st.removeEventListener("pointermove", move);
      st.removeEventListener("pointerup", up); st.removeEventListener("pointercancel", up);
      window.removeEventListener("wheel", wheel); st.removeEventListener("scroll", noScroll); st.removeEventListener("mousedown", md);
      cancelAnimationFrame(inertia);
    };
  }, [mode, apply, explore, backToPath, follow]);

  /* world: keyboard focus inside a place brings it (and the focused control) into the clear box */
  useEffect(() => {
    if (mode !== "world") return;
    const onFocus = (e: FocusEvent) => {
      const t = e.target as HTMLElement;
      const pl = t.closest<HTMLElement>(".wiv-place");
      stageRef.current?.scrollTo(0, 0);
      if (!pl || fromPointer.current || paperRef.current !== null) return;
      const i = +pl.dataset.idx!;
      const bx = box(), z = path.current.segs.find((g) => !g.travel && g.i === i)?.a.z ?? 1;
      const hold = path.current.segs.find((g) => !g.travel && g.i === i)!;
      const oy = (t.getBoundingClientRect().top - pl.getBoundingClientRect().top) / cam.current.z;
      const off = Math.max(0, Math.min(hold.len, oy * z - (bx.b - bx.t) * 0.45));
      if (i !== curRef.current || driveRef.current !== "follow") { goIdx(i, { offset: off }); return; }
      const r = t.getBoundingClientRect();
      if (r.top < bx.t || r.bottom > bx.b) { window.scrollTo({ top: path.current.anchors[i] + off, behavior: "instant" }); }
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, [mode, box, goIdx]);

  const stopTour = useCallback(() => {
    setTouring(false);
    window.setTimeout(() => {
      fromPointer.current = true;
      placeRefs.current[curRef.current]?.focus({ preventScroll: true });
      window.setTimeout(() => { fromPointer.current = false; }, 50);
    }, 0);
  }, []);
  /* ---------------- keyboard ---------------- */
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (paperRef.current !== null || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement;
      const k = e.key;
      if (k === "Escape" && touringRef.current) { e.preventDefault(); stopTour(); return; }
      if (touringRef.current && ["PageDown", "PageUp", "ArrowDown", "ArrowUp", " ", "Home", "End"].includes(k) && !tourBarRef.current?.contains(t)) stopTour();
      if (modeRef.current !== "world") return; // the scroll document keeps the browser's own keys
      if (t.closest("input, select, textarea, [role=slider], [role=radio], [role=tab], [role=option], [role=application], dialog, table")) return;
      if (k === "ArrowRight") { e.preventDefault(); goIdx(curRef.current + 1); }
      else if (k === "ArrowLeft") { e.preventDefault(); goIdx(curRef.current - 1); }
      else if (k === "+" || k === "=") zoomBy(1.35);
      else if (k === "-" || k === "_") zoomBy(1 / 1.35);
      else if (k === "0") overview();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goIdx, zoomBy, overview]);

  /* ---------------- guided tour: scroll or Esc exits; focus goes to the tour bar, then to where it stopped ---------------- */
  useEffect(() => {
    if (!touring) return;
    goIdx(TOUR[step], { tour: true });
    const id = window.setTimeout(() => { if (step >= TOUR.length - 1) stopTour(); else setStep(step + 1); }, DWELL);
    return () => window.clearTimeout(id);
  }, [touring, step, goIdx, stopTour]);
  useEffect(() => {
    if (!touring) return;
    tourBarRef.current?.querySelector<HTMLElement>("[data-tour-next]")?.focus({ preventScroll: true });
    const user = () => stopTour();
    window.addEventListener("wheel", user, { passive: true });
    window.addEventListener("touchmove", user, { passive: true });
    return () => { window.removeEventListener("wheel", user); window.removeEventListener("touchmove", user); };
  }, [touring, stopTour]);
  const tour = useCallback(() => {
    if (touringRef.current) { stopTour(); return; }
    setStep(0); setTouring(true);
  }, [stopTour]);

  const openPaper = useCallback((p: number) => { setTouring(false); setPaper(p); }, []);
  const closePaper = useCallback(() => {
    setPaper(null);
    if (/^#paper-/.test(location.hash)) try { history.replaceState(null, "", curRef.current ? `#${PLACES[curRef.current].id}` : location.pathname); } catch {}
  }, []);
  const ctx: Ctx = { go: (id) => goIdx(PLACES.findIndex((p) => p.id === id)), openPaper, mode, cur, m, tour, touring };
  const P = PLACES[cur];
  const world = mode === "world";
  const curSec = P.sec;
  const secIdx = (s: number) => PLACES.findIndex((p) => p.sec === s);
  const missionSeg = <Segmented label="Mission shown in every figure" value={m} set={setM} options={[{ v: "1", label: "M1" }, { v: "2", label: "M2" }]} />;
  const tourBar = touring && (
    <div ref={tourBarRef} role="region" aria-label="Guided tour" className="wiv-tourBar">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="wiv-label text-[var(--ink)]">Tour {pad(step + 1)}/{pad(TOUR.length)} · {secLabel(PLACES[TOUR[step]])}<span className="hidden sm:inline text-[var(--muted)]"> · Esc or scroll exits</span></p>
        <p className="truncate text-[12px] max-sm:hidden" aria-live="polite">{PLACES[TOUR[step]].lead}</p>
        {!reduced && <span key={step} className="wiv-progress" style={{ animationDuration: `${DWELL}ms` }} />}
      </div>
      <button type="button" className="wiv-btn min-h-[36px] px-3" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))} aria-label="Previous stop">←</button>
      <button type="button" className="wiv-btn min-h-[36px] px-3" data-tour-next onClick={() => (step >= TOUR.length - 1 ? stopTour() : setStep(step + 1))}>{step >= TOUR.length - 1 ? "Finish" : "Next →"}</button>
      <button type="button" className="wiv-btn is-ghost min-h-[36px] px-2.5" onClick={stopTour} aria-label="Exit the tour"><Icon n="close" size={13} /></button>
    </div>
  );

  return (
    <SiteCtx.Provider value={ctx}>
      <a href="#background" className="wiv-skip" onClick={(e) => { e.preventDefault(); placeRefs.current[1]?.focus({ preventScroll: true }); if (modeRef.current !== "world") goIdx(1); }}>Skip to the findings</a>
      <Field d={d} cam={cam} dirty={dirty} mode={mode} grid={gridRef} reduced={reduced} bounds={bounds} />

      {/* ============ scroll-mode header (phones, tablets, short screens) ============ */}
      <header className="wiv-scrollHud wiv-glass sticky top-0 z-30 border-x-0 border-t-0">
        <div className="flex items-center gap-1 pl-1.5 pr-2 sm:pl-4">
          <Link href="/" className="wiv-btn is-ghost shrink-0 px-2.5" aria-label="Back to hub">←<span className="hidden sm:inline">&nbsp;Hub</span></Link>
          <nav aria-label="Sections" className="min-w-0 flex-1">
            <ol className="flex overflow-x-auto [scrollbar-width:none]">
              {SECTIONS.map((t, s) => (
                <li key={t}>
                  <a href={`#${PLACES[secIdx(s + 1)].id}`} className="wiv-chipIdx" aria-current={curSec === s + 1 ? "location" : undefined}
                    onClick={(e) => { e.preventDefault(); goIdx(secIdx(s + 1)); }}>
                    <span className="tabular-nums">{pad(s + 1)}</span><span className="wiv-idxName">{t}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="shrink-0">{missionSeg}</div>
        </div>
        {tourBar && <div className="border-t border-[var(--rime)] px-2 py-1.5 sm:px-4">{tourBar}</div>}
      </header>

      {/* ============ world HUD: corners ============ */}
      <div className="wiv-hudZ wiv-worldHud wiv-hud-layer left-6 top-5 items-center gap-3">
        <Link href="/" className="wiv-btn">← Hub</Link>
        <p className="wiv-stamp wiv-backing ml-1 text-[11px] leading-snug">ESA telemetry<span className="text-[var(--muted)]"> · latent structure</span></p>
      </div>
      <div className="wiv-hudZ wiv-worldHud wiv-hud-layer right-6 top-5 items-center gap-2">
        <dl className="wiv-glass wiv-hud flex items-center gap-x-5 whitespace-nowrap px-4 py-2" aria-label="Camera readout">
          <div className="flex gap-2"><dt className="text-[var(--muted)]">Place</dt><dd className="min-w-[150px]"><Scramble text={`${pad(cur)} · ${SHORT[cur]}`} /></dd></div>
          <div className="flex gap-2 max-[1439px]:hidden"><dt className="text-[var(--muted)]">X</dt><dd className="wiv-tick"><span ref={xRef}>+0000</span></dd></div>
          <div className="flex gap-2 max-[1439px]:hidden"><dt className="text-[var(--muted)]">Y</dt><dd className="wiv-tick"><span ref={yRef}>+0000</span></dd></div>
          <div className="flex gap-2"><dt className="text-[var(--muted)]">Zoom</dt><dd className="wiv-tick"><span ref={zRef}>1.00×</span></dd></div>
          <div className="flex gap-2"><dt className="text-[var(--muted)]">Mode</dt><dd className="min-w-[96px]"><Scramble text={touring ? "Guided tour" : drive === "free" ? "Free explore" : "Scroll path"} /></dd></div>
        </dl>
        <div className="flex items-center gap-2"><span className="wiv-label wiv-backing">Mission</span>{missionSeg}</div>
      </div>

      {/* left edge: the five sections */}
      <div className="wiv-worldHud wiv-hud-layer pointer-events-none inset-y-0 left-6 items-center">
        <nav className="wiv-hudZ pointer-events-auto" aria-label="Sections">
          <ol className="wiv-glass grid py-1">
            {SECTIONS.map((t, s) => (
              <li key={t} className="relative">
                <a href={`#${PLACES[secIdx(s + 1)].id}`} className="wiv-chipIdx group w-[52px] justify-center" aria-current={curSec === s + 1 ? "location" : undefined} aria-label={`${pad(s + 1)} ${t}`}
                  onClick={(e) => { e.preventDefault(); goIdx(secIdx(s + 1)); }}>
                  <span className="tabular-nums">{pad(s + 1)}</span>
                  <span className="wiv-glass pointer-events-none absolute left-[calc(100%+8px)] top-1/2 hidden -translate-y-1/2 px-2 py-1 text-[var(--ink)] group-hover:block group-focus-visible:block">{t}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* right edge: Skyviewer floating circles */}
      <div className="wiv-worldHud wiv-hud-layer pointer-events-none inset-y-0 right-6 items-center">
        <div className="wiv-hudZ pointer-events-auto flex flex-col gap-2.5" role="group" aria-label="Camera controls">
          <Circle label="Previous place (←)" icon="up" onClick={() => goIdx(cur - 1)} disabled={cur === 0} />
          <Circle label="Next place (→)" icon="down" onClick={() => goIdx(cur + 1)} disabled={cur === N - 1} />
          <span className="h-2" aria-hidden="true" />
          <Circle label="Zoom in (+)" icon="plus" onClick={() => zoomBy(1.35)} />
          <Circle label="Zoom out (−)" icon="minus" onClick={() => zoomBy(1 / 1.35)} />
          <Circle label="See the whole field (0)" icon="fit" onClick={overview} />
          <Circle label="Coordinate grid" icon="grid" pressed={grid} onClick={() => { setGrid(!grid); dirty.current = true; }} />
        </div>
      </div>

      <p className={`wiv-hudZ wiv-worldHud wiv-hud-layer wiv-hud wiv-backing bottom-6 left-6 items-center gap-2 text-[var(--muted)] ${touring ? "invisible" : ""}`}>
        <Icon n="move" size={13} />{drive === "free" ? "Free explore · scroll to rejoin the path" : "Scroll to travel · drag the field · ← → jump"}
      </p>
      {/* ============ the stage + world (all places) ============ */}
      <div ref={stageRef} className="wiv-stage" data-mode={mode} data-drive={drive}
        role={world ? "region" : undefined} aria-roledescription={world ? "explorable field" : undefined}
        aria-label={world ? "The findings field. Scroll travels through the places in order; left and right arrows jump between places; drag the empty field to pan; Ctrl or Command with scroll zooms; 0 shows the whole field." : undefined}
        onClickCapture={(e) => { if (dragged.current) { e.preventDefault(); e.stopPropagation(); dragged.current = false; } }}>
        <div ref={worldRef} className="wiv-world" data-far="false">
          <main className="wiv-scrollStack" id="wiv-main" data-armed={armed}>
            {PLACES.map((p, i) => (
              <section key={p.id} id={p.id} data-idx={i} ref={(el) => { placeRefs.current[i] = el; }} tabIndex={-1}
                className={`wiv-place ${i === 0 ? "is-hero" : ""}`} aria-labelledby={`${p.id}-h`} data-current={cur === i} data-seen={seen[i]}
                onPointerDown={() => { fromPointer.current = true; window.setTimeout(() => { fromPointer.current = false; }, 400); }}
                onClickCapture={(e) => {
                  if (modeRef.current !== "world" || dragged.current) return;
                  if (curRef.current === i && driveRef.current !== "free") return;
                  const onControl = !!(e.target as HTMLElement).closest(INTERACTIVE);
                  if (!onControl || cam.current.z < 0.6) { e.preventDefault(); e.stopPropagation(); }
                  goIdx(i);
                }}>
                <span className="wiv-placeTag wiv-stamp text-[var(--ink)]" aria-hidden="true">{secLabel(p)}{p.sec === 3 ? ` · ${p.title}` : ""}</span>
                <Corners />
                {i > 0 && <PlaceHead p={p} m={m} openPaper={openPaper} />}
                <Body id={p.id} d={d} seen={seen[i]} />
              </section>
            ))}
          </main>
        </div>
      </div>
      {world && <div ref={spacerRef} className="wiv-spacer" aria-hidden="true" />}
      <p className="sr-only" aria-live="polite">Showing Mission {m}</p>

      {world && tourBar && <div className="wiv-hudZ fixed inset-x-0 bottom-4 z-40 flex justify-center px-6"><div className="w-[min(680px,100%)]">{tourBar}</div></div>}

      {paper !== null && <Reader page={paper} setPage={setPaper} onClose={closePaper} />}
    </SiteCtx.Provider>
  );
}

/* ====================================================================== */
function PlaceHead({ p, m, openPaper }: { p: Place; m: Mission; openPaper: (n: number) => void }) {
  return (
    <header className="mb-6">
      <div className="flex min-h-[32px] flex-wrap items-center gap-x-3 gap-y-2">
        <span className="wiv-label tabular-nums text-[var(--ink)]">{secLabel(p)}</span>
        {p.m1only && m === "2" && <span className="wiv-badge is-quiet">Mission 1 data</span>}
        {p.pages.length > 0 && (
          <span className="ml-auto flex flex-wrap items-center gap-1.5">
            {p.pages.map((n) => (
              <button key={n} type="button" className="wiv-pchip" onClick={() => openPaper(n)} aria-label={`Open the paper at page ${n}`}>p.{n}<Icon n="arrow" size={11} /></button>
            ))}
          </span>
        )}
      </div>
      <div className="mt-2 grid gap-2 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-end lg:gap-8">
        <h2 id={`${p.id}-h`} className="wiv-display text-[19px] leading-[1.2] tracking-[0.04em] sm:text-[22px]">{p.title}</h2>
        {p.lead && <p className="wiv-body max-w-[60ch] text-[var(--muted)]">{p.lead}</p>}
      </div>
    </header>
  );
}

/* ====================================================================== */
/* the snowfield: real anomaly-score timelines as drifts, specks, slow wireframe shards                    */
function Field({ d, cam, dirty, mode, grid, reduced, bounds }: {
  d: SiteData; cam: React.MutableRefObject<Cam>; dirty: React.MutableRefObject<boolean>; mode: Mode; grid: React.MutableRefObject<boolean>; reduced: boolean;
  bounds: React.MutableRefObject<{ minX: number; maxX: number; minY: number; maxY: number }>;
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
      ctx.fillStyle = "rgba(86,97,111,0.32)";
      for (const [px, py, pr] of specks) {
        const X = wrap(px - sx * 0.35, 3000) - 600, Y = wrap(py - sy * 0.35, 3000) - 600;
        if (X < -2 || X > w + 2 || Y < -2 || Y > h + 2) continue;
        const s = pr < 0.15 ? 1.5 : 1; ctx.fillRect(X, Y, s, s);
      }
      if (world) {
        const B = bounds.current;
        const X = (wx: number) => (wx - x) * z + w / 2, Y = (wy: number) => (wy - y) * z + h / 2;
        if (grid.current) {
          ctx.strokeStyle = "rgba(17,24,36,0.10)"; ctx.lineWidth = 1; ctx.fillStyle = "#56616f"; ctx.font = "300 10.5px ui-monospace, monospace";
          const stp = z < 0.2 ? 1400 : z < 0.4 ? 700 : 350;
          for (let gx = Math.ceil((x - w / 2 / z) / stp) * stp; gx < x + w / 2 / z; gx += stp) { const px = Math.round(X(gx)) + 0.5; ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke(); ctx.fillText(String(gx), px + 4, 84); }
          for (let gy = Math.ceil((y - h / 2 / z) / stp) * stp; gy < y + h / 2 / z; gy += stp) { const py = Math.round(Y(gy)) + 0.5; ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke(); ctx.fillText(String(gy), 96, py - 4); }
        }
        // drifts in world space: the score timelines laid across the field, one every ~900 units
        const rows = Math.max(nR, Math.round((B.maxY - B.minY) / 900));
        for (let r = 0; r < rows; r++) {
          const vals = d.field[r % nR], an = d.fieldAnom[r % nR], n = vals.length;
          const base = B.minY + 300 + (r * (B.maxY - B.minY - 400)) / Math.max(1, rows - 1);
          if (Y(base) < -300 || Y(base - 300) > h + 300) continue;
          ctx.beginPath(); ctx.strokeStyle = "rgba(17,24,36,0.07)"; ctx.lineWidth = 1;
          for (let i = 0; i < n; i++) { const px = X(B.minX - 400 + (i / (n - 1)) * (B.maxX - B.minX + 800)), py = Y(base - vals[i] * 260); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
          ctx.stroke();
          for (let i = 0; i < n; i++) {
            const px = X(B.minX - 400 + (i / (n - 1)) * (B.maxX - B.minX + 800)); if (px < -4 || px > w + 4) continue;
            const py = Y(base - vals[i] * 260); if (py < -4 || py > h + 4) continue;
            if (an[i]) { ctx.fillStyle = "rgba(17,24,36,0.55)"; ctx.fillRect(px - 1.2, py - 1.2, 2.4, 2.4); }
            else { ctx.fillStyle = "rgba(86,97,111,0.36)"; ctx.fillRect(px - 0.7, py - 0.7, 1.4, 1.4); }
          }
        }
      } else {
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
      }
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
  }, [d, cam, dirty, mode, grid, reduced, bounds]);
  return <div className="wiv-field" aria-hidden="true"><canvas ref={ref} /></div>;
}
