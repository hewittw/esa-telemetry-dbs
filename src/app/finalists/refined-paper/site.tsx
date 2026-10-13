"use client";

// Refined paper, the final site: Lucid · Patient · Inked.
// One global mission (the header switch) drives every figure. Five sections on one 12-column grid:
// 01 Background → 02 What we did → 03 Results → 04 Conclusions → 05 The paper.
// Vermilion appears on "Read the paper" (and "Download PDF" inside the reader) and nowhere else.
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Bic, MethodRow, PrSet, Twin } from "../../design-systems/refined-paper/data";
import { FOCUS, IconArrow, IconMenu, MONO, SANS, SERIF, btnPrimary, btnSecondary, link } from "../../design-systems/refined-paper/kit";
import { Segmented } from "../../design-systems/refined-paper/ui";
import { BicPlayer, ChannelSteps, FaultScrub, Figure, GiantK, HeroField, Ladder, PrDrag, type Ch, type M } from "./figs";
import { MethodExplorer, type Prov } from "./methods";
import { PAGES, PAGE_NOTES, PDF, PageRef, ReaderProvider, useReader } from "./reader";
import { TourButton, TourProvider } from "./tour";

export type { Ch, Prov };
export type SiteData = { rows: MethodRow[]; prov: Record<string, Prov>; pr: PrSet[]; bic: Bic[]; twin: Twin; ch: Record<M, Ch[]> };

const NAV = [
  { id: "background", n: "01", t: "Background" },
  { id: "methods", n: "02", t: "What we did" },
  { id: "results", n: "03", t: "Results" },
  { id: "conclusions", n: "04", t: "Conclusions" },
  { id: "paper", n: "05", t: "The paper" },
] as const;
const WRAP = "mx-auto w-full max-w-[1240px] px-5 md:px-10";
const eyebrow = `${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`;
const lead = `${SERIF} text-[17px] leading-[1.6] sm:text-[19px] sm:leading-[1.58]`;

export function Site({ data }: { data: SiteData }) {
  return (
    <ReaderProvider>
      <TourProvider>
        <Inner data={data} />
      </TourProvider>
    </ReaderProvider>
  );
}

function Inner({ data }: { data: SiteData }) {
  const [m, setM] = useState<M>(1);
  return (
    <>
      <a href="#background" className={`${SANS} ${FOCUS} sr-only z-[90] rounded-[3px] bg-[var(--ink)] px-3 py-2 text-[13px] text-[var(--paper)] focus:not-sr-only focus:fixed focus:top-3 focus:left-3`}>Skip to the findings</a>
      <Header m={m} setM={setM} />
      <p className="sr-only" aria-live="polite">Showing Mission {m} in every figure</p>
      <main className={WRAP}>
        <Hero m={m} ch={data.ch[m]} />

        <Section id="background" title="Dozens of channels, watched by hand."
          lead={<>Engineers monitor 76+ channels manually or with threshold alarms. Kotowski et al. (2024) showed detectors keep raising false alarms, but not why. <PageRef p={2}>§1</PageRef></>}
          extra={
            <dl className="mt-8 grid gap-6 border-t border-[var(--rule)] pt-5 sm:grid-cols-2">
              {[["Q1", "Is there latent structure aligned with the subsystems?"], ["Q2", "Does learning it improve detection?"]].map(([q, t]) => (
                <div key={q}>
                  <dt className={`${MONO} text-[12px] text-[var(--muted)]`}>{q}</dt>
                  <dd className={`${SERIF} mt-1 text-[22px] leading-[1.3]`}>{t}</dd>
                </div>
              ))}
            </dl>
          }>
          <ChannelSteps key={m} ch={data.ch[m]} m={m} />
        </Section>

        <Section id="methods" title="Five methods, each richer than the last."
          lead={<>The baselines test whether structure exists at all; a mixture model and three VAEs then learn it.</>}>
          <Ladder />
          <dl className="mt-8 grid gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["PR-AUC", "precision–recall area; anomalies are rare"],
              ["GMM", "Gaussian mixture model"],
              ["BIC", "fit score that penalises extra components"],
              ["VAE", "variational autoencoder"],
            ].map(([t, d]) => (
              <div key={t} className="border-t border-[var(--rule)] pt-2.5">
                <dt className={`${MONO} text-[12px] font-medium`}>{t}</dt>
                <dd className={`${SANS} mt-0.5 text-[13px] leading-[1.45] text-[var(--muted)]`}>{d}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="results" title="Structure at the group level, not the subsystem level."
          lead={<>BIC picks 21 and 29 modes, beside the 18 and 29 groups. Mode-aware models clear the linear 0.322 plateau.</>}>
          <div className="space-y-24 lg:space-y-28">
            <div id="bic" tabIndex={-1} className="grid gap-x-10 gap-y-16 outline-none lg:grid-cols-12">
              <Figure title="Modes BIC selects" cap="K*: the component count BIC selects." chip={<PageRef p={5}>§6</PageRef>} className="lg:col-span-5">
                <GiantK m={m} bic={data.bic} />
              </Figure>
              <Figure title={`BIC against K · Mission ${m}`} cap="BIC bottoms out beside the groups." chip={<PageRef p={3}>§4</PageRef>} className="lg:col-span-7">
                <BicPlayer m={m} sweeps={data.bic} />
              </Figure>
            </div>
            <div id="table" tabIndex={-1} className="outline-none">
              <h3 className={`${SERIF} mb-5 text-[22px] leading-[1.2] font-[450]`}>Table 1 · Mission {m}</h3>
              <MethodExplorer rows={data.rows} prov={data.prov} m={m} />
            </div>
            <div className="grid gap-x-10 gap-y-20 lg:grid-cols-12">
              <Figure id="pr" title={`Precision against recall · Mission ${m}`} cap="Drag the line; both curves sink toward random." chip={<PageRef p={3}>Fig. 1a</PageRef>} className="lg:col-span-6">
                <PrDrag m={m} sets={data.pr} />
              </Figure>
              <Figure id="fault" title="Why global detectors fail" cap="967 hours: K-Means spikes at onset, then loses the fault." chip={<PageRef p={7}>Fig. 3</PageRef>} className="lg:col-span-6">
                {m === 2 && <p className={`${SANS} -mt-3 mb-3 text-[12px] text-[var(--muted)]`}>Mission 1’s longest genuine fault; Mission 2’s labels are mostly rare events.</p>}
                <FaultScrub twin={data.twin} />
              </Figure>
            </div>
          </div>
        </Section>

        <Section id="conclusions" title="Each mode has its own normal."
          lead={<>Anomalies are mode-specific and temporally structured in ways static global models cannot fully capture. <PageRef p={5}>§7</PageRef></>}>
          <ol className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Group-level structure", <>Every complexity selector found <span className="text-[var(--prussian)]">18–29 modes</span>, not <span className="text-[var(--ochre)]">4–5 subsystems</span>, on both missions.</>],
              ["Richer models help", <>GMM reaches <span className={MONO}>0.384</span> on Mission 1; TransformerVAE <span className={MONO}>0.438</span> on Mission 2.</>],
              ["Multi-modality is the bottleneck", <>Anomalies scatter across every mode, with no single outlier zone.</>],
              ["Next: time and transfer", <>Temporal models (LSTM-VAE, HMM), and cross-mission tests on three shared subsystems.</>],
            ].map(([t, d], k) => (
              <li key={k} className="border-t border-[var(--ink)] pt-3">
                <p className={`${MONO} text-[11px] text-[var(--muted)]`}>{String(k + 1).padStart(2, "0")}</p>
                <h3 className={`${SERIF} mt-1 text-[22px] leading-[1.2] font-[450]`}>{t}</h3>
                <p className={`${SANS} mt-2 text-[13.5px] leading-[1.5] text-[var(--ink-soft)]`}>{d}</p>
              </li>
            ))}
          </ol>
        </Section>

        <PaperSection />
      </main>
      <Footer />
    </>
  );
}

/* ---------------------------------------------------------------- section scaffold: one grid, one rhythm */
function Section({ id, title, lead: l, extra, children }: { id: string; title: string; lead: ReactNode; extra?: ReactNode; children: ReactNode }) {
  const n = NAV.find((x) => x.id === id)!;
  return (
    <section id={id} aria-labelledby={`${id}-h`} tabIndex={-1} className="mt-28 border-t border-[var(--ink)] pt-6 outline-none lg:mt-36">
      <div className="grid gap-x-10 gap-y-5 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className={eyebrow}>{n.n} · {n.t}</p>
          <h2 id={`${id}-h`} className={`${SERIF} mt-3 max-w-[18ch] text-[clamp(2rem,3.3vw,2.75rem)] leading-[1.08] font-[400] tracking-[-0.018em]`}>{title}</h2>
        </div>
        <div className="lg:col-span-7 lg:pt-8">
          <p className={`${lead} max-w-[40em]`}>{l}</p>
          {extra}
        </div>
      </div>
      <div className="mt-14 lg:mt-20">{children}</div>
    </section>
  );
}

/* ---------------------------------------------------------------- header: hub · title · sections · mission · tour */
function useSpy() {
  const [cur, setCur] = useState<string | null>(null);
  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const on = () => {
      const line = innerHeight * 0.35;
      let c: string | null = null;
      for (const el of els) if (el.getBoundingClientRect().top <= line) c = el.id;
      setCur(c);
    };
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    on();
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); };
  }, []);
  return cur;
}

function Header({ m, setM }: { m: M; setM: (m: M) => void }) {
  const cur = useSpy();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); document.getElementById("rps-menu-btn")?.focus(); } };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); };
  }, [open]);
  const item = (n: (typeof NAV)[number], mobile = false) => (
    <a key={n.id} href={`#${n.id}`} onClick={() => setOpen(false)} aria-current={cur === n.id ? "location" : undefined}
      className={`${SANS} ${FOCUS} inline-flex min-h-10 items-center gap-2 rounded-[2px] px-2.5 text-[13px] whitespace-nowrap transition-colors duration-200 hover:bg-[var(--parchment)] hover:text-[var(--ink)] active:bg-[var(--rule)] aria-[current]:font-semibold aria-[current]:text-[var(--ink)] aria-[current]:shadow-[inset_0_-2px_0_var(--ink)] ${mobile ? "w-full min-h-11 aria-[current]:shadow-[inset_2px_0_0_var(--ink)]" : ""} text-[var(--muted)]`}>
      <span className={`${MONO} text-[11px] font-normal text-[var(--muted)]`}>{n.n}</span>{n.t}
    </a>
  );
  return (
    <header ref={box} className="sticky top-0 z-50 border-b border-[var(--rule)] bg-[var(--paper)]/95 backdrop-blur-[2px]">
      <div className={`${WRAP} flex h-14 items-center gap-2 sm:gap-3`}>
        <Link href="/" className={`${SANS} ${link} -ml-1 shrink-0 px-1 py-2 text-[13px] font-medium no-underline hover:underline`}>← Hub</Link>
        <span aria-hidden className="h-5 w-px shrink-0 bg-[var(--rule)] max-sm:hidden" />
        <a href="#top" className={`${SERIF} ${FOCUS} min-w-0 truncate rounded-[2px] text-[16px] max-sm:hidden`}>ESA telemetry</a>
        <nav aria-label="Sections" className="ml-auto hidden items-center xl:flex">{NAV.map((n) => item(n))}</nav>
        <div className="ml-auto flex shrink-0 items-center gap-2 xl:ml-3">
          <span aria-hidden className={`${SANS} text-[13px] text-[var(--muted)] max-md:hidden`}>Mission</span>
          <Segmented label="Mission shown in every figure" value={m} onChange={setM} options={[{ value: 1, label: "M1" }, { value: 2, label: "M2" }]} />
        </div>
        <button id="rps-menu-btn" type="button" aria-expanded={open} aria-controls="rps-menu" aria-label="Sections menu" onClick={() => setOpen((o) => !o)}
          className={`${SANS} ${FOCUS} inline-flex h-10 shrink-0 items-center gap-2 rounded-[3px] border border-[var(--rule-strong)] px-3 text-[13px] font-medium transition-colors duration-200 hover:border-[var(--ink)] hover:bg-[var(--parchment)] active:bg-[var(--rule)] aria-expanded:border-[var(--ink)] aria-expanded:bg-[var(--parchment)] xl:hidden`}>
          <IconMenu size={14} /><span className="max-[400px]:sr-only">Contents</span>
        </button>
      </div>
      {open && (
        <nav id="rps-menu" aria-label="Sections" className="rpd-rise absolute inset-x-3 top-full mt-1 rounded-[3px] border border-[var(--ink)] bg-[var(--mount)] p-3 shadow-[var(--lift)] sm:right-5 sm:left-auto sm:w-[20rem] md:right-10">
          <div className="flex flex-col">{NAV.map((n) => item(n, true))}</div>
          <span className="mt-3 block border-t border-[var(--rule)] pt-3" onClick={() => setOpen(false)}><TourButton className="w-full" /></span>
        </nav>
      )}
    </header>
  );
}

/* ---------------------------------------------------------------- hero: the finding, first */
function Hero({ m, ch }: { m: M; ch: Ch[] }) {
  const open = useReader();
  return (
    <section id="top" aria-labelledby="rps-h1" className="grid items-center gap-x-12 gap-y-14 pt-14 pb-6 sm:pt-20 lg:min-h-[min(calc(100svh-160px),720px)] lg:grid-cols-12 lg:py-12">
      <div className="lg:col-span-7">
        <p className={`${eyebrow} rps-in`}>ESA satellite telemetry · Madhogarhia &amp; Watkins · 2026</p>
        <h1 id="rps-h1" tabIndex={-1} className={`${SERIF} rps-in mt-6 max-w-[15ch] text-[clamp(2.6rem,5.2vw,4.75rem)] leading-[1.03] font-light tracking-[-0.03em] outline-none`} style={{ animationDelay: "80ms" }}>
          Telemetry’s structure lives in <span className="text-[var(--prussian)]">operational groups</span>, not <span className="text-[var(--ochre)]">subsystems</span>.
        </h1>
        <p className={`${SERIF} rps-in mt-7 max-w-[32ch] text-[22px] leading-[1.4]`} style={{ animationDelay: "220ms" }}>
          18–29 modes, not 4–5. Each mode has its own normal, so one global detector keeps raising false alarms.
        </p>
        <div className="rps-in mt-10 flex flex-wrap items-center gap-3" style={{ animationDelay: "360ms" }}>
          <button type="button" className={`${btnPrimary} h-11 px-5 text-[15px]`} onClick={() => open(1)}>Read the paper <IconArrow /></button>
          <TourButton className="h-11 px-5 text-[15px]" />
        </div>
      </div>
      <div className="rps-in mx-auto w-full max-w-[460px] lg:col-span-5 lg:max-w-none" style={{ animationDelay: "160ms" }}>
        <HeroField key={m} ch={ch} m={m} />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- 05 · the paper */
function PaperSection() {
  const open = useReader();
  return (
    <Section id="paper" title="Read it as it was submitted."
      lead={<><i>Uncovering Latent Structure in ESA Satellite Telemetry.</i> Rhea Madhogarhia &amp; Hewitt Watkins. TTIC 31220, Spring 2026.</>}>
      <div className="grid gap-x-10 gap-y-12 lg:grid-cols-12">
        <div className="flex flex-col lg:col-span-4">
          <div className="flex flex-wrap gap-3">
            <button type="button" className={`${btnPrimary} h-11 px-5 text-[15px]`} onClick={() => open(1)}>Read the paper <IconArrow /></button>
            <a href={PDF} download className={`${btnSecondary} h-11 px-5 text-[15px]`}>
              <svg aria-hidden width="12" height="12" viewBox="0 0 12 12"><path d="M6 1.5v6.5M3 5.5 6 8.5l3-3M2 10.5h8" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
              Download PDF
            </a>
          </div>
          <dl id="credits" tabIndex={-1} className={`${SANS} mt-10 grid gap-4 border-t border-[var(--rule)] pt-4 text-[13.5px] leading-[1.5] outline-none`}>
            <div><dt className="text-[var(--muted)]">Rhea Madhogarhia</dt><dd>K-Means, PCA and Nyström-KPCA baselines.</dd></div>
            <div><dt className="text-[var(--muted)]">Hewitt Watkins</dt><dd>The GMM and the three VAEs.</dd></div>
            <div><dt className="text-[var(--muted)]">Data</dt><dd>ESA Anomaly Dataset, Missions 1 and 2 (Kotowski et al., 2024).</dd></div>
          </dl>
          <p className="mt-3"><PageRef p={2}>Division of labour</PageRef></p>
        </div>
        <ol className="grid grid-cols-3 gap-x-3 gap-y-5 min-[520px]:grid-cols-4 lg:col-span-8 lg:grid-cols-6" aria-label="Pages of the paper">
          {Array.from({ length: PAGES }, (_, k) => k + 1).map((p) => (
            <li key={p}>
              <button type="button" onClick={() => open(p)} aria-label={`Open page ${p}: ${PAGE_NOTES[p][0].t}`} className={`${FOCUS} group block w-full rounded-[2px] text-left`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/paper/pages/thumb-${String(p).padStart(2, "0")}.jpg`} alt="" width={320} height={415} loading="lazy"
                  className="rps-sheet block h-auto w-full transition-transform duration-300 ease-[cubic-bezier(.22,.61,.36,1)] group-hover:-translate-y-1 group-active:translate-y-0" />
                <span className={`${MONO} mt-2.5 block text-[11px] text-[var(--muted)] transition-colors duration-200 group-hover:text-[var(--ink)]`}>p. {p}</span>
              </button>
            </li>
          ))}
          <li>
            <a href={PDF} download aria-label="Download the PDF, 11 pages" className={`${FOCUS} group block rounded-[2px]`}>
              <span className="grid aspect-[320/415] w-full place-items-center rounded-[2px] border border-dashed border-[var(--rule-strong)] transition-colors duration-200 group-hover:border-[var(--ink)] group-hover:bg-[var(--parchment)] group-active:bg-[var(--rule)]">
                <span className="flex flex-col items-center gap-1.5 text-[var(--ink)]">
                  <svg aria-hidden width="16" height="16" viewBox="0 0 12 12"><path d="M6 1.5v6.5M3 5.5 6 8.5l3-3M2 10.5h8" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
                  <span className={`${MONO} text-[11px]`}>PDF</span>
                </span>
              </span>
              <span className={`${MONO} mt-2.5 block text-[11px] text-[var(--muted)] transition-colors duration-200 group-hover:text-[var(--ink)]`}>11 pp.</span>
            </a>
          </li>
        </ol>
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- footer: authorship */
function Footer() {
  return (
    <footer className="mt-28 border-t border-[var(--ink)] lg:mt-36">
      <div className={`${WRAP} grid gap-6 py-12 md:grid-cols-[1fr_auto] md:items-end`}>
        <div>
          <p className={`${SERIF} text-[22px] leading-tight`}>Designed &amp; built by Hewitt Watkins.</p>
          <p className={`${SANS} mt-2 max-w-[62ch] text-[13px] leading-[1.55] text-[var(--muted)]`}>
            This site is Hewitt’s project. The paper is joint work: Rhea Madhogarhia &amp; Hewitt Watkins, TTIC 31220, Spring 2026. Figures are redrawn from the saved runs.
          </p>
        </div>
        <Link href="/" className={`${SANS} ${link} justify-self-start text-[13px] font-medium whitespace-nowrap`}>← Hub</Link>
      </div>
    </footer>
  );
}
