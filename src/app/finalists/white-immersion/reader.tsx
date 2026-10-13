"use client";
// The report viewer: the paper's 11 pages float in a second white field. The camera flies between them
// (zoom-out arc), pinch / ⌘-scroll / ± zoom in to read, drag pans, swipe or ← → changes page. No PDF.js.
import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, Icon, Scramble, pad, useReduced } from "./kit";
import { PAGE_CAPTIONS } from "./places";

const NP = 11, PW = 1000, PH = 1294, GAP = 240;
const PDF = "/paper/esa-telemetry-latent-structure.pdf";
const pageX = (i: number) => i * (PW + GAP);
const pageY = (i: number) => (i % 2 ? 46 : -46);
type Cam = { x: number; y: number; z: number };

export function Reader({ page, setPage, onClose }: { page: number; setPage: (p: number) => void; onClose: () => void }) {
  const reduced = useReduced();
  const reducedRef = useRef(reduced); reducedRef.current = reduced;
  const rootRef = useRef<HTMLDivElement>(null), stageRef = useRef<HTMLDivElement>(null), worldRef = useRef<HTMLDivElement>(null), stripRef = useRef<HTMLOListElement>(null);
  const cam = useRef<Cam>({ x: pageX(page - 1), y: 0, z: 0.5 });
  const size = useRef({ w: 1200, h: 800 });
  const anim = useRef(0);
  const opener = useRef<HTMLElement | null>(null);
  const [cur, setCur] = useState(page - 1);
  const curRef = useRef(cur); curRef.current = cur;
  const zRef = useRef<HTMLSpanElement>(null);
  const [leaving, setLeaving] = useState(false);
  const [near, setNear] = useState<boolean[]>(() => Array.from({ length: NP }, (_, i) => Math.abs(i - (page - 1)) <= 1));

  const fitZ = useCallback(() => {
    const { w, h } = size.current;
    const phone = w < 640;
    return Math.min((h - (phone ? 150 : 176)) / PH, (w - (phone ? 24 : 200)) / PW);
  }, []);
  const apply = useCallback(() => {
    const { x, y, z } = cam.current, { w, h } = size.current;
    const top = w < 640 ? 60 : 68, bottom = w < 640 ? 92 : 108; // keep the page centred in the clear band between the HUD rows
    const cy = top + (h - top - bottom) / 2;
    if (worldRef.current) worldRef.current.style.transform = `translate3d(${(w / 2 - x * z).toFixed(2)}px, ${(cy - y * z).toFixed(2)}px, 0) scale(${z.toFixed(4)})`;
    if (zRef.current) zRef.current.textContent = (z / fitZ()).toFixed(2) + "×";
  }, [fitZ]);
  const clamp = useCallback((c: Cam): Cam => {
    const f = fitZ(), z = Math.min(f * 4, Math.max(f * 0.35, c.z));
    return { z, x: Math.min(pageX(NP - 1) + PW, Math.max(-PW * 0.2, c.x)), y: Math.min(PH * 0.6, Math.max(-PH * 0.6, c.y)) };
  }, [fitZ]);
  const target = useCallback((i: number, z?: number): Cam => ({ x: pageX(i) + PW / 2, y: pageY(i), z: z ?? fitZ() }), [fitZ]);
  const fly = useCallback((t: Cam) => {
    cancelAnimationFrame(anim.current);
    const to = clamp(t), from = { ...cam.current };
    if (reducedRef.current) { cam.current = to; apply(); return 0; }
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const dur = Math.min(1500, 700 + dist * 0.12);
    const l0 = Math.log(from.z), l1 = Math.log(to.z);
    const zOut = Math.min(from.z, to.z, size.current.w / (dist * 1.1 + PW * 1.3));
    const bump = Math.max(0, (l0 + l1) / 2 - Math.log(zOut)), t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      cam.current = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, z: Math.exp(l0 + (l1 - l0) * e - bump * Math.sin(Math.PI * e)) };
      apply();
      if (k < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
    return dur;
  }, [apply, clamp]);

  const goPage = useCallback((i: number) => {
    const n = Math.max(0, Math.min(NP - 1, i));
    setCur(n); setPage(n + 1);
    setNear((s) => s.map((v, j) => v || Math.abs(j - n) <= 1));
    return fly(target(n));
  }, [fly, setPage, target]);

  /* open: start zoomed out over the whole stack, then fly to the requested page */
  useEffect(() => {
    if (!opener.current) opener.current = document.activeElement as HTMLElement; // once (strict mode re-runs effects)
    const st = stageRef.current!;
    size.current = { w: st.clientWidth, h: st.clientHeight };
    const i = page - 1;
    cam.current = reducedRef.current ? target(i) : { x: pageX(Math.min(i, NP - 1)) + PW / 2, y: 0, z: fitZ() * 0.32 };
    apply();
    const id = reducedRef.current ? 0 : window.setTimeout(() => fly(target(i)), 120);
    const ro = new ResizeObserver(() => { size.current = { w: st.clientWidth, h: st.clientHeight }; cam.current = target(curRef.current); apply(); });
    ro.observe(st);
    st.focus({ preventScroll: true });
    document.documentElement.style.overflow = "hidden";
    return () => { window.clearTimeout(id); ro.disconnect(); cancelAnimationFrame(anim.current); document.documentElement.style.overflow = ""; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // a deep link while open (e.g. hash change) moves the camera
  useEffect(() => { if (page - 1 !== curRef.current) goPage(page - 1); }, [page, goPage]);

  useEffect(() => {
    const ol = stripRef.current, a = ol?.querySelector<HTMLElement>('[aria-current="true"]');
    if (ol && a) ol.scrollTo({ left: a.offsetLeft - ol.clientWidth / 2 + a.clientWidth / 2, behavior: reduced ? "auto" : "smooth" });
  }, [cur, reduced]);

  const close = useCallback(() => {
    const done = () => { onClose(); opener.current?.focus({ preventScroll: true }); };
    if (reducedRef.current) { done(); return; }
    setLeaving(true); window.setTimeout(done, 340);
  }, [onClose]);

  const zoomAt = useCallback((sx: number, sy: number, nz: number) => {
    const { w, h } = size.current, c = cam.current;
    const top = w < 640 ? 60 : 68, bottom = w < 640 ? 92 : 108, cy = top + (h - top - bottom) / 2;
    const wx = c.x + (sx - w / 2) / c.z, wy = c.y + (sy - cy) / c.z;
    const t = clamp({ ...c, z: nz });
    cam.current = clamp({ x: wx - (sx - w / 2) / t.z, y: wy - (sy - cy) / t.z, z: t.z });
    apply();
  }, [apply, clamp]);
  const zoomBy = (k: number) => { const c = cam.current; fly({ ...c, z: c.z * k }); };

  /* pointer: drag pans (snaps to a page at fit zoom = swipe), pinch zooms, double-tap toggles 2× */
  useEffect(() => {
    const st = stageRef.current!;
    const pts = new Map<number, { x: number; y: number }>();
    let start = { x: 0, y: 0, t: 0 }, prev = { x: 0, y: 0 }, pinch0 = 0, z0 = 1, moved = false, lastTap = 0;
    const atFit = () => cam.current.z <= fitZ() * 1.04;
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("button, a")) return;
      cancelAnimationFrame(anim.current);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) { start = { x: e.clientX, y: e.clientY, t: performance.now() }; prev = { x: e.clientX, y: e.clientY }; moved = false; }
      if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); z0 = cam.current.z; moved = true; }
    };
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const r = st.getBoundingClientRect();
      if (pts.size === 2) { const [a, b] = [...pts.values()]; zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, z0 * (Math.hypot(a.x - b.x, a.y - b.y) / (pinch0 || 1))); return; }
      if (!moved && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6) return;
      if (!moved) { moved = true; try { st.setPointerCapture(e.pointerId); } catch {} st.dataset.drag = "true"; }
      const c = cam.current;
      cam.current = clamp({ ...c, x: c.x - (e.clientX - prev.x) / c.z, y: atFit() ? c.y : c.y - (e.clientY - prev.y) / c.z });
      prev = { x: e.clientX, y: e.clientY };
      apply();
    };
    const up = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      st.dataset.drag = "false";
      if (pts.size > 0) return;
      const dx = e.clientX - start.x, dt = performance.now() - start.t;
      if (!moved) {
        // double tap / double click: zoom 2× at the point, or back to fit
        const now = performance.now();
        if (now - lastTap < 320) { const r = st.getBoundingClientRect(); if (atFit()) { zoomAt(e.clientX - r.left, e.clientY - r.top, fitZ() * 2); } else fly(target(curRef.current)); lastTap = 0; }
        else lastTap = now;
        return;
      }
      if (atFit()) {
        // swipe: a quick flick or a drag past a third of a page changes page; otherwise settle back
        const flick = Math.abs(dx) > 40 && dt < 350;
        const passed = Math.abs(dx) / cam.current.z > PW * 0.33;
        if (flick || passed) goPage(curRef.current + (dx < 0 ? 1 : -1)); else fly(target(curRef.current));
      } else {
        // zoomed: settle on whichever page is under the centre
        const i = Math.max(0, Math.min(NP - 1, Math.round((cam.current.x - PW / 2) / (PW + GAP))));
        if (i !== curRef.current) { setCur(i); setPage(i + 1); setNear((s) => s.map((v, j) => v || Math.abs(j - i) <= 1)); }
      }
    };
    let cool = 0;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = st.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) { cancelAnimationFrame(anim.current); zoomAt(e.clientX - r.left, e.clientY - r.top, cam.current.z * Math.exp(-e.deltaY * 0.012)); return; }
      if (!atFit()) { const c = cam.current; cam.current = clamp({ ...c, x: c.x + e.deltaX / c.z, y: c.y + e.deltaY / c.z }); apply(); return; }
      const now = performance.now();
      if (now < cool) { cool = Math.max(cool, now + 200); return; }
      const dd = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(dd) > 24) { const dur = goPage(curRef.current + (dd > 0 ? 1 : -1)) || 900; cool = now + dur; }
    };
    st.addEventListener("pointerdown", down); st.addEventListener("pointermove", move);
    st.addEventListener("pointerup", up); st.addEventListener("pointercancel", up);
    st.addEventListener("wheel", wheel, { passive: false });
    return () => {
      st.removeEventListener("pointerdown", down); st.removeEventListener("pointermove", move);
      st.removeEventListener("pointerup", up); st.removeEventListener("pointercancel", up); st.removeEventListener("wheel", wheel);
    };
  }, [apply, clamp, fitZ, fly, goPage, setPage, target, zoomAt]);

  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (k === "Escape") { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (k === "Tab") {
      const f = [...rootRef.current!.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], [tabindex='0']")];
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      return;
    }
    const onBtn = (e.target as HTMLElement).closest("button, a");
    if (k === "ArrowRight" || k === "PageDown" || (k === " " && !onBtn)) { e.preventDefault(); goPage(cur + 1); }
    else if (k === "ArrowLeft" || k === "PageUp") { e.preventDefault(); goPage(cur - 1); }
    else if (k === "Home") { e.preventDefault(); goPage(0); }
    else if (k === "End") { e.preventDefault(); goPage(NP - 1); }
    else if (k === "+" || k === "=") { e.preventDefault(); zoomBy(1.4); }
    else if (k === "-" || k === "_") { e.preventDefault(); zoomBy(1 / 1.4); }
    else if (k === "0") { e.preventDefault(); fly(target(cur)); }
    else if ((k === "ArrowUp" || k === "ArrowDown") && cam.current.z > fitZ() * 1.04) { e.preventDefault(); const c = cam.current; fly({ ...c, y: c.y + (k === "ArrowDown" ? 220 : -220) }); }
  };

  return (
    <div ref={rootRef} className="wiv-reader wiv-root" role="dialog" aria-modal="true" aria-labelledby="wiv-reader-title" data-leaving={leaving} onKeyDown={onKey}>
      <div ref={stageRef} className="wiv-readerStage" tabIndex={0} aria-roledescription="page viewer"
        aria-label={`Page ${cur + 1} of ${NP}: ${PAGE_CAPTIONS[cur]}. Left and right arrows change page, plus and minus zoom, 0 fits, Escape closes.`}>
        <div ref={worldRef} className="wiv-pageWorld">
          {PAGE_CAPTIONS.map((cap, i) => (
            <div key={i} className="wiv-page" data-cur={i === cur} style={{ left: pageX(i), top: pageY(i) - PH / 2 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/paper/pages/thumb-${pad(i + 1)}.jpg`} alt="" draggable={false} decoding="async" />
              {near[i] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/paper/pages/p-${pad(i + 1)}.jpg`} alt={`Page ${i + 1} of the paper: ${cap}`} draggable={false} decoding="async" />
              )}
              <span className="wiv-label absolute -bottom-9 left-0 text-[22px] tracking-[0.12em]" aria-hidden="true">P.{pad(i + 1)} · {cap}</span>
            </div>
          ))}
        </div>
      </div>

      {/* HUD: top */}
      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-3 sm:inset-x-6 sm:top-5">
        <div className="wiv-glass pointer-events-auto min-w-0 px-3 py-2">
          <p id="wiv-reader-title" className="wiv-stamp truncate text-[11px]">The paper<span className="hidden text-[var(--muted)] md:inline"> · Uncovering Latent Structure in ESA Satellite Telemetry</span></p>
          <p className="wiv-hud wiv-tick mt-0.5 truncate text-[var(--muted)]"><span className="text-[var(--ink)]">Page {pad(cur + 1)} / {NP}</span> · <Scramble text={PAGE_CAPTIONS[cur]} ms={450} /><span className="hidden sm:inline"> · zoom <span ref={zRef}>1.00×</span></span></p>
        </div>
        <div className="pointer-events-auto"><Circle label="Close the paper (Esc)" icon="close" onClick={close} /></div>
      </div>

      {/* side controls */}
      <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 flex-col gap-2.5 sm:right-6 sm:flex" role="group" aria-label="Zoom">
        <Circle label="Zoom in (+)" icon="plus" onClick={() => zoomBy(1.4)} />
        <Circle label="Zoom out (−)" icon="minus" onClick={() => zoomBy(1 / 1.4)} />
        <Circle label="Fit the page (0)" icon="fit" onClick={() => fly(target(cur))} />
      </div>
      <div className="absolute left-3 top-1/2 hidden -translate-y-1/2 sm:left-6 sm:block">
        <Circle label="Previous page (←)" icon="left" onClick={() => goPage(cur - 1)} disabled={cur === 0} />
      </div>
      <div className="absolute right-[84px] top-1/2 hidden -translate-y-1/2 sm:block">
        <Circle label="Next page (→)" icon="right" onClick={() => goPage(cur + 1)} disabled={cur === NP - 1} />
      </div>

      {/* bottom: strip + the one cyan thing in this view */}
      <div className="absolute inset-x-3 bottom-3 flex items-end gap-2 sm:inset-x-6 sm:bottom-5 sm:gap-3">
        <div className="flex items-center gap-1 sm:hidden">
          <Circle small label="Previous page" icon="left" onClick={() => goPage(cur - 1)} disabled={cur === 0} />
          <Circle small label="Next page" icon="right" onClick={() => goPage(cur + 1)} disabled={cur === NP - 1} />
        </div>
        <ol ref={stripRef} className="wiv-strip wiv-glass min-w-0 flex-1 sm:mx-auto sm:max-w-[640px]" aria-label="Pages">
          {PAGE_CAPTIONS.map((cap, i) => (
            <li key={i} className="flex-none">
              <button type="button" className="wiv-stripBtn" aria-current={i === cur ? "true" : undefined} aria-label={`Page ${i + 1}: ${cap}`} title={`p.${i + 1} · ${cap}`} onClick={() => goPage(i)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/paper/pages/thumb-${pad(i + 1)}.jpg`} alt="" loading="lazy" draggable={false} />
              </button>
            </li>
          ))}
        </ol>
        <a className="wiv-pill shrink-0 max-sm:min-h-[40px] max-sm:px-4" href={PDF} download>
          <Icon n="down" size={13} /><span>Download<span className="hidden sm:inline"> PDF</span></span>
        </a>
      </div>
      <p className="sr-only" aria-live="polite">Page {cur + 1} of {NP}: {PAGE_CAPTIONS[cur]}</p>
    </div>
  );
}
