"use client";

// The journal reader: the paper's 11 page renders on paper, a thumbnail rail, zoom, keyboard and
// swipe paging, marginal notes that link back into the site, and the Download PDF action.
// Deep links: #paper-5 opens page 5 (every footnote chip on the site is one of these).
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { FOCUS, IconCross, IconStep, MONO, SANS, SERIF, btnIcon, btnPrimary, btnTransport } from "../../design-systems/refined-paper/kit";

export const PDF = "/paper/esa-telemetry-latent-structure.pdf";
export const PAGES = 11;
const pageSrc = (p: number) => `/paper/pages/p-${String(p).padStart(2, "0")}.jpg`;
const thumbSrc = (p: number) => `/paper/pages/thumb-${String(p).padStart(2, "0")}.jpg`;
const RATIO = 1600 / 2071;

/** What each page holds, and where on the site it is argued. */
export const PAGE_NOTES: Record<number, { t: string; back?: { href: string; label: string } }[]> = {
  1: [{ t: "Title, authors and abstract.", back: { href: "#top", label: "The finding" } }],
  2: [{ t: "§1 Introduction and Q1, Q2. Division of labour.", back: { href: "#background", label: "01 Background" } }, { t: "§2 Dataset: channels, subsystems, groups, labels.", back: { href: "#background", label: "01 Background" } }],
  3: [{ t: "§3 Baselines. Figure 1: K-Means PR curve, t-SNE.", back: { href: "#methods", label: "02 What we did" } }, { t: "§4 GMM: PCA-30, K by BIC.", back: { href: "#bic", label: "BIC figure" } }],
  4: [{ t: "§5 The three VAEs.", back: { href: "#methods", label: "02 What we did" } }],
  5: [{ t: "Table 1: every method, both missions.", back: { href: "#table", label: "Table 1" } }, { t: "§6 Results. §7 Conclusions.", back: { href: "#conclusions", label: "04 Conclusions" } }],
  6: [{ t: "References." }],
  7: [{ t: "Figure 3: timeline failure on the longest Mission 1 fault.", back: { href: "#fault", label: "Fault figure" } }],
  8: [{ t: "Figure 4: t-SNE on raw and PCA inputs. Figure 5a: KPCA sweep." }],
  9: [{ t: "Figure 5b: Nyström-KPCA PR curves (0.334, 0.164).", back: { href: "#pr", label: "PR figure" } }],
  10: [{ t: "Figure 6: PCA scatter and PR curves (0.322, 0.317).", back: { href: "#pr", label: "PR figure" } }],
  11: [{ t: "Figure 7: TransformerVAE latent maps, K = 16 and 18.", back: { href: "#results", label: "03 Results" } }],
};

const Ctx = createContext<(p: number) => void>(() => {});
export const useReader = () => useContext(Ctx);

const ZOOMS = [1, 1.5, 2, 3];

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const open = useCallback((p: number) => {
    opener.current = document.activeElement as HTMLElement;
    window.dispatchEvent(new Event("rps-modal"));
    setPage(Math.min(PAGES, Math.max(1, p)));
  }, []);
  // Deep links: #paper-N opens the reader on page N (on load and on hash change).
  useEffect(() => {
    const read = () => {
      const m = location.hash.match(/^#paper-(\d+)$/);
      if (m) setPage(Math.min(PAGES, Math.max(1, +m[1])));
    };
    read();
    addEventListener("hashchange", read);
    return () => removeEventListener("hashchange", read);
  }, []);
  const close = useCallback((to?: string) => {
    setPage(null);
    history.replaceState(null, "", location.pathname + location.search + (to ?? ""));
    requestAnimationFrame(() => {
      if (to) {
        const el = document.querySelector<HTMLElement>(to);
        el?.scrollIntoView({ block: "start" });
        el?.focus({ preventScroll: true });
      } else opener.current?.focus();
    });
  }, []);
  return (
    <Ctx.Provider value={open}>
      {children}
      {page != null && <Reader page={page} setPage={setPage} onClose={close} />}
    </Ctx.Provider>
  );
}

/** Footnote chip: "[Table 1 · p. 5]". Opens the reader on that page; it is a real #paper-N link. */
export function PageRef({ p, children, className = "" }: { p: number; children?: ReactNode; className?: string }) {
  const open = useReader();
  return (
    <a
      href={`#paper-${p}`}
      onClick={(e) => { e.preventDefault(); open(p); }}
      aria-label={`${children ? `${typeof children === "string" ? children : "Source"}, ` : ""}page ${p} of the paper (opens the reader)`}
      className={`${SANS} ${FOCUS} rps-fn inline-flex items-center gap-1 rounded-[2px] px-1 align-baseline text-[12px] font-medium whitespace-nowrap text-[var(--ink)] underline decoration-[var(--rule-strong)] underline-offset-[3px] transition-colors duration-200 hover:bg-[var(--parchment)] hover:decoration-[var(--ink)] active:bg-[var(--rule)] ${className}`}
    >
      [{children ? <>{children}<span aria-hidden className="text-[var(--muted)]">·</span></> : null}p. {p}]
    </a>
  );
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])';

function Reader({ page, setPage, onClose }: { page: number; setPage: (p: number) => void; onClose: (to?: string) => void }) {
  const [zi, setZi] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const [fit, setFit] = useState({ w: 600, h: 776 });
  const box = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLOListElement>(null);
  const swipe = useRef<{ x: number; y: number; sl: number; st: number; id: number; drag: boolean } | null>(null);
  const zoom = ZOOMS[zi];

  const go = useCallback((p: number) => {
    const n = Math.min(PAGES, Math.max(1, p));
    if (n === page) return;
    setDir(n > page ? "next" : "prev");
    setZi(0);
    setPage(n);
  }, [page, setPage]);

  // Keep the URL on the page being read, so any page can be shared.
  useEffect(() => { history.replaceState(null, "", `#paper-${page}`); }, [page]);

  // Scroll lock, first focus, preload neighbours.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    box.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => { html.style.overflow = prev; };
  }, []);
  useEffect(() => {
    [page - 1, page + 1].filter((p) => p >= 1 && p <= PAGES).forEach((p) => { const i = new Image(); i.src = pageSrc(p); });
    rail.current?.querySelector<HTMLElement>(`[data-p="${page}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [page]);

  // Fit the page to the stage (whole page visible at 100%).
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const set = () => {
      const pad = el.clientWidth < 640 ? 16 : 40;
      const w = el.clientWidth - pad * 2, h = el.clientHeight - pad * 2;
      // Short, wide stages (phones held sideways) fit the width and scroll; everything else shows the whole page.
      const fw = h < 520 && w > h ? Math.min(w, 980) : Math.min(w, h * RATIO, 980);
      setFit({ w: Math.max(200, fw), h: Math.max(200, fw) / RATIO });
    };
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const setZoom = (n: number) => {
    const el = stage.current;
    const nz = Math.min(ZOOMS.length - 1, Math.max(0, n));
    if (!el || nz === zi) return;
    // Keep the centre of the view where it was.
    const cx = (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth, cy = (el.scrollTop + el.clientHeight / 2) / el.scrollHeight;
    setZi(nz);
    requestAnimationFrame(() => { el.scrollLeft = cx * el.scrollWidth - el.clientWidth / 2; el.scrollTop = cy * el.scrollHeight - el.clientHeight / 2; });
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
    if (e.key === "Tab" && box.current) {
      const f = Array.from(box.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((x) => x.offsetParent !== null);
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      return;
    }
    const t = e.target as HTMLElement;
    if (t.getAttribute("role") === "slider") return;
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(page + 1); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(page - 1); }
    else if (e.key === "Home") { e.preventDefault(); go(1); }
    else if (e.key === "End") { e.preventDefault(); go(PAGES); }
    else if (e.key === "+" || e.key === "=") { e.preventDefault(); setZoom(zi + 1); }
    else if (e.key === "-" || e.key === "_") { e.preventDefault(); setZoom(zi - 1); }
    else if (e.key === "0") { e.preventDefault(); setZoom(0); }
  };

  // Swipe to turn at 100%; drag to pan when zoomed (touch pans natively).
  const down = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const el = stage.current!;
    swipe.current = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop, id: e.pointerId, drag: zoom > 1 && e.pointerType === "mouse" };
    if (swipe.current.drag) el.setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    const s = swipe.current;
    if (!s || !s.drag) return;
    const el = stage.current!;
    el.scrollLeft = s.sl - (e.clientX - s.x);
    el.scrollTop = s.st - (e.clientY - s.y);
  };
  const up = (e: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || s.drag || zoom > 1) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) go(page + (dx < 0 ? 1 : -1));
  };

  const notes = PAGE_NOTES[page] ?? [];
  const btnZoom = `${SANS} ${FOCUS} grid size-9 place-items-center rounded-[3px] border border-[var(--rule-strong)] bg-[var(--paper)] text-[15px] text-[var(--ink)] transition-colors duration-200 hover:border-[var(--ink)] hover:bg-[var(--mount)] active:bg-[var(--rule)] disabled:cursor-not-allowed disabled:border-dashed disabled:text-[var(--muted)] disabled:hover:bg-[var(--paper)] disabled:hover:border-[var(--rule-strong)]`;

  return (
    <div ref={box} role="dialog" aria-modal="true" aria-label={`The paper, page ${page} of ${PAGES}`} onKeyDown={onKey}
      className="rps-grain rpd-fade fixed inset-0 z-[80] flex flex-col text-[var(--ink)]">
      {/* masthead */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--rule-strong)] bg-[var(--paper)] px-3 sm:gap-4 sm:px-5">
        <p className={`${MONO} shrink-0 text-[12px] text-[var(--muted)]`} aria-live="polite">
          p. <span className="text-[var(--ink)]">{String(page).padStart(2, "0")}</span> / {PAGES}
        </p>
        <p className={`${SERIF} hidden min-w-0 flex-1 truncate text-[16px] md:block`}>
          Uncovering Latent Structure in ESA Satellite Telemetry <span className={`${SANS} text-[13px] text-[var(--muted)]`}>· Madhogarhia &amp; Watkins, 2026</span>
        </p>
        <span className="flex-1 md:hidden" />
        <div className="hidden items-center gap-1.5 sm:flex" role="group" aria-label="Zoom">
          <button type="button" className={btnZoom} onClick={() => setZoom(zi - 1)} disabled={zi === 0} aria-label="Zoom out">−</button>
          <button type="button" onClick={() => setZoom(0)} className={`${MONO} ${FOCUS} h-9 w-14 rounded-[3px] text-[12px] transition-colors duration-200 hover:bg-[var(--mount)] active:bg-[var(--rule)]`} aria-label={`Zoom ${zoom * 100} percent. Reset to fit`}>{zoom * 100}%</button>
          <button type="button" className={btnZoom} onClick={() => setZoom(zi + 1)} disabled={zi === ZOOMS.length - 1} aria-label="Zoom in">+</button>
        </div>
        <a href={PDF} download className={`${btnPrimary} h-9 min-h-9 px-3 sm:px-4`}>
          <svg aria-hidden width="12" height="12" viewBox="0 0 12 12"><path d="M6 1.5v6.5M3 5.5 6 8.5l3-3M2 10.5h8" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
          Download PDF
        </a>
        <button type="button" data-autofocus onClick={() => onClose()} className={btnIcon} aria-label="Close the reader (Esc)"><IconCross size={14} /></button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* thumbnail rail: vertical on tablets and up, a strip along the bottom on phones */}
        <nav aria-label="Pages" className="order-2 shrink-0 border-t border-[var(--rule-strong)] bg-[var(--paper)] md:order-1 md:w-[118px] md:border-t-0 md:border-r">
          <ol ref={rail} className="rps-noscroll flex gap-2.5 overflow-x-auto px-3 py-2.5 md:h-full md:flex-col md:gap-3 md:overflow-x-hidden md:overflow-y-auto md:px-4 md:py-4">
            {Array.from({ length: PAGES }, (_, k) => k + 1).map((p) => (
              <li key={p} className="shrink-0">
                <button type="button" data-p={p} onClick={() => go(p)} aria-current={p === page ? "page" : undefined} aria-label={`Page ${p}`}
                  className={`${FOCUS} group block rounded-[2px] p-1 transition-colors duration-200 hover:bg-[var(--parchment)] active:bg-[var(--rule)]`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbSrc(p)} alt="" width={64} height={83} loading="lazy" className={`block h-[58px] w-auto bg-white md:h-auto md:w-[76px] ${p === page ? "outline-[1.5px] outline-[var(--ink)] outline-solid" : "outline outline-1 outline-[var(--rule-strong)] opacity-80 group-hover:opacity-100"}`} />
                  <span className={`${MONO} mt-1 block text-center text-[11px] ${p === page ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}>{p}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        {/* stage */}
        <div className="relative order-1 min-h-0 min-w-0 flex-1 md:order-2">
          <div ref={stage} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => (swipe.current = null)}
            onDoubleClick={() => setZoom(zi === 0 ? 2 : 0)}
            className={`rpd-scroll absolute inset-0 overflow-auto ${zoom > 1 ? "cursor-grab touch-auto active:cursor-grabbing" : "touch-pan-y"}`}
            tabIndex={0} role="region" aria-label={`Page ${page}. Arrow keys turn pages; + and − zoom.`}>
            <div className="grid min-h-full min-w-full place-items-center p-4 sm:p-10" style={{ width: zoom > 1 ? fit.w * zoom + 80 : undefined }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={page} src={pageSrc(page)} alt={`Page ${page} of the paper. ${notes.map((n) => n.t).join(" ")}`} draggable={false}
                width={fit.w * zoom} height={fit.h * zoom} style={{ width: fit.w * zoom, height: fit.h * zoom }}
                className={`rps-sheet rps-turn-${dir} block max-w-none select-none`} />
            </div>
          </div>
          <button type="button" onClick={() => go(page - 1)} disabled={page === 1} aria-label="Previous page" className={`${btnTransport} absolute top-1/2 left-3 hidden -translate-y-1/2 bg-[var(--paper)] lg:grid`}><IconStep back /></button>
          <button type="button" onClick={() => go(page + 1)} disabled={page === PAGES} aria-label="Next page" className={`${btnTransport} absolute top-1/2 right-3 hidden -translate-y-1/2 bg-[var(--paper)] lg:grid`}><IconStep /></button>
        </div>

        {/* marginal notes: what this page backs on the site */}
        <aside aria-label="On this page" className="order-3 hidden w-[260px] shrink-0 border-l border-[var(--rule-strong)] bg-[var(--paper)] px-5 py-6 xl:block">
          <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>On page {page}</p>
          <ol className="mt-3 space-y-4">
            {notes.map((n, k) => (
              <li key={k} className="border-t border-[var(--rule)] pt-3">
                <p className={`${SERIF} text-[15.5px] leading-[1.5]`}>{n.t}</p>
                {n.back && (
                  <a href={n.back.href} onClick={(e) => { e.preventDefault(); onClose(n.back!.href); }} className={`${SANS} ${FOCUS} mt-1.5 inline-flex items-center gap-1 rounded-[2px] text-[12.5px] font-medium text-[var(--ink)] underline decoration-[var(--rule-strong)] underline-offset-4 transition-colors duration-200 hover:decoration-[var(--ink)] active:text-[var(--muted)]`}>
                    <span aria-hidden>↩</span> Back to {n.back.label}
                  </a>
                )}
              </li>
            ))}
          </ol>
          <p className={`${SANS} mt-8 border-t border-[var(--rule)] pt-3 text-[12px] leading-[1.5] text-[var(--muted)]`}>← → turn pages · + − zoom · double-click to zoom · Esc closes</p>
        </aside>
      </div>

      {/* phone + tablet footer: paging and the page note */}
      <div className="order-last flex items-center gap-3 border-t border-[var(--rule)] bg-[var(--paper)] px-3 py-2 lg:hidden">
        <button type="button" onClick={() => go(page - 1)} disabled={page === 1} aria-label="Previous page" className={btnTransport}><IconStep back /></button>
        <p className={`${SANS} min-w-0 flex-1 text-center text-[12.5px] leading-[1.35] text-[var(--muted)]`}>
          <span className="line-clamp-2">{notes[0]?.t}</span>
        </p>
        <button type="button" onClick={() => setZoom(zi === 0 ? 2 : 0)} aria-pressed={zi > 0} className={`${btnZoom} w-auto px-2.5 text-[12.5px] font-medium sm:hidden`}>{zi > 0 ? "Fit" : "Zoom"}</button>
        <button type="button" onClick={() => go(page + 1)} disabled={page === PAGES} aria-label="Next page" className={btnTransport}><IconStep /></button>
      </div>
    </div>
  );
}
