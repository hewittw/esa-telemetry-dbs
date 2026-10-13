"use client";

// The panels that carry the story around the verified figures: the data and the question (01),
// the five method families and how they're scored (02), and the takeaways (04). Same Panel, same
// primitives (ui.tsx), every line drawn from content/report.md.
import { useRef, useState } from "react";
import type { Row } from "../design-systems/intense-space/data";
import { Button, DOT, FR, LABEL, MONO, Status, TRANS } from "../design-systems/intense-space/ui";
import { Panel, type M } from "./figures";
import { CountUp } from "./reveal";

export type MissionFacts = { channels: number; train: string; hz: number; subsystems: number; groups: number; pos: number };

/* ===================== B.01 · the data ===================== */
export function DataPanel({ f, m }: { f: MissionFacts; m: M }) {
  const rows: [string, string, React.ReactNode, string?][] = [
    ["Training timesteps", "", f.train],
    ["Sampling", "", `${f.hz} Hz`],
    ["Subsystems", "e.g. power", f.subsystems, "text-(--is-steel)"],
    ["Operational groups", "e.g. battery charging", f.groups, "text-(--is-teal)"],
  ];
  return (
    <Panel id="background-data" code="B.01" title={`Mission ${m} · the data`} page={2} pageLabel="Dataset" className="lg:col-span-5" caption="Per-channel, per-timestep anomaly labels annotated by ESA engineers.">
      <div className="flex items-end gap-5">
        <div>
          <p className={`${LABEL} text-(--is-steel)`}>Channels</p>
          <p className={`${DOT} text-[72px] font-semibold leading-[0.82] text-(--is-frost)`}>
            <CountUp value={f.channels} />
          </p>
        </div>
      </div>
      <dl className={`${MONO} mt-auto flex flex-col text-[11px] uppercase tracking-[0.1em]`}>
        {rows.map(([k, g, v, tone]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 border-b border-(--is-line) py-2">
            <dt className={tone ?? "text-(--is-steel)"}>
              {k}
              {g ? <span className="normal-case tracking-normal text-(--is-steel)"> · {g}</span> : null}
            </dt>
            <dd className={tone ?? "text-(--is-frost)"}>{v}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 pt-2">
          <dt className="text-(--is-steel)">Labels</dt>
          <dd>{m === 1 ? <Status kind="fault">Genuine system faults</Status> : <Status kind="rare">≈95% rare operational events</Status>}</dd>
        </div>
      </dl>
    </Panel>
  );
}

/* ===================== B.03 · the question ===================== */
const QS = [
  { q: "Q1", t: "Is there latent structure aligned with known subsystems?", to: "conclusions-q1" },
  { q: "Q2", t: "Does learning that structure improve detection?", to: "conclusions-q2" },
];
export function QuestionPanel() {
  return (
    <Panel id="background-question" code="B.03" title="The question" page={1} pageLabel="Introduction" className="lg:col-span-12">
      <div className="grid gap-5 md:grid-cols-2 md:gap-0">
        {QS.map((x, i) => (
          <div key={x.q} className={`flex flex-col gap-4 ${i ? "border-t border-(--is-line) pt-5 md:border-l md:border-t-0 md:pl-5 md:pt-0" : "md:pr-5"}`}>
            <p className={`${LABEL} text-(--is-steel)`}>{x.q}</p>
            <p className="max-w-[24ch] text-[24px] font-semibold leading-[1.05] tracking-[-0.02em] text-(--is-frost) sm:text-[28px]">{x.t}</p>
            <a href={`#${x.to}`} className={`${MONO} ${TRANS} mt-auto inline-flex min-h-10 w-fit items-center gap-2 rounded-[2px] text-[11px] uppercase tracking-[0.14em] text-(--is-steel) underline decoration-(--is-line) underline-offset-4 hover:text-(--is-frost) hover:decoration-(--is-frost) active:opacity-70 ${FR}`}>
              Answer · 04 <span aria-hidden>↓</span>
            </a>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ===================== M.01 · five families, simpler → richer ===================== */
const LINE = [
  { n: "K-Means", g: "nearest-centroid clusters", methods: ["K-Means"], d: "Global clustering, K = 2 by silhouette; score: distance to the nearest centroid.", page: 2 },
  { n: "PCA", g: "linear compression", methods: ["PCA Recon"], d: "33 components keep 95% of the variance; score: reconstruction error.", page: 2 },
  { n: "KPCA", g: "kernel PCA, non-linear", methods: ["Nystroem-KPCA Dist"], d: "A Nyström-approximated RBF kernel tests a non-linear decision boundary.", page: 3 },
  { n: "GMM", g: "Gaussian mixture model", methods: ["GMM"], d: "Full-covariance mixture on PCA-30; BIC, a complexity-penalised fit, picks K.", page: 3 },
  { n: "VAE ×3", g: "variational autoencoders", methods: ["CapacityVAE", "HierarchicalVAE", "TransformerVAE"], d: "Capacity, Hierarchical and Transformer VAEs learn a density over 32-step windows.", page: 4 },
] as const;
const best = (rows: Row[], methods: readonly string[], m: number) =>
  rows.filter((r) => r.mission === m && methods.includes(r.method)).sort((a, b) => b.prAuc - a.prAuc)[0];

export function MethodLine({ rows, m, onOpen }: { rows: Row[]; m: M; onOpen: (r: Row) => void }) {
  const [i, setI] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const go = (n: number) => {
    const k = (n + LINE.length) % LINE.length;
    setI(k);
    refs.current[k]?.focus();
  };
  const s = LINE[i];
  const here = best(rows, s.methods, m);
  const card = here ?? best(rows, s.methods, 1);
  return (
    <Panel id="method-line" code="M.01" title="Five families, simpler → richer" page={s.page} pageLabel={i < 3 ? "Baselines" : i === 3 ? "GMM" : "VAEs"} className="lg:col-span-8" caption="Each method's failure mode motivates the next.">
      <div role="tablist" aria-label="Method families, simpler to richer" className="relative grid md:grid-cols-5">
        <span aria-hidden className="absolute left-[10%] right-[10%] top-[37px] h-px bg-(--is-line) max-md:hidden" />
        <span aria-hidden className="absolute left-[10%] top-[37px] h-px bg-(--is-frost) transition-[width] duration-300 ease-(--is-ease) max-md:hidden" style={{ width: `${(i / 4) * 80}%` }} />
        {LINE.map((x, k) => {
          const on = k === i;
          return (
            <button
              key={x.n}
              ref={(el) => {
                refs.current[k] = el;
              }}
              role="tab"
              type="button"
              id={`isx-fam-${k}`}
              aria-selected={on}
              aria-controls="isx-fam-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => setI(k)}
              onKeyDown={(e) => {
                const to = ({ ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: LINE.length - 1 } as Record<string, number>)[e.key];
                if (to === undefined) return;
                e.preventDefault();
                go(to);
              }}
              className={`group relative flex rounded-[2px] text-left ${TRANS} active:bg-(--is-charcoal) ${FR} max-md:min-h-12 max-md:items-center max-md:gap-3 max-md:border-b max-md:border-(--is-line) max-md:pl-3 max-md:hover:bg-(--is-void) md:flex-col md:items-center md:gap-2 md:pb-1 md:pt-2 md:text-center`}
            >
              {on ? <span aria-hidden className="absolute inset-y-2 left-0 w-[2px] bg-(--is-frost) md:hidden" /> : null}
              <span className={`${MONO} w-6 shrink-0 text-[11px] tracking-[0.08em] md:w-auto ${on ? "text-(--is-frost)" : "text-(--is-steel) group-hover:text-(--is-frost)"}`}>O{k + 1}</span>
              <span
                aria-hidden
                className={`size-2.5 shrink-0 ${TRANS} ${k <= i ? "bg-(--is-frost)" : "border border-(--is-steel) bg-(--is-void) group-hover:border-(--is-frost)"} ${on ? "scale-125 outline outline-offset-2 outline-(--is-frost)/40" : ""} group-active:scale-90 max-md:hidden`}
              />
              <span className="flex min-w-0 flex-col max-md:flex-row max-md:items-baseline max-md:gap-2">
                <span className={`${MONO} text-[11px] uppercase tracking-[0.12em] ${on ? "text-(--is-frost)" : "text-(--is-steel) group-hover:text-(--is-frost)"}`}>{x.n}</span>
                <span className="text-[13px] leading-snug text-(--is-steel)">{x.g}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div id="isx-fam-panel" role="tabpanel" aria-labelledby={`isx-fam-${i}`} aria-live="polite" className="mt-auto grid items-end gap-4 border-t border-(--is-line) pt-5 md:grid-cols-12">
        <div className="md:col-span-3">
          <p className={`${LABEL} text-(--is-steel)`}>PR-AUC · M{m}</p>
          <p className={`${DOT} mt-1 text-[52px] font-semibold leading-[0.85] ${here ? "text-(--is-frost)" : "text-(--is-steel)"}`}>{here ? here.prAuc.toFixed(3) : "—"}</p>
          {here ? null : <p className={`${LABEL} mt-2 text-(--is-steel)`}>Mission 1 only</p>}
        </div>
        <div className="md:col-span-6">
          <p className={`${LABEL} text-(--is-steel)`}>
            O{i + 1} · {s.n} · {s.g}
          </p>
          <p className="mt-2 max-w-[52ch] text-[16px] leading-[1.45] text-(--is-frost)">{s.d}</p>
        </div>
        <div className="md:col-span-3 md:justify-self-end">
          {card ? (
            <Button bracket className="whitespace-nowrap" onClick={() => onOpen(card)}>
              Method card{here ? "" : " · M1"}
            </Button>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

/* ===================== M.02 · scored by PR-AUC ===================== */
export function ScorePanel({ m, pos }: { m: M; pos: number }) {
  const pct = pos * 100;
  return (
    <Panel id="method-score" code="M.02" title="Scored by PR-AUC" page={2} pageLabel="Evaluation" className="lg:col-span-4" caption="Anomalies are rare, so ROC-AUC is overly optimistic.">
      <div>
        <p className={`${LABEL} text-(--is-steel)`}>Labelled test steps · M{m}</p>
        <p className={`${DOT} mt-1 text-[52px] font-semibold leading-[0.85] text-(--is-frost)`}>{pct.toFixed(1)}%</p>
      </div>
      <div>
        <div className="relative h-2 overflow-hidden rounded-[1px] bg-(--is-line)" aria-hidden>
          <span className="isx-grow absolute inset-y-0 left-0 bg-(--is-fault)" style={{ width: `${pct}%` }} />
        </div>
        <p className={`${LABEL} mt-2 flex justify-between gap-3 text-(--is-steel)`}>
          <span>
            <span className="text-(--is-fault)">■</span> Labelled anomaly
          </span>
          <span>All test steps</span>
        </p>
      </div>
      <dl className={`${MONO} mt-auto flex flex-col text-[11px] uppercase tracking-[0.1em]`}>
        {[
          ["PR-AUC", "primary · precision–recall area", "text-(--is-frost)"],
          ["ROC-AUC", "secondary", "text-(--is-steel)"],
          ["Event F1", "baselines · per segment", "text-(--is-steel)"],
          ["Random PR-AUC", pos.toFixed(3), "text-(--is-steel)"],
        ].map(([k, v, tone]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 border-b border-(--is-line) py-2 last:border-b-0 last:pb-0">
            <dt className={tone}>{k}</dt>
            <dd className="text-right text-(--is-steel)">{v}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

/* ===================== C.01–C.04 · conclusions ===================== */
const NUM = `${DOT} text-[72px] font-semibold leading-[0.82] text-(--is-frost)`;
export function Takeaways({ m }: { m: M }) {
  const top = m === 1 ? { v: 0.384, who: "GMM" } : { v: 0.438, who: "TransformerVAE" };
  const X = (v: number) => (v / 0.5) * 100;
  return (
    <>
      <Panel
        id="conclusions-q1"
        code="C.01"
        title="Q1 · Structure"
        page={5}
        pageLabel="§7"
        className="lg:col-span-4"
        caption={
          <>
            Structure sits at the <span className="text-(--is-teal)">operational-group</span> level, not the <span className="text-(--is-steel)">subsystem</span> level (4–5).
          </>
        }
      >
        <p className={`${LABEL} text-(--is-steel)`}>Modes found · both missions</p>
        <p className={NUM} aria-label="18 to 29">
          18–29
        </p>
        <div className="mt-auto flex flex-col gap-3" aria-hidden>
          <div className="relative h-5">
            <div className="absolute inset-x-0 top-2 h-1.5 rounded-[1px] bg-(--is-line)" />
            <div className="isx-grow absolute top-2 h-1.5 bg-(--is-steel)" style={{ left: `${(4 / 30) * 100}%`, width: `${(1 / 30) * 100}%` }} />
            <div className="isx-grow absolute top-2 h-1.5 bg-(--is-teal)" style={{ left: `${(18 / 30) * 100}%`, width: `${(11 / 30) * 100}%` }} />
          </div>
          <p className={`${LABEL} flex justify-between gap-3`}>
            <span className="text-(--is-steel)">4–5 subsystems</span>
            <span className="text-(--is-teal)">18–29 modes</span>
          </p>
        </div>
      </Panel>
      <Panel id="conclusions-q2" code="C.02" title="Q2 · Detection" page={5} pageLabel="Table 1" className="lg:col-span-4" caption="GMM leads Mission 1 faults; VAEs lead Mission 2 rare events.">
        <p className={`${LABEL} text-(--is-steel)`}>
          Top PR-AUC · M{m} · {top.who}
        </p>
        <p className={NUM}>{top.v.toFixed(3)}</p>
        <div className="mt-auto flex flex-col gap-3">
          <div aria-hidden>
            <div className="relative h-5">
              <div className="absolute inset-x-0 top-2 h-1.5 rounded-[1px] bg-(--is-line)" />
              <div className="isx-grow absolute left-0 top-2 h-1.5 rounded-[1px] bg-(--is-frost)" style={{ width: `${X(top.v)}%` }} />
              <span className="absolute top-0 h-5 w-px bg-(--is-steel)" style={{ left: `${X(0.322)}%` }} />
            </div>
          </div>
          <p className={`${LABEL} text-(--is-steel)`}>┊ Linear plateau 0.322</p>
        </div>
      </Panel>
      <Panel
        id="conclusions-bottleneck"
        code="C.03"
        title="The bottleneck"
        page={7}
        pageLabel="Fig. 3"
        className="lg:col-span-4"
        caption="Each mode has its own normal; anomalies scatter across all modes."
      >
        <p className={`${LABEL} text-(--is-steel)`}>Longest test fault · M1</p>
        <p className={NUM} aria-label="967 hours">
          967<span className="text-[40px]"> h</span>
        </p>
        <p className={`${LABEL} mt-auto text-(--is-steel)`}>Global models: blind once it persists</p>
      </Panel>
      <Panel id="conclusions-next" code="C.04" title="Future work" page={5} pageLabel="§7" className="lg:col-span-12">
        <ul className="grid gap-5 md:grid-cols-3 md:gap-0">
          {[
            ["Temporal models", "LSTM-VAE and HMM, to capture per-mode dynamics."],
            ["Cross-mission", "Three shared subsystems test if the structure is fundamental."],
            ["Richer labels", "What each channel measures, its units and nominal range."],
          ].map(([k, v], i) => (
            <li key={k} className={`flex flex-col gap-2 ${i ? "border-t border-(--is-line) pt-5 md:border-l md:border-t-0 md:pl-5 md:pt-0" : ""} ${i < 2 ? "md:pr-5" : ""}`}>
              <p className={`${LABEL} text-(--is-steel)`}>
                0{i + 1} · {k}
              </p>
              <p className="max-w-[40ch] text-[16px] leading-[1.45] text-(--is-frost)">{v}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
