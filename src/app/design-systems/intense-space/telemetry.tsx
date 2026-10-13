"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Bic, Curve, Curves, Events, Missions, Row, Timelines } from "./data";
import { MethodDetail } from "./standard";
import { Button, Check, Chip, DOT, FR, LABEL, MONO, Modal, Panel, Range, Segmented, Select, Status, TRANS, useToast } from "./ui";

type M = 1 | 2;
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const short = (m: string) => m.replace("TransformerVAE", "TVAE").replace("HierarchicalVAE", "HVAE").replace("CapacityVAE", "CapVAE").replace("Nystroem-KPCA", "KPCA");
const MS: { v: M; t: string }[] = [
  { v: 1, t: "Mission 1" },
  { v: 2, t: "Mission 2" },
];

/* a chart frame: SVG for marks (non-scaling strokes), HTML for every label so text never drops under 10px */
function Frame({ children, labels, className = "aspect-[16/10]", onPoint, foot }: { children: React.ReactNode; labels?: React.ReactNode; className?: string; onPoint?: (fx: number, fy: number) => void; foot?: [React.ReactNode, React.ReactNode] }) {
  const ref = useRef<HTMLDivElement>(null);
  const down = useRef(false);
  const fire = (e: React.PointerEvent) => {
    if (!onPoint) return;
    const r = ref.current!.getBoundingClientRect();
    onPoint(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
  };
  return (
    <div>
    <div className={`relative ${className}`}>
      <div
        ref={ref}
        className={`is-regdots absolute inset-0 rounded-[2px] border border-(--is-line) bg-(--is-void) ${onPoint ? "cursor-crosshair touch-pan-y" : ""}`}
        onPointerDown={(e) => ((down.current = true), fire(e))}
        onPointerMove={(e) => down.current && fire(e)}
        onPointerUp={() => (down.current = false)}
        onPointerLeave={() => (down.current = false)}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
          {children}
        </svg>
      </div>
      {labels}
    </div>
      {foot ? (
        <div className={`${MONO} mt-1.5 flex justify-between gap-3 text-[10px] uppercase tracking-[0.1em] text-(--is-steel)`}>
          <span>{foot[0]}</span>
          <span className="text-right">{foot[1]}</span>
        </div>
      ) : null}
    </div>
  );
}
const at = (x: number, y: number, cls: string, txt: React.ReactNode, align: "l" | "r" | "c" = "l") => (
  <span
    className={`${MONO} pointer-events-none absolute whitespace-nowrap text-[10px] uppercase tracking-[0.1em] ${cls}`}
    style={{ left: `${x}%`, top: `${y}%`, transform: `translate(${align === "l" ? "0" : align === "r" ? "-100%" : "-50%"}, -50%)` }}
  >
    {txt}
  </span>
);

/* where a curve's number comes from: Table 1 is the source of truth; a saved-score curve that doesn't reproduce it says so */
const prov = (c: Curve) =>
  c.match === "exact" ? `AP ${c.prAuc.toFixed(3)} · matches Table 1` : c.t1Pr !== null ? `AP ${c.prAuc.toFixed(3)} recomputed from saved scores · Table 1: ${c.t1Pr.toFixed(3)}` : `AP ${c.prAuc.toFixed(3)} · saved run, not in Table 1`;

/* ===================== T1 · threshold → precision / recall ===================== */
export function TThreshold({ curves }: { curves: Curves }) {
  const [m, setM] = useState<M>(2);
  const runs = curves.list.filter((c) => c.mission === m && c.table1);
  const [id, setId] = useState(runs[0].id);
  const run = runs.find((r) => r.id === id) ?? runs[0];
  const [rec, setRec] = useState(30);
  const pt = useMemo(() => run.points.reduce((b, p) => (Math.abs(p[0] - rec / 100) < Math.abs(b[0] - rec / 100) ? p : b), run.points[0]), [run, rec]);
  const P = curves.nTest[m] * curves.pos[m];
  const tp = pt[0] * P;
  const flagged = tp / Math.max(pt[1], 1e-6);
  const fp = flagged - tp;
  const f1 = (2 * pt[0] * pt[1]) / (pt[0] + pt[1] || 1);
  const hz = m === 1 ? 0.033 : 0.056;
  const days = curves.nTest[m] / hz / 86400;
  const bestF1 = () => {
    const b = run.points.reduce((a, p) => ((2 * p[0] * p[1]) / (p[0] + p[1] || 1) > (2 * a[0] * a[1]) / (a[0] + a[1] || 1) ? p : a));
    setRec(Math.max(1, Math.round(b[0] * 100)));
  };
  const X = (r: number) => r * 100;
  const Y = (p: number) => (1 - p) * 100;
  return (
    <Panel
      id="t-threshold"
      code="T.01"
      title="Alarm threshold"
      className="md:col-span-2 lg:col-span-8"
      spec={{
        use: "Pick an operating point on a real PR curve; precision, recall, F1 and the alarm load recompute from the test-set counts.",
        tokens: "Frost curve · Teal cursor + crosshair · Doto for P and R · counts from nTest × positive rate",
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Mission"
          value={m}
          onChange={(v) => {
            setM(v);
            setId(curves.list.find((c) => c.mission === v && c.table1)!.id);
          }}
          options={MS}
        />
        <div className="min-w-[220px] flex-1 sm:max-w-[320px]">
          <Select id="isd-t1-run" value={run.id} onChange={setId} options={runs.map((r) => ({ v: r.id, t: `${short(r.method)} · ${r.scoring}` }))} />
        </div>
        <p className={`${MONO} text-[10px] uppercase tracking-[0.1em] ${run.match === "exact" ? "text-(--is-steel)" : "text-(--is-frost)"}`} aria-live="polite">
          <span aria-hidden>{run.match === "exact" ? "✓ " : "△ "}</span>
          {prov(run)}
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-[1.25fr_1fr]">
        <Frame
          onPoint={(fx) => setRec(Math.max(1, Math.min(99, Math.round(fx * 100))))}
          foot={["↑ Precision 0–1", "Recall 0–1 →"]}
          labels={
            <>
              {at(Math.min(X(pt[0]) + 2, 70), Math.max(Y(pt[1]) - 7, 12), "text-(--is-teal)", `P ${pt[1].toFixed(2)} · R ${pt[0].toFixed(2)}`)}
            </>
          }
        >
          <polyline points={run.points.map(([r, p]) => `${X(r)},${Y(p)}`).join(" ")} fill="none" stroke="#CFD9E0" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
          <line x1="0" x2="100" y1={Y(curves.pos[m])} y2={Y(curves.pos[m])} stroke="#8C979F" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
          <line x1={X(pt[0])} x2={X(pt[0])} y1="0" y2="100" stroke="#4BCFE0" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
          <line x1="0" x2="100" y1={Y(pt[1])} y2={Y(pt[1])} stroke="#4BCFE0" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
        </Frame>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={`${LABEL} text-(--is-steel)`}>Precision</p>
              <p className={`${DOT} text-[44px] font-semibold leading-[0.9] text-(--is-frost)`}>{pt[1].toFixed(2)}</p>
            </div>
            <div>
              <p className={`${LABEL} text-(--is-steel)`}>Recall</p>
              <p className={`${DOT} text-[44px] font-semibold leading-[0.9] text-(--is-frost)`}>{pt[0].toFixed(2)}</p>
            </div>
          </div>
          <dl className={`${MONO} grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 border-t border-(--is-line) pt-3 text-[11px] uppercase tracking-[0.08em]`}>
            <dt className="text-(--is-steel)">Faults caught</dt>
            <dd className="text-right text-(--is-frost)">{fmt(tp)}</dd>
            <dt className="text-(--is-steel)">False alarms</dt>
            <dd className="text-right text-(--is-frost)">{fmt(fp)}</dd>
            <dt className="text-(--is-steel)">Faults missed</dt>
            <dd className="text-right text-(--is-frost)">{fmt(P - tp)}</dd>
            <dt className="text-(--is-steel)">Flagged / day</dt>
            <dd className="text-right text-(--is-frost)">{fmt(flagged / days)}</dd>
            <dt className="text-(--is-steel)">F1</dt>
            <dd className="text-right text-(--is-frost)">{f1.toFixed(3)}</dd>
          </dl>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="isd-t1-rec" className={`${LABEL} text-(--is-steel)`}>
            Target recall · {rec}%
          </label>
          <Button variant="ghost" onClick={bestF1}>
            Snap to best F1
          </Button>
        </div>
        <Range id="isd-t1-rec" min={1} max={99} value={rec} onChange={setRec} label="Target recall" valueText={`Recall ${rec}%, precision ${pt[1].toFixed(2)}`} />
        <p className="text-[13px] text-(--is-steel)">Dashed Steel line: a random detector (precision = positive rate, {curves.pos[m].toFixed(3)}).</p>
      </div>
    </Panel>
  );
}

/* ===================== T2 · mission switcher ===================== */
export function TMission({ missions }: { missions: Missions }) {
  const [m, setM] = useState<M>(1);
  const d = missions[m];
  const days = d.test / d.hz / 86400;
  return (
    <Panel id="t-mission" code="T.02" title="Mission switcher" className="lg:col-span-4" spec={{ use: "Swap the whole context between the two ESA missions; every stat on the page follows.", tokens: "Segmented, full width · Doto for the best score · Mono stat grid" }}>
      <div className="[&>div]:flex [&>div]:w-full [&_button]:flex-1">
        <Segmented label="Mission" value={m} onChange={setM} options={MS} />
      </div>
      <div key={m} className="isd-dialog flex flex-col gap-4">
        <div>
          <p className={`${LABEL} text-(--is-steel)`}>Best PR-AUC · {d.best.method === "GMM" ? "GMM" : "TVAE"}</p>
          <p className={`${DOT} text-[56px] font-semibold leading-[0.9] text-(--is-frost)`}>{d.best.prAuc.toFixed(3)}</p>
        </div>
        <dl className={`${MONO} grid grid-cols-2 gap-px overflow-hidden rounded-[2px] border border-(--is-line) bg-(--is-line) text-[11px] uppercase tracking-[0.08em]`}>
          {[
            ["Channels", d.channels],
            ["Test steps", `${(d.test / 1e6).toFixed(2)}M`],
            ["Sample rate", `${d.hz} Hz`],
            ["Test span", `≈ ${(days / 365).toFixed(1)} yr`],
            ["Fault rate", `${(d.anomalyRate * 100).toFixed(1)}%`],
            ["Events", d.events],
            ["Subsys → groups", `${d.subsystems} → ${d.groups}`],
            ["GMM K*", d.k],
          ].map(([k, v]) => (
            <div key={k as string} className="bg-(--is-panel) px-3 py-2">
              <dt className="text-[10px] text-(--is-steel)">{k}</dt>
              <dd className="text-(--is-frost)">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[13px] leading-snug text-(--is-steel)">Labels: {d.labels}.</p>
      </div>
      <div key={`mix-${m}`} className="mt-auto border-t border-(--is-line) pt-4">
        <p className={`${LABEL} mb-2 flex justify-between gap-3 text-(--is-steel)`}>
          <span>Label mix · {d.events} events</span>
          <span>anomaly_types.csv</span>
        </p>
        <div className="flex h-2 gap-px overflow-hidden rounded-[1px]" aria-hidden>
          {Object.entries(d.mix).map(([k, v]) => (
            <span key={k} className={`${TRANS} ${k === "Anomaly" ? "bg-(--is-fault)" : k === "Rare Event" ? "bg-(--is-frost)" : "bg-(--is-steel)"}`} style={{ flexGrow: v }} />
          ))}
        </div>
        <ul className={`${MONO} mt-2 flex flex-col gap-1 text-[11px] uppercase tracking-[0.08em]`}>
          {Object.entries(d.mix).map(([k, v]) => (
            <li key={k} className="flex justify-between gap-3">
              <span className={k === "Anomaly" ? "text-(--is-fault)" : k === "Rare Event" ? "text-(--is-frost)" : "text-(--is-steel)"}>
                <span aria-hidden>{k === "Anomaly" ? "■ " : k === "Rare Event" ? "□ " : "○ "}</span>
                {k}
              </span>
              <span className="text-(--is-frost)">
                {v} <span className="text-(--is-steel)">· {((v / d.events) * 100).toFixed(0)}%</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

/* ===================== T3 · method spec card ===================== */
export function TMethod({ rows }: { rows: Row[] }) {
  const [i, setI] = useState(rows.findIndex((r) => r.method === "GMM" && r.mission === 1));
  const r = rows[i];
  const random = r.mission === 1 ? 0.111 : 0.047;
  const peers = rows.filter((x) => x.mission === r.mission).sort((a, b) => b.prAuc - a.prAuc);
  const dir = r.trendDirection;
  const trend = dir === "best" ? { k: "best" as const, w: `Best ${r.family === "generative" ? "VAE " : ""}M${r.mission}` } : dir === "up" ? { g: "↑", w: r.trend } : dir === "down" ? { g: "↓", w: r.trend } : { g: "–", w: r.trend };
  return (
    <Panel id="t-method" code="T.03" title="Method spec card" className="lg:col-span-5" spec={{ use: "One Table 1 row as a spec sheet: family, K, scoring, both AUCs, trend, and where PR-AUC sits between random and the linear plateau.", tokens: "Doto PR-AUC · scale bar 0–0.5 with Steel random tick, Frost plateau tick · trend = arrow + word" }}>
      <div className="flex items-center gap-2">
        <Button variant="ghost" aria-label="Previous method" onClick={() => setI((i - 1 + rows.length) % rows.length)}>
          ←
        </Button>
        <div className="min-w-0 flex-1">
          <Select id="isd-t3" value={String(i)} onChange={(v) => setI(+v)} options={rows.map((x, k) => ({ v: String(k), t: x.label }))} />
        </div>
        <Button variant="ghost" aria-label="Next method" onClick={() => setI((i + 1) % rows.length)}>
          →
        </Button>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`${LABEL} text-(--is-steel)`}>
            [ M{r.mission} · {r.family} · {r.latentK ? `K = ${r.latentK}` : "no K"} ]
          </p>
          <p className="mt-1 text-[24px] font-semibold leading-[1.05] tracking-[-0.02em] text-(--is-frost)">{r.method}</p>
          <p className="text-[13px] text-(--is-steel)">{r.scoring}</p>
        </div>
        {"k" in trend ? (
          <Status kind="best">{trend.w}</Status>
        ) : (
          <span className={`${MONO} shrink-0 text-[11px] uppercase tracking-[0.12em] text-(--is-frost)`}>
            <span aria-hidden>{trend.g} </span>
            {trend.w}
          </span>
        )}
      </div>
      <div className="grid grid-cols-[auto_auto_1fr] gap-5">
        {[
          ["PR-AUC", r.prAuc.toFixed(3)],
          ["ROC-AUC", r.rocAuc.toFixed(3)],
          ["Event F1", r.eventF1 === null ? "—" : r.eventF1.toFixed(3)],
        ].map(([k, v], j) => (
          <div key={k}>
            <p className={`${LABEL} text-(--is-steel)`}>{k}</p>
            <p className={`${DOT} ${j === 0 ? "text-[32px] sm:text-[38px]" : "text-[22px] sm:text-[26px]"} font-semibold leading-[1] text-(--is-frost)`}>{v}</p>
          </div>
        ))}
      </div>
      <div>
        <div className="relative h-8">
          <div className="absolute inset-x-0 top-3 h-1.5 rounded-[1px] bg-(--is-line)" />
          <div className="absolute left-0 top-3 h-1.5 rounded-[1px] bg-(--is-frost) transition-[width] duration-300 ease-(--is-ease)" style={{ width: `${(r.prAuc / 0.5) * 100}%` }} />
          <span className="absolute top-1 h-5 w-px bg-(--is-steel)" style={{ left: `${(random / 0.5) * 100}%` }} />
          <span className="absolute top-1 h-5 w-px bg-(--is-frost)" style={{ left: `${(0.322 / 0.5) * 100}%` }} />
        </div>
        <div className={`${MONO} relative h-4 text-[10px] uppercase tracking-[0.08em]`}>
          <span className="absolute -translate-x-1/2 text-(--is-steel)" style={{ left: `${(random / 0.5) * 100}%` }}>
            Random {random}
          </span>
          <span className="absolute -translate-x-1/2 text-(--is-frost)" style={{ left: `${(0.322 / 0.5) * 100}%` }}>
            Plateau .322
          </span>
        </div>
      </div>
      <div className="mt-auto border-t border-(--is-line) pt-3">
        <p className={`${LABEL} mb-2 text-(--is-steel)`}>
          Rank on Mission {r.mission} · {peers.findIndex((x) => x.label === r.label) + 1} of {peers.length}
        </p>
        <ol className="flex flex-col gap-1">
          {peers.map((x) => (
            <li key={x.label}>
              <button
                type="button"
                onClick={() => setI(rows.indexOf(x))}
                aria-current={x.label === r.label ? "true" : undefined}
                className={`${MONO} ${TRANS} grid min-h-7 w-full grid-cols-[6.5rem_1fr_3rem] items-center gap-3 rounded-[2px] text-left text-[11px] uppercase tracking-[0.06em] text-(--is-steel) hover:text-(--is-frost) active:opacity-70 aria-[current]:text-(--is-frost) ${FR}`}
              >
                <span className="truncate">{short(x.method)}</span>
                <span className="relative h-1 bg-(--is-line)">
                  <span className={`absolute inset-y-0 left-0 ${x.label === r.label ? "bg-(--is-frost)" : "bg-(--is-steel)/60"}`} style={{ width: `${(x.prAuc / 0.5) * 100}%` }} />
                </span>
                <span className="text-right">{x.prAuc.toFixed(3)}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </Panel>
  );
}

/* ===================== T4 · PR-curve viewer ===================== */
export function TPr({ curves }: { curves: Curves }) {
  const [m, setM] = useState<M>(2);
  const runs = curves.list.filter((c) => c.mission === m && c.table1);
  const [on, setOn] = useState<string[]>(curves.list.filter((c) => c.table1).map((c) => c.id));
  const [ctx, setCtx] = useState(true);
  const [hi, setHi] = useState<string | null>(null);
  const aoi = { r0: 0.15, r1: 0.5, p: 0.6 };
  const X = (r: number) => r * 100;
  const Y = (p: number) => (1 - p) * 100;
  const inAoi = (c: (typeof runs)[number]) => c.points.some(([r, p]) => r >= aoi.r0 && r <= aoi.r1 && p >= aoi.p);
  const shown = runs.filter((r) => on.includes(r.id));
  const focus = hi ?? [...shown].sort((a, b) => b.prAuc - a.prAuc)[0]?.id;
  return (
    <Panel id="t-pr" code="T.04" title="PR-curve viewer" className="md:col-span-2 lg:col-span-7" spec={{ use: "Compare saved runs; hover or focus a chip to lift its curve. The teal box is a Planet-style AOI: does a run hold precision ≥ 0.6 anywhere between recall 0.15 and 0.5?", tokens: "Highlighted run Teal 2px · others Frost 1px · context runs Frost 15% · AOI Teal 1px" }}>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Mission" value={m} onChange={setM} options={MS} />
        <Check checked={ctx} onChange={setCtx} label="Context: all saved runs" />
      </div>
      <div className="flex flex-wrap gap-2" onMouseLeave={() => setHi(null)}>
        {runs.map((r) => (
          <span key={r.id} onMouseEnter={() => setHi(r.id)} onFocus={() => setHi(r.id)} onBlur={() => setHi(null)}>
            <Chip on={on.includes(r.id)} onClick={() => setOn((s) => (s.includes(r.id) ? s.filter((x) => x !== r.id) : [...s, r.id]))}>
              {short(r.method)}
            </Chip>
          </span>
        ))}
      </div>
      <Frame
        className="aspect-[4/3] sm:aspect-[16/9]"
        foot={["↑ Precision 0–1", "Recall 0–1 →"]}
        labels={<>{at(X(aoi.r1) + 1, Y(aoi.p) - 4, "text-(--is-teal)", "[ AOI ]")}</>}
      >
        {ctx
          ? curves.list
              .filter((c) => c.mission === m && !c.table1)
              .map((c) => <polyline key={c.id} points={c.points.map(([r, p]) => `${X(r)},${Y(p)}`).join(" ")} fill="none" stroke="#CFD9E0" strokeOpacity="0.15" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />)
          : null}
        <rect x={X(aoi.r0)} y={Y(1)} width={X(aoi.r1) - X(aoi.r0)} height={Y(aoi.p) - Y(1)} fill="#4BCFE0" fillOpacity="0.05" stroke="#4BCFE0" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {shown
          .filter((c) => c.id !== focus)
          .map((c) => (
            <polyline key={c.id} points={c.points.map(([r, p]) => `${X(r)},${Y(p)}`).join(" ")} fill="none" stroke="#CFD9E0" strokeOpacity="0.75" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
        {shown
          .filter((c) => c.id === focus)
          .map((c) => (
            <polyline key={c.id} points={c.points.map(([r, p]) => `${X(r)},${Y(p)}`).join(" ")} fill="none" stroke="#4BCFE0" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          ))}
      </Frame>
      <ul className={`${MONO} flex flex-col gap-1.5 text-[11px] uppercase tracking-[0.08em]`} aria-live="polite">
        {shown.length ? (
          shown.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 border-b border-(--is-line) pb-1.5 last:border-b-0">
              <span className={`min-w-0 flex-1 sm:flex-none ${r.id === focus ? "text-(--is-teal)" : "text-(--is-frost)"}`}>
                <span aria-hidden>{r.id === focus ? "━ " : "─ "}</span>
                {short(r.method)} · {r.scoring}
              </span>
              <span className="order-3 w-full text-[10px] text-(--is-steel) sm:order-none sm:ml-auto sm:w-auto sm:text-right">{prov(r)}</span>
              <span className={`shrink-0 ${inAoi(r) ? "text-(--is-teal)" : "text-(--is-steel)"}`}>{inAoi(r) ? "◆ In AOI" : "○ Below AOI"}</span>
            </li>
          ))
        ) : (
          <li className="normal-case tracking-[0.02em] text-(--is-steel)">No runs selected. Turn a chip on to draw its curve.</li>
        )}
      </ul>
    </Panel>
  );
}

/* ===================== T5 · mission timeline scrubber ===================== */
export function TTimeline({ tl }: { tl: Timelines }) {
  const [m, setM] = useState<M>(1);
  const [sid, setSid] = useState(tl[1].series[1].id);
  const series = tl[m].series.find((s) => s.id === sid) ?? tl[m].series[0];
  const n = series.bins.length;
  const [i, setI] = useState(Math.round(n * 0.35));
  const [play, setPlay] = useState(false);
  useEffect(() => {
    if (!play) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % n), 60);
    return () => clearInterval(t);
  }, [play, n]);
  const b = series.bins[Math.min(i, n - 1)];
  const hz = m === 1 ? 0.033 : 0.056;
  const day = b.i / hz / 86400;
  const fault = b.a > 0.05;
  const nextFault = () => {
    for (let k = 1; k <= n; k++) {
      const j = (i + k) % n;
      if (series.bins[j].a > 0.05 && !(series.bins[(j - 1 + n) % n].a > 0.05)) return setI(j);
    }
  };
  const X = (k: number) => (k / (n - 1)) * 100;
  return (
    <Panel id="t-timeline" code="T.05" title="Mission timeline scrubber" className="md:col-span-2 lg:col-span-12" spec={{ use: "Scrub the whole test set (NASA's Eyes time scrubber): the trace is the anomaly score, magenta bands are labelled faults. Play / pause, jump to the next fault, or drag.", tokens: "240 bins · Frost trace 1.2px · Magenta bands at fault share · Teal playhead · ←/→ step one bin" }}>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Mission"
          value={m}
          onChange={(v) => {
            setM(v);
            setSid(tl[v].series[v === 1 ? 1 : 2].id);
          }}
          options={MS}
        />
        <div className="w-[220px]">
          <Select id="isd-t5-s" value={series.id} onChange={setSid} options={tl[m].series.map((s) => ({ v: s.id, t: s.method }))} />
        </div>
        <div className="ml-auto flex gap-2">
          <Button bracket aria-pressed={play} onClick={() => setPlay((p) => !p)}>
            {play ? "❚❚ Pause" : "▶ Play"}
          </Button>
          <Button variant="ghost" onClick={nextFault}>
            Next fault →
          </Button>
        </div>
      </div>
      <Frame
        className="aspect-[2/1] sm:aspect-[5/1]"
        onPoint={(fx) => (setPlay(false), setI(Math.round(fx * (n - 1))))}
        foot={["↑ Score (log, rank-scaled)", `Test timestep 0 – ${(tl[m].nTest / 1e6).toFixed(2)}M →`]}
      >
        {series.bins.map((x, k) => (x.a > 0.05 ? <rect key={k} x={X(k) - 0.21} width="0.42" y="0" height="100" fill="#E04FD6" fillOpacity={0.2 + x.a * 0.55} /> : null))}
        <polyline points={series.bins.map((x, k) => `${X(k)},${92 - x.s * 80}`).join(" ")} fill="none" stroke="#CFD9E0" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        <line x1={X(i)} x2={X(i)} y1="0" y2="100" stroke="#4BCFE0" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </Frame>
      <Range min={0} max={n - 1} value={i} onChange={(v) => (setPlay(false), setI(v))} label="Timeline position" valueText={`Timestep ${fmt(b.i)}, day ${Math.round(day)}, ${fault ? "inside a labelled fault" : "nominal"}`} />
      <dl className={`${MONO} grid grid-cols-2 gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.08em] sm:grid-cols-4`} aria-live="polite">
        <div>
          <dt className="text-[10px] text-(--is-steel)">Timestep</dt>
          <dd className="text-(--is-frost)">{fmt(b.i)}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-(--is-steel)">Day of test</dt>
          <dd className="text-(--is-frost)">{fmt(day)}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-(--is-steel)">Median score</dt>
          <dd className="text-(--is-frost)">{b.raw.toLocaleString("en-US")}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-(--is-steel)">Label</dt>
          <dd>{fault ? <Status kind="fault">Fault {Math.round(b.a * 100)}%</Status> : <Status kind="nominal" />}</dd>
        </div>
      </dl>
      <p className="text-[13px] text-(--is-steel)">
        {tl[m].nSegments} labelled fault segments on Mission {m}. Absolute dates were not exported, so time is shown as days from the start of the test split.
      </p>
    </Panel>
  );
}

/* ===================== T6 · BIC-vs-K picker ===================== */
export function TBic({ bic }: { bic: Bic }) {
  const [m, setM] = useState<M>(1);
  const d = bic[m];
  const [k, setK] = useState(d.selectedK);
  const lo = Math.min(...d.points.map((p) => p.bic));
  const hi = Math.max(...d.points.map((p) => p.bic));
  const p = d.points.find((x) => x.k === k)!;
  const X = (kk: number) => ((kk - 2) / 28) * 100;
  const Yn = (v: number) => 92 - ((v - lo) / (hi - lo)) * 80; // the minimum sits at the bottom of the valley
  const delta = p.bic - d.points.find((x) => x.k === d.selectedK)!.bic;
  const zone = k <= d.subsystems + 0.5 ? "subsystem" : k >= 18 && k <= 29 ? "group" : "between";
  return (
    <Panel id="t-bic" code="T.06" title="BIC-vs-K picker" className="md:col-span-2 lg:col-span-7" spec={{ use: "Move K and read the model-selection cost. The minimum sits at the operational-group scale, not the subsystem scale.", tokens: "Frost trace · Steel band = subsystems 4–5 · Teal band = groups 18–29 · Doto K · ΔBIC in millions" }}>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Mission"
          value={m}
          onChange={(v) => {
            setM(v);
            setK(bic[v].selectedK);
          }}
          options={MS}
        />
        <Button variant="ghost" onClick={() => setK(d.selectedK)} disabled={k === d.selectedK}>
          Jump to K* = {d.selectedK}
        </Button>
      </div>
      <Frame
        className="aspect-[16/9]"
        onPoint={(fx) => setK(Math.round(2 + fx * 28))}
        foot={["↑ BIC (lower = better)", "K = 2 – 30 →"]}
        labels={
          <>
            {at(X(m === 1 ? 4 : 5) + 1.5, 7, "text-(--is-steel)", `Subsystems ${m === 1 ? "4" : "5"}`)}
            {at(X(18) + 1.5, 7, "text-(--is-teal)", "Groups 18–29")}
          </>
        }
      >
        <rect x={X(m === 1 ? 4 : 5) - 1} width="2" y="0" height="100" fill="#8C979F" fillOpacity="0.18" />
        <rect x={X(18)} width={X(29) - X(18)} y="0" height="100" fill="#4BCFE0" fillOpacity="0.06" stroke="#4BCFE0" strokeOpacity="0.5" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <polyline points={d.points.map((q) => `${X(q.k)},${Yn(q.bic)}`).join(" ")} fill="none" stroke="#CFD9E0" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
        <line x1={X(k)} x2={X(k)} y1="0" y2="100" stroke="#CFD9E0" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
      </Frame>
      <Range min={2} max={30} value={k} onChange={setK} label="Number of GMM components K" valueText={`K = ${k}, BIC ${(p.bic / 1e6).toFixed(2)} million`} />
      <div className="grid grid-cols-3 items-end gap-3" aria-live="polite">
        <div>
          <p className={`${LABEL} text-(--is-steel)`}>K</p>
          <p className={`${DOT} text-[44px] font-semibold leading-[0.85] text-(--is-frost)`}>{String(k).padStart(2, "0")}</p>
        </div>
        <div>
          <p className={`${LABEL} text-(--is-steel)`}>BIC</p>
          <p className={`${MONO} text-[15px] text-(--is-frost)`}>{(p.bic / 1e6).toFixed(3)}M</p>
        </div>
        <div>
          <p className={`${LABEL} text-(--is-steel)`}>vs K*</p>
          {k === d.selectedK ? <Status kind="best">Minimum</Status> : <p className={`${MONO} text-[15px] text-(--is-frost)`}>+{(delta / 1e6).toFixed(3)}M</p>}
        </div>
      </div>
      <p className="text-[13px] text-(--is-steel)">
        {zone === "subsystem"
          ? `K = ${k} is at or below the subsystem scale (${d.subsystems}): BIC is ${(delta / 1e6).toFixed(2)}M worse than K* = ${d.selectedK}.`
          : zone === "group"
            ? "Inside the operational-group band, where BIC bottoms out."
            : "Between scales: BIC keeps falling toward the group band."}
      </p>
    </Panel>
  );
}

/* ===================== T7 · anomaly catalogue ===================== */
export function TEvents({ ev }: { ev: Events }) {
  const [m, setM] = useState<M>(1);
  const d = ev[m];
  const cats = Object.entries(d.byCategory).sort((a, b) => b[1] - a[1]);
  const [cat, setCat] = useState("Anomaly");
  const c = d.byCategory[cat] !== undefined ? cat : cats[0][0];
  const dur = d.duration[c];
  const glyph = (k: string) => (k === "Anomaly" ? "■" : k === "Rare Event" ? "□" : "○");
  const fill = (k: string) => (k === "Anomaly" ? "bg-(--is-fault)" : k === "Rare Event" ? "bg-(--is-frost)" : "bg-(--is-steel)");
  return (
    <Panel id="t-events" code="T.07" title="Anomaly event catalogue" className="md:col-span-2 lg:col-span-5" spec={{ use: "The labelled events per mission by category; pick one for its duration profile. Shows why M2 labels are mostly rare events, not faults.", tokens: "Stacked bar: ■ Magenta anomaly · □ Frost rare event · ○ Steel comms gap · durations in hours" }}>
      <Segmented
        label="Mission"
        value={m}
        onChange={(v) => {
          setM(v);
          setCat("Anomaly");
        }}
        options={MS}
      />
      <div>
        <div className="flex h-3 gap-px overflow-hidden rounded-[1px]" aria-hidden>
          {cats.map(([k, v]) => (
            <span key={k} className={`${fill(k)} ${TRANS} ${k === c ? "opacity-100" : "opacity-45"}`} style={{ flexGrow: v }} />
          ))}
        </div>
        <p className={`${LABEL} mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-(--is-steel)`}>
          <span className="text-(--is-frost)">{d.n} labelled events · Mission {m}</span>
          <span>Source: ESA-ADB anomaly_types.csv</span>
        </p>
      </div>
      <div role="radiogroup" aria-label="Event category" className="flex flex-col">
        {cats.map(([k, v]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={k === c}
            onClick={() => setCat(k)}
            className={`group grid min-h-11 grid-cols-[1.25rem_1fr_auto] items-center gap-2 rounded-[2px] border-b border-(--is-line) px-1 text-left ${TRANS} hover:bg-(--is-void) active:bg-(--is-charcoal) aria-checked:bg-(--is-void) aria-checked:shadow-[inset_2px_0_0_var(--is-frost)] ${FR} focus-visible:outline-offset-0`}
          >
            <span aria-hidden className={`${MONO} text-[12px] ${k === "Anomaly" ? "text-(--is-fault)" : k === "Rare Event" ? "text-(--is-frost)" : "text-(--is-steel)"}`}>
              {glyph(k)}
            </span>
            <span className="text-[14px] text-(--is-frost)">{k}</span>
            <span className={`${MONO} text-[13px] text-(--is-frost)`}>{v}</span>
          </button>
        ))}
      </div>
      {dur ? (
        <dl className={`${MONO} grid grid-cols-3 gap-3 text-[11px] uppercase tracking-[0.08em]`} aria-live="polite">
          {[
            ["Median", dur.p50],
            ["P75", dur.p75],
            ["Longest", dur.max],
          ].map(([k, v]) => (
            <div key={k as string}>
              <dt className="text-[10px] text-(--is-steel)">{k} duration</dt>
              <dd className={`${DOT} text-[26px] font-semibold normal-case leading-[1.1] text-(--is-frost)`}>
                {v}
                <span className={`${MONO} ml-1 text-[11px] text-(--is-steel)`}>h</span>
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="mt-auto flex flex-col gap-3 border-t border-(--is-line) pt-4">
        {[
          ["Dimensionality", d.byDimensionality, ["Multivariate", "Univariate"]],
          ["Locality", d.byLocality, ["Global", "Local"]],
        ].map(([t, o, keys]) => {
          const obj = o as Record<string, number>;
          const [a, b] = keys as string[];
          const tot = (obj[a] ?? 0) + (obj[b] ?? 0);
          return (
            <div key={t as string}>
              <p className={`${MONO} mb-1 text-[10px] uppercase tracking-[0.14em] text-(--is-steel)`}>{t as string}</p>
              <div className={`${MONO} mb-1.5 flex justify-between text-[10px] uppercase tracking-[0.1em] text-(--is-steel)`}>
                <span className="text-(--is-frost)">
                  {a} {obj[a]}
                </span>
                <span>
                  {b} {obj[b] ?? 0}
                </span>
              </div>
              <div className="flex h-1.5 gap-px" aria-hidden>
                <span className="bg-(--is-frost)" style={{ flexGrow: obj[a] ?? 0 }} />
                <span className="bg-(--is-steel)/50" style={{ flexGrow: obj[b] ?? 0 }} />
              </div>
              <span className="sr-only">
                {a} {obj[a]} of {tot}
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ===================== T8 · Table 1, sortable ===================== */
type Key = "label" | "mission" | "family" | "prAuc" | "rocAuc" | "eventF1";
export function TTable({ rows }: { rows: Row[] }) {
  const [key, setKey] = useState<Key>("prAuc");
  const [asc, setAsc] = useState(false);
  const [mis, setMis] = useState<"all" | "1" | "2">("all");
  const [open, setOpen] = useState<Row | null>(null);
  const toast = useToast();
  // best = highest PR-AUC per mission (GMM on M1, TVAE on M2), not Table 1's "Best VAE" trend tag
  const best = new Set([1, 2].map((mm) => rows.filter((r) => r.mission === mm).sort((a, b) => b.prAuc - a.prAuc)[0].label));
  const list = rows
    .filter((r) => mis === "all" || String(r.mission) === mis)
    .slice()
    .sort((a, b) => {
      const x = a[key] ?? -1;
      const y = b[key] ?? -1;
      const c = typeof x === "string" ? x.localeCompare(y as string) : (x as number) - (y as number);
      return asc ? c : -c;
    });
  const cols: { k: Key; t: string; cls?: string; num?: boolean }[] = [
    { k: "label", t: "Method" },
    { k: "mission", t: "M", num: true },
    { k: "family", t: "Family", cls: "max-md:hidden" },
    { k: "prAuc", t: "PR-AUC", num: true },
    { k: "rocAuc", t: "ROC-AUC", num: true, cls: "max-sm:hidden" },
    { k: "eventF1", t: "Event F1", num: true, cls: "max-lg:hidden" },
  ];
  const sortBy = (k: Key) => (k === key ? setAsc((a) => !a) : (setKey(k), setAsc(k === "label" || k === "family")));
  return (
    <Panel id="t-table" code="T.08" title="Table 1 · sortable results" className="md:col-span-2 lg:col-span-12" spec={{ use: "All 13 Table 1 rows. Click a header to sort (again to reverse); click a row for its detail.", tokens: "Mono 11 headers with ↑/↓ + aria-sort · Host Grotesk 14 cells · ◆ Teal = highest PR-AUC per mission · hairline rows 48px" }}>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Mission filter" value={mis} onChange={setMis} options={[{ v: "all", t: "All" }, { v: "1", t: "M1" }, { v: "2", t: "M2" }]} />
        <p className={`${LABEL} text-(--is-steel)`} aria-live="polite">
          {list.length} rows · sorted by {cols.find((c) => c.k === key)!.t} {asc ? "↑" : "↓"}
        </p>
      </div>
      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table className="w-full min-w-[300px] border-collapse text-left">
          <thead>
            <tr className="border-b border-(--is-frost)">
              {cols.map((c) => (
                <th key={c.k} scope="col" aria-sort={key === c.k ? (asc ? "ascending" : "descending") : "none"} className={`${c.cls ?? ""} ${c.num ? "text-right" : ""} px-2 py-1 first:pl-4 sm:first:pl-2`}>
                  <button type="button" onClick={() => sortBy(c.k)} className={`${MONO} ${TRANS} inline-flex min-h-9 items-center gap-1 rounded-[2px] text-[11px] uppercase tracking-[0.12em] ${key === c.k ? "text-(--is-frost)" : "text-(--is-steel) hover:text-(--is-frost)"} active:opacity-70 ${FR}`}>
                    {c.t}
                    <span aria-hidden className={key === c.k ? "" : "opacity-0"}>
                      {asc ? "↑" : "↓"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.label} className={`group border-b border-(--is-line) ${TRANS} hover:bg-(--is-void)`}>
                <td className="py-0 pl-4 pr-2 sm:pl-2">
                  <button type="button" onClick={() => setOpen(r)} className={`flex min-h-12 w-full items-center gap-2 rounded-[2px] text-left text-[14px] text-(--is-frost) ${FR} focus-visible:outline-offset-0`}>
                    <span className="min-w-0">
                      {short(r.method)}
                      <span className="block text-[12px] text-(--is-steel)">{r.scoring}</span>
                    </span>
                    {best.has(r.label) ? (
                      <span className="ml-auto pr-1">
                        <Status kind="best">Best</Status>
                      </span>
                    ) : null}
                  </button>
                </td>
                <td className={`${MONO} px-2 text-right text-[13px] text-(--is-frost)`}>{r.mission}</td>
                <td className="px-2 text-[14px] capitalize text-(--is-steel) max-md:hidden">{r.family}</td>
                <td className={`${MONO} px-2 text-right text-[13px] text-(--is-frost)`}>{r.prAuc.toFixed(3)}</td>
                <td className={`${MONO} px-2 text-right text-[13px] text-(--is-frost) max-sm:hidden`}>{r.rocAuc.toFixed(3)}</td>
                <td className={`${MONO} px-2 pr-4 text-right text-[13px] text-(--is-steel) max-lg:hidden sm:pr-2`}>{r.eventF1 === null ? "—" : r.eventF1.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.label ?? ""} kicker={open ? `[ Table 1 · Mission ${open.mission} ]` : ""}>
        {open ? <MethodDetail r={open} onDone={() => (setOpen(null), toast(`${short(open.method)} M${open.mission} pinned to the comparison.`))} /> : null}
      </Modal>
    </Panel>
  );
}

