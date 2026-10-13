import type { Metadata } from "next";
import { Doto, Fragment_Mono, Host_Grotesk } from "next/font/google";
import "../../mood-boards/intense-space/board.css";
import "./ds.css";
import { FiberField } from "../../mood-boards/intense-space/fiber-field";
import { bicSweeps, curves, events, headline, missions, strands, tableRows, timelines, tree } from "./data";
import { Header, MotionDemo, SectionIndex } from "./shell";
import { Components, ControlStates, Parts, UiStates } from "./standard";
import { NovelCompare, NovelDoto, NovelEntries, NovelFiber, NovelFocus, NovelMechanism, NovelProcess, NovelTags, NovelWords, NovelZoom } from "./novel";
import { TBic, TEvents, TMethod, TMission, TPr, TTable, TThreshold, TTimeline } from "./telemetry";
import { ToastProvider } from "./ui";

const display = Host_Grotesk({ subsets: ["latin"], variable: "--font-is-display", weight: ["300", "400", "500", "600"] });
const mono = Fragment_Mono({ subsets: ["latin"], variable: "--font-is-mono", weight: "400" });
const dot = Doto({ subsets: ["latin"], variable: "--font-is-dot", weight: ["600"] });

export const metadata: Metadata = {
  title: "Charged · Fibrous · Instrumented · Design System",
  description: "The Intense Space design system: tokens, components in every state, and telemetry-specific components for the ESA latent-structure findings.",
};

const MONO = "font-(family-name:--font-is-mono)";
const DOT = "font-(family-name:--font-is-dot)";
const LABEL = `${MONO} text-[10px] uppercase tracking-[0.16em]`;

/* ---------- WCAG contrast, computed (not typed) ---------- */
function lum(hex: string) {
  const c = hex.replace("#", "").match(/.{2}/g)!.map((x) => parseInt(x, 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const C = {
  void: "#0A0B0D",
  panel: "#121316",
  charcoal: "#333333",
  frost: "#CFD9E0",
  steel: "#8C979F",
  line: "#2E3135",
  fiber: "#37FD08",
  fault: "#E04FD6",
  teal: "#4BCFE0",
};

const ROLES: { role: string; name: string; hex: string; use: string; vs: [string, string] }[] = [
  { role: "Background", name: "Void", hex: C.void, use: "Page ground. Frost on it", vs: [C.frost, C.void] },
  { role: "Surface", name: "Panel", hex: C.panel, use: "Panels, cards, dialogs. Frost on it", vs: [C.frost, C.panel] },
  { role: "Art field", name: "Charcoal", hex: C.charcoal, use: "Hero fiber field, pressed fill. Frost only", vs: [C.frost, C.charcoal] },
  { role: "Text", name: "Frost", hex: C.frost, use: "All body and headings, on Void", vs: [C.frost, C.void] },
  { role: "Muted text", name: "Steel", hex: C.steel, use: "Labels, captions, rest state, on Panel", vs: [C.steel, C.panel] },
  { role: "Border", name: "Hairline", hex: C.line, use: "1px rules and frames. Decorative, vs Void", vs: [C.line, C.void] },
  { role: "Accent · primary action", name: "Fiber Green", hex: C.fiber, use: "One primary button per view. Void text on it", vs: [C.void, C.fiber] },
  { role: "Fault", name: "Fault Magenta", hex: C.fault, use: "A labelled fault or a failed state, with ■ + word", vs: [C.fault, C.panel] },
  { role: "Data highlight", name: "Survey Teal", hex: C.teal, use: "One highlighted series, AOI outline, selected chip", vs: [C.teal, C.panel] },
];

const TEXT_PAIRS: [string, string, string, string][] = [
  ["Frost body", C.frost, "Void", C.void],
  ["Frost body", C.frost, "Panel", C.panel],
  ["Frost on art field", C.frost, "Charcoal", C.charcoal],
  ["Steel label", C.steel, "Void", C.void],
  ["Steel label", C.steel, "Panel", C.panel],
  ["Void on primary", C.void, "Fiber Green", C.fiber],
  ["Void on selected", C.void, "Frost", C.frost],
  ["Teal data label", C.teal, "Void", C.void],
  ["Teal data label", C.teal, "Panel", C.panel],
  ["Magenta fault label", C.fault, "Void", C.void],
  ["Magenta fault label", C.fault, "Panel", C.panel],
  ["Green live mark", C.fiber, "Void", C.void],
  ["Disabled (exempt)", "#5F676E", "Void", C.void],
];

/* the Parts checklist: every slide element → where it lives on this page */
const PARTS_INDEX: [string, string][] = [
  ["Hero", "#p-hero"],
  ["Card", "#c-card"],
  ["Primary / secondary buttons", "#c-buttons"],
  ["Menu ≡", "#p-menu"],
  ["More ⋮", "#c-card"],
  ["Segmented control", "#p-seg"],
  ["Switch / toggle", "#c-select"],
  ["Checkbox & radio", "#c-select"],
  ["Filter chips / tags", "#c-chips"],
  ["Toast / snackbar", "#p-toast"],
  ["Banner", "#p-toast"],
  ["Badge", "#c-badges"],
  ["Skeleton screen", "#p-skel"],
  ["Tooltip", "#p-tip"],
  ["Modal + scrim", "#c-modal"],
  ["Accordion", "#p-acc"],
  ["Empty state", "#p-empty"],
  ["Focus ring", "#p-focus"],
];

/* ---------- section scaffolding ---------- */
function SectionHead({ id, n, a, b, intro }: { id: string; n: string; a: string; b: string; intro: React.ReactNode }) {
  return (
    <div className="grid gap-5 pb-8 pt-20 lg:grid-cols-12 lg:gap-3 lg:pb-10 lg:pt-28">
      <div className="lg:col-span-5">
        <p className={`${MONO} mb-4 text-[10px] uppercase tracking-[0.42em] text-(--is-steel)`}>Section {n}</p>
        <h2 id={`${id}-h`} className="text-[clamp(34px,4vw,60px)] font-light uppercase leading-[0.92] tracking-[-0.02em] text-(--is-frost)">
          <span className="block pl-[1.6em]">{a}</span>
          <span className="block">{b}</span>
        </h2>
      </div>
      <div className="max-w-[60ch] self-end text-[16px] leading-[1.45] text-(--is-steel) lg:col-span-6 lg:col-start-7">{intro}</div>
    </div>
  );
}

function Block({ code, title, children, className = "" }: { code: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`is-corners flex min-w-0 flex-col rounded-[2px] border border-(--is-line) bg-(--is-panel) ${className}`}>
      <p className="flex gap-3 border-b border-(--is-line) px-4 py-2.5">
        <span className={`${LABEL} text-(--is-steel)`}>[ {code} ]</span>
        <span className={`${LABEL} text-(--is-frost)`}>{title}</span>
      </p>
      <div className="flex flex-1 flex-col gap-5 p-4 sm:p-5">{children}</div>
    </div>
  );
}

export default function IntenseSpaceSystem() {
  const rows = tableRows();
  const ms = missions();
  const cv = curves();
  const tl = timelines();
  const bic = bicSweeps();
  const tr = tree();
  const ev = events();
  const s1 = strands(1);
  const s2 = strands(2);

  const counts = { standard: 30, novel: 10, telemetry: 8 };

  return (
    <main className={`${display.variable} ${mono.variable} ${dot.variable} is-root min-h-screen w-full`}>
      <ToastProvider>
        <a href="#s-color" className={`${MONO} sr-only z-[80] rounded-[2px] bg-(--is-frost) px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-(--is-void) focus:not-sr-only focus:fixed focus:left-3 focus:top-3`}>
          Skip to content
        </a>
        <Header />
        <SectionIndex />

        <div className="mx-auto max-w-[1920px] px-3 sm:px-6 xl:px-10">
          {/* registration marks on the 12-col rhythm */}
          <div aria-hidden className="mt-5 hidden h-1 grid-cols-12 gap-3 lg:grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="h-1 w-1 bg-(--is-steel)" />
            ))}
          </div>

          {/* ================= hero ================= */}
          <section aria-labelledby="isd-title" className="mt-3 lg:mt-5">
            <div className="relative isolate flex min-h-[460px] flex-col justify-end overflow-hidden rounded-[2px] border border-(--is-line) bg-(--is-charcoal) sm:min-h-[520px] lg:h-[clamp(520px,64vh,720px)]">
              <div className="absolute inset-0 -z-10">
                <FiberField strands={s1} />
              </div>
              <div aria-hidden className="isd-grain pointer-events-none absolute inset-0 -z-10" />
              <div aria-hidden className="is-scan pointer-events-none absolute inset-0 -z-10 opacity-60" />
              <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_top,#0A0B0D_0%,rgba(10,11,13,0.82)_30%,rgba(10,11,13,0.2)_65%,transparent_85%)]" />
              <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-12 lg:items-end lg:gap-3 lg:p-10">
                <div className="lg:col-span-8">
                  <p className={`${MONO} mb-5 text-[10px] uppercase tracking-[0.24em] text-(--is-frost) sm:tracking-[0.42em]`}>Design system · ESA telemetry findings</p>
                  <h1 id="isd-title" className="text-[clamp(42px,7.2vw,112px)] font-semibold leading-[0.9] tracking-[-0.045em] text-(--is-frost)">
                    Charged <span className="font-light">·</span> Fibrous <span className="font-light max-sm:hidden">·</span>
                    <br />
                    <span className="font-light uppercase tracking-[-0.02em]">Instrumented</span>
                    <span className="mt-3 block text-[clamp(20px,2.2vw,32px)] font-light tracking-[-0.01em] text-(--is-frost)">· Design System</span>
                  </h1>
                </div>
                <dl className={`${MONO} grid grid-cols-3 gap-px self-end overflow-hidden rounded-[2px] border border-(--is-line) bg-(--is-line) lg:col-span-4`}>
                  {[
                    ["Standard", counts.standard],
                    ["Novel", counts.novel],
                    ["Telemetry", counts.telemetry],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-(--is-void)/90 px-3 py-3">
                      <dt className="text-[10px] uppercase tracking-[0.14em] text-(--is-steel)">{k}</dt>
                      <dd className={`${DOT} mt-1 text-[40px] font-semibold leading-[0.9] text-(--is-frost)`}>{String(v).padStart(2, "0")}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            <div className="grid gap-6 pt-8 lg:grid-cols-12 lg:gap-3">
              <p className="max-w-[56ch] text-[18px] leading-[1.45] text-(--is-frost) lg:col-span-6">
                A deep-space control room drawn in steered fiber. Every token, texture and motion here comes from the mood board; every number comes from our paper,
                Madhogarhia &amp; Watkins, <em className="not-italic text-(--is-steel)">Uncovering Latent Structure in ESA Satellite Telemetry</em>.
              </p>
              <ul className={`${MONO} flex flex-col gap-2 text-[11px] uppercase tracking-[0.12em] lg:col-span-5 lg:col-start-8`}>
                <li className="flex justify-between gap-4 border-b border-(--is-line) pb-2">
                  <span className="text-(--is-fiber)">■ Fiber Green</span>
                  <span className="text-(--is-steel)">The one primary action</span>
                </li>
                <li className="flex justify-between gap-4 border-b border-(--is-line) pb-2">
                  <span className="text-(--is-fault)">■ Fault Magenta</span>
                  <span className="text-(--is-steel)">Labelled faults, failures</span>
                </li>
                <li className="flex justify-between gap-4 border-b border-(--is-line) pb-2">
                  <span className="text-(--is-teal)">■ Survey Teal</span>
                  <span className="text-(--is-steel)">One highlighted data region</span>
                </li>
              </ul>
            </div>
          </section>

          {/* ================= 1 color ================= */}
          <section id="s-color" aria-labelledby="s-color-h" className="scroll-mt-24">
            <SectionHead
              id="s-color"
              n="01"
              a="Color"
              b="roles"
              intro={<>Nine colors, each with one job. Depth comes from Void → Panel → Charcoal, never from shadow. Three signal colors, and only one of them is ever loud at a time.</>}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ROLES.map((r) => {
                const cr = ratio(r.vs[0], r.vs[1]);
                const ink = lum(r.hex) > 0.18 ? C.void : C.frost;
                return (
                  <div key={r.name} className="is-corners flex min-w-0 overflow-hidden rounded-[2px] border border-(--is-line) bg-(--is-panel)">
                    <div className="flex w-24 shrink-0 flex-col justify-end p-2.5 sm:w-28" style={{ background: r.hex, color: ink }}>
                      <span className={`${MONO} text-[10px] uppercase tracking-[0.1em]`}>{r.hex}</span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3.5">
                      <p className={`${LABEL} text-(--is-steel)`}>{r.role}</p>
                      <p className="text-[18px] font-semibold leading-tight tracking-[-0.01em] text-(--is-frost)">{r.name}</p>
                      <p className="text-[13px] leading-snug text-(--is-steel)">{r.use}</p>
                      <p className={`${MONO} mt-auto pt-1 text-[11px] tracking-[0.04em] text-(--is-frost)`}>
                        {cr.toFixed(1)}:1{" "}
                        <span className="text-(--is-steel)">
                          {r.name === "Hairline" ? "· decorative, no text" : cr >= 7 ? "· AAA" : cr >= 4.5 ? "· AA" : "· large only"}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Block code="1.2" title="Every text style, measured (WCAG 2.x)" className="mt-3">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-(--is-frost)">
                      {["Text style", "Ink", "On", "Ratio", "Result"].map((h) => (
                        <th key={h} scope="col" className={`${LABEL} px-2 py-2 text-(--is-steel) first:pl-0`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TEXT_PAIRS.map(([name, ink, onName, on]) => {
                      const cr = ratio(ink, on);
                      const exempt = name.includes("exempt");
                      return (
                        <tr key={name + onName} className="border-b border-(--is-line)">
                          <td className="py-2 pr-2 text-[14px] text-(--is-frost)">{name}</td>
                          <td className="px-2">
                            <span className="inline-flex items-center gap-2 rounded-[2px] px-2 py-1" style={{ background: on, color: ink }}>
                              <span className={`${MONO} text-[11px]`}>Aa {ink}</span>
                            </span>
                          </td>
                          <td className={`${MONO} px-2 text-[11px] uppercase tracking-[0.08em] text-(--is-steel)`}>{onName}</td>
                          <td className={`${MONO} px-2 text-[13px] text-(--is-frost)`}>{cr.toFixed(2)}:1</td>
                          <td className={`${MONO} px-2 text-[11px] uppercase tracking-[0.1em] ${exempt ? "text-(--is-steel)" : "text-(--is-frost)"}`}>
                            {exempt ? "○ Exempt" : cr >= 7 ? "✓ AAA" : cr >= 4.5 ? "✓ AA" : "✕ Fail"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[13px] text-(--is-steel)">Steel on Charcoal is {ratio(C.steel, C.charcoal).toFixed(1)}:1, so the system never puts Steel text on the art field. Green and Magenta are never body text.</p>
            </Block>
          </section>

          {/* ================= 2 type ================= */}
          <section id="s-type" aria-labelledby="s-type-h" className="scroll-mt-24">
            <SectionHead
              id="s-type"
              n="02"
              a="Type"
              b="roles"
              intro={<>Three families, each with a job: Host Grotesk speaks, Fragment Mono labels the instrument, Doto lights up the two or three numbers that matter. Nine roles, used the same way everywhere.</>}
            />
            <div className="is-corners overflow-hidden rounded-[2px] border border-(--is-line) bg-(--is-panel)">
              {[
                {
                  role: "Display",
                  spec: "Host Grotesk 600 · clamp(42–112px) · 0.9 · −4.5%",
                  el: <p className="text-[clamp(40px,6vw,96px)] font-semibold leading-[0.9] tracking-[-0.045em] text-(--is-frost)">Engineer the latent.</p>,
                },
                {
                  role: "Opener",
                  spec: "Host Grotesk 300 caps · clamp(34–60px) · 0.92 · −2% · first line stepped in",
                  el: (
                    <p className="text-[clamp(26px,3.6vw,52px)] font-light uppercase leading-[0.92] tracking-[-0.02em] text-(--is-frost)">
                      <span className="block pl-[0.8em] sm:pl-[1.6em]">Structure lives at</span>
                      <span className="block">the group level</span>
                    </p>
                  ),
                },
                { role: "Heading", spec: "Host Grotesk 600 · 24px · 1.05 · −2%", el: <p className="text-[24px] font-semibold leading-[1.05] tracking-[-0.02em] text-(--is-frost)">Transformer VAE wins Mission 2</p> },
                {
                  role: "Body",
                  spec: "Host Grotesk 400 · 16px · 1.45 · 0 · max 60ch",
                  el: (
                    <p className="max-w-[60ch] text-[16px] leading-[1.45] text-(--is-frost)">
                      A GMM fitted on 30 PCA components picks K = 21 modes for Mission 1 by BIC, close to its 18 operational groups and far above its 4 subsystems.
                    </p>
                  ),
                },
                { role: "Caption", spec: "Host Grotesk 400 · 13px · 1.35 · Steel", el: <p className="text-[13px] leading-[1.35] text-(--is-steel)">Fig. 3a · longest test anomaly, 116,061 timesteps (~967 h) from 2009-05-25.</p> },
                { role: "Label", spec: "Fragment Mono 400 caps · 11px · 0.14em", el: <p className={`${MONO} text-[11px] uppercase tracking-[0.14em] text-(--is-frost)`}>[ M1 · GMM K=21 ] · Neg. log-lik.</p> },
                { role: "Overline", spec: "Fragment Mono 400 caps · 10px · 0.42em · Steel", el: <p className={`${MONO} text-[10px] uppercase tracking-[0.42em] text-(--is-steel)`}>Select a mission to compare</p> },
                { role: "Mono data", spec: "Fragment Mono 400 · 13px · tabular", el: <p className={`${MONO} text-[13px] text-(--is-frost)`}>PR 0.438 · ROC 0.749 · TS 3,062,401 · 0.056 Hz</p> },
                { role: "Numeral", spec: "Doto 600 · 40–84px · 0.85 · ≤ 3 per view", el: <p className={`${DOT} text-[clamp(48px,5vw,80px)] font-semibold leading-[0.85] text-(--is-frost)`}>0.438</p> },
              ].map((t) => (
                <div key={t.role} className="grid gap-3 border-b border-(--is-line) px-4 py-5 last:border-b-0 sm:px-5 lg:grid-cols-12 lg:items-baseline lg:gap-3">
                  <div className="lg:col-span-3">
                    <p className={`${LABEL} text-(--is-frost)`}>{t.role}</p>
                    <p className={`${MONO} mt-1 text-[11px] leading-snug tracking-[0.02em] text-(--is-steel)`}>{t.spec}</p>
                  </div>
                  <div className="min-w-0 lg:col-span-9">{t.el}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ================= 3 spacing & shape ================= */}
          <section id="s-space" aria-labelledby="s-space-h" className="scroll-mt-24">
            <SectionHead
              id="s-space"
              n="03"
              a="Spacing"
              b="& shape"
              intro={<>A drawing sheet, not a card stack: 12 columns with 4px registration marks, hairline panels with corner ticks, near-square corners, no shadows. More space between groups than inside them.</>}
            />
            <div className="grid gap-3 lg:grid-cols-12">
              <Block code="3.1" title="Spacing scale" className="lg:col-span-5">
                <ul className="flex flex-col gap-2.5">
                  {[
                    [4, "Registration mark, icon gap"],
                    [8, "Inside a control"],
                    [12, "Grid gutter, chip gap"],
                    [16, "Panel padding (phone)"],
                    [20, "Panel padding (desktop)"],
                    [24, "Between control groups"],
                    [40, "Between panels' groups"],
                    [80, "Between sections (phone)"],
                    [112, "Between sections (desktop)"],
                  ].map(([px, use]) => (
                    <li key={px} className="grid grid-cols-[2.25rem_minmax(0,4.5rem)_1fr] items-center gap-3 sm:grid-cols-[2.5rem_minmax(0,8.5rem)_1fr]">
                      <span className={`${MONO} text-[11px] text-(--is-frost)`}>{px}</span>
                      <span className="h-2 bg-(--is-frost)" style={{ width: `${((px as number) / 112) * 100}%` }} />
                      <span className="min-w-0 truncate text-[13px] text-(--is-steel)">{use}</span>
                    </li>
                  ))}
                </ul>
              </Block>
              <Block code="3.2" title="Corners · borders · shadow" className="lg:col-span-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ["2px", "Panels", "rounded-[2px]"],
                    ["3px", "Buttons", "rounded-[3px]"],
                    ["Full", "Chips only", "rounded-full"],
                  ].map(([t, u, cls]) => (
                    <div key={t} className="flex flex-col gap-2">
                      <span className={`h-14 border border-(--is-frost) ${cls}`} />
                      <span className={`${MONO} text-[11px] text-(--is-frost)`}>{t}</span>
                      <span className="text-[13px] text-(--is-steel)">{u}</span>
                    </div>
                  ))}
                </div>
                <div className="is-corners relative flex h-24 items-end rounded-[2px] border border-(--is-line) p-3">
                  <span className={`${MONO} text-[11px] text-(--is-steel)`}>1px Hairline + 4px corner ticks</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-16 items-center justify-center rounded-[2px] bg-(--is-void) text-[10px]" aria-hidden />
                  <span className="flex h-12 w-16 rounded-[2px] bg-(--is-panel) outline outline-(--is-line)" aria-hidden />
                  <span className="flex h-12 w-16 rounded-[2px] bg-(--is-charcoal)" aria-hidden />
                  <p className="text-[13px] leading-snug text-(--is-steel)">
                    <span className="text-(--is-frost)">Shadow: none.</span> A hairline instead; depth is Void → Panel → Charcoal.
                  </p>
                </div>
              </Block>
              <Block code="3.3" title="Motion" className="lg:col-span-3">
                <p className={`${MONO} text-[11px] leading-relaxed text-(--is-frost)`}>cubic-bezier(0.2, 0.7, 0.1, 1)</p>
                <MotionDemo />
                <p className="text-[13px] leading-snug text-(--is-steel)">No bounce. Reduced motion: canvas holds one frame, traces render drawn, blur and blink stop.</p>
              </Block>
              <Block code="3.4" title="12-column grid" className="lg:col-span-12">
                <div className="is-regdots relative grid h-28 grid-cols-6 gap-3 rounded-[2px] border border-(--is-line) p-3 md:grid-cols-12">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span key={i} className={`relative border border-dashed border-(--is-line) ${i >= 6 ? "max-md:hidden" : ""}`}>
                      <span className="absolute -top-[7px] left-0 size-1 bg-(--is-steel)" />
                      <span className={`${MONO} absolute bottom-1 left-1.5 text-[10px] text-(--is-steel)`}>{String(i + 1).padStart(2, "0")}</span>
                    </span>
                  ))}
                </div>
                <p className="text-[13px] text-(--is-steel)">12 columns, 12px gutter, max width 1920px (2560 screens get even void margins). Phones: 1 column; tablets: 2; desktop: 12.</p>
              </Block>
            </div>
          </section>

          {/* ================= 4 components ================= */}
          <section id="s-components" aria-labelledby="s-components-h" className="scroll-mt-24">
            <SectionHead
              id="s-components"
              n="04"
              a="Core"
              b="components"
              intro={<>Every component is live and set in our content. Each panel ends with its spec line: name, when to use it, its tokens.</>}
            />
            <Components rows={rows} tree={tr} />
          </section>

          {/* ================= 5 control states ================= */}
          <section id="s-states" aria-labelledby="s-states-h" className="scroll-mt-24">
            <SectionHead
              id="s-states"
              n="05"
              a="Control"
              b="states"
              intro={<>Six states side by side, forced so they can be compared. The live versions above use the identical class strings. Hover lifts the border to Frost; focus adds a 2px Frost ring; pressed drops 1px onto Charcoal.</>}
            />
            <ControlStates />
          </section>

          {/* ================= 6 UI states ================= */}
          <section id="s-ui" aria-labelledby="s-ui-h" className="scroll-mt-24">
            <SectionHead
              id="s-ui"
              n="06"
              a="UI"
              b="states"
              intro={<>Empty, loading, error and success for one real surface: the Mission 2 run list. Shown side by side, then live: Simulate runs the whole sequence, including a retry.</>}
            />
            <UiStates />
          </section>

          {/* ================= Parts ================= */}
          <section id="s-parts" aria-labelledby="s-parts-h" className="scroll-mt-24">
            <SectionHead
              id="s-parts"
              n="P"
              a="Parts of an"
              b="interface"
              intro={<>Every element from the Week 2 slide. Those already built in section 4 are linked; the rest are here.</>}
            />
            <nav aria-label="Parts checklist" className="mb-3">
              <ol className="grid grid-cols-2 gap-px overflow-hidden rounded-[2px] border border-(--is-line) bg-(--is-line) sm:grid-cols-3 lg:grid-cols-6">
                {PARTS_INDEX.map(([t, href], i) => (
                  <li key={t}>
                    <a
                      href={href}
                      className={`${MONO} group flex h-full min-h-12 items-center justify-between gap-2 bg-(--is-panel) px-3 py-2 text-[11px] uppercase tracking-[0.1em] text-(--is-frost) transition-colors duration-200 hover:bg-(--is-void) active:bg-(--is-charcoal) focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--is-frost)`}
                    >
                      <span>
                        <span className="mr-2 text-(--is-steel)">{String(i + 1).padStart(2, "0")}</span>
                        {t}
                      </span>
                      <span aria-hidden className="text-(--is-steel) transition-transform duration-200 group-hover:translate-x-0.5">
                        ↘
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <Parts strands={s2} />
          </section>

          {/* ================= Novel ================= */}
          <section id="s-novel" aria-labelledby="s-novel-h" className="scroll-mt-24">
            <SectionHead
              id="s-novel"
              n="N"
              a="Novel"
              b="components"
              intro={<>Ten pieces lifted from the board&apos;s reference sites (iCOMAT, Helion, Planet, NASA&apos;s Eyes), each rebuilt around our data. Every card names its source and what changed.</>}
            />
            <div className="grid gap-3 lg:grid-cols-12">
              <NovelFiber m1={s1} m2={s2} />
              <NovelDoto />
              <NovelWords />
              <NovelFocus />
              <NovelCompare tree={tr} ari={{ sub: headline.ariSub, group: headline.ariGroup }} />
              <NovelProcess />
              <NovelTags />
              <NovelMechanism />
              <NovelZoom tree={tr} />
              <NovelEntries />
            </div>
          </section>

          {/* ================= Telemetry ================= */}
          <section id="s-telemetry" aria-labelledby="s-telemetry-h" className="scroll-mt-24">
            <SectionHead
              id="s-telemetry"
              n="T"
              a="Telemetry"
              b="components"
              intro={<>Eight components built only for this project, all running on the exported data: Table 1, 33 saved PR curves, score timelines, BIC sweeps, the channel hierarchy and the anomaly catalogue.</>}
            />
            <div className="grid gap-3 lg:grid-cols-12">
              <TThreshold curves={cv} />
              <TMission missions={ms} />
              <TMethod rows={rows} />
              <TPr curves={cv} />
              <TTimeline tl={tl} />
              <TBic bic={bic} />
              <TEvents ev={ev} />
              <TTable rows={rows} />
            </div>
          </section>

          <footer className={`${MONO} mt-24 grid gap-3 border-t border-(--is-line) py-8 text-[11px] uppercase tracking-[0.12em] text-(--is-steel) sm:grid-cols-2`}>
            <p>Intense Space · Design System · built from /mood-boards/intense-space</p>
            <p className="sm:text-right">Data: Madhogarhia &amp; Watkins, TTIC 31220 · ESA-ADB</p>
          </footer>
        </div>
      </ToastProvider>
    </main>
  );
}
