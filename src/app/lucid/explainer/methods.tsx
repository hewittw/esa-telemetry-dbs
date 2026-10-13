"use client";

// 03 · Table 1 as an explorer: the global mission, family filter chips, sort, a dot plot on one shared
// PR-AUC axis (each row against its mission's positive rate), provenance per row, and a detail panel.
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useInView } from "../../design-systems/refined-paper/fig";
import type { MethodRow } from "../../design-systems/refined-paper/data";
import { FOCUS, IconCheck, IconDash, IconWarn, MONO, SANS, SERIF, btnSecondary, caption, chip, chipCheck } from "../../design-systems/refined-paper/kit";
import { FAMILY, Trend } from "../../design-systems/refined-paper/demos";
import { Segmented } from "../../design-systems/refined-paper/ui";
import type { M } from "./figs";
import { PageRef } from "./reader";

const POS = { 1: 0.111, 2: 0.0468 } as const;
const MAX = 0.5;
const SECTION_PAGE = { baseline: [2, "§3"], parametric: [3, "§4"], generative: [4, "§5"] } as const;
// Nyström-KPCA is described on p. 3; K-Means and PCA on p. 2.
const pageOf = (r: MethodRow) => (r.method.startsWith("Nystroem") ? ([3, "§3"] as const) : SECTION_PAGE[r.family]);

const HOW: Record<string, string> = {
  "K-Means": "MiniBatch K-Means with K swept 2–10; silhouette picks K = 2 (0.388). The score is distance to the nearest centroid.",
  "PCA Recon": "PCA keeping d = 33 components, 95% of the variance. The score is reconstruction error.",
  "PCA + K-Means": "K-Means in the 33-dimensional PCA space. The score is centroid distance.",
  "Nystroem-KPCA Dist": "An RBF kernel map from 300 Nyström components (γ = 0.1/n), scored by centroid distance: a marginal, fragile gain.",
  "Nystroem-KPCA Feat-Recon": "The same kernel map scored by reconstruction error in feature space, which collapses to 0.164.",
  GMM: "A full-covariance Gaussian mixture on PCA-30, K chosen by BIC on an 800K-row sample. The score is negative log-likelihood.",
  CapacityVAE: "A Conv1D encoder [64, 128, 256] on 32-step windows of nominal telemetry, with denoising and a capacity-controlled KL term.",
  HierarchicalVAE: "Separate global and local latent codes (16 + 16 dimensions), β warmed up to 1 over 20 epochs.",
  TransformerVAE: "Three transformer layers, four heads, 33 tokens of 128 dimensions; capacity-controlled KL with γ = 50.",
};

export type Prov = { s: "verified" | "near" | "recomputed" | "unsaved"; note: string };
const PROV = {
  verified: { Icon: IconCheck, color: "var(--sage)", word: "Verified" },
  near: { Icon: IconWarn, color: "var(--ochre)", word: "Near" },
  recomputed: { Icon: IconWarn, color: "var(--ochre)", word: "Mixed" },
  unsaved: { Icon: IconDash, color: "var(--muted)", word: "Not saved" },
} as const;
function ProvTag({ p }: { p: Prov }) {
  const v = PROV[p.s];
  return (
    <span className={`${SANS} inline-flex items-center gap-1 text-[12px] font-medium whitespace-nowrap text-[var(--ink-soft)]`}>
      <span style={{ color: v.color }}><v.Icon size={10} className="shrink-0" /></span>{v.word}
    </span>
  );
}

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

function Dot({ row, on }: { row: MethodRow; on: boolean }) {
  const p = POS[row.mission];
  const at = (v: number) => `${(v / MAX) * 100}%`;
  return (
    <span className="relative block h-5" aria-hidden>
      <span className="absolute inset-x-0 top-1/2 h-px bg-[var(--rule)]" />
      <span className="rps-dot absolute top-1/2 h-[1.5px] -translate-y-1/2 bg-[var(--ink)]" style={{ left: at(p), width: on ? `calc(${at(row.prAuc)} - ${at(p)})` : 0 }} />
      <span className="absolute top-[3px] h-[14px] w-px bg-[var(--graphite)]" style={{ left: at(p) }} />
      <span className="rps-dot absolute top-1/2 size-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-[var(--ink)] bg-[var(--ink)]" style={{ left: on ? at(row.prAuc) : at(p) }} />
    </span>
  );
}

function Detail({ r, rows, prov }: { r: MethodRow; rows: MethodRow[]; prov: Prov }) {
  const peers = rows.filter((x) => x.mission === r.mission).sort((a, b) => b.prAuc - a.prAuc);
  const rank = peers.findIndex((x) => x.id === r.id) + 1;
  const k = r.latentK != null ? `${r.family === "generative" ? "latent " : ""}K = ${r.latentK}` : r.d != null ? `d = ${r.d}` : null;
  const [pg, sec] = pageOf(r);
  return (
    <div key={r.id} className="rpd-fade">
      <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>{FAMILY[r.family].name} · Mission {r.mission}{k ? ` · ${k}` : ""}</p>
      <h4 className={`${SERIF} mt-1 text-[22px] leading-[1.2] font-[450]`}>{r.method.replace("Nystroem", "Nyström")}</h4>
      <p className={`${SANS} mt-2 text-[13.5px] leading-[1.5] text-[var(--ink-soft)]`}>{HOW[r.method]}</p>
      <dl className="mt-5 grid grid-cols-3 border-t border-[var(--ink)]">
        {([["PR-AUC", r.prAuc.toFixed(3)], ["ROC-AUC", r.rocAuc.toFixed(3)], ["Event F1", r.eventF1?.toFixed(3) ?? "—"]] as const).map(([a, b], i) => (
          <div key={a} className={`pt-2.5 ${i ? "border-l border-[var(--rule)] pl-3" : ""}`}>
            <dt className={caption}>{a}</dt>
            <dd className={`${MONO} text-[22px] leading-tight`}>{b}</dd>
          </div>
        ))}
      </dl>
      <p className={`${SANS} mt-3 text-[13px] leading-[1.5] text-[var(--ink-soft)]`}>
        {(r.prAuc / POS[r.mission]).toFixed(1)}× random ({(POS[r.mission] * 100).toFixed(1)}% positives) · rank {rank} of {peers.length}
      </p>
      <dl className={`${SANS} mt-4 grid grid-cols-[7.5rem_1fr] gap-y-2 border-t border-[var(--rule)] pt-3 text-[13px]`}>
        <dt className="text-[var(--muted)]">Scoring</dt><dd>{r.scoring}</dd>
        <dt className="text-[var(--muted)]">Trend</dt><dd><Trend row={r} long /></dd>
        <dt className="text-[var(--muted)]">Provenance</dt><dd><ProvTag p={prov} /><span className="block text-[12px] leading-[1.4] text-[var(--muted)]">{prov.note}</span></dd>
        <dt className="text-[var(--muted)]">In the paper</dt><dd className="-ml-1 flex flex-wrap gap-x-1"><PageRef p={5}>Table 1</PageRef><PageRef p={pg}>{sec}</PageRef></dd>
      </dl>
    </div>
  );
}

export function MethodExplorer({ rows, prov, m }: { rows: MethodRow[]; prov: Record<string, Prov>; m: M }) {
  const fams = ["baseline", "parametric", "generative"] as const;
  const [on, setOn] = useState<Record<string, boolean>>({ baseline: true, parametric: true, generative: true });
  const [sort, setSort] = useState<Sort>("paper");
  const [sel, setSel] = useState<Record<M, string>>({ 1: rows.find((r) => r.method === "GMM" && r.mission === 1)!.id, 2: rows.find((r) => r.method === "TransformerVAE" && r.mission === 2)!.id });
  const list = useMemo(() => {
    const l = rows.filter((r) => on[r.family] && r.mission === m);
    return sort === "paper" ? l : [...l].sort((a, b) => b[sort] - a[sort]);
  }, [rows, on, m, sort]);
  const active = list.find((r) => r.id === sel[m]) ?? list[0];
  const box = useFlip(list.map((r) => r.id).join());
  const [ref, seen] = useInView<HTMLDivElement>(0.2);
  const top = (r: MethodRow) => r.prAuc === Math.max(...rows.filter((x) => x.mission === r.mission).map((x) => x.prAuc));
  const count = (f: string) => rows.filter((r) => r.family === f && r.mission === m).length;
  const pick = (id: string) => setSel((s) => ({ ...s, [m]: id }));

  return (
    <div ref={ref}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by method family">
          {fams.map((f) => (
            <button key={f} type="button" aria-pressed={!!on[f] && count(f) > 0} disabled={count(f) === 0} onClick={() => setOn((o) => ({ ...o, [f]: !o[f] }))} className={chip}>
              <IconCheck size={11} className={chipCheck} />
              {FAMILY[f].name}
              <span className={`${MONO} text-[11px] text-[var(--muted)]`}>{count(f)}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className={`${SANS} text-[13px] text-[var(--muted)]`} aria-hidden>Order</span>
          <Segmented size="sm" label="Order rows by" value={sort} onChange={setSort} options={[{ value: "paper", label: "Table 1" }, { value: "prAuc", label: "PR-AUC" }, { value: "rocAuc", label: "ROC-AUC" }]} />
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="min-w-0 lg:col-span-8">
          <div className="grid grid-cols-[minmax(0,1fr)_3.4rem] gap-x-4 border-b border-[var(--ink)] pb-1.5 sm:grid-cols-[12rem_minmax(0,1fr)_3.4rem_6.5rem]">
            <span className={`${SANS} hidden text-[12px] text-[var(--muted)] sm:block`}>Method</span>
            <span className="relative block h-4" aria-hidden>
              {[0, 0.1, 0.2, 0.3, 0.4].map((t) => (
                <span key={t} className={`${MONO} absolute text-[11px] text-[var(--muted)] ${t === 0 ? "" : "-translate-x-1/2"}`} style={{ left: `${(t / MAX) * 100}%` }}>{t === 0 ? "0" : t.toFixed(1)}</span>
              ))}
            </span>
            <span className={`${SANS} text-right text-[12px] text-[var(--muted)]`}>PR-AUC</span>
            <span className={`${SANS} hidden text-[12px] text-[var(--muted)] sm:block`}>Provenance</span>
          </div>
          {list.length === 0 ? (
            <div className="border border-t-0 border-dashed border-[var(--rule-strong)] px-5 py-8 text-center">
              <p className={`${SERIF} text-[19px]`}>No methods match.</p>
              <p className={`${SANS} mt-1 text-[13px] text-[var(--muted)]`}>Every family is filtered out for Mission {m}.</p>
              <button type="button" className={`${btnSecondary} mt-4`} onClick={() => setOn({ baseline: true, parametric: true, generative: true })}>Show every family</button>
            </div>
          ) : (
            <ul ref={box} aria-label={`Table 1 rows, Mission ${m}`} className="relative">
              {list.map((r) => {
                const isSel = active?.id === r.id;
                return (
                  <li key={r.id} data-k={r.id} className="border-b border-[var(--rule)]">
                    <button type="button" aria-pressed={isSel} aria-controls="rps-detail" onClick={() => pick(r.id)}
                      className={`${FOCUS} grid w-full grid-cols-[minmax(0,1fr)_3.4rem] items-center gap-x-4 gap-y-1.5 rounded-[2px] px-2 py-2.5 text-left transition-colors duration-200 hover:bg-[var(--parchment)]/70 active:bg-[var(--parchment)] aria-pressed:bg-[var(--parchment)] aria-pressed:shadow-[inset_2px_0_0_var(--ink)] sm:-mx-2 sm:w-[calc(100%+1rem)] sm:grid-cols-[12rem_minmax(0,1fr)_3.4rem_6.5rem]`}>
                      <span className="col-span-2 min-w-0 sm:col-span-1">
                        <span className={`${SANS} block truncate text-[14px] font-medium text-[var(--ink)]`}>{r.method.replace("Nystroem", "Nyström")}</span>
                        <span className={`${SANS} block truncate text-[12px] text-[var(--muted)]`}>{r.label.match(/(lat\. )?K = \d+|d = \d+/)?.[0]?.replace("lat.", "latent") ?? FAMILY[r.family].name} · {r.scoring}<span className="sm:hidden"> · {PROV[prov[r.label].s].word}</span></span>
                      </span>
                      <Dot row={r} on={seen} />
                      <span className={`${MONO} text-right text-[14px] text-[var(--ink)] ${r.trendDirection === "best" ? "font-semibold" : ""}`}>
                        {top(r) && <><svg aria-hidden width="8" height="8" viewBox="0 0 9 9" className="mr-1 inline-block align-[0.05em]"><path d="M4.5.6 8.4 4.5 4.5 8.4.6 4.5z" fill="var(--ink)" /></svg><span className="sr-only">Highest on Mission {r.mission}: </span></>}
                        {r.prAuc.toFixed(3)}
                      </span>
                      <span className="hidden sm:block"><ProvTag p={prov[r.label]} /></span>
                    </button>
                    {isSel && <div className="border-t border-[var(--rule)] bg-[var(--mount)] px-4 py-5 lg:hidden"><Detail r={r} rows={rows} prov={prov[r.label]} /></div>}
                  </li>
                );
              })}
            </ul>
          )}
          <p className={`${caption} mt-3 flex flex-wrap items-baseline gap-x-1.5`}>
            <span>Grey tick: random. <svg aria-hidden width="8" height="8" viewBox="0 0 9 9" className="inline-block"><path d="M4.5.6 8.4 4.5 4.5 8.4.6 4.5z" fill="var(--ink)" /></svg> highest; <b className="font-semibold text-[var(--ink)]">bold</b>: best VAE.</span>
            <PageRef p={5}>Table 1</PageRef>
          </p>
        </div>
        <aside id="rps-detail" aria-label="Method detail" aria-live="polite" className="hidden rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] lg:col-span-4 lg:block">
          <div className="sticky top-[76px] p-6">
            {active ? <Detail r={active} rows={rows} prov={prov[active.label]} /> : <p className={`${SANS} text-[13px] text-[var(--muted)]`}>Choose a method to see its detail.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
