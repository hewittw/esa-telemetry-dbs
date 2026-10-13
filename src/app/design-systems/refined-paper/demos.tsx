"use client";

// Section 4 (components), the Parts-of-an-Interface specimens, and section 6 (UI states).
// All live, all on our content: Table 1 rows, Mission 1/2 facts, channel metadata.
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import type { Channel, MethodRow, Mission } from "./data";
import {
  FOCUS, IconArrow, IconCheck, IconChevron, IconCross, IconInfo, IconMenu, IconSearch, IconWarn, MONO, SANS, SERIF, STATUS,
  btnIcon, btnPrimary, btnQuiet, btnSecondary, caption, chip, chipCheck, field, fieldHelp, fieldLabel, link, type Status,
} from "./kit";
import { Accordion, Check, CountBadge, Dialog, Dot, MenuButton, MoreMenu, RadioGroup, Segmented, Switch, Tabs, Tooltip, useToast } from "./ui";
import { Svg } from "./fig";

export const FAMILY: Record<MethodRow["family"], { name: string; by: string; what: string }> = {
  baseline: { name: "Baseline", by: "Rhea Madhogarhia", what: "Global clustering and linear or kernel compression, fit on an 80/20 temporal split." },
  parametric: { name: "Parametric", by: "Hewitt Watkins", what: "Full-covariance Gaussian mixture on PCA-30, K chosen by BIC on an 800K-row sample." },
  generative: { name: "Generative", by: "Hewitt Watkins", what: "VAEs on 32-step windows of pure-nominal telemetry, scored by MSE, ELBO or GMM-OOD." },
};
const POS = { 1: 0.111, 2: 0.0468 } as const;

/* ------------------------------------------------------------------ trend: icon + word, never colour alone */
// Table 1's "Best M1" tag means best VAE (the paper bolds it); GMM has the highest M1 PR-AUC, so say so.
export function Trend({ row, long }: { row: MethodRow; long?: boolean }) {
  const t = row.trendDirection;
  const s: Status = t === "up" || t === "best" ? "ok" : t === "down" ? "fail" : "idle";
  const { color, Icon } = STATUS[s];
  const raw = row.trend.replace(/[↑↓]/g, "").trim();
  const word = t === "best" ? `Best VAE on M${row.mission}${long ? " (bolded in the paper)" : ""}` : raw;
  return (
    <span className={`${SANS} inline-flex items-center gap-1.5 text-[12.5px] font-medium ${long ? "" : "whitespace-nowrap"}`} style={{ color: s === "idle" ? "var(--muted)" : color }}>
      <Icon size={11} className="shrink-0" />
      {word}
    </span>
  );
}

/* ------------------------------------------------------------------ PR-AUC against the positive rate */
export function ApBar({ ap, mission, width = "w-full" }: { ap: number; mission: 1 | 2; width?: string }) {
  const p = POS[mission];
  return (
    <span className={`relative block h-[6px] ${width}`} aria-hidden>
      <span className="absolute inset-y-[2.5px] left-0 right-0 bg-[var(--rule)]" />
      <span className="absolute inset-y-0 left-0 bg-[var(--prussian)]" style={{ width: `${(ap / 0.5) * 100}%` }} />
      <span className="absolute -inset-y-[3px] w-px bg-[var(--ink)]" style={{ left: `${(p / 0.5) * 100}%` }} />
    </span>
  );
}

/* ------------------------------------------------------------------ method detail (modal body + detail panel) */
export function MethodDetail({ row, compact }: { row: MethodRow; compact?: boolean }) {
  const f = FAMILY[row.family];
  const stats: [string, string, string?][] = [
    ["PR-AUC", row.prAuc.toFixed(3), `${(row.prAuc / POS[row.mission]).toFixed(1)}× the ${(POS[row.mission] * 100).toFixed(1)}% positive rate`],
    ["ROC-AUC", row.rocAuc.toFixed(3)],
    ["Event F1", row.eventF1 == null ? "—" : row.eventF1.toFixed(3), row.eventF1 == null ? "baselines only" : undefined],
  ];
  return (
    <div>
      <p className={`${SERIF} text-[16px] leading-[1.55] text-[var(--ink)]`}>{f.what}</p>
      <dl className={`mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-[3px] border border-[var(--rule)] bg-[var(--rule)]`}>
        {stats.map(([k, v, n]) => (
          <div key={k} className="bg-[var(--mount)] px-3 py-2.5">
            <dt className={`${SANS} text-[12px] text-[var(--muted)]`}>{k}</dt>
            <dd className={`${MONO} mt-0.5 text-[20px] leading-tight text-[var(--ink)]`}>{v}</dd>
            {n && !compact && <dd className={`${SANS} mt-0.5 text-[11.5px] leading-[1.3] text-[var(--muted)]`}>{n}</dd>}
          </div>
        ))}
      </dl>
      <div className="mt-4">
        <div className={`${SANS} flex justify-between text-[12px] text-[var(--muted)]`}>
          <span>PR-AUC on a 0–0.5 scale</span>
          <span>tick = positive rate</span>
        </div>
        <div className="mt-1.5"><ApBar ap={row.prAuc} mission={row.mission} /></div>
      </div>
      <dl className={`${SANS} mt-4 grid grid-cols-[7rem_1fr] gap-y-1.5 text-[13px]`}>
        <dt className="text-[var(--muted)]">Scoring</dt><dd className="text-[var(--ink)]">{row.scoring}</dd>
        <dt className="text-[var(--muted)]">Trend</dt><dd><Trend row={row} /></dd>
        <dt className="text-[var(--muted)]">Implemented by</dt><dd className="text-[var(--ink)]">{f.by}</dd>
      </dl>
    </div>
  );
}

/* ================================================================== 4.1–4.3 buttons + link */
export function ButtonsDemo() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={btnPrimary} onClick={() => toast({ title: "Latent map opened", body: "Mission 1, GMM K = 21. (A faked action: nothing is saved.)" })}>
          Explore the latent map <IconArrow />
        </button>
        <button type="button" className={btnSecondary} disabled={busy} onClick={() => { setBusy(true); setTimeout(() => { setBusy(false); toast({ title: "Report ready", body: "Madhogarhia & Watkins (2026), 11 pages." }); }, 1200); }}>
          {busy ? <><span className="size-3 animate-spin rounded-full border border-current border-t-transparent" aria-hidden />Preparing…</> : "Read the paper"}
        </button>
        <button type="button" className={btnQuiet} onClick={() => toast({ title: "Citation copied", body: "Madhogarhia, R. & Watkins, H. (2026). TTIC 31220." })}>Copy citation</button>
      </div>
      <p className={caption}>One vermilion primary per view. The secondary disables itself while it works; the quiet text button sits last.</p>
    </div>
  );
}

export function LinkDemo() {
  return (
    <div className="space-y-3">
      <p className={`${SERIF} text-[17px] leading-[1.6] text-[var(--ink)]`}>
        The mixture model selects K by BIC; see <a href="#nv-bic" className={link}>the BIC step player</a> for the full sweep, or{" "}
        <a href="#tm-table" className={link}>Table 1</a> for every method.
      </p>
      <a href="#tm-table" className={`${link} ${SANS} inline-flex items-center gap-1.5 text-[14px] font-medium no-underline hover:underline`}>
        All 13 rows of Table 1 <IconArrow />
      </a>
    </div>
  );
}

/* ================================================================== 4.4 text input with validation */
export function InputDemo({ channels }: { channels: Channel[] }) {
  const [v, setV] = useState("channel_41");
  const id = useId();
  const n = parseInt(v.replace(/[^0-9]/g, ""), 10);
  const hit = channels.find((c) => c.id === n);
  const empty = v.trim() === "";
  const bad = !empty && !hit;
  return (
    <div className="max-w-[26rem]">
      <label htmlFor={id} className={fieldLabel}>Find a Mission 1 channel</label>
      <div className="relative mt-1.5">
        <IconSearch className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--muted)]" />
        <input id={id} value={v} onChange={(e) => setV(e.target.value)} placeholder="channel_12 or 12" aria-invalid={bad} aria-describedby={`${id}-h`} className={`${field} pl-9 ${MONO}`} autoComplete="off" spellCheck={false} />
      </div>
      <p id={`${id}-h`} aria-live="polite" className={`${fieldHelp} flex items-center gap-1.5 ${bad ? "text-[var(--oxblood)]" : ""}`}>
        {empty && "Type a channel number from 1 to 76."}
        {hit && (<><IconCheck size={11} className="text-[var(--sage)]" /><span><span className={`${MONO} text-[var(--ink)]`}>channel_{hit.id}</span> · subsystem {hit.s} · group {hit.g}{hit.target ? " · labelled target" : ""}</span></>)}
        {bad && (<><IconWarn size={11} /><span>No channel {Number.isNaN(n) ? `“${v}”` : n} on Mission 1. It has 76.</span></>)}
      </p>
    </div>
  );
}

/* ================================================================== 4.5 select */
const SCORINGS = ["Neg. log-lik.", "Neg. ELBO", "Recon. MSE", "GMM-OOD", "Centroid dist."] as const;
export function SelectDemo({ rows }: { rows: MethodRow[] }) {
  const [s, setS] = useState<(typeof SCORINGS)[number]>("Neg. ELBO");
  const id = useId();
  const hits = rows.filter((r) => r.scoring === s);
  return (
    <div className="max-w-[26rem]">
      <label htmlFor={id} className={fieldLabel}>Anomaly score</label>
      <div className="relative mt-1.5">
        <select id={id} value={s} onChange={(e) => setS(e.target.value as typeof s)} className={`${field} cursor-pointer appearance-none pr-9`}>
          {SCORINGS.map((x) => <option key={x}>{x}</option>)}
        </select>
        <IconChevron className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[var(--ink)]" />
      </div>
      <p className={fieldHelp} aria-live="polite">
        {hits.length} Table 1 {hits.length === 1 ? "row uses" : "rows use"} it: {hits.map((h) => h.label.replace(/ \(.*\)/, ` M${h.mission}`)).join(", ")}.
      </p>
    </div>
  );
}

/* ================================================================== 4.6 checkbox (with indeterminate parent) */
export function CheckboxDemo() {
  const vaes = ["CapacityVAE", "HierarchicalVAE", "TransformerVAE"];
  const [on, setOn] = useState<Record<string, boolean>>({ CapacityVAE: true, HierarchicalVAE: false, TransformerVAE: true });
  const n = vaes.filter((v) => on[v]).length;
  return (
    <div>
      <p className={`${SANS} mb-1.5 text-[13px] font-medium text-[var(--ink)]`}>Curves on the chart</p>
      <Check checked={n === 3} indeterminate={n > 0 && n < 3} onChange={(c) => setOn(Object.fromEntries(vaes.map((v) => [v, c])))} label="All VAEs" hint={`${n} of 3 shown`} />
      <div className="ml-[30px] border-l border-[var(--rule)] pl-3">
        {vaes.map((v) => <Check key={v} checked={!!on[v]} onChange={(c) => setOn((o) => ({ ...o, [v]: c }))} label={v} />)}
      </div>
      <Check checked={false} onChange={() => {}} disabled label="Event F1 overlay" hint="Disabled: computed for baselines only" />
    </div>
  );
}

/* ================================================================== 4.7 radio */
export function RadioDemo() {
  const [v, setV] = useState<"p99" | "p985" | "f1">("p99");
  const note = { p99: "GMM M1 at this rule: precision 0.963, recall 0.087.", p985: "TransformerVAE run 1, M1: precision 0.856, recall 0.116.", f1: "" }[v];
  return (
    <div>
      <RadioGroup
        name="rule" legend="Alarm threshold" value={v} onChange={setV}
        options={[
          { value: "p99", label: "99th percentile of training NLL", hint: "The GMM rule in §4" },
          { value: "p985", label: "98.5th percentile", hint: "Best for the earliest TransformerVAE run" },
          { value: "f1", label: "Best event F1 on test", hint: "Disabled: it would peek at test labels", disabled: true },
        ]}
      />
      <p className={`${fieldHelp} ${MONO}`} aria-live="polite">{note}</p>
    </div>
  );
}

/* ================================================================== 4.8 switch, wired to a sparkline */
export function SwitchDemo({ spark }: { spark: [number, number, number, number][] }) {
  const [log, setLog] = useState(true);
  const [bands, setBands] = useState(true);
  const W = 320, H = 72;
  const vals = spark.map((b) => (log ? Math.log10(Math.max(b[1], 0.5)) : Math.min(b[1], 400)));
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const d = spark.map((b, i) => `${i ? "L" : "M"}${(b[0] * W).toFixed(1)},${(H - 4 - ((vals[i] - lo) / (hi - lo || 1)) * (H - 10)).toFixed(1)}`).join("");
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr] sm:items-center">
      <div className="divide-y divide-[var(--rule)]">
        <Switch checked={log} onChange={setLog} label="Log score" hint="Scores span 0.5 to 3×10⁸" />
        <Switch checked={bands} onChange={setBands} label="Anomaly bands" hint="Labelled test segments" />
        <Switch checked={false} onChange={() => {}} disabled label="Live stream" hint="Disabled: the site is static" />
      </div>
      <div className="rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] p-3">
        <Svg vw={W} vh={H} role="img" aria-label={`GMM anomaly score, Mission 1, ${log ? "log" : "linear, clipped at 400"} scale${bands ? ", with anomaly bands" : ""}.`}>
          {bands && spark.map((b, i) => b[3] > 0.25 && <rect key={i} x={b[0] * W} width={W / spark.length + 0.6} y={0} height={H} fill="var(--band)" />)}
          <path d={d} fill="none" stroke="var(--ink)" strokeWidth="1" />
        </Svg>
        <p className={`${caption} mt-1.5`}>GMM score, Mission 1 test set · {log ? "log" : "linear"}</p>
      </div>
    </div>
  );
}

/* ================================================================== 4.9 tabs */
export function TabsDemo({ rows }: { rows: MethodRow[] }) {
  const gmm = rows.find((r) => r.method === "GMM" && r.mission === 1)!;
  return (
    <Tabs
      label="GMM, Mission 1"
      tabs={[
        { id: "res", label: "Result", panel: <MethodDetail row={gmm} compact /> },
        { id: "how", label: "Method", panel: <p className={`${SERIF} max-w-[58ch] text-[16px] leading-[1.6]`}>Drop 8 constant channels, standardise, project to 30 principal components (99.1% of variance), then fit a full-covariance mixture for every K from 2 to 30 and keep the BIC minimum: <span className={MONO}>K = 21</span>.</p> },
        { id: "lim", label: "Limits", panel: <p className={`${SERIF} max-w-[58ch] text-[16px] leading-[1.6]`}>Point-wise PR-AUC rewards long events. The GMM fits an 800K-row random sample, not the 80/20 split the baselines use, so compare within a family first.</p> },
        { id: "ev", label: "Event F1", disabled: true, panel: null },
      ]}
    />
  );
}

/* ================================================================== 4.10 segmented */
export function SegmentedDemo({ missions }: { missions: Mission[] }) {
  const [m, setM] = useState<1 | 2>(1);
  const x = missions[m - 1];
  return (
    <div>
      <Segmented label="Mission" value={m} onChange={setM} options={[{ value: 1, label: "Mission 1" }, { value: 2, label: "Mission 2" }]} />
      <dl className="mt-4 grid grid-cols-3 gap-4" aria-live="polite">
        {([["Channels", x.channels], ["Subsystems", x.subsystems], ["Groups", x.groups]] as const).map(([k, v]) => (
          <div key={k} className="border-t border-[var(--ink)] pt-2">
            <dt className={caption}>{k}</dt>
            <dd className={`${SERIF} text-[36px] leading-none font-light tracking-[-0.02em]`}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ================================================================== 4.11 filter chips + 4.13 list rows + detail panel */
export function ChipsListDemo({ rows }: { rows: MethodRow[] }) {
  const fams = ["baseline", "parametric", "generative"] as const;
  const [on, setOn] = useState<Record<string, boolean>>({ baseline: false, parametric: true, generative: true });
  const [mission, setMission] = useState<1 | 2 | 0>(1);
  const [sel, setSel] = useState<string | null>(null);
  const shown = rows.filter((r) => on[r.family] && (mission === 0 || r.mission === mission));
  const active = shown.find((r) => r.id === sel) ?? shown[0];
  const count = (f: string) => rows.filter((r) => r.family === f && (mission === 0 || r.mission === mission)).length;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by method family">
        {fams.map((f) => (
          <button key={f} type="button" aria-pressed={!!on[f]} onClick={() => setOn((o) => ({ ...o, [f]: !o[f] }))} className={chip}>
            <IconCheck size={11} className={chipCheck} />
            {FAMILY[f].name}
            <span className={`${MONO} text-[11px] text-[var(--muted)]`}>{count(f)}</span>
          </button>
        ))}
        <button type="button" className={chip} disabled aria-describedby="rpd-ev-note">Event F1</button>
        <span id="rpd-ev-note" className="sr-only">Disabled: event F1 exists for baselines only.</span>
        <span className="ml-auto"><Segmented size="sm" label="Mission" value={mission} onChange={setMission} options={[{ value: 1, label: "M1" }, { value: 2, label: "M2" }, { value: 0, label: "Both" }]} /></span>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          {shown.length === 0 ? (
            <EmptyState title="No methods match" body="Every family is filtered out. Turn one back on to see its Table 1 rows." action={<button type="button" className={btnSecondary} onClick={() => setOn({ baseline: true, parametric: true, generative: true })}>Show all families</button>} />
          ) : (
            <ul className="border-t border-[var(--ink)]" aria-label="Table 1 rows">
              {shown.map((r) => (
                <li key={r.id} className="border-b border-[var(--rule)]">
                  <button
                    type="button"
                    aria-pressed={active?.id === r.id}
                    onClick={() => setSel(r.id)}
                    className={`${FOCUS} group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-[2px] px-2 py-2.5 text-left transition-colors duration-200 hover:bg-[var(--parchment)]/70 active:bg-[var(--parchment)] aria-pressed:bg-[var(--parchment)] aria-pressed:shadow-[inset_2px_0_0_var(--ink)] sm:grid-cols-[minmax(0,1fr)_7rem_4rem]`}
                  >
                    <span className="min-w-0">
                      <span className={`${SANS} block truncate text-[14px] font-medium text-[var(--ink)]`}>{r.label}</span>
                      <span className={`${SANS} block text-[12px] text-[var(--muted)]`}>{FAMILY[r.family].name} · {r.scoring}</span>
                    </span>
                    <span className="hidden sm:block"><ApBar ap={r.prAuc} mission={r.mission} /></span>
                    <span className={`${MONO} text-right text-[14px] text-[var(--ink)]`}>{r.prAuc.toFixed(3)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {active && (
          <aside aria-label="Detail panel" aria-live="polite" className="min-w-0 rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] p-4 lg:sticky lg:top-6 lg:self-start">
            <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>Detail panel · M{active.mission}</p>
            <h4 className={`${SERIF} mt-1 mb-3 text-[22px] leading-tight font-[450]`}>{active.label}</h4>
            <MethodDetail row={active} compact />
          </aside>
        )}
      </div>
    </div>
  );
}

/* ================================================================== 4.12 card + 4.15 modal */
export function MethodCard({ row, onOpen }: { row: MethodRow; onOpen?: () => void }) {
  return (
    <article className="flex h-full flex-col rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] transition-[border-color] duration-200 hover:border-[var(--rule-strong)]">
      <div className="p-5">
        <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>{FAMILY[row.family].name} · Mission {row.mission}</p>
        <h4 className={`${SERIF} mt-2 text-[22px] leading-[1.15] font-[450] text-[var(--ink)] sm:text-[26px]`}>{row.label.replace(/ \(M\d, /, " (").replace("(", "· ").replace(")", "")}</h4>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className={caption}>PR-AUC</p>
            <p className={`${MONO} text-[34px] leading-none text-[var(--ink)]`}>{row.prAuc.toFixed(3)}</p>
          </div>
          <Trend row={row} />
        </div>
        <div className="mt-3"><ApBar ap={row.prAuc} mission={row.mission} /></div>
        <p className={`${caption} mt-2`}>ROC-AUC <span className={`${MONO} text-[var(--ink)]`}>{row.rocAuc.toFixed(3)}</span> · {row.scoring}</p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--rule)] px-5 py-3">
        <span className={`${SANS} text-[12px] text-[var(--muted)]`}>{FAMILY[row.family].by}</span>
        {onOpen && <button type="button" onClick={onOpen} className={`${btnSecondary} min-h-8 px-3 text-[13px]`}>Details</button>}
      </div>
    </article>
  );
}

export function CardModalDemo({ rows }: { rows: MethodRow[] }) {
  const toast = useToast();
  const picks = [rows.find((r) => r.method === "GMM" && r.mission === 1)!, rows.find((r) => r.method === "TransformerVAE" && r.mission === 2)!];
  const [open, setOpen] = useState<MethodRow | null>(null);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {picks.map((r) => <MethodCard key={r.id} row={r} onOpen={() => setOpen(r)} />)}
      </div>
      <Dialog
        open={!!open}
        onClose={() => setOpen(null)}
        kicker={open ? `${FAMILY[open.family].name} · Mission ${open.mission}` : ""}
        title={open?.label ?? ""}
        footer={<>
          <button type="button" className={btnSecondary} onClick={() => setOpen(null)}>Close</button>
          <button type="button" data-autofocus className={btnPrimary} onClick={() => { setOpen(null); toast({ title: "Added to comparison", body: `${open?.label} is pinned to the PR viewer.` }); }}>Compare on the PR chart</button>
        </>}
      >
        {open && <MethodDetail row={open} />}
      </Dialog>
    </>
  );
}

/* ================================================================== 4.14 badge */
export function BadgeDemo() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
      <span className={`${SANS} inline-flex items-center gap-2 text-[14px] font-medium`}>Anomaly events <CountBadge n={200} label="events on Mission 1" /></span>
      <span className="relative inline-flex">
        <span className={`${btnIcon} border border-[var(--rule)]`} aria-label="Notes, 3 unread" role="img"><IconInfo size={16} /></span>
        <span className="absolute -top-1 -right-1"><CountBadge n={3} label="unread" /></span>
      </span>
      <span className={`${SANS} inline-flex items-center gap-1.5 rounded-[2px] border border-[var(--rule-strong)] px-1.5 py-0.5 text-[12px] font-medium`}><Dot color="var(--sage)" />Table 1 run</span>
      <span className={`${SANS} inline-flex items-center gap-1.5 rounded-[2px] border border-dashed border-[var(--rule-strong)] px-1.5 py-0.5 text-[12px] font-medium text-[var(--muted)]`}><Dot color="var(--ochre)" />Earlier saved run</span>
      <span className={`${MONO} rounded-[2px] bg-[var(--parchment)] px-1.5 py-0.5 text-[11px] text-[var(--ink)]`}>K = 21</span>
    </div>
  );
}

/* ================================================================== 4.16 slider */
export function SliderDemo() {
  const [k, setK] = useState(21);
  const ref = useRef<HTMLInputElement>(null);
  const id = useId();
  const zone = k <= 5 ? "subsystem level (4–5)" : k >= 18 && k <= 29 ? "group level (18–29)" : "between levels";
  return (
    <div className="max-w-[26rem]">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className={fieldLabel}>Mixture components</label>
        <output htmlFor={id} className={`${MONO} text-[14px]`}>K = {k}</output>
      </div>
      <input ref={ref} id={id} type="range" min={2} max={30} value={k} onChange={(e) => setK(+e.target.value)} className="rpd-range mt-2 w-full" style={{ ["--p" as string]: `${((k - 2) / 28) * 100}%` }} aria-valuetext={`K = ${k}, ${zone}`} />
      <p className={fieldHelp}>{k === 21 ? "K = 21 is the BIC minimum on Mission 1." : `K = ${k} sits at the ${zone}.`}</p>
    </div>
  );
}

/* ================================================================== Parts of an Interface */
export function HeroSpecimen() {
  const toast = useToast();
  return (
    <div className="overflow-hidden rounded-[3px] border border-[var(--rule)] bg-[var(--paper)]">
      <div className="flex items-center gap-2 border-b border-[var(--rule)] px-3 py-2">
        <MenuButton label="Open navigation" icon={<IconMenu />} panel={(close) => <NavPanel close={close} />} />
        <span className={`${SERIF} text-[16px] font-medium`}>ESA telemetry</span>
        <span className={`${SANS} ml-auto hidden text-[13px] text-[var(--muted)] sm:inline`}>Madhogarhia &amp; Watkins · 2026</span>
        <MoreMenu items={[{ label: "Copy link", hint: "⌘L", run: () => toast({ title: "Link copied" }) }, { label: "Cite Table 1", run: () => toast({ title: "Citation copied" }) }, { label: "Download scores", hint: "not saved", disabled: true }]} />
      </div>
      <div className="px-5 py-8 sm:px-10 sm:py-10">
        <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>Finding</p>
        <h4 className={`${SERIF} mt-3 max-w-[18ch] text-[clamp(2.2rem,5vw,3.6rem)] leading-[0.98] font-light tracking-[-0.025em]`}>18 to 29 modes, <span className="whitespace-nowrap"><i className="font-normal">not</i> 4 or 5.</span></h4>
        <p className={`${SERIF} mt-4 max-w-[46ch] text-[17px] leading-[1.55] text-[var(--ink)]`}>ESA telemetry has real latent structure at the operational-group level, and that is why one global detector keeps raising false alarms.</p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button type="button" className={btnPrimary} onClick={() => toast({ title: "Latent map opened" })}>Explore the latent map <IconArrow /></button>
          <button type="button" className={btnQuiet}>Read the paper</button>
        </div>
      </div>
    </div>
  );
}

const NAV = [["1", "The finding"], ["2", "Five method families"], ["3", "Latent structure"], ["4", "Anomaly timeline"], ["5", "Limitations"]];
function NavPanel({ close }: { close: () => void }) {
  return (
    <nav aria-label="Site" className="w-[15rem] rounded-[3px] border border-[var(--ink)] bg-[var(--mount)] py-2 shadow-[var(--lift)]">
      <ol>
        {NAV.map(([n, t], i) => (
          <li key={n}>
            <a href="#parts" onClick={close} aria-current={i === 0 ? "page" : undefined} className={`${SANS} ${FOCUS} flex items-baseline gap-2.5 px-3.5 py-2 text-[14px] text-[var(--muted)] transition-colors duration-200 hover:bg-[var(--parchment)] hover:text-[var(--ink)] aria-[current=page]:font-semibold aria-[current=page]:text-[var(--ink)]`}>
              <span className={`${MONO} text-[11px]`}>§{n}</span>{t}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function MenusDemo() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap items-start gap-6">
      <div>
        <p className={`${caption} mb-2`}>Menu ≡ · opens navigation</p>
        <MenuButton label="Open navigation" icon={<IconMenu />} buttonClass={`${btnSecondary} px-3`} panel={(close) => <NavPanel close={close} />}><span>Contents</span></MenuButton>
      </div>
      <div>
        <p className={`${caption} mb-2`}>More ⋮ · actions on this figure</p>
        <div className="inline-flex items-center gap-1 rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] py-1 pr-1 pl-3">
          <span className={`${SANS} text-[13px] font-medium`}>Figure 3 · GMM score</span>
          <MoreMenu align="left" items={[
            { label: "Copy PR-AUC", hint: "0.384", run: () => toast({ title: "Copied 0.384" }) },
            { label: "Open in explorer", run: () => toast({ title: "Explorer opened" }) },
            { label: "Download scores", hint: "not saved", disabled: true },
          ]} />
        </div>
      </div>
    </div>
  );
}

export function ToastDemo() {
  const toast = useToast();
  const [pinned, setPinned] = useState(0);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className={btnSecondary} onClick={() => { setPinned((p) => p + 1); toast({ title: "TransformerVAE pinned", body: "Best Mission 2 PR-AUC, 0.438.", action: { label: "Undo", run: () => setPinned((p) => Math.max(0, p - 1)) } }); }}>Pin TransformerVAE</button>
      <span className={`${MONO} text-[12px] text-[var(--muted)]`} aria-live="polite">pinned: {pinned}</span>
      <p className={`${caption} basis-full`}>Leaves on its own after 5 s; the hairline at its foot is the timer, and hovering or focusing pauses it.</p>
    </div>
  );
}

export function BannerDemo() {
  const [open, setOpen] = useState(true);
  return open ? (
    <div role="note" className="flex items-start gap-3 rounded-[3px] border border-[var(--ink)] bg-[var(--parchment)] px-4 py-3">
      <IconInfo size={14} className="mt-[3px] shrink-0 text-[var(--ink)]" />
      <p className={`${SANS} min-w-0 flex-1 text-[13.5px] leading-[1.5] text-[var(--ink)]`}>
        <span className="font-semibold">Some curves come from earlier saved runs.</span> They are labelled, and the Table 1 number sits beside each one.
      </p>
      <button type="button" aria-label="Dismiss banner" onClick={() => setOpen(false)} className={`${btnIcon} -my-1.5 -mr-1.5 size-8`}><IconCross /></button>
    </div>
  ) : (
    <div className="flex items-center gap-3 rounded-[3px] border border-dashed border-[var(--rule-strong)] px-4 py-3">
      <p className={`${caption} flex-1`}>Banner dismissed. It stays gone until you bring it back.</p>
      <button type="button" className={btnQuiet} onClick={() => setOpen(true)}>Show again</button>
    </div>
  );
}

export function TooltipDemo() {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
      <p className={`${SERIF} text-[17px]`}>
        Mission 1{" "}
        <Tooltip tip="Area under the precision–recall curve. Chance is the 11.1% positive rate.">
          {(p) => <button type="button" {...p} className={`${FOCUS} rounded-[2px] border-b border-dotted border-[var(--ink)] ${MONO} text-[15px] hover:bg-[var(--parchment)]`}>PR-AUC</button>}
        </Tooltip>{" "}
        is 0.384 for the GMM.
      </p>
      <Tooltip tip="Rhea Madhogarhia built the baselines; Hewitt Watkins the GMM and VAEs." side="bottom">
        {(p) => <button type="button" {...p} aria-label="About the authors" className={`${btnIcon} border border-[var(--rule)]`}><IconInfo size={15} /></button>}
      </Tooltip>
    </div>
  );
}

export function AccordionDemo() {
  return (
    <Accordion items={[
      { q: "Why PR-AUC and not ROC-AUC?", a: <>Anomalies are about 11% of Mission 1 timesteps, so ROC-AUC flatters every detector. PR-AUC (average precision) is the primary metric; ROC-AUC sits beside it.</> },
      { q: "What is an operational group?", a: <>ESA splits each subsystem (power, attitude control…) into finer groups such as battery charging. Mission 1 has 4 subsystems and 18 groups; Mission 2 has 5 and 29.</> },
      { q: "Why do GMM and the VAEs use different splits?", a: <>The GMM fits an 800K-row random sample; the VAEs train on a 90/10 temporal split of pure-nominal windows. Every metric is still on the ESA-ADB test set.</> },
    ]} />
  );
}

export function SkeletonDemo() {
  const [loaded, setLoaded] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className={caption}>{loaded ? "Loaded" : "Loading the method card"}</p>
        <button type="button" className={`${btnSecondary} min-h-8 px-3 text-[13px]`} onClick={() => setLoaded((l) => !l)}>{loaded ? "Show skeleton" : "Finish loading"}</button>
      </div>
      <div className="mt-3 rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] p-5" aria-busy={!loaded}>
        {loaded ? (
          <div className="rpd-fade">
            <p className={`${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>Generative · Mission 2</p>
            <p className={`${SERIF} mt-2 text-[24px] leading-tight font-[450]`}>HierarchicalVAE · K = 28</p>
            <p className={`${MONO} mt-4 text-[30px] leading-none`}>0.434</p>
            <p className={`${caption} mt-2`}>PR-AUC · Recon. MSE</p>
          </div>
        ) : (
          <div aria-hidden>
            <div className="rpd-skel h-3 w-32" />
            <div className="rpd-skel mt-3 h-6 w-56" />
            <div className="rpd-skel mt-5 h-8 w-24" />
            <div className="rpd-skel mt-3 h-3 w-40" />
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="grid justify-items-start gap-3 rounded-[3px] border border-dashed border-[var(--rule-strong)] px-5 py-8">
      <svg aria-hidden width="44" height="30" viewBox="0 0 44 30"><path d="M1 29h42M1 29V1" stroke="var(--ink)" strokeWidth=".75" /><path d="M4 26c8-1 10-12 18-12s10 9 20 8" fill="none" stroke="var(--rule-strong)" strokeDasharray="2 3" /></svg>
      <p className={`${SERIF} text-[20px] leading-tight font-[450]`}>{title}</p>
      <p className={`${SANS} max-w-[40ch] text-[13.5px] leading-[1.5] text-[var(--muted)]`}>{body}</p>
      {action}
    </div>
  );
}

/* ================================================================== section 6: UI states simulator */
type UiState = "empty" | "loading" | "error" | "success";
export function UiStates({ rows }: { rows: MethodRow[] }) {
  const [s, setS] = useState<UiState>("success");
  const [attempt, setAttempt] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const load = (fail: boolean) => {
    clearTimeout(timer.current);
    setS("loading");
    timer.current = setTimeout(() => setS(fail ? "error" : "success"), 1400);
  };
  const simulate = () => { const n = attempt + 1; setAttempt(n); load(n % 2 === 1); };
  const m2 = rows.filter((r) => r.mission === 2);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="UI state" value={s} onChange={(v) => { clearTimeout(timer.current); setS(v); }} options={(["empty", "loading", "error", "success"] as const).map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))} />
        <button type="button" className={btnSecondary} onClick={simulate}>Simulate a fetch</button>
        <span className={`${MONO} text-[12px] text-[var(--muted)]`}>{attempt ? `attempt ${attempt} → ${attempt % 2 ? "fails" : "succeeds"}` : "odd attempts fail"}</span>
      </div>
      <div className="mt-4 min-h-[268px] rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] p-4 sm:p-5" aria-live="polite" aria-busy={s === "loading"}>
        <p className={`${MONO} mb-3 text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`}>Mission 2 · Table 1 rows</p>
        {s === "empty" && <EmptyState title="No runs scored yet" body="Mission 2 has no saved scores in this view. Load Table 1 to see its four rows, or start from the GMM." action={<button type="button" className={btnSecondary} onClick={() => load(false)}>Load Table 1</button>} />}
        {s === "loading" && (
          <div aria-label="Loading">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-[1fr_4rem] items-center gap-4 border-b border-[var(--rule)] py-3">
                <div><div className="rpd-skel h-3.5" style={{ width: `${70 - i * 9}%` }} /><div className="rpd-skel mt-2 h-2.5 w-28" /></div>
                <div className="rpd-skel h-3.5" />
              </div>
            ))}
            <p className={`${caption} mt-3`}>Loading saved scores…</p>
          </div>
        )}
        {s === "error" && (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-[3px] border border-[var(--oxblood)] bg-[#F7EDE8] p-5">
            <p className={`${SANS} inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--oxblood)]`}><IconWarn size={14} /> Couldn’t load the scores</p>
            <p className={`${SANS} max-w-[46ch] text-[13.5px] leading-[1.5] text-[var(--ink)]`}>The score file for this run wasn’t found. Nothing was lost: Table 1 still has the number. Try again, or read the row instead.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnSecondary} onClick={() => { const n = attempt + 1; setAttempt(n); load(false); }}>Try again</button>
              <button type="button" className={btnQuiet} onClick={() => setS("empty")}>Cancel</button>
            </div>
          </div>
        )}
        {s === "success" && (
          <div className="rpd-fade">
            <p className={`${SANS} mb-2 inline-flex items-center gap-2 text-[13px] font-medium text-[var(--sage)]`}><IconCheck size={12} /> Loaded {m2.length} rows</p>
            <ul className="border-t border-[var(--ink)]">
              {m2.map((r) => (
                <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-[var(--rule)] py-2.5">
                  <span className="min-w-0"><span className={`${SANS} block truncate text-[14px] font-medium`}>{r.label}</span><span className={`${SANS} block text-[12px] text-[var(--muted)]`}>{r.scoring}</span></span>
                  <span className={`${MONO} text-[14px]`}>{r.prAuc.toFixed(3)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== section 3: motion specimen */
export function MotionDemo() {
  const [on, setOn] = useState(false);
  const rows: [string, string, string, string][] = [
    ["Control state", "200ms", "ease-out", "transition-[left] duration-200 ease-out"],
    ["Reveal", "300ms", "cubic-bezier(.22,.61,.36,1)", "transition-[left] duration-300 ease-[cubic-bezier(.22,.61,.36,1)]"],
    ["Line draw-in", "1800ms", "same curve, once", "transition-[left] duration-[1800ms] ease-[cubic-bezier(.22,.61,.36,1)]"],
  ];
  return (
    <div>
      <div className="space-y-3">
        {rows.map(([n, d, e, cls]) => (
          <div key={n} className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[9rem_10rem_minmax(0,1fr)]">
            <span className={`${SANS} text-[13px] font-medium`}>{n}</span>
            <span className={`${MONO} hidden text-[12px] text-[var(--muted)] sm:block`}>{d} · {e.length > 18 ? "(.22,.61,.36,1)" : e}</span>
            <span className="relative h-5 border-b border-[var(--rule-strong)]">
              <span className={`absolute bottom-[-5px] block size-[9px] rounded-full border-[1.5px] border-[var(--ink)] bg-[var(--paper)] ${cls}`} style={{ left: on ? "calc(100% - 9px)" : "0px" }} />
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" className={btnSecondary} onClick={() => setOn((o) => !o)}>{on ? "Send them back" : "Play the three curves"}</button>
        <p className={caption}>No bounce, no loop, nothing on autoplay. With reduced motion, every one of these lands instantly.</p>
      </div>
    </div>
  );
}
