"use client";

// B · The Paper, Alive: the pieces that turn the paper's own structure into an annotated journal page.
// The hero satellite, margin notes (right margin on desktop, inline on phones), numbered subsections,
// interactive-figure frames, and three new figures: the two missions, the three VAEs, and the latent K map.
// Vermilion never appears here.
import { useState, type ReactNode } from "react";
import { Svg, useInView } from "../../design-systems/refined-paper/fig";
import { FOCUS, MONO, SANS, SERIF, caption } from "../../design-systems/refined-paper/kit";
import { Segmented } from "../../design-systems/refined-paper/ui";
import type { M } from "./figs";
import { PageRef } from "./reader";

/* ================================================================== the hero satellite
   A generic satellite (the dataset anonymises the missions), drawn in ink hairlines. It draws itself in once;
   reduced motion shows it finished. Two solar wings, a bus, a dish, and its orbit. */
export function Satellite() {
  const [ref, seen] = useInView<HTMLDivElement>(0.1);
  // A wing as a quadrilateral in slight perspective, with its cell grid.
  const wing = (x0: number, x1: number, key: string) => {
    const top = (x: number) => 186 + ((x - x0) / (x1 - x0)) * -20, bot = (x: number) => 224 + ((x - x0) / (x1 - x0)) * 20;
    const cols = 5;
    const xs = Array.from({ length: cols - 1 }, (_, i) => x0 + ((i + 1) / cols) * (x1 - x0));
    return (
      <g key={key}>
        <path d={`M${x0},${top(x0)} L${x1},${top(x1)} L${x1},${bot(x1)} L${x0},${bot(x0)} Z`} fill="var(--mount)" stroke="var(--ink)" strokeWidth="1.2" pathLength={1} className="rps-draw" style={{ transitionDelay: "200ms" }} />
        {xs.map((x, i) => <path key={i} d={`M${x},${top(x)} L${x},${bot(x)}`} stroke="var(--ink)" strokeWidth="0.6" pathLength={1} className="rps-draw" style={{ transitionDelay: `${500 + i * 70}ms` }} />)}
        <path d={`M${x0},205 L${x1},205`} stroke="var(--ink)" strokeWidth="0.6" pathLength={1} className="rps-draw" style={{ transitionDelay: "650ms" }} />
      </g>
    );
  };
  return (
    <div ref={ref} data-inview={seen} className="rps-sat">
      <Svg vw={480} vh={400} role="img" aria-label="An ink line drawing of a satellite: a box-shaped body with two solar panel wings, a dish antenna, and a dashed orbit around it.">
        {/* faint stars */}
        {[[48, 70], [400, 54], [436, 300], [86, 330], [312, 352], [160, 40]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.3" fill="var(--graphite)" />)}
        {/* orbit, behind */}
        <g transform="rotate(-14 240 210)">
          <ellipse cx="240" cy="210" rx="226" ry="64" fill="none" stroke="var(--rule-strong)" strokeWidth="0.9" strokeDasharray="3 5" />
        </g>
        {/* arms */}
        <path d="M175,205 H205 M275,205 H305" stroke="var(--ink)" strokeWidth="1.2" pathLength={1} className="rps-draw" style={{ transitionDelay: "120ms" }} />
        {wing(175, 52, "l")}
        {wing(305, 428, "r")}
        {/* bus */}
        <rect x="205" y="160" width="70" height="90" rx="2" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.3" pathLength={1} className="rps-draw" />
        <path d="M205,184 H275 M205,226 H275" stroke="var(--ink)" strokeWidth="0.6" pathLength={1} className="rps-draw" style={{ transitionDelay: "300ms" }} />
        {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${216 + i * 9},190 V220`} stroke="var(--ink)" strokeWidth="0.5" pathLength={1} className="rps-draw" style={{ transitionDelay: `${420 + i * 50}ms` }} />)}
        {/* thruster + whip antenna */}
        <path d="M228,250 l-5,13 h34 l-5,-13" fill="none" stroke="var(--ink)" strokeWidth="1" pathLength={1} className="rps-draw" style={{ transitionDelay: "500ms" }} />
        <path d="M268,250 L290,296" stroke="var(--ink)" strokeWidth="0.9" pathLength={1} className="rps-draw" style={{ transitionDelay: "650ms" }} />
        <circle cx="291" cy="298" r="2.4" fill="none" stroke="var(--ink)" strokeWidth="0.9" />
        {/* dish */}
        <path d="M240,160 V146" stroke="var(--ink)" strokeWidth="1.1" pathLength={1} className="rps-draw" style={{ transitionDelay: "350ms" }} />
        <path d="M208,124 Q240,166 272,124" fill="var(--mount)" stroke="var(--ink)" strokeWidth="1.2" pathLength={1} className="rps-draw" style={{ transitionDelay: "420ms" }} />
        <ellipse cx="240" cy="124" rx="32" ry="7" fill="none" stroke="var(--ink)" strokeWidth="0.9" pathLength={1} className="rps-draw" style={{ transitionDelay: "560ms" }} />
        <path d="M240,136 L240,104" stroke="var(--ink)" strokeWidth="0.8" pathLength={1} className="rps-draw" style={{ transitionDelay: "700ms" }} />
        <circle cx="240" cy="102" r="2.4" fill="var(--paper)" stroke="var(--ink)" strokeWidth="0.9" />
        {/* signal arcs, toward the ground */}
        {[0, 1, 2].map((i) => <path key={i} d={`M${226 - i * 10},${92 - i * 9} Q240,${80 - i * 12} ${254 + i * 10},${92 - i * 9}`} fill="none" stroke="var(--graphite)" strokeWidth="0.8" pathLength={1} className="rps-draw" style={{ transitionDelay: `${900 + i * 160}ms` }} />)}
      </Svg>
    </div>
  );
}

/* ================================================================== margin notes */
export type Note = { t: string; d: ReactNode };

/** A paragraph of the paper with its margin notes: right margin on lg+, inline (under the text) below. */
export function Para({ children, notes, className = "" }: { children: ReactNode; notes?: Note[]; className?: string }) {
  return (
    <div className={`grid gap-x-10 gap-y-3 lg:grid-cols-[minmax(0,1fr)_12.5rem] xl:grid-cols-[minmax(0,1fr)_14.5rem] ${className}`}>
      <div className={`${SERIF} max-w-[40rem] text-[17px] leading-[1.62] sm:text-[18.5px] sm:leading-[1.6] [&>p+p]:mt-4`}>{children}</div>
      {notes?.length ? (
        <aside aria-label="Margin notes" className="grid content-start gap-3 max-lg:border-l max-lg:border-[var(--rule-strong)] max-lg:pl-3.5 lg:gap-4 lg:pt-1.5">
          {notes.map((n) => (
            <p key={n.t} className={`${SANS} text-[13px] leading-[1.48] text-[var(--ink-soft)] lg:border-t lg:border-[var(--rule)] lg:pt-2 lg:text-[12.5px]`}>
              <span className="font-semibold text-[var(--ink)]">{n.t}</span> <span>{n.d}</span>
            </p>
          ))}
        </aside>
      ) : null}
    </div>
  );
}

/** A numbered subsection, like the paper's own bold run-in heads: "4.2 How many operating modes…". */
export function Sub({ id, n, title, children }: { id?: string; n: string; title: string; children: ReactNode }) {
  return (
    <section id={id} tabIndex={id ? -1 : undefined} aria-labelledby={id ? `${id}-h` : undefined} className="mt-16 outline-none first:mt-0 lg:mt-20">
      <h3 id={id ? `${id}-h` : undefined} className={`${SERIF} mb-5 flex items-baseline gap-3 text-[24px] leading-[1.2] font-[450] sm:text-[26px]`}>
        <span className={`${MONO} shrink-0 text-[13px] font-normal text-[var(--muted)]`}>{n}</span>
        <span>{title}</span>
      </h3>
      <div className="space-y-8">{children}</div>
    </section>
  );
}

/** An interactive figure, numbered by its section, with what it replaces in the paper. */
export function Fig({ id, n, title, from, cap, chip, children, className = "" }: { id?: string; n: string; title: string; from: ReactNode; cap: ReactNode; chip?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <figure id={id} tabIndex={id ? -1 : undefined} className={`min-w-0 border-t border-[var(--ink)] pt-3 outline-none ${className}`}>
      <p className={`${MONO} flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>
        <span><span className="text-[var(--ink)]">Figure {n}</span> · interactive</span>
        <span className="normal-case tracking-normal">{from}</span>
      </p>
      <h4 className={`${SERIF} mt-2 mb-5 text-[21px] leading-[1.25] font-[450]`}>{title}</h4>
      <div className="min-w-0">{children}</div>
      <figcaption className={`${caption} mt-4 flex flex-wrap items-baseline gap-x-1.5 text-[12.5px]`}>
        <span><span className="font-semibold text-[var(--ink)]">Figure {n}.</span> {cap}</span> {chip}
      </figcaption>
    </figure>
  );
}

/* ================================================================== §2.2 the two missions, side by side */
const MISSIONS: [string, string, string][] = [
  ["Sensor channels", "76", "100"],
  ["Training timesteps", "7.4M", "3.1M"],
  ["Reading rate", "0.033 Hz", "0.056 Hz"],
  ["Subsystems", "4", "5"],
  ["Operational groups", "18", "29"],
  ["What the labels mark", "Genuine system faults", "≈95% rare operational events"],
];
export function MissionTable({ m, setM }: { m: M; setM: (m: M) => void }) {
  const col = (k: M) => (k === m ? "bg-[var(--parchment)]" : "");
  return (
    <div>
      <table className={`${SANS} w-full border-collapse text-left text-[13.5px] leading-[1.4]`}>
        <caption className="sr-only">The two ESA missions used in the paper. Mission {m} is shown in every figure.</caption>
        <thead>
          <tr className="border-b border-[var(--ink)]">
            <th scope="col" className="w-[38%] py-2 pr-3 align-bottom text-[12px] font-normal text-[var(--muted)]">Choose the mission shown in every figure</th>
            {([1, 2] as const).map((k) => (
              <th key={k} scope="col" className={`${col(k)} px-1 py-1 align-bottom transition-colors duration-200`}>
                <button type="button" aria-pressed={k === m} onClick={() => setM(k)}
                  className={`${FOCUS} flex w-full min-h-10 flex-col items-start justify-center gap-0.5 py-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2 rounded-[2px] px-2 text-left text-[14px] font-semibold transition-colors duration-200 hover:bg-[var(--rule)] active:bg-[var(--rule-strong)]`}>
                  Mission {k}
                  <span className={`${MONO} text-[11px] font-normal ${k === m ? "text-[var(--ink)]" : "text-[var(--muted)]"}`}>{k === m ? "✓ shown" : "show"}</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MISSIONS.map(([a, b, c]) => (
            <tr key={a} className="border-b border-[var(--rule)]">
              <th scope="row" className="py-2.5 pr-3 font-normal text-[var(--muted)]">{a}</th>
              <td className={`${col(1)} px-3 py-2.5 transition-colors duration-200 ${/^[\d.]/.test(b) ? MONO : ""}`}>{b}</td>
              <td className={`${col(2)} px-3 py-2.5 transition-colors duration-200 ${/^[\d.]/.test(c) ? MONO : ""}`}>{c}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================================================================== §5 the three VAEs */
type Vae = { n: string; enc: string; z: string; loss: string; why: string; best: Record<M, { s: string; pr: number; k: number }> };
const VAES: Vae[] = [
  {
    n: "CapacityVAE", enc: "Conv1D ×3", z: "z",
    why: "Three Conv1D layers [64, 128, 256] with stride-2 down-sampling. Inputs are corrupted with Gaussian noise (σ = 0.1) while targets stay clean, for robustness to sensor noise.",
    loss: "Capacity control: the KL term is pushed toward a budget C(t) that rises from 0 to 50 nats over 40 epochs (γ = 10), so the code is neither collapsed nor exploded.",
    best: { 1: { s: "GMM-OOD", pr: 0.305, k: 5 }, 2: { s: "Neg. ELBO", pr: 0.414, k: 16 } },
  },
  {
    n: "HierarchicalVAE", enc: "Conv1D ×3", z: "z_g + z_l",
    why: "The same Conv1D extractor, but the latent space splits into a 16-dimensional global code z_g (what mode the spacecraft is in) and a 16-dimensional local code z_l (how this window deviates from it).",
    loss: "A β-VAE objective with KL warm-up: β rises from 0 to 1 over the first 20 epochs.",
    best: { 1: { s: "GMM-OOD", pr: 0.293, k: 2 }, 2: { s: "Recon. MSE", pr: 0.434, k: 28 } },
  },
  {
    n: "TransformerVAE", enc: "self-attention ×3", z: "z",
    why: "Each of the 32 timesteps becomes a 128-dimensional token; a [CLS] token is prepended, and three layers of self-attention (4 heads) let every timestep attend to every other across the 16-minute window.",
    loss: "The same capacity control, with C_max = 25 nats, γ = 50, and a 60-epoch warm-up (transformers take longer to converge).",
    best: { 1: { s: "GMM-OOD", pr: 0.335, k: 16 }, 2: { s: "Neg. ELBO", pr: 0.438, k: 18 } },
  },
];

const Box = ({ t, sub, hi = false, dashed = false, children }: { t: string; sub: string; hi?: boolean; dashed?: boolean; children?: ReactNode }) => (
  <div className={`flex min-h-[3.25rem] min-w-0 flex-1 sm:min-h-[4.25rem] flex-col items-center justify-center rounded-[2px] border px-2 py-2 text-center ${hi ? "border-[var(--ink)] bg-[var(--parchment)]" : dashed ? "border-dashed border-[var(--rule-strong)]" : "border-[var(--rule-strong)] bg-[var(--mount)]"}`}>
    {children}
    <span className={`${SANS} text-[13px] font-medium text-[var(--ink)]`}>{t}</span>
    <span className={`${MONO} mt-0.5 text-[11px] text-[var(--muted)]`}>{sub}</span>
  </div>
);
const Arrow = () => <span aria-hidden className={`${MONO} grid shrink-0 place-items-center text-[14px] text-[var(--ink)] max-sm:h-5 sm:w-6`}><span className="sm:hidden">↓</span><span className="max-sm:hidden">→</span></span>;

/** One diagram for all three: window → encoder → code → decoder → reconstruction; the encoder and code change.
    HTML boxes so the labels stay legible: a row from sm up, a column on phones. */
function VaeDiagram({ v }: { v: Vae }) {
  const trace = Array.from({ length: 32 }, (_, i) => `${i ? "L" : "M"}${2 + i * 3.1},${20 + Math.sin(i * 0.7) * 9 + Math.cos(i * 1.9) * 4}`).join("");
  return (
    <div role="img" aria-label={`${v.n}: a 32-step window goes into a ${v.enc} encoder, becomes ${v.z}, and a decoder rebuilds the window.`} className="flex flex-col items-stretch sm:flex-row sm:items-center">
      <Box t="Window" sub="W = 32 steps">
        <svg aria-hidden viewBox="0 0 100 40" className="mb-1 h-6 w-20"><path d={trace} fill="none" stroke="var(--ink)" strokeWidth="1.2" /></svg>
      </Box>
      <Arrow /><Box t="Encoder" sub={v.enc} hi />
      <Arrow /><Box t="Latent code" sub={v.z} hi />
      <Arrow /><Box t="Decoder" sub="mirrors the encoder" />
      <Arrow /><Box t="Rebuilt window" sub="x̂" dashed />
    </div>
  );
}

export function VaePicker({ m }: { m: M }) {
  const [i, setI] = useState(2);
  const v = VAES[i];
  const b = v.best[m];
  return (
    <div>
      <Segmented size="sm" label="Choose a VAE architecture: Capacity, Hierarchical or Transformer VAE" value={i} onChange={setI} options={VAES.map((x, k) => ({ value: k, label: x.n.replace("VAE", "") }))} />
      <div key={i} className="rpd-fade mt-6">
        <VaeDiagram v={v} />
        <div className="mt-6 grid gap-x-10 gap-y-5 md:grid-cols-[minmax(0,1fr)_14rem]">
          <dl className={`${SANS} grid gap-y-3 text-[14px] leading-[1.5]`}>
            <div><dt className="text-[12px] text-[var(--muted)]">Architecture</dt><dd className="text-[var(--ink-soft)]">{v.why}</dd></div>
            <div><dt className="text-[12px] text-[var(--muted)]">Loss</dt><dd className="text-[var(--ink-soft)]">{v.loss}</dd></div>
          </dl>
          <div className="border-t border-[var(--ink)] pt-2.5" aria-live="polite">
            <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>Mission {m} · Table 1</p>
            <p className={`${MONO} mt-1 text-[34px] leading-none`}>{b.pr.toFixed(3)}</p>
            <p className={`${SANS} mt-1.5 text-[12.5px] leading-[1.45] text-[var(--ink-soft)]`}>PR-AUC, best score: {b.s}. Latent K = {b.k}.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== §6.1 how many modes each method finds */
type KRow = { n: string; k: Record<M, number | [number, number] | null>; d: string; p: number; c: string };
const KROWS: KRow[] = [
  { n: "K-Means silhouette", k: { 1: 2, 2: null }, d: "Silhouette peaks at K = 2 in raw space: the four subsystems do not appear as four tight blobs.", p: 2, c: "§3" },
  { n: "PCA + t-SNE", k: { 1: [10, 15], 2: null }, d: "t-SNE reveals a fragmented archipelago of 10–15 operational modes, with anomalies on nearly every island.", p: 2, c: "§3" },
  { n: "GMM (BIC)", k: { 1: 21, 2: 29 }, d: "BIC selects K = 21 for M1 and 29 for M2, against 18 and 29 defined groups: near group-level granularity.", p: 5, c: "§6" },
  { n: "CapacityVAE", k: { 1: 5, 2: 16 }, d: "Latent clusters K-Means finds in the encoded windows, as printed in Table 1.", p: 5, c: "Table 1" },
  { n: "HierarchicalVAE", k: { 1: 2, 2: 28 }, d: "Latent clusters K-Means finds in the encoded windows, as printed in Table 1.", p: 5, c: "Table 1" },
  { n: "TransformerVAE", k: { 1: 16, 2: 18 }, d: "16 and 18 modes: between the subsystem and group counts, an intermediate operational granularity.", p: 11, c: "Fig. 7" },
];
export function LatentK({ m }: { m: M }) {
  const [sel, setSel] = useState(5);
  const sub = m === 1 ? 4 : 5, grp = m === 1 ? 18 : 29;
  const at = (k: number) => `${(k / 32) * 100}%`;
  const rows = KROWS.map((r, i) => ({ ...r, i })).filter((r) => r.k[m] != null);
  const cur = rows.find((r) => r.i === sel) ?? rows[rows.length - 1];
  const kText = (k: number | [number, number]) => (Array.isArray(k) ? `${k[0]}–${k[1]}` : String(k));
  return (
    <div>
      <div className="relative">
        {/* reference lines: the two levels of ESA's hierarchy */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 left-[9.5rem] sm:left-[11rem]">
          {[[sub, "var(--ochre)", `${sub} subsystems`], [grp, "var(--prussian)", `${grp} groups`]].map(([k, c, t]) => (
            <span key={t as string} className="absolute inset-y-0 w-0 border-l border-dashed" style={{ left: at(k as number), borderColor: c as string }}>
              <span className={`${MONO} absolute -top-6 text-[11px] whitespace-nowrap ${(k as number) > 24 ? "right-1" : "left-1"}`} style={{ color: c as string }}>{t as string}</span>
            </span>
          ))}
        </div>
        <ul className="relative mt-8 grid gap-1" aria-label={`Number of modes each method finds, Mission ${m}`}>
          {rows.map((r) => {
            const k = r.k[m]!;
            const on = r.i === cur.i;
            return (
              <li key={r.n}>
                <button type="button" aria-pressed={on} onClick={() => setSel(r.i)} aria-label={`${r.n}: K ${kText(k)}`}
                  className={`${FOCUS} group grid min-h-10 w-full grid-cols-[9.5rem_1fr] items-center rounded-[2px] text-left transition-colors duration-200 hover:bg-[var(--parchment)] active:bg-[var(--rule)] aria-pressed:bg-[var(--parchment)] sm:grid-cols-[11rem_1fr]`}>
                  <span className={`${SANS} truncate px-2 text-[13px] ${on ? "font-semibold text-[var(--ink)]" : "text-[var(--ink-soft)]"}`}>{r.n}</span>
                  <span className="relative block h-6">
                    <span className="absolute inset-x-0 top-1/2 h-px bg-[var(--rule)]" />
                    {Array.isArray(k) ? (
                      <span className="absolute top-1/2 h-[9px] -translate-y-1/2 rounded-[2px] border-[1.5px] border-[var(--ink)] bg-[var(--paper)]" style={{ left: at(k[0]), width: `calc(${at(k[1])} - ${at(k[0])})` }} />
                    ) : (
                      <span className={`absolute top-1/2 size-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-[var(--ink)] transition-colors duration-200 ${on ? "bg-[var(--ink)]" : "bg-[var(--paper)]"}`} style={{ left: at(k) }} />
                    )}
                    <span className={`${MONO} absolute top-1/2 -translate-y-1/2 pl-2.5 text-[11.5px] text-[var(--ink)]`} style={{ left: Array.isArray(k) ? at(k[1]) : at(k) }}>{kText(k)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div aria-hidden className="mt-2 ml-[9.5rem] flex justify-between border-t border-[var(--ink)] pt-1 sm:ml-[11rem]">
          {[0, 10, 20, 30].map((v) => <span key={v} className={`${MONO} text-[11px] text-[var(--muted)]`}>{v}</span>)}
        </div>
        <p className={`${MONO} mt-0.5 text-right text-[11px] text-[var(--muted)]`}>modes found (K)</p>
      </div>
      <p key={`${cur.i}-${m}`} className={`${SANS} rpd-fade mt-4 min-h-[3rem] text-[14px] leading-[1.5] text-[var(--ink-soft)]`} aria-live="polite">
        <span className="font-semibold text-[var(--ink)]">{cur.n}.</span> {cur.d} <PageRef p={cur.p}>{cur.c}</PageRef>
      </p>
      {m === 2 && <p className={`${SANS} text-[12.5px] text-[var(--muted)]`}>The baselines were run on Mission 1 only.</p>}
    </div>
  );
}
