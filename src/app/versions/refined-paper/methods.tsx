"use client";

// §3 The method explorer: mission switch, family filter chips, sort, a dot plot on one shared PR-AUC
// axis (every row measured against its mission's positive rate), and a detail panel for one method.
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { MethodRow } from "../../design-systems/refined-paper/data";
import { FOCUS, IconCheck, IconDash, IconWarn, MONO, SANS, SERIF, btnSecondary, caption, chip, chipCheck } from "../../design-systems/refined-paper/kit";
import { FAMILY, Trend } from "../../design-systems/refined-paper/demos";
import { Segmented } from "../../design-systems/refined-paper/ui";
import { PageRef } from "./reader";

const POS = { 1: 0.111, 2: 0.0468 } as const;
const MAX = 0.5;
const SECTION_PAGE = { baseline: [3, "§3"], parametric: [3, "§4"], generative: [4, "§5"] } as const;

const HOW: Record<string, string> = {
  "K-Means": "MiniBatch K-Means with K swept 2–10; silhouette picks K = 2 (0.388). The score is distance to the nearest centroid.",
  "PCA Recon": "PCA keeping d = 33 components, 95% of the variance. The score is reconstruction error.",
  "PCA + K-Means": "K-Means in the 33-dimensional PCA space. The score is centroid distance.",
  "Nystroem-KPCA Dist": "An RBF kernel map from 300 Nyström components (γ = 0.1/n), then K-Means. Centroid distance edges past the plateau.",
  "Nystroem-KPCA Feat-Recon": "The same kernel map scored by reconstruction error in feature space, which collapses to 0.164.",
  GMM: "A full-covariance Gaussian mixture on PCA-30, K chosen by BIC on an 800K-row sample. The score is negative log-likelihood.",
  CapacityVAE: "A Conv1D encoder [64, 128, 256] on 32-step windows of nominal telemetry, with denoising and a capacity-controlled KL term.",
  HierarchicalVAE: "Separate global and local latent codes (16 + 16 dimensions), β warmed up to 1 over 20 epochs.",
  TransformerVAE: "Three transformer layers, four heads, 33 tokens of 128 dimensions; capacity-controlled KL with γ = 50.",
};

const VERIFY = {
  exact: { Icon: IconCheck, color: "var(--sage)", word: "Verified against the notebook" },
  near: { Icon: IconWarn, color: "var(--ochre)", word: "Near: the notebook gives 0.3037" },
  mixed: { Icon: IconWarn, color: "var(--ochre)", word: "Mixed: K and metrics from two runs" },
  "not found": { Icon: IconDash, color: "var(--muted)", word: "Run not saved in the repo" },
} as const;

type Sort = "paper" | "prAuc" | "rocAuc";

/** FLIP: rows glide to their new place when the order changes. */
function useFlip(keys: string) {
  const box = useRef<HTMLUListElement>(null);
  const last = useRef<Map<string, number>>(new Map());
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = new Map<string, number>();
    el.querySelectorAll<HTMLElement>("[data-k]").forEach((li) => {
      const k = li.dataset.k!, top = li.offsetTop;
      next.set(k, top);
      const was = last.current.get(k);
      if (!reduce && was != null && was !== top) {
        li.animate([{ transform: `translateY(${was - top}px)` }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.22,.61,.36,1)" });
      } else if (!reduce && was == null && last.current.size) {
        li.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease-out" });
      }
    });
    last.current = next;
  }, [keys]);
  return box;
}

function Dot({ row }: { row: MethodRow }) {
  const p = POS[row.mission];
  const at = (v: number) => `${(v / MAX) * 100}%`;
  return (
    <span className="relative block h-5" aria-hidden>
      <span className="absolute inset-x-0 top-1/2 h-px bg-[var(--rule)]" />
      <span className="absolute top-1/2 h-[1.5px] -translate-y-1/2 bg-[var(--prussian)] transition-[left,width] duration-500" style={{ left: at(p), width: `calc(${at(row.prAuc)} - ${at(p)})` }} />
      <span className="absolute top-[3px] h-[14px] w-px bg-[var(--graphite)]" style={{ left: at(p) }} />
      <span className="absolute top-1/2 size-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-[var(--prussian)] bg-[var(--prussian)] transition-[left] duration-500" style={{ left: at(row.prAuc) }} />
    </span>
  );
}

function Detail({ r, rows }: { r: MethodRow; rows: MethodRow[] }) {
  const peers = rows.filter((x) => x.mission === r.mission).sort((a, b) => b.prAuc - a.prAuc);
  const rank = peers.findIndex((x) => x.id === r.id) + 1;
  const v = VERIFY[r.verify];
  const k = r.latentK != null ? `${r.family === "generative" ? "latent " : ""}K = ${r.latentK}` : r.d != null ? `d = ${r.d}` : null;
  const [pg, sec] = SECTION_PAGE[r.family];
  return (
    <div key={r.id} className="rpd-fade">
      <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>{FAMILY[r.family].name} · Mission {r.mission}{k ? ` · ${k}` : ""}</p>
      <h3 className={`${SERIF} mt-1 text-[28px] leading-[1.1] font-[450]`}>{r.method.replace("Nystroem", "Nyström")}</h3>
      <p className={`${SERIF} mt-3 text-[16.5px] leading-[1.55]`}>{HOW[r.method]}</p>
      <dl className="mt-5 grid grid-cols-3 border-t border-[var(--ink)]">
        {([["PR-AUC", r.prAuc.toFixed(3)], ["ROC-AUC", r.rocAuc.toFixed(3)], ["Event F1", r.eventF1?.toFixed(3) ?? "—"]] as const).map(([a, b], i) => (
          <div key={a} className={`pt-2.5 ${i ? "border-l border-[var(--rule)] pl-3" : ""}`}>
            <dt className={caption}>{a}</dt>
            <dd className={`${MONO} text-[22px] leading-tight`}>{b}</dd>
          </div>
        ))}
      </dl>
      <p className={`${SANS} mt-3 text-[13px] leading-[1.5] text-[var(--ink-soft)]`}>
        {(r.prAuc / POS[r.mission]).toFixed(1)}× the {(POS[r.mission] * 100).toFixed(1)}% positive rate · rank {rank} of {peers.length} on Mission {r.mission}
        {r.eventF1 == null && <> · event F1 was scored for the baselines only</>}
      </p>
      <dl className={`${SANS} mt-4 grid grid-cols-[7.5rem_1fr] gap-y-2 border-t border-[var(--rule)] pt-3 text-[13px]`}>
        <dt className="text-[var(--muted)]">Scoring</dt><dd>{r.scoring}</dd>
        <dt className="text-[var(--muted)]">Trend</dt><dd><Trend row={r} long /></dd>
        <dt className="text-[var(--muted)]">Provenance</dt><dd className="inline-flex items-start gap-1.5 font-medium" style={{ color: v.color }}><v.Icon size={11} className="mt-[3px] shrink-0" />{v.word}</dd>
        <dt className="text-[var(--muted)]">In the paper</dt><dd className="-ml-1 flex flex-wrap gap-x-1"><PageRef p={5}>Table 1</PageRef><PageRef p={pg}>{sec}</PageRef></dd>
      </dl>
    </div>
  );
}

export function MethodExplorer({ rows }: { rows: MethodRow[] }) {
  const fams = ["baseline", "parametric", "generative"] as const;
  const [m, setM] = useState<0 | 1 | 2>(1);
  const [on, setOn] = useState<Record<string, boolean>>({ baseline: true, parametric: true, generative: true });
  const [sort, setSort] = useState<Sort>("paper");
  const [sel, setSel] = useState(rows.find((r) => r.method === "GMM" && r.mission === 1)!.id);
  const list = useMemo(() => {
    const l = rows.filter((r) => on[r.family] && (m === 0 || r.mission === m));
    return sort === "paper" ? l : [...l].sort((a, b) => b[sort] - a[sort]);
  }, [rows, on, m, sort]);
  const active = list.find((r) => r.id === sel) ?? list[0];
  const box = useFlip(list.map((r) => r.id).join());
  const top = (r: MethodRow) => r.prAuc === Math.max(...rows.filter((x) => x.mission === r.mission).map((x) => x.prAuc));
  const count = (f: string) => rows.filter((r) => r.family === f && (m === 0 || r.mission === m)).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Segmented label="Mission" value={m} onChange={setM} options={[{ value: 1, label: "Mission 1" }, { value: 2, label: "Mission 2" }, { value: 0, label: "Both" }]} />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by method family">
          {fams.map((f) => (
            <button key={f} type="button" aria-pressed={!!on[f]} disabled={count(f) === 0} onClick={() => setOn((o) => ({ ...o, [f]: !o[f] }))} className={chip}>
              <IconCheck size={11} className={chipCheck} />
              {FAMILY[f].name}
              <span className={`${MONO} text-[11px] text-[var(--muted)]`}>{count(f)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className={`${SANS} text-[13px] text-[var(--muted)]`} aria-hidden>Order</span>
        <Segmented size="sm" label="Order rows by" value={sort} onChange={setSort} options={[{ value: "paper", label: "As in Table 1" }, { value: "prAuc", label: "PR-AUC" }, { value: "rocAuc", label: "ROC-AUC" }]} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-10">
        <div className="min-w-0">
          {/* shared axis */}
          <div className="grid grid-cols-[minmax(0,1fr)_3.6rem] gap-x-4 border-b border-[var(--ink)] pb-1.5 sm:grid-cols-[11.5rem_minmax(0,1fr)_3.6rem]">
            <span className={`${SANS} hidden text-[12px] text-[var(--muted)] sm:block`}>Method</span>
            <span className="relative block h-4" aria-hidden>
              {[0, 0.1, 0.2, 0.3, 0.4].map((t) => (
                <span key={t} className={`${MONO} absolute text-[11px] text-[var(--muted)] ${t === 0 ? "" : "-translate-x-1/2"}`} style={{ left: `${(t / MAX) * 100}%` }}>{t === 0 ? "0" : t.toFixed(1)}</span>
              ))}
            </span>
            <span className={`${SANS} text-right text-[12px] text-[var(--muted)]`}>PR-AUC</span>
          </div>
          {list.length === 0 ? (
            <div className="rounded-b-[3px] border border-t-0 border-dashed border-[var(--rule-strong)] px-5 py-8 text-center">
              <p className={`${SERIF} text-[19px]`}>No methods match.</p>
              <p className={`${SANS} mt-1 text-[13px] text-[var(--muted)]`}>Every family is filtered out for this mission. Turn one back on to see its Table 1 rows.</p>
              <button type="button" className={`${btnSecondary} mt-4`} onClick={() => setOn({ baseline: true, parametric: true, generative: true })}>Show every family</button>
            </div>
          ) : (
            <ul ref={box} aria-label="Table 1 rows" className="relative">
              {list.map((r) => {
                const isSel = active?.id === r.id;
                return (
                  <li key={r.id} data-k={r.id} className="border-b border-[var(--rule)]">
                    <button type="button" aria-pressed={isSel} aria-controls="rps-detail" onClick={() => setSel(r.id)}
                      className={`${FOCUS} grid w-full grid-cols-[minmax(0,1fr)_3.6rem] items-center gap-x-4 gap-y-1.5 rounded-[2px] px-2 py-3 text-left transition-colors duration-200 hover:bg-[var(--parchment)]/70 active:bg-[var(--parchment)] aria-pressed:bg-[var(--parchment)] aria-pressed:shadow-[inset_2px_0_0_var(--ink)] sm:grid-cols-[11.5rem_minmax(0,1fr)_3.6rem] sm:-mx-2 sm:w-[calc(100%+1rem)]`}>
                      <span className="col-span-2 min-w-0 sm:col-span-1">
                        <span className={`${SANS} block truncate text-[14px] font-medium text-[var(--ink)]`}>{r.method.replace("Nystroem", "Nyström")}{m === 0 && <span className={`${MONO} ml-1.5 text-[11px] font-normal text-[var(--muted)]`}>M{r.mission}</span>}</span>
                        <span className={`${SANS} block truncate text-[12px] text-[var(--muted)]`}>{r.label.match(/(lat\. )?K = \d+|d = \d+/)?.[0]?.replace("lat.", "latent") ?? FAMILY[r.family].name} · {r.scoring}</span>
                      </span>
                      <Dot row={r} />
                      <span className={`${MONO} text-right text-[14px] text-[var(--ink)] ${r.trendDirection === "best" ? "font-semibold" : ""}`}>
                        {top(r) && <><svg aria-hidden width="8" height="8" viewBox="0 0 9 9" className="mr-1 inline-block align-[0.05em]"><path d="M4.5.6 8.4 4.5 4.5 8.4.6 4.5z" fill="var(--ink)" /></svg><span className="sr-only">Highest on Mission {r.mission}: </span></>}
                        {r.prAuc.toFixed(3)}
                      </span>
                    </button>
                    {isSel && <div className="border-t border-[var(--rule)] bg-[var(--mount)] px-4 py-5 lg:hidden"><Detail r={r} rows={rows} /></div>}
                  </li>
                );
              })}
            </ul>
          )}
          <p className={`${caption} mt-3 max-w-[62ch]`}>
            Dots: PR-AUC on the test set. The grey tick is each mission’s positive rate ({(POS[1] * 100).toFixed(1)}% and {(POS[2] * 100).toFixed(1)}%), what a random detector scores; the blue line is the lift above it.{" "}
            <svg aria-hidden width="8" height="8" viewBox="0 0 9 9" className="inline-block"><path d="M4.5.6 8.4 4.5 4.5 8.4.6 4.5z" fill="var(--ink)" /></svg> Highest PR-AUC per mission. <b className="font-semibold text-[var(--ink)]">Bold</b>: the best VAE per mission, as Table 1 bolds it. GMM and the VAEs use different fitting protocols from the baselines’ 80/20 split.
          </p>
        </div>
        <aside id="rps-detail" aria-label="Method detail" aria-live="polite" className="hidden self-start rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] p-6 lg:sticky lg:top-10 lg:block">
          {active ? <Detail r={active} rows={rows} /> : <p className={`${SANS} text-[13px] text-[var(--muted)]`}>Choose a method to see its detail.</p>}
        </aside>
      </div>
    </div>
  );
}
