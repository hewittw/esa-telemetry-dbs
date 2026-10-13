// The Parts-of-an-Interface sheet: all 18 slide elements as one contact sheet, each named with the
// slide's own name and subtitle, drawn with the live components' class strings (inert thumbnails),
// and each tile a link to the full, interactive specimen.
import type { ReactNode } from "react";
import {
  FOCUS, IconArrow, IconCheck, IconChevron, IconCross, IconInfo, IconMenu, IconMore, MONO, SANS, SERIF, btnPrimary, btnSecondary, chip, chipCheck, radio,
  seg, segTrack, switchKnob, switchTrack, checkbox,
} from "./kit";

const sk = (w: string, h = "h-[5px]") => <span className={`block ${h} rounded-[1px] bg-[var(--rule-strong)]`} style={{ width: w }} />;

const PARTS: { n: string; sub: string; href: string; art: ReactNode }[] = [
  { n: "Hero", sub: "The big opening section", href: "#p-hero", art: <span className="block w-full rounded-[2px] border border-[var(--rule)] bg-[var(--paper)] p-2.5"><span className={`${SERIF} block text-[17px] leading-none font-light`}>18 to 29 modes</span><span className="mt-1.5 block space-y-1">{sk("80%")}</span><span className="mt-2 block h-[9px] w-12 rounded-[2px] bg-[var(--accent)]" /></span> },
  { n: "Card", sub: "One item, one box", href: "#s-4-15-4-16", art: <span className="block w-[8.5rem] rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] p-2.5"><span className={`${MONO} block text-[10px] tracking-[0.08em] text-[var(--muted)] uppercase`}>GMM · M1</span><span className={`${MONO} mt-1 block text-[18px] leading-none`}>0.384</span><span className="mt-1.5 block">{sk("70%")}</span></span> },
  { n: "Primary button", sub: "Filled", href: "#s-4-1-4-2", art: <span className={btnPrimary}>Explore</span> },
  { n: "Secondary button", sub: "Outlined", href: "#s-4-1-4-2", art: <span className={btnSecondary}>Read the paper</span> },
  { n: "Menu and More", sub: "≡ opens a menu, ⋮ more actions", href: "#p-menus", art: <span className="flex gap-2">{[<IconMenu key="m" />, <IconMore key="o" />].map((i, k) => <span key={k} className="grid size-10 place-items-center rounded-[3px] border border-[var(--ink)]">{i}</span>)}</span> },
  { n: "Segmented control", sub: "Material: segmented buttons", href: "#s-4-10", art: <span className={segTrack}>{["M1", "M2", "Both"].map((t, i) => <span key={t} aria-checked={i === 0} className={seg}>{t}</span>)}</span> },
  { n: "Switch", sub: "Also: toggle", href: "#s-4-8", art: <span className={`${SANS} inline-flex items-center gap-3 text-[13.5px]`}>Anomaly bands<span aria-checked className={switchTrack}><span className={switchKnob} /></span></span> },
  { n: "Checkbox", sub: "Pick many", href: "#s-4-6", art: <span className="space-y-1.5">{[["CapacityVAE", true], ["TransformerVAE", false]].map(([t, c]) => <span key={String(t)} className={`${SANS} flex items-center gap-2 text-[13px]`}><span className="relative grid"><input type="checkbox" readOnly checked={!!c} tabIndex={-1} className={checkbox} />{c && <IconCheck size={12} className="pointer-events-none absolute inset-0 m-auto text-[var(--paper)]" />}</span>{t}</span>)}</span> },
  { n: "Radio", sub: "Pick one", href: "#s-4-7", art: <span className="space-y-1.5">{[["99th percentile", true], ["98.5th", false]].map(([t, c]) => <span key={String(t)} className={`${SANS} flex items-center gap-2 text-[13px]`}><input type="radio" readOnly checked={!!c} tabIndex={-1} className={radio} />{t}</span>)}</span> },
  { n: "Pills", sub: "Material: filter chips. Also: tags", href: "#cmp-list", art: <span className="flex flex-wrap justify-center gap-1.5"><span aria-pressed className={chip}><IconCheck size={11} className={chipCheck} />GMM</span><span className={chip}>VAE</span><span className={chip}>Baseline</span></span> },
  { n: "Toast", sub: "Material: snackbar. It goes away.", href: "#p-toast", art: <span className="relative block w-[10rem] rounded-[3px] border border-[var(--ink)] bg-[var(--mount)] px-2.5 py-2 shadow-[var(--lift)]"><span className={`${SANS} flex items-center justify-between gap-2 text-[12px] font-medium`}><span className="inline-flex items-center gap-1.5"><IconCheck size={10} className="text-[var(--sage)]" />Pinned</span><span className="underline underline-offset-2">Undo</span></span><span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-[.6] bg-[var(--ink)]" /></span> },
  { n: "Banner", sub: "It stays until dismissed", href: "#p-banner", art: <span className="block w-full rounded-[3px] border border-[var(--ink)] bg-[var(--parchment)] px-2.5 py-2"><span className={`${SANS} flex items-center justify-between gap-2 text-[11.5px] font-semibold`}><span className="inline-flex items-center gap-1.5"><IconInfo size={11} />Earlier saved runs</span><IconCross size={10} /></span><span className="mt-1.5 block">{sk("75%", "h-[4px]")}</span></span> },
  { n: "Badge", sub: "A count or a status dot", href: "#s-4-17", art: <span className="relative inline-flex"><span className={`${SANS} inline-flex h-10 items-center rounded-[3px] border border-[var(--ink)] px-3.5 text-[13.5px] font-medium`}>Events</span><span className={`${MONO} absolute -top-2 -right-2 grid h-5 min-w-5 place-items-center rounded-[2px] bg-[var(--ink)] px-1 text-[11px] text-[var(--paper)]`}>3</span></span> },
  { n: "Skeleton screen", sub: "Also: skeleton loader", href: "#p-skeleton", art: <span className="block w-full space-y-1.5 rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] p-2.5"><span className="rpd-skel block h-2.5 w-1/3" /><span className="rpd-skel block h-4 w-3/4" /><span className="rpd-skel block h-2.5 w-1/2" /></span> },
  { n: "Tooltip", sub: "On hover or focus", href: "#p-tooltip", art: <span className="flex flex-col items-center"><span className={`${SANS} rounded-[2px] bg-[var(--ink)] px-2 py-1 text-[11.5px] text-[var(--paper)]`}>Area under the PR curve</span><span className="-mt-px size-0 border-x-[5px] border-t-[5px] border-x-transparent border-t-[var(--ink)]" /><span className={`${MONO} mt-1 border-b border-dotted border-[var(--ink)] text-[13px]`}>PR-AUC</span></span> },
  { n: "Modal dialog", sub: "With a scrim behind it", href: "#s-4-15-4-16", art: <span className="grid h-[5.25rem] w-full place-items-center rounded-[2px] bg-[rgba(33,31,27,0.38)]"><span className="block w-[62%] rounded-[3px] border border-[var(--ink)] bg-[var(--mount)] p-2 shadow-[var(--lift)]">{sk("80%")}<span className="mt-2 flex justify-end gap-1"><span className="h-3 w-7 rounded-[2px] border border-[var(--rule-strong)]" /><span className="h-3 w-9 rounded-[2px] bg-[var(--accent)]" /></span></span></span> },
  { n: "Accordion", sub: "Sections that open and close", href: "#p-accordion", art: <span className="block w-full divide-y divide-[var(--rule)] border-y border-[var(--rule)]">{[["Why PR-AUC?", true], ["What is a group?", false]].map(([t, o]) => <span key={String(t)} className="block py-1.5"><span className={`${SERIF} flex items-center justify-between text-[13.5px]`}>{t}<span className={MONO}>{o ? "−" : "+"}</span></span>{o && <span className="mt-1 block">{sk("85%", "h-[4px]")}</span>}</span>)}</span> },
  { n: "Empty state", sub: "When there’s nothing yet", href: "#p-empty", art: <span className="flex w-full flex-col items-center gap-1.5 rounded-[3px] border border-dashed border-[var(--rule-strong)] px-2 py-2.5"><span className={`${SERIF} text-[13.5px]`}>No anomalies here</span><span className={`${SANS} inline-flex h-7 items-center gap-1 rounded-[3px] border border-[var(--rule-strong)] px-2 text-[11.5px] font-medium`}>Widen the window <IconChevron size={10} className="-rotate-90" /></span></span> },
];

export function PartsSheet() {
  return (
    <ol className="grid grid-cols-2 gap-px rounded-[3px] border border-[var(--rule)] bg-[var(--rule)] md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
      {PARTS.map((p, i) => (
        <li key={p.n} className="relative bg-[var(--paper)] focus-within:z-10">
          <a href={p.href} className={`${FOCUS} group flex h-full flex-col transition-colors duration-200 hover:bg-[var(--mount)] active:bg-[var(--parchment)]`}>
            <span inert aria-hidden className="pointer-events-none grid h-[7.25rem] place-items-center overflow-hidden px-4 pt-4 max-sm:h-[5.75rem] max-sm:px-2.5 max-sm:pt-3 max-sm:[zoom:0.78]">{p.art}</span>
            <span className="flex flex-1 items-start gap-2 px-4 pt-2 pb-3.5 max-sm:px-3">
              <span className={`${MONO} pt-[3px] text-[11px] text-[var(--muted)]`}>{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0">
                <span className={`${SANS} flex items-center gap-1.5 text-[14px] font-semibold text-[var(--ink)]`}>{p.n}<IconArrow size={10} className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100" /></span>
                <span className={`${SANS} block text-[12.5px] leading-[1.35] text-[var(--muted)]`}>{p.sub}</span>
              </span>
            </span>
          </a>
        </li>
      ))}
    </ol>
  );
}
