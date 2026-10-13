"use client";

// Parts of an Interface · the slide sheet. The slide's 16 tiles (18 elements: buttons and
// menu/more are pairs) in its own 4 × 4 order, each named with the slide's title + subtitle and
// drawn in this system. Each tile links to the live, every-state version on this page.
import type { ReactNode } from "react";
import { BTN, CHIP_FORCED, DOT, MONO } from "./ui";

const box = "flex h-full w-full items-center justify-center";

const TILES: { n: string; name: string; sub: string; href: string; where: string; art: ReactNode }[] = [
  {
    n: "01",
    name: "Hero",
    sub: "The big opening section",
    href: "#p-hero",
    where: "P.01",
    art: (
      <span className="relative flex h-[92px] w-full max-w-[220px] flex-col justify-end gap-1.5 overflow-hidden rounded-[2px] bg-(--is-charcoal) p-2.5">
        <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {Array.from({ length: 34 }).map((_, i) => (
            <line key={i} x1={i * 3 + 1} x2={i * 3 + 2.5} y1="0" y2="40" stroke={i === 22 ? "#E04FD6" : "#37FD08"} strokeOpacity={i === 22 ? 0.8 : 0.1 + ((i * 7) % 10) / 22} strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        <span className="relative h-2.5 w-3/4 rounded-[1px] bg-(--is-frost)" />
        <span className="relative h-2.5 w-1/2 rounded-[1px] bg-(--is-frost)" />
        <span className="relative mt-1 h-3 w-12 rounded-[2px] bg-(--is-fiber)" />
      </span>
    ),
  },
  {
    n: "02",
    name: "Card",
    sub: "One item, one box",
    href: "#c-card",
    where: "4.7",
    art: (
      <span className="is-corners flex w-full max-w-[170px] flex-col gap-1 rounded-[2px] border border-(--is-line) bg-(--is-panel) p-2.5">
        <span className={`${MONO} text-[10px] uppercase tracking-[0.12em] text-(--is-steel)`}>[ M2 · TVAE ]</span>
        <span className={`${DOT} text-[30px] font-semibold leading-none text-(--is-frost)`}>0.438</span>
        <span className="h-1.5 w-3/4 rounded-[1px] bg-(--is-line)" />
      </span>
    ),
  },
  {
    n: "03 · 04",
    name: "Primary and Secondary Buttons",
    sub: "Filled, and outlined",
    href: "#c-buttons",
    where: "4.1",
    art: (
      <span className="flex flex-wrap items-center justify-center gap-2">
        <span className={BTN.primary}>Explore →</span>
        <span className={BTN.secondary}>[ Paper ]</span>
      </span>
    ),
  },
  {
    n: "05 · 06",
    name: "Menu and More",
    sub: "≡ opens a menu, ⋮ more actions",
    href: "#p-menu",
    where: "P.02 · 4.7",
    art: (
      <span className="flex gap-3">
        {["≡", "⋮"].map((g) => (
          <span key={g} className={`${MONO} inline-flex size-11 items-center justify-center rounded-[2px] border border-(--is-frost) text-[20px] text-(--is-frost)`}>
            {g}
          </span>
        ))}
      </span>
    ),
  },
  {
    n: "07",
    name: "Segmented Control",
    sub: "Material: segmented buttons",
    href: "#p-seg",
    where: "P.03",
    art: (
      <span className="inline-flex rounded-[3px] border border-(--is-line) p-0.5">
        {["PR", "ROC", "F1"].map((t, i) => (
          <span key={t} className={`${MONO} inline-flex min-h-8 items-center rounded-[2px] px-3 text-[11px] uppercase tracking-[0.12em] ${i === 1 ? "bg-(--is-frost) text-(--is-void)" : "text-(--is-steel)"}`}>
            {t}
          </span>
        ))}
      </span>
    ),
  },
  {
    n: "08",
    name: "Switch",
    sub: "Also: toggle",
    href: "#c-select",
    where: "4.3",
    art: (
      <span className="flex items-center gap-3 text-[14px] text-(--is-frost)">
        Fault bands
        <span className="relative inline-flex h-5 w-9 rounded-full border border-(--is-frost) bg-(--is-frost)">
          <span className="absolute left-[19px] top-[3px] size-3 rounded-full bg-(--is-void)" />
        </span>
      </span>
    ),
  },
  {
    n: "09",
    name: "Checkbox and Radio",
    sub: "Pick many, or pick one",
    href: "#c-select",
    where: "4.3",
    art: (
      <span className="grid grid-cols-2 gap-x-6 gap-y-2 text-[14px] text-(--is-frost)">
        {[
          ["GMM", true],
          ["KPCA", false],
        ].map(([t, on], i) => (
          <span key={t as string} className="contents">
            <span className="flex items-center gap-2">
              <span className={`inline-flex size-4 items-center justify-center rounded-[2px] border text-[10px] ${on ? "border-(--is-frost) bg-(--is-frost) text-(--is-void)" : "border-(--is-steel)"}`}>{on ? "✓" : ""}</span>
              {t}
            </span>
            <span className="flex items-center gap-2">
              <span className="relative inline-flex size-4 rounded-full border border-(--is-steel)">{i === 0 ? <span className="absolute inset-[3px] rounded-full bg-(--is-frost)" /> : null}</span>
              {i === 0 ? "M1" : "M2"}
            </span>
          </span>
        ))}
      </span>
    ),
  },
  {
    n: "10",
    name: "Pills",
    sub: "Material: filter chips. Also: tags",
    href: "#c-chips",
    where: "4.6",
    art: (
      <span className="flex flex-wrap justify-center gap-1.5">
        <span className={CHIP_FORCED.Selected}>● Generative</span>
        <span className={CHIP_FORCED.Rest}>○ Parametric</span>
        <span className={CHIP_FORCED.Rest}>○ Baseline</span>
      </span>
    ),
  },
  {
    n: "11",
    name: "Toast",
    sub: "Material: snackbar. It goes away.",
    href: "#p-toast",
    where: "P.04",
    art: (
      <span className="relative flex w-full max-w-[230px] items-center gap-2.5 overflow-hidden rounded-[2px] border border-(--is-line) bg-(--is-panel) px-3 py-2.5">
        <span className={`${MONO} text-[12px] text-(--is-frost)`}>✓</span>
        <span className="flex-1 text-[13px] text-(--is-frost)">Threshold set to τ99</span>
        <span className={`${MONO} text-[11px] uppercase tracking-[0.12em] text-(--is-frost) underline decoration-(--is-steel) underline-offset-4`}>Undo</span>
        <span className="absolute bottom-0 left-0 h-px w-2/3 bg-(--is-steel)" />
      </span>
    ),
  },
  {
    n: "12",
    name: "Banner",
    sub: "It stays until dismissed",
    href: "#p-toast",
    where: "P.04",
    art: (
      <span className="flex w-full max-w-[230px] items-start gap-2 rounded-[2px] border border-(--is-teal) bg-(--is-void) px-3 py-2.5">
        <span className={`${MONO} text-[12px] text-(--is-teal)`}>◆</span>
        <span className="flex-1 text-[13px] leading-snug text-(--is-frost)">Compare within a family first.</span>
        <span className={`${MONO} text-[12px] text-(--is-steel)`}>✕</span>
      </span>
    ),
  },
  {
    n: "13",
    name: "Badge",
    sub: "A count or a status dot",
    href: "#c-badges",
    where: "4.9",
    art: (
      <span className="flex items-center gap-5">
        <span className={`${BTN.secondary} relative`}>
          [ Events ]
          <span className={`${MONO} absolute -right-2.5 -top-2.5 inline-flex min-w-6 items-center justify-center rounded-[2px] bg-(--is-frost) px-1 text-[10px] leading-[18px] text-(--is-void)`}>200</span>
        </span>
        <span className={`${MONO} text-[11px] uppercase tracking-[0.12em] text-(--is-fiber)`}>● Live</span>
      </span>
    ),
  },
  {
    n: "14",
    name: "Skeleton Screen",
    sub: "Also: skeleton loader",
    href: "#p-skel",
    where: "P.05",
    art: (
      <span className="flex w-full max-w-[220px] flex-col gap-2 rounded-[2px] border border-(--is-line) bg-(--is-panel) p-3">
        <span className="flex items-center gap-2">
          <span className="isd-skel size-6" />
          <span className="isd-skel h-2.5 flex-1" />
        </span>
        <span className="isd-skel h-2.5 w-full" />
        <span className="isd-skel h-2.5 w-2/3" />
      </span>
    ),
  },
  {
    n: "15",
    name: "Tooltip",
    sub: "On hover or focus",
    href: "#p-tip",
    where: "P.06",
    art: (
      <span className="flex flex-col items-center gap-2.5">
        <span className={`${MONO} relative rounded-[2px] border border-(--is-line) bg-(--is-void) px-3 py-1.5 text-[11px] text-(--is-frost)`}>
          PR-AUC = average precision
          <span className="absolute -bottom-[5px] left-1/2 size-2 -translate-x-1/2 rotate-45 border-b border-r border-(--is-line) bg-(--is-void)" />
        </span>
        <span className={`${MONO} inline-flex size-7 items-center justify-center rounded-full border border-(--is-frost) text-[12px] text-(--is-frost)`}>i</span>
      </span>
    ),
  },
  {
    n: "16",
    name: "Modal Dialog",
    sub: "With a scrim behind it",
    href: "#c-modal",
    where: "4.10",
    art: (
      <span className="relative flex h-[92px] w-full max-w-[230px] items-center justify-center overflow-hidden rounded-[2px] border border-(--is-line) bg-(--is-panel)">
        <span className="absolute inset-x-3 top-3 h-1.5 rounded-[1px] bg-(--is-line)" />
        <span className="absolute inset-x-3 top-7 h-1.5 w-1/2 rounded-[1px] bg-(--is-line)" />
        <span className="absolute inset-0 bg-(--is-void)/80" />
        <span className="is-corners relative flex w-3/5 flex-col gap-1.5 rounded-[2px] border border-(--is-line) bg-(--is-panel) p-2">
          <span className="h-2 w-3/4 rounded-[1px] bg-(--is-frost)" />
          <span className="h-1.5 w-full rounded-[1px] bg-(--is-line)" />
          <span className="mt-0.5 flex justify-end gap-1">
            <span className="h-3 w-7 rounded-[2px] border border-(--is-line)" />
            <span className="h-3 w-7 rounded-[2px] bg-(--is-fiber)" />
          </span>
        </span>
      </span>
    ),
  },
  {
    n: "17",
    name: "Accordion",
    sub: "Sections that open and close",
    href: "#p-acc",
    where: "P.07",
    art: (
      <span className="flex w-full max-w-[230px] flex-col border-t border-(--is-line)">
        {["Why PR-AUC?", "What is the plateau?", "Why M2 only?"].map((q, i) => (
          <span key={q} className="flex flex-col border-b border-(--is-line) py-1.5">
            <span className="flex items-center justify-between text-[13px] text-(--is-frost)">
              {q}
              <span className={`${MONO} text-(--is-steel)`}>{i === 1 ? "×" : "+"}</span>
            </span>
            {i === 1 ? <span className="mt-1.5 h-1.5 w-4/5 rounded-[1px] bg-(--is-line)" /> : null}
          </span>
        ))}
      </span>
    ),
  },
  {
    n: "18",
    name: "Empty State",
    sub: "When there's nothing yet",
    href: "#p-empty",
    where: "P.08",
    art: (
      <span className="flex flex-col items-center gap-1.5">
        <span className={`${DOT} text-[28px] font-semibold leading-none text-(--is-steel)`}>00</span>
        <span className="text-[13px] text-(--is-frost)">No pinned runs yet</span>
        <span className={`${BTN.secondary} min-h-7 px-2.5 text-[10px]`}>[ Pin two runs ]</span>
      </span>
    ),
  },
];

export function PartsSheet() {
  return (
    <nav aria-label="Parts of an interface, all 18 slide elements" className="mb-3">
      <ol className="grid grid-cols-1 gap-px overflow-hidden rounded-[2px] border border-(--is-line) bg-(--is-line) min-[520px]:grid-cols-2 lg:grid-cols-4">
        {TILES.map((t) => (
          <li key={t.name} className="flex">
            <a
              href={t.href}
              className="group flex w-full flex-col bg-(--is-panel) transition-colors duration-200 hover:bg-(--is-void) active:bg-(--is-charcoal) focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--is-frost)"
            >
              <span aria-hidden className={`${box} min-h-[132px] border-b border-(--is-line) px-4 py-5`}>
                {t.art}
              </span>
              <span className="flex flex-1 flex-col gap-1 px-4 pb-3.5 pt-3">
                <span className={`${MONO} flex justify-between gap-3 text-[10px] uppercase tracking-[0.14em] text-(--is-steel)`}>
                  <span>{t.n}</span>
                  <span className="transition-colors duration-200 group-hover:text-(--is-frost)">
                    Live · {t.where} <span aria-hidden>↘</span>
                  </span>
                </span>
                <span className="text-[17px] font-semibold leading-tight tracking-[-0.01em] text-(--is-frost)">{t.name}</span>
                <span className="text-[13px] leading-snug text-(--is-steel)">{t.sub}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
