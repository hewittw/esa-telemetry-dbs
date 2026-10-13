"use client";

// B · The Paper, Alive. The paper's own structure as an annotated journal page:
// hero → Abstract · 1 Introduction (the context) → 2 Dataset → 3 Baselines → 4 GMM → 5 VAEs → 6 Results → 7 Conclusions → the paper.
// The interactive figures are numbered subsections inside their paper sections, with margin notes that gloss terms
// (right margin on desktop, inline on phones) and a sticky section rail. The copy is the paper's own sentences, condensed.
// One global mission (the header switch) drives every figure. Vermilion: "Read the paper" (and "Download PDF" inside the reader) only.
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Bic, MethodRow, PrSet, Twin } from "../../design-systems/refined-paper/data";
import { FOCUS, IconArrow, IconMenu, MONO, SANS, SERIF, btnPrimary, btnSecondary, link } from "../../design-systems/refined-paper/kit";
import { Segmented } from "../../design-systems/refined-paper/ui";
import { Fig, LatentK, MissionTable, Para, Satellite, Sub, VaePicker } from "./alive";
import { BicPlayer, ChannelSteps, FaultScrub, GiantK, Ladder, PrDrag, type Ch, type M } from "./figs";
import { MethodExplorer, type Prov } from "./methods";
import { PAGES, PAGE_NOTES, PDF, PageRef, ReaderProvider, useReader } from "./reader";
import { TourButton, TourProvider } from "./tour";

export type { Ch, Prov };
export type SiteData = { rows: MethodRow[]; prov: Record<string, Prov>; pr: PrSet[]; bic: Bic[]; twin: Twin; ch: Record<M, Ch[]> };

/** The paper's sections, in the paper's order. `subs` feed the rail's second level. */
export const NAV = [
  { id: "introduction", n: "1", t: "Introduction", subs: [["intro-context", "The context"], ["intro-questions", "The two questions"]] },
  { id: "dataset", n: "2", t: "Dataset and setup", subs: [["dataset-telemetry", "What telemetry is"], ["dataset-missions", "The two missions"], ["dataset-eval", "How detection is scored"]] },
  { id: "baselines", n: "3", t: "Baseline methods", subs: [["baselines-kmeans", "K-Means"], ["baselines-pca", "PCA"], ["baselines-kpca", "Nyström-KPCA"], ["fault", "Figure 3.1"]] },
  { id: "gmm", n: "4", t: "GMM", subs: [["gmm-setup", "Setup"], ["bic", "Figure 4.1"], ["gmm-score", "Scoring"]] },
  { id: "vae", n: "5", t: "VAEs", subs: [["vae-setup", "Shared setup"], ["vaes", "Figure 5.1"]] },
  { id: "results", n: "6", t: "Results and discussion", subs: [["results-q1", "Q1: structure"], ["table", "Table 1"], ["results-q2", "Q2: detection"]] },
  { id: "conclusions", n: "7", t: "Conclusions", subs: [] },
  { id: "paper", n: "↓", t: "The paper", subs: [] },
] as const;
const WRAP = "mx-auto w-full max-w-[1320px] px-5 md:px-10";
const eyebrow = `${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`;
const hi = (c: "ochre" | "prussian", t: ReactNode) => <span className={`text-[var(--${c})]`}>{t}</span>;

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
  const cur = useSpy();
  return (
    <>
      <a href="#introduction" className={`${SANS} ${FOCUS} sr-only z-[90] rounded-[3px] bg-[var(--ink)] px-3 py-2 text-[13px] text-[var(--paper)] focus:not-sr-only focus:fixed focus:top-3 focus:left-3`}>Skip to the introduction</a>
      <Header m={m} setM={setM} cur={cur} />
      <p className="sr-only" aria-live="polite">Showing Mission {m} in every figure</p>
      <main className={WRAP}>
        <Hero />
        <div className="lg:grid lg:grid-cols-[10.5rem_minmax(0,1fr)] lg:gap-x-12 xl:grid-cols-[12rem_minmax(0,1fr)] xl:gap-x-16">
          <Rail cur={cur} />
          <div className="min-w-0">
            <Introduction />
            <Dataset m={m} setM={setM} ch={data.ch[m]} />
            <Baselines m={m} twin={data.twin} />
            <Gmm m={m} bic={data.bic} />
            <Vaes m={m} />
            <Results m={m} data={data} />
            <Conclusions />
            <PaperSection />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

/* ---------------------------------------------------------------- the section scaffold: paper number, paper title, one plain line */
function Section({ id, title, plain, chip, children }: { id: string; title: string; plain: ReactNode; chip?: ReactNode; children: ReactNode }) {
  const n = NAV.find((x) => x.id === id)!;
  return (
    <section id={id} aria-labelledby={`${id}-h`} tabIndex={-1} className="mt-24 border-t border-[var(--ink)] pt-5 outline-none first:mt-16 lg:mt-32 lg:first:mt-20">
      <div className="flex items-baseline gap-4 sm:gap-6">
        {n.n !== "↓" && <span aria-hidden className={`${SERIF} shrink-0 text-[clamp(2.75rem,5vw,4rem)] leading-[0.9] font-light text-[var(--muted)] tabular-nums`}>{n.n}</span>}
        <div className="min-w-0">
          <h2 id={`${id}-h`} className={`${SERIF} text-[clamp(1.9rem,3.2vw,2.6rem)] leading-[1.08] font-[400] tracking-[-0.015em]`}>
            <span className="sr-only">{n.n === "↓" ? "" : `Section ${n.n}. `}</span>{title}
          </h2>
          <p className={`${SANS} mt-2.5 max-w-[48rem] text-[15px] leading-[1.5] text-[var(--ink-soft)]`}>{plain} {chip}</p>
        </div>
      </div>
      <div className="mt-12 lg:mt-14">{children}</div>
    </section>
  );
}

/* ---------------------------------------------------------------- hero: title, satellite on the left, the goal */
function Hero() {
  const open = useReader();
  return (
    <section id="top" aria-labelledby="rps-h1" className="grid items-center gap-x-14 gap-y-4 pt-6 sm:gap-y-8 sm:pt-16 lg:grid-cols-12 lg:pt-14">
      <div className="rps-in mx-auto w-full max-w-[260px] sm:max-w-[400px] lg:col-span-5 lg:max-w-none" style={{ animationDelay: "40ms" }}>
        <Satellite />
      </div>
      <div className="lg:col-span-7">
        <p className={`${eyebrow} rps-in`}>TTIC 31220 · Final project · Spring 2026</p>
        <h1 id="rps-h1" tabIndex={-1} className={`${SERIF} rps-in mt-5 max-w-[17ch] text-[clamp(2.4rem,4.7vw,4.4rem)] leading-[1.04] font-light tracking-[-0.03em] outline-none`} style={{ animationDelay: "80ms" }}>
          Uncovering Latent Structure in ESA Satellite Telemetry
        </h1>
        <p className={`${SERIF} rps-in mt-6 max-w-[36ch] text-[20px] leading-[1.45] sm:text-[22px]`} style={{ animationDelay: "200ms" }}>
          We ask whether the sensor data of two European Space Agency satellites hides a consistent structure, and whether learning it helps detect anomalies without labels.
        </p>
        <p className={`${SANS} rps-in mt-6 text-[14px] leading-[1.5] text-[var(--ink-soft)]`} style={{ animationDelay: "280ms" }}>
          <span className="font-medium text-[var(--ink)]">Rhea Madhogarhia &amp; Hewitt Watkins</span><br />
          TTIC 31220 Unsupervised Learning and Data Analysis · The University of Chicago / TTIC
        </p>
        <div className="rps-in mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "360ms" }}>
          <button type="button" className={`${btnPrimary} h-11 px-5 text-[15px]`} onClick={() => open(1)}>Read the paper <IconArrow /></button>
          <TourButton className="h-11 px-5 text-[15px]" />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Abstract · 1 Introduction: the context, in the spec's order */
function Introduction() {
  return (
    <Section id="introduction" title="Introduction" plain={<>Abstract and §1: the setting, the data, and the open question this paper takes up.</>} chip={<PageRef p={1}>Abstract, §1</PageRef>}>
      <Sub id="intro-context" n="1.1" title="The context: satellites, their sensor data, and an open question">
        <Para notes={[
          { t: "TTIC", d: "Toyota Technological Institute at Chicago, a computer-science institute on the University of Chicago campus." },
          { t: "Unsupervised", d: "Learning from data without labels. Here the labels are used only to score the detectors afterwards." },
        ]}>
          <p>This was a machine-learning project for <i>TTIC 31220, Unsupervised Learning and Data Analysis</i> (the University of Chicago and TTIC, Spring 2026).</p>
        </Para>
        <Para notes={[{ t: "ESA", d: "The European Space Agency: Europe’s space agency. It builds and operates satellites and runs their mission control." }]}>
          <p>Its subject is the <b className="font-semibold">European Space Agency (ESA)</b>, Europe’s space agency, which operates satellites and the mission control that watches over them.</p>
        </Para>
        <Para notes={[
          { t: "Telemetry", d: "The measurements a spacecraft streams back to the ground." },
          { t: "Channel", d: "One sensor’s time series." },
          { t: "Anomaly", d: "A timestep where something has gone wrong, as opposed to ordinary healthy variation." },
        ]}>
          <p>Modern satellites continuously produce vast amounts of sensor data, called <b className="font-semibold">telemetry</b>. Onboard instruments measuring voltages, temperatures, rotation rates and signal strengths generate readings across dozens to hundreds of <i>channels</i> simultaneously, at sub-minute cadence, over years of operation.</p>
          <p>Engineers must detect <i>anomalies</i>. Today they monitor 76+ channels manually or with threshold alarms, an approach that is error-prone and demands large teams.</p>
        </Para>
        <Para notes={[{ t: "Anonymised", d: "The missions, channels and subsystems are numbered, not named; nothing says which satellite or which sensor." }]}>
          <p>The data is the <b className="font-semibold">ESA Anomaly Dataset</b> (Kotowski et al., 2024; Andrzejewski et al., 2024): telemetry from real ESA missions, anonymised. We use Missions 1 and 2, two distinct real satellites.</p>
          <p><b className="font-semibold">Why it is novel:</b> it is the first large-scale, publicly available satellite-telemetry benchmark with per-channel, per-timestep anomaly labels annotated by ESA engineers.</p>
        </Para>
        <Para notes={[
          { t: "False alarm", d: "A detector flags a timestep that is in fact normal." },
          { t: "Latent structure", d: "Organisation in the data that is not recorded directly, such as hidden operating modes." },
        ]}>
          <p><b className="font-semibold">The gap.</b> Kotowski et al. (2024) benchmarked existing unsupervised detectors and showed that all produce persistent false alarms, but left open the structural question: <i>what latent organisation underlies the telemetry, and does it explain why detectors fail?</i></p>
          <p>It is hard because channels are highly correlated (a power fluctuation can affect thermal, attitude and communications sensors at once), the satellite’s operating mode shifts across orbit phases and eclipse windows, and genuine faults are rare.</p>
        </Para>
      </Sub>

      <Sub id="intro-questions" n="1.2" title="The two questions">
        <dl className="grid gap-x-10 gap-y-6 border-t border-[var(--rule)] pt-5 sm:grid-cols-2">
          {[["Q1", <>Does ESA satellite telemetry contain a consistent latent structure aligned with known operational {hi("ochre", "subsystems")}?</>], ["Q2", "Can learning that structure improve unsupervised anomaly detection?"]].map(([q, t]) => (
            <div key={q as string}>
              <dt className={`${MONO} text-[12px] text-[var(--muted)]`}>{q}</dt>
              <dd className={`${SERIF} mt-1 text-[22px] leading-[1.32]`}>{t}</dd>
            </div>
          ))}
        </dl>
        <Para>
          <p>We run five progressively richer unsupervised methods: K-Means, PCA, Nyström-KPCA, a Gaussian mixture model, and three VAE architectures. The baselines serve as a structural proof of concept, establishing whether latent structure exists at all; their failure modes motivate the methods that follow. <PageRef p={1}>§1</PageRef></p>
        </Para>
      </Sub>
    </Section>
  );
}

/* ---------------------------------------------------------------- 2 Dataset and Problem Setup */
function Dataset({ m, setM, ch }: { m: M; setM: (m: M) => void; ch: Ch[] }) {
  return (
    <Section id="dataset" title="Dataset and Problem Setup" plain={<>What the data looks like, the two missions, and how a detector is scored.</>} chip={<PageRef p={2}>§2</PageRef>}>
      <Sub id="dataset-telemetry" n="2.1" title="What is satellite telemetry?">
        <Para notes={[
          { t: "Subsystem", d: <>A physically coherent group of spacecraft components, e.g. power management or attitude control. Shown in {hi("ochre", "ochre")}.</> },
          { t: "Operational group", d: <>A finer subdivision of a subsystem, e.g. battery charging. Shown in {hi("prussian", "Prussian blue")}.</> },
        ]}>
          <p>Each <i>channel</i> is one sensor’s time series. A {hi("ochre", <i>subsystem</i>)} is a physically coherent group of components; ESA further subdivides each subsystem into finer operational {hi("prussian", <i>groups</i>)}.</p>
          <p>Detection is hard because what counts as normal depends on the current operating mode: a reading that is normal during an eclipse manoeuvre may be anomalous during routine orbit.</p>
        </Para>
        <Fig n="2.1" title={`How Mission ${m}’s channels are organised`} from="New: drawn from the dataset’s channel list"
          cap={<>Each dot is one channel. Step through, or scroll on desktop: channels, then {hi("ochre", "subsystems")}, then {hi("prussian", "groups")}.</>} chip={<PageRef p={2}>§2</PageRef>}>
          <ChannelSteps key={m} ch={ch} m={m} />
        </Fig>
      </Sub>

      <Sub id="dataset-missions" n="2.2" title="The two missions">
        <Para notes={[
          { t: "Hz", d: "Readings per second. 0.033 Hz is one reading about every 30 seconds." },
          { t: "Rare operational event", d: "An unusual but still-operational condition, not a true failure." },
        ]}>
          <p>Each label is an ESA engineer’s annotation marking a timestep as a genuine system fault or a rare operational event. Mission 1 anomalies are genuine faults; Mission 2 labels are ≈95% rare events. We treat the two missions separately throughout.</p>
        </Para>
        <MissionTable m={m} setM={setM} />
      </Sub>

      <Sub id="dataset-eval" n="2.3" title="How detection is scored">
        <Para notes={[
          { t: "PR-AUC", d: "Area under the precision–recall curve (average precision). A random detector scores the anomaly rate, ≈0.11 on Mission 1." },
          { t: "ROC-AUC", d: "Area under the true- vs false-positive curve; 0.5 is random. Optimistic when positives are rare." },
          { t: "Event-wise F1", d: "Counts whether each contiguous anomaly segment was caught at all." },
        ]}>
          <p>All metrics are on the ESA-ADB test set: a temporal 50/50 split of each mission. Because anomalies are rare (∼10% of Mission 1 timesteps), ROC-AUC is overly optimistic, so we report <b className="font-semibold">PR-AUC</b> as the primary metric, with ROC-AUC and, for the baselines, an event-wise F1 (Hundman et al., 2018).</p>
        </Para>
      </Sub>
    </Section>
  );
}

/* ---------------------------------------------------------------- 3 Baseline Methods */
function Baselines({ m, twin }: { m: M; twin: Twin }) {
  return (
    <Section id="baselines" title="Baseline Methods: K-Means, PCA, and Nyström-KPCA" plain={<>Does any structure exist at all? Three simple methods test it on Mission 1 before the richer models.</>} chip={<PageRef p={2}>§3</PageRef>}>
      <div className="mb-14">
        <p className={`${eyebrow} mb-3`}>The five methods, in order of richness</p>
        <Ladder />
      </div>
      <Sub id="baselines-kmeans" n="3.1" title="K-Means: global clustering">
        <Para notes={[
          { t: "K-Means", d: "Splits the data into K clusters around K centres; the anomaly score is distance to the nearest centre." },
          { t: "Silhouette score", d: "How well separated the clusters are, from −1 to 1." },
        ]}>
          <p>We sweep K = 2–10. Both silhouette (0.388) and validation PR-AUC peak at K = 2, not at the four engineering subsystems: the raw feature space favours a binary split. Test PR-AUC reaches <span className={MONO}>0.322</span>.</p>
          <p>On the longest continuous fault the score spikes at onset, then collapses to near zero: a global model simply reassigns the stable anomalous regime to the nearest normal cluster.</p>
        </Para>
        <Fig id="fault" n="3.1" title="What a global detector sees during the longest fault" from={<>Accompanies the paper’s Figure 3 <PageRef p={7}>Fig. 3</PageRef></>}
          cap={<>Mission 1’s longest fault (≈967 hours). Both scores spike at onset, then sink back. Press play or scrub the timeline. The K-Means panel is a saved K = 8 run, not the Table 1 run.</>}>
          {m === 2 && <p className={`${SANS} -mt-2 mb-4 text-[12.5px] text-[var(--muted)]`}>Mission 1 only: Mission 2’s labels are mostly rare events.</p>}
          <div className="max-w-[46rem]"><FaultScrub twin={twin} /></div>
        </Fig>
      </Sub>
      <Sub id="baselines-pca" n="3.2" title="PCA: linear compression and the shape of the data">
        <Para notes={[
          { t: "PCA", d: "Principal component analysis: finds the few directions that explain most of the variation." },
          { t: "t-SNE", d: "A method that draws high-dimensional points on a flat map, keeping neighbours close." },
        ]}>
          <p>The telemetry is highly compressible: d = 33 components retain 95% of the variance. But scoring by reconstruction error or centroid distance gives the same PR-AUC, <span className={MONO}>0.322</span>.</p>
          <p>A t-SNE map shows why the scores plateau: a fragmented archipelago of 10–15 operating modes, with anomalies scattered across nearly every island. There is no single “anomalous zone”. <PageRef p={3}>Fig. 1b</PageRef></p>
        </Para>
      </Sub>
      <Sub id="baselines-kpca" n="3.3" title="Nyström-KPCA: a non-linear boundary">
        <Para notes={[{ t: "Kernel PCA", d: "PCA after a non-linear (here RBF) map; Nyström approximates it so it scales to millions of rows." }]}>
          <p>Centroid distance gives a marginal, fragile gain (PR-AUC <span className={MONO}>0.334</span>); feature-space reconstruction collapses (<span className={MONO}>0.164</span>). The bottleneck is not linearity but the assumption of a single global normality baseline. <PageRef p={3}>§3</PageRef></p>
        </Para>
      </Sub>
    </Section>
  );
}

/* ---------------------------------------------------------------- 4 GMM */
function Gmm({ m, bic }: { m: M; bic: Bic[] }) {
  return (
    <Section id="gmm" title="Parametric Discovery: GMM" plain={<>A Gaussian mixture model directly tests how many operating modes the data contains, and whether that count matches ESA’s hierarchy.</>} chip={<PageRef p={3}>§4</PageRef>}>
      <Sub id="gmm-setup" n="4.1" title="Setup">
        <Para notes={[{ t: "GMM", d: "Gaussian mixture model: the data as a blend of K bell-shaped clusters, each with its own shape and orientation." }]}>
          <p>Unlike K-Means, a full-covariance GMM fits ellipsoidal, correlated clusters. We remove constant channels (8 on M1, 33 on M2), standardise, and reduce to 30 principal components, retaining 99.1% (M1) and 91.0% (M2) of the variance.</p>
        </Para>
      </Sub>
      <Sub n="4.2" title="How many operating modes does the data contain?">
        <Para notes={[{ t: "BIC", d: "Bayesian information criterion: a fit score that penalises extra components. Lower is better." }]}>
          <p>We sweep the number of components K and select the minimiser of BIC, then compare it with the {hi("ochre", `subsystem count (${m === 1 ? 4 : 5})`)} and the {hi("prussian", `group count (${m === 1 ? 18 : 29})`)}.</p>
        </Para>
        <Fig id="bic" n="4.1" title={`BIC as the number of components grows · Mission ${m}`} from="New: the BIC sweep from the saved run"
          cap={<>BIC bottoms out at K = {bic[m - 1].selectedK}, beside the {hi("prussian", "groups")}, far from the {hi("ochre", "subsystems")}. Play, step, or scrub K.</>} chip={<PageRef p={3}>§4</PageRef>}>
          <div className="max-w-[46rem]"><BicPlayer key={m} m={m} sweeps={bic} /></div>
        </Fig>
      </Sub>
      <Sub id="gmm-score" n="4.3" title="Turning the mixture into a detector">
        <Para notes={[{ t: "Negative log-likelihood", d: "How surprising a point is under the fitted model; low-density points score high." }]}>
          <p>Each test timestep is scored by its negative log-likelihood under the mixture. A point less likely than 99% of normal training points is flagged as anomalous.</p>
        </Para>
      </Sub>
    </Section>
  );
}

/* ---------------------------------------------------------------- 5 VAEs */
function Vaes({ m }: { m: M }) {
  return (
    <Section id="vae" title="Generative Discovery: VAEs" plain={<>Three neural networks learn a compressed code for short windows of healthy telemetry; unusual windows should not fit it.</>} chip={<PageRef p={4}>§5</PageRef>}>
      <Sub id="vae-setup" n="5.1" title="Shared setup">
        <Para notes={[
          { t: "VAE", d: "Variational autoencoder: an encoder compresses the input to a small latent code; a decoder rebuilds it." },
          { t: "ELBO", d: "The VAE’s training objective: reconstruction error plus a KL term." },
          { t: "KL divergence", d: "How far the learned code distribution sits from a simple prior." },
        ]}>
          <p>The models train on sliding windows of W = 32 timesteps (≈16 minutes on M1), and only windows where every timestep is nominal, so anomalous windows are out of distribution at test time.</p>
          <p>Three scores are tried for each model: reconstruction MSE, negative ELBO, and GMM-OOD (a GMM fit to the training codes). The best is chosen by validation PR-AUC.</p>
        </Para>
      </Sub>
      <Sub n="5.2" title="Three ways to encode a window">
        <Fig id="vaes" n="5.1" title={`The three VAEs and their best Mission ${m} score`} from={<>Summarises §5 <PageRef p={4}>§5</PageRef></>}
          cap={<>Choose an architecture: the diagram, the design and the Table 1 result change. The decoder is shared.</>} chip={<PageRef p={5}>Table 1</PageRef>}>
          <VaePicker m={m} />
        </Fig>
      </Sub>
    </Section>
  );
}

/* ---------------------------------------------------------------- 6 Results and Discussion */
function Results({ m, data }: { m: M; data: SiteData }) {
  return (
    <Section id="results" title="Results and Discussion" plain={<>Both questions answered: the structure is real, with group-level granularity; richer models help, and the type of anomaly decides which.</>} chip={<PageRef p={4}>§6</PageRef>}>
      <Sub id="results-q1" n="6.1" title="Q1: is there real latent structure, and at what level?">
        <Para notes={[{ t: "Granularity", d: "How finely the data divides: 4–5 subsystems is coarse; 18–29 groups is fine." }]}>
          <p><b className="font-semibold">Yes, real and compressible.</b> GMM model selection by BIC and the VAEs’ latent-space silhouette independently converge on a {hi("prussian", "group-level granularity of about 18–29 modes")}, not the {hi("ochre", "subsystem level (4–5)")}.</p>
          <p>TransformerVAE recovers 16 and 18 modes: between the two levels. It may be capturing collections of sensors that repeatedly co-activate to support specific operational behaviours.</p>
        </Para>
        <div className="grid gap-x-10 gap-y-14 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <Fig n="6.1" title="The number of modes BIC selects" from="New: from the saved BIC sweeps"
            cap={<>K*, the component count BIC selects, on a 0–30 line beside the {hi("ochre", "subsystems")} and {hi("prussian", "groups")}. The mission in the header is in ink.</>} chip={<PageRef p={5}>§6</PageRef>}>
            <GiantK m={m} bic={data.bic} />
          </Fig>
          <Fig n="6.2" title={`How many modes each method finds · Mission ${m}`} from={<>Gathers §3, §6 and Figure 7 <PageRef p={11}>Fig. 7</PageRef></>}
            cap={<>Select a row for the paper’s sentence about it. Dashed lines mark ESA’s two levels.</>}>
            <LatentK m={m} />
          </Fig>
        </div>
      </Sub>

      <Sub id="table" n="6.2" title={`Table 1: every method on Mission ${m}`}>
        <Para notes={[{ t: "Provenance", d: "Whether the number matches the executed notebook: Verified, Near, Mixed (two runs), or Not saved." }]}>
          <p>Table 1 summarises all methods with numbers grounded in executed notebook outputs. Filter by family, sort, and select a row for its setup and source.</p>
        </Para>
        <MethodExplorer rows={data.rows} prov={data.prov} m={m} />
      </Sub>

      <Sub id="results-q2" n="6.3" title="Q2: does learning the structure improve detection?">
        <Para notes={[{ t: "Precision", d: "Of the timesteps flagged, the share that are real anomalies." }, { t: "Recall", d: "Of the real anomalies, the share flagged." }]}>
          <p><b className="font-semibold">Richer models improve detection; anomaly type determines which works best.</b> Linear methods plateau at PR-AUC <span className={MONO}>0.322</span>. On Mission 1 faults, the {hi("prussian", "GMM")} reaches <span className={MONO}>0.384</span>, ahead of every VAE; the VAEs land close to the plateau (<span className={MONO}>0.293–0.335</span>, TransformerVAE edging just above it). On Mission 2 rare events, the VAEs lead (TransformerVAE <span className={MONO}>0.438</span> against GMM <span className={MONO}>0.390</span>).</p>
          <p>GMMs excel at deviations within known operating regimes; VAEs at novel, out-of-distribution behaviour. Multi-modality remains the fundamental bottleneck for all global models: each mode has its own normal (see <a href="#fault" className={`${link} ${SANS} text-[15px]`}>Figure 3.1</a>).</p>
        </Para>
        <Fig id="pr" n="6.3" title={`Precision against recall · Mission ${m}`} from={<>Accompanies Figures 1a, 5b, 6b <PageRef p={3}>Fig. 1a</PageRef></>}
          cap={m === 1 ? <>Drag across the plot, or focus it and use the arrow keys. {hi("prussian", "GMM")} holds more precision than K-Means through mid recall.</> : <>Drag across the plot, or focus it and use the arrow keys. TransformerVAE holds precision to recall 0.3; {hi("prussian", "GMM")} drops sooner.</>}
          chip={<PageRef p={5}>Table 1</PageRef>}>
          <div className="max-w-[46rem]"><PrDrag m={m} sets={data.pr} /></div>
        </Fig>
      </Sub>
    </Section>
  );
}

/* ---------------------------------------------------------------- 7 Conclusions and Future Work */
function Conclusions() {
  return (
    <Section id="conclusions" title="Conclusions and Future Work" plain={<>What the paper finds, in four sentences, and what should come next.</>} chip={<PageRef p={5}>§7</PageRef>}>
      <ol className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
        {([
          ["Structure at group-level granularity", <>ESA telemetry contains latent structure at the operational-group level ({hi("prussian", "18–29 modes")}), not the coarse subsystem level ({hi("ochre", "4–5")}). Every complexity selector converged on this granularity across both missions.</>],
          ["Richer models help, especially on Mission 2", <>GMM and VAEs improve over the linear baselines. On Mission 1, GMM reaches <span className={MONO}>0.384</span> while the VAEs land close to the <span className={MONO}>0.322</span> plateau (<span className={MONO}>0.293–0.335</span>); on Mission 2 the VAEs lead (<span className={MONO}>0.414–0.438</span>).</>],
          ["The bottleneck persists", <>Anomalies are mode-specific and temporally structured in ways static global models cannot fully capture.</>],
          ["Next: time, transfer, and labels", <>Temporal models (LSTM-VAE, HMM); cross-mission tests on three shared subsystems; and future datasets that label what each channel measures, its units and nominal range.</>],
        ] as const).map(([t, d], k) => (
          <li key={k} className="border-t border-[var(--ink)] pt-3">
            <p className={`${MONO} text-[11px] text-[var(--muted)]`}>{String(k + 1).padStart(2, "0")}</p>
            <h3 className={`${SERIF} mt-1 text-[23px] leading-[1.2] font-[450]`}>{t}</h3>
            <p className={`${SERIF} mt-2 max-w-[34rem] text-[17px] leading-[1.55] text-[var(--ink-soft)]`}>{d}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ---------------------------------------------------------------- the paper itself: reader + PDF */
function PaperSection() {
  const open = useReader();
  return (
    <Section id="paper" title="The paper, as submitted" plain={<><i>Uncovering Latent Structure in ESA Satellite Telemetry.</i> Rhea Madhogarhia &amp; Hewitt Watkins. TTIC 31220, Spring 2026. 11 pages.</>}>
      <div className="grid gap-x-10 gap-y-12 xl:grid-cols-12">
        <div className="flex flex-col xl:col-span-4">
          <div className="flex flex-wrap gap-3">
            <button type="button" className={`${btnPrimary} h-11 px-5 text-[15px]`} onClick={() => open(1)}>Read the paper <IconArrow /></button>
            <a href={PDF} download className={`${btnSecondary} h-11 px-5 text-[15px]`}>
              <svg aria-hidden width="12" height="12" viewBox="0 0 12 12"><path d="M6 1.5v6.5M3 5.5 6 8.5l3-3M2 10.5h8" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
              Download PDF
            </a>
          </div>
          <dl id="credits" tabIndex={-1} className={`${SANS} mt-10 grid gap-4 border-t border-[var(--rule)] pt-4 text-[13.5px] leading-[1.5] outline-none`}>
            <div><dt className="text-[var(--muted)]">Rhea Madhogarhia</dt><dd>K-Means, PCA and Nyström-KPCA baselines; the abstract and §1–3, 6, 7.</dd></div>
            <div><dt className="text-[var(--muted)]">Hewitt Watkins</dt><dd>The GMM and the three VAEs; §2, 4–7.</dd></div>
            <div><dt className="text-[var(--muted)]">Data</dt><dd>ESA Anomaly Dataset, Missions 1 and 2 (Kotowski et al., 2024; Andrzejewski et al., 2024).</dd></div>
          </dl>
          <p className="mt-3"><PageRef p={1}>Division of labour</PageRef></p>
        </div>
        <ol className="grid grid-cols-4 gap-x-2.5 gap-y-4 sm:grid-cols-6 sm:gap-x-3 sm:gap-y-5 xl:col-span-8" aria-label="Pages of the paper">
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

/* ---------------------------------------------------------------- scroll spy: section and subsection */
function useSpy() {
  const [cur, setCur] = useState<{ s: string | null; sub: string | null }>({ s: null, sub: null });
  useEffect(() => {
    const on = () => {
      const line = innerHeight * 0.3;
      let s: string | null = null, sub: string | null = null;
      for (const n of NAV) {
        const el = document.getElementById(n.id);
        if (el && el.getBoundingClientRect().top <= line) { s = n.id; sub = null; for (const [id] of n.subs) { const e = document.getElementById(id); if (e && e.getBoundingClientRect().top <= line) sub = id; } }
      }
      setCur((c) => (c.s === s && c.sub === sub ? c : { s, sub }));
    };
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    on();
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); };
  }, []);
  return cur;
}
type Cur = ReturnType<typeof useSpy>;

/* ---------------------------------------------------------------- the sticky section rail (desktop) */
function Rail({ cur }: { cur: Cur }) {
  return (
    <nav aria-label="Sections of the paper" className="hidden lg:block">
      <div className="sticky top-[84px] mt-20 max-h-[calc(100dvh-100px)] overflow-y-auto pb-6 rps-noscroll">
        <p className={`${eyebrow} mb-3`}>The paper</p>
        <ol className="border-l border-[var(--rule)]">
          {NAV.map((n) => {
            const on = cur.s === n.id;
            return (
              <li key={n.id}>
                <a href={`#${n.id}`} aria-current={on ? "location" : undefined}
                  className={`${SANS} ${FOCUS} -ml-px flex min-h-9 items-baseline gap-2 rounded-r-[2px] border-l-2 py-1.5 pr-2 pl-3 text-[13px] leading-[1.3] transition-colors duration-200 hover:bg-[var(--parchment)] hover:text-[var(--ink)] active:bg-[var(--rule)] ${on ? "border-[var(--ink)] font-semibold text-[var(--ink)]" : "border-transparent text-[var(--ink-soft)]"}`}>
                  <span className={`${MONO} w-3 shrink-0 text-[11px] font-normal text-[var(--muted)]`}>{n.n}</span>{n.t}
                </a>
                {on && n.subs.length > 0 && (
                  <ol className="rpd-fade mb-1.5">
                    {n.subs.map(([id, t]) => (
                      <li key={id}>
                        <a href={`#${id}`} aria-current={cur.sub === id ? "location" : undefined}
                          className={`${SANS} ${FOCUS} flex min-h-8 items-center rounded-[2px] py-1 pr-2 pl-8 text-[12.5px] leading-[1.3] transition-colors duration-200 hover:bg-[var(--parchment)] hover:text-[var(--ink)] active:bg-[var(--rule)] ${cur.sub === id ? "text-[var(--ink)] underline decoration-[var(--ink)] underline-offset-4" : "text-[var(--muted)]"}`}>
                          {t}
                        </a>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

/* ---------------------------------------------------------------- header: hub · title · mission · contents (phones, tablets) */
function Header({ m, setM, cur }: { m: M; setM: (m: M) => void; cur: Cur }) {
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
  return (
    <header ref={box} className="sticky top-0 z-50 border-b border-[var(--rule)] bg-[var(--paper)]/95 backdrop-blur-[2px]">
      <div className={`${WRAP} flex h-14 items-center gap-2 sm:gap-3`}>
        <Link href="/" className={`${SANS} ${link} -ml-1 shrink-0 px-1 py-2 text-[13px] font-medium no-underline hover:underline`}>← Hub</Link>
        <span aria-hidden className="h-5 w-px shrink-0 bg-[var(--rule)] max-sm:hidden" />
        <a href="#top" className={`${SERIF} ${FOCUS} min-w-0 truncate rounded-[2px] text-[16px] max-sm:hidden`}>Latent structure in ESA telemetry</a>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span aria-hidden className={`${SANS} text-[13px] text-[var(--muted)] max-md:hidden`}>Mission</span>
          <Segmented label="Mission shown in every figure" value={m} onChange={setM} options={[{ value: 1, label: "M1" }, { value: 2, label: "M2" }]} />
        </div>
        <button id="rps-menu-btn" type="button" aria-expanded={open} aria-controls="rps-menu" aria-label="Sections menu" onClick={() => setOpen((o) => !o)}
          className={`${SANS} ${FOCUS} inline-flex h-10 shrink-0 items-center gap-2 rounded-[3px] border border-[var(--rule-strong)] px-3 text-[13px] font-medium transition-colors duration-200 hover:border-[var(--ink)] hover:bg-[var(--parchment)] active:bg-[var(--rule)] aria-expanded:border-[var(--ink)] aria-expanded:bg-[var(--parchment)] lg:hidden`}>
          <IconMenu size={14} /><span className="max-[400px]:sr-only">Contents</span>
        </button>
      </div>
      {open && (
        <nav id="rps-menu" aria-label="Sections" className="rpd-rise absolute inset-x-3 top-full mt-1 max-h-[calc(100dvh-80px)] overflow-y-auto rounded-[3px] border border-[var(--ink)] bg-[var(--mount)] p-3 shadow-[var(--lift)] sm:right-5 sm:left-auto sm:w-[21rem] md:right-10">
          <ol className="flex flex-col">
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} onClick={() => setOpen(false)} aria-current={cur.s === n.id ? "location" : undefined}
                  className={`${SANS} ${FOCUS} flex min-h-11 w-full items-center gap-2.5 rounded-[2px] px-2.5 text-[14px] text-[var(--ink-soft)] transition-colors duration-200 hover:bg-[var(--parchment)] hover:text-[var(--ink)] active:bg-[var(--rule)] aria-[current]:font-semibold aria-[current]:text-[var(--ink)] aria-[current]:shadow-[inset_2px_0_0_var(--ink)]`}>
                  <span className={`${MONO} w-3 text-[11px] font-normal text-[var(--muted)]`}>{n.n}</span>{n.t}
                </a>
              </li>
            ))}
          </ol>
          <span className="mt-3 block border-t border-[var(--rule)] pt-3" onClick={() => setOpen(false)}><TourButton className="w-full" /></span>
        </nav>
      )}
    </header>
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
            This site is Hewitt’s project. The paper is joint work: Rhea Madhogarhia &amp; Hewitt Watkins, TTIC 31220, Spring 2026. Rhea built the baselines; Hewitt built the GMM and the VAEs. Figures are redrawn from the saved runs.
          </p>
        </div>
        <Link href="/" className={`${SANS} ${link} justify-self-start text-[13px] font-medium whitespace-nowrap`}>← Hub</Link>
      </div>
    </footer>
  );
}
