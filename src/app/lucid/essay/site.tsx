"use client";

// Lucid · A · The Essay. One long read in the Ciechanowski / Distill tradition: a 66ch column of prose,
// with every figure set inline where the text needs it, breaking out to 1080px. Colour-keyed words
// (Prussian = operational groups and the mode-aware GMM, Ochre = subsystems) tie the prose to the plots.
// Arc: hero → 01 Context → 02 Dataset & setup → 03 Methods → 04 Results → 05 Conclusions → 06 The paper.
// One global mission switch in the header drives every figure. Vermilion is "Read the paper" alone
// (and "Download PDF" inside the reader, which replaces the page).
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Bic, MethodRow, PrSet, Twin } from "../../design-systems/refined-paper/data";
import { FOCUS, IconArrow, IconMenu, MONO, SANS, SERIF, btnPrimary, btnSecondary, link } from "../../design-systems/refined-paper/kit";
import { Segmented } from "../../design-systems/refined-paper/ui";
import { BicPlayer, ChannelSteps, FaultScrub, Figure, GiantK, Ladder, PrDrag, type Ch, type M } from "./figs";
import { Granularity, ModesSketch, Satellite } from "./essayfigs";
import { MethodExplorer, type Prov } from "./methods";
import { PAGES, PAGE_NOTES, PDF, PageRef, ReaderProvider, useReader } from "./reader";
import { TourButton, TourProvider } from "./tour";

export type { Ch, Prov };
export type SiteData = { rows: MethodRow[]; prov: Record<string, Prov>; pr: PrSet[]; bic: Bic[]; twin: Twin; ch: Record<M, Ch[]> };

const NAV = [
  { id: "context", n: "01", t: "Context" },
  { id: "data", n: "02", t: "Dataset & setup" },
  { id: "methods", n: "03", t: "Methods" },
  { id: "results", n: "04", t: "Results" },
  { id: "conclusions", n: "05", t: "Conclusions" },
  { id: "paper", n: "06", t: "The paper" },
] as const;
const WRAP = "mx-auto w-full max-w-[1240px] px-5 md:px-10";
const COL = "mx-auto w-full max-w-[66ch]";
const WIDE = "mx-auto w-full max-w-[1080px]";
const eyebrow = `${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`;
const prose = `${SERIF} text-[17.5px] leading-[1.62] sm:text-[19px] sm:leading-[1.6] text-[var(--ink)]`;

/* ---------------------------------------------------------------- prose atoms */
const P = ({ children }: { children: ReactNode }) => <p className={`${prose} mt-6 first:mt-0`}>{children}</p>;
/** A colour-keyed word: the same ink as its line or mark in the figures, underlined so colour is never alone. */
const Sub = ({ children = "subsystems" }: { children?: ReactNode }) => <span className="ess-key text-[var(--ochre)]">{children}</span>;
const Grp = ({ children = "operational groups" }: { children?: ReactNode }) => <span className="ess-key text-[var(--prussian)]">{children}</span>;
const N = ({ children }: { children: ReactNode }) => <span className="tabular-nums [font-variant-numeric:lining-nums_tabular-nums]">{children}</span>;

function Col({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${COL} ${className}`}>{children}</div>;
}
/** A figure that breaks out of the column, with generous space above and below. */
function Wide({ children, id }: { children: ReactNode; id?: string }) {
  return <div id={id} tabIndex={id ? -1 : undefined} className={`${WIDE} my-16 outline-none sm:my-20 lg:my-24`}>{children}</div>;
}
/** A subsection title inside a paper section: plain, a question or a description a newcomer can follow. */
function H3({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h3 id={id} tabIndex={id ? -1 : undefined} className={`${SERIF} mt-20 mb-6 text-[25px] leading-[1.2] font-[450] tracking-[-0.01em] outline-none sm:text-[28px] lg:mt-24`}>
      {children}
    </h3>
  );
}

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
      <a href="#context" className={`${SANS} ${FOCUS} sr-only z-[90] rounded-[3px] bg-[var(--ink)] px-3 py-2 text-[13px] text-[var(--paper)] focus:not-sr-only focus:fixed focus:top-3 focus:left-3`}>Skip to the essay</a>
      <Header m={m} setM={setM} />
      <p className="sr-only" aria-live="polite">Showing Mission {m} in every figure</p>
      <main className={WRAP}>
        <Hero />

        {/* ============================================================ 01 · Context */}
        <Section id="context" title="Why look for hidden structure in satellite data?">
          <Col>
            <P>
              This was the final project for TTIC 31220, <i>Unsupervised Learning and Data Analysis</i>, a machine-learning course at the
              University of Chicago and TTIC in Spring 2026. <dfn>Unsupervised</dfn> means the methods learn from the data alone, without
              being told which readings are faults.
            </P>
            <P>
              The data belong to the <dfn>European Space Agency</dfn> (ESA), Europe’s space agency. Besides building and launching
              satellites, ESA runs mission control: the engineers on the ground who keep each satellite healthy, often for years.
            </P>
            <P>
              What those engineers watch is <dfn>telemetry</dfn>. A satellite’s onboard instruments measure voltages, temperatures,
              rotation rates, signal strengths and more, and stream every reading to the ground continuously: dozens to hundreds of
              sensors at once, at sub-minute cadence, over years of operation. Each sensor’s stream is called a <dfn>channel</dfn>.
              Today engineers monitor 76 or more channels manually or with threshold alarms, an approach the paper calls error-prone
              and demanding of large teams. <PageRef p={1}>Abstract</PageRef>
            </P>
            <P>
              Their job is to catch <dfn>anomalies</dfn>: moments when something has gone wrong, as opposed to ordinary healthy
              variation. That is hard for three reasons. The channels are highly correlated, so one power fluctuation can ripple
              through thermal, attitude and communications sensors at once. The satellite’s operating mode shifts continuously
              across orbit phases and eclipse windows. And genuine faults are rare. <PageRef p={1}>§1</PageRef>
            </P>

            <H3>The data: ESA’s own anomaly benchmark</H3>
            <P>
              The telemetry comes from the <dfn>ESA Anomaly Dataset</dfn> (Kotowski et al., 2024; Andrzejewski et al., 2024): readings
              from real ESA missions, released with the missions anonymised, so channels carry numbers rather than names. The paper uses
              two of them, Mission 1 and Mission 2.
            </P>
            <P>
              What makes the dataset new is its labelling. It is the first large-scale, publicly available satellite-telemetry benchmark
              with <em>per-channel, per-timestep</em> anomaly labels annotated by ESA engineers: for every sensor and every moment, an
              engineer has recorded whether something was wrong. That makes it possible to score a detector against expert judgement,
              not guesswork.
            </P>

            <H3>The open question this paper takes up</H3>
            <P>
              Kotowski et al. used the benchmark to test a range of existing unsupervised detectors, and found that all of them produce
              persistent false alarms. Their work left open <em>why</em>. This paper asks a structural question first: what
              {" "}<dfn>latent</dfn> organisation (hidden, never measured directly) underlies the telemetry, and does that structure explain
              why detectors fail? It splits that into two questions. <PageRef p={1}>Q1, Q2</PageRef>
            </P>
          </Col>
          <div className={`${COL} mt-10`}>
            <dl className="grid gap-x-10 gap-y-6 border-y border-[var(--ink)] py-6 sm:grid-cols-2">
              {[
                ["Q1", <>Does the telemetry contain a consistent latent structure aligned with the satellite’s known <Sub />?</>],
                ["Q2", <>Can learning that structure improve unsupervised anomaly detection?</>],
              ].map(([q, t]) => (
                <div key={q as string}>
                  <dt className={`${MONO} text-[12px] text-[var(--muted)]`}>{q}</dt>
                  <dd className={`${SERIF} mt-1 text-[21px] leading-[1.35]`}>{t}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Section>

        {/* ============================================================ 02 · Dataset & setup */}
        <Section id="data" title="Two satellites, and how a detector is judged">
          <Col>
            <H3 id="hierarchy">What the data looks like</H3>
            <P>
              ESA files every channel in a two-level hierarchy. A <Sub>subsystem</Sub> is a physically coherent group of spacecraft
              components, such as power management or attitude control. Each subsystem is subdivided into finer <Grp />, such as
              battery charging. Q1 is really asking which of these two levels, if either, the data’s own structure follows.
              <PageRef p={2}>§2</PageRef>
            </P>
            <P>
              <span className="lg:hidden">Step through the hierarchy below.</span>
              <span className="max-lg:hidden">Scroll on, and the figure steps through the hierarchy.</span> The mission switch in the
              header changes the mission in every figure on the page.
            </P>
          </Col>
          <Wide id="channels">
            <ChannelSteps key={m} ch={data.ch[m]} m={m} />
          </Wide>
          <Col>
            <P>
              The two missions are different satellites. Mission 1 has <N>76</N> channels, <N>7.4</N> million training timesteps at one
              reading about every 30 seconds, <Sub>4 subsystems</Sub> and <Grp>18 groups</Grp>. Mission 2 has <N>100</N> channels,
              {" "}<N>3.1</N> million training timesteps at <N>0.056</N> Hz (about one every 18 seconds), <Sub>5 subsystems</Sub> and
              {" "}<Grp>29 groups</Grp>.
            </P>

            <H3>What counts as an anomaly</H3>
            <P>
              Each label is an engineer’s call that a timestep is either a <dfn>genuine system fault</dfn>, a hardware or software
              failure that needs intervention, or a <dfn>rare operational event</dfn>: unusual, but still operational. The missions
              differ sharply here. Mission 1’s anomalies are genuine faults; about 95% of Mission 2’s labels are rare events. The paper
              therefore treats the two missions separately throughout.
            </P>
            <P>
              And “normal” is not one thing. What counts as normal depends on the satellite’s current operating mode: a reading that is
              normal during an eclipse manoeuvre may be anomalous during routine orbit. Keep that sentence in mind; the results come
              back to it. <PageRef p={2}>§2</PageRef>
            </P>

            <H3>How a detector is scored</H3>
            <P>
              Every detector here gives each timestep an <dfn>anomaly score</dfn>; flag the highest scores and you have alarms. Because
              anomalies are rare (about 10% of Mission 1’s timesteps), the familiar ROC-AUC is overly optimistic. The paper’s main
              metric is <dfn>PR-AUC</dfn>, the area under the precision–recall curve. <em>Precision</em> is the share of alarms that
              are real; <em>recall</em> is the share of real anomalies caught. A detector that guessed at random would score about the
              anomaly rate itself, so on Mission 1 the floor is about <N>0.11</N>. For the baselines the paper also reports an
              event-wise F1, which asks whether each contiguous anomaly segment was caught at all.
            </P>
            <P>
              Every model is fit on the benchmark’s training half and scored on its test half, split in time. Each method tunes itself
              on training data only (the baselines on a temporal 80/20 split, the VAEs on 90/10, the mixture model by BIC on an
              800,000-timestep sample), so the test half is never seen while fitting. <PageRef p={2}>§2</PageRef>
            </P>
          </Col>
        </Section>

        {/* ============================================================ 03 · Methods */}
        <Section id="methods" title="Five methods, each more expressive than the last">
          <Col>
            <P>
              The methods form a ladder. The first three are baselines: simple tools that test whether any
              structure exists at all. Where they fail motivates two richer, generative models that learn the
              structure and use it to score anomalies. <PageRef p={2}>§3</PageRef>
            </P>
          </Col>
          <Wide>
            <Ladder />
          </Wide>
          <Col>
            <H3>The baselines: clusters, compression and curved boundaries</H3>
            <P>
              <dfn>K-Means</dfn> splits the data into K clusters and scores each timestep by its distance to the nearest cluster centre.
              {" "}<dfn>PCA</dfn> (principal component analysis) compresses the 76 channels into a few directions that keep most of the
              variation, and scores a timestep by how badly it is rebuilt from them. <dfn>Nyström-KPCA</dfn> is a kernel version of PCA
              whose boundaries can curve; the Nyström approximation makes it affordable on millions of rows. <PageRef p={2}>§3</PageRef>
            </P>
            <P>
              All three are <em>global</em>: each assumes one notion of normal for the whole mission. That assumption turns out to be the
              story.
            </P>

            <H3>A mixture model that chooses its own number of modes</H3>
            <P>
              A <dfn>Gaussian mixture model</dfn> (GMM) describes the data as a blend of K ellipsoidal clusters, each with its own shape
              and correlations, so each cluster can stand for one operating mode. Instead of fixing K in advance, the paper sweeps it and
              lets <dfn>BIC</dfn> (the Bayesian information criterion, a fit score that penalises extra components) pick the K that
              explains the data best without overfitting. That K is a direct, unsupervised estimate of how many modes the telemetry
              contains, and it can be compared with the <Sub /> and the <Grp>groups</Grp>. <PageRef p={3}>§4</PageRef>
            </P>
            <P>
              Before fitting, constant channels are dropped (<N>8</N> on Mission 1, <N>33</N> on Mission 2) and PCA reduces the rest to
              30 components, keeping <N>99.1%</N> of Mission 1’s variance and <N>91.0%</N> of Mission 2’s. A timestep’s anomaly score is
              its negative log-likelihood under the mixture: anything less likely than 99% of normal training points is flagged.
            </P>

            <H3>Three neural networks that learn a compressed code</H3>
            <P>
              A <dfn>variational autoencoder</dfn> (VAE) is a neural network that squeezes a window of telemetry into a short code and
              then tries to rebuild the window from it. Trained only on windows with no anomalies (32 timesteps, about 16 minutes on
              Mission 1), it learns what clean telemetry looks like, so anomalous windows should be harder to rebuild or should land
              in unlikely parts of the code space. <PageRef p={4}>§5</PageRef>
            </P>
            <P>
              The paper tries three: <b className="font-semibold">CapacityVAE</b>, convolutional and trained to remove noise, with a
              capacity term that stops the code from collapsing; <b className="font-semibold">HierarchicalVAE</b>, which splits the
              code into a global part (what mode the spacecraft is in) and a local part (how this window deviates from it); and
              {" "}<b className="font-semibold">TransformerVAE</b>, whose self-attention lets every timestep in the window look at every
              other. Each is scored three ways (reconstruction error, negative ELBO, and the likelihood of its code under a GMM fit to
              training codes) and the best is kept by validation PR-AUC.
            </P>
          </Col>
        </Section>

        {/* ============================================================ 04 · Results */}
        <Section id="results" title="What the models found">
          <Col>
            <H3>Is there hidden structure at all?</H3>
            <P>
              Yes. The telemetry is highly compressible. On Mission 1, 33 principal components keep 95% of the variance of 76 channels,
              and the first component weighs almost every channel equally (a coefficient of variation of just <N>0.006</N>): one shared
              pattern moves them together. For the mixture model, 30 components keep 99.1% of Mission 1 and 91.0% of Mission 2. Both
              missions sit on low-dimensional manifolds despite their many channels, and that structure was recovered without labels.
              <PageRef p={4}>§6</PageRef>
            </P>
          </Col>
          <div className={`${COL} my-12`}>
            <dl className="grid grid-cols-3 gap-x-4 border-y border-[var(--rule)] py-5 sm:gap-x-8">
              {[
                ["33 / 76", "components keep 95% of Mission 1’s variance"],
                ["0.006", "spread of the first component’s weights (CV)"],
                ["99.1 · 91.0%", "variance kept by 30 components, M1 · M2"],
              ].map(([v, d]) => (
                <div key={v}>
                  <dt className={`${SERIF} text-[clamp(1.35rem,4vw,2.1rem)] leading-none font-light tracking-[-0.02em] tabular-nums`}>{v}</dt>
                  <dd className={`${SANS} mt-2 text-[12.5px] leading-[1.4] text-[var(--muted)]`}>{d}</dd>
                </div>
              ))}
            </dl>
          </div>
          <Col>
            <H3 id="modes">How many operating modes does the data contain?</H3>
            <P>
              If the structure followed the subsystems, a mixture model free to choose its own size should settle near <Sub>4</Sub> on
              Mission 1 or <Sub>5</Sub> on Mission 2. Below, the large numeral is the K that BIC selects; the line beneath it marks the
              {" "}<Sub>subsystem</Sub> and <Grp>group</Grp> counts. Play the sweep to watch BIC fall as K grows, then bottom out.
            </P>
          </Col>
          <Wide id="bic">
            <div className="grid gap-x-12 gap-y-14 lg:grid-cols-12">
              <Figure title="The number of modes BIC selects" cap="K*: the component count with the lowest BIC, per mission." chip={<PageRef p={5}>§6</PageRef>} className="lg:col-span-5">
                <GiantK m={m} bic={data.bic} />
              </Figure>
              <Figure title={`BIC as the number of components grows · Mission ${m}`} cap="Lower is better. The faint line is the full sweep; the ink line is how far you have played." chip={<PageRef p={3}>§4</PageRef>} className="lg:col-span-7">
                <BicPlayer key={m} m={m} sweeps={data.bic} />
              </Figure>
            </div>
          </Wide>
          <Col>
            <P>
              BIC selects K = 21 on Mission 1, beside its <Grp>18 groups</Grp>, and K = 29 on Mission 2, which has <Grp>29 groups</Grp>.
              Neither is anywhere near the subsystem count. The mixture model’s flexible density recovers something close to
              {" "}<Grp>group-level</Grp> granularity.
            </P>
            <P>
              The other methods that choose their own size point the same way, if less neatly. Select each one below.
            </P>
          </Col>
          <Wide>
            <Granularity m={m} />
          </Wide>
          <Col>
            <P>
              In raw space, K-Means prefers just two clusters: the four subsystems do not appear as four tight blobs. The best VAEs
              find 16 and 18 modes, between the subsystem and group counts. The paper reads this as an intermediate granularity,
              perhaps collections of sensors that repeatedly co-activate to support one operational behaviour, which it offers as a
              hypothesis rather than a finding. Taken together: across missions and model families, the unsupervised estimates land at
              {" "}<Grp>group-level granularity</Grp>, roughly 18–29 modes, not at the <Sub>subsystem level</Sub> of 4–5. <PageRef p={5}>§6</PageRef>
            </P>
            <P>
              So the answer to Q1 is two-part. Real, recoverable structure: yes. Aligned with the subsystems: no.
            </P>

            <H3 id="stall">Why the simple detectors stall</H3>
            <P>
              The baselines hit a ceiling. K-Means (K = 2) and PCA reconstruction both reach PR-AUC <N>0.322</N> (ROC-AUC ≈ 0.62):
              this is the linear plateau. Nyström-KPCA’s centroid distance edges past it to <N>0.334</N>, but fragilely, since only one
              kernel bandwidth beats the baseline at all, and its reconstruction score collapses to <N>0.164</N>. A curved boundary is
              not enough. <PageRef p={3}>§3</PageRef>
            </P>
            <P>
              To see why, the paper maps Mission 1 with <dfn>t-SNE</dfn>, a method that lays high-dimensional points out in two
              dimensions so that neighbours stay neighbours. The map is a fragmented archipelago of 10–15 distinct operating modes,
              with anomalies scattered across nearly every island. There is no single “anomalous zone” for a global model to find.
              <PageRef p={2}>§3</PageRef> The sketch below shows the consequence.
            </P>
          </Col>
          <Wide>
            <ModesSketch />
          </Wide>
          <Col>
            <P>
              With one global idea of normal, an anomaly that sits between or beside the islands still looks ordinary. The bottleneck
              is not that the baselines are linear; it is their assumption of a single global normality baseline. That is what
              motivates the local, mode-aware models. <PageRef p={3}>§3</PageRef>
            </P>
            <P>
              The failure also shows up in time. Mission 1’s longest anomaly lasts 116,061 timesteps, about 967 hours, from 25 May
              2009. In the paper’s figure, K-Means’ alarm spikes at onset, then collapses toward zero: the model simply reassigns the
              persistent anomalous state to the nearest normal cluster. Scrub through the same window below. <PageRef p={7}>Fig. 3</PageRef>
            </P>
          </Col>
          <Wide id="fault">
            <Figure title="What a detector sees during a 967-hour fault" cap="Mission 1’s longest genuine fault, shaded. Both scores spike at onset, then sink back while the fault goes on. Redrawn from saved runs: the K-Means line is a saved K = 8 run, not the paper’s K = 2." chip={<PageRef p={7}>Fig. 3</PageRef>}>
              {m === 2 && <p className={`${SANS} -mt-2 mb-4 text-[12.5px] text-[var(--muted)]`}>This figure stays on Mission 1: its labels are genuine faults, while Mission 2’s are mostly rare events.</p>}
              <FaultScrub twin={data.twin} />
            </Figure>
          </Wide>
          <Col>
            <H3 id="detect">Do richer models catch more anomalies?</H3>
            <P>
              Q2: yes, and the type of anomaly decides which model wins. On Mission 1’s genuine faults, the <Grp>GMM</Grp> reaches
              PR-AUC <N>0.384</N> (ROC-AUC 0.692), well above the linear plateau. The VAEs land close to that plateau on Mission 1
              (<N>0.305</N>, <N>0.293</N>, and <N>0.335</N> for TransformerVAE, which edges just above it). On Mission 2’s rare
              events the order flips: the VAEs lead (<N>0.414</N>–<N>0.438</N>), with TransformerVAE at <N>0.438</N> against the GMM’s <N>0.390</N>.
              <PageRef p={5}>§6</PageRef>
            </P>
            <P>
              The paper’s reading: GMMs excel at deviations within known operating regimes, while VAEs are better at novel,
              out-of-distribution behaviour. Drag across the curves to compare the <Grp>GMM</Grp> with {m === 1 ? "K-Means" : "TransformerVAE"} at
              any recall; switch missions in the header to see the order flip.
            </P>
          </Col>
          <Wide id="pr">
            <Figure title={`Precision at each level of recall · Mission ${m}`} cap={m === 1 ? "Mission 1: the GMM keeps more precision than K-Means through mid recall. The dashed line is a random guess." : "Mission 2: TransformerVAE holds precision to recall 0.3; the GMM drops sooner. The dashed line is a random guess."} chip={m === 1 ? <PageRef p={3}>Fig. 1a</PageRef> : <PageRef p={5}>Table 1</PageRef>}>
              <div className="mx-auto max-w-[760px]"><PrDrag m={m} sets={data.pr} /></div>
            </Figure>
          </Wide>
          <Col>
            <P>
              Every number in this essay comes from the paper’s Table 1, below for Mission {m}. Filter by family, sort, or open a row to
              read how the method was set up. Each row also says whether we could match it to a saved notebook run: Verified, Near,
              Mixed (its numbers come from two runs), or Not saved.
            </P>
          </Col>
          <Wide id="table">
            <h3 className={`${SERIF} mb-5 text-[22px] leading-[1.2] font-[450]`}>Table 1: every method, scored · Mission {m}</h3>
            <MethodExplorer rows={data.rows} prov={data.prov} m={m} />
          </Wide>
        </Section>

        {/* ============================================================ 05 · Conclusions */}
        <Section id="conclusions" title="What this means for watching satellites">
          <Col>
            <P>
              ESA satellite telemetry contains latent structure at the operational-<Grp>group</Grp> level of granularity (18–29
              modes), not the coarse <Sub>subsystem</Sub> level (4–5). Richer models, the GMM and the VAEs, improve on the linear
              baselines, especially on Mission 2. <PageRef p={5}>§7</PageRef>
            </P>
            <P>
              But the root problem remains. Multi-modality is the fundamental bottleneck for all global models: each operational
              mode has its own normality baseline, and anomalies scatter across all modes, with no single outlier zone. They are also
              mode-specific and structured in time, in ways that static global models cannot fully capture.
            </P>
          </Col>
          <Wide>
            <ol className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Structure at the group level", <>Unsupervised estimates find <span className="text-[var(--prussian)]">18–29 modes</span>, not <span className="text-[var(--ochre)]">4–5 subsystems</span>, on both missions.</>],
                ["Richer models help", <>The GMM reaches <span className={MONO}>0.384</span> on Mission 1; TransformerVAE <span className={MONO}>0.438</span> on Mission 2.</>],
                ["Each mode has its own normal", <>That multi-modality is the bottleneck for every global model.</>],
                ["Next: time and transfer", <>Temporal models (LSTM-VAE, HMM), and cross-mission tests on three shared subsystems.</>],
              ].map(([t, d], k) => (
                <li key={k} className="border-t border-[var(--ink)] pt-3">
                  <p className={`${MONO} text-[11px] text-[var(--muted)]`}>{String(k + 1).padStart(2, "0")}</p>
                  <h3 className={`${SERIF} mt-1 text-[21px] leading-[1.2] font-[450]`}>{t}</h3>
                  <p className={`${SANS} mt-2 text-[13.5px] leading-[1.5] text-[var(--ink-soft)]`}>{d}</p>
                </li>
              ))}
            </ol>
          </Wide>
          <Col>
            <H3>What comes next</H3>
            <P>
              Two directions follow. Temporal models such as an LSTM-VAE or a hidden Markov model could learn each mode’s dynamics,
              not just its snapshot. And because the two missions share three subsystems, a cross-mission test could show whether the
              structure is specific to one satellite or fundamental to spacecraft operations.
            </P>
            <P>
              The paper also asks something of future versions of the dataset: label what each channel measures, its physical units,
              and its expected nominal range. With that, the intermediate structure found here could be read against what the
              satellite is actually designed to do. <PageRef p={5}>§7</PageRef>
            </P>
          </Col>
        </Section>

        <PaperSection />
      </main>
      <Footer />
    </>
  );
}

/* ---------------------------------------------------------------- section scaffold: numbered eyebrow + title in the column */
function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const n = NAV.find((x) => x.id === id)!;
  return (
    <section id={id} aria-labelledby={`${id}-h`} tabIndex={-1} className="mt-28 outline-none lg:mt-40">
      <div className={`${COL} border-t border-[var(--ink)] pt-5`}>
        <p className={eyebrow}>{n.n} · {n.t}</p>
        <h2 id={`${id}-h`} className={`${SERIF} mt-3 text-[clamp(2rem,4.2vw,3rem)] leading-[1.08] font-[400] tracking-[-0.018em]`}>{title}</h2>
      </div>
      <div className="mt-10 lg:mt-12">{children}</div>
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
      className={`${SANS} ${FOCUS} inline-flex min-h-10 items-center gap-2 rounded-[2px] px-2 text-[13px] whitespace-nowrap transition-colors duration-200 hover:bg-[var(--parchment)] hover:text-[var(--ink)] active:bg-[var(--rule)] aria-[current]:font-semibold aria-[current]:text-[var(--ink)] aria-[current]:shadow-[inset_0_-2px_0_var(--ink)] ${mobile ? "w-full min-h-11 aria-[current]:shadow-[inset_2px_0_0_var(--ink)]" : ""} text-[var(--muted)]`}>
      <span className={`${MONO} text-[11px] font-normal text-[var(--muted)]`}>{n.n}</span>{n.t}
    </a>
  );
  return (
    <header ref={box} className="sticky top-0 z-50 border-b border-[var(--rule)] bg-[var(--paper)]/95 backdrop-blur-[2px]">
      <div className={`${WRAP} flex h-14 items-center gap-2 sm:gap-3`}>
        <Link href="/" className={`${SANS} ${link} -ml-1 shrink-0 px-1 py-2 text-[13px] font-medium no-underline hover:underline`}>← Hub</Link>
        <span aria-hidden className="h-5 w-px shrink-0 bg-[var(--rule)] max-sm:hidden" />
        <a href="#top" className={`${SERIF} ${FOCUS} min-w-0 truncate rounded-[2px] text-[16px] max-sm:hidden`}>Below the Telemetry</a>
        <nav aria-label="Sections" className="ml-auto hidden items-center 2xl:flex">{NAV.map((n) => item(n))}</nav>
        <div className="ml-auto flex shrink-0 items-center gap-2 2xl:ml-3">
          <span aria-hidden className={`${SANS} text-[13px] text-[var(--muted)] max-md:hidden`}>Mission</span>
          <Segmented label="Mission shown in every figure" value={m} onChange={setM} options={[{ value: 1, label: "M1" }, { value: 2, label: "M2" }]} />
        </div>
        <button id="rps-menu-btn" type="button" aria-expanded={open} aria-controls="rps-menu" aria-label="Sections menu" onClick={() => setOpen((o) => !o)}
          className={`${SANS} ${FOCUS} inline-flex h-10 shrink-0 items-center gap-2 rounded-[3px] border border-[var(--rule-strong)] px-3 text-[13px] font-medium transition-colors duration-200 hover:border-[var(--ink)] hover:bg-[var(--parchment)] active:bg-[var(--rule)] aria-expanded:border-[var(--ink)] aria-expanded:bg-[var(--parchment)] 2xl:hidden`}>
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

/* ---------------------------------------------------------------- hero: the paper's title, the satellite, the goal */
function Hero() {
  const open = useReader();
  return (
    <section id="top" aria-labelledby="rps-h1" className="grid items-center gap-x-14 gap-y-8 pt-10 sm:pt-16 lg:min-h-[min(calc(100svh-56px),880px)] lg:grid-cols-12 lg:pt-6 lg:pb-16">
      <div className="rps-in mx-auto w-full max-w-[300px] sm:max-w-[400px] lg:col-span-5 lg:max-w-none" style={{ animationDelay: "60ms" }}>
        <Satellite />
      </div>
      <div className="lg:col-span-7">
        <p className={`${eyebrow} rps-in`}>Below the Telemetry · a machine-learning paper, as an essay</p>
        <h1 id="rps-h1" tabIndex={-1} className={`${SERIF} rps-in mt-5 max-w-[17ch] text-[clamp(2.4rem,5vw,4.6rem)] leading-[1.03] font-light tracking-[-0.03em] outline-none`} style={{ animationDelay: "80ms" }}>
          Uncovering Latent Structure in ESA Satellite Telemetry
        </h1>
        <p className={`${SERIF} rps-in mt-7 max-w-[36ch] text-[21px] leading-[1.42] sm:text-[23px]`} style={{ animationDelay: "220ms" }}>
          We look for the hidden structure in two ESA satellites’ sensor data, and ask whether it explains why anomaly detectors
          keep raising false alarms.
        </p>
        <p className={`${SANS} rps-in mt-6 text-[14px] leading-[1.5] text-[var(--ink-soft)]`} style={{ animationDelay: "300ms" }}>
          Rhea Madhogarhia &amp; Hewitt Watkins
          <span className="block text-[var(--muted)]">TTIC 31220 Unsupervised Learning and Data Analysis · UChicago / TTIC · Spring 2026</span>
        </p>
        <div className="rps-in mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "380ms" }}>
          <button type="button" className={`${btnPrimary} h-11 px-5 text-[15px]`} onClick={() => open(1)}>Read the paper <IconArrow /></button>
          <TourButton className="h-11 px-5 text-[15px]" />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- 06 · the paper */
function PaperSection() {
  const open = useReader();
  return (
    <Section id="paper" title="Read the paper itself">
      <Col>
        <P>
          <i>Uncovering Latent Structure in ESA Satellite Telemetry.</i> Rhea Madhogarhia &amp; Hewitt Watkins. TTIC 31220, Spring 2026.
          Eleven pages: open any page to read it in place, with arrow keys or a swipe to turn, or download the PDF.
        </P>
      </Col>
      <div className={`${WIDE} mt-12 grid gap-x-10 gap-y-12 lg:grid-cols-12`}>
        <div className="flex flex-col lg:col-span-4">
          <div className="flex flex-wrap gap-3">
            <button type="button" className={`${btnPrimary} h-11 px-5 text-[15px]`} onClick={() => open(1)}>Read the paper <IconArrow /></button>
            <a href={PDF} download className={`${btnSecondary} h-11 px-5 text-[15px]`}>
              <svg aria-hidden width="12" height="12" viewBox="0 0 12 12"><path d="M6 1.5v6.5M3 5.5 6 8.5l3-3M2 10.5h8" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
              Download PDF
            </a>
          </div>
          <dl id="credits" tabIndex={-1} className={`${SANS} mt-10 grid gap-4 border-t border-[var(--rule)] pt-4 text-[13.5px] leading-[1.5] outline-none`}>
            <div><dt className="text-[var(--muted)]">Data</dt><dd>ESA Anomaly Dataset, Missions 1 and 2 (Kotowski et al., 2024; Andrzejewski et al., 2024).</dd></div>
          </dl>
        </div>
        <ol className="grid grid-cols-4 gap-x-2.5 gap-y-4 sm:gap-x-3 sm:gap-y-5 lg:col-span-8 lg:grid-cols-6" aria-label="Pages of the paper">
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
            This site is Hewitt’s project. The paper is joint work: Rhea Madhogarhia &amp; Hewitt Watkins, TTIC 31220, Spring 2026. Figures are redrawn from the saved runs; the sketch of modes is a schematic.
          </p>
        </div>
        <Link href="/" className={`${SANS} ${link} justify-self-start text-[13px] font-medium whitespace-nowrap`}>← Hub</Link>
      </div>
    </footer>
  );
}
