"use client";

// The page's sticky section index. Desktop: a left rail in the transformer-circuits manner
// (handout sections bold, the rest regular, the current one in ink with a hairline bar).
// Phones and tablets: a sticky top bar with a ≡ Contents menu that names the current section.
import { useEffect, useRef, useState } from "react";
import { FOCUS, IconMenu, MONO, SANS } from "./kit";

export type IndexItem = { id: string; n: string; t: string; tier: 1 | 2; subs?: { id: string; n: string; t: string }[] };

function useSpy(ids: string[]) {
  const [cur, setCur] = useState(ids[0]);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (es) => {
        const vis = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setCur(vis[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [ids]);
  return cur;
}

const item = (on: boolean, tier: 1 | 2) =>
  `${SANS} ${FOCUS} flex items-baseline gap-2.5 rounded-[2px] py-1 pl-3 text-[13px] leading-snug transition-colors duration-200 hover:text-[var(--ink)] ${tier === 1 ? "font-semibold" : "font-normal"} ${on ? "text-[var(--ink)] shadow-[inset_2px_0_0_var(--ink)]" : tier === 1 ? "text-[var(--ink-soft)]" : "text-[var(--muted)]"}`;

export function SectionIndex({ items }: { items: IndexItem[] }) {
  const ids = useRef(items.map((i) => i.id)).current;
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
  const curItem = items.find((i) => i.id === cur)!;
  // In the phone menu the current section also lists its components, so a 40k-px page is two taps deep at most.
  const List = ({ onPick, subs }: { onPick?: () => void; subs?: boolean }) => (
    <ol className="space-y-0.5">
      {items.map((it, k) => (
        <li key={it.id} className={it.tier === 2 && items[k - 1]?.tier === 1 ? "mt-3 border-t border-[var(--rule)] pt-3" : ""}>
          <a href={`#${it.id}`} onClick={onPick} aria-current={cur === it.id ? "location" : undefined} className={item(cur === it.id, it.tier)}>
            <span className={`${MONO} w-5 shrink-0 text-[11px] font-normal text-[var(--muted)]`}>{it.n}</span>
            {it.t}
          </a>
          {subs && cur === it.id && it.subs && (
            <ol aria-label={`In ${it.t}`} className="mt-1 mb-2 ml-[2.1rem] grid grid-cols-2 gap-x-3 border-l border-[var(--rule)] pl-2">
              {it.subs.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} onClick={onPick} className={`${SANS} ${FOCUS} flex min-h-9 items-center gap-1.5 rounded-[2px] px-1.5 text-[12.5px] text-[var(--ink-soft)] transition-colors duration-200 hover:bg-[var(--parchment)] hover:text-[var(--ink)] active:bg-[var(--rule)]`}>
                    <span className={`${MONO} text-[10.5px] text-[var(--muted)]`}>{s.n}</span>
                    <span className="min-w-0 truncate">{s.t}</span>
                  </a>
                </li>
              ))}
            </ol>
          )}
        </li>
      ))}
    </ol>
  );
  return (
    <>
      {/* phones + tablets */}
      <div ref={box} className="sticky top-0 z-40 -mx-5 border-b border-[var(--rule)] bg-[var(--paper)]/95 px-5 backdrop-blur-[2px] md:-mx-10 md:px-10 min-[1100px]:hidden">
        <div className="flex h-14 items-center gap-3">
          <button type="button" aria-expanded={open} aria-controls="rpd-index-menu" onClick={() => setOpen((o) => !o)} className={`${SANS} ${FOCUS} inline-flex h-10 items-center gap-2 rounded-[3px] border border-[var(--rule-strong)] px-3 text-[13px] font-medium transition-colors duration-200 hover:border-[var(--ink)] hover:bg-[var(--parchment)] active:bg-[var(--rule)] aria-expanded:border-[var(--ink)] aria-expanded:bg-[var(--parchment)]`}>
            <IconMenu size={14} /> Contents
          </button>
          <p className={`${SANS} min-w-0 truncate text-[13px] text-[var(--muted)]`} aria-live="polite">
            <span className={`${MONO} mr-1.5 text-[11px]`}>{curItem.n}</span>
            <span className="text-[var(--ink)]">{curItem.t}</span>
          </p>
        </div>
        {open && (
          <nav id="rpd-index-menu" aria-label="Sections" className="rpd-rise absolute inset-x-5 top-full mt-1 max-h-[70dvh] overflow-y-auto rounded-[3px] border border-[var(--ink)] bg-[var(--mount)] py-3 pr-3 shadow-[var(--lift)] md:inset-x-10 md:max-w-[22rem]">
            <List subs onPick={() => setOpen(false)} />
          </nav>
        )}
      </div>
      {/* desktop rail */}
      <nav aria-label="Sections" className="sticky top-8 hidden max-h-[calc(100dvh-4rem)] self-start overflow-y-auto pt-1 min-[1100px]:block">
        <p className={`${MONO} mb-3 pl-3 text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>Contents</p>
        <List />
      </nav>
    </>
  );
}
