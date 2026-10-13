"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Bic, Curves, Row, Timelines, Tree } from "../../design-systems/intense-space/data";
import { BTN, Br, DOT, FR, LABEL, MONO, Segmented, TRANS } from "../../design-systems/intense-space/ui";
import { FiberField } from "../../mood-boards/intense-space/fiber-field";
import { WordReveal } from "../../mood-boards/intense-space/word-reveal";
import { BicPicker, Compare, Ladder, MethodModal, ResultsTable, Threshold, Timeline, Zoom, type M } from "./figures";
import { N_PAGES, PAGES, PDF, PageLink, ReaderProvider, useReader } from "./reader";

type Strand = { s: number; a: number };
export type SiteData = {
  rows: Row[];
  curves: Curves;
  tl: Timelines;
  bic: Bic;
  tree: Tree;
  strands: { 1: Strand[]; 2: Strand[] };
  ari: { sub: number; group: number };
};

const NAV = [
  { id: "structure", n: "01", t: "Structure" },
  { id: "methods", n: "02", t: "Methods" },
  { id: "evidence", n: "03", t: "Evidence" },
  { id: "paper", n: "04", t: "Paper" },
];
const pad = (n: number) => String(n).padStart(2, "0");

export function Site({ data }: { data: SiteData }) {
  return (
    <ReaderProvider>
      <Inner data={data} />
    </ReaderProvider>
  );
}

function Inner({ data }: { data: SiteData }) {
  // one mission for the whole page: every mission switch reads and writes this
  const [m, setM] = useState<M>(1);
  const [row, setRow] = useState<Row | null>(null);
  return (
    <>
      <a href="#structure" className={`${MONO} sr-only z-[80] rounded-[2px] bg-(--is-frost) px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-(--is-void) focus:not-sr-only focus:fixed focus:left-3 focus:top-3`}>
        Skip to the findings
      </a>
      <Header />
      <main className="mx-auto w-full max-w-[1920px] px-3 sm:px-6 xl:px-10">
        <Hero m={m} setM={setM} strands={data.strands} />

        <Section
          id="structure"
          n="01"
          a="Where the"
          b="structure lives"
          intro={<WordReveal lead="Why detectors fail." text="Every global detector we tried stalls near PR-AUC 0.322. The telemetry is not one cloud of normal. It is 18 to 29 operating modes, and an anomaly is only strange relative to its own mode." />}
          wide
        >
          <Compare tree={data.tree} m={m} setM={setM} ari={data.ari} />
          <BicPicker bic={data.bic} m={m} setM={setM} />
          <Zoom tree={data.tree} m={m} setM={setM} />
        </Section>

        <Section id="methods" n="02" a="Five families," b="two missions" intro="K-Means, PCA and kernel PCA set the floor. A Gaussian mixture and three VAEs try to learn the modes. Same test sets, same metric: PR-AUC.">
          <Ladder rows={data.rows} onOpen={setRow} />
          <ResultsTable rows={data.rows} onOpen={setRow} />
          <MethodModal row={row} rows={data.rows} onClose={() => setRow(null)} onSwitch={setRow} />
        </Section>

        <Section id="evidence" n="03" a="Test it" b="yourself" intro="Two instruments on our saved scores: pick an alarm threshold on a real precision-recall curve, then scrub years of telemetry against the labelled faults.">
          <Threshold curves={data.curves} m={m} setM={setM} />
          <Timeline tl={data.tl} m={m} setM={setM} />
        </Section>

        <PaperSection />
      </main>
      <Footer />
    </>
  );
}

/* ---------------- header: hub link, sections, paper ---------------- */
function Header() {
  const open = useReader();
  const [menu, setMenu] = useState(false);
  const [cur, setCur] = useState<string | null>(null);
  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setCur(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  const link = (n: (typeof NAV)[number], mobile = false) => (
    <a
      key={n.id}
      href={`#${n.id}`}
      onClick={() => setMenu(false)}
      aria-current={cur === n.id ? "location" : undefined}
      className={`${MONO} ${TRANS} inline-flex min-h-10 items-center gap-2 rounded-[2px] px-2 text-[11px] uppercase tracking-[0.14em] text-(--is-steel) hover:text-(--is-frost) active:bg-(--is-charcoal) aria-[current]:text-(--is-frost) ${FR} ${mobile ? "w-full border-b border-(--is-line) px-1 py-3" : ""}`}
    >
      <span className={cur === n.id ? "text-(--is-frost)" : "text-(--is-steel)"}>{n.n}</span>
      {n.t}
    </a>
  );
  return (
    <header className="sticky top-0 z-50 border-b border-(--is-line) bg-(--is-void)/92 backdrop-blur-[8px]">
      <div className="mx-auto flex h-14 max-w-[1920px] items-center gap-3 px-3 sm:px-6 xl:px-10">
        <Link href="/" className={`${BTN.ghost} -ml-2`}>
          <span aria-hidden>←</span> Hub
        </Link>
        <span aria-hidden className="h-5 w-px bg-(--is-line)" />
        <a href="#top" className={`${MONO} whitespace-nowrap rounded-[2px] text-[11px] uppercase tracking-[0.14em] text-(--is-frost) ${FR}`}>
          <span className="text-(--is-steel)">[</span> ESA telemetry <span className="max-sm:hidden">· latent structure</span> <span className="text-(--is-steel)">]</span>
        </a>
        <nav aria-label="Sections" className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((n) => link(n))}
        </nav>
        <button type="button" onClick={() => open(1)} className={`group ${BTN.secondary} ml-2 max-lg:hidden`}>
          <Br>Paper · PDF</Br>
        </button>
        <button
          type="button"
          aria-expanded={menu}
          aria-controls="isx-menu"
          aria-label="Menu"
          onClick={() => setMenu((x) => !x)}
          className={`${BTN.secondary} ml-auto w-10 px-0 text-[16px] lg:hidden aria-expanded:border-(--is-frost)`}
        >
          {menu ? "✕" : "≡"}
        </button>
      </div>
      {menu ? (
        <nav id="isx-menu" aria-label="Sections" className="isd-dialog border-t border-(--is-line) bg-(--is-void) px-3 pb-3 sm:px-6 lg:hidden">
          {NAV.map((n) => link(n, true))}
          <button type="button" onClick={() => (setMenu(false), open(1))} className={`group ${BTN.secondary} mt-3 w-full`}>
            <Br>Open the paper · PDF</Br>
          </button>
        </nav>
      ) : null}
    </header>
  );
}

/* ---------------- hero: the finding over the live fiber field ---------------- */
function Hero({ m, setM, strands }: { m: M; setM: (m: M) => void; strands: SiteData["strands"] }) {
  const open = useReader();
  const k = m === 1 ? 21 : 29;
  const sub = m === 1 ? 4 : 5;
  const grp = m === 1 ? 18 : 29;
  const faults = strands[m].filter((x) => x.a > 0.6).length;
  return (
    <section id="top" aria-labelledby="isx-finding" className="isx-anchor pt-3 lg:pt-5">
      <div className="relative isolate flex min-h-[calc(100svh-80px)] flex-col justify-end overflow-hidden rounded-[2px] border border-(--is-line) bg-(--is-charcoal) sm:min-h-[640px] lg:h-[clamp(640px,calc(100svh-84px),940px)]">
        <div className="absolute inset-0 -z-10">
          <FiberField key={m} strands={strands[m]} />
        </div>
        <div aria-hidden className="isd-grain pointer-events-none absolute inset-0 -z-10" />
        <div aria-hidden className="is-scan pointer-events-none absolute inset-0 -z-10 opacity-60" />
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_top,#0A0B0D_0%,rgba(10,11,13,0.9)_34%,rgba(10,11,13,0.25)_70%,rgba(10,11,13,0.1)_100%)]" />
        <p className={`${LABEL} absolute left-3 top-3 max-w-[calc(100%-140px)] rounded-[2px] bg-(--is-void)/92 px-2.5 py-1.5 leading-[1.5] text-(--is-frost)`}>
          <span className="text-(--is-steel)">[ Fiber field ]</span> <span className="max-sm:hidden">300 strands = </span>the Mission {m} test set<span className="max-sm:hidden"> · brightness = GMM score</span> · <span className="text-(--is-fault)">■</span> {faults} labelled-fault slices
        </p>

        <div className="grid gap-8 p-4 pt-24 sm:p-8 lg:grid-cols-12 lg:items-end lg:gap-3 lg:p-10">
          <div className="isx-rise lg:col-span-8">
            <p className={`${MONO} mb-5 text-[10px] uppercase tracking-[0.24em] text-(--is-frost) sm:tracking-[0.42em]`}>
              ESA satellite telemetry · Madhogarhia &amp; Watkins · 2026
            </p>
            <h1 id="isx-finding" className="max-w-[17ch] text-[clamp(40px,6.4vw,112px)] font-semibold leading-[0.9] tracking-[-0.045em] text-(--is-frost)">
              Telemetry runs in{" "}
              <span className="isx-pull whitespace-nowrap" aria-label="18 to 29">
                {"18–29".split("").map((c, i) => (
                  <span key={i} aria-hidden style={{ animationDelay: `${200 + i * 140}ms` }}>
                    {c}
                  </span>
                ))}
              </span>{" "}
              operating modes, <span className="font-light">not 4–5 subsystems.</span>
            </h1>
            <p className="mt-6 max-w-[40ch] text-[clamp(18px,1.7vw,28px)] font-light leading-[1.2] tracking-[-0.01em] text-(--is-frost)">
              Each mode has its own normal. That multi-modality is why every global detector we tried fails.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => open(1)} className={`group ${BTN.primary} min-h-12 px-5 text-[12px]`}>
                <Br>Read the paper</Br>
              </button>
              <a href="#structure" className={`group ${BTN.secondary} min-h-12 bg-(--is-void)/60 px-5`}>
                <Br>See the evidence ↓</Br>
              </a>
            </div>
          </div>

          <div className="isx-rise is-corners isx-fill-void rounded-[2px] border border-(--is-line) lg:col-span-4" style={{ animationDelay: "160ms" }}>
            <div className="flex items-center justify-between gap-3 border-b border-(--is-line) py-1.5 pl-4 pr-1.5">
              <span className={`${LABEL} text-(--is-steel)`}>[ Modes found by BIC ]</span>
              <Segmented label="Mission" value={m} onChange={setM} options={[{ v: 1, t: "M1" }, { v: 2, t: "M2" }]} />
            </div>
            <div className="grid grid-cols-[auto_1fr] items-end gap-5 p-4">
              <div aria-live="polite">
                <p className={`${LABEL} text-(--is-steel)`}>GMM K* · M{m}</p>
                <p key={m} className={`${DOT} isx-page text-[88px] font-semibold leading-[0.82] text-(--is-frost)`}>{k}</p>
              </div>
              <dl className={`${MONO} flex flex-col gap-2 text-[11px] uppercase tracking-[0.1em]`}>
                <div className="flex justify-between gap-3 border-b border-(--is-line) pb-1.5">
                  <dt className="text-(--is-steel)">Subsystems</dt>
                  <dd className="text-(--is-frost)">{sub}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-(--is-line) pb-1.5">
                  <dt className="text-(--is-teal)">Operational groups</dt>
                  <dd className="text-(--is-teal)">{grp}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-(--is-steel)">Top PR-AUC</dt>
                  <dd className="text-(--is-frost)">{m === 1 ? "GMM .384" : "TVAE .438"}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- section scaffold: stepped caps opener + 12-col panel grid ---------------- */
function Section({ id, n, a, b, intro, wide, children }: { id: string; n: string; a: string; b: string; intro?: ReactNode; wide?: boolean; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="isx-anchor">
      <div className="grid gap-5 pb-8 pt-24 lg:grid-cols-12 lg:gap-3 lg:pb-10 lg:pt-32">
        <div className="lg:col-span-5">
          <p className={`${MONO} mb-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.42em] text-(--is-steel)`}>
            <span className="text-(--is-frost)">{n}</span>
            <span aria-hidden className="h-px w-10 bg-(--is-line)" />
            {NAV.find((x) => x.id === id)?.t}
          </p>
          <h2 id={`${id}-h`} className="text-[clamp(34px,4vw,60px)] font-light uppercase leading-[0.92] tracking-[-0.02em] text-(--is-frost)">
            <span className="block pl-[1.6em]">{a}</span>
            <span className="block">{b}</span>
          </h2>
        </div>
        {intro ? (
          wide ? (
            <div className="max-w-[44ch] self-end lg:col-span-7 lg:col-start-6">{intro}</div>
          ) : (
            <p className="max-w-[52ch] self-end text-[16px] leading-[1.45] text-(--is-steel) lg:col-span-6 lg:col-start-7">{intro}</p>
          )
        ) : null}
      </div>
      <div className="grid gap-3 lg:grid-cols-12">{children}</div>
    </section>
  );
}

/* ---------------- 04 · the paper ---------------- */
const BACKS = [
  { p: 5, t: "Table 1", d: "All 13 results, both missions" },
  { p: 3, t: "Fig. 1", d: "K-Means PR curve and the t-SNE archipelago" },
  { p: 7, t: "Fig. 3", d: "The timeline failure on the longest fault" },
  { p: 9, t: "Fig. 5", d: "Kernel PCA sweep and PR curves" },
  { p: 11, t: "Fig. 7", d: "TransformerVAE latent maps, K = 16 / 18" },
];
function PaperSection() {
  const open = useReader();
  const strip = useRef<HTMLOListElement>(null);
  return (
    <section id="paper" aria-labelledby="paper-h" className="isx-anchor">
      <div className="grid gap-5 pb-8 pt-24 lg:grid-cols-12 lg:gap-3 lg:pb-10 lg:pt-32">
        <div className="lg:col-span-5">
          <p className={`${MONO} mb-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.42em] text-(--is-steel)`}>
            <span className="text-(--is-frost)">04</span>
            <span aria-hidden className="h-px w-10 bg-(--is-line)" />
            Paper
          </p>
          <h2 id="paper-h" className="text-[clamp(34px,4vw,60px)] font-light uppercase leading-[0.92] tracking-[-0.02em] text-(--is-frost)">
            <span className="block pl-[1.6em]">Read the</span>
            <span className="block">whole paper</span>
          </h2>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="is-corners isx-fill flex flex-col gap-6 rounded-[2px] border border-(--is-line) p-4 sm:p-6 lg:col-span-5">
          <div>
            <p className={`${LABEL} text-(--is-steel)`}>[ TTIC 31220 · Spring 2026 · {N_PAGES} pages ]</p>
            <p className="mt-3 text-[24px] font-semibold leading-[1.05] tracking-[-0.02em] text-(--is-frost)">Uncovering Latent Structure in ESA Satellite Telemetry</p>
            <p className="mt-2 text-[16px] text-(--is-steel)">Rhea Madhogarhia &amp; Hewitt Watkins</p>
          </div>
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
        </div>
        <div className="is-corners relative flex min-w-0 flex-col rounded-[2px] border border-(--is-line) bg-(--is-void) lg:col-span-7">
          <p className={`${LABEL} flex justify-between gap-3 border-b border-(--is-line) px-4 py-3 text-(--is-steel)`}>
            <span>[ Page strip ] Pick a page to open it</span>
            <span className="max-sm:hidden">◆ = backs a finding</span>
          </p>
          <ol ref={strip} className="isx-strip is-regdots flex flex-1 items-center gap-4 overflow-x-auto p-4 sm:p-6" aria-label="Paper pages">
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
        </div>
      </div>
    </section>
  );
}

/* ---------------- footer: authorship + citation ---------------- */
function Footer() {
  return (
    <footer className="mx-auto mt-32 w-full max-w-[1920px] px-3 pb-10 sm:px-6 xl:px-10">
      <div className="grid gap-8 border-t border-(--is-frost) pt-8 lg:grid-cols-12 lg:gap-3">
        <div className="lg:col-span-5">
          <p className={`${LABEL} text-(--is-steel)`}>[ About this site ]</p>
          <p className="mt-3 text-[28px] font-semibold leading-[1.05] tracking-[-0.03em] text-(--is-frost)">Designed &amp; built by Hewitt Watkins.</p>
          <p className="mt-3 max-w-[46ch] text-[16px] leading-[1.45] text-(--is-steel)">
            This explorer is Hewitt&apos;s project: the design, the code, and every figure, redrawn from our saved results. Nothing here runs a model; the curves come from saved test-set scores.
          </p>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <p className={`${LABEL} text-(--is-steel)`}>[ Cite the paper ]</p>
          <p className="mt-3 text-[16px] leading-[1.45] text-(--is-frost)">
            Rhea Madhogarhia &amp; Hewitt Watkins. <span className="italic">Uncovering Latent Structure in ESA Satellite Telemetry.</span> TTIC 31220, Unsupervised Learning and Data Analysis, Spring 2026.
          </p>
          <p className="mt-3 text-[16px] leading-[1.45] text-(--is-steel)"> Data: the ESA Anomaly Dataset (Kotowski et al., 2024).
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/" className={`${BTN.ghost} -ml-2`}>
              <span aria-hidden>←</span> Hub
            </Link>
            <a href={PDF} download className={`${BTN.ghost}`}>
              <span aria-hidden>↓</span> PDF
            </a>
            <PageLink page={1}>Read in the viewer</PageLink>
          </div>
        </div>
      </div>
      <p className={`${MONO} mt-10 text-[10px] uppercase tracking-[0.16em] text-(--is-steel)`}>MPCS 51238 · Design, Build, Ship · Intense Space · Charged · Fibrous · Instrumented</p>
    </footer>
  );
}
