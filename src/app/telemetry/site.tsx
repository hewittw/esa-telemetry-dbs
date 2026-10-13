"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { Bic, Curves, Row, Timelines, Tree } from "../design-systems/intense-space/data";
import { BTN, Br, DOT, FR, LABEL, MONO, Segmented, TRANS } from "../design-systems/intense-space/ui";
import { FiberField } from "./fiber";
import { BicPicker, Compare, Ladder, MethodModal, Panel, ResultsTable, Threshold, Timeline, Zoom, type M, type Prov } from "./figures";
import { DataPanel, MethodLine, QuestionPanel, ScorePanel, Takeaways, type MissionFacts } from "./story";
import { N_PAGES, PAGES, PDF, PageLink, ReaderProvider, useReader } from "./reader";
import { KeyedReveal } from "./reveal";
import { TourButton, TourProvider } from "./tour";

export type { Prov };
type Strand = { s: number; a: number };
export type SiteData = {
  rows: Row[];
  curves: Curves;
  tl: Timelines;
  bic: Bic;
  tree: Tree;
  strands: { 1: Strand[]; 2: Strand[] };
  prov: Record<string, Prov>;
  facts: Record<M, MissionFacts>;
};

const NAV = [
  { id: "background", n: "01", t: "Background" },
  { id: "method", n: "02", t: "Method" },
  { id: "results", n: "03", t: "Results" },
  { id: "conclusions", n: "04", t: "Conclusions" },
  { id: "paper", n: "05", t: "Paper" },
];
const K: Record<M, number> = { 1: 21, 2: 29 };
const pad = (n: number) => String(n).padStart(2, "0");
// one left edge for the whole page: header, hero copy, openers and panels share this padding
const EDGE = "px-3 sm:px-6 xl:px-10";

export function Site({ data }: { data: SiteData }) {
  // focus target when the tour ends but its launcher is gone (e.g. it was started from the closed ≡ menu)
  const fallback = useCallback(() => {
    const b = document.getElementById("isx-menu-btn");
    return b && b.offsetParent !== null ? b : document.getElementById("isx-finding");
  }, []);
  return (
    <ReaderProvider>
      <TourProvider fallbackFocus={fallback}>
        <Inner data={data} />
      </TourProvider>
    </ReaderProvider>
  );
}

function Inner({ data }: { data: SiteData }) {
  // ONE mission for the whole page: the header switch is the only control that writes it
  const [m, setM] = useState<M>(1);
  const [row, setRow] = useState<Row | null>(null);
  return (
    <>
      <a href="#background" className={`${MONO} sr-only z-[80] rounded-[2px] bg-(--is-frost) px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-(--is-void) focus:not-sr-only focus:fixed focus:left-3 focus:top-3`}>
        Skip to the sections
      </a>
      <Header m={m} setM={setM} />
      <p className="sr-only" aria-live="polite">
        Showing Mission {m}
      </p>
      <Hero m={m} strands={data.strands} />
      <main className={`mx-auto w-full max-w-[1920px] ${EDGE}`}>
        <Section
          id="background"
          a="The problem,"
          b="the data"
          lead="Spacecraft engineers monitor 76+ sensor channels manually or with threshold alarms. Kotowski et al. (2024) showed unsupervised detectors keep raising false alarms, but not why."
        >
          <Grid>
            <DataPanel f={data.facts[m]} m={m} />
            <Zoom tree={data.tree} m={m} />
            <QuestionPanel />
          </Grid>
        </Section>

        <Section id="method" a="What we" b="did" lead="Five progressively richer unsupervised methods, run on each mission separately and scored by PR-AUC (precision–recall area), because anomalies are rare.">
          <Grid>
            <MethodLine rows={data.rows} m={m} onOpen={setRow} />
            <ScorePanel m={m} pos={data.facts[m].pos} />
          </Grid>
        </Section>

        <Section
          id="results"
          a="What we"
          b="found"
          lead="The structure sits at operational-group level, not subsystem level. Linear methods plateau at 0.322; GMM reaches 0.384 (M1), TransformerVAE 0.438 (M2)."
          keys={["operational-group"]}
        >
          <Group label="Q1 · Structure" first>
            <BicPicker bic={data.bic} m={m} />
            <Compare tree={data.tree} m={m} />
          </Group>
          <Group label="Q2 · Detection">
            <Ladder rows={data.rows} m={m} onOpen={setRow} />
            <ResultsTable rows={data.rows} m={m} prov={data.prov} onOpen={setRow} />
            <Threshold curves={data.curves} m={m} />
          </Group>
          <Group label="The bottleneck · multi-modality">
            <Timeline tl={data.tl} m={m} />
          </Group>
        </Section>

        <Section
          id="conclusions"
          a="What it"
          b="means"
          lead="Every unsupervised complexity selector converged on group-level granularity. GMM and VAEs improve over linear baselines, especially on Mission 2; the bottleneck persists."
          keys={["group-level"]}
        >
          <Grid>
            <Takeaways m={m} />
          </Grid>
        </Section>

        <PaperSection />
        <MethodModal row={row} rows={data.rows} prov={data.prov} onClose={() => setRow(null)} onSwitch={setRow} />
      </main>
      <Footer />
    </>
  );
}

/* ---------------- header: hub · wordmark · sections · mission · tour · paper ---------------- */
function MissionSwitch({ m, setM }: { m: M; setM: (m: M) => void }) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span aria-hidden className={`${LABEL} text-(--is-steel) max-xl:hidden`}>
        Mission
      </span>
      <Segmented
        label="Mission shown in every figure"
        value={m}
        onChange={setM}
        options={[
          { v: 1, t: "M1" },
          { v: 2, t: "M2" },
        ]}
      />
    </div>
  );
}

function Header({ m, setM }: { m: M; setM: (m: M) => void }) {
  const open = useReader();
  const [menu, setMenu] = useState(false);
  const [cur, setCur] = useState<string | null>(null);
  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setCur(e.target.id)), { rootMargin: "-45% 0px -50% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  // Esc closes the ≡ menu and hands focus back to its button
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        document.getElementById("isx-menu-btn")?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menu]);
  const link = (n: (typeof NAV)[number], mobile = false) => (
    <a
      key={n.id}
      href={`#${n.id}`}
      onClick={() => setMenu(false)}
      aria-current={cur === n.id ? "location" : undefined}
      className={`${MONO} ${TRANS} inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-[2px] px-2 text-[11px] uppercase tracking-[0.14em] text-(--is-steel) hover:text-(--is-frost) active:bg-(--is-charcoal) aria-[current]:text-(--is-frost) ${FR} ${mobile ? "w-full border-b border-(--is-line) px-1 py-3" : ""}`}
    >
      <span className={`${mobile ? "" : "max-2xl:hidden"} ${cur === n.id ? "text-(--is-frost)" : "text-(--is-steel)"}`}>{n.n}</span>
      {n.t}
    </a>
  );
  return (
    <header className="sticky top-0 z-50 border-b border-(--is-line) bg-(--is-void)/92 backdrop-blur-[8px]">
      <div className="mx-auto flex h-14 max-w-[1920px] items-center gap-2 px-3 sm:gap-3 sm:px-6 xl:px-10">
        <Link href="/" className={`${BTN.ghost} -ml-4 shrink-0`}>
          <span aria-hidden>←</span> Hub
        </Link>
        <span aria-hidden className="h-5 w-px shrink-0 bg-(--is-line) max-sm:hidden" />
        <a href="#top" className={`group ${MONO} ${TRANS} shrink-0 whitespace-nowrap rounded-[2px] px-1 text-[11px] uppercase tracking-[0.14em] text-(--is-frost) active:bg-(--is-charcoal) ${FR} max-[359px]:hidden`}>
          <span className={`${TRANS} text-(--is-steel) group-hover:text-(--is-frost)`}>[</span> ESA<span className="max-sm:hidden lg:max-[1439px]:hidden"> telemetry</span> <span className={`${TRANS} text-(--is-steel) group-hover:text-(--is-frost)`}>]</span>
        </a>
        <nav aria-label="Sections" className="ml-auto hidden items-center lg:flex">
          {NAV.map((n) => link(n))}
        </nav>
        <span aria-hidden className="h-5 w-px shrink-0 bg-(--is-line) max-lg:hidden" />
        <div className="max-lg:ml-auto">
          <MissionSwitch m={m} setM={setM} />
        </div>
        <TourButton className="shrink-0 max-lg:hidden" compact />
        <button type="button" onClick={() => open(1)} className={`group ${BTN.secondary} shrink-0 max-xl:hidden`}>
          <Br>Paper · PDF</Br>
        </button>
        <button
          id="isx-menu-btn"
          type="button"
          aria-expanded={menu}
          aria-controls="isx-menu"
          aria-label="Menu"
          onClick={() => setMenu((x) => !x)}
          className={`${BTN.secondary} w-10 shrink-0 px-0 text-[16px] lg:hidden aria-expanded:border-(--is-frost)`}
        >
          {menu ? "✕" : "≡"}
        </button>
      </div>
      {menu ? (
        <nav id="isx-menu" aria-label="Sections" className="isd-dialog border-t border-(--is-line) bg-(--is-void) px-3 pb-4 sm:px-6 lg:hidden">
          {NAV.map((n) => link(n, true))}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <span onClick={() => setMenu(false)} className="contents">
              <TourButton className="w-full" />
            </span>
            <button type="button" onClick={() => (setMenu(false), open(1))} className={`group ${BTN.secondary} w-full`}>
              <Br>Paper · PDF</Br>
            </button>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

/* ---------------- hero: the finding + the one primary action, over the fiber field ---------------- */
function Hero({ m, strands }: { m: M; strands: SiteData["strands"] }) {
  const open = useReader();
  const sub = m === 1 ? 4 : 5;
  const grp = m === 1 ? 18 : 29;
  const faults = strands[m].filter((x) => x.a > 0.6).length;
  return (
    <section id="top" aria-labelledby="isx-finding" className="isx-anchor relative isolate mx-auto flex min-h-[calc(100svh-56px)] w-full max-w-[1920px] flex-col justify-end overflow-hidden border-b border-(--is-line) bg-(--is-charcoal) sm:min-h-[640px] lg:h-[clamp(640px,calc(100svh-56px),940px)]">
      <div className="absolute inset-0 -z-10">
        <FiberField key={m} strands={strands[m]} mission={m} />
      </div>
      <div aria-hidden className="isd-grain pointer-events-none absolute inset-0 -z-10" />
      <div aria-hidden className="is-scan pointer-events-none absolute inset-0 -z-10 opacity-60" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_top,#0A0B0D_0%,rgba(10,11,13,0.92)_62%,rgba(10,11,13,0.35)_88%,rgba(10,11,13,0.15)_100%)] lg:bg-[linear-gradient(to_top,#0A0B0D_0%,rgba(10,11,13,0.92)_38%,rgba(10,11,13,0.3)_72%,rgba(10,11,13,0.1)_100%)]" />
      <p className={`${LABEL} absolute left-3 top-3 max-w-[calc(100%-140px)] rounded-[2px] bg-(--is-void)/92 px-2.5 py-1.5 leading-[1.5] text-(--is-frost) sm:left-6 xl:left-10`}>
        <span className="text-(--is-steel)">[ Fiber field ]</span>
        <span className="max-sm:hidden"> 300 strands = the Mission {m} test set · brightness = anomaly score ·</span>
        <span className="sm:hidden"> M{m} ·</span> <span className="text-(--is-fault)">■</span> {faults} labelled {faults === 1 ? "fault" : "faults"}
      </p>

      <div className={`grid gap-8 pb-6 pt-28 sm:pb-10 sm:pt-24 lg:grid-cols-12 lg:items-end lg:gap-3 lg:pb-10 [&>*]:min-w-0 ${EDGE}`}>
        <div className="isx-rise lg:col-span-7 xl:col-span-8">
          <p className={`${MONO} mb-5 text-[10px] uppercase tracking-[0.24em] text-(--is-frost) sm:tracking-[0.42em]`}>ESA satellite telemetry · Madhogarhia &amp; Watkins · 2026</p>
          <h1 id="isx-finding" tabIndex={-1} className="max-w-[17ch] text-[clamp(40px,6.4vw,112px)] font-semibold leading-[0.9] tracking-[-0.045em] text-(--is-frost) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--is-frost)">
            Telemetry runs in{" "}
            <span className="isx-pull whitespace-nowrap" aria-label="18 to 29">
              {"18–29".split("").map((c, i) => (
                <span key={i} aria-hidden style={{ animationDelay: `${200 + i * 140}ms` }}>
                  {c}
                </span>
              ))}
            </span>{" "}
            <span className="text-(--is-teal)">operating modes,</span> <span className="font-light text-(--is-steel) [text-shadow:0_0_6px_#0A0B0D,0_0_14px_#0A0B0D,0_0_28px_#0A0B0D]">not <span className="whitespace-nowrap">4–5</span> subsystems.</span>
          </h1>
          <p className="mt-6 max-w-[40ch] text-[clamp(18px,1.7vw,28px)] font-light leading-[1.2] tracking-[-0.01em] text-(--is-frost)">Each mode has its own normal: multi-modality is the bottleneck for every global model.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => open(1)} className={`group ${BTN.primary} min-h-12 px-5 text-[12px]`}>
              <Br>Read the paper</Br>
            </button>
            <TourButton className="min-h-12 bg-(--is-void)/60 px-5 lg:hidden" />
          </div>
        </div>

        <div className="isx-rise is-corners isx-fill-void rounded-[2px] border border-(--is-line) lg:col-span-5 xl:col-span-4" style={{ animationDelay: "160ms" }}>
          <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 border-b border-(--is-line) py-1 pl-4 pr-2">
            <span className={`${LABEL} whitespace-nowrap text-(--is-steel)`}>
              [ Modes found · <span className="text-(--is-frost)">M{m}</span> ]
            </span>
            <PageLink page={5}>Discussion</PageLink>
          </div>
          <div className="grid grid-cols-[auto_1fr] items-end gap-4 p-4 sm:gap-5">
            <div aria-live="polite">
              <p className={`${LABEL} text-(--is-steel)`}>Modes</p>
              <p key={m} className={`${DOT} isx-page text-[88px] font-semibold leading-[0.82] text-(--is-frost)`}>{K[m]}</p>
            </div>
            <dl className={`${MONO} flex flex-col gap-2 text-[11px] uppercase tracking-[0.1em]`}>
              <div className="flex justify-between gap-3 border-b border-(--is-line) pb-1.5">
                <dt className="text-(--is-teal)">Operational groups</dt>
                <dd className="text-(--is-teal)">{grp}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-(--is-steel)">Subsystems</dt>
                <dd className="text-(--is-steel)">{sub}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- section scaffold: the same rhythm every time ----------------
   number + title (cols 1–5) · one lead (cols 7–12, bottom-aligned) · panels on the same 12-col grid */
function Opener({ id, a, b }: { id: string; a: string; b: string }) {
  const n = NAV.find((x) => x.id === id)!;
  return (
    <div className="lg:col-span-5">
      <p className={`${MONO} mb-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.42em] text-(--is-steel)`}>
        <span className="text-(--is-frost)">{n.n}</span>
        <span aria-hidden className="h-px w-10 bg-(--is-line)" />
        {n.t}
      </p>
      <h2 id={`${id}-h`} className="text-[clamp(34px,4vw,60px)] font-light uppercase leading-[0.92] tracking-[-0.02em] text-(--is-frost)">
        <span className="block pl-[1.6em]">{a}</span>
        <span className="block">{b}</span>
      </h2>
    </div>
  );
}
function Section({ id, a, b, lead, keys, children }: { id: string; a: string; b: string; lead: string; keys?: string[]; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="isx-anchor">
      <div className="grid gap-5 pb-8 pt-20 lg:grid-cols-12 lg:gap-3 lg:pb-10 lg:pt-28">
        <Opener id={id} a={a} b={b} />
        <div className="max-w-[40ch] self-end lg:col-span-6 lg:col-start-7 lg:max-w-none">
          <KeyedReveal text={lead} keys={keys} />
        </div>
      </div>
      {children}
    </section>
  );
}
function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 lg:grid-cols-12">{children}</div>;
}
/* a labelled group inside a section: more space between groups (48–64px) than inside one (12px) */
function Group({ label, first, children }: { label: string; first?: boolean; children: ReactNode }) {
  return (
    <div className={first ? "" : "mt-12 lg:mt-16"}>
      <p className={`${LABEL} mb-3 flex items-center gap-3 text-(--is-frost)`}>
        {label}
        <span aria-hidden className="h-px flex-1 bg-(--is-line)" />
      </p>
      <Grid>{children}</Grid>
    </div>
  );
}

/* ---------------- 05 · the paper ---------------- */
const BACKS = [
  { p: 5, t: "Table 1", d: "all 13 results" },
  { p: 3, t: "Fig. 1", d: "K-Means PR curve, t-SNE" },
  { p: 7, t: "Fig. 3", d: "timeline failure modes" },
  { p: 9, t: "Fig. 5", d: "Nystroem-KPCA sweep" },
  { p: 11, t: "Fig. 7", d: "TransformerVAE latent space" },
];
function PaperSection() {
  const open = useReader();
  return (
    <Section id="paper" a="The" b="paper" lead="Uncovering Latent Structure in ESA Satellite Telemetry. Rhea Madhogarhia & Hewitt Watkins, TTIC 31220, Spring 2026.">
      <Grid>
        <Panel id="paper-read" code="P.01" title={`Read or download · ${N_PAGES} pages`} className="lg:col-span-5">
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => open(1)} className={`group ${BTN.primary} min-h-12 px-5 text-[12px]`}>
              <Br>Read the paper</Br>
            </button>
            <a href={PDF} download className={`group ${BTN.secondary} min-h-12 px-5`}>
              <Br>
                <span aria-hidden>↓ </span>Download PDF
              </Br>
            </a>
          </div>
          <div className="mt-auto">
            <p className={`${LABEL} mb-1 text-(--is-steel)`}>Pages that back a finding</p>
            <ul className="border-t border-(--is-line)">
              {BACKS.map((b) => (
                <li key={b.p}>
                  <button type="button" onClick={() => open(b.p)} className={`group grid min-h-12 w-full grid-cols-[3.25rem_1fr_auto] items-center gap-3 border-b border-(--is-line) text-left ${TRANS} hover:bg-(--is-void) active:bg-(--is-charcoal) ${FR} focus-visible:outline-offset-0`}>
                    <span className={`${MONO} pl-1 text-[13px] text-(--is-steel) ${TRANS} group-hover:text-(--is-frost)`}>p.{pad(b.p)}</span>
                    <span className="text-[14px] leading-snug text-(--is-frost)">
                      {b.t} <span className="text-(--is-steel)">· {b.d}</span>
                    </span>
                    <span aria-hidden className={`${MONO} pr-2 text-(--is-steel) ${TRANS} group-hover:translate-x-1 group-hover:text-(--is-frost)`}>
                      ↗
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
        <Panel id="paper-strip" code="P.02" title="Page strip · ◆ backs a finding" className="lg:col-span-7">
          <ol className="isx-strip is-regdots -m-4 flex flex-1 items-center gap-4 overflow-x-auto p-4 sm:-m-5 sm:p-6" aria-label="Paper pages">
            {PAGES.map((p) => (
              <li key={p.n} className="shrink-0">
                <button type="button" onClick={() => open(p.n)} aria-label={`Open page ${p.n}: ${p.t}`} className={`group block rounded-[2px] text-left ${FR}`}>
                  <span className={`block border p-1 ${TRANS} ${p.key ? "border-[#5a6066]" : "border-(--is-line)"} group-hover:-translate-y-1 group-hover:border-(--is-frost) group-active:translate-y-0`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/paper/pages/thumb-${pad(p.n)}.jpg`} alt="" width={320} height={415} className="block h-[200px] w-auto bg-white sm:h-[260px] lg:h-[330px]" />
                  </span>
                  <span className={`${MONO} mt-2 flex max-w-[154px] gap-2 text-[10px] uppercase leading-[1.4] tracking-[0.1em] text-(--is-steel) group-hover:text-(--is-frost) sm:max-w-[200px] lg:max-w-[255px]`}>
                    <span className="text-(--is-frost)">{pad(p.n)}</span>
                    <span>
                      {p.key ? "◆ " : ""}
                      {p.t}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </Panel>
      </Grid>
    </Section>
  );
}

/* ---------------- footer: authorship + citation ---------------- */
function Footer() {
  return (
    <footer className="mx-auto mt-28 w-full max-w-[1920px] px-3 pb-10 sm:px-6 xl:px-10">
      <div className="grid gap-8 border-t border-(--is-frost) pt-8 lg:grid-cols-12 lg:gap-3">
        <div className="lg:col-span-5">
          <p className={`${LABEL} text-(--is-steel)`}>[ About this site ]</p>
          <p className="mt-3 text-[28px] font-semibold leading-[1.05] tracking-[-0.03em] text-(--is-frost)">Designed &amp; built by Hewitt Watkins.</p>
          <p className="mt-3 max-w-[46ch] text-[16px] leading-[1.45] text-(--is-steel)">
            This site is Hewitt&apos;s project: the design, the code, and every figure, redrawn from the paper&apos;s saved results.
          </p>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <p className={`${LABEL} text-(--is-steel)`}>[ The paper ]</p>
          <p className="mt-3 text-[16px] leading-[1.45] text-(--is-frost)">
            Rhea Madhogarhia &amp; Hewitt Watkins. <span className="italic">Uncovering Latent Structure in ESA Satellite Telemetry.</span> TTIC 31220, Unsupervised Learning and Data Analysis, Spring 2026.
          </p>
          <p className="mt-3 text-[16px] leading-[1.45] text-(--is-steel)"> Data: the ESA Anomaly Dataset (Kotowski et al., 2024).
          </p>
        </div>
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <p className={`${MONO} text-[10px] uppercase tracking-[0.16em] text-(--is-steel)`}>MPCS 51238 · Design, Build, Ship · Intense Space</p>
        <Link href="/" className={`${BTN.ghost} -mr-4`}>
          <span aria-hidden>←</span> Hub
        </Link>
      </div>
    </footer>
  );
}
