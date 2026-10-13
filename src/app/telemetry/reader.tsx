"use client";

// The paper as a mission instrument: each page is a hairline panel on the void, with a
// dot-matrix counter, a page strip, zoom, keyboard / swipe paging and deep links (#paper-N).
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { BTN, Br, DOT, FR, LABEL, MONO, TRANS } from "../design-systems/intense-space/ui";

export const PDF = "/paper/esa-telemetry-latent-structure.pdf";
export const N_PAGES = 11;
export const PAGES: { n: number; t: string; key?: boolean }[] = [
  { n: 1, t: "Title · abstract · introduction" },
  { n: 2, t: "Dataset · baseline methods" },
  { n: 3, t: "Fig. 1 · K-Means PR curve + t-SNE", key: true },
  { n: 4, t: "GMM · the three VAEs" },
  { n: 5, t: "Table 1 · all 13 results", key: true },
  { n: 6, t: "References" },
  { n: 7, t: "Fig. 3 · timeline failure", key: true },
  { n: 8, t: "Fig. 4 · t-SNE, raw vs PCA" },
  { n: 9, t: "Fig. 5 · KPCA PR curves", key: true },
  { n: 10, t: "Fig. 6 · PCA scatter + PR curves" },
  { n: 11, t: "Fig. 7 · latent maps, K = 16 / 18", key: true },
];
const pad = (n: number) => String(n).padStart(2, "0");
const ZOOMS = [1, 1.5, 2, 3];

const Ctx = createContext<(page?: number) => void>(() => {});
export const useReader = () => useContext(Ctx);

/* a deep link from a finding to the page that backs it */
export function PageLink({ page, children }: { page: number; children?: ReactNode }) {
  const open = useReader();
  return (
    <button
      type="button"
      onClick={() => open(page)}
      className={`group ${MONO} ${TRANS} inline-flex min-h-8 items-center rounded-[2px] text-[10px] uppercase tracking-[0.14em] text-(--is-steel) hover:text-(--is-frost) active:opacity-70 ${FR}`}
    >
      <Br>
        {children ?? "Paper"} · p.{page} <span aria-hidden>↗</span>
      </Br>
    </button>
  );
}

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<number | null>(null);
  const open = useCallback((p = 1) => setPage(Math.min(N_PAGES, Math.max(1, p))), []);
  // deep links: /telemetry#paper-5 opens the reader on page 5
  useEffect(() => {
    const read = () => {
      const m = window.location.hash.match(/^#paper-(\d+)$/);
      if (m) setPage(Math.min(N_PAGES, Math.max(1, +m[1])));
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  useEffect(() => {
    if (page === null) return;
    history.replaceState(null, "", `#paper-${page}`);
  }, [page]);
  const close = useCallback(() => {
    setPage(null);
    history.replaceState(null, "", window.location.pathname);
  }, []);
  return (
    <Ctx.Provider value={open}>
      {children}
      {page !== null ? <Reader page={page} setPage={setPage} onClose={close} /> : null}
    </Ctx.Provider>
  );
}

function Reader({ page, setPage, onClose }: { page: number; setPage: (p: number) => void; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLOListElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  // zoom resets to fit on every page change (derived from the page it was set on)
  const [zs, setZs] = useState({ page, zi: 0 });
  const zi = zs.page === page ? zs.zi : 0;
  const setZi = (f: number | ((i: number) => number)) => setZs((x) => ({ page, zi: typeof f === "function" ? f(x.page === page ? x.zi : 0) : f }));
  const [fit, setFit] = useState({ w: 600, h: 776 });
  const z = ZOOMS[zi];
  const info = PAGES[page - 1];
  const go = useCallback((d: number) => setPage(Math.min(N_PAGES, Math.max(1, page + d))), [page, setPage]);

  // fit the page to the stage (both edges), then zoom multiplies that size
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const padX = r.width < 640 ? 24 : 96;
      const padY = r.width < 640 ? 24 : 48;
      const ar = 1600 / 2071;
      const w = Math.min(r.width - padX, (r.height - padY) * ar);
      setFit({ w, h: w / ar });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // reset zoom + scroll on page change, keep the strip's current thumb in view
  useEffect(() => {
    stage.current?.scrollTo({ left: 0, top: 0 });
    const t = strip.current?.children[page - 1] as HTMLElement | undefined;
    t?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [page]);

  // focus trap, Esc, keys, scroll lock, focus return
  useEffect(() => {
    opener.current = document.activeElement as HTMLElement;
    box.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      opener.current?.focus();
    };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return e.preventDefault(), onClose();
      if (e.key === "ArrowRight" || e.key === "PageDown") return e.preventDefault(), go(1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") return e.preventDefault(), go(-1);
      if (e.key === "Home") return e.preventDefault(), setPage(1);
      if (e.key === "End") return e.preventDefault(), setPage(N_PAGES);
      if (e.key === "+" || e.key === "=") return e.preventDefault(), setZi((i) => Math.min(ZOOMS.length - 1, i + 1));
      if (e.key === "-" || e.key === "_") return e.preventDefault(), setZi((i) => Math.max(0, i - 1));
      if (e.key === "0") return e.preventDefault(), setZi(0);
      if (e.key === "Tab" && box.current) {
        const f = [...box.current.querySelectorAll<HTMLElement>("button:not([disabled]),a[href]")];
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, onClose, setPage]);

  // swipe (touch, unzoomed) and drag-to-pan (mouse, zoomed)
  const touch = useRef<{ x: number; y: number } | null>(null);
  const pan = useRef<{ x: number; y: number; l: number; t: number } | null>(null);

  return (
    <div ref={box} role="dialog" aria-modal="true" aria-label={`The paper, page ${page} of ${N_PAGES}`} className="isx-reader fixed inset-0 z-[90] flex flex-col bg-(--is-void)">
      {/* toolbar */}
      <div className="flex items-center gap-2 border-b border-(--is-line) px-2 py-2 sm:gap-3 sm:px-5">
        <p className={`${LABEL} hidden min-w-0 flex-1 truncate text-(--is-steel) md:block`}>
          [ Paper ] <span className="text-(--is-frost)">Uncovering Latent Structure in ESA Satellite Telemetry</span> · Madhogarhia &amp; Watkins
        </p>
        <div className="flex items-center gap-1" role="group" aria-label="Zoom">
          <button type="button" aria-label="Zoom out" disabled={zi === 0} onClick={() => setZi((i) => Math.max(0, i - 1))} className={`${BTN.ghost} min-w-10 text-[14px]`}>
            −
          </button>
          <button type="button" aria-label={`Zoom ${Math.round(z * 100)}%, reset to fit`} onClick={() => setZi(0)} className={`${BTN.ghost} min-w-14`}>
            {Math.round(z * 100)}%
          </button>
          <button type="button" aria-label="Zoom in" disabled={zi === ZOOMS.length - 1} onClick={() => setZi((i) => Math.min(ZOOMS.length - 1, i + 1))} className={`${BTN.ghost} min-w-10 text-[14px]`}>
            +
          </button>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
          <a href={PDF} download aria-label="Download PDF" className={`group ${BTN.primary}`}>
            <span aria-hidden>↓</span> <span className="max-sm:hidden">Download</span> PDF
          </a>
          <button type="button" data-autofocus onClick={onClose} aria-label="Close the paper (Esc)" className={`${BTN.secondary} gap-2`}>
            <span aria-hidden>✕</span>
            <span className="max-sm:hidden">Close · Esc</span>
          </button>
        </div>
      </div>

      {/* stage */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={stage}
          data-zoomed={z > 1}
          className="isx-stage is-regdots absolute inset-0 overflow-auto"
          onTouchStart={(e) => {
            touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          }}
          onTouchEnd={(e) => {
            const s = touch.current;
            touch.current = null;
            if (!s || z > 1) return;
            const dx = e.changedTouches[0].clientX - s.x;
            const dy = e.changedTouches[0].clientY - s.y;
            if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
          }}
          onPointerDown={(e) => {
            if (e.pointerType !== "mouse" || z === 1 || !stage.current) return;
            pan.current = { x: e.clientX, y: e.clientY, l: stage.current.scrollLeft, t: stage.current.scrollTop };
          }}
          onPointerMove={(e) => {
            const p = pan.current;
            if (!p || !stage.current) return;
            stage.current.scrollLeft = p.l - (e.clientX - p.x);
            stage.current.scrollTop = p.t - (e.clientY - p.y);
          }}
          onPointerUp={() => (pan.current = null)}
          onPointerLeave={() => (pan.current = null)}
        >
          <div className="flex min-h-full min-w-full items-center justify-center p-3 sm:px-12 sm:py-6" style={{ width: z > 1 ? fit.w * z + 96 : undefined }}>
            <figure className="is-corners relative shrink-0 border border-(--is-line) p-1.5" style={{ width: fit.w * z + 14 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={page}
                src={`/paper/pages/p-${pad(page)}.jpg`}
                alt={`Page ${page} of the paper: ${info.t}`}
                width={1600}
                height={2071}
                draggable={false}
                onDoubleClick={() => setZi((i) => (i === 0 ? 2 : 0))}
                className="isx-page block h-auto w-full select-none bg-white"
              />
            </figure>
          </div>
        </div>
        <button
          type="button"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => go(-1)}
          className={`${MONO} ${TRANS} absolute left-2 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-[2px] border border-(--is-line) bg-(--is-void)/90 text-[16px] text-(--is-frost) hover:border-(--is-frost) active:bg-(--is-charcoal) disabled:cursor-not-allowed disabled:text-[#5f676e] disabled:hover:border-(--is-line) sm:flex ${FR}`}
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Next page"
          disabled={page === N_PAGES}
          onClick={() => go(1)}
          className={`${MONO} ${TRANS} absolute right-2 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-[2px] border border-(--is-line) bg-(--is-void)/90 text-[16px] text-(--is-frost) hover:border-(--is-frost) active:bg-(--is-charcoal) disabled:cursor-not-allowed disabled:text-[#5f676e] disabled:hover:border-(--is-line) sm:flex ${FR}`}
        >
          →
        </button>
        {/* preload neighbours so paging is instant */}
        <div aria-hidden className="hidden">
          {[page - 1, page + 1].filter((p) => p >= 1 && p <= N_PAGES).map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={p} src={`/paper/pages/p-${pad(p)}.jpg`} alt="" />
          ))}
        </div>
      </div>

      {/* counter + strip */}
      <div className="border-t border-(--is-line) bg-(--is-void)">
        <div className="flex items-end gap-4 px-3 pt-2 sm:px-5">
          <p className="flex items-baseline gap-2" aria-live="polite">
            <span className={`${DOT} text-[34px] font-semibold leading-[0.9] text-(--is-frost) sm:text-[40px]`}>{pad(page)}</span>
            <span className={`${DOT} text-[20px] font-semibold leading-[0.9] text-(--is-steel)`}>/ {N_PAGES}</span>
            <span className="sr-only">Page {page}: {info.t}</span>
          </p>
          <p className={`${LABEL} min-w-0 flex-1 pb-1 text-(--is-frost)`}>
            <span className="text-(--is-steel)">[ p.{page} ]</span> {info.t}
          </p>
          <p className={`${LABEL} hidden pb-1 text-(--is-steel) lg:block`}>← → page · + − zoom · swipe on touch · Esc close</p>
        </div>
        <ol ref={strip} className="isx-strip flex gap-2 overflow-x-auto px-3 py-2.5 sm:px-5" aria-label="Pages">
          {PAGES.map((p) => (
            <li key={p.n} className="shrink-0">
              <button
                type="button"
                onClick={() => setPage(p.n)}
                aria-current={p.n === page ? "page" : undefined}
                aria-label={`Page ${p.n}: ${p.t}`}
                className={`group relative block rounded-[2px] border p-0.5 ${TRANS} ${p.n === page ? "border-(--is-frost)" : "border-(--is-line) hover:border-[#5a6066]"} active:translate-y-px ${FR}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/paper/pages/thumb-${pad(p.n)}.jpg`} alt="" width={320} height={415} loading="lazy" className={`block h-[58px] w-auto ${TRANS} ${p.n === page ? "opacity-100" : "opacity-55 group-hover:opacity-90"} sm:h-[72px]`} />
                <span className={`${MONO} absolute bottom-0.5 left-0.5 bg-(--is-void) px-1 text-[10px] leading-[14px] ${p.n === page ? "text-(--is-frost)" : "text-(--is-steel)"}`}>
                  {pad(p.n)}
                  {p.key ? <span className="text-(--is-frost)"> ◆</span> : null}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
