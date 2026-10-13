"use client";

// Intense Space primitives. Every control carries rest / hover / focus-visible / pressed /
// selected / disabled styles; the same literal class strings are reused by the forced-state
// specimens in section 5 so the matrix can never drift from the live component.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

export const MONO = "font-(family-name:--font-is-mono)";
export const DOT = "font-(family-name:--font-is-dot)";
export const FR = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--is-frost)";
export const LABEL = `${MONO} text-[10px] uppercase tracking-[0.16em]`;
export const TRANS = "transition-[color,background-color,border-color,transform,opacity] duration-200 ease-(--is-ease)";

/* ---------------- buttons ---------------- */
export const BTN_BASE = `${MONO} ${TRANS} inline-flex min-h-10 select-none items-center justify-center gap-2 rounded-[3px] px-4 text-[11px] uppercase tracking-[0.14em] ${FR} disabled:cursor-not-allowed`;
export const BTN = {
  primary: `${BTN_BASE} bg-(--is-fiber) text-(--is-void) hover:bg-[#8aff6b] active:translate-y-px active:bg-[#2cc906] disabled:translate-y-0 disabled:bg-(--is-charcoal) disabled:text-[#7d868d]`,
  secondary: `${BTN_BASE} border border-(--is-line) text-(--is-frost) hover:border-(--is-frost) active:translate-y-px active:bg-(--is-charcoal) aria-pressed:border-(--is-frost) aria-pressed:bg-(--is-frost) aria-pressed:text-(--is-void) disabled:translate-y-0 disabled:border-(--is-line) disabled:bg-transparent disabled:text-[#5f676e]`,
  ghost: `${BTN_BASE} px-2 text-(--is-steel) hover:text-(--is-frost) active:bg-(--is-charcoal) disabled:text-[#5f676e]`,
};
// forced states for the section-5 matrix (literal so Tailwind sees them)
export const BTN_FORCED = {
  primary: {
    Rest: `${BTN_BASE} bg-(--is-fiber) text-(--is-void)`,
    Hover: `${BTN_BASE} bg-[#8aff6b] text-(--is-void)`,
    Focus: `${BTN_BASE} bg-(--is-fiber) text-(--is-void) outline-2 outline-offset-2 outline-(--is-frost)`,
    Pressed: `${BTN_BASE} translate-y-px bg-[#2cc906] text-(--is-void)`,
    Selected: "",
    Disabled: `${BTN_BASE} bg-(--is-charcoal) text-[#7d868d]`,
  },
  secondary: {
    Rest: `${BTN_BASE} border border-(--is-line) text-(--is-frost)`,
    Hover: `${BTN_BASE} border border-(--is-frost) text-(--is-frost)`,
    Focus: `${BTN_BASE} border border-(--is-line) text-(--is-frost) outline-2 outline-offset-2 outline-(--is-frost)`,
    Pressed: `${BTN_BASE} translate-y-px border border-(--is-frost) bg-(--is-charcoal) text-(--is-frost)`,
    Selected: `${BTN_BASE} border border-(--is-frost) bg-(--is-frost) text-(--is-void)`,
    Disabled: `${BTN_BASE} border border-(--is-line) text-[#5f676e]`,
  },
};

// Helion's bracketed label: the brackets drift apart on hover/focus
export function Br({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center">
      <span aria-hidden className="transition-transform duration-200 ease-(--is-ease) group-hover:-translate-x-[3px] group-focus-visible:-translate-x-[3px]">[</span>
      <span className="px-2">{children}</span>
      <span aria-hidden className="transition-transform duration-200 ease-(--is-ease) group-hover:translate-x-[3px] group-focus-visible:translate-x-[3px]">]</span>
    </span>
  );
}

export function Button({
  variant = "secondary",
  className = "",
  bracket,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BTN; bracket?: boolean }) {
  return (
    <button type="button" className={`group ${BTN[variant]} ${className}`} {...rest}>
      {bracket ? <Br>{children}</Br> : children}
    </button>
  );
}

/* ---------------- chips ---------------- */
export const CHIP_BASE = `${MONO} ${TRANS} inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] uppercase tracking-[0.1em] ${FR}`;
export const CHIP = `${CHIP_BASE} border-(--is-line) text-(--is-steel) hover:border-(--is-frost) hover:text-(--is-frost) active:bg-(--is-charcoal) aria-pressed:border-(--is-teal) aria-pressed:text-(--is-teal) disabled:cursor-not-allowed disabled:border-(--is-line) disabled:text-[#5f676e]`;
export const CHIP_FORCED = {
  Rest: `${CHIP_BASE} border-(--is-line) text-(--is-steel)`,
  Hover: `${CHIP_BASE} border-(--is-frost) text-(--is-frost)`,
  Focus: `${CHIP_BASE} border-(--is-line) text-(--is-steel) outline-2 outline-offset-2 outline-(--is-frost)`,
  Pressed: `${CHIP_BASE} border-(--is-frost) bg-(--is-charcoal) text-(--is-frost)`,
  Selected: `${CHIP_BASE} border-(--is-teal) text-(--is-teal)`,
  Disabled: `${CHIP_BASE} border-(--is-line) text-[#5f676e]`,
};
export function Chip({ on, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { on: boolean }) {
  return (
    <button type="button" aria-pressed={on} className={CHIP} {...rest}>
      <span aria-hidden className={on ? "" : "opacity-40"}>{on ? "●" : "○"}</span>
      {children}
    </button>
  );
}

/* ---------------- segmented control ---------------- */
export const SEG_ITEM = `${MONO} ${TRANS} min-h-8 rounded-[2px] px-3 text-[11px] uppercase tracking-[0.12em] ${FR} focus-visible:outline-offset-1 text-(--is-steel) hover:text-(--is-frost) active:bg-(--is-charcoal) aria-checked:bg-(--is-frost) aria-checked:text-(--is-void) disabled:cursor-not-allowed disabled:text-[#5f676e]`;
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  disabled = [],
}: {
  label: string;
  options: { v: T; t: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: T[];
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (dir: number) => {
    const enabled = options.filter((o) => !disabled.includes(o.v));
    const i = enabled.findIndex((o) => o.v === value);
    const next = enabled[(i + dir + enabled.length) % enabled.length];
    onChange(next.v);
    refs.current[options.indexOf(next)]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[3px] border border-(--is-line) p-0.5">
      {options.map((o, i) => (
        <button
          key={String(o.v)}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={o.v === value}
          tabIndex={o.v === value ? 0 : -1}
          disabled={disabled.includes(o.v)}
          onClick={() => onChange(o.v)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") (e.preventDefault(), move(1));
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") (e.preventDefault(), move(-1));
          }}
          className={SEG_ITEM}
        >
          {o.t}
        </button>
      ))}
    </div>
  );
}

/* ---------------- tabs ---------------- */
export const TAB_BASE = `${MONO} ${TRANS} -mb-px min-h-10 border-b-2 px-1 text-[11px] uppercase tracking-[0.14em] ${FR}`;
export const TAB = `${TAB_BASE} border-transparent text-(--is-steel) hover:text-(--is-frost) active:text-(--is-steel) aria-selected:border-(--is-frost) aria-selected:text-(--is-frost) disabled:cursor-not-allowed disabled:text-[#5f676e]`;
export const TAB_FORCED = {
  Rest: `${TAB_BASE} border-transparent text-(--is-steel)`,
  Hover: `${TAB_BASE} border-transparent text-(--is-frost)`,
  Focus: `${TAB_BASE} border-transparent text-(--is-steel) outline-2 outline-offset-2 outline-(--is-frost)`,
  Pressed: `${TAB_BASE} border-(--is-charcoal) text-(--is-steel)`,
  Selected: `${TAB_BASE} border-(--is-frost) text-(--is-frost)`,
  Disabled: `${TAB_BASE} border-transparent text-[#5f676e]`,
};
export function Tabs({ label, tabs, disabled = [] }: { label: string; tabs: { id: string; t: string; body: ReactNode }[]; disabled?: string[] }) {
  const [cur, setCur] = useState(tabs[0].id);
  const uid = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const enabled = tabs.filter((t) => !disabled.includes(t.id));
  const go = (dir: number) => {
    const i = enabled.findIndex((t) => t.id === cur);
    const n = enabled[(i + dir + enabled.length) % enabled.length];
    setCur(n.id);
    refs.current[n.id]?.focus();
  };
  return (
    <div>
      <div role="tablist" aria-label={label} className="flex gap-6 overflow-x-auto border-b border-(--is-line)">
        {tabs.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            role="tab"
            type="button"
            id={`${uid}-${t.id}-tab`}
            aria-selected={cur === t.id}
            aria-controls={`${uid}-${t.id}-panel`}
            tabIndex={cur === t.id ? 0 : -1}
            disabled={disabled.includes(t.id)}
            onClick={() => setCur(t.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") (e.preventDefault(), go(1));
              if (e.key === "ArrowLeft") (e.preventDefault(), go(-1));
            }}
            className={`${TAB} shrink-0`}
          >
            {t.t}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`${uid}-${t.id}-panel`} aria-labelledby={`${uid}-${t.id}-tab`} hidden={cur !== t.id} tabIndex={0} className={`pt-4 ${FR}`}>
          {t.body}
        </div>
      ))}
    </div>
  );
}

/* ---------------- switch ---------------- */
export const SW_TRACK = `${TRANS} relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border`;
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`group inline-flex min-h-10 items-center gap-3 rounded-[2px] text-left text-[14px] text-(--is-frost) ${FR} disabled:cursor-not-allowed disabled:text-[#5f676e]`}
    >
      <span
        aria-hidden
        className={`${SW_TRACK} ${
          checked ? "border-(--is-frost) bg-(--is-frost)" : "border-(--is-steel) bg-transparent group-hover:border-(--is-frost)"
        } group-active:scale-95 group-disabled:border-(--is-line) group-disabled:bg-transparent`}
      >
        <span
          className={`${TRANS} absolute top-[3px] size-3 rounded-full ${checked ? "translate-x-[19px] bg-(--is-void)" : "translate-x-[3px] bg-(--is-steel) group-hover:bg-(--is-frost)"} group-disabled:bg-(--is-line)`}
        />
      </span>
      <span>{label}</span>
      <span className={`${LABEL} ${checked ? "text-(--is-frost)" : "text-(--is-steel)"} group-disabled:text-[#5f676e]`}>{checked ? "On" : "Off"}</span>
    </button>
  );
}

/* ---------------- checkbox + radio ---------------- */
export function Check({ checked, onChange, label, disabled, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean; hint?: string }) {
  return (
    <label className={`group flex min-h-10 cursor-pointer items-start gap-3 py-1.5 has-disabled:cursor-not-allowed`}>
      <span className="relative mt-[3px] inline-flex size-4 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className={`peer size-4 cursor-pointer appearance-none rounded-[2px] border border-(--is-steel) ${TRANS} hover:border-(--is-frost) active:bg-(--is-charcoal) checked:border-(--is-frost) checked:bg-(--is-frost) disabled:cursor-not-allowed disabled:border-(--is-line) disabled:bg-transparent ${FR}`}
        />
        <svg viewBox="0 0 16 16" aria-hidden className="pointer-events-none absolute inset-0 size-4 opacity-0 peer-checked:opacity-100 peer-disabled:opacity-40">
          <path d="M3.5 8.2l3 3 6-6.4" fill="none" stroke="#0A0B0D" strokeWidth="1.8" />
        </svg>
      </span>
      <span className="text-[14px] leading-[1.35] text-(--is-frost) group-has-disabled:text-[#5f676e]">
        {label}
        {hint ? <span className="block text-[13px] text-(--is-steel) group-has-disabled:text-[#5f676e]">{hint}</span> : null}
      </span>
    </label>
  );
}

export function Radio({ name, value, checked, onChange, label, disabled }: { name: string; value: string; checked: boolean; onChange: (v: string) => void; label: string; disabled?: boolean }) {
  return (
    <label className="group flex min-h-10 cursor-pointer items-center gap-3 has-disabled:cursor-not-allowed">
      <span className="relative inline-flex size-4 shrink-0">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={() => onChange(value)}
          className={`peer size-4 cursor-pointer appearance-none rounded-full border border-(--is-steel) ${TRANS} hover:border-(--is-frost) active:bg-(--is-charcoal) checked:border-(--is-frost) disabled:cursor-not-allowed disabled:border-(--is-line) ${FR}`}
        />
        <span aria-hidden className="pointer-events-none absolute inset-[4px] scale-0 rounded-full bg-(--is-frost) transition-transform duration-200 peer-checked:scale-100" />
      </span>
      <span className="text-[14px] text-(--is-frost) group-has-disabled:text-[#5f676e]">{label}</span>
    </label>
  );
}

/* ---------------- text input + select ---------------- */
export const FIELD_BASE = `${TRANS} min-h-10 w-full rounded-[2px] border bg-(--is-void) px-3 text-[14px] text-(--is-frost) placeholder:text-(--is-steel)`;
export const FIELD = `${FIELD_BASE} border-(--is-line) hover:border-[#5a6066] focus-visible:border-(--is-frost) ${FR} focus-visible:outline-offset-1 aria-invalid:border-(--is-fault) disabled:cursor-not-allowed disabled:border-(--is-line) disabled:bg-(--is-panel) disabled:text-[#5f676e]`;
export const FIELD_FORCED = {
  Rest: `${FIELD_BASE} border-(--is-line)`,
  Hover: `${FIELD_BASE} border-[#5a6066]`,
  Focus: `${FIELD_BASE} border-(--is-frost) outline-2 outline-offset-1 outline-(--is-frost)`,
  Pressed: `${FIELD_BASE} border-(--is-frost)`,
  Selected: `${FIELD_BASE} border-(--is-fault)`,
  Disabled: `${FIELD_BASE} border-(--is-line) bg-(--is-panel) text-[#5f676e]`,
};

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className={`${LABEL} text-(--is-steel)`}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-msg`} className={`${MONO} text-[11px] tracking-[0.04em] text-(--is-fault)`}>
          <span aria-hidden>■ </span>
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-msg`} className="text-[13px] text-(--is-steel)">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Select({ id, value, onChange, options, disabled }: { id: string; value: string; onChange: (v: string) => void; options: { v: string; t: string }[]; disabled?: boolean }) {
  return (
    <div className="group relative">
      <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={`${FIELD} cursor-pointer appearance-none pr-9`}>
        {options.map((o) => (
          <option key={o.v} value={o.v} className="bg-(--is-panel)">
            {o.t}
          </option>
        ))}
      </select>
      <svg aria-hidden viewBox="0 0 12 12" className="pointer-events-none absolute right-3 top-1/2 size-3 -translate-y-1/2 text-(--is-steel) group-hover:text-(--is-frost)">
        <path d="M2 4.5l4 3.5 4-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </div>
  );
}

/* ---------------- range slider ---------------- */
export function Range({
  id,
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  valueText,
  disabled,
}: {
  id?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  label: string;
  valueText?: string;
  disabled?: boolean;
}) {
  const p = ((value - min) / (max - min)) * 100;
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      aria-label={label}
      aria-valuetext={valueText}
      onChange={(e) => onChange(+e.target.value)}
      className={`isd-range w-full ${FR} focus-visible:outline-offset-4`}
      style={{ "--p": `${p}%` } as React.CSSProperties}
    />
  );
}

/* ---------------- badges + status (color + icon + word) ---------------- */
export function Status({ kind, children }: { kind: "live" | "fault" | "nominal" | "best" | "vae" | "rare"; children?: ReactNode }) {
  const m = {
    live: { c: "text-(--is-fiber)", i: "●", w: "Live" },
    fault: { c: "text-(--is-fault)", i: "■", w: "Labelled fault" },
    nominal: { c: "text-(--is-steel)", i: "○", w: "Nominal" },
    // two different "best"s, never one word for both: ◆ = highest PR-AUC of every row on a mission;
    // ◇ = Table 1's bold, best among the three VAEs only (TVAE on both missions)
    best: { c: "text-(--is-teal)", i: "◆", w: "Top PR-AUC" },
    vae: { c: "text-(--is-frost)", i: "◇", w: "Best VAE" },
    rare: { c: "text-(--is-frost)", i: "□", w: "Rare event" },
  }[kind];
  return (
    <span className={`${MONO} inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] ${m.c}`}>
      <span aria-hidden>{m.i}</span>
      {children ?? m.w}
    </span>
  );
}

export function Count({ n, label }: { n: number; label: string }) {
  return (
    <span aria-label={`${n} ${label}`} className={`${MONO} inline-flex min-w-5 items-center justify-center rounded-[2px] bg-(--is-frost) px-1 text-[10px] leading-[18px] text-(--is-void)`}>
      {n}
    </span>
  );
}

/* ---------------- tooltip (hover AND focus, Esc dismisses) ---------------- */
export function Tip({ label, tip, className = "" }: { label: ReactNode; tip: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-describedby={id}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className={`rounded-[2px] underline decoration-(--is-steel) decoration-dotted underline-offset-4 ${TRANS} hover:decoration-(--is-frost) ${FR} ${className}`}
      >
        {label}
      </button>
      <span
        role="tooltip"
        id={id}
        className={`${MONO} pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-40 w-max max-w-[min(260px,80vw)] -translate-x-1/2 rounded-[2px] border border-(--is-line) bg-(--is-void) px-3 py-2 text-left text-[11px] normal-case leading-snug tracking-[0.02em] text-(--is-frost) transition-[opacity,translate] duration-200 ease-(--is-ease) ${
          open ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        }`}
      >
        {tip}
      </span>
    </span>
  );
}

/* ---------------- toast (auto-dismisses) ---------------- */
type ToastT = { id: number; text: string; tone: "ok" | "fault" | "info" };
const ToastCtx = createContext<(text: string, tone?: ToastT["tone"]) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<ToastT[]>([]);
  const n = useRef(0);
  const push = useCallback((text: string, tone: ToastT["tone"] = "ok") => {
    const id = ++n.current;
    setList((l) => [...l.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-3 bottom-3 z-[70] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5">
        {list.map((t) => (
          <div
            key={t.id}
            className="isd-toast pointer-events-auto relative flex w-full max-w-[360px] items-start gap-3 overflow-hidden rounded-[2px] border border-(--is-line) bg-(--is-panel) py-3 pl-3.5 pr-2 sm:w-[360px]"
          >
            <span aria-hidden className={`${MONO} pt-px text-[12px] ${t.tone === "fault" ? "text-(--is-fault)" : t.tone === "info" ? "text-(--is-teal)" : "text-(--is-frost)"}`}>
              {t.tone === "fault" ? "■" : t.tone === "info" ? "◆" : "✓"}
            </span>
            <p className="min-w-0 flex-1 text-[14px] leading-snug text-(--is-frost)">{t.text}</p>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setList((l) => l.filter((x) => x.id !== t.id))}
              className={`${MONO} -mt-1 size-8 shrink-0 rounded-[2px] text-[14px] text-(--is-steel) ${TRANS} hover:text-(--is-frost) active:bg-(--is-charcoal) ${FR}`}
            >
              ✕
            </button>
            <span aria-hidden className="isd-toast-bar absolute inset-x-0 bottom-0 h-px origin-left bg-(--is-steel)" />
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------- modal dialog with scrim, focus trap, Esc, focus return ---------------- */
export function Modal({ open, onClose, title, kicker, children }: { open: boolean; onClose: () => void; title: string; kicker?: string; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement;
    const el = box.current!;
    const focusables = () => [...el.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter((x) => !x.hasAttribute("disabled"));
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      opener.current?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
      <div aria-hidden onClick={onClose} className="isd-scrim absolute inset-0 bg-(--is-void)/80 backdrop-blur-[6px]" />
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-t`}
        className="isd-dialog is-corners relative max-h-[90dvh] w-full max-w-[560px] overflow-auto rounded-t-[3px] border border-(--is-line) bg-(--is-panel) p-5 sm:rounded-[3px] sm:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {kicker ? <p className={`${LABEL} mb-2 text-(--is-steel)`}>{kicker}</p> : null}
            <h3 id={`${id}-t`} className="text-[26px] font-semibold leading-[1] tracking-[-0.03em] text-(--is-frost)">
              {title}
            </h3>
          </div>
          <button type="button" aria-label="Close dialog" onClick={onClose} className={`${MONO} size-10 shrink-0 rounded-[2px] border border-(--is-line) text-[14px] text-(--is-frost) ${TRANS} hover:border-(--is-frost) active:bg-(--is-charcoal) ${FR}`}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------- more (⋮) menu ---------------- */
export function MoreMenu({ label, items }: { label: string; items: { t: string; on: () => void; disabled?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    itemRefs.current.find((b) => b && !b.disabled)?.focus();
    const onDown = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  const close = () => {
    setOpen(false);
    btn.current?.focus();
  };
  return (
    <div ref={wrap} className="relative">
      <button
        ref={btn}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={`${MONO} inline-flex size-9 items-center justify-center rounded-[2px] text-[18px] leading-none text-(--is-steel) ${TRANS} hover:text-(--is-frost) active:bg-(--is-charcoal) aria-expanded:bg-(--is-charcoal) aria-expanded:text-(--is-frost) ${FR}`}
      >
        ⋮
      </button>
      {open ? (
        <div
          id={id}
          role="menu"
          aria-label={label}
          onKeyDown={(e) => {
            const enabled = itemRefs.current.filter((b): b is HTMLButtonElement => !!b && !b.disabled);
            const i = enabled.indexOf(document.activeElement as HTMLButtonElement);
            if (e.key === "Escape") (e.preventDefault(), close());
            if (e.key === "ArrowDown") (e.preventDefault(), enabled[(i + 1) % enabled.length]?.focus());
            if (e.key === "ArrowUp") (e.preventDefault(), enabled[(i - 1 + enabled.length) % enabled.length]?.focus());
            if (e.key === "Tab") setOpen(false);
          }}
          className="isd-pop absolute right-0 top-[calc(100%+6px)] z-30 min-w-[210px] rounded-[2px] border border-(--is-line) bg-(--is-void) p-1"
        >
          {items.map((it, i) => (
            <button
              key={it.t}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              role="menuitem"
              type="button"
              disabled={it.disabled}
              tabIndex={-1}
              onClick={() => {
                it.on();
                close();
              }}
              className={`${MONO} ${TRANS} flex min-h-9 w-full items-center rounded-[2px] px-3 text-left text-[11px] uppercase tracking-[0.12em] text-(--is-frost) hover:bg-(--is-panel) active:bg-(--is-charcoal) focus-visible:bg-(--is-panel) ${FR} focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:text-[#5f676e] disabled:hover:bg-transparent`}
            >
              {it.t}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- presentational helpers ---------------- */
export function Spec({ name, use, tokens }: { name: string; use: string; tokens: string }) {
  return (
    <p className={`${MONO} text-[11px] leading-[1.55] tracking-[0.02em] text-(--is-steel)`}>
      <span className="uppercase tracking-[0.14em] text-(--is-frost)">{name}</span>
      <span aria-hidden> · </span>
      {use}
      <span aria-hidden> · </span>
      <span className="text-(--is-steel)">{tokens}</span>
    </p>
  );
}

export function Panel({
  code,
  title,
  spec,
  children,
  className = "",
  id,
  novel,
  bodyClass = "",
}: {
  code: string;
  title: string;
  spec?: { use: string; tokens: string };
  children: ReactNode;
  className?: string;
  id?: string;
  novel?: string;
  bodyClass?: string;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className={`is-corners relative flex min-w-0 scroll-mt-28 flex-col rounded-[2px] border border-(--is-line) bg-(--is-panel) ${className}`}>
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-(--is-line) px-4 py-2.5">
        <span className={`${LABEL} text-(--is-steel)`}>[ {code} ]</span>
        <h3 id={id ? `${id}-h` : undefined} className={`${LABEL} text-(--is-frost)`}>
          {title}
        </h3>
        {novel ? <span className={`${LABEL} ml-auto text-(--is-frost)`}>Novel · from {novel}</span> : null}
      </header>
      <div className={`flex flex-1 flex-col gap-5 p-4 sm:p-5 ${bodyClass}`}>{children}</div>
      {spec ? (
        <footer className="border-t border-(--is-line) px-4 py-3">
          <Spec name={title} use={spec.use} tokens={spec.tokens} />
        </footer>
      ) : null}
    </section>
  );
}
