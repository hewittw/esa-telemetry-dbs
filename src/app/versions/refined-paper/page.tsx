import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import type { ReactNode } from "react";
import "../../design-systems/refined-paper/rpd.css";
import "./rps.css";
import { getBic, getChannels, getGmm, getLongest, getPr, getTable1 } from "../../design-systems/refined-paper/data";
import { FOCUS, MONO, SANS, SERIF, caption, link } from "../../design-systems/refined-paper/kit";
import { KeyedDrag, TwinScrubber } from "../../design-systems/refined-paper/novel";
import { Contents, HeroActions, PaperSheet } from "./chrome";
import { PageRef, ReaderProvider } from "./reader";
import { BicPlayer, FindingsGrid, GiantStat, GmmExplorer, Multiples, ScrollyChannels } from "./story";
import { MethodExplorer } from "./methods";

const serif = Newsreader({ subsets: ["latin"], axes: ["opsz"], style: ["normal", "italic"], variable: "--rp-serif-face" });
const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--rp-sans-face" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--rp-mono-face" });

export const metadata: Metadata = {
  title: "Latent structure in ESA telemetry · Refined paper",
  description: "ESA satellite telemetry has latent structure at the operational-group level (18–29 modes), not the subsystem level (4–5). An interactive findings explorer for Madhogarhia & Watkins (2026).",
};

const eyebrow = `${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`;
const bodyCls = `${SERIF} max-w-[680px] text-[17px] leading-[1.62] text-[var(--ink)] sm:text-[19px] sm:leading-[1.58]`;

function Section({ id, n, title, lead, children }: { id: string; n: string; title: string; lead: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} tabIndex={-1} className="border-t border-[var(--ink)] pt-6 outline-none">
      <p className={eyebrow}>{n}</p>
      <h2 id={`${id}-h`} className={`${SERIF} mt-3 max-w-[22ch] text-[clamp(2.1rem,4.4vw,3.25rem)] leading-[1.06] font-[400] tracking-[-0.018em]`}>{title}</h2>
      <p className={`${bodyCls} mt-5`}>{lead}</p>
      <div className="mt-12 sm:mt-14">{children}</div>
    </section>
  );
}

function Sub({ id, title, children, aside }: { id?: string; title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div id={id} tabIndex={id ? -1 : undefined} className="mt-24 outline-none sm:mt-32">
      <h3 className={`${SERIF} text-[clamp(1.6rem,3vw,2rem)] leading-[1.15] font-[450]`}>{title}</h3>
      {aside && <div className={`${bodyCls} mt-3`}>{aside}</div>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

export default function RefinedPaperSite() {
  const rows = getTable1();
  const pr = getPr();
  const bic = getBic();
  const gmm = getGmm();
  const channels = getChannels();
  const twin = getLongest();
  const m1 = rows.filter((r) => r.mission === 1);

  return (
    <div className={`rpd-root rps-root ${serif.variable} ${sans.variable} ${mono.variable}`}>
      <ReaderProvider>
        <a href="#glance" className={`${SANS} ${FOCUS} sr-only z-50 rounded-[3px] bg-[var(--ink)] px-3 py-2 text-[13px] text-[var(--paper)] focus:not-sr-only focus:fixed focus:top-3 focus:left-3`}>Skip to the findings</a>
        <div className="mx-auto max-w-[1280px] px-5 md:px-10">
          {/* masthead */}
          <header className="flex h-16 items-center justify-between gap-4 border-b border-[var(--rule)]">
            <Link href="/" className={`${SANS} ${link} shrink-0 text-[13.5px] font-medium whitespace-nowrap no-underline hover:underline`}>← Hub</Link>
            <p className={`${SANS} truncate text-[13px] text-[var(--muted)]`}>Madhogarhia &amp; Watkins<span className="hidden sm:inline"> · TTIC 31220</span> · Spring 2026</p>
          </header>

          {/* hero: the finding, first */}
          <section id="top" tabIndex={-1} aria-labelledby="rps-h1" className="flex min-h-[min(88svh,940px)] flex-col justify-center py-20 outline-none sm:py-28">
            <p className={`${eyebrow} rps-in`}>A findings explorer · ESA Anomaly Detection Benchmark</p>
            <h1 id="rps-h1" className={`${SERIF} rps-in mt-6 max-w-[19ch] text-[clamp(2.55rem,6.6vw,5.9rem)] leading-[1.02] font-light tracking-[-0.03em]`} style={{ animationDelay: "80ms" }}>
              ESA telemetry has its structure in <span className="text-[var(--prussian)]">operational groups</span>, not <span className="text-[var(--ochre)]">subsystems</span>.
            </h1>
            <p className={`${SERIF} rps-in mt-8 max-w-[34ch] text-[clamp(1.25rem,2.1vw,1.6rem)] leading-[1.42] text-[var(--ink)]`} style={{ animationDelay: "260ms" }}>
              18 to 29 modes, not 4 or 5. Each keeps its own idea of normal, and that is why one global detector keeps raising false alarms.
            </p>
            <div className="rps-in mt-10" style={{ animationDelay: "420ms" }}><HeroActions /></div>
            <dl className="rps-in mt-20 grid max-w-[880px] grid-cols-1 border-t border-[var(--rule-strong)] min-[520px]:grid-cols-3" style={{ animationDelay: "560ms" }}>
              {([
                ["0.322", "Linear methods plateau", "K-Means, PCA · PR-AUC"],
                ["0.384", "GMM leads Mission 1", "Faults · PR-AUC"],
                ["0.438", "TransformerVAE leads Mission 2", "Rare events · PR-AUC"],
              ] as const).map(([v, t, s], i) => (
                <div key={v} className={`flex items-baseline gap-4 border-[var(--rule)] py-4 min-[520px]:flex-col min-[520px]:items-start min-[520px]:gap-2 ${i ? "border-t min-[520px]:border-t-0 min-[520px]:border-l min-[520px]:pl-5" : ""}`}>
                  <dt className="order-2">
                    <span className={`${SANS} block text-[13.5px] font-medium text-[var(--ink)]`}>{t}</span>
                    <span className={`${SANS} block text-[12px] text-[var(--muted)]`}>{s}</span>
                  </dt>
                  <dd className={`${MONO} order-1 w-[4.5rem] shrink-0 text-[22px] leading-none text-[var(--ink)] min-[520px]:text-[28px]`}>{v}</dd>
                </div>
              ))}
            </dl>
            <p className={`${caption} rps-in mt-2`} style={{ animationDelay: "560ms" }}>All three from <PageRef p={5}>Table 1</PageRef></p>
          </section>

          <div className="grid gap-x-16 min-[1100px]:grid-cols-[188px_minmax(0,1fr)]">
            <Contents />
            <main className="min-w-0 space-y-36 pb-32 sm:space-y-44">
              <Section id="glance" n="§1 · At a glance" title="Six findings, each with the page that backs it."
                lead={<>Two minutes is enough for this row. Every number is from Table 1 of the paper, and each bracketed chip opens the page it comes from.</>}>
                <FindingsGrid />
              </Section>

              <Section id="structure" n="§2 · Structure" title="The data sorts itself into groups, not subsystems."
                lead={<>Engineers file each channel under a <span className="text-[var(--ochre)]">subsystem</span>. Left alone, the telemetry settles at a finer grain: its <span className="text-[var(--prussian)]">operational groups</span>.</>}>
                <ScrollyChannels channels={channels} />

                <div className="mt-28 sm:mt-36">
                  <p className={`${bodyCls} mb-10`}>Ask a Gaussian mixture how many modes the data has, and let BIC answer. It does not stop at the subsystems.</p>
                  <GiantStat />
                </div>

                <Sub id="bic" title="Watch BIC choose K" aside={<>Each step fits one more component. The criterion falls past the subsystem count and bottoms out beside the group count. <PageRef p={3}>§4</PageRef></>}>
                  <BicPlayer sweeps={bic} />
                </Sub>

                <Sub id="modes" title="Inside the 21 modes" aside={<>Each component is a mode with its own normal. Some are almost pure fault. The TransformerVAE’s latent space lands between the two levels, at K = 16 and K = 18. <PageRef p={11}>Fig. 7</PageRef></>}>
                  <GmmExplorer gmm={gmm} />
                </Sub>
              </Section>

              <Section id="methods" n="§3 · Methods" title="Five families, two missions."
                lead={<>K-Means, PCA, Nyström KPCA, a Gaussian mixture and three VAEs, all scored on the same ESA-ADB test split by PR-AUC. Mission 1’s labels are real faults; Mission 2’s are 95% rare operational events. The baselines ran on Mission 1 only. <PageRef p={5}>Table 1</PageRef></>}>
                <MethodExplorer rows={rows} />
              </Section>

              <Section id="evidence" n="§4 · Evidence" title="Why one threshold can’t fit every mode."
                lead={<>A global detector draws one line for “abnormal”. With 21 modes, each with its own baseline, that line is too low for some and too high for others.</>}>
                <div id="pr" tabIndex={-1} className="outline-none">
                  <KeyedDrag set={pr[0]} />
                  <p className={`${caption} mt-1`}>Drag across the figure, or focus the handle and use the arrow keys. <PageRef p={3}>Fig. 1a</PageRef></p>
                </div>

                <Sub id="multiples" title="Four detectors, one crosshair" aside={<>One recall, read across four precision–recall curves on shared axes. On Mission 2 all three VAEs sit above the mixture model. <PageRef p={5}>Table 1</PageRef></>}>
                  <Multiples sets={pr} />
                </Sub>

                <Sub id="fault" title="The longest fault" aside={<>967 hours of a genuine Mission 1 fault. Scrub through it: a global score jumps at onset, then drifts back toward normal while the fault goes on. <PageRef p={7}>Fig. 3</PageRef></>}>
                  <TwinScrubber twin={twin} />
                </Sub>

                <div className="mt-24 border-t border-[var(--rule)] pt-5 sm:mt-32">
                  <h3 className={`${SANS} text-[13px] font-semibold`}>Read with care</h3>
                  <ul className={`${SANS} mt-3 grid gap-x-10 gap-y-3 text-[13.5px] leading-[1.55] text-[var(--ink-soft)] md:grid-cols-3`}>
                    <li>GMM and the VAEs were fit on different splits from the baselines’ 80/20, so rows compare detectors, not identical protocols.</li>
                    <li>Curves are recomputed from saved score arrays. Where a saved run is not the Table 1 run it is marked “saved AP”, with the Table 1 number beside it.</li>
                    <li>Point-wise PR-AUC rewards long events. Event-wise F1 was scored for the baselines only ({m1.filter((r) => r.eventF1 != null).length} rows).</li>
                  </ul>
                </div>
              </Section>

              <Section id="paper" n="§5 · The paper" title="Read it as it was submitted."
                lead={<>Eleven pages. Open any one: arrow keys or a swipe turn the page, and the address bar keeps your place, so a page can be shared.</>}>
                <PaperSheet />
                <div id="credits" tabIndex={-1} className="mt-20 grid gap-10 border-t border-[var(--ink)] pt-6 outline-none md:grid-cols-2">
                  <div>
                    <p className={eyebrow}>Cite</p>
                    <p className={`${SERIF} mt-3 text-[18px] leading-[1.55]`}>
                      Madhogarhia, R. &amp; Watkins, H. (2026). <i>Uncovering Latent Structure in ESA Satellite Telemetry.</i> TTIC 31220, Unsupervised Learning and Data Analysis, The University of Chicago / TTIC.
                    </p>
                  </div>
                  <div>
                    <p className={eyebrow}>Who did what</p>
                    <p className={`${SERIF} mt-3 text-[18px] leading-[1.55]`}> <PageRef p={2}>Credits</PageRef>
                    </p>
                  </div>
                </div>
              </Section>
            </main>
          </div>
        </div>

        <footer className="border-t border-[var(--ink)]">
          <div className="mx-auto grid max-w-[1280px] gap-6 px-5 py-12 md:grid-cols-[1fr_auto] md:items-end md:px-10">
            <div>
              <p className={`${SERIF} text-[22px] leading-tight`}>Designed &amp; built by Hewitt Watkins.</p>
              <p className={`${SANS} mt-2 max-w-[60ch] text-[13px] leading-[1.55] text-[var(--muted)]`}>
                This site is Hewitt’s project. The paper it explores is joint work with Rhea Madhogarhia for TTIC 31220, Spring 2026. Figures are redrawn from the saved runs; set in Newsreader and IBM Plex.
              </p>
            </div>
            <Link href="/" className={`${SANS} ${link} justify-self-start text-[13.5px] font-medium whitespace-nowrap`}>← Hub</Link>
          </div>
        </footer>
      </ReaderProvider>
    </div>
  );
}
