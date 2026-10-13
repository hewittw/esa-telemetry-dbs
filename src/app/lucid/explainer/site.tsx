"use client";

// Lucid · The Explainer: the refined-paper finalist, restructured for a researcher new to the project.
// Hero (title, an ink satellite, the goal) → 01 Context → 02 Dataset & setup → 03 Methods → 04 Results →
// 05 Conclusions → 06 The paper. Every section opens with a plain title and a "you'll learn" line; every result
// gets one plain sentence before its figure; glossed terms open their definition in place.
// One global mission (the header switch) drives every figure. Vermilion: "Read the paper" (and "Download PDF"
// inside the reader) and nowhere else.
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Bic, MethodRow, PrSet, Twin } from "../../design-systems/refined-paper/data";
import { FOCUS, IconArrow, IconMenu, MONO, SANS, SERIF, btnPrimary, btnSecondary, link } from "../../design-systems/refined-paper/kit";
import { Segmented } from "../../design-systems/refined-paper/ui";
import { BicPlayer, ChannelSteps, FaultScrub, Figure, GiantK, Ladder, PrDrag, Satellite, type Ch, type M } from "./figs";
import { Glossary, Term } from "./glossary";
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
const eyebrow = `${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`;
const lead = `${SERIF} text-[17px] leading-[1.6] sm:text-[19px] sm:leading-[1.58]`;
const POS = { 1: 0.111, 2: 0.0468 } as const;
const num = (v: ReactNode) => <span className={MONO}>{v}</span>;
const sub = <span className="text-[var(--ochre)]">subsystems</span>;
const grp = <span className="text-[var(--prussian)]">operational groups</span>;

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
  const b = data.bic[m - 1];
  return (
    <>
      <a href="#context" className={`${SANS} ${FOCUS} sr-only z-[90] rounded-[3px] bg-[var(--ink)] px-3 py-2 text-[13px] text-[var(--paper)] focus:not-sr-only focus:fixed focus:top-3 focus:left-3`}>Skip to the content</a>
      <Header m={m} setM={setM} />
      <p className="sr-only" aria-live="polite">Showing Mission {m} in every figure</p>
      <main className={WRAP}>
        <Hero />

        {/* ------------------------------------------------ 01 · context */}
        <Section id="context" title="Why look for hidden structure in satellite data?"
          learn="What the data is, why it is new, and the open question this paper takes on."
          lead={<>A satellite reports on itself constantly, and someone has to decide what in that stream is trouble. Six steps set the scene.</>}
          aside={
            <ol className="mt-8">
              {([
                ["The course", <>A machine-learning project for <i>TTIC 31220 · Unsupervised Learning and Data Analysis</i> (UChicago / TTIC, Spring 2026). Unsupervised means the methods learn without being shown the answers.</>],
                ["ESA", <>The European Space Agency: Europe’s space agency, which builds and operates satellites and runs their mission control.</>],
                ["Telemetry", <>The stream of readings a satellite sends home: voltages, temperatures, rotation rates, signal strengths. Each sensor’s stream is a <Term k="channel">channel</Term>; there are dozens to hundreds, read at sub-minute cadence, for years. Engineers watch 76+ of them by hand or with threshold alarms. <PageRef p={1}>§1</PageRef></>],
                ["The data", <>The <b className="font-semibold">ESA Anomaly Dataset</b> (Kotowski et al., 2024; Andrzejewski et al., 2024): telemetry from two real ESA missions, anonymised, so the satellites and sensors have numbers, not names.</>],
                ["Why it’s new", <>It is the first large-scale public satellite-telemetry benchmark with per-channel, per-timestep <Term k="anomaly">anomaly</Term> labels annotated by ESA engineers.</>],
                ["The gap", <>Kotowski et al. showed that existing unsupervised detectors keep producing false alarms on it, but left open <i>why</i>. This paper asks what latent structure underlies the telemetry, and whether that explains the failures.</>],
              ] as const).map(([t, d], k) => (
                <li key={t} className="grid gap-x-6 gap-y-1 border-t border-[var(--rule)] py-4 sm:grid-cols-[8.5rem_1fr]">
                  <p className={`${SANS} text-[13px] font-medium text-[var(--muted)]`}><span className={`${MONO} mr-2 text-[11px]`}>{k + 1}</span>{t}</p>
                  <p className={`${SERIF} text-[17px] leading-[1.55] sm:text-[18px]`}>{d}</p>
                </li>
              ))}
              <li className="border-t border-[var(--ink)] pt-5">
                <p className={`${SANS} text-[13px] font-medium text-[var(--muted)]`}>So the paper asks two questions <PageRef p={1}>§1</PageRef></p>
                <dl className="mt-3 grid gap-6 sm:grid-cols-2">
                  {[["Q1", <>Does the telemetry contain a consistent latent structure aligned with ESA’s known {sub}?</>], ["Q2", <>Can learning that structure improve unsupervised anomaly detection?</>]].map(([q, t]) => (
                    <div key={q as string}>
                      <dt className={`${MONO} text-[12px] text-[var(--muted)]`}>{q}</dt>
                      <dd className={`${SERIF} mt-1 text-[22px] leading-[1.3]`}>{t}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            </ol>
          }
        />

        {/* ------------------------------------------------ 02 · dataset & setup */}
        <Section id="data" title="What the data looks like"
          learn="How ESA organises a satellite’s sensors, what an anomaly is, and how a detector is scored."
          lead={<>ESA files every sensor in a two-level hierarchy: <Term k="subsystem">{sub}</Term>, each split into finer <Term k="group">{grp}</Term>. If the data has structure, which level does it follow? Scroll, or tap the steps, to watch Mission {m}’s channels regroup.</>}>
          <div className="space-y-24 lg:space-y-28">
            <Sub id="hierarchy" title="From sensors to subsystems to groups">
              <ChannelSteps key={m} ch={data.ch[m]} m={m} />
            </Sub>
            <Sub id="missions" title="The two missions, side by side" plain={<>The two satellites differ in size, cadence and, above all, in what their labels mark: faults on Mission 1, unusual-but-healthy events on Mission 2.</>}>
              <MissionTable m={m} />
            </Sub>
            <Sub id="scoring" title="How a detector is scored" plain={<>Every method turns each timestep into an anomaly score; we then ask how well high scores line up with the engineers’ labels.</>}>
              <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2">
                <p className={`${SERIF} text-[17px] leading-[1.6] sm:text-[18px]`}>
                  Anomalies are rare (about {num("10%")} of Mission 1’s timesteps), so ROC-AUC looks optimistic. The main score is <Term k="prauc">PR-AUC</Term>: 1 is perfect, and guessing at random scores the share of anomalies, {num((POS[m] * 100).toFixed(1) + "%")} on Mission {m}. <PageRef p={2}>§2</PageRef>
                </p>
                <p className={`${SERIF} text-[17px] leading-[1.6] sm:text-[18px]`}>
                  The benchmark splits each mission in time, 50/50: models learn from the first half, and every number on this page comes from the second. <PageRef p={2}>§2</PageRef>
                </p>
              </div>
            </Sub>
          </div>
        </Section>

        {/* ------------------------------------------------ 03 · methods */}
        <Section id="methods" title="Five ways to find structure, simplest first"
          learn="What each method assumes, and why each failure motivates the next."
          lead={<>The baselines (<Term k="kmeans">K-Means</Term>, <Term k="pca">PCA</Term>, Nyström-<Term k="kpca">KPCA</Term>) ask whether any structure exists at all. A <Term k="gmm">GMM</Term> lets the data say how many <Term k="mode">modes</Term> it has, scored by <Term k="bic">BIC</Term>; three <Term k="vae">VAEs</Term> learn it with neural networks. <PageRef p={2}>§3</PageRef></>}>
          <div className="space-y-24 lg:space-y-28">
            <Sub id="ladder" title="The five methods, in order of richness">
              <Ladder />
            </Sub>
            <Sub id="glossary" title="Terms used on this page" plain={<>Each term is also explained in place: tap any dotted word.</>}>
              <Glossary />
            </Sub>
          </div>
        </Section>

        {/* ------------------------------------------------ 04 · results */}
        <Section id="results" title="What we found"
          learn="That the structure is real, how fine it is, and how far learning it gets detection."
          lead={<>Three answers, each with the evidence beside it. The mission switch at the top changes every figure.</>}>
          <div className="space-y-24 lg:space-y-32">
            <Sub id="structure" n="4.1" title="Is there hidden structure at all?"
              plain={<>Yes. The channels move together, so a few directions describe almost all of the data. <PageRef p={4}>§6</PageRef></>}>
              <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-3">
                {([
                  ["33 of 76", "PCA directions keep 95% of Mission 1’s variation."],
                  [m === 1 ? "99.1%" : "91.0%", `of Mission ${m}’s variation survives in 30 directions, the input to the GMM.`],
                  ["0.006", "The spread (CV) of Mission 1’s first direction: it weights its channels almost equally, one shared pattern found without labels."],
                ] as const).map(([v, t]) => (
                  <div key={t} className="border-t border-[var(--ink)] pt-3">
                    <dt className={`${SERIF} text-[clamp(2.5rem,4vw,3.5rem)] leading-none font-light tracking-[-0.03em] tabular-nums`}>{v}</dt>
                    <dd className={`${SANS} mt-2 text-[13.5px] leading-[1.5] text-[var(--ink-soft)]`}>{t}</dd>
                  </div>
                ))}
              </dl>
            </Sub>

            <Sub id="bic" n="4.2" title="How many operating modes does the data contain?"
              plain={<>Left to choose for itself, the GMM picks {num(data.bic[0].selectedK)} modes for Mission 1 and {num(data.bic[1].selectedK)} for Mission 2: close to ESA’s {num(18)} and {num(29)} {grp}, far from the {num(4)} and {num(5)} {sub}.</>}>
              <div className="grid gap-x-10 gap-y-16 lg:grid-cols-12">
                <Figure title="Modes chosen, both missions" cap={<>The open circle is BIC’s choice, on a line from 0 to 30 modes with the {sub} and {grp} marked.</>} chip={<PageRef p={5}>§6</PageRef>} className="lg:col-span-5">
                  <GiantK m={m} bic={data.bic} />
                </Figure>
                <Figure title={`Fit score (BIC) as modes are added · Mission ${m}`} cap={<>Lower is better. BIC bottoms out at K = {b.selectedK}, beside the {b.groups} groups. Press play to add modes one at a time.</>} chip={<PageRef p={3}>§4</PageRef>} className="lg:col-span-7">
                  <BicPlayer key={m} m={m} sweeps={data.bic} />
                </Figure>
              </div>
              <p className={`${SANS} mt-8 max-w-[62ch] text-[13.5px] leading-[1.55] text-[var(--ink-soft)]`}>
                The VAEs’ latent spaces point the same way: the best one shows {num(16)} modes on Mission 1 and {num(18)} on Mission 2, far above the subsystem counts and a little below the group counts. Across missions and model families, the paper reads this as group-level granularity (18–29 modes), not subsystem level (4–5). <PageRef p={11}>Fig. 7</PageRef>
              </p>
            </Sub>

            <Sub id="table" n="4.3" title="Which method catches the most anomalies?"
              plain={m === 1
                ? <>On Mission 1 the GMM scores highest, {num("0.384")}. The linear methods plateau at {num("0.322")}, and the VAEs land close to that plateau ({num("0.293–0.335")}).</>
                : <>On Mission 2 the VAEs lead: TransformerVAE reaches {num("0.438")}, the GMM {num("0.390")}. The baselines were run on Mission 1 only.</>}>
              <p className={`${SANS} -mt-2 mb-5 text-[13px] text-[var(--muted)]`}>Table 1 of the paper, Mission {m}. Choose a row for how it works; filter by family, or reorder.</p>
              <MethodExplorer rows={data.rows} prov={data.prov} m={m} />
            </Sub>

            <Sub id="pr" n="4.4" title="How many alarms are right, as more anomalies are caught?"
              plain={m === 1
                ? <>Through mid recall, more of the GMM’s alarms are real anomalies than K-Means’. Drag across the chart to compare.</>
                : <>TransformerVAE keeps its precision up to about recall 0.3; the GMM’s falls sooner. Drag across the chart to compare.</>}>
              <div className="grid gap-x-10 gap-y-8 lg:grid-cols-12">
                <Figure title={`Precision against recall · Mission ${m}`} cap={m === 1 ? "GMM holds more precision than K-Means through mid recall." : "TransformerVAE holds precision to recall 0.3; GMM drops sooner."} chip={m === 1 ? <PageRef p={3}>Fig. 1a</PageRef> : <PageRef p={5}>Table 1</PageRef>} className="lg:col-span-7">
                  <PrDrag m={m} sets={data.pr} />
                </Figure>
                <dl className={`${SANS} self-start text-[13.5px] leading-[1.5] lg:col-span-4 lg:col-start-9 lg:pt-10`}>
                  <div className="border-t border-[var(--rule)] py-3"><dt className="font-semibold">Recall</dt><dd className="text-[var(--ink-soft)]">The share of real anomalies the detector catches.</dd></div>
                  <div className="border-t border-[var(--rule)] py-3"><dt className="font-semibold">Precision</dt><dd className="text-[var(--ink-soft)]">The share of its alarms that are real. The rest are false alarms.</dd></div>
                  <div className="border-t border-[var(--rule)] py-3"><dt className="font-semibold">PR-AUC</dt><dd className="text-[var(--ink-soft)]">The area under this curve. The dashed line is random guessing.</dd></div>
                </dl>
              </div>
            </Sub>

            <Sub id="fault" n="4.5" title="Why do global detectors miss a long fault?"
              plain={<>A global detector learns one picture of normal. Over Mission 1’s longest fault (≈967 hours) both scores spike at onset, then sink back: once the satellite settles into the faulty state, the model is effectively blind to it.</>}>
              <div className="grid gap-x-10 gap-y-8 lg:grid-cols-12">
                <Figure title="The longest Mission 1 fault, start to finish" cap="Shaded: the fault. Scores on a log scale; play or scrub through time." chip={<PageRef p={7}>Fig. 3</PageRef>} className="lg:col-span-7">
                  {m === 2 && <p className={`${SANS} -mt-2 mb-3 text-[12px] text-[var(--muted)]`}>Shown for Mission 1 on either setting: Mission 2’s labels are mostly rare events, not long faults.</p>}
                  <FaultScrub twin={data.twin} />
                </Figure>
                <p className={`${SERIF} self-start text-[17px] leading-[1.6] sm:text-[18px] lg:col-span-4 lg:col-start-9 lg:pt-10`}>
                  The paper puts it plainly: K-Means “simply reassigns the stable anomalous regime to the nearest normal cluster.” Anomalies scatter across every mode, with no single outlier zone to watch. <PageRef p={2}>§3</PageRef>
                </p>
              </div>
            </Sub>
          </div>
        </Section>

        {/* ------------------------------------------------ 05 · conclusions */}
        <Section id="conclusions" title="What it means"
          learn="The answer to both questions, the limit every model hit, and what to try next."
          lead={<>The telemetry has real structure, finer than ESA’s subsystems; and because each mode has its own normal, static global models cannot fully capture it. <PageRef p={5}>§7</PageRef></>}>
          <ol className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {([
              ["Q1 · Hidden structure?", "Yes, at group level", <>Real and compressible, at <span className="text-[var(--prussian)]">group-level granularity</span>: 18–29 modes, not <span className="text-[var(--ochre)]">4–5 subsystems</span>, on both missions.</>],
              ["Q2 · Does it help?", "Yes, up to a point", <>The GMM lifts Mission 1 from {num("0.322")} to {num("0.384")}; the VAEs lead Mission 2 at {num("0.438")}. The paper suggests GMMs suit faults within known regimes, VAEs novel events.</>],
              ["The limit", "Each mode has its own normal", <>Multi-modality is the fundamental bottleneck for all global models: anomalies scatter across every mode.</>],
              ["Next", "Time and transfer", <>Temporal models (LSTM-VAE, HMM); a cross-mission test on the three subsystems both share; channel labels with units and normal ranges.</>],
            ] as const).map(([q, t, d], k) => (
              <li key={k} className="border-t border-[var(--ink)] pt-3">
                <p className={`${MONO} text-[11px] text-[var(--muted)]`}>{q}</p>
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

/* ---------------------------------------------------------------- Mission facts, both missions, the current one in ink */
function MissionTable({ m }: { m: M }) {
  const rows: [ReactNode, string, string][] = [
    ["Channels", "76", "100"],
    ["Training timesteps", "7.4M", "3.1M"],
    ["One reading every", "≈30 s", "≈18 s"],
    [<span key="s" className="text-[var(--ochre)]">Subsystems</span>, "4", "5"],
    [<span key="g" className="text-[var(--prussian)]">Operational groups</span>, "18", "29"],
    ["What the labels mark", "Genuine system faults", "≈95% rare operational events"],
    ["Anomalous test timesteps", "11.1%", "4.7%"],
  ];
  const col = (k: 1 | 2) => (m === k ? "bg-[var(--parchment)] text-[var(--ink)]" : "text-[var(--ink-soft)]");
  return (
    <figure>
      <table className={`${SANS} w-full max-w-[52rem] border-collapse text-left text-[14px] leading-[1.4]`}>
        <caption className="sr-only">Mission 1 and Mission 2 compared. Mission {m} is shown in the figures.</caption>
        <thead>
          <tr className="border-b border-[var(--ink)]">
            <th scope="col" className="w-[38%] py-2 pr-3 text-[12px] font-normal text-[var(--muted)]"><span className="sr-only">Property</span></th>
            {([1, 2] as const).map((k) => (
              <th key={k} scope="col" className={`px-3 py-2 text-[13px] font-semibold ${col(k)}`}>Mission {k}{m === k && <span className={`${MONO} ml-2 text-[11px] font-normal text-[var(--muted)]`}>shown</span>}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, x, y], i) => (
            <tr key={i} className="border-b border-[var(--rule)] align-baseline">
              <th scope="row" className="py-2.5 pr-3 text-[13px] font-medium text-[var(--muted)]">{a}</th>
              <td className={`px-3 py-2.5 ${x.length < 8 ? MONO : ""} ${col(1)}`}>{x}</td>
              <td className={`px-3 py-2.5 ${y.length < 8 ? MONO : ""} ${col(2)}`}>{y}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className={`${SANS} mt-3 text-[12px] leading-[1.45] text-[var(--muted)]`}>From §2 of the paper; anomaly shares from the saved test labels. <PageRef p={2}>§2</PageRef></figcaption>
    </figure>
  );
}

/* ---------------------------------------------------------------- subsection: a plain title, one plain sentence, then the figure */
function Sub({ id, n, title, plain, children }: { id: string; n?: string; title: string; plain?: ReactNode; children: ReactNode }) {
  return (
    <div id={id} tabIndex={-1} className="outline-none">
      <div className="mb-8 max-w-[46rem]">
        {n && <p className={eyebrow}>{n}</p>}
        <h3 className={`${SERIF} mt-1 text-[clamp(1.5rem,2.3vw,1.875rem)] leading-[1.15] font-[450] tracking-[-0.01em]`}>{title}</h3>
        {plain && <p className={`${SERIF} mt-3 text-[18px] leading-[1.5] sm:text-[20px]`}>{plain}</p>}
      </div>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- section scaffold: one grid, one rhythm */
function Section({ id, title, learn, lead: l, aside, children }: { id: string; title: string; learn: string; lead: ReactNode; aside?: ReactNode; children?: ReactNode }) {
  const n = NAV.find((x) => x.id === id)!;
  return (
    <section id={id} aria-labelledby={`${id}-h`} tabIndex={-1} className="mt-28 border-t border-[var(--ink)] pt-6 outline-none lg:mt-36">
      <div className="grid gap-x-10 gap-y-5 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className={eyebrow}>{n.n} · {n.t}</p>
          <h2 id={`${id}-h`} className={`${SERIF} mt-3 max-w-[18ch] text-[clamp(2rem,3.3vw,2.75rem)] leading-[1.08] font-[400] tracking-[-0.018em]`}>{title}</h2>
        </div>
        <div className="lg:col-span-7 lg:pt-8">
          <p className={`${SANS} flex max-w-[40em] gap-3 border-l-2 border-[var(--ink)] pl-3 text-[14px] leading-[1.5] text-[var(--ink)]`}>
            <span className={`${MONO} shrink-0 pt-[2px] text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>You’ll learn</span>
            <span>{learn}</span>
          </p>
          <p className={`${lead} mt-5 max-w-[40em]`}>{l}</p>
          {aside}
        </div>
      </div>
      {children && <div className="mt-14 lg:mt-20">{children}</div>}
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
          <a href="#glossary" onClick={() => setOpen(false)} className={`${SANS} ${FOCUS} mt-1 inline-flex min-h-11 w-full items-center gap-2 rounded-[2px] px-2.5 text-[13px] text-[var(--muted)] transition-colors duration-200 hover:bg-[var(--parchment)] hover:text-[var(--ink)] active:bg-[var(--rule)]`}><span className={`${MONO} text-[11px]`}>Aa</span>Glossary of terms</a>
          <span className="mt-3 block border-t border-[var(--rule)] pt-3" onClick={() => setOpen(false)}><TourButton className="w-full" /></span>
        </nav>
      )}
    </header>
  );
}

/* ---------------------------------------------------------------- hero: the paper's title, a satellite in ink, the goal */
function Hero() {
  const open = useReader();
  return (
    <section id="top" aria-labelledby="rps-h1" className="grid items-center gap-x-12 gap-y-8 pt-10 sm:pt-16 lg:grid-cols-12 lg:pt-20">
      <div className="rps-in mx-auto w-full max-w-[340px] sm:max-w-[420px] lg:col-span-5 lg:max-w-none" style={{ animationDelay: "60ms" }}>
        <Satellite />
      </div>
      <div className="lg:col-span-7">
        <p className={`${eyebrow} rps-in`}>A research paper · TTIC 31220 · Spring 2026</p>
        <h1 id="rps-h1" tabIndex={-1} className={`${SERIF} rps-in mt-5 max-w-[17ch] text-[clamp(2.4rem,4.6vw,4.25rem)] leading-[1.04] font-light tracking-[-0.03em] outline-none`} style={{ animationDelay: "80ms" }}>
          Uncovering Latent Structure in ESA Satellite Telemetry
        </h1>
        <p className={`${SERIF} rps-in mt-6 max-w-[34ch] text-[21px] leading-[1.42] sm:text-[22px]`} style={{ animationDelay: "220ms" }}>
          We asked whether a satellite’s sensor data hides an organisation of its own, and whether learning it helps catch faults.
        </p>
        <p className={`${SANS} rps-in mt-5 text-[13.5px] leading-[1.5] text-[var(--muted)]`} style={{ animationDelay: "280ms" }}>
          <span className="block text-[var(--ink)]">Rhea Madhogarhia &amp; Hewitt Watkins</span>
          <span className="block">TTIC 31220 · Unsupervised Learning and Data Analysis · UChicago / TTIC</span>
        </p>
        <div className="rps-in mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "360ms" }}>
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
    <Section id="paper" title="Read the paper itself"
      learn="All eleven pages as submitted, in a reader you can page through, and the PDF."
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
            This site is Hewitt’s project. The paper is joint work: Rhea Madhogarhia &amp; Hewitt Watkins, TTIC 31220, Spring 2026. Figures are redrawn from the saved runs.
          </p>
        </div>
        <Link href="/" className={`${SANS} ${link} justify-self-start text-[13px] font-medium whitespace-nowrap`}>← Hub</Link>
      </div>
    </footer>
  );
}
