"use client";

// Refined paper primitives: the live, stateful pieces (toast, dialog, tooltip, menus, accordion,
// switch, checkbox, radio, tabs, segmented). Styling comes from kit.tsx so section 5's state
// matrix renders the same strings.
import {
  createContext, useCallback, useContext, useEffect, useId, useRef, useState,
  type KeyboardEvent, type ReactNode,
} from "react";
import {
  FOCUS, IconCheck, IconCross, IconDash, IconMore, MONO, SANS, SERIF, btnIcon, checkbox, radio, seg, segTrack,
  switchKnob, switchTrack, tab,
} from "./kit";

/* ================================================================== toast */
type Toast = { id: number; title: string; body?: string; action?: { label: string; run: () => void } };
const ToastCtx = createContext<(t: Omit<Toast, "id">) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const seq = useRef(0);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = ++seq.current;
    setList((l) => [...l.slice(-2), { ...t, id }]);
  }, []);
  const drop = (id: number) => setList((l) => l.filter((t) => t.id !== id));
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div role="region" aria-label="Notifications" className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-end sm:px-6 sm:pb-6">
        <div aria-live="polite" aria-atomic="false" className="flex w-full flex-col items-center gap-2 sm:items-end">
          {list.map((t) => (
            <div key={t.id} className="rpd-toast rpd-rise pointer-events-auto relative w-full max-w-[22rem] overflow-hidden rounded-[3px] border border-[var(--ink)] bg-[var(--mount)] shadow-[var(--lift)]">
              <div className="flex items-start gap-3 py-3 pr-2 pl-4">
                <span className="mt-[3px] grid size-4 shrink-0 place-items-center rounded-full bg-[var(--sage)] text-[var(--mount)]"><IconCheck size={10} /></span>
                <div className="min-w-0 flex-1">
                  <p className={`${SANS} text-[14px] font-medium text-[var(--ink)]`}>{t.title}</p>
                  {t.body && <p className={`${SANS} mt-0.5 text-[12.5px] leading-[1.4] text-[var(--muted)]`}>{t.body}</p>}
                </div>
                {t.action && (
                  <button type="button" onClick={() => (t.action!.run(), drop(t.id))} className={`${SANS} ${FOCUS} -my-1 h-8 shrink-0 rounded-[3px] px-2 text-[13px] font-medium text-[var(--ink)] underline decoration-[var(--rule-strong)] underline-offset-4 transition-colors duration-200 hover:bg-[var(--parchment)] hover:decoration-[var(--ink)] active:bg-[var(--rule)]`}>
                    {t.action.label}
                  </button>
                )}
                <button type="button" aria-label="Dismiss notification" onClick={() => drop(t.id)} className={`${btnIcon} -my-1.5 size-8`}><IconCross /></button>
              </div>
              <span aria-hidden className="rpd-timer absolute inset-x-0 bottom-0 h-px bg-[var(--ink)]" style={{ ["--d" as string]: "5000ms" }} onAnimationEnd={() => drop(t.id)} />
            </div>
          ))}
        </div>
      </div>
    </ToastCtx.Provider>
  );
}

/* ================================================================== dialog */
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Dialog({ open, onClose, title, kicker, children, footer, wide }: { open: boolean; onClose: () => void; title: string; kicker?: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const sheet = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const first = sheet.current?.querySelector<HTMLElement>("[data-autofocus]") ?? sheet.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    return () => {
      html.style.overflow = prev;
      opener.current?.focus();
    };
  }, [open]);
  if (!open) return null;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") { e.stopPropagation(); onClose(); return; }
    if (e.key !== "Tab" || !sheet.current) return;
    const f = Array.from(sheet.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (!f.length) return;
    const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  };
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6" onKeyDown={onKey}>
      <div className="rpd-scrim absolute inset-0" onClick={onClose} aria-hidden />
      <div ref={sheet} role="dialog" aria-modal="true" aria-labelledby={`${id}-t`} className={`rpd-sheet relative flex max-h-[min(92dvh,760px)] w-full flex-col rounded-t-[4px] border border-[var(--ink)] bg-[var(--paper)] shadow-[var(--lift)] sm:rounded-[3px] ${wide ? "sm:max-w-[960px]" : "sm:max-w-[560px]"}`}>
        <div className="flex items-start gap-4 border-b border-[var(--rule)] px-5 pt-5 pb-4 sm:px-6">
          <div className="min-w-0 flex-1">
            {kicker && <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>{kicker}</p>}
            <h3 id={`${id}-t`} className={`${SERIF} mt-1 text-[26px] leading-[1.15] font-[450] text-[var(--ink)]`}>{title}</h3>
          </div>
          <button type="button" aria-label="Close dialog" onClick={onClose} className={`${btnIcon} -mt-1 -mr-2`}><IconCross size={14} /></button>
        </div>
        <div className="rpd-scroll overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--rule)] px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}

/* ================================================================== tooltip (hover AND focus; Esc hides) */
export function Tooltip({ tip, children, side = "top" }: { tip: ReactNode; children: (p: { "aria-describedby": string; onFocus: () => void; onBlur: () => void }) => ReactNode; side?: "top" | "bottom" }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = (delay = 0) => { clearTimeout(t.current); t.current = setTimeout(() => setOpen(true), delay); };
  const hide = () => { clearTimeout(t.current); setOpen(false); };
  useEffect(() => () => clearTimeout(t.current), []);
  return (
    <span className="relative inline-flex" onMouseEnter={() => show(120)} onMouseLeave={hide} onKeyDown={(e) => e.key === "Escape" && hide()}>
      {children({ "aria-describedby": id, onFocus: () => show(0), onBlur: hide })}
      <span
        id={id}
        role="tooltip"
        data-open={open}
        className={`${SANS} pointer-events-none absolute left-1/2 z-40 w-max max-w-[15rem] -translate-x-1/2 rounded-[3px] bg-[var(--ink)] px-2.5 py-1.5 text-[12px] leading-[1.4] text-[var(--paper)] opacity-0 shadow-[var(--lift)] transition-[opacity,transform] duration-200 ease-out data-[open=true]:opacity-100 ${side === "top" ? "bottom-full mb-2 translate-y-1 data-[open=true]:translate-y-0" : "top-full mt-2 -translate-y-1 data-[open=true]:translate-y-0"}`}
      >
        {tip}
        <span aria-hidden className={`absolute left-1/2 size-2 -translate-x-1/2 rotate-45 bg-[var(--ink)] ${side === "top" ? "-bottom-1" : "-top-1"}`} />
      </span>
    </span>
  );
}

/* ================================================================== popover menu (≡ nav menu and ⋮ more menu) */
function useDismiss(open: boolean, close: () => void, box: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => box.current && !box.current.contains(e.target as Node) && close();
    const key = (e: globalThis.KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); };
  }, [open, close, box]);
}

export type MoreItem = { label: string; hint?: string; disabled?: boolean; run?: () => void };
export function MoreMenu({ items, label = "More actions", align = "right" }: { items: MoreItem[]; label?: string; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const id = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, box);
  useEffect(() => {
    if (open) box.current?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')?.focus();
  }, [open]);
  const onKey = (e: KeyboardEvent) => {
    const els = Array.from(box.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const i = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") { e.preventDefault(); els[(i + 1) % els.length]?.focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); els[(i - 1 + els.length) % els.length]?.focus(); }
    if (e.key === "Home") { e.preventDefault(); els[0]?.focus(); }
    if (e.key === "End") { e.preventDefault(); els[els.length - 1]?.focus(); }
    if (e.key === "Escape") { setOpen(false); btn.current?.focus(); }
    if (e.key === "Tab") setOpen(false);
  };
  return (
    <div ref={box} className="relative" onKeyDown={onKey}>
      <button ref={btn} type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className={btnIcon}>
        <IconMore />
      </button>
      {open && (
        <div id={id} role="menu" aria-label={label} className={`rpd-rise absolute top-full z-50 mt-1.5 w-[15.5rem] rounded-[3px] border border-[var(--ink)] bg-[var(--mount)] py-1.5 shadow-[var(--lift)] ${align === "right" ? "right-0" : "left-0"}`}>
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              tabIndex={-1}
              aria-disabled={it.disabled || undefined}
              onClick={() => { if (it.disabled) return; it.run?.(); setOpen(false); btn.current?.focus(); }}
              className={`${SANS} flex w-full items-baseline justify-between gap-3 px-3.5 py-2 text-left text-[14px] text-[var(--ink)] outline-none transition-colors duration-200 hover:bg-[var(--parchment)] focus-visible:bg-[var(--parchment)] focus-visible:shadow-[inset_2px_0_0_var(--ink)] active:bg-[var(--rule)] aria-disabled:cursor-not-allowed aria-disabled:text-[var(--muted)] aria-disabled:hover:bg-transparent`}
            >
              <span>{it.label}</span>
              {it.hint && <span className={`${MONO} text-[11px] text-[var(--muted)]`}>{it.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Generic disclosure popover: used by the ≡ navigation menu. */
export function MenuButton({ label, icon, panel, buttonClass = btnIcon, children }: { label: string; icon: ReactNode; panel: (close: () => void) => ReactNode; buttonClass?: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const id = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, box);
  return (
    <div ref={box} className="relative">
      <button type="button" aria-label={children ? undefined : label} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className={buttonClass}>
        {icon}
        {children}
      </button>
      {open && <div id={id} className="rpd-rise absolute top-full left-0 z-50 mt-1.5">{panel(close)}</div>}
    </div>
  );
}

/* ================================================================== accordion */
export function Accordion({ items, defaultOpen = 0 }: { items: { q: string; a: ReactNode }[]; defaultOpen?: number }) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const id = useId();
  return (
    <div className="border-t border-[var(--ink)]">
      {items.map((it, i) => {
        const on = open === i;
        return (
          <div key={it.q} className="border-b border-[var(--rule)]">
            <h4>
              <button
                type="button"
                id={`${id}-b${i}`}
                aria-expanded={on}
                aria-controls={`${id}-p${i}`}
                onClick={() => setOpen(on ? null : i)}
                className={`${SERIF} ${FOCUS} group flex w-full items-center justify-between gap-4 rounded-[2px] py-4 text-left text-[18px] leading-[1.3] text-[var(--ink)] transition-colors duration-200 hover:bg-[var(--parchment)]/60 active:bg-[var(--parchment)]`}
              >
                <span>{it.q}</span>
                <span aria-hidden className="relative size-3 shrink-0">
                  <span className="absolute top-1/2 left-0 h-px w-3 bg-[var(--ink)]" />
                  <span className={`absolute top-0 left-1/2 h-3 w-px bg-[var(--ink)] transition-transform duration-300 ease-[cubic-bezier(.22,.61,.36,1)] ${on ? "scale-y-0" : ""}`} />
                </span>
              </button>
            </h4>
            <div id={`${id}-p${i}`} role="region" aria-labelledby={`${id}-b${i}`} className="rpd-acc" data-open={on} inert={!on}>
              <div>
                <div className={`${SERIF} max-w-[60ch] pb-5 text-[16px] leading-[1.6] text-[var(--ink)]`}>{it.a}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================== switch */
export function Switch({ checked, onChange, label, hint, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <label htmlFor={id} className={`min-w-0 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
        <span className={`${SANS} block text-[14px] font-medium ${disabled ? "text-[var(--muted)]" : "text-[var(--ink)]"}`}>{label}</span>
        {hint && <span className={`${SANS} block text-[12px] leading-[1.4] text-[var(--muted)]`}>{hint}</span>}
      </label>
      <button id={id} type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className={switchTrack}>
        <span className={switchKnob} />
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}

/* ================================================================== checkbox + radio */
export function Check({ checked, onChange, label, hint, disabled, indeterminate }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: string; disabled?: boolean; indeterminate?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate; }, [indeterminate]);
  return (
    <label className={`group flex items-start gap-3 py-1.5 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
      <span className="relative mt-[1px] grid">
        <input ref={ref} type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className={checkbox} />
        <IconCheck size={12} className="pointer-events-none absolute inset-0 m-auto text-[var(--paper)] opacity-0 peer-checked:opacity-100 peer-indeterminate:opacity-0" />
        <IconDash size={12} className="pointer-events-none absolute inset-0 m-auto text-[var(--paper)] opacity-0 peer-indeterminate:opacity-100" />
      </span>
      <span className="min-w-0">
        <span className={`${SANS} block text-[14px] leading-[1.35] ${disabled ? "text-[var(--muted)]" : "text-[var(--ink)]"}`}>{label}</span>
        {hint && <span className={`${SANS} block text-[12px] leading-[1.4] text-[var(--muted)]`}>{hint}</span>}
      </span>
    </label>
  );
}

export function RadioGroup<T extends string>({ name, value, onChange, options, legend }: { name: string; value: T; onChange: (v: T) => void; legend: string; options: { value: T; label: string; hint?: string; disabled?: boolean }[] }) {
  return (
    <fieldset>
      <legend className={`${SANS} mb-1.5 text-[13px] font-medium text-[var(--ink)]`}>{legend}</legend>
      {options.map((o) => (
        <label key={o.value} className={`flex items-start gap-3 py-1.5 ${o.disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
          <input type="radio" name={name} value={o.value} checked={value === o.value} disabled={o.disabled} onChange={() => onChange(o.value)} className={`${radio} mt-[1px]`} />
          <span className="min-w-0">
            <span className={`${SANS} block text-[14px] leading-[1.35] ${o.disabled ? "text-[var(--muted)]" : "text-[var(--ink)]"}`}>{o.label}</span>
            {o.hint && <span className={`${SANS} block text-[12px] leading-[1.4] text-[var(--muted)]`}>{o.hint}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

/* ================================================================== tabs (roving focus, arrow keys) */
export function Tabs({ tabs, label }: { label: string; tabs: { id: string; label: string; disabled?: boolean; panel: ReactNode }[] }) {
  const enabled = tabs.filter((t) => !t.disabled);
  const [cur, setCur] = useState(enabled[0].id);
  const uid = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const onKey = (e: KeyboardEvent) => {
    const i = enabled.findIndex((t) => t.id === cur);
    let n = -1;
    if (e.key === "ArrowRight") n = (i + 1) % enabled.length;
    if (e.key === "ArrowLeft") n = (i - 1 + enabled.length) % enabled.length;
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = enabled.length - 1;
    if (n < 0) return;
    e.preventDefault();
    setCur(enabled[n].id);
    refs.current[enabled[n].id]?.focus();
  };
  return (
    <div>
      <div role="tablist" aria-label={label} onKeyDown={onKey} className="rpd-scroll flex gap-1 overflow-x-auto border-b border-[var(--rule)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            ref={(el) => { refs.current[t.id] = el; }}
            type="button"
            role="tab"
            id={`${uid}-${t.id}`}
            aria-selected={cur === t.id}
            aria-controls={`${uid}-${t.id}-p`}
            tabIndex={cur === t.id ? 0 : -1}
            disabled={t.disabled}
            onClick={() => setCur(t.id)}
            className={`${tab} shrink-0`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`${uid}-${t.id}-p`} aria-labelledby={`${uid}-${t.id}`} hidden={cur !== t.id} tabIndex={0} className={`${FOCUS} rounded-[2px] pt-4`}>
          {cur === t.id && <div className="rpd-fade">{t.panel}</div>}
        </div>
      ))}
    </div>
  );
}

/* ================================================================== segmented control (radiogroup) */
export function Segmented<T extends string | number>({ value, onChange, options, label, size = "md" }: { value: T; onChange: (v: T) => void; label: string; options: { value: T; label: string; disabled?: boolean }[]; size?: "md" | "sm" }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent) => {
    const live = options.map((o, i) => ({ o, i })).filter((x) => !x.o.disabled);
    const at = live.findIndex((x) => x.o.value === value);
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const nx = live[(at + d + live.length) % live.length];
    onChange(nx.o.value);
    refs.current[nx.i]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKey} className={segTrack}>
      {options.map((o, i) => (
        <button
          key={String(o.value)}
          ref={(el) => { refs.current[i] = el; }}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          tabIndex={value === o.value ? 0 : -1}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={`${seg} ${size === "sm" ? "h-7 min-w-0 px-2.5 text-[12.5px]" : ""}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ================================================================== small pieces */
export function CountBadge({ n, label }: { n: number; label: string }) {
  return (
    <span aria-label={`${n} ${label}`} className={`${MONO} inline-grid h-[18px] min-w-[18px] place-items-center rounded-[2px] bg-[var(--ink)] px-1 text-[11px] leading-none text-[var(--paper)]`}>
      {n}
    </span>
  );
}

export function Dot({ color, ring }: { color: string; ring?: boolean }) {
  return <span aria-hidden className={`inline-block size-2 shrink-0 rounded-full ${ring ? "ring-2 ring-[var(--paper)]" : ""}`} style={{ background: color }} />;
}
