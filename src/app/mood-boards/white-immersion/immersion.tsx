"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ARTIFACTS, KIND_LABEL, WORLD, layout, type Artifact } from "./board-data";
import type { BoardData } from "./load-data";
import { Generated, useScramble } from "./generated";
import s from "./cls";

export const MOOD = "Whiteout · Crystalline · Instrumented";
const N = ARTIFACTS.length;
const GEN = ARTIFACTS.filter((a) => a.generated).length;
export const COUNT_LINE = `${N} artifacts: photos, type, color, texture, and interface pieces`;
const Z_MIN = 0.12, Z_MAX = 2.2;
const DWELL = 4600;
const pad = (n: number) => String(n).padStart(2, "0");
// sheet: phones + tablet portrait (note below the artifact) · short: phone landscape (note beside) · desk
type Lay = "sheet" | "short" | "desk";
const getLay = (): Lay =>
  window.matchMedia("(max-height: 520px)").matches ? "short" : window.matchMedia("(max-width: 900px)").matches ? "sheet" : "desk";

type Cam = { x: number; y: number; z: number };

// Overview zoom. Desktop fits the whole 6000 × 3000 world. Portrait screens fit its height instead, so the
// four rows fill the screen and the outer columns run off both edges (an honest "there is more, drag").
const fitFor = (w: number, h: number, L: Lay) => {
  const all = Math.min((w - 150) / 5800, (h - 250) / 2700);
  if (L === "desk") return all;
  if (L === "short") return Math.max(0.17, all);
  return Math.min(0.27, Math.max(0.17, (h - 300) / 2700));
};

export function Immersion({ data }: { data: BoardData }) {
  const pos = useMemo(() => layout(), []);
  const [mode, setMode] = useState<"field" | "grid">("field");
  const [sel, setSel] = useState<number | null>(null);
  const [touring, setTouring] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [touched, setTouched] = useState(false);
  const [lay, setLay] = useState<Lay>("desk");
  const [coarse, setCoarse] = useState(false);
  const [zoomText, setZoomText] = useState("0.30×");
  const creditsRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const f = () => { setReduced(m.matches); setLay(getLay()); setCoarse(window.matchMedia("(pointer: coarse)").matches); };
    f(); m.addEventListener("change", f); window.addEventListener("resize", f);
    return () => { m.removeEventListener("change", f); window.removeEventListener("resize", f); };
  }, []);

  return (
    <>
      {mode === "field" ? (
        <Field
          data={data} pos={pos} sel={sel} setSel={setSel} touring={touring} setTouring={setTouring}
          reduced={reduced} lay={lay} coarse={coarse} overlay={overlay} setOverlay={setOverlay}
          touched={touched} setTouched={setTouched} zoomText={zoomText} setZoomText={setZoomText}
          onGrid={() => { setTouring(false); setMode("grid"); }}
          onCredits={() => creditsRef.current?.showModal()}
        />
      ) : (
        <Grid data={data} reduced={reduced} onField={() => setMode("field")} onCredits={() => creditsRef.current?.showModal()} />
      )}
      <Credits refEl={creditsRef} />
    </>
  );
}

/* ====================================================================== */
/* Immersive field                                                         */
/* ====================================================================== */

type FieldProps = {
  data: BoardData; pos: { x: number; y: number }[];
  sel: number | null; setSel: (i: number | null) => void;
  touring: boolean; setTouring: (b: boolean) => void;
  reduced: boolean; lay: Lay; coarse: boolean;
  overlay: boolean; setOverlay: (b: boolean) => void;
  touched: boolean; setTouched: (b: boolean) => void;
  zoomText: string; setZoomText: (s: string) => void;
  onGrid: () => void; onCredits: () => void;
};

function Field(p: FieldProps) {
  const { data, pos, sel, setSel, touring, setTouring, reduced, lay, coarse, overlay, setOverlay } = p;
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const xRef = useRef<HTMLSpanElement>(null);
  const yRef = useRef<HTMLSpanElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const cam = useRef<Cam>({ x: 0, y: 0, z: 0.3 });
  const size = useRef({ w: 1440, h: 900 });
  const anim = useRef(0);
  const dirty = useRef(true);
  const dragged = useRef(false);
  const fromPointer = useRef(false);
  const introDone = useRef(false);
  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const layRef = useRef(lay);
  layRef.current = lay;
  const setZoomText = p.setZoomText;
  const touchRef = useRef(p.setTouched);
  touchRef.current = p.setTouched;

  const apply = useCallback(() => {
    const { x, y, z } = cam.current;
    const { w, h } = size.current;
    const el = worldRef.current;
    if (el) {
      el.style.transform = `translate3d(${(w / 2 - x * z).toFixed(2)}px, ${(h / 2 - y * z).toFixed(2)}px, 0) scale(${z.toFixed(4)})`;
      const root = stageRef.current!;
      root.style.setProperty("--z", z.toFixed(4));
      root.style.setProperty("--inv", (1 / z).toFixed(4));
      el.dataset.far = String(z < 0.15);
      el.dataset.mid = String(z < 0.42);
    }
    if (xRef.current) xRef.current.textContent = (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(0).padStart(4, "0");
    if (yRef.current) yRef.current.textContent = (y >= 0 ? "+" : "−") + Math.abs(y).toFixed(0).padStart(4, "0");
    const zt = z.toFixed(2) + "×";
    document.querySelectorAll<HTMLElement>("[data-zoom-readout]").forEach((n) => { n.textContent = zt; });
    dirty.current = true;
  }, []);

  const clampCam = (c: Cam): Cam => ({
    z: Math.min(Z_MAX, Math.max(Z_MIN, c.z)),
    x: Math.min(WORLD.maxX, Math.max(WORLD.minX, c.x)),
    y: Math.min(WORLD.maxY, Math.max(WORLD.minY, c.y)),
  });

  const fitZoom = useCallback(() => {
    const { w, h } = size.current;
    return fitFor(w, h, layRef.current);
  }, []);

  const flyTo = useCallback((t: Cam, onDone?: () => void) => {
    cancelAnimationFrame(anim.current);
    const target = clampCam(t);
    const from = { ...cam.current };
    if (reducedRef.current) { cam.current = target; apply(); setZoomText(target.z.toFixed(2) + "×"); onDone?.(); return 0; }
    const dist = Math.hypot(target.x - from.x, target.y - from.y);
    const dur = Math.min(1900, 850 + dist * 0.35);
    const l0 = Math.log(from.z), l1 = Math.log(target.z);
    const zOut = Math.min(from.z, target.z, size.current.w / (dist * 1.4 + 600));
    const bump = Math.max(0, (l0 + l1) / 2 - Math.log(zOut));
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      cam.current = {
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e,
        z: Math.exp(l0 + (l1 - l0) * e - bump * Math.sin(Math.PI * e)),
      };
      apply();
      if (k < 1) anim.current = requestAnimationFrame(step);
      else { setZoomText(target.z.toFixed(2) + "×"); onDone?.(); }
    };
    anim.current = requestAnimationFrame(step);
    return dur;
  }, [apply, setZoomText]);

  const targetFor = useCallback((i: number): Cam => {
    const a = ARTIFACTS[i], c = pos[i];
    const { w, h } = size.current;
    // keep the card clear of the note panel (left on desktop, bottom sheet on phones)
    const L = layRef.current;
    const box = L === "sheet"
      ? { l: 12, r: w - 64, t: 72, b: h * 0.56 - 84 }
      : L === "short"
        ? { l: 344, r: w - 70, t: 64, b: h - 64 }
        : { l: 420, r: w - 96, t: 96, b: h - 110 };
    const bw = box.r - box.l, bh = box.b - box.t;
    const z = Math.min(1.5, (bw * 0.82) / a.w, (bh * 0.8) / (a.h + 40));
    const sx = (box.l + box.r) / 2, sy = (box.t + box.b) / 2;
    return { x: c.x - (sx - w / 2) / z, y: c.y + 14 / z - (sy - h / 2) / z, z };
  }, [pos]);

  const select = useCallback((i: number | null, opts: { fly?: boolean; focus?: boolean } = {}) => {
    setSel(i);
    introDone.current = true;
    if (i === null) return;
    if (opts.focus) cardRefs.current[i]?.focus({ preventScroll: true });
    if (opts.fly !== false) flyTo(targetFor(i));
  }, [flyTo, setSel, targetFor]);

  const overview = useCallback(() => {
    setSel(null);
    const z = fitZoom(); flyTo({ x: 0, y: -20 / z, z });
  }, [fitZoom, flyTo, setSel]);

  /* size + initial camera */
  useLayoutEffect(() => {
    const st = stageRef.current!;
    const measure = () => {
      size.current = { w: st.clientWidth, h: st.clientHeight };
      const c = canvasRef.current!;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = size.current.w * dpr; c.height = size.current.h * dpr;
      apply();
    };
    size.current = { w: st.clientWidth, h: st.clientHeight };
    const L = getLay();
    layRef.current = L;
    const nz = fitFor(size.current.w, size.current.h, L);
    const home = { x: 0, y: -20 / nz, z: nz };
    // intro: open close on the title (legible), then pull back to the vast field, so the very first
    // thing a visitor sees is the camera moving: this is a space you can zoom through.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const iz = Math.max(nz * 1.25, Math.min(0.42, (size.current.w - (L === "desk" ? 32 : 112)) / 1180));
    cam.current = still ? home : { x: 0, y: -10, z: iz };
    setZoomText(cam.current.z.toFixed(2) + "×");
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(st);
    const id = still ? 0 : window.setTimeout(() => { if (!introDone.current) { introDone.current = true; flyTo(home); } }, 650);
    return () => { ro.disconnect(); window.clearTimeout(id); };
  }, [apply, setZoomText, flyTo]);

  /* background: the snowfield of data, drifting shards, optional coordinate grid */
  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const rnd = (() => { let sd = 42; return () => { sd = (sd * 1664525 + 1013904223) % 4294967296; return sd / 4294967296; }; })();
    const specks = Array.from({ length: 340 }, () => [rnd() * 4000, rnd() * 4000, rnd()]);
    const shards = Array.from({ length: 13 }, () => ({
      x: rnd() * 3000, y: rnd() * 2000, r: 40 + rnd() * 110, a: rnd() * 6.28, v: (rnd() - 0.5) * 0.00012,
      pts: Array.from({ length: 4 }, () => [rnd() * 6.28, 0.5 + rnd() * 0.5] as [number, number]),
    }));
    const nR = data.field.length;
    let raf = 0;
    const draw = (now: number) => {
      const { w, h } = size.current;
      const dpr = c.width / w;
      if (!dirty.current && reducedRef.current) { raf = requestAnimationFrame(draw); return; }
      dirty.current = false;
      const { x, y, z } = cam.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const sx = (wx: number) => (wx - x) * z + w / 2;
      const sy = (wy: number) => (wy - y) * z + h / 2;

      // far specks (parallax 0.35)
      ctx.fillStyle = "rgba(86,97,111,0.35)";
      for (const [px, py, pr] of specks) {
        const X = ((px - x * z * 0.35) % 4000 + 4000) % 4000 - 1000;
        const Y = ((py - y * z * 0.35) % 4000 + 4000) % 4000 - 1000;
        if (X < -2 || X > w + 2 || Y < -2 || Y > h + 2) continue;
        ctx.fillRect(X, Y, pr < 0.15 ? 1.5 : 1, pr < 0.15 ? 1.5 : 1);
      }

      // coordinate grid overlay (Skyviewer's grid toggle)
      if (overlayRef.current) {
        ctx.strokeStyle = "rgba(17,24,36,0.10)"; ctx.lineWidth = 1;
        ctx.fillStyle = "rgba(86,97,111,0.9)"; ctx.font = "300 10px ui-monospace, monospace";
        const stepW = z < 0.3 ? 700 : 350;
        for (let gx = Math.ceil((x - w / 2 / z) / stepW) * stepW; gx < x + w / 2 / z; gx += stepW) {
          const X = Math.round(sx(gx)) + 0.5; ctx.beginPath(); ctx.moveTo(X, 0); ctx.lineTo(X, h); ctx.stroke();
          ctx.fillText(String(gx), X + 4, h - 64);
        }
        for (let gy = Math.ceil((y - h / 2 / z) / stepW) * stepW; gy < y + h / 2 / z; gy += stepW) {
          const Y = Math.round(sy(gy)) + 0.5; ctx.beginPath(); ctx.moveTo(0, Y); ctx.lineTo(w, Y); ctx.stroke();
          ctx.fillText(String(gy), 6, Y - 4);
        }
      }

      // snowfield: our six score timelines as drifts of points across the whole world
      for (let r = 0; r < nR; r++) {
        const vals = data.field[r], an = data.fieldAnom[r];
        const base = WORLD.minY + 180 + (r * (WORLD.maxY - WORLD.minY - 200)) / (nR - 1);
        const n = vals.length;
        ctx.beginPath();
        ctx.strokeStyle = "rgba(17,24,36,0.07)"; ctx.lineWidth = 1;
        for (let i = 0; i < n; i++) {
          const X = sx(WORLD.minX + (i / (n - 1)) * (WORLD.maxX - WORLD.minX));
          const Y = sy(base - vals[i] * 240);
          if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        }
        ctx.stroke();
        for (let i = 0; i < n; i++) {
          const X = sx(WORLD.minX + (i / (n - 1)) * (WORLD.maxX - WORLD.minX));
          if (X < -4 || X > w + 4) continue;
          const Y = sy(base - vals[i] * 240);
          if (Y < -4 || Y > h + 4) continue;
          if (an[i]) { ctx.fillStyle = "rgba(17,24,36,0.62)"; ctx.fillRect(X - 1.2, Y - 1.2, 2.4, 2.4); }
          else { ctx.fillStyle = "rgba(86,97,111,0.42)"; ctx.fillRect(X - 0.7, Y - 0.7, 1.4, 1.4); }
        }
      }

      // wireframe shards in screen space, drifting at 0.15 parallax
      ctx.strokeStyle = "rgba(17,24,36,0.16)"; ctx.lineWidth = 0.8;
      const t = reducedRef.current ? 0 : now;
      for (const sh of shards) {
        const X = ((sh.x - x * z * 0.15) % (w + 400) + (w + 400)) % (w + 400) - 200;
        const Y = ((sh.y - y * z * 0.15) % (h + 400) + (h + 400)) % (h + 400) - 200;
        const a = sh.a + t * sh.v;
        const pts = sh.pts.map(([ang, rr]) => [X + Math.cos(ang + a) * sh.r * rr, Y + Math.sin(ang + a) * sh.r * rr * 0.7]);
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[j][0], pts[j][1]); }
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [data]);

  useEffect(() => { dirty.current = true; }, [overlay, reduced]);

  /* pointer: drag to pan, pinch to zoom, inertia */
  useEffect(() => {
    const st = stageRef.current!;
    const pts = new Map<number, { x: number; y: number }>();
    let start = { x: 0, y: 0 }, last = { x: 0, y: 0, t: 0 }, vel = { x: 0, y: 0 };
    let pinch0 = 0, z0 = 0, inertia = 0;
    const zoomAt = (sx: number, sy: number, nz: number) => {
      const { w, h } = size.current; const c = cam.current;
      const wx = c.x + (sx - w / 2) / c.z, wy = c.y + (sy - h / 2) / c.z;
      const z = Math.min(Z_MAX, Math.max(Z_MIN, nz));
      cam.current = clampCam({ x: wx - (sx - w / 2) / z, y: wy - (sy - h / 2) / z, z });
      apply();
    };
    const interrupt = () => { introDone.current = true; cancelAnimationFrame(anim.current); cancelAnimationFrame(inertia); touchRef.current(true); setTouring(false); };
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest("[data-hud]")) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      dragged.current = false;
      start = { x: e.clientX, y: e.clientY }; last = { x: e.clientX, y: e.clientY, t: performance.now() }; vel = { x: 0, y: 0 };
      if (pts.size === 2) {
        const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); z0 = cam.current.z;
      }
    };
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      const prev = pts.get(e.pointerId)!;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (!dragged.current) { interrupt(); dragged.current = true; }
        const r = st.getBoundingClientRect();
        zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, z0 * (d / (pinch0 || d)));
        return;
      }
      if (!dragged.current && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 5) return;
      if (!dragged.current) { dragged.current = true; interrupt(); st.setPointerCapture(e.pointerId); st.dataset.dragging = "true"; }
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
      st.dataset.dragging = "false";
      if (pts.size === 0 && dragged.current && !reducedRef.current && performance.now() - last.t < 80) {
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
      if (dragged.current) setZoomText(cam.current.z.toFixed(2) + "×");
    };
    const wheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest("[data-hud]")) return;
      e.preventDefault();
      interrupt();
      const r = st.getBoundingClientRect();
      const k = e.ctrlKey ? 0.012 : 0.0016;
      zoomAt(e.clientX - r.left, e.clientY - r.top, cam.current.z * Math.exp(-e.deltaY * k));
      setZoomText(cam.current.z.toFixed(2) + "×");
    };
    // focusing a card inside overflow:hidden would scroll the stage; keep it pinned
    const noScroll = () => { st.scrollTop = 0; st.scrollLeft = 0; };
    st.addEventListener("pointerdown", down);
    st.addEventListener("pointermove", move);
    st.addEventListener("pointerup", up);
    st.addEventListener("pointercancel", up);
    st.addEventListener("wheel", wheel, { passive: false });
    st.addEventListener("scroll", noScroll);
    return () => {
      st.removeEventListener("pointerdown", down); st.removeEventListener("pointermove", move);
      st.removeEventListener("pointerup", up); st.removeEventListener("pointercancel", up);
      st.removeEventListener("wheel", wheel); st.removeEventListener("scroll", noScroll);
      cancelAnimationFrame(inertia);
    };
  }, [apply, setTouring, setZoomText]);

  /* guided tour */
  const [tourStep, setTourStep] = useState(0);
  useEffect(() => {
    if (!touring) return;
    const i = tourStep % N;
    setSel(i);
    const dur = flyTo(targetFor(i)) || 0;
    const id = window.setTimeout(() => {
      if (i === N - 1) { setTouring(false); overview(); }
      else setTourStep(i + 1);
    }, dur + DWELL);
    return () => window.clearTimeout(id);
  }, [touring, tourStep, flyTo, targetFor, setSel, setTouring, overview]);

  const startTour = () => {
    p.setTouched(true);
    if (touring) { setTouring(false); return; }
    setTourStep(sel ?? 0);
    setTouring(true);
  };

  const zoomBy = (f: number) => {
    setTouring(false);
    const c = cam.current;
    flyTo({ ...c, z: c.z * f });
  };

  /* keyboard */
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("dialog") || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      const cur = sel ?? -1;
      if (["ArrowRight", "ArrowDown"].includes(e.key)) { e.preventDefault(); setTouring(false); select((cur + 1) % N, { focus: true }); }
      else if (["ArrowLeft", "ArrowUp"].includes(e.key)) { e.preventDefault(); setTouring(false); select((cur - 1 + N) % N, { focus: true }); }
      else if (e.key === "+" || e.key === "=") zoomBy(1.4);
      else if (e.key === "-" || e.key === "_") zoomBy(1 / 1.4);
      else if (e.key === "0") { setTouring(false); overview(); }
      else if (e.key === "Escape") { if (touring) setTouring(false); else if (sel !== null) { const i = sel; setSel(null); cardRefs.current[i]?.focus({ preventScroll: true }); } }
      else return;
      p.setTouched(true);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const a = sel !== null ? ARTIFACTS[sel] : null;
  const idxText = useScramble(sel !== null ? `${pad(sel + 1)} / ${N}` : `— / ${N}`, true, reduced, 380);
  const modeText = useScramble(touring ? "GUIDED TOUR" : "FREE EXPLORE", true, reduced, 420);

  return (
    <div
      ref={stageRef}
      className={s.stage}
      role="region"
      aria-roledescription="explorable canvas"
      aria-label={`Mood board field, ${N} artifacts. Use Tab or the arrow keys to step through artifacts; each opens its note. Plus and minus zoom, 0 shows everything.`}
    >
      <canvas ref={canvasRef} className={s.canvas} aria-hidden="true" />

      {/* ---------- HUD: top-left ---------- */}
      <div data-hud className="z-10 absolute left-3 top-3 max-w-[calc(100%-120px)] sm:left-6 sm:top-5">
        <div className="flex items-center gap-2">
          <Link href="/" className={`${s.glass} ${s.textBtn} inline-flex items-center`}>← Hub</Link>
          <button type="button" className={`${s.glass} ${s.textBtn} sm:hidden`} onClick={p.onGrid}>Grid</button>
        </div>
        <h1 className={`${s.hudText} ${lay === "short" ? "mt-2" : "mt-4"} ${lay === "sheet" && sel !== null ? "hidden" : ""} font-[family-name:var(--wi-display)] text-[13px] leading-snug tracking-[0.06em] text-[var(--wi-ink)] sm:text-[15px]`}>
          {MOOD.split(" · ").map((w, i) => <span key={w} className="block sm:inline">{i > 0 && <span className="hidden sm:inline"> · </span>}{w}</span>)}
        </h1>
        <p className={`${s.hudText} mt-2 hidden text-[11px] font-light leading-relaxed text-[var(--wi-ink)] ${lay === "short" ? "" : "sm:block"}`}>{COUNT_LINE}</p>
        <p className={`${s.hudText} mt-0.5 hidden text-[11px] font-light text-[var(--wi-muted)] ${lay === "short" ? "" : "sm:block"}`}>✦ generated by your agent · {GEN} of {N}</p>
      </div>

      <div ref={worldRef} className={s.world} data-has-sel={sel !== null}>
        <div className={s.title} style={{ left: 0, top: -10 }} aria-hidden="true">
          <div className="mb-8 text-[22px] font-light uppercase tracking-[0.3em] text-[var(--wi-muted)]">Mood board · white-immersion</div>
          <div className="font-[family-name:var(--wi-display)] text-[92px] leading-[1.08] tracking-[0.03em] text-[var(--wi-ink)]">
            WHITEOUT<br />CRYSTALLINE<br />INSTRUMENTED
          </div>
          <div className="mx-auto mt-10 max-w-[900px] text-[30px] font-light leading-relaxed text-[var(--wi-muted)]">
            Igloo&apos;s glacial WebGL world × Rubin Skyviewer&apos;s deep zoom, inverted into a white snowfield. Every speck behind you is a real anomaly score.
          </div>
        </div>
        {ARTIFACTS.map((art, i) => (
          <button
            key={art.id}
            ref={(el) => { cardRefs.current[i] = el; }}
            type="button"
            className={s.card}
            data-sel={sel === i}
            style={{ left: pos[i].x - art.w / 2, top: pos[i].y - art.h / 2, width: art.w, height: art.h }}
            aria-label={`${pad(i + 1)} of ${N}: ${art.title}. ${KIND_LABEL[art.kind]}${art.generated ? ", generated by your agent" : ""}.`}
            aria-pressed={sel === i}
            onPointerDown={() => { fromPointer.current = true; window.setTimeout(() => { fromPointer.current = false; }, 400); }}
            onFocus={() => {
              if (fromPointer.current) { fromPointer.current = false; return; }
              if (sel !== i) { setTouring(false); select(i); }
            }}
            onClick={() => {
              if (dragged.current) { dragged.current = false; return; }
              fromPointer.current = false;
              setTouring(false); p.setTouched(true);
              select(i);
            }}
          >
            <span className={s.media}>
              {art.src ? (
                <Image src={art.src} alt={art.alt ?? ""} width={art.imgW!} height={art.imgH!} sizes="(max-width: 700px) 90vw, 720px" draggable={false} priority={i < 4} />
              ) : (
                <Generated k={art.gen!} active={sel === i} reduced={reduced} data={data} w={art.w} h={art.h} />
              )}
            </span>
            <span className={s.corners} aria-hidden="true"><i /><i /><i /><i /></span>
            <span className={s.label} aria-hidden="true">{pad(i + 1)}{art.generated ? " ✦" : ""}<span className="wi-labelText"> · {art.short}</span></span>
          </button>
        ))}
      </div>

      {/* ---------- HUD: top-right telemetry ---------- */}
      <div data-hud className={`${s.glass} z-10 absolute right-3 top-3 w-[124px] px-2.5 py-2.5 text-[10px] sm:text-[10.5px] font-light uppercase leading-[1.75] tracking-[0.1em] sm:right-6 sm:top-5 sm:w-[212px] sm:px-4`} aria-live="off">
        <div className={`hidden justify-between ${lay === "short" ? "" : "sm:flex"}`}><span className="text-[var(--wi-muted)]">X</span><span ref={xRef} className="tabular-nums">+0000</span></div>
        <div className={`hidden justify-between ${lay === "short" ? "" : "sm:flex"}`}><span className="text-[var(--wi-muted)]">Y</span><span ref={yRef} className="tabular-nums">+0000</span></div>
        <div className="flex justify-between"><span className="text-[var(--wi-muted)]">Zoom</span><span data-zoom-readout="" className="tabular-nums">{p.zoomText}</span></div>
        <div className="flex justify-between"><span className="text-[var(--wi-muted)]"><span className="sm:hidden">Item</span><span className="hidden sm:inline">Artifact</span></span><span className="tabular-nums">{idxText}</span></div>
        <div className={`hidden justify-between ${lay === "short" ? "" : "sm:flex"}`}><span className="text-[var(--wi-muted)]">Mode</span><span>{modeText}</span></div>
      </div>

      {/* ---------- HUD: right column of floating circles ---------- */}
      <div data-hud className="z-10 absolute right-3 top-[132px] flex flex-col gap-2.5 sm:right-6 sm:top-1/2 sm:-translate-y-1/2" role="group" aria-label="View controls">
        <CircleBtn label="Zoom in (+)" onClick={() => zoomBy(1.4)}>
          <path d="M8 2.5v11M2.5 8h11" />
        </CircleBtn>
        <CircleBtn label="Zoom out (−)" onClick={() => zoomBy(1 / 1.4)}>
          <path d="M2.5 8h11" />
        </CircleBtn>
        {!(lay === "sheet" && sel !== null) && <>
        <CircleBtn label="Show everything (0)" onClick={() => { setTouring(false); overview(); }}>
          <path d="M2 5.5V2h3.5M10.5 2H14v3.5M14 10.5V14h-3.5M5.5 14H2v-3.5" />
        </CircleBtn>
        <CircleBtn label="Coordinate grid" pressed={overlay} onClick={() => setOverlay(!overlay)}>
          <path d="M5.5 1.5v13M10.5 1.5v13M1.5 5.5h13M1.5 10.5h13" />
        </CircleBtn>
        <span className="sm:hidden">
          <CircleBtn label="Image credits" onClick={p.onCredits}>
            <circle cx="8" cy="8" r="6" /><path d="M10 6.2a2.6 2.6 0 1 0 0 3.6" />
          </CircleBtn>
        </span>
        </>}
      </div>

      {/* ---------- note panel ---------- */}
      {a && sel !== null && (
        <aside
          data-hud
          key={a.id}
          className={`${s.glass} ${s.panelIn} wi-note z-20 absolute overflow-y-auto ${
            lay === "sheet" ? "inset-x-3 bottom-[76px] mx-auto max-h-[44dvh] max-w-[600px] p-4"
            : lay === "short" ? "bottom-[64px] left-3 top-[100px] w-[320px] p-4"
            : "left-6 top-[168px] max-h-[calc(100dvh-280px)] w-[372px] p-5"}`}
          aria-live="polite"
          aria-label={`Note for artifact ${sel + 1}`}
        >
          <Note a={a} i={sel} />
          <div className="mt-4 flex items-center gap-2 border-t border-[var(--wi-rime)] pt-3">
            <CircleBtn small label="Previous artifact (←)" onClick={() => { setTouring(false); select((sel - 1 + N) % N, { focus: true }); }}>
              <path d="M10 3 5 8l5 5" />
            </CircleBtn>
            <CircleBtn small label="Next artifact (→)" onClick={() => { setTouring(false); select((sel + 1) % N, { focus: true }); }}>
              <path d="m6 3 5 5-5 5" />
            </CircleBtn>
            <span className="ml-1 text-[10.5px] font-light uppercase tracking-[0.1em] text-[var(--wi-muted)]">{touring ? "touring" : "← → to step"}</span>
            <span className="ml-auto" />
            <CircleBtn small label="Close note (Esc)" onClick={() => { setTouring(false); const i = sel; setSel(null); cardRefs.current[i]?.focus({ preventScroll: true }); }}>
              <path d="m4 4 8 8M12 4l-8 8" />
            </CircleBtn>
          </div>
        </aside>
      )}

      {/* ---------- first-run hint ---------- */}
      <div
        className={`${s.hint} z-10 pointer-events-none absolute inset-x-0 bottom-[84px] text-center text-[11px] font-light uppercase tracking-[0.16em] text-[var(--wi-ink)] sm:bottom-[92px]`}
        style={{ opacity: p.touched || sel !== null ? 0 : 1 }}
        aria-hidden="true"
      >
        <span className={`${s.glass} inline-flex items-center gap-2.5 px-3 py-2`}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 1.5v13M1.5 8h13M5.5 4 8 1.5 10.5 4M5.5 12 8 14.5 10.5 12M4 5.5 1.5 8 4 10.5M12 5.5 14.5 8 12 10.5" /></svg>
          <span className="whitespace-nowrap">{coarse ? "Drag · pinch · tap a card" : "Drag to pan · scroll to zoom · click any artifact"}</span>
        </span>
      </div>

      {/* ---------- bottom: credits, primary tour pill, grid ---------- */}
      <div data-hud className="pointer-events-none z-10 absolute inset-x-3 bottom-3 flex items-end [&_button]:pointer-events-auto justify-between gap-2 sm:inset-x-6 sm:bottom-5">
        <div className="hidden flex-col items-start gap-1 sm:flex">
          <button type="button" className={`${s.glass} ${s.textBtn}`} onClick={p.onCredits}>Image credits</button>
          <span className={`pl-1 text-[10.5px] font-light uppercase tracking-[0.1em] text-[var(--wi-muted)] ${lay === "short" ? "hidden" : ""}`}>Tab / ← → step · + − zoom · Esc close</span>
        </div>
        <div className="flex flex-1 items-center justify-center gap-2 sm:absolute sm:inset-x-0 sm:bottom-0 sm:mx-auto sm:w-fit sm:flex-none">
          <button type="button" className={s.pill} onClick={startTour} aria-pressed={touring} aria-label={touring ? `Pause guided tour, stop ${(sel ?? 0) + 1} of ${N}` : `Start guided tour${sel !== null ? ` from ${sel + 1}` : ""}, ${N} stops`}>
            {touring ? (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2v8M9 2v8" stroke="currentColor" strokeWidth="2" /></svg>
                <span><span className="hidden sm:inline">Pause tour · </span>{pad((sel ?? 0) + 1)} / {N}</span>
                {!reduced && <span key={`${tourStep}`} className={s.progress} style={{ animationDuration: `${DWELL + 1200}ms` }} />}
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5 10.5 6 3 10.5Z" fill="currentColor" /></svg>
                <span className="whitespace-nowrap">{sel !== null ? `Tour from ${pad(sel + 1)}` : <>Guided tour<span className="hidden lg:inline"> · {N} stops</span></>}</span>
              </>
            )}
          </button>
          <button type="button" className={`${s.glass} ${s.textBtn} wi-seg rounded-full`} aria-pressed={!touring} onClick={() => setTouring(false)}>
            <span className="wi-segDot" aria-hidden="true" /><span className="whitespace-nowrap"><span className="hidden lg:inline">Free </span>Explore</span>
          </button>
                  </div>
        <button type="button" className={`${s.glass} ${s.textBtn} hidden sm:inline-flex sm:items-center sm:gap-2`} onClick={p.onGrid}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" fill="currentColor"><rect x="0" y="0" width="5" height="5" /><rect x="7" y="0" width="5" height="5" /><rect x="0" y="7" width="5" height="5" /><rect x="7" y="7" width="5" height="5" /></svg>
          View as grid
        </button>
      </div>
    </div>
  );
}

function CircleBtn({ label, onClick, pressed, small, children }: { label: string; onClick: () => void; pressed?: boolean; small?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" className={s.circle} style={small ? { width: 36, height: 36 } : undefined} aria-label={label} title={label} aria-pressed={pressed} onClick={onClick}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
    </button>
  );
}

function Note({ a, i }: { a: Artifact; i: number }) {
  const row = (k: string, v: string) => (
    <div className="grid grid-cols-1 gap-0.5 min-[360px]:grid-cols-[52px_1fr] min-[360px]:gap-3">
      <dt className="pt-[3px] text-[10.5px] font-light uppercase tracking-[0.12em] text-[var(--wi-muted)]">{k}</dt>
      <dd className="text-[13px] leading-[1.6] text-[var(--wi-ink)]">{v}</dd>
    </div>
  );
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] font-light uppercase tracking-[0.12em] text-[var(--wi-muted)]">
        <span className="font-[family-name:var(--wi-display)] text-[13px] tracking-[0.04em] text-[var(--wi-ink)]">{pad(i + 1)}</span>
        <span>/ {N} · {KIND_LABEL[a.kind]}</span>
        <span className="ml-auto text-[var(--wi-ink)]">{a.generated ? "✦ generated" : "collected"}</span>
      </div>
      <h2 className="mt-2.5 text-[15px] font-medium leading-snug text-[var(--wi-ink)]">{a.title}</h2>
      <dl className="mt-3.5 space-y-2.5">
        {row("Take", a.take)}
        {row("Where", a.where)}
        {row("Leave", a.leave)}
      </dl>
      {a.credit && (
        <p className="mt-3.5 text-[11px] font-light leading-relaxed text-[var(--wi-muted)]">
          {a.creditUrl ? <a href={a.creditUrl} className={s.link} target="_blank" rel="noreferrer">{a.credit}</a> : a.credit}
        </p>
      )}
    </>
  );
}

/* ====================================================================== */
/* Grid fallback: every artifact at once, plain mosaic                     */
/* ====================================================================== */

function Scaled({ w, h, children }: { w: number; h: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.6);
  useLayoutEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() => setK(el.clientWidth / w));
    ro.observe(el);
    return () => ro.disconnect();
  }, [w]);
  return (
    <div ref={ref} className="relative w-full overflow-hidden" style={{ height: h * k }}>
      <div style={{ width: w, height: h, transform: `scale(${k})`, transformOrigin: "0 0" }}>{children}</div>
    </div>
  );
}

function Grid({ data, reduced, onField, onCredits }: { data: BoardData; reduced: boolean; onField: () => void; onCredits: () => void }) {
  const [active, setActive] = useState<number | null>(null);
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div className="min-h-dvh px-4 pb-24 pt-5 sm:px-8 lg:px-12">
      <header className="flex flex-wrap items-center gap-2">
        <Link href="/" className={`${s.glass} ${s.textBtn} inline-flex items-center`}>← Hub</Link>
        <button type="button" className={`${s.glass} ${s.textBtn}`} onClick={onField}>Back to the field</button>
        <button type="button" className={`${s.glass} ${s.textBtn}`} onClick={onCredits}>Image credits</button>
      </header>
      <div className="mt-12 max-w-[920px]">
        <p className="text-[11px] font-light uppercase tracking-[0.16em] text-[var(--wi-muted)]">Mood board · white-immersion · grid view</p>
        <h1 className="mt-3 font-[family-name:var(--wi-display)] text-[28px] leading-[1.15] tracking-[0.03em] sm:text-[44px]">{MOOD}</h1>
        <p className="mt-4 text-[14px] leading-relaxed">{COUNT_LINE}.</p>
        <p className="text-[13px] text-[var(--wi-muted)]">✦ generated by your agent ({GEN} of {N}) · {N - GEN} collected</p>
      </div>
      <ol className="mt-12 columns-1 gap-x-6 sm:columns-2 lg:columns-3 2xl:columns-4">
        {ARTIFACTS.map((a, i) => (
          <li key={a.id} className="mb-12 break-inside-avoid" onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
            <div className={s.gridCard}>
              {a.src ? (
                <Image src={a.src} alt={a.alt ?? ""} width={a.imgW!} height={a.imgH!} sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw" className="block h-auto w-full" />
              ) : (
                <Scaled w={a.w} h={a.h}><Generated k={a.gen!} active={active === i} reduced={reduced} data={data} w={a.w} h={a.h} /></Scaled>
              )}
            </div>
            <div className="mt-4"><Note a={a} i={i} /></div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ====================================================================== */

function Credits({ refEl }: { refEl: React.RefObject<HTMLDialogElement | null> }) {
  const collected = ARTIFACTS.map((a, i) => ({ a, i })).filter(({ a }) => a.credit);
  return (
    <dialog
      ref={refEl}
      className={`${s.glass} m-auto max-h-[86dvh] w-[min(640px,calc(100vw-24px))] overflow-y-auto bg-white/95 p-0 text-[var(--wi-ink)] backdrop:bg-[rgba(244,246,248,0.7)] backdrop:backdrop-blur-sm`}
      aria-labelledby="wi-credits-title"
      onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
    >
      <div className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <h2 id="wi-credits-title" className="font-[family-name:var(--wi-display)] text-[17px] tracking-[0.04em]">IMAGE CREDITS</h2>
          <form method="dialog"><button className={s.circle} aria-label="Close credits" style={{ width: 36, height: 36 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
          </button></form>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-[var(--wi-muted)]">
          {collected.length} collected artifacts. NASA images are public domain. Screenshot crops are used for study, via the sites named. The other {N - collected.length} artifacts (✦) were generated in code from our own data.
        </p>
        <ol className="mt-5 divide-y divide-[var(--wi-rime)] border-y border-[var(--wi-rime)]">
          {collected.map(({ a, i }) => (
            <li key={a.id} className="grid grid-cols-[32px_1fr] gap-2 py-2.5 text-[12px] leading-relaxed">
              <span className="text-[var(--wi-muted)]">{pad(i + 1)}</span>
              <span><span className="text-[var(--wi-ink)]">{a.title}</span><br />
                <a className={`${s.link} text-[var(--wi-muted)]`} href={a.creditUrl} target="_blank" rel="noreferrer">{a.credit}</a></span>
            </li>
          ))}
        </ol>
      </div>
    </dialog>
  );
}
