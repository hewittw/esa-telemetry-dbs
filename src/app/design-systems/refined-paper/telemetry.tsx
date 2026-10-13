"use client";

// Telemetry components: built for our paper, on content/results.json and content/figures-data.
import { useId, useMemo, useState } from "react";
import type { Catalogue, Gmm, MethodRow, Mission, PrSet, Timeline } from "./data";
import { Svg, big, path } from "./fig";
import { FOCUS, IconCheck, IconChevron, IconCross, IconDash, IconInfo, IconStep, MONO, SANS, SERIF, STATUS, btnTransport, caption, chip, field, fieldLabel } from "./kit";
import { FAMILY, Trend } from "./demos";
import { Segmented, Tabs } from "./ui";

const INKS = ["var(--prussian)", "var(--ochre)", "var(--sage)", "var(--graphite)"];
const STEP_S = { 1: 30, 2: 1 / 0.056 } as const;
const RULE99 = { 1: { p: 0.963, r: 0.087 }, 2: { p: 0.872, r: 0.186 } } as const;

/* ================================================================== T1 · alert budget: precision and recall from the PR curve */
export function AlertBudget({ sets }: { sets: PrSet[] }) {
  const [m, setM] = useState<1 | 2>(1);
  const [ci, setCi] = useState(0);
  const [budget, setBudget] = useState(2.0); // % of timesteps flagged
  const set = sets[m - 1];
  const c = set.curves[Math.min(ci, set.curves.length - 1)];
  const id = useId();
  // Each PR point implies a share of timesteps flagged: q = recall · positiveRate / precision.
  const pts = useMemo(() => c.points.filter((p) => p[1] > 0).map(([r, p]) => ({ r, p, q: (r * set.positiveRate) / p })), [c, set.positiveRate]);
  const best = pts.reduce((a, b) => (Math.abs(b.q - budget / 100) < Math.abs(a.q - budget / 100) ? b : a));
  const f1 = (2 * best.p * best.r) / (best.p + best.r || 1);
  const perDay = (budget / 100) * (86400 / STEP_S[m]);
  const W = 300, H = 210, L = 28, R = 8, T = 8, B = 24;
  const x = (v: number) => L + v * (W - L - R);
  const y = (v: number) => T + (1 - v) * (H - T - B);
  const rule = c.label === "GMM" ? RULE99[m] : null;
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-10">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented label="Mission" value={m} onChange={(v) => { setM(v); setCi(0); }} options={[{ value: 1, label: "M1" }, { value: 2, label: "M2" }]} />
          <div className="relative min-w-[11rem] flex-1">
            <label htmlFor={`${id}-m`} className="sr-only">Method</label>
            <select id={`${id}-m`} value={ci} onChange={(e) => setCi(+e.target.value)} className={`${field} h-[38px] cursor-pointer appearance-none pr-9`}>
              {set.curves.map((k, i) => <option key={k.key} value={i}>{k.label} · {k.scoring}</option>)}
            </select>
            <IconChevron className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2" />
          </div>
        </div>
        <div className="mt-6">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor={`${id}-b`} className={fieldLabel}>Alert budget</label>
            <output htmlFor={`${id}-b`} className={`${MONO} text-[14px]`}>{budget.toFixed(1)}% of timesteps</output>
          </div>
          <input id={`${id}-b`} type="range" min={0.2} max={30} step={0.1} value={budget} onChange={(e) => setBudget(+e.target.value)} className="rpd-range mt-2 w-full" style={{ ["--p" as string]: `${((budget - 0.2) / 29.8) * 100}%` }} aria-valuetext={`${budget.toFixed(1)} percent flagged: recall ${best.r.toFixed(2)}, precision ${best.p.toFixed(2)}`} />
          <p className={`${caption} mt-1`}>≈ {big(Math.round(perDay))} alerts per day of telemetry at Mission {m}’s cadence.</p>
        </div>
        <dl className="mt-6 grid grid-cols-3 border-t border-[var(--ink)]" aria-live="polite">
          {([["Recall", best.r], ["Precision", best.p], ["F1", f1]] as const).map(([k, v]) => (
            <div key={k} className="border-r border-[var(--rule)] pt-3 pr-3 pl-0 last:border-r-0 [&:not(:first-child)]:pl-3">
              <dt className={caption}>{k}</dt>
              <dd className={`${MONO} text-[clamp(1.6rem,4vw,2.2rem)] leading-none`}>{v.toFixed(2)}</dd>
            </div>
          ))}
        </dl>
        <p className={`${SERIF} mt-5 text-[17px] leading-[1.55]`}>
          Page an engineer for the top <span className={MONO}>{budget.toFixed(1)}%</span> and the <b className="font-semibold text-[var(--prussian)]">{c.label}</b> finds <span className={MONO}>{(best.r * 100).toFixed(0)}%</span> of anomalous timesteps; <span className={MONO}>{Math.round(best.p * 100)}</span> of every 100 alerts are real.
        </p>
      </div>
      <figure>
        <Svg vw={W} vh={H} role="img" aria-label={`${c.label} precision–recall curve, Mission ${m}, with the operating point for a ${budget.toFixed(1)} percent alert budget.`}>
          <line x1={x(0)} x2={x(1)} y1={y(set.positiveRate)} y2={y(set.positiveRate)} stroke="var(--graphite)" strokeDasharray="2 3" />
          <path d={path(c.points, x, y)} fill="none" stroke="var(--prussian)" strokeWidth="1.6" />
          {rule && (
            <g>
              <path d={`M${x(rule.r)},${y(rule.p) - 5} l4,5 -4,5 -4,-5z`} fill="var(--paper)" stroke="var(--ink)" strokeWidth="1" />
              <text x={x(rule.r) + 8} y={y(rule.p)} dy="0.35em" className={`${MONO} rpd-t-sm`} fill="var(--muted)">99th-pct rule</text>
            </g>
          )}
          <line x1={x(best.r)} x2={x(best.r)} y1={y(0)} y2={y(best.p)} stroke="var(--ink)" strokeWidth="0.75" />
          <line x1={x(0)} x2={x(best.r)} y1={y(best.p)} y2={y(best.p)} stroke="var(--ink)" strokeWidth="0.75" strokeDasharray="1 2" />
          <circle cx={x(best.r)} cy={y(best.p)} r="4.5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.6" />
          <line x1={x(0)} x2={x(1)} y1={y(0)} y2={y(0)} stroke="var(--ink)" strokeWidth="0.75" />
          <line x1={x(0)} x2={x(0)} y1={y(0)} y2={y(1)} stroke="var(--ink)" strokeWidth="0.75" />
          {[0, 0.5, 1].map((v) => <g key={v} className={MONO} fill="var(--muted)"><text x={x(v)} y={y(0)} dy="1.4em" textAnchor="middle">{v}</text><text x={L - 6} y={y(v)} dy="0.35em" textAnchor="end">{v}</text></g>)}
        </Svg>
        <figcaption className={`${caption} mt-2`}>Each point on the curve implies a share flagged, q = recall × {(set.positiveRate * 100).toFixed(1)}% ÷ precision; the slider walks q. {c.exact ? "Table 1 run" : `Earlier saved run; Table 1 AP ${c.reportAp?.toFixed(3)}`}. The diamond is the GMM’s 99th-percentile training-NLL threshold.</figcaption>
      </figure>
    </div>
  );
}

/* ================================================================== T2 · mission switcher with headline stats */
export function MissionSwitch({ missions, rows }: { missions: Mission[]; rows: MethodRow[] }) {
  const [m, setM] = useState<1 | 2>(1);
  const x = missions[m - 1];
  const best = rows.filter((r) => r.mission === m).reduce((a, b) => (b.prAuc > a.prAuc ? b : a));
  const days = (x.test / x.hz) / 86400;
  const stats: [string, string, string?][] = [
    ["Channels", String(x.channels), `${x.constantRemoved} constant, dropped for GMM`],
    ["Test timesteps", `${(x.test / 1e6).toFixed(2)}M`, `≈ ${(days / 365).toFixed(1)} years at ${x.hz} Hz`],
    ["Subsystems → groups", `${x.subsystems} → ${x.groups}`, `BIC picks K = ${x.bicK}`],
    ["Test anomaly rate", `${(x.testRate * 100).toFixed(1)}%`, x.labels],
  ];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Mission" value={m} onChange={setM} options={[{ value: 1, label: "Mission 1" }, { value: 2, label: "Mission 2" }]} />
        <p className={`${SANS} inline-flex items-center gap-2 text-[13px]`}>
          <span className="text-[var(--muted)]">Best PR-AUC</span>
          <span className="font-medium">{best.label.replace(/ \(.*\)/, "")}</span>
          <span className={`${MONO} rounded-[2px] bg-[var(--parchment)] px-1.5 py-0.5 text-[12.5px]`}>{best.prAuc.toFixed(3)}</span>
        </p>
      </div>
      <dl key={m} className="rpd-fade mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-[var(--rule)] bg-[var(--rule)] lg:grid-cols-4" aria-live="polite">
        {stats.map(([k, v, n]) => (
          <div key={k} className="bg-[var(--mount)] p-4">
            <dt className={caption}>{k}</dt>
            <dd className={`${SERIF} mt-1 text-[clamp(1.9rem,4.4vw,2.75rem)] leading-none font-light tracking-[-0.02em]`}>{v}</dd>
            {n && <dd className={`${SANS} mt-2 text-[12px] leading-[1.35] text-[var(--muted)]`}>{n}</dd>}
          </div>
        ))}
      </dl>
      <p className={`${caption} mt-2`}>Events: {Object.entries(x.events).map(([k, v]) => `${v} ${k.toLowerCase()}${v === 1 ? "" : "s"}`).join(" · ")}.</p>
    </div>
  );
}

/* ================================================================== T3 · method spec card */
export function SpecCard({ rows }: { rows: MethodRow[] }) {
  const [id, setId] = useState(rows.find((r) => r.method === "GMM")!.id);
  const uid = useId();
  const r = rows.find((x) => x.id === id)!;
  const peers = rows.filter((x) => x.mission === r.mission).sort((a, b) => b.prAuc - a.prAuc);
  const rank = peers.findIndex((x) => x.id === r.id) + 1;
  const k = r.latentK != null ? `${r.family === "generative" ? "latent " : ""}K = ${r.latentK}` : r.d != null ? `d = ${r.d}` : "—";
  const v = { exact: ["ok", "Verified against the notebook"], near: ["warn", "Near: third decimal differs"], mixed: ["warn", "Mixed: two runs combined"], "not found": ["fail", "Run not saved"] }[r.verify] as ["ok" | "warn" | "fail", string];
  const st = STATUS[v[0]];
  return (
    <div className="grid gap-5 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-8">
      <div>
        <label htmlFor={uid} className={fieldLabel}>Table 1 row</label>
        <div className="relative mt-1.5">
          <select id={uid} value={id} onChange={(e) => setId(e.target.value)} className={`${field} cursor-pointer appearance-none pr-9`}>
            {[1, 2].map((m) => (
              <optgroup key={m} label={`Mission ${m}`}>
                {rows.filter((x) => x.mission === m).map((x) => <option key={x.id} value={x.id}>{x.label.replace(/ \(M\d,? ?/, " (").replace(" ()", "")}</option>)}
              </optgroup>
            ))}
          </select>
          <IconChevron className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2" />
        </div>
        <p className={`${caption} mt-2`}>Rank {rank} of {peers.length} on Mission {r.mission} by PR-AUC.</p>
      </div>
      <article key={id} className="rpd-fade rounded-[3px] border border-[var(--ink)] bg-[var(--mount)]">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--rule)] px-5 py-4">
          <h4 className={`${SERIF} text-[24px] leading-tight font-[450]`}>{r.method}</h4>
          <span className={`${MONO} text-[12px] text-[var(--muted)]`}>{FAMILY[r.family].name.toLowerCase()} · M{r.mission} · {k}</span>
        </header>
        <dl className="grid grid-cols-2 sm:grid-cols-4">
          {([["PR-AUC", r.prAuc.toFixed(3)], ["ROC-AUC", r.rocAuc.toFixed(3)], ["Event F1", r.eventF1?.toFixed(3) ?? "—"], ["Scoring", r.scoring]] as const).map(([a, b], i) => (
            <div key={a} className={`border-[var(--rule)] px-5 py-3 ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`}>
              <dt className={caption}>{a}</dt>
              <dd className={`${i < 3 ? MONO + " text-[22px]" : SANS + " text-[14px] font-medium pt-1.5"} leading-tight`}>{b}</dd>
            </div>
          ))}
        </dl>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--rule)] px-5 py-3">
          <Trend row={r} />
          <span className={`${SANS} inline-flex items-center gap-1.5 text-[12.5px] font-medium`} style={{ color: st.color }}><st.Icon size={11} />{v[1]}</span>
          <span />
        </footer>
      </article>
    </div>
  );
}

/* ================================================================== T4 · PR-curve viewer with method toggles */
export function PrViewer({ sets }: { sets: PrSet[] }) {
  const [m, setM] = useState<1 | 2>(1);
  const set = sets[m - 1];
  const [off, setOff] = useState<Record<string, boolean>>({});
  const [hl, setHl] = useState<string | null>(null);
  const W = 620, H = 330, L = 40, R = 16, T = 12, B = 34;
  const x = (v: number) => L + v * (W - L - R);
  const y = (v: number) => T + (1 - v) * (H - T - B);
  const shown = set.curves.filter((c) => !off[c.key]);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented size="sm" label="Mission" value={m} onChange={(v) => { setM(v); setOff({}); }} options={[{ value: 1, label: "M1" }, { value: 2, label: "M2" }]} />
        <span className="mx-1 hidden h-5 w-px bg-[var(--rule)] sm:block" aria-hidden />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Curves">
          {set.curves.map((c, i) => (
            <button key={c.key} type="button" aria-pressed={!off[c.key]} onClick={() => setOff((o) => ({ ...o, [c.key]: !o[c.key] }))} onMouseEnter={() => setHl(c.key)} onMouseLeave={() => setHl(null)} onFocus={() => setHl(c.key)} onBlur={() => setHl(null)} className={chip}>
              <span aria-hidden className="inline-block h-[2px] w-4" style={{ background: off[c.key] ? "var(--rule-strong)" : INKS[i] }} />
              {c.label}
              <span className={`${MONO} text-[11px] text-[var(--muted)]`}>{c.ap.toFixed(3)}{!c.exact && <><span aria-hidden>*</span><span className="sr-only"> (earlier saved run)</span></>}</span>
            </button>
          ))}
        </div>
      </div>
      <figure className="mt-4">
        <Svg vw={W} vh={H} role="img" aria-label={`Precision–recall curves, Mission ${m}: ${shown.map((c) => `${c.label} AP ${c.ap.toFixed(3)}`).join(", ") || "none shown"}.`}>
          {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={x(0)} x2={x(1)} y1={y(g)} y2={y(g)} stroke="var(--rule)" strokeWidth="0.5" />)}
          <line x1={x(0)} x2={x(1)} y1={y(set.positiveRate)} y2={y(set.positiveRate)} stroke="var(--graphite)" strokeDasharray="2 3" />
          <text x={x(0) + 6} y={y(set.positiveRate)} dy="1.25em" className={MONO} fill="var(--muted)">positive rate {(set.positiveRate * 100).toFixed(1)}%</text>
          {set.curves.map((c, i) => !off[c.key] && (
            <path key={c.key} d={path(c.points, x, y)} fill="none" stroke={INKS[i]} strokeWidth={hl === c.key ? 2.6 : 1.6} opacity={hl && hl !== c.key ? 0.2 : 1} className="rpd-fade transition-[opacity,stroke-width] duration-200" />
          ))}
          <line x1={x(0)} x2={x(1)} y1={y(0)} y2={y(0)} stroke="var(--ink)" strokeWidth="0.75" />
          <line x1={x(0)} x2={x(0)} y1={y(0)} y2={y(1)} stroke="var(--ink)" strokeWidth="0.75" />
          {[0, 0.25, 0.5, 0.75, 1].map((v) => <g key={v} className={MONO} fill="var(--muted)"><text x={x(v)} y={y(0)} dy="1.4em" textAnchor="middle">{v}</text><text x={L - 7} y={y(v)} dy="0.35em" textAnchor="end">{v}</text></g>)}
          <text x={x(1)} y={y(0)} dy="2.8em" textAnchor="end" className={MONO} fill="var(--muted)">recall</text>
        </Svg>
        {shown.length === 0 && <p className={`${SANS} -mt-[45%] mb-[38%] text-center text-[14px] text-[var(--muted)]`}>Every curve is off. Turn one back on above.</p>}
        <figcaption className={`${caption} mt-2`}>Curves and APs from saved test-set scores. * Earlier saved run, not the Table 1 run: {set.curves.filter((c) => !c.exact).map((c) => `${c.label} (${c.scoring}; Table 1 ${c.reportAp?.toFixed(3)})`).join(", ")}.</figcaption>
      </figure>
    </div>
  );
}

/* ================================================================== T5 · mission timeline scrubber */
export function TimelineScrubber({ timelines }: { timelines: Timeline[] }) {
  const [m, setM] = useState<1 | 2>(1);
  const t = timelines[m - 1];
  const n = t.bins.length;
  const [i, setI] = useState(Math.round(n * 0.34));
  const W = 1000, H = 190, T = 8, B = 4;
  const lg = (v: number) => Math.log10(Math.max(v, 0.5));
  const maxes = t.bins.map((b) => lg(b[2])).sort((a, b) => a - b);
  const lo = Math.min(...t.bins.map((b) => lg(b[1])));
  const top = maxes[Math.floor(maxes.length * 0.98)];
  const x = (v: number) => v * W;
  const y = (v: number) => T + (1 - (Math.min(lg(v), top) - lo) / (top - lo)) * (H - T - B);
  const med = t.bins.map((b, j) => `${j ? "L" : "M"}${x(b[0]).toFixed(1)},${y(b[1]).toFixed(1)}`).join("");
  const env = t.bins.map((b, j) => `${j ? "L" : "M"}${x(b[0]).toFixed(1)},${y(b[2]).toFixed(1)}`).join("") + [...t.bins].reverse().map((b) => `L${x(b[0]).toFixed(1)},${y(b[1]).toFixed(1)}`).join("") + "Z";
  const b = t.bins[Math.min(i, n - 1)];
  const stepIdx = Math.round(b[0] * t.nTest);
  const day = (stepIdx * STEP_S[m]) / 86400;
  const inside = b[3] > 0.5 ? "fail" : b[3] > 0 ? "warn" : "ok";
  const word = { ok: "Nominal", warn: `Partly labelled (${Math.round(b[3] * 100)}%)`, fail: `Inside a labelled anomaly (${Math.round(b[3] * 100)}%)` }[inside];
  const Ico = { ok: IconCheck, warn: IconDash, fail: IconCross }[inside];
  const color = { ok: "var(--sage)", warn: "var(--ochre)", fail: "var(--oxblood)" }[inside];
  const jump = (d: 1 | -1) => {
    const cur = b[0];
    const seg = d > 0 ? t.segments.find((s) => s[0] > cur + 0.002) : [...t.segments].reverse().find((s) => s[0] < cur - 0.002);
    if (seg) setI(Math.min(n - 1, t.bins.findIndex((q) => q[0] >= seg[0])));
  };
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Mission" value={m} onChange={(v) => { setM(v); setI(Math.round(timelines[v - 1].bins.length * 0.34)); }} options={[{ value: 1, label: "Mission 1" }, { value: 2, label: "Mission 2" }]} />
        <p className={`${MONO} text-[12px] text-[var(--muted)]`}>{t.nSegments} labelled segments · {big(t.nTest)} test steps</p>
      </div>
      <div className="mt-4 rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] p-3 sm:p-4">
        <Svg vw={W} vh={H} preserveAspectRatio="none" className="h-[150px] sm:h-[190px]" role="img" aria-label={`GMM anomaly score across the Mission ${m} test set, log scale, labelled anomaly segments shaded. Cursor at day ${day.toFixed(0)}.`}>
          {t.segments.map(([a, c]) => <rect key={a} x={x(a)} width={Math.max(1, x(c) - x(a))} y={0} height={H} fill="var(--band)" />)}
          <path d={env} fill="var(--rule)" opacity="0.6" />
          <path d={med} fill="none" stroke="var(--ink)" strokeWidth="1.1" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          <line x1={x(b[0])} x2={x(b[0])} y1={0} y2={H} stroke="var(--ink)" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
          <line x1={0} x2={W} y1={H - B} y2={H - B} stroke="var(--ink)" strokeWidth="0.75" vectorEffect="non-scaling-stroke" />
        </Svg>
        <label className="mt-1 block">
          <span className="sr-only">Scrub the test set</span>
          <input type="range" min={0} max={n - 1} value={i} onChange={(e) => setI(+e.target.value)} className="rpd-range w-full" style={{ ["--p" as string]: `${(i / (n - 1)) * 100}%` }} aria-valuetext={`day ${day.toFixed(0)}, ${word}`} />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex gap-2">
          <button type="button" className={btnTransport} aria-label="Previous anomaly" onClick={() => jump(-1)}><IconStep back /></button>
          <button type="button" className={btnTransport} aria-label="Next anomaly" onClick={() => jump(1)}><IconStep /></button>
        </div>
        <dl className={`${SANS} grid flex-1 grid-cols-2 gap-x-6 gap-y-1 text-[13px] sm:grid-cols-4`} aria-live="polite">
          <div><dt className="text-[var(--muted)]">Test step</dt><dd className={MONO}>{big(stepIdx)}</dd></div>
          <div><dt className="text-[var(--muted)]">Day of test</dt><dd className={MONO}>{day.toFixed(0)}</dd></div>
          <div><dt className="text-[var(--muted)]">Median NLL</dt><dd className={MONO}>{b[1] >= 1e4 ? b[1].toExponential(1) : b[1].toFixed(1)}</dd></div>
          <div className="col-span-2 sm:col-span-1"><dt className="text-[var(--muted)]">Label</dt><dd className="inline-flex items-center gap-1.5 font-medium" style={{ color }}><Ico size={11} />{word}</dd></div>
        </dl>
      </div>
    </div>
  );
}

/* ================================================================== T6 · subsystem vs group, before / after */
export function SubVsGroup({ gmm }: { gmm: Gmm }) {
  const [view, setView] = useState<"sub" | "grp">("sub");
  const comps = [...gmm.comps].sort((a, b) => b.weight - a.weight);
  const names = view === "sub" ? gmm.subs.map((s) => `S${s}`) : gmm.groups.map((g) => `G${g}`);
  const SHADES = ["var(--prussian)", "#9DB0C4", "#C9CFCF", "#DCD8CC", "#E6DFD1"];
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Segmented label="Compare components against" value={view} onChange={setView} options={[{ value: "sub", label: "Subsystems (4)" }, { value: "grp", label: "Groups (17)" }]} />
        <div className="text-right">
          <p className={caption}>Adjusted Rand index</p>
          <p className={`${MONO} text-[28px] leading-none`}>{(view === "sub" ? gmm.ariSub : gmm.ariGrp).toFixed(3)}</p>
        </div>
      </div>
      <ol className="mt-5 space-y-[5px]" aria-label={`Each of the 21 GMM components, split by dominant ${view === "sub" ? "subsystem" : "group"}`}>
        {comps.map((c) => {
          const parts = (view === "sub" ? c.sub : c.grp).map((v, i) => ({ v, i })).filter((p) => p.v > 0).sort((a, b) => b.v - a.v);
          return (
            <li key={c.id} className="grid grid-cols-[2.6rem_minmax(0,1fr)_4.6rem] items-center gap-3">
              <span className={`${MONO} text-[12px] text-[var(--muted)]`}>C{c.id}</span>
              <span className="flex h-[8px] overflow-hidden rounded-[1px] bg-[var(--parchment)]" aria-hidden>
                {parts.map((p, k) => <span key={p.i} className="h-full border-r border-[var(--mount)] transition-[width] duration-500 ease-[cubic-bezier(.22,.61,.36,1)] last:border-r-0" style={{ width: `${p.v * 100}%`, background: SHADES[Math.min(k, 4)] }} />)}
              </span>
              <span className={`${MONO} text-right text-[12px]`}>{names[parts[0].i]} {(parts[0].v * 100).toFixed(0)}%</span>
            </li>
          );
        })}
      </ol>
      <p className={`${caption} mt-3`}>Bars: each component’s Mission 1 training timesteps, prussian = its dominant {view === "sub" ? "subsystem" : "group"}. Fewer categories make bars look purer, so read the ARI, which corrects for chance: components agree with groups about twice as well ({gmm.ariGrp.toFixed(3)} against {gmm.ariSub.toFixed(3)}). Group 2 is never a sampled timestep’s dominant group, so 17 of the 18 groups appear.</p>
    </div>
  );
}

/* ================================================================== T7 · anomaly event card */
export function EventCard({ cats }: { cats: Catalogue[] }) {
  const [m, setM] = useState<1 | 2>(1);
  const c = cats[m - 1];
  const KIND: Record<string, { s: "fail" | "info" | "idle"; what: string }> = {
    Anomaly: { s: "fail", what: "A genuine fault: hardware or software failure needing intervention." },
    "Rare Event": { s: "info", what: "Unusual but still operational; not a failure." },
    "Communication Gap": { s: "idle", what: "Telemetry missing while the link was down." },
  };
  return (
    <div>
      <Segmented label="Mission" value={m} onChange={setM} options={[{ value: 1, label: "Mission 1" }, { value: 2, label: "Mission 2" }]} />
      <div key={m} className="mt-4">
        <Tabs label={`Mission ${m} event types`} tabs={c.cats.map((k) => {
          const st = STATUS[KIND[k.name].s];
          return {
            id: k.name, label: `${k.name === "Communication Gap" ? "Comms gap" : k.name} · ${k.n}`,
            panel: (
              <article className="rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h4 className={`${SERIF} text-[24px] leading-tight font-[450]`}>{k.n} {k.n === 1 ? k.name.toLowerCase() : k.name === "Anomaly" ? "anomalies" : `${k.name.toLowerCase()}s`}</h4>
                  <span className={`${SANS} inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-0.5 text-[12.5px] font-medium`} style={{ color: st.color, borderColor: st.color }}><st.Icon size={11} />{k.name}</span>
                </div>
                <p className={`${SERIF} mt-2 text-[16px] leading-[1.55]`}>{KIND[k.name].what}</p>
                <dl className="mt-4 grid grid-cols-3 border-t border-[var(--ink)]">
                  {([["Share of events", `${((k.n / c.nEvents) * 100).toFixed(0)}%`], ["Median length", `${k.p50} h`], ["Longest", `${k.max} h`]] as const).map(([a, b]) => (
                    <div key={a} className="pt-2.5"><dt className={caption}>{a}</dt><dd className={`${MONO} text-[22px] leading-tight`}>{b}</dd></div>
                  ))}
                </dl>
                {m === 1 && k.name === "Anomaly" && <p className={`${caption} mt-3 inline-flex items-center gap-1.5`}><IconInfo size={11} />The longest, 967 h, starts 2009-05-25: the fault in the twin-view figure.</p>}
                <p className={`${caption} mt-2`}>Lengths from {big(k.segments)} labelled channel-segments, so they count segments, not events.</p>
              </article>
            ),
          };
        })} />
      </div>
      <p className={`${caption} mt-3`}>{c.nEvents} events on Mission {m}; {Math.round((c.multivariate / c.nEvents) * 100)}% multivariate, {Math.round((c.global / c.nEvents) * 100)}% global.</p>
    </div>
  );
}

/* ================================================================== T8 · results table with sort */
const Diamond = () => <svg aria-hidden width="9" height="9" viewBox="0 0 9 9" className="mr-1.5 inline-block align-[0.05em]"><path d="M4.5.6 8.4 4.5 4.5 8.4.6 4.5z" fill="var(--ink)" /></svg>;
type Key = "label" | "prAuc" | "rocAuc";
export function ResultsTable({ rows }: { rows: MethodRow[] }) {
  const [m, setM] = useState<0 | 1 | 2>(0);
  const [sort, setSort] = useState<{ k: Key | null; dir: 1 | -1 }>({ k: null, dir: -1 });
  // Two different marks, so this table and the GMM-first findings never disagree:
  // bold = the paper's best VAE per mission (as Table 1 bolds it); diamond = highest PR-AUC per mission.
  const best = (r: MethodRow) => r.trendDirection === "best";
  const top = (r: MethodRow) => r.prAuc === Math.max(...rows.filter((x) => x.mission === r.mission).map((x) => x.prAuc));
  const list = useMemo(() => {
    const l = rows.filter((r) => m === 0 || r.mission === m);
    if (!sort.k) return l;
    const k = sort.k;
    return [...l].sort((a, b) => (k === "label" ? a.label.localeCompare(b.label) * -sort.dir : (a[k] - b[k]) * sort.dir));
  }, [rows, m, sort]);
  const click = (k: Key) => setSort((s) => (s.k !== k ? { k, dir: k === "label" ? -1 : -1 } : s.dir === -1 ? { k, dir: 1 } : { k: null, dir: -1 }));
  const Th = ({ k, children, num }: { k: Key; children: string; num?: boolean }) => {
    const on = sort.k === k;
    return (
      <th scope="col" aria-sort={on ? (sort.dir === -1 ? (k === "label" ? "ascending" : "descending") : (k === "label" ? "descending" : "ascending")) : "none"} className={`py-0 font-medium ${num ? "text-right" : "text-left"}`}>
        <button type="button" onClick={() => click(k)} className={`${SANS} ${FOCUS} inline-flex h-9 items-center gap-1 rounded-[2px] px-1.5 text-[12.5px] transition-colors duration-200 hover:bg-[var(--parchment)] active:bg-[var(--rule)] ${on ? "text-[var(--ink)]" : "text-[var(--muted)]"} ${num ? "-mr-1.5 flex-row-reverse" : "-ml-1.5"}`}>
          {children}
          <svg aria-hidden width="9" height="11" viewBox="0 0 9 11"><path d="M4.5 1 8 4.5H1z" fill={on && sort.dir === 1 ? "var(--ink)" : "var(--rule-strong)"} /><path d="M4.5 10 1 6.5h7z" fill={on && sort.dir === -1 ? "var(--ink)" : "var(--rule-strong)"} /></svg>
        </button>
      </th>
    );
  };
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented size="sm" label="Mission" value={m} onChange={setM} options={[{ value: 0, label: "Both" }, { value: 1, label: "M1" }, { value: 2, label: "M2" }]} />
        <p className={caption}>{sort.k ? `Sorted by ${sort.k === "label" ? "method" : sort.k === "prAuc" ? "PR-AUC" : "ROC-AUC"}` : "Paper order, grouped by family"} · click a heading to sort</p>
      </div>
      <div className="rpd-scroll mt-3 overflow-x-auto">
        <table className="w-full min-w-[330px] border-collapse">
          <caption className={`${caption} caption-bottom pt-3 text-left`}>Table 1. Point-wise and event-wise performance. <Diamond /> Highest PR-AUC per mission: GMM on Mission 1 (0.384), TransformerVAE on Mission 2 (0.438). Bold: the best VAE per mission, as the paper bolds it. GMM and VAEs use different fitting protocols from the 80/20 baseline split.</caption>
          <thead className="border-y border-[var(--ink)]">
            <tr>
              <Th k="label">Method</Th>
              <th scope="col" className={`${SANS} hidden px-1.5 text-left text-[12.5px] font-medium text-[var(--muted)] md:table-cell`}>Scoring</th>
              <Th k="prAuc" num>PR-AUC</Th>
              <Th k="rocAuc" num>ROC-AUC</Th>
              <th scope="col" className={`${SANS} hidden px-1.5 text-right text-[12.5px] font-medium text-[var(--muted)] sm:table-cell`}>Ev. F1</th>
              <th scope="col" className={`${SANS} hidden pl-4 text-left text-[12.5px] font-medium text-[var(--muted)] min-[480px]:table-cell`}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r, k) => {
              const groupBreak = !sort.k && k > 0 && list[k - 1].family !== r.family;
              return (
                <tr key={r.id} className={`border-b border-[var(--rule)] transition-colors duration-150 hover:bg-[var(--parchment)]/60 ${groupBreak ? "border-t border-t-[var(--rule-strong)]" : ""}`}>
                  <th scope="row" className={`${SANS} py-2.5 pr-3 text-left text-[13.5px] leading-snug font-medium`}>{r.label}</th>
                  <td className={`${SANS} hidden px-1.5 text-[13px] text-[var(--muted)] md:table-cell`}>{r.scoring}</td>
                  <td className={`${MONO} px-0 text-right text-[13.5px] whitespace-nowrap ${best(r) ? "font-semibold" : ""}`}>{top(r) && <><Diamond /><span className="sr-only">Highest PR-AUC on Mission {r.mission}: </span></>}{r.prAuc.toFixed(3)}</td>
                  <td className={`${MONO} px-0 text-right text-[13.5px] ${best(r) ? "font-semibold" : ""}`}>{r.rocAuc.toFixed(3)}</td>
                  <td className={`${MONO} hidden px-0 text-right text-[13.5px] text-[var(--muted)] sm:table-cell`}>{r.eventF1?.toFixed(3) ?? "—"}</td>
                  <td className="hidden max-w-[12rem] py-2.5 pl-4 min-[480px]:table-cell"><Trend row={r} long /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
