"use client";

// Site chrome: the sticky contents (a left rail on desktop, a ≡ Contents bar on phones and tablets)
// and the hero's two actions, which need the reader.
import { useEffect, useRef, useState } from "react";
import { FOCUS, IconArrow, IconMenu, MONO, SANS, btnPrimary, btnSecondary } from "../../design-systems/refined-paper/kit";
import { PAGES, PAGE_NOTES, PDF, useReader } from "./reader";

export const SECTIONS = [
  { id: "glance", n: "§1", t: "At a glance" },
  { id: "structure", n: "§2", t: "Groups, not subsystems" },
  { id: "methods", n: "§3", t: "Five families, two missions" },
  { id: "evidence", n: "§4", t: "Why one threshold fails" },
  { id: "paper", n: "§5", t: "The paper" },
];

function useSpy(ids: string[]) {
  const [cur, setCur] = useState<string | null>(null);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    // The current section is the last one whose top has passed 30% of the viewport.
    const on = () => {
      const line = innerHeight * 0.3;
      let c: string | null = null;
      for (const el of els) if (el.getBoundingClientRect().top <= line) c = el.id;
      setCur(c);
    };
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    on();
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); };
  }, [ids]);
  return cur;
}

const ids = SECTIONS.map((s) => s.id);

function List({ cur, onPick }: { cur: string | null; onPick?: () => void }) {
  return (
    <ol className="space-y-0.5">
      {SECTIONS.map((s) => (
        <li key={s.id}>
          <a href={`#${s.id}`} onClick={onPick} aria-current={cur === s.id ? "location" : undefined}
            className={`${SANS} ${FOCUS} flex min-h-9 items-baseline gap-2.5 rounded-[2px] py-1.5 pl-3 text-[13px] leading-snug transition-colors duration-200 hover:bg-[var(--parchment)]/60 hover:text-[var(--ink)] active:bg-[var(--parchment)] ${cur === s.id ? "font-semibold text-[var(--ink)] shadow-[inset_2px_0_0_var(--ink)]" : "text-[var(--muted)]"}`}>
            <span className={`${MONO} w-5 shrink-0 text-[11px] font-normal text-[var(--muted)]`}>{s.n}</span>
            {s.t}
          </a>
        </li>
      ))}
    </ol>
  );
}

export function Contents() {
  const cur = useSpy(ids);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); };
  }, [open]);
  const curItem = SECTIONS.find((s) => s.id === cur);
  return (
    <>
      <div ref={box} className="sticky top-0 z-40 -mx-5 border-b border-[var(--rule)] bg-[var(--paper)]/95 px-5 backdrop-blur-[2px] md:-mx-10 md:px-10 min-[1100px]:hidden">
        <div className="flex h-14 items-center gap-3">
          <button type="button" aria-expanded={open} aria-controls="rps-menu" onClick={() => setOpen((o) => !o)}
            className={`${SANS} ${FOCUS} inline-flex h-10 items-center gap-2 rounded-[3px] border border-[var(--rule-strong)] px-3 text-[13px] font-medium transition-colors duration-200 hover:border-[var(--ink)] hover:bg-[var(--parchment)] active:bg-[var(--rule)] aria-expanded:border-[var(--ink)] aria-expanded:bg-[var(--parchment)]`}>
            <IconMenu size={14} /> Contents
          </button>
          <p className={`${SANS} min-w-0 truncate text-[13px] text-[var(--muted)]`} aria-live="polite">
            {curItem ? <><span className={`${MONO} mr-1.5 text-[11px]`}>{curItem.n}</span><span className="text-[var(--ink)]">{curItem.t}</span></> : "ESA telemetry"}
          </p>
        </div>
        {open && (
          <nav id="rps-menu" aria-label="Sections" className="rpd-rise absolute inset-x-5 top-full mt-1 max-h-[70dvh] overflow-y-auto rounded-[3px] border border-[var(--ink)] bg-[var(--mount)] py-3 pr-3 shadow-[var(--lift)] md:inset-x-10 md:max-w-[22rem]">
            <List cur={cur} onPick={() => setOpen(false)} />
          </nav>
        )}
      </div>
      <nav aria-label="Sections" className="sticky top-10 hidden self-start pt-2 min-[1100px]:block">
        <p className={`${MONO} mb-3 pl-3 text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>Contents</p>
        <List cur={cur} />
      </nav>
    </>
  );
}

export function HeroActions() {
  const open = useReader();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className={`${btnPrimary} h-11 px-5 text-[15px]`} onClick={() => open(1)}>
        Read the paper <IconArrow />
      </button>
      <a href={PDF} download className={`${btnSecondary} h-11 px-5 text-[15px]`}>
        <svg aria-hidden width="12" height="12" viewBox="0 0 12 12"><path d="M6 1.5v6.5M3 5.5 6 8.5l3-3M2 10.5h8" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
        Download PDF
      </a>
    </div>
  );
}

/** §5: the paper as a contact sheet; any page opens the reader there. */
export function PaperSheet() {
  const open = useReader();
  return (
    <ol className="grid grid-cols-3 gap-x-3 gap-y-5 min-[520px]:grid-cols-4 md:grid-cols-6" aria-label="Pages of the paper">
      {Array.from({ length: PAGES }, (_, k) => k + 1).map((p) => (
        <li key={p}>
          <button type="button" onClick={() => open(p)} aria-label={`Open page ${p}: ${PAGE_NOTES[p][0].t}`}
            className={`${FOCUS} group block w-full rounded-[2px] text-left`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/paper/pages/thumb-${String(p).padStart(2, "0")}.jpg`} alt="" width={320} height={415} loading="lazy"
              className="rps-sheet block h-auto w-full transition-transform duration-300 ease-[cubic-bezier(.22,.61,.36,1)] group-hover:-translate-y-1 group-active:translate-y-0" />
            <span className={`${MONO} mt-2.5 block text-[11px] text-[var(--muted)] transition-colors duration-200 group-hover:text-[var(--ink)]`}>p. {p}</span>
          </button>
        </li>
      ))}
      <li className="flex flex-col justify-end">
        <button type="button" onClick={() => open(1)} className={`${btnSecondary} w-full`}>Open the reader <IconArrow /></button>
      </li>
    </ol>
  );
}
