import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import type { ReactNode } from "react";
import "./rpd.css";
import {
  contrast, getBic, getCatalogue, getChannels, getGmm, getLongest, getMissions, getPr, getTable1, getTimelines,
} from "./data";
import {
  FOCUS, IconArrow, IconCheck, IconCross, IconWarn, MONO, SANS, SERIF, btnPrimary, btnSecondary, caption, chip, chipCheck, field, link, seg,
  segTrack, switchKnob, switchTrack, tab,
} from "./kit";
import { ToastProvider } from "./ui";
import {
  AccordionDemo, BadgeDemo, BannerDemo, ButtonsDemo, CardModalDemo, CheckboxDemo, ChipsListDemo, ColorAloneDemo, EmphasisDemo, EmptyState,
  FocusDemo, HeroSpecimen, InputDemo, LinkDemo, MenusDemo, MotionDemo, RadioDemo, SegmentedDemo, SelectDemo, SkeletonDemo, SliderDemo, SwitchDemo,
  TabsDemo, ToastDemo, TooltipDemo, UiStates,
} from "./demos";
import {
  BicPlayer, FindingsGrid, GiantStat, KeyedDrag, LinkedCitations, LinkedMultiples, ScrollyChannels, TocFragment, TwinScrubber, TwoTierDiagram,
} from "./novel";
import { AlertBudget, EventCard, MissionSwitch, PrViewer, ResultsTable, SpecCard, SubVsGroup, TimelineScrubber } from "./telemetry";
import { SectionIndex, type IndexItem } from "./index-nav";

const serif = Newsreader({ subsets: ["latin"], axes: ["opsz"], style: ["normal", "italic"], variable: "--rp-serif-face" });
const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--rp-sans-face" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--rp-mono-face" });

export const metadata: Metadata = {
  title: "Lucid · Patient · Inked · Design System",
  description: "The refined-paper design system for our ESA telemetry findings: warm paper, Newsreader and IBM Plex, ink-blue plot lines keyed to prose, one vermilion action.",
};

const INDEX: IndexItem[] = [
  { id: "color", n: "1", t: "Color roles", tier: 1 },
  { id: "type", n: "2", t: "Type roles", tier: 1 },
  { id: "space", n: "3", t: "Spacing & shape", tier: 1 },
  { id: "components", n: "4", t: "Components", tier: 1 },
  { id: "states", n: "5", t: "Control states", tier: 1 },
  { id: "ui-states", n: "6", t: "UI states", tier: 1 },
  { id: "parts", n: "P", t: "Parts of an interface", tier: 2 },
  { id: "novel", n: "N", t: "Novel", tier: 2 },
  { id: "telemetry", n: "T", t: "Telemetry", tier: 2 },
];

/* ------------------------------------------------------------------ layout helpers */
function Section({ id, n, title, lead, children }: { id: string; n: string; title: string; lead: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="border-t border-[var(--ink)] pt-8 pb-24 md:pb-32">
      <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>{n}</p>
      <h2 id={`${id}-h`} className={`${SERIF} mt-2 text-[clamp(2rem,4.2vw,2.75rem)] leading-[1.08] font-[450] tracking-[-0.01em] text-[var(--ink)]`}>{title}</h2>
      <p className={`${SERIF} mt-4 max-w-[60ch] text-[18px] leading-[1.6] text-[var(--ink)] sm:text-[19px]`}>{lead}</p>
      <div className="mt-12">{children}</div>
    </section>
  );
}

function Spec({ id, n, name, use, tokens, children, tag, borrowed, className = "" }: { id?: string; n: string; name: string; use: string; tokens: string; children: ReactNode; tag?: ReactNode; borrowed?: string; className?: string }) {
  return (
    <article id={id} className={`min-w-0 border-t border-[var(--rule)] pt-4 ${className}`}>
      <header className="mb-6">
        {tag}
        <h3 className={`${SANS} flex items-baseline gap-2.5 text-[15px] font-semibold text-[var(--ink)]`}>
          <span className={`${MONO} text-[11px] font-normal text-[var(--muted)]`}>{n}</span>
          {name}
        </h3>
        {borrowed && <p className={`${SERIF} mt-2 max-w-[64ch] text-[15.5px] leading-[1.5] text-[var(--ink)] italic`}>{borrowed}</p>}
        <p className={`${SANS} mt-1.5 max-w-[62ch] text-[13px] leading-[1.5] text-[var(--muted)]`}>{use}</p>
        <p className={`${MONO} mt-1.5 text-[11px] leading-[1.5] break-words text-[var(--muted)]`}>{tokens}</p>
      </header>
      {children}
    </article>
  );
}

function NovelTag({ site }: { site: string }) {
  return (
    <p className={`${MONO} mb-2 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-[var(--ink)]`}>
      <span className="inline-block size-[7px] rotate-45 border border-[var(--ink)]" aria-hidden />Novel · from {site}
    </p>
  );
}

const grid2 = "grid gap-x-12 gap-y-16 xl:grid-cols-2";

/* ------------------------------------------------------------------ section 1 data */
const PAPER = "#F6F2EA";
const ROLES = [
  { role: "Background", name: "Paper", hex: "#F6F2EA", fg: "#211F1B", vsName: "Ink on it", job: "The page, with fractal grain at 4.5%." },
  { role: "Surface", name: "Parchment", hex: "#ECE6D8", fg: "#211F1B", vsName: "Ink on it", job: "Diagram nodes, selected chips, segmented tracks." },
  { role: "Text", name: "Ink", hex: "#211F1B", fg: "#F6F2EA", vsName: "On Paper", job: "Body, headings, axes, focus rings, primary strokes." },
  { role: "Muted text", name: "Pencil", hex: "#69625A", fg: "#F6F2EA", vsName: "On Paper", job: "Captions, labels, tick numerals. Never body." },
  { role: "Border", name: "Rule", hex: "#D9D1C1", fg: "#211F1B", vsName: "On Paper", job: "1px hairlines, card edges, gridlines. Strong rule #B9AF9C for controls." },
  { role: "Accent", name: "Vermilion", hex: "#B0401C", fg: "#FFFFFF", vsName: "White on it", job: "The primary action, and one highlighted path per figure. Nothing else." },
];
const INKS = [
  { name: "Prussian", hex: "#2D5B88", job: "The main plot line; the words that name it" },
  { name: "Ochre", hex: "#8C5E10", job: "A second series (K-Means)" },
  { name: "Sage", hex: "#4F7350", job: "Third series; success words" },
  { name: "Graphite", hex: "#716A5F", job: "Reference lines (positive rate)" },
  { name: "Oxblood", hex: "#6A3E35", job: "Diagram edges; error words" },
  { name: "Band", hex: "#E8DCC2", job: "Labelled-anomaly shading (fill only)" },
];
const PAIRS: [string, string, string, string][] = [
  ["Body: Ink on Paper", "#211F1B", "#F6F2EA", "rpd-serif"],
  ["Caption: Pencil on Paper", "#69625A", "#F6F2EA", "rpd-sans"],
  ["Caption: Pencil on Parchment", "#69625A", "#ECE6D8", "rpd-sans"],
  ["Card text: Ink on Mount", "#211F1B", "#FBF8F2", "rpd-sans"],
  ["Primary: White on Vermilion", "#FFFFFF", "#B0401C", "rpd-sans"],
  ["Primary hover: White on #962F10", "#FFFFFF", "#962F10", "rpd-sans"],
  ["Tooltip: Paper on Ink", "#F6F2EA", "#211F1B", "rpd-sans"],
  ["Keyed word: Prussian on Paper", "#2D5B88", "#F6F2EA", "rpd-serif"],
  ["Keyed word: Ochre on Paper", "#8C5E10", "#F6F2EA", "rpd-serif"],
  ["Success: Sage on Mount", "#4F7350", "#FBF8F2", "rpd-sans"],
  ["Error: Oxblood on #F7EDE8", "#6A3E35", "#F7EDE8", "rpd-sans"],
  ["Accent ink on Paper (K* label)", "#A53B19", "#F6F2EA", "rpd-mono"],
];
const grade = (r: number) => (r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA large" : "Fail");

/* ------------------------------------------------------------------ section 2 data */
const TYPE = [
  { role: "Display", spec: "Newsreader 300 · 72/72 · −2%", note: "Hero numbers and page titles. Up to 140px, −3%.", cls: `${SERIF} text-[clamp(2.9rem,7vw,4.5rem)] leading-none font-light tracking-[-0.02em]`, s: "18 to 29 modes" },
  { role: "Heading", spec: "Newsreader 450 · 32/37 · 0", note: "Section and card titles. Sentence case.", cls: `${SERIF} text-[clamp(1.6rem,3.2vw,2rem)] leading-[1.16] font-[450]`, s: "Five method families, two missions" },
  { role: "Body", spec: "Newsreader 400 · 19/30 · 680px measure", note: "The argument. 17/27 under 640px.", cls: `${SERIF} text-[17px] leading-[1.6] sm:text-[19px] sm:leading-[1.58] max-w-[62ch]`, s: "GMM BIC selects K = 21 for Mission 1 and K = 29 for Mission 2; with 18 and 29 defined groups, flexible density modelling recovers near group-level granularity." },
  { role: "Label", spec: "IBM Plex Sans 500 · 13/17", note: "Controls, chip text, field labels.", cls: `${SANS} text-[13px] leading-[17px] font-medium`, s: "Sort by PR-AUC · Mission 2 · Show anomaly bands" },
  { role: "Caption", spec: "IBM Plex Sans 400 · 12/17 · Pencil", note: "Figure captions; “Figure n.” in 600 Ink.", cls: `${SANS} text-[12px] leading-[17px] text-[var(--muted)]`, s: <><b className="font-semibold text-[var(--ink)]">Figure 3.</b> GMM anomaly score over the Mission 1 test set; bands mark the 89 labelled segments.</> },
  { role: "Numeral", spec: "IBM Plex Mono 400 · 12–14 · tabular", note: "Every number, tick and code token.", cls: `${MONO} text-[14px]`, s: "0.322  0.334  0.384  0.438   K = 21" },
  { role: "Eyebrow", spec: "IBM Plex Mono 400 · 11 · +8% · upper", note: "The only uppercase in the system.", cls: `${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`, s: "Parametric · Mission 1" },
];

/* ------------------------------------------------------------------ section 5: state matrix */
const STATES = ["rest", "hover", "focus", "pressed", "selected", "disabled"] as const;
type St = (typeof STATES)[number];
const MATRIX: { name: string; render: (s: St) => ReactNode | null }[] = [
  { name: "Primary button", render: (s) => s === "selected" ? null : <button type="button" tabIndex={-1} data-s={s} disabled={s === "disabled"} className={btnPrimary}>Explore</button> },
  { name: "Secondary button", render: (s) => s === "selected" ? null : <button type="button" tabIndex={-1} data-s={s} disabled={s === "disabled"} className={btnSecondary}>Read</button> },
  { name: "Filter chip", render: (s) => <button type="button" tabIndex={-1} data-s={s} aria-pressed={s === "selected"} disabled={s === "disabled"} className={chip}><IconCheck size={11} className={chipCheck} />GMM</button> },
  { name: "Tab", render: (s) => <span className="inline-flex border-b border-[var(--rule)]"><button type="button" tabIndex={-1} data-s={s} aria-selected={s === "selected"} disabled={s === "disabled"} className={tab}>Method</button></span> },
  { name: "Segment", render: (s) => <span className={segTrack}><button type="button" tabIndex={-1} data-s={s} aria-checked={s === "selected"} disabled={s === "disabled"} className={seg}>M1</button></span> },
  { name: "Text input", render: (s) => s === "selected" ? <input tabIndex={-1} readOnly aria-invalid value="channel_99" className={`${field} w-[8.5rem] ${MONO} text-[13px]`} /> : <input tabIndex={-1} readOnly data-s={s} disabled={s === "disabled"} placeholder="channel_12" defaultValue={s === "pressed" ? "chann" : ""} className={`${field} w-[8.5rem] ${MONO} text-[13px]`} /> },
  { name: "Switch", render: (s) => <button type="button" tabIndex={-1} role="switch" aria-checked={s === "selected"} data-s={s} disabled={s === "disabled"} className={switchTrack}><span className={switchKnob} /></button> },
  { name: "Link", render: (s) => s === "selected" ? <a tabIndex={-1} aria-current="page" className={`${SANS} rounded-[2px] text-[14px] font-semibold text-[var(--ink)] underline decoration-[var(--ink)] underline-offset-[0.22em]`}>Table 1</a> : s === "disabled" ? <span className={`${SANS} text-[14px] text-[var(--muted)]`}>Table 1</span> : <a tabIndex={-1} data-s={s} className={`${link} ${SANS} text-[14px]`}>Table 1</a> },
];
const NOTE: Partial<Record<string, string>> = { "Text input|selected": "invalid", "Link|selected": "current", "Text input|pressed": "typing" };

export default function RefinedPaperSystem() {
  const rows = getTable1();
  const missions = getMissions();
  const pr = getPr();
  const tls = getTimelines();
  const twin = getLongest();
  const bic = getBic();
  const gmm = getGmm();
  const channels = getChannels();
  const cats = getCatalogue();
  const counts = { standard: 31, novel: 10, telemetry: 8 };

  return (
    <div className={`${serif.variable} ${sans.variable} ${mono.variable} rpd-root min-h-screen w-full`}>
      <a href="#main" className={`${SANS} ${FOCUS} fixed top-3 left-3 z-[80] -translate-y-24 rounded-[3px] bg-[var(--ink)] px-3 py-2 text-[13px] text-[var(--paper)] focus-visible:translate-y-0`}>Skip to content</a>
      <ToastProvider>
        <div className="mx-auto max-w-[1360px] px-5 md:px-10 min-[1800px]:max-w-[1560px]">
          {/* ---------------------------------------------------------------- page header */}
          <header>
            <nav aria-label="Site" className={`${SANS} flex items-center justify-between gap-4 pt-6 text-[13px]`}>
              <Link href="/" className={`${link} py-1`}>← Hub</Link>
              <span className="hidden text-[var(--muted)] sm:inline">Refined paper · Design system</span>
              <Link href="/mood-boards/refined-paper" className={`${link} py-1`}>Mood board →</Link>
            </nav>
            <div className="pt-20 pb-16 md:pt-32 md:pb-24">
              <p className={`${MONO} text-[12px] uppercase tracking-[0.08em] text-[var(--muted)]`}>Design system · refined paper</p>
              <h1 className={`${SERIF} mt-4 text-[clamp(2.75rem,7.6vw,7.5rem)] leading-[0.94] font-light tracking-[-0.03em] text-[var(--ink)]`}>
                <span className="whitespace-nowrap">Lucid <span aria-hidden className="text-[var(--rule-strong)]">·</span></span>{" "}
                <span className="whitespace-nowrap">Patient <span aria-hidden className="text-[var(--rule-strong)]">·</span></span>{" "}
                <span className="whitespace-nowrap">Inked</span>
                <span className="sr-only"> · </span>
                <i className="mt-1 block font-normal whitespace-nowrap">Design System</i>
              </h1>
              <p className={`${SERIF} mt-10 max-w-[38ch] text-[clamp(1.2rem,2vw,1.6rem)] leading-[1.42] text-[var(--ink)]`}>
                The components of our telemetry findings, set like a well-made journal page: <span className="font-medium text-[var(--prussian)]">ink-blue lines</span> named by the words beside them, hairline rules, and{" "}
                <span className="font-medium text-[var(--accent-ink)]">one vermilion action</span>. Everything below is live, and every number is ours.
              </p>
              <div className={`${SANS} mt-12 grid gap-3 border-t border-[var(--rule)] pt-5 text-[13px] text-[var(--muted)] sm:grid-cols-3`}>
                <p><span className={`${MONO} text-[var(--ink)]`}>{counts.standard}</span> standard · <span className={`${MONO} text-[var(--ink)]`}>{counts.novel}</span> novel · <span className={`${MONO} text-[var(--ink)]`}>{counts.telemetry}</span> telemetry</p>
                <p>Newsreader, IBM Plex Sans, IBM Plex Mono</p>
                <p className="sm:text-right">Data: Madhogarhia &amp; Watkins, TTIC 31220</p>
              </div>
            </div>
          </header>

          <div className="grid gap-x-14 min-[1100px]:grid-cols-[12.5rem_minmax(0,1fr)]">
            <SectionIndex items={INDEX} />
            <main id="main" className="min-w-0 pt-6 min-[1100px]:pt-0">
              {/* ============================================================ 1 color */}
              <Section id="color" n="01" title="Color roles" lead={<>Six roles, each with one job. The page is paper, not white; the text is ink, not black. Vermilion appears once per view, on the primary action. Ratios below are computed from the hex values at build time.</>}>
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-[var(--rule)] bg-[var(--rule)] md:grid-cols-3">
                  {ROLES.map((c) => {
                    const ratio = c.role === "Background" || c.role === "Surface" ? contrast("#211F1B", c.hex) : c.role === "Accent" ? contrast("#FFFFFF", c.hex) : contrast(c.hex, PAPER);
                    return (
                      <div key={c.role} className="flex min-h-[13.5rem] flex-col bg-[var(--paper)]">
                        <div className="flex h-24 items-end p-3 sm:h-28" style={{ background: c.hex, color: c.fg }}>
                          <span className={`${MONO} text-[11px] uppercase tracking-[0.08em]`}>{c.role}</span>
                        </div>
                        <div className="flex flex-1 flex-col p-3 sm:p-4">
                          <p className={`${SERIF} text-[20px] leading-tight`}>{c.name}</p>
                          <p className={`${MONO} mt-0.5 text-[12px] text-[var(--muted)]`}>{c.hex}</p>
                          <p className={`${SANS} mt-2 text-[12.5px] leading-[1.4] text-[var(--ink)]`}>{c.job}</p>
                          <p className={`${MONO} mt-auto pt-3 text-[12px]`}>
                            {c.role === "Border" ? <span className="text-[var(--muted)]">{ratio.toFixed(2)}:1 · decorative</span> : <>{ratio.toFixed(2)}:1 <span className="text-[var(--muted)]">{c.vsName.toLowerCase()} · {grade(ratio)}</span></>}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <h3 className={`${SANS} mt-14 text-[15px] font-semibold`}>Plot inks</h3>
                <p className={`${SANS} mt-1 max-w-[62ch] text-[13px] leading-[1.5] text-[var(--muted)]`}>For lines, and for the words in the prose that name those lines. Never for buttons or chips.</p>
                <ul className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  {INKS.map((k) => {
                    const r = contrast(k.hex, PAPER);
                    return (
                      <li key={k.name} className="grid grid-cols-[2.75rem_1fr] items-center gap-3">
                        {k.name === "Band" ? <span className="h-6 rounded-[2px]" style={{ background: k.hex }} aria-hidden /> : <span className="h-[2px]" style={{ background: k.hex }} aria-hidden />}
                        <span>
                          <span className={`${SANS} block text-[14px] font-medium`} style={{ color: k.name === "Band" ? "var(--ink)" : k.hex }}>{k.name} <span className={`${MONO} text-[12px] font-normal text-[var(--muted)]`}>{k.hex}</span></span>
                          <span className={`${SANS} block text-[12px] text-[var(--muted)]`}>{k.job} · {k.name === "Band" ? "fill" : `${r.toFixed(2)}:1`}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <h3 className={`${SANS} mt-14 text-[15px] font-semibold`}>Every text pairing in use, measured</h3>
                <div className="rpd-scroll mt-4 overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse">
                    <thead className="border-y border-[var(--ink)]">
                      <tr className={`${SANS} text-left text-[12.5px] text-[var(--muted)]`}>
                        <th scope="col" className="py-2 font-medium">Pairing</th><th scope="col" className="py-2 font-medium">Specimen</th><th scope="col" className="py-2 text-right font-medium">Ratio</th><th scope="col" className="py-2 pl-4 font-medium">WCAG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PAIRS.map(([n, fg, bg, f]) => {
                        const r = contrast(fg, bg);
                        return (
                          <tr key={n} className="border-b border-[var(--rule)]">
                            <th scope="row" className={`${SANS} py-2 pr-4 text-left text-[13px] font-medium`}>{n}</th>
                            <td className="py-1.5 pr-4"><span className={`${f} inline-block rounded-[2px] px-2 py-1 text-[14px]`} style={{ color: fg, background: bg }}>PR-AUC 0.384</span></td>
                            <td className={`${MONO} py-2 text-right text-[13px]`}>{r.toFixed(2)}:1</td>
                            <td className={`${SANS} py-2 pl-4 text-[12.5px]`}><span className="inline-flex items-center gap-1.5">{r >= 4.5 ? <IconCheck size={11} className="text-[var(--sage)]" /> : <IconWarn size={11} />}{grade(r)}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Section>

              {/* ============================================================ 2 type */}
              <Section id="type" n="02" title="Type roles" lead={<>Three families, each with a job: Newsreader carries the argument, IBM Plex Sans runs the controls, and IBM Plex Mono sets every number in tabular figures. Seven roles, nothing between them.</>}>
                <div className="border-b border-[var(--rule)]">
                  {TYPE.map((t) => (
                    <div key={t.role} className="grid gap-x-10 gap-y-3 border-t border-[var(--rule)] py-6 md:grid-cols-[13rem_minmax(0,1fr)]">
                      <div>
                        <p className={`${SANS} text-[14px] font-semibold`}>{t.role}</p>
                        <p className={`${MONO} mt-1 text-[11.5px] leading-[1.45] text-[var(--muted)]`}>{t.spec}</p>
                        <p className={`${SANS} mt-1 text-[12px] leading-[1.4] text-[var(--muted)]`}>{t.note}</p>
                      </div>
                      <p className={`${t.cls} min-w-0 text-[var(--ink)]`}>{t.s}</p>
                    </div>
                  ))}
                </div>
                <p className={`${caption} mt-4`}>Sentence case everywhere. No third family, no all-caps headlines, no letterspacing on lowercase.</p>
              </Section>

              {/* ============================================================ 3 space */}
              <Section id="space" n="03" title="Spacing & shape" lead={<>Apple pacing: big quiet gaps between groups, tight spacing inside them. Corners are paper-cut, 2–3px. There are no drop shadows on cards; a hairline does that job, and only floating things get a soft lift.</>}>
                <div className={grid2}>
                  <Spec n="3.1" name="Spacing scale" use="A 4px base. Inside a group use 4–16; between groups use 48–144." tokens="space-1 4 · 2 8 · 3 12 · 4 16 · 6 24 · 8 32 · 12 48 · 16 64 · 24 96 · 36 144">
                    <ul className="space-y-2.5">
                      {[[4, "icon to label"], [8, "chip gap"], [12, "label to field"], [16, "inside a card"], [24, "between controls"], [32, "card padding, desktop"], [48, "section lead to content"], [64, "between components"], [96, "between sections, phone"], [144, "between sections, desktop"]].map(([v, u]) => (
                        <li key={v} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3">
                          <span className={`${MONO} text-right text-[12px]`}>{v}</span>
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="h-3 shrink-0 bg-[var(--ink)]" style={{ width: `min(${v}px, 55%)` }} />
                            <span className={`${SANS} truncate text-[12.5px] text-[var(--muted)]`}>{u}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Spec>
                  <Spec n="3.2" name="Corners" use="Paper-cut, never pills. Round is reserved for transport buttons, slider thumbs and radios." tokens="radius 0 rules · 2px chips, nodes, badges · 3px buttons, cards, inputs · full transport, thumbs">
                    <div className="grid grid-cols-4 gap-4">
                      {[["0", "rounded-none", "rules"], ["2px", "rounded-[2px]", "chips"], ["3px", "rounded-[3px]", "cards"], ["full", "rounded-full", "transport"]].map(([v, c, u]) => (
                        <div key={v}>
                          <div className={`aspect-square border border-[var(--ink)] bg-[var(--parchment)] ${c}`} />
                          <p className={`${MONO} mt-2 text-[12px]`}>{v}</p>
                          <p className={`${SANS} text-[12px] text-[var(--muted)]`}>{u}</p>
                        </div>
                      ))}
                    </div>
                  </Spec>
                  <Spec n="3.3" name="Borders" use="Four weights of rule do the work that shadows and fills do elsewhere. Dashed means unavailable." tokens="ink 0.75 axes · rule 1 #D9D1C1 · strong 1 #B9AF9C · hair 0.5 · dotted guide · dashed = disabled">
                    <ul className="max-w-[560px] space-y-3">
                      {([["ink 0.75 · axes", "border-[var(--ink)] [border-top-width:0.75px]"], ["rule 1 · card edges", "border-[var(--rule)]"], ["strong 1 · control edges", "border-[var(--rule-strong)]"], ["hair 0.5 · gridlines", "border-[var(--rule-strong)] [border-top-width:0.5px]"], ["dotted · reference guide", "border-dotted border-[var(--graphite)]"], ["dashed · disabled", "border-dashed border-[var(--rule-strong)]"]] as const).map(([t, c]) => (
                        <li key={t} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-center gap-4">
                          <span className={`block border-t ${c}`} />
                          <span className={`${MONO} text-[11.5px] text-[var(--muted)]`}>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </Spec>
                  <Spec n="3.4" name="Shadow" use="None on cards: a hairline instead. Popovers, toasts and dialogs float with one soft lift." tokens="--lift: 0 18px 40px −24px rgb(33 31 27 / .45)">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="h-24 rounded-[3px] border border-[var(--rule)] bg-[var(--mount)]" />
                        <p className={`${caption} mt-2`}>Card · hairline, no shadow</p>
                      </div>
                      <div>
                        <div className="h-24 rounded-[3px] border border-[var(--ink)] bg-[var(--mount)] shadow-[var(--lift)]" />
                        <p className={`${caption} mt-2`}>Popover · ink edge + lift</p>
                      </div>
                    </div>
                  </Spec>
                  <Spec n="3.5" name="Motion" use="Controls answer in 200ms; reveals take 300ms on one curve; a figure draws its line once on entry." tokens="--ease cubic-bezier(.22,.61,.36,1) · 200 / 300 / 1800ms · prefers-reduced-motion → 1ms" className="xl:col-span-2">
                    <MotionDemo />
                  </Spec>
                  <Spec n="3.6" name="Grid and texture" use="A 680px text column; figures break out to the full content width; grain you should not be able to see." tokens="measure 62ch · content 1080 · grain fractalNoise .9 at 4.5%" className="xl:col-span-2">
                    <div className="relative overflow-hidden rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] p-5">
                      <div className="mx-auto max-w-[62ch] space-y-1.5">{[100, 96, 92, 60].map((w, i) => <div key={i} className="h-[5px] rounded-[1px] bg-[var(--rule-strong)]" style={{ width: `${w}%` }} />)}</div>
                      <div className="my-4 h-16 rounded-[2px] border border-[var(--oxblood)]/50 bg-[var(--parchment)]"><svg viewBox="0 0 400 60" preserveAspectRatio="none" className="h-full w-full" aria-hidden><path d="M8,46 C70,40 100,14 160,22 S270,44 392,12" fill="none" stroke="var(--prussian)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" /></svg></div>
                      <div className="mx-auto max-w-[62ch] space-y-1.5">{[100, 88, 70].map((w, i) => <div key={i} className="h-[5px] rounded-[1px] bg-[var(--rule-strong)]" style={{ width: `${w}%` }} />)}</div>
                      <p className={`${MONO} mt-3 flex justify-between text-[11px] text-[var(--muted)]`}><span>text 62ch</span><span>figure breaks out</span></p>
                    </div>
                  </Spec>
                </div>
              </Section>

              {/* ============================================================ 4 components */}
              <Section id="components" n="04" title="Components" lead={<>The handout’s set, each on our own content and each live. A one-line spec sits above every component: what it is, when to use it, and the tokens it is built from. Section 5 shows every state side by side.</>}>
                <div className={grid2}>
                  <Spec n="4.1–4.2" name="Primary and secondary button" use="Primary for the one action that matters in a view (vermilion, once). Secondary for everything else; a quiet text button for the least." tokens="accent #B0401C → hover #962F10 → press #7E2609 · radius 3 · h 40 · Plex Sans 500 14 · ring 2px ink +2">
                    <ButtonsDemo />
                  </Spec>
                  <Spec n="4.3" name="Link" use="Inline in prose and as a standalone ‘go’ link. Underline in strong rule, ink on hover." tokens="ink · underline rule-strong 1px offset .22em → ink">
                    <LinkDemo />
                  </Spec>
                  <Spec n="4.4" name="Text input" use="Free text with live validation. Errors say what went wrong and what is allowed, in oxblood with an icon." tokens="mount fill · rule-strong edge → pencil hover → ink focus · invalid oxblood + #F7EDE8">
                    <InputDemo channels={channels} />
                  </Spec>
                  <Spec n="4.5" name="Select" use="One choice from five or more known options. Native under the skin, so it works with every keyboard and screen reader." tokens="as text input · chevron ink 12">
                    <SelectDemo rows={rows} />
                  </Spec>
                  <Spec n="4.6" name="Checkbox" use="Independent on/off choices, with an indeterminate parent for a set." tokens="18px · radius 2 · ink edge · checked ink fill + paper tick · dashed when disabled">
                    <CheckboxDemo />
                  </Spec>
                  <Spec n="4.7" name="Radio" use="One choice from two to four, all visible at once." tokens="18px round · ink edge · 4px mount ring around an ink dot">
                    <RadioDemo />
                  </Spec>
                  <Spec n="4.8" name="Switch" use="An instant setting that changes something you can see. Here it redraws the figure." tokens="40×22 · radius 3 (paper-cut, not a pill) · off parchment · on ink · knob 300ms">
                    <SwitchDemo spark={tls[0].bins} />
                  </Spec>
                  <Spec n="4.9" name="Tabs" use="Peer views of one object. Arrow keys move between them; a disabled tab is struck through, not hidden." tokens="Plex Sans 500 14 · pencil → ink · 2px ink underline when selected">
                    <TabsDemo rows={rows} />
                  </Spec>
                  <Spec n="4.10" name="Segmented control" use="Two to four mutually exclusive modes that swap the content below, like Mission 1 / Mission 2." tokens="parchment track · selected paper + ink edge · radius 3 / 2">
                    <SegmentedDemo missions={missions} />
                  </Spec>
                  <Spec n="4.11" name="Slider" use="A continuous or stepped value with a live readout and aria-valuetext." tokens="1px ink track filled to value · 16px round paper thumb · ink when pressed">
                    <SliderDemo />
                  </Spec>
                  <Spec id="cmp-list" n="4.12–4.14" name="Filter chips, list rows and detail panel" use="Chips narrow a list; rows select; the detail panel shows the selected row. Clear the chips to reach the empty state." tokens="chip h 32 radius 3 · selected parchment + ink edge + tick · row hover parchment · selected 2px ink bar" className="xl:col-span-2">
                    <ChipsListDemo rows={rows} />
                  </Spec>
                  <Spec n="4.15–4.16" name="Card and modal dialog" use="A card summarises one method; its Details button opens a modal with a scrim. Esc closes it, focus is trapped inside, and focus returns to the button." tokens="card mount + rule edge, no shadow · dialog ink edge + lift · scrim ink 38% · 300ms rise" className="xl:col-span-2">
                    <CardModalDemo rows={rows} />
                  </Spec>
                  <Spec n="4.17" name="Badge" use="A count or a status. Status badges pair a dot with a word, so they survive greyscale." tokens="count ink + paper Mono 11 · status rule-strong edge · dashed = provisional">
                    <BadgeDemo />
                  </Spec>
                </div>
              </Section>

              {/* ============================================================ 5 control states */}
              <Section id="states" n="05" title="Control states" lead={<>Rest, hover, focus, pressed, selected and disabled, side by side. Each specimen is the live component’s own class string with the state forced, so this table cannot drift from the controls above.</>}>
                <div className="rpd-scroll overflow-x-auto pb-2">
                  <table className="w-full min-w-[820px] border-collapse" aria-describedby="states-note">
                    <thead className="border-y border-[var(--ink)]">
                      <tr>
                        <th scope="col" className={`${SANS} sticky left-0 z-[1] bg-[var(--paper)] py-2.5 pr-4 text-left text-[12.5px] font-medium text-[var(--muted)]`}>Control</th>
                        {STATES.map((s) => <th key={s} scope="col" className={`${SANS} px-3 py-2.5 text-left text-[12.5px] font-medium text-[var(--muted)] capitalize`}>{s}</th>)}
                      </tr>
                    </thead>
                    <tbody inert>
                      {MATRIX.map((r) => (
                        <tr key={r.name} className="border-b border-[var(--rule)]">
                          <th scope="row" className={`${SANS} sticky left-0 z-[1] bg-[var(--paper)] py-5 pr-4 text-left text-[13.5px] font-medium`}>{r.name}</th>
                          {STATES.map((s) => {
                            const el = r.render(s);
                            const note = NOTE[`${r.name}|${s}`];
                            return (
                              <td key={s} className="px-3 py-5 align-middle">
                                {el ?? <span className={`${MONO} text-[12px] text-[var(--muted)]`}>n/a</span>}
                                {note && <span className={`${MONO} mt-1.5 block text-[11px] text-[var(--muted)]`}>{note}</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p id="states-note" className={`${caption} mt-3 max-w-[70ch]`}>Hover darkens or fills with parchment; focus is always a 2px ink ring at 2px offset; pressed sinks 1px and fills with rule; selected is parchment with an ink edge (chips add a tick); disabled turns its edge dashed. Buttons have no selected state.</p>
              </Section>

              {/* ============================================================ 6 UI states */}
              <Section id="ui-states" n="06" title="UI states" lead={<>Empty says what is missing and offers the first move; loading keeps the layout with a skeleton; error says what happened, that nothing was lost, and offers Try again; success confirms in a word and an icon.</>}>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden>
                  {[
                    ["Empty", <div key="e" className="grid h-full place-items-center rounded-[2px] border border-dashed border-[var(--rule-strong)] p-3 text-center"><span className={`${SERIF} text-[15px]`}>No runs scored yet</span></div>],
                    ["Loading", <div key="l" className="space-y-2 p-1"><div className="rpd-skel h-3 w-4/5" /><div className="rpd-skel h-3 w-3/5" /><div className="rpd-skel h-3 w-2/3" /></div>],
                    ["Error", <div key="x" className="h-full rounded-[2px] border border-[var(--oxblood)] bg-[#F7EDE8] p-3"><span className={`${SANS} inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--oxblood)]`}><IconWarn size={11} />Couldn’t load</span><span className={`${SANS} mt-2 block text-[12px] underline`}>Try again</span></div>],
                    ["Success", <div key="s" className="p-1"><span className={`${SANS} inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--sage)]`}><IconCheck size={11} />Loaded 4 rows</span><div className="mt-2 border-t border-[var(--ink)]" />{[0.438, 0.434, 0.414].map((v) => <div key={v} className={`${MONO} flex justify-between border-b border-[var(--rule)] py-1 text-[12px]`}><span>M2</span><span>{v}</span></div>)}</div>],
                  ].map(([n, el]) => (
                    <div key={String(n)}>
                      <div className="h-[7.5rem] rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] p-2">{el}</div>
                      <p className={`${caption} mt-2`}>{n as string}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-14">
                  <Spec n="6.1" name="State simulator" use="Pick a state, or simulate a fetch: odd attempts fail and even ones succeed, so Try again always recovers." tokens="skeleton parchment sweep 1.6s · error oxblood + #F7EDE8 · success sage + tick · aria-live polite, aria-busy while loading">
                    <UiStates rows={rows} />
                  </Spec>
                </div>
              </Section>

              {/* ============================================================ Parts of an Interface */}
              <Section id="parts" n="P" title="Parts of an interface" lead={<>Every element from the week 2 slide, named as the slide names it. Those already shown in section 4 link back; the rest are specimens here.</>}>
                <ol className={`${SANS} grid gap-x-8 gap-y-1.5 text-[13.5px] sm:grid-cols-2 lg:grid-cols-3`}>
                  {[
                    ["Hero", "#p-hero"], ["Card", "#components"], ["Primary / secondary buttons", "#components"], ["Menu ≡ and more ⋮", "#p-menus"], ["Segmented control", "#components"], ["Switch / toggle", "#components"],
                    ["Checkbox & radio", "#components"], ["Filter chips / tags", "#cmp-list"], ["Toast / snackbar", "#p-toast"], ["Banner", "#p-banner"], ["Badge", "#components"], ["Skeleton screen", "#p-skeleton"],
                    ["Tooltip", "#p-tooltip"], ["Modal dialog + scrim", "#components"], ["Accordion", "#p-accordion"], ["Empty state", "#p-empty"], ["Keyboard focus ring", "#p-focus"], ["Don’t use colour alone", "#p-color"], ["Emphasise by de-emphasising", "#p-emphasis"],
                  ].map(([t, h], i) => (
                    <li key={t} className="flex items-baseline gap-2.5 border-b border-[var(--rule)] py-1.5">
                      <span className={`${MONO} w-6 shrink-0 text-[11px] text-[var(--muted)]`}>{String(i + 1).padStart(2, "0")}</span>
                      <a href={h} className={link}>{t}</a>
                    </li>
                  ))}
                </ol>
                <div className={`${grid2} mt-16`}>
                  <Spec id="p-hero" n="P1" name="Hero" use="The first screen of the site: the one-sentence finding, then exactly one vermilion action. The nav bar carries the ≡ and ⋮ menus." tokens="display Newsreader 300 · body 17 · primary + quiet · hairline nav" className="xl:col-span-2">
                    <HeroSpecimen />
                  </Spec>
                  <Spec id="p-menus" n="P4" name="Menu ≡ and more ⋮" use="≡ opens navigation; ⋮ opens actions on one object. Arrow keys move, Esc closes and returns focus, a click outside dismisses." tokens="mount + ink edge + lift · item hover parchment · focus 2px ink bar · disabled pencil">
                    <MenusDemo />
                  </Spec>
                  <Spec id="p-toast" n="P9" name="Toast" use="Confirms an action, then leaves by itself after 5 s. It can carry one undo. Polite live region." tokens="mount + ink edge + lift · sage tick · 1px ink timer bar · pause on hover/focus">
                    <ToastDemo />
                  </Spec>
                  <Spec id="p-banner" n="P10" name="Banner" use="A standing notice about the whole page. It stays until dismissed." tokens="parchment + ink edge · info glyph · dismiss 32px icon button">
                    <BannerDemo />
                  </Spec>
                  <Spec id="p-tooltip" n="P13" name="Tooltip" use="A short definition on hover AND on keyboard focus. Esc hides it. Never holds an action." tokens="ink fill · paper text 12 · 6px from trigger · 200ms · aria-describedby">
                    <TooltipDemo />
                  </Spec>
                  <Spec id="p-accordion" n="P15" name="Accordion" use="Secondary detail a reader may skip: definitions and caveats. One open at a time." tokens="Newsreader 18 trigger · plus → minus 300ms · grid-rows height · hairline separators">
                    <AccordionDemo />
                  </Spec>
                  <Spec id="p-skeleton" n="P12" name="Skeleton screen" use="Holds the layout while content loads, so nothing jumps when it arrives." tokens="parchment blocks radius 2 · mount sweep 1.6s · static under reduced motion">
                    <SkeletonDemo />
                  </Spec>
                  <Spec id="p-empty" n="P16" name="Empty state" use="Says the status, teaches what would fill it, and offers the first move." tokens="dashed strong rule · Newsreader 20 title · Plex 13.5 body · secondary action">
                    <EmptyState title="No anomalies in this window" body="Between days 120 and 150 of the Mission 2 test set nothing is labelled. Widen the window or jump to the next labelled segment." action={<a href="#tm-timeline" className={`${btnSecondary} no-underline`}>Jump to the timeline <IconArrow /></a>} />
                  </Spec>
                  <Spec id="p-focus" n="P17" name="Keyboard focus ring" use="Tab moves a visible ring through every control on the page, in reading order." tokens="outline 2px ink · offset 2px · focus-visible only">
                    <FocusDemo />
                  </Spec>
                  <Spec id="p-color" n="P18" name="Don’t use colour alone" use="Status is always colour + icon + word. Switch to greyscale: the meaning stays." tokens="sage ✓ verified · ochre ! near/mixed · oxblood ✕ not saved">
                    <ColorAloneDemo rows={rows} />
                  </Spec>
                  <Spec id="p-emphasis" n="P19" name="Emphasise by de-emphasising" use="The primary wins because the others got quieter, not because it got louder." tokens="one accent per view · the rest quiet text buttons">
                    <EmphasisDemo />
                  </Spec>
                </div>
              </Section>

              {/* ============================================================ Novel */}
              <Section id="novel" n="N" title="Novel" lead={<>Ten components borrowed from the board’s reference sites and rebuilt on our data. Each card says what was borrowed and how it changed on the way to paper.</>}>
                <div className="space-y-24">
                  <Spec n="N1" name="Draggable figure, words keyed to lines" use="Drag the handle (or focus it and use ←/→). The sentence above recomputes; the coloured words are the legend." tokens="prussian GMM · ochre K-Means · graphite reference · handle ink 0.75 + paper rings"
                    tag={<NovelTag site="Ciechanowski, GPS" />} borrowed="Borrowed: nouns set in the colour of their mark, and a figure you move by hand. Transformed: the prose itself updates with the numbers under the handle.">
                    <div className="max-w-[760px]"><KeyedDrag set={pr[0]} /></div>
                  </Spec>
                  <Spec id="nv-twin" n="N2" name="Twin views on one shared scrubber" use="Two methods, one fault, one cursor. Play sweeps it; the figure pauses itself when it leaves the screen." tokens="ochre / prussian lines · band anomaly fill · transport ink round 40"
                    tag={<NovelTag site="Ciechanowski, GPS" />} borrowed="Borrowed: side-by-side projections driven by one control, and a figure-level pause. Transformed: two detectors over the longest real fault in Mission 1.">
                    <TwinScrubber twin={twin} />
                  </Spec>
                  <Spec id="nv-scrolly" n="N3" name="Sticky graphic, scroll-driven regrouping" use="Scroll the text; the 76 channel dots regroup and keep their identity. The step bars jump without scrolling." tokens="dots ink → prussian targets / hollow graphite others · 900ms tween, staggered 12ms"
                    tag={<NovelTag site="R2D3" />} borrowed="Borrowed: a pinned chart beside wide-spaced copy, object constancy, the ‘keep scrolling’ cue and a two-colour encoding. Transformed: it restacks chart-on-top on phones instead of cropping, and never hijacks the scroll.">
                    <ScrollyChannels channels={channels} />
                  </Spec>
                  <Spec id="nv-bic" n="N4" name="Step player with counter" use="Play the BIC sweep, step through it, or scrub. The ghost of the whole curve stays so the line never loses its place." tokens="ghost rule · drawn prussian · K* vermilion ring (the figure’s one accent) · step counter Mono"
                    tag={<NovelTag site="Distill, t-SNE" />} borrowed="Borrowed: play / pause / step controls with a visible step counter. Transformed: steel-blue Material buttons became ink transport discs; the run is our real K = 2…30 sweep.">
                    <div className="max-w-[860px]"><BicPlayer sweeps={bic} /></div>
                  </Spec>
                  <Spec n="N5" name="Small multiples, linked crosshair" use="Four methods on shared axes. Hover or drag across any panel and all four answer at that recall." tokens="prussian line · graphite positive rate · shared crosshair ink 0.75"
                    tag={<NovelTag site="Distill, t-SNE" />} borrowed="Borrowed: the small-multiples strip as evidence. Transformed: one crosshair is shared across panels, so comparison is a single gesture.">
                    <LinkedMultiples set={pr[1]} />
                  </Spec>
                  <Spec n="N6" name="Hover-linked citations" use="Hover or focus a marker: its reference lights up in the margin (on phones, a hovercard opens). Click pins it." tokens="marker prussian Plex 12 · linked row parchment + 2px ink bar"
                    tag={<NovelTag site="Distill / transformer-circuits" />} borrowed="Borrowed: bracketed citations that open in place. Transformed: the reference list is the hovercard on wide screens, so nothing covers the text.">
                    <LinkedCitations />
                  </Spec>
                  <Spec n="N7" name="Sticky contents, bold and grey" use="Chapters bold, appendices regular and grey; the current one in ink with a hairline bar. This page’s own index works the same way." tokens="Plex Sans 600 / 400 · ink / ink-soft / pencil · inset 2px ink"
                    tag={<NovelTag site="transformer-circuits" />} borrowed="Borrowed: the sticky two-tier TOC of a long paper. Transformed: a contained scroll-spy fragment, and the page rail at left.">
                    <div className="max-w-[760px]"><TocFragment /></div>
                  </Spec>
                  <Spec n="N8" name="Findings-card grid" use="Each finding is a card with a tiny circuit; the card is a link to its figure. Hover lifts it and thickens its one accent path." tokens="mount card · parchment nodes, 2.5px stacked offset · oxblood edges · one vermilion path"
                    tag={<NovelTag site="transformer-circuits" />} borrowed="Borrowed: the hero grid of case-study cards that doubles as a table of contents. Transformed: our six findings, each linking into this page.">
                    <FindingsGrid />
                  </Spec>
                  <Spec n="N9" name="Parchment node diagram, two tiers" use="A static inline diagram with one accent path, and an ‘Open explorer’ dialog to trace any of the 21 components." tokens="parchment nodes + offset · oxblood edges by share · accent path + #F6E3D6 node"
                    tag={<NovelTag site="transformer-circuits" />} borrowed="Borrowed: stacked parchment nodes, oxblood edges, one highlighted path, and a static figure with a deeper interactive tier. Transformed: subsystems → GMM components → groups on Mission 1.">
                    <div className="max-w-[860px]"><TwoTierDiagram gmm={gmm} /></div>
                  </Spec>
                  <Spec n="N10" name="Giant-type stat reveal" use="The number arrives large and alone, then its context. Once, on entry." tokens="Newsreader 300 up to 200px −4.5% · 900ms rise, staggered 160ms"
                    tag={<NovelTag site="Apple" />} borrowed="Borrowed: the giant numeral that owns the screen. Transformed: set in a light serif, with a hairline scale that places K* against subsystems and groups.">
                    <GiantStat />
                  </Spec>
                </div>
              </Section>

              {/* ============================================================ Telemetry */}
              <Section id="telemetry" n="T" title="Telemetry" lead={<>Components only our paper needs, each running on Table 1 or the saved score arrays. Where a curve comes from an earlier run than Table 1, it says so and gives the Table 1 number.</>}>
                <div className="space-y-24">
                  <Spec id="tm-alert" n="T1" name="Alert-budget threshold" use="Choose what share of timesteps to flag; precision, recall and F1 recompute from the PR curve." tokens="prussian curve · ink operating point · diamond = 99th-pct rule · Mono readouts">
                    <AlertBudget sets={pr} />
                  </Spec>
                  <Spec n="T2" name="Mission switcher" use="Swaps every headline fact between the two satellites." tokens="segmented · Newsreader 300 numerals · rule grid">
                    <MissionSwitch missions={missions} rows={rows} />
                  </Spec>
                  <Spec n="T3" name="Method spec card" use="One Table 1 row as a card: family, K, both AUCs, event F1, trend, provenance and credit." tokens="ink-edged card · Mono values · status colour + icon + word">
                    <SpecCard rows={rows} />
                  </Spec>
                  <Spec id="tm-pr" n="T4" name="PR-curve viewer" use="Toggle curves on and off; hover a chip to isolate its line." tokens="four plot inks · chip carries a line swatch + AP · graphite positive rate">
                    <div className="max-w-[900px]"><PrViewer sets={pr} /></div>
                  </Spec>
                  <Spec id="tm-timeline" n="T5" name="Mission timeline scrubber" use="Scrub the whole test set; jump between labelled anomalies; read the score and label at the cursor." tokens="ink median · rule max envelope · band segments · transport step buttons">
                    <TimelineScrubber timelines={tls} />
                  </Spec>
                  <Spec n="T6" name="Subsystems vs groups, before and after" use="The 21 GMM components split by subsystem, then by group. The ARI says which fits." tokens="ink → rule shades by rank · 500ms width tween · Mono ARI">
                    <div className="max-w-[860px]"><SubVsGroup gmm={gmm} /></div>
                  </Spec>
                  <Spec n="T7" name="Anomaly event card" use="Event types per mission, each with count, share and duration." tokens="tabs per type · status colour + icon + word · Mono durations">
                    <div className="max-w-[860px]"><EventCard cats={cats} /></div>
                  </Spec>
                  <Spec id="tm-table" n="T8" name="Results table with sort" use="Table 1, filterable by mission and sortable by PR-AUC, ROC-AUC or method." tokens="ink top rule · rule rows · strong rule between families · aria-sort headers">
                    <ResultsTable rows={rows} />
                  </Spec>
                </div>
              </Section>
            </main>
          </div>

          <footer className="border-t border-[var(--ink)] pt-6 pb-20">
            <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
              <p className={`${SERIF} text-[22px] leading-tight`}>Lucid · Patient · Inked</p>
              <div className={`${SANS} space-y-2 text-[13px] leading-[1.55] text-[var(--muted)]`}>
                <p>Data and findings: Rhea Madhogarhia &amp; Hewitt Watkins, “Uncovering Latent Structure in ESA Satellite Telemetry”, TTIC 31220, 2026. Rhea built the K-Means, PCA and KPCA baselines; Hewitt the GMM and VAEs.</p>
                <p>Type: Newsreader (Production Type), IBM Plex Sans and Mono (IBM), SIL Open Font License. After Ciechanowski, R2D3, Distill, transformer-circuits and Apple.</p>
                <p className="flex gap-5 pt-1"><Link href="/" className={link}>← Hub</Link><Link href="/mood-boards/refined-paper" className={link}>Mood board →</Link></p>
              </div>
            </div>
          </footer>
        </div>
      </ToastProvider>
    </div>
  );
}
