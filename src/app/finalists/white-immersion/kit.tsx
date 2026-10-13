"use client";
// Shared primitives, copied from the white-immersion design system (kit.tsx) with the wiv- prefix.
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";

export const pad = (n: number, w = 2) => String(n).padStart(w, "0");
export const fmt = (n: number) => n.toLocaleString("en-US");

/* ---------- reduced motion ---------- */
export function useReduced() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const f = () => setR(m.matches);
    f(); m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return r;
}

/* ---------- in view (once) ---------- */
export function useInView<T extends Element>(margin = "0px 0px -15% 0px") {
  const ref = useRef<T>(null);
  const [inView, setIn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIn(true); io.disconnect(); } }, { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return [ref, inView] as const;
}

/* ---------- scramble-in text (Igloo): resolves left to right from glyph noise ---------- */
const GLYPHS = "▖▗▘▙▚▛▜▝▞▟░▒/\\<>=+-01";
export function useScramble(text: string, key: unknown = text, ms = 650) {
  const reduced = useReduced();
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (reduced) { setOut(text); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      const fixed = Math.floor(p * text.length);
      setOut(text.split("").map((ch, i) => (i < fixed || ch === " " || ch === "·" ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join(""));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, key, ms, reduced]);
  return out;
}
export function Scramble({ text, k, ms, className }: { text: string; k?: unknown; ms?: number; className?: string }) {
  const out = useScramble(text, k ?? text, ms);
  return <span className={className} aria-label={text}><span aria-hidden="true">{out}</span></span>;
}

/* ---------- icons: 16px, 1.3 stroke, never emoji ---------- */
const P: Record<string, React.ReactNode> = {
  plus: <path d="M8 2.5v11M2.5 8h11" />,
  minus: <path d="M2.5 8h11" />,
  fit: <path d="M2 5.5V2h3.5M10.5 2H14v3.5M14 10.5V14h-3.5M5.5 14H2v-3.5" />,
  grid: <path d="M5.5 1.5v13M10.5 1.5v13M1.5 5.5h13M1.5 10.5h13" />,
  close: <path d="m4 4 8 8M12 4l-8 8" />,
  menu: <path d="M2 4.5h12M2 8h12M2 11.5h12" />,
  more: <><circle cx="8" cy="3.5" r=".9" fill="currentColor" /><circle cx="8" cy="8" r=".9" fill="currentColor" /><circle cx="8" cy="12.5" r=".9" fill="currentColor" /></>,
  up: <path d="M3.5 10 8 5.5l4.5 4.5" />,
  down: <path d="M3.5 6 8 10.5 12.5 6" />,
  left: <path d="M10 3 5 8l5 5" />,
  right: <path d="m6 3 5 5-5 5" />,
  play: <path d="M4.5 2.5 12.5 8l-8 5.5Z" fill="currentColor" stroke="none" />,
  pause: <path d="M5 3v10M11 3v10" strokeWidth="2" />,
  check: <path d="M3 8.4 6.4 11.6 13 4.6" />,
  cross: <path d="m4 4 8 8M12 4l-8 8" />,
  warn: <><path d="M8 1.8 14.6 13.6H1.4Z" /><path d="M8 6v3.6M8 11.4v.4" /></>,
  info: <><circle cx="8" cy="8" r="6.2" /><path d="M8 7.2v4M8 4.8v.4" /></>,
  search: <><circle cx="7" cy="7" r="4.6" /><path d="m10.4 10.4 3.6 3.6" /></>,
  shard: <path d="M8 1.5 14 6l-2.5 8.5h-7L2 6Z M8 1.5 4.5 14.5 M8 1.5l3.5 13 M2 6h12" />,
  atlas: <><rect x="1.5" y="1.5" width="5" height="5" /><rect x="9.5" y="1.5" width="5" height="5" /><rect x="1.5" y="9.5" width="5" height="5" /><rect x="9.5" y="9.5" width="5" height="5" /></>,
  move: <path d="M8 1.5v13M1.5 8h13M5.5 4 8 1.5 10.5 4M5.5 12 8 14.5 10.5 12M4 5.5 1.5 8 4 10.5M12 5.5 14.5 8 12 10.5" />,
  retry: <path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5v3h-3" />,
  arrow: <path d="M2.5 8h11M9.5 4l4 4-4 4" />,
  sort: <path d="M5 3v10M2.5 10.5 5 13l2.5-2.5M11 13V3M8.5 5.5 11 3l2.5 2.5" />,
};
export function Icon({ n, size = 16, className }: { n: keyof typeof P | string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {P[n]}
    </svg>
  );
}

/* ---------- status: never color alone (shape + word) ---------- */
export type Status = "nominal" | "anomaly" | "rare" | "gap" | "best";
const ST: Record<Status, { word: string; glyph: React.ReactNode }> = {
  nominal: { word: "Nominal", glyph: <circle cx="5" cy="5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.2" /> },
  anomaly: { word: "Anomaly", glyph: <path d="M5 1.2 9 8.6H1Z" fill="currentColor" /> },
  rare: { word: "Rare event", glyph: <path d="M5 1 9 5 5 9 1 5Z" fill="none" stroke="currentColor" strokeWidth="1.2" /> },
  gap: { word: "Comm. gap", glyph: <path d="M1.5 1.5 8.5 8.5M8.5 1.5 1.5 8.5" stroke="currentColor" strokeWidth="1.4" /> },
  best: { word: "Best", glyph: <circle cx="5" cy="5" r="3.6" fill="currentColor" /> },
};
export function StatusTag({ s, label, solid }: { s: Status; label?: string; solid?: boolean }) {
  return (
    <span className={`wiv-badge ${solid ? "is-solid" : ""}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">{ST[s].glyph}</svg>
      {label ?? ST[s].word}
    </span>
  );
}

/* ---------- circle button with label + tooltip title ---------- */
export function Circle({ label, icon, onClick, pressed, expanded, small, disabled, cls = "", id }: {
  label: string; icon: string; onClick?: () => void; pressed?: boolean; expanded?: boolean; small?: boolean; disabled?: boolean; cls?: string; id?: string;
}) {
  return (
    <button id={id} type="button" className={`wiv-circle ${small ? "is-sm" : ""} ${cls}`} aria-label={label} title={label}
      aria-pressed={pressed} aria-expanded={expanded} onClick={onClick} disabled={disabled}>
      <Icon n={icon} />
    </button>
  );
}

/* ---------- tooltip: opens on hover AND focus, Esc closes ---------- */
export function Tip({ text, children }: { text: string; children: (p: { "aria-describedby": string; onFocus: () => void; onBlur: () => void }) => React.ReactNode }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);
  return (
    <span className="wiv-tipWrap" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {children({ "aria-describedby": id, onFocus: () => setOpen(true), onBlur: () => setOpen(false) })}
      <span role="tooltip" id={id} className="wiv-tip" data-open={open}>{text}</span>
    </span>
  );
}

/* ---------- switch ---------- */
export function Switch({ on, set, label, disabled, cls = "" }: { on: boolean; set?: (b: boolean) => void; label: string; disabled?: boolean; cls?: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={`wiv-switch ${cls}`} disabled={disabled} onClick={() => set?.(!on)} />;
}

/* ---------- segmented control (radio group, arrow keys) ---------- */
export function Segmented<T extends string>({ value, set, options, label, cls = "" }: { value: T; set: (v: T) => void; options: { v: T; label: string; disabled?: boolean }[]; label: string; cls?: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (d: number) => {
    const live = options.filter((o) => !o.disabled);
    const i = live.findIndex((o) => o.v === value);
    const n = live[(i + d + live.length) % live.length];
    set(n.v);
    refs.current[options.indexOf(n)]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className={`wiv-seg ${cls}`}
      onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); move(1); } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); move(-1); } }}>
      {options.map((o, i) => (
        <button key={o.v} ref={(el) => { refs.current[i] = el; }} type="button" role="radio" aria-checked={value === o.v} tabIndex={value === o.v ? 0 : -1}
          disabled={o.disabled} className="wiv-segBtn" onClick={() => set(o.v)}>{o.label}</button>
      ))}
    </div>
  );
}

/* ---------- tabs (roving focus) ---------- */
export function Tabs({ tabs, value, set, label, idBase }: { tabs: { v: string; label: string; disabled?: boolean }[]; value: string; set: (v: string) => void; label: string; idBase: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const live = tabs.filter((t) => !t.disabled);
  const move = (d: number) => {
    const i = live.findIndex((t) => t.v === value);
    const n = live[(i + d + live.length) % live.length];
    set(n.v); refs.current[tabs.indexOf(n)]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="wiv-tabs"
      onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); move(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); } }}>
      {tabs.map((t, i) => (
        <button key={t.v} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={`${idBase}-t-${t.v}`} aria-controls={`${idBase}-p-${t.v}`}
          aria-selected={value === t.v} tabIndex={value === t.v ? 0 : -1} disabled={t.disabled} className="wiv-tab" onClick={() => set(t.v)}>{t.label}</button>
      ))}
    </div>
  );
}

/* ---------- menu (≡ or ⋮): button + popover, arrow keys, Esc returns focus ---------- */
export function Menu({ icon, label, items, align = "left", count }: { icon: "menu" | "more"; label: string; items: { label: string; onSelect?: () => void; disabled?: boolean; hint?: string }[]; align?: "left" | "right"; count?: number }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const close = useCallback((refocus = true) => { setOpen(false); if (refocus) btn.current?.focus(); }, []);
  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    const out = (e: PointerEvent) => { if (!list.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) close(false); };
    window.addEventListener("pointerdown", out);
    return () => window.removeEventListener("pointerdown", out);
  }, [open, close]);
  const onKey = (e: React.KeyboardEvent) => {
    const all = [...(list.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])];
    const i = all.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") { e.preventDefault(); all[(i + 1) % all.length]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); all[(i - 1 + all.length) % all.length]?.focus(); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === "Tab") close(false);
  };
  return (
    <span className="relative inline-flex">
      <button ref={btn} type="button" className="wiv-circle relative" aria-label={label} title={label} aria-haspopup="menu" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <Icon n={icon} />
        {count !== undefined && <span className="wiv-count" aria-label={`${count} new`}>{count}</span>}
      </button>
      {open && (
        <div ref={list} id={id} role="menu" aria-label={label} className={`wiv-menu top-[calc(100%+8px)] ${align === "right" ? "right-0" : "left-0"}`} onKeyDown={onKey}>
          {items.map((it) => (
            <button key={it.label} type="button" role="menuitem" className="wiv-menuItem" disabled={it.disabled} onClick={() => { it.onSelect?.(); close(); }}>
              <span className="flex-1">{it.label}</span>
              {it.hint && <span className="wiv-label">{it.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

/* ---------- toasts: auto-dismiss after 4.2s, pause on hover ---------- */
type Toast = { id: number; text: string; icon: string };
const ToastCtx = createContext<(text: string, icon?: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const n = useRef(0);
  const push = useCallback((text: string, icon = "check") => {
    const id = ++n.current;
    setList((l) => [...l.slice(-2), { id, text, icon }]);
  }, []);
  const drop = (id: number) => setList((l) => l.filter((t) => t.id !== id));
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="wiv-toasts" role="status" aria-live="polite">
        {list.map((t) => <ToastItem key={t.id} t={t} drop={drop} />)}
      </div>
    </ToastCtx.Provider>
  );
}
function ToastItem({ t, drop }: { t: Toast; drop: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  const left = useRef(4200);
  useEffect(() => {
    if (paused) return;
    const t0 = performance.now();
    const id = window.setTimeout(() => drop(t.id), left.current);
    return () => { window.clearTimeout(id); left.current -= performance.now() - t0; };
  }, [paused, drop, t.id]);
  return (
    <div className="wiv-toast wiv-glass" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <Icon n={t.icon} />
      <span className="flex-1 text-[12px] leading-snug">{t.text}</span>
      <button type="button" className="wiv-circle is-sm" aria-label="Dismiss" title="Dismiss" onClick={() => drop(t.id)}><Icon n="close" size={14} /></button>
      <span className="wiv-progress" style={{ animationDuration: "4200ms", animationPlayState: paused ? "paused" : "running" }} />
    </div>
  );
}

/* ---------- modal: native <dialog> (inert background), focus trap, Esc, focus return ---------- */
export function Modal({ open, onClose, title, children, labelId }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; labelId: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const d = ref.current!;
    if (open && !d.open) { opener.current = document.activeElement as HTMLElement; d.showModal(); }
    if (!open && d.open) { d.close(); }
  }, [open]);
  const trap = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const f = [...ref.current!.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])")].filter((x) => !x.hasAttribute("disabled"));
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  return (
    <dialog ref={ref} className="wiv-dialog" aria-labelledby={labelId} onKeyDown={trap}
      onClose={() => { onClose(); opener.current?.focus(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative p-5 sm:p-7">
        <span className="wiv-corners" aria-hidden="true" style={{ opacity: 1, inset: 8 }}><i /><i /><i /><i /></span>
        <div className="flex items-start justify-between gap-4">
          <h3 id={labelId} className="wiv-display text-[16px] leading-snug tracking-[0.05em]">{title}</h3>
          <button type="button" className="wiv-circle is-sm" aria-label="Close dialog (Esc)" title="Close (Esc)" onClick={onClose}><Icon n="close" size={14} /></button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

/* ---------- accordion ---------- */
export function Accordion({ items }: { items: { q: string; a: React.ReactNode; tag?: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();
  return (
    <div className="wiv-acc">
      {items.map((it, i) => (
        <div key={it.q} className="wiv-accItem">
          <h4>
            <button type="button" className="wiv-accBtn" aria-expanded={open === i} aria-controls={`${base}-${i}`} id={`${base}-b${i}`} onClick={() => setOpen(open === i ? null : i)}>
              <span className="wiv-label w-7 shrink-0">{pad(i + 1)}</span>
              <span className="flex-1 text-[13px] font-medium">{it.q}</span>
              {it.tag && <span className="wiv-label hidden sm:inline">{it.tag}</span>}
              <Icon n="plus" className="wiv-plus" />
            </button>
          </h4>
          <div id={`${base}-${i}`} role="region" aria-labelledby={`${base}-b${i}`} className="wiv-accPanel" data-open={open === i}>
            <div><div className="pb-4 pl-11 pr-4 text-[12.5px] leading-[1.65]" hidden={open !== i}>{it.a}</div></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- corner brackets ---------- */
export const Corners = () => <span className="wiv-corners" aria-hidden="true"><i /><i /><i /><i /></span>;

/* ---------- glyph loader (Igloo's ----===+++ progress string) ---------- */
export function GlyphLoader({ label = "Loading" }: { label?: string }) {
  const reduced = useReduced();
  const [p, setP] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setP((x) => (x + 1) % 14), 110);
    return () => window.clearInterval(id);
  }, [reduced]);
  const k = Math.min(10, p);
  const str = reduced ? "----===+++" : "+".repeat(k) + "=".repeat(Math.min(3, 10 - k)) + "-".repeat(Math.max(0, 10 - k - 3));
  return <span className="wiv-hud wiv-tick tracking-[0.24em] text-[var(--ink)]" role="status" aria-label={label}><span aria-hidden="true">{str}</span><span className="ml-3 text-[var(--muted)]">{label}</span></span>;
}

/* ---------- measured width, so SVG text renders at its true pixel size ---------- */
export function useWidth<T extends Element>(fallback = 640) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(240, Math.round(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}
