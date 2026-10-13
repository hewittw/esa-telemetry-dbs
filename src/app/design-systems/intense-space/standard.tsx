"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Row, Tree } from "./data";
import {
  BTN,
  BTN_FORCED,
  Br,
  Button,
  CHIP_FORCED,
  Check,
  Chip,
  Count,
  DOT,
  FIELD,
  FIELD_FORCED,
  FR,
  Field,
  LABEL,
  MONO,
  Modal,
  MoreMenu,
  Panel,
  Radio,
  Range,
  SW_TRACK,
  Segmented,
  Select,
  Status,
  Switch,
  TAB_FORCED,
  TRANS,
  Tabs,
  Tip,
  useToast,
} from "./ui";

const short = (m: string) => m.replace("TransformerVAE", "TVAE").replace("HierarchicalVAE", "HVAE").replace("CapacityVAE", "CapVAE").replace("Nystroem-KPCA", "KPCA");
const fam = (f: string) => (f === "baseline" ? "Baseline" : f === "parametric" ? "Parametric" : "Generative");

/* ======================================================================
   4 · Components
   ====================================================================== */
export function Components({ rows, tree }: { rows: Row[]; tree: Tree }) {
  const toast = useToast();
  const [compare, setCompare] = useState(false);
  const [modal, setModal] = useState<Row | null>(null);

  // fields
  const [q, setQ] = useState("ch 12");
  const allCh = useMemo(
    () => tree[1].subsystems.flatMap((s) => s.groups.flatMap((g) => g.channels.map((c) => ({ ...c, sub: s.name, group: g.group })))),
    [tree],
  );
  const hit = allCh.find((c) => c.ch === q.trim().toLowerCase().replace(/^channel[_ ]?/, "ch ").replace(/^ch(\d)/, "ch $1"));
  const bad = q.trim() !== "" && !hit;
  const [method, setMethod] = useState("TransformerVAE (M2, lat. K = 18)");
  const sel = rows.find((r) => r.label === method)!;

  // selection controls
  const [showAll, setShowAll] = useState(false);
  const [faults, setFaults] = useState(true);
  const [tau, setTau] = useState("99");
  const [grid, setGrid] = useState(true);
  const [motion, setMotion] = useState(false);

  // chips
  const [fams, setFams] = useState<string[]>(["parametric", "generative"]);
  const [mis, setMis] = useState<1 | 2>(2);
  const shown = rows.filter((r) => fams.includes(r.family) && r.mission === mis).sort((a, b) => b.prAuc - a.prAuc);

  // list rows
  const m2 = rows.filter((r) => r.mission === 2).sort((a, b) => b.prAuc - a.prAuc);
  const [cur, setCur] = useState(m2[0].label);

  // slider
  const [k, setK] = useState(21);

  const tvae = rows.find((r) => r.method === "TransformerVAE" && r.mission === 2)!;

  return (
    <div className="grid gap-3 md:grid-flow-dense md:grid-cols-2 lg:grid-flow-row lg:grid-cols-12">
      {/* 4.1 buttons + links */}
      <Panel
        id="c-buttons"
        code="4.1"
        title="Buttons & links"
        className="md:col-span-2 lg:col-span-7"
        spec={{
          use: "Primary: the one action per view, the only Fiber Green on screen. Secondary: bracketed, hairline. Ghost: tertiary. Link: inline, underline on a hairline.",
          tokens: "Fragment Mono 11 / 0.14em caps · min-h 40 · r 3 · hover → Frost border, pressed → Charcoal + 1px drop · 200ms",
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={() => toast("Opening the latent map for Mission 2 (TVAE, 18 modes).")}>
            Explore the latent map <span aria-hidden>→</span>
          </Button>
          <Button bracket onClick={() => toast("Paper: Madhogarhia & Watkins, TTIC 31220. Opened in a new tab (simulated).", "info")}>
            Read the paper
          </Button>
          <Button variant="ghost" onClick={() => toast("Methods appendix copied to clipboard (simulated).")}>
            Copy BibTeX
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button bracket aria-pressed={compare} onClick={() => setCompare((c) => !c)}>
            {compare ? "Comparing M1 + M2" : "Compare missions"}
          </Button>
          <Button variant="primary" disabled>
            Export run <span aria-hidden>→</span>
          </Button>
          <Button bracket disabled>
            No scores saved
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`${LABEL} mr-1 text-(--is-steel)`}>Icon buttons</span>
          {[
            ["≡", "Open menu"],
            ["⋮", "More actions"],
            ["✕", "Close"],
            ["❚❚", "Pause"],
            ["↻", "Replay"],
          ].map(([g, l]) => (
            <button
              key={l}
              type="button"
              aria-label={l}
              title={l}
              onClick={() => toast(`${l} (icon button, 40×40 target).`, "info")}
              className={`${MONO} ${TRANS} inline-flex size-10 items-center justify-center rounded-[2px] border border-(--is-line) text-[15px] text-(--is-frost) hover:border-(--is-frost) active:translate-y-px active:bg-(--is-charcoal) ${FR}`}
            >
              {g}
            </button>
          ))}
          <button type="button" aria-label="Disabled icon button" disabled className={`${MONO} inline-flex size-10 cursor-not-allowed items-center justify-center rounded-[2px] border border-(--is-line) text-[15px] text-[#5f676e]`}>
            ⋮
          </button>
        </div>
        <p className="mt-auto max-w-[60ch] text-[16px] leading-[1.45] text-(--is-frost)">
          The GMM bottoms out at <strong className="font-semibold">K = 21</strong>, close to the 18 operational groups. See{" "}
          <a href="#t-bic" className={`rounded-[2px] underline decoration-(--is-steel) underline-offset-4 ${TRANS} hover:decoration-(--is-frost) active:opacity-70 ${FR}`}>
            the BIC sweep
          </a>{" "}
          or{" "}
          <a href="#t-table" className={`${MONO} rounded-[2px] text-[11px] uppercase tracking-[0.12em] text-(--is-frost) underline decoration-(--is-line) underline-offset-4 ${TRANS} hover:decoration-(--is-frost) active:opacity-70 ${FR}`}>
            Table 1 ↘
          </a>
        </p>
      </Panel>

      {/* 4.2 fields */}
      <Panel
        id="c-fields"
        code="4.2"
        title="Text input & select"
        className="lg:col-span-5"
        spec={{
          use: "Input: find one channel by name. Select: pick from a fixed list of 5+ options (fewer → segmented).",
          tokens: "Host Grotesk 14 · Void fill · 1px Hairline → #5A6066 hover → Frost focus · invalid = Magenta border + ■ word",
        }}
      >
        <Field label="Find a Mission 1 channel" htmlFor="isd-ch" error={bad ? `No “${q.trim()}” in Mission 1 (76 channels: ch 1 – ch 76)` : undefined} hint={hit ? `${hit.ch} · ${hit.sub} · group ${hit.group} · ${hit.unit}` : "Try ch 12 or ch 41"}>
          <input id="isd-ch" value={q} onChange={(e) => setQ(e.target.value)} aria-invalid={bad} aria-describedby="isd-ch-msg" placeholder="ch 41" autoComplete="off" spellCheck={false} className={FIELD} />
        </Field>
        <Field label="Table 1 run" htmlFor="isd-run" hint={`PR-AUC ${sel.prAuc.toFixed(3)} · ROC-AUC ${sel.rocAuc.toFixed(3)} · ${sel.scoring}`}>
          <Select id="isd-run" value={method} onChange={setMethod} options={rows.map((r) => ({ v: r.label, t: r.label }))} />
        </Field>
        <Field label="Mission 3 (disabled)" htmlFor="isd-m3" hint="Not in the ESA-ADB release.">
          <input id="isd-m3" disabled placeholder="Unavailable" className={FIELD} />
        </Field>
      </Panel>

      {/* 4.3 selection controls */}
      <Panel
        id="c-select"
        code="4.3"
        title="Checkbox · radio · switch"
        className="md:col-span-2 lg:col-span-7"
        spec={{
          use: "Checkbox: independent options. Radio: one of a few. Switch: instant on/off with the state word beside it.",
          tokens: "16px marks · Steel ring → Frost on hover/checked · Void check on Frost · switch track 36×20 · labels Host Grotesk 14",
        }}
      >
        <div className="grid gap-6 sm:grid-cols-3">
          <fieldset className="flex flex-col">
            <legend className={`${LABEL} mb-2 text-(--is-steel)`}>Curves</legend>
            <Check checked={showAll} onChange={setShowAll} label="Show non-Table 1 runs" hint={showAll ? "33 saved curves" : "5 Table 1 curves"} />
            <Check checked={faults} onChange={setFaults} label="Shade labelled faults" />
            <Check checked={false} onChange={() => {}} disabled label="Event F1" hint="Baselines only" />
          </fieldset>
          <fieldset className="flex flex-col">
            <legend className={`${LABEL} mb-2 text-(--is-steel)`}>Threshold</legend>
            {[
              ["95", "τ95 · 95th pct"],
              ["99", "τ99 · 99th pct"],
              ["999", "τ99.9 · 99.9th pct"],
            ].map(([v, t]) => (
              <Radio key={v} name="isd-tau" value={v} checked={tau === v} onChange={setTau} label={t} disabled={v === "999"} />
            ))}
          </fieldset>
          <div className="flex flex-col">
            <p className={`${LABEL} mb-2 text-(--is-steel)`}>Display</p>
            <Switch checked={grid} onChange={setGrid} label="Dot grid" />
            <Switch checked={motion} onChange={setMotion} label="Reduce motion" />
            <Switch checked={false} onChange={() => {}} label="Live stream" disabled />
          </div>
        </div>
        <p className={`${MONO} rounded-[2px] border border-dashed border-(--is-line) px-3 py-2 text-[11px] tracking-[0.04em] text-(--is-steel)`}>
          Readout: {showAll ? "33" : "5"} curves · faults {faults ? "shaded" : "hidden"} · τ{tau === "95" ? "95" : "99"} = {tau === "99" ? "36.24 NLL (M1 GMM)" : "lower bar, more alarms"} · grid {grid ? "on" : "off"}
        </p>
      </Panel>

      {/* 4.4 slider */}
      <Panel
        id="c-slider"
        code="4.4"
        title="Slider"
        className="lg:col-span-5"
        spec={{ use: "Scrub one continuous or stepped value; always paired with a live readout.", tokens: "2px track, Frost fill to the thumb · 14px square thumb, 3px Void halo · arrow keys step 1" }}
      >
        <div className="flex items-end justify-between gap-4">
          <label htmlFor="isd-k" className={`${LABEL} text-(--is-steel)`}>
            GMM components K
          </label>
          <span className={`${DOT} text-[44px] font-semibold leading-[0.8] text-(--is-frost)`}>{String(k).padStart(2, "0")}</span>
        </div>
        <Range id="isd-k" min={2} max={30} value={k} onChange={setK} label="GMM components K" valueText={`K = ${k}`} />
        <div className={`${MONO} flex justify-between text-[10px] uppercase tracking-[0.12em] text-(--is-steel)`}>
          <span>2</span>
          <span className={k >= 4 && k <= 5 ? "text-(--is-frost)" : ""}>4–5 subsystems</span>
          <span className={k >= 18 && k <= 29 ? "text-(--is-frost)" : ""}>18–29 groups</span>
          <span>30</span>
        </div>
        <Range min={2} max={30} value={12} onChange={() => {}} label="Disabled slider" disabled />
      </Panel>

      {/* 4.5 tabs */}
      <Panel
        id="c-tabs"
        code="4.5"
        title="Tabs"
        className="md:col-span-2 lg:col-span-6"
        spec={{ use: "Switch between peer views of one object. Arrow keys move; the selected tab carries a 2px Frost rule.", tokens: "Mono 11 caps · Steel → Frost · 2px underline · 24px gap" }}
      >
        <Tabs
          label="Finding views"
          disabled={["raw"]}
          tabs={[
            {
              id: "finding",
              t: "Finding",
              body: (
                <p className="max-w-[52ch] text-[16px] leading-[1.45] text-(--is-frost)">
                  Telemetry has latent structure at the operational-group level (18–29 modes), not the subsystem level (4–5). That is why global detectors plateau at
                  PR-AUC 0.322.
                </p>
              ),
            },
            {
              id: "methods",
              t: "Methods",
              body: (
                <p className="max-w-[52ch] text-[16px] leading-[1.45] text-(--is-frost)">
                  K-Means, PCA, Nyström-KPCA as baselines; a full-covariance GMM on 30 PCA components; three VAEs (Capacity, Hierarchical, Transformer) trained on
                  nominal 32-step windows.
                </p>
              ),
            },
            {
              id: "missions",
              t: "Missions",
              body: (
                <p className="max-w-[52ch] text-[16px] leading-[1.45] text-(--is-frost)">
                  M1: 76 channels, 7.4M timesteps, genuine faults. M2: 100 channels, 3.1M timesteps, ≈95% rare operational events.
                </p>
              ),
            },
            { id: "raw", t: "Raw CSV", body: null },
          ]}
        />
      </Panel>

      {/* 4.6 chips */}
      <Panel
        id="c-chips"
        code="4.6"
        title="Filter chips"
        className="md:col-span-2 lg:col-span-6"
        spec={{ use: "Narrow a list by several independent facets. Selected chips turn Survey Teal (they filter data) and gain a filled dot.", tokens: "Pill r 999 · Mono 11 caps · ○ → ● · Teal 1px outline" }}
      >
        <div className="flex flex-wrap items-center gap-2">
          {["baseline", "parametric", "generative"].map((f) => (
            <Chip key={f} on={fams.includes(f)} onClick={() => setFams((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]))}>
              {fam(f)}
            </Chip>
          ))}
          <Chip on={false} disabled>
            Supervised
          </Chip>
          <span className="ml-auto">
            <Segmented label="Mission" value={mis} onChange={setMis} options={[{ v: 1, t: "M1" }, { v: 2, t: "M2" }]} />
          </span>
        </div>
        <ul className={`${MONO} divide-y divide-(--is-line) border-y border-(--is-line) text-[11px] uppercase tracking-[0.1em]`} aria-live="polite">
          {shown.length ? (
            shown.map((r) => (
              <li key={r.label} className="flex items-baseline justify-between gap-3 py-2">
                <span className="text-(--is-frost)">{short(r.method)}</span>
                <span className="text-(--is-steel)">{r.scoring}</span>
                <span className="text-(--is-frost)">{r.prAuc.toFixed(3)}</span>
              </li>
            ))
          ) : (
            <li className="py-3 normal-case tracking-[0.02em] text-(--is-steel)">
              No Mission {mis} runs in that mix. {mis === 2 && fams.length === 1 && fams[0] === "baseline" ? "Baselines were run on M1 only." : "Turn a family back on."}
            </li>
          )}
        </ul>
        <p className={`${LABEL} text-(--is-steel)`}>
          {shown.length} of {rows.filter((r) => r.mission === mis).length} Mission {mis} rows
        </p>
      </Panel>

      {/* 4.7 card */}
      <Panel
        id="c-card"
        code="4.7"
        title="Card · method"
        className="lg:col-span-4"
        spec={{ use: "One method on one mission, clickable to its detail. ⋮ holds the secondary actions.", tokens: "Panel #121316 · 1px Hairline + 4px corner ticks · Doto 600 for the one number · hover border #4A4F55" }}
      >
        <article className="group/card is-corners relative rounded-[2px] border border-(--is-line) bg-(--is-void) transition-colors duration-300 hover:border-[#4a4f55] has-[button.isd-open:active]:bg-(--is-panel)">
          <div className="flex items-start justify-between gap-2 px-4 pt-3">
            <p className={`${LABEL} pt-2 text-(--is-steel)`}>[ M2 · TVAE · lat. K = 18 ]</p>
            <MoreMenu
              label="More actions for TransformerVAE M2"
              items={[
                { t: "Open detail", on: () => setModal(tvae) },
                { t: "Copy citation", on: () => toast("Citation copied: Madhogarhia & Watkins, Table 1, TVAE M2.") },
                { t: "Compare with GMM", on: () => {}, disabled: true },
              ]}
            />
          </div>
          <button type="button" onClick={() => setModal(tvae)} className={`isd-open block w-full rounded-[2px] px-4 pb-4 pt-1 text-left ${FR} focus-visible:outline-offset-[-2px]`}>
            <span className="block text-[22px] font-semibold leading-[1.05] tracking-[-0.02em] text-(--is-frost)">Transformer VAE</span>
            <span className="mt-1 block text-[13px] text-(--is-steel)">Generative · Neg. ELBO · 33 tokens</span>
            <span className="mt-5 flex items-end justify-between gap-3">
              <span>
                <span className={`${LABEL} block text-(--is-steel)`}>PR-AUC</span>
                <span className={`${DOT} block text-[46px] font-semibold leading-[0.85] text-(--is-frost)`}>0.438</span>
              </span>
              <Status kind="best">Top PR-AUC · M2</Status>
            </span>
            <span className={`${MONO} mt-4 flex items-center justify-between border-t border-(--is-line) pt-3 text-[11px] uppercase tracking-[0.12em] text-(--is-steel)`}>
              <span>ROC-AUC 0.749</span>
              <span className={`${TRANS} text-(--is-frost) group-hover/card:translate-x-0.5`}>Detail →</span>
            </span>
          </button>
        </article>
      </Panel>

      {/* 4.8 list rows */}
      <Panel
        id="c-list"
        code="4.8"
        title="List rows"
        className="lg:col-span-4"
        spec={{ use: "A ranked, scannable set. One row can be current; the whole row is the target.", tokens: "48px rows · hairline rules · hover Panel fill · current = 2px Frost left bar + aria-current" }}
      >
        <ol className="-mx-1 flex flex-col">
          {m2.map((r, i) => (
            <li key={r.label}>
              <button
                type="button"
                aria-current={cur === r.label ? "true" : undefined}
                onClick={() => setCur(r.label)}
                className={`group grid min-h-12 w-full grid-cols-[2rem_1fr_auto] items-center gap-2 rounded-[2px] border-b border-(--is-line) px-2 text-left ${TRANS} hover:bg-(--is-void) active:bg-(--is-charcoal) aria-[current]:bg-(--is-void) aria-[current]:shadow-[inset_2px_0_0_var(--is-frost)] ${FR} focus-visible:outline-offset-0`}
              >
                <span className={`${MONO} text-[11px] text-(--is-steel)`}>{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] text-(--is-frost)">{short(r.method)}</span>
                  <span className={`${MONO} block text-[10px] uppercase tracking-[0.1em] text-(--is-steel)`}>{r.scoring}</span>
                </span>
                <span className={`${MONO} text-[13px] text-(--is-frost)`}>{r.prAuc.toFixed(3)}</span>
              </button>
            </li>
          ))}
        </ol>
      </Panel>

      {/* 4.9 badges */}
      <Panel
        id="c-badges"
        code="4.9"
        title="Badges & status"
        className="md:col-span-2 lg:col-span-4"
        spec={{ use: "Count badge for a number on a control; status = icon + word + color, never color alone.", tokens: "Count: Frost fill, Void mono 10 · Status: ● Green live, ■ Magenta fault, ◆ Teal top PR-AUC (highest of all rows on a mission), ◇ Frost best VAE (Table 1's bold among VAEs), ○ Steel nominal" }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={`${BTN.secondary} group`}>
            <Br>Anomaly events</Br>
            <Count n={200} label="events in Mission 1" />
          </button>
          <span className={`${MONO} inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-(--is-frost)`}>
            Rare events <Count n={613} label="rare events in Mission 2" />
          </span>
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
          <li>
            <Status kind="live">Live · M2 stream</Status>
          </li>
          <li>
            <Status kind="fault" />
          </li>
          <li>
            <Status kind="rare" />
          </li>
          <li>
            <Status kind="nominal" />
          </li>
          <li>
            <Status kind="best">Top PR-AUC M1 · GMM</Status>
          </li>
          <li>
            <Status kind="vae">Best VAE M1 · TVAE</Status>
          </li>
        </ul>
      </Panel>

      {/* 4.10 modal */}
      <Panel
        id="c-modal"
        code="4.10"
        title="Modal dialog"
        className="md:col-span-2 lg:col-span-12"
        bodyClass="sm:flex-row sm:items-center sm:justify-between"
        spec={{
          use: "A focused detail that must be dismissed: scrim, focus trapped inside, Esc or ✕ closes, focus returns to the opener. Sheet from the bottom on phones.",
          tokens: "Scrim Void 80% + 6px blur · Panel with corner ticks · max 560 · slide up 12px / 260ms",
        }}
      >
        <p className="max-w-[60ch] text-[16px] leading-[1.45] text-(--is-frost)">Open a method&apos;s detail. Tab stays inside the dialog; Esc closes it and returns focus here.</p>
        <div className="flex flex-wrap gap-3">
          <Button bracket onClick={() => setModal(rows.find((r) => r.method === "GMM" && r.mission === 1)!)}>
            GMM · M1 detail
          </Button>
          <Button bracket onClick={() => setModal(tvae)}>
            TVAE · M2 detail
          </Button>
        </div>
      </Panel>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal ? modal.label : ""} kicker={modal ? `[ ${fam(modal.family)} · Mission ${modal.mission} ]` : ""}>
        {modal ? <MethodDetail r={modal} onDone={() => (setModal(null), toast(`${short(modal.method)} M${modal.mission} pinned to the comparison.`))} /> : null}
      </Modal>
    </div>
  );
}

export function MethodDetail({ r, onDone }: { r: Row; onDone: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[2px] border border-(--is-line) bg-(--is-line)">
        {[
          ["PR-AUC", r.prAuc.toFixed(3)],
          ["ROC-AUC", r.rocAuc.toFixed(3)],
          ["Scoring", r.scoring],
          ["Latent K", r.latentK ?? "—"],
        ].map(([k, v]) => (
          <div key={k as string} className="bg-(--is-panel) p-3">
            <p className={`${LABEL} text-(--is-steel)`}>{k}</p>
            <p className={`${k === "PR-AUC" || k === "ROC-AUC" ? `${DOT} text-[32px] font-semibold leading-[1]` : "text-[16px] leading-[1.4]"} mt-1 text-(--is-frost)`}>{v}</p>
          </div>
        ))}
      </div>
      <p className="text-[16px] leading-[1.45] text-(--is-frost)">
        Trend vs the K-Means baseline:{" "}
        <span className="font-semibold">{r.trendDirection === "best" ? `best VAE on Mission ${r.mission}, as bolded in the paper` : r.trend}</span>
        {(r.method === "GMM" && r.mission === 1) || (r.method === "TransformerVAE" && r.mission === 2) ? `, and the highest PR-AUC of any Mission ${r.mission} row` : ""}. The linear plateau sits at PR-AUC 0.322; a random detector would score the positive rate ({r.mission === 1 ? "0.111" : "0.047"}).
      </p>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={onDone}>
          Pin to comparison <span aria-hidden>→</span>
        </Button>
        <a href="#t-table" className={`group ${BTN.secondary}`}>
          <Br>Open in Table 1</Br>
        </a>
      </div>
    </div>
  );
}

/* ======================================================================
   5 · Control states (forced, side by side)
   ====================================================================== */
const STATES = ["Rest", "Hover", "Focus", "Pressed", "Selected", "Disabled"] as const;
type St = (typeof STATES)[number];

function ToggleForced({ s }: { s: St }) {
  const on = s === "Selected";
  const track =
    s === "Disabled" ? "border-(--is-line)" : on ? "border-(--is-frost) bg-(--is-frost)" : s === "Hover" || s === "Pressed" ? "border-(--is-frost)" : "border-(--is-steel)";
  const knob = s === "Disabled" ? "bg-(--is-line) translate-x-[3px]" : on ? "bg-(--is-void) translate-x-[19px]" : s === "Hover" ? "bg-(--is-frost) translate-x-[3px]" : "bg-(--is-steel) translate-x-[3px]";
  return (
    <span className={`inline-flex min-h-10 items-center gap-2 rounded-[2px] px-1 ${s === "Focus" ? "outline-2 outline-offset-2 outline-(--is-frost)" : ""}`}>
      <span className={`${SW_TRACK} ${track} ${s === "Pressed" ? "scale-95" : ""}`}>
        <span className={`absolute top-[3px] size-3 rounded-full ${knob}`} />
      </span>
      <span className={`${LABEL} ${s === "Disabled" ? "text-[#5f676e]" : on ? "text-(--is-frost)" : "text-(--is-steel)"}`}>{on ? "On" : "Off"}</span>
    </span>
  );
}

export function ControlStates() {
  const rows: { name: string; note: string; render: (s: St) => ReactNode }[] = [
    {
      name: "Primary button",
      note: "No selected state: an action, not a toggle.",
      render: (s) =>
        s === "Selected" ? (
          <span className={`${MONO} text-[11px] text-(--is-steel)`}>n/a</span>
        ) : (
          <span className={BTN_FORCED.primary[s]}>Explore →</span>
        ),
    },
    { name: "Secondary button", note: "Selected = pressed toggle (aria-pressed), Frost fill.", render: (s) => <span className={BTN_FORCED.secondary[s]}>[ Compare ]</span> },
    {
      name: "Filter chip",
      note: "Selected is the only Teal state on a control.",
      render: (s) => (
        <span className={CHIP_FORCED[s]}>
          <span aria-hidden className={s === "Selected" ? "" : "opacity-40"}>
            {s === "Selected" ? "●" : "○"}
          </span>
          Generative
        </span>
      ),
    },
    { name: "Tab", note: "Pressed shows a Charcoal rule before the click lands.", render: (s) => <span className={TAB_FORCED[s]}>Methods</span> },
    {
      name: "Segmented",
      note: "Selected = Frost fill, Void text (13:1).",
      render: (s) => (
        <span className="inline-flex rounded-[3px] border border-(--is-line) p-0.5">
          <span
            className={`${MONO} inline-flex min-h-8 items-center rounded-[2px] px-3 text-[11px] uppercase tracking-[0.12em] ${
              s === "Selected"
                ? "bg-(--is-frost) text-(--is-void)"
                : s === "Hover"
                  ? "text-(--is-frost)"
                  : s === "Pressed"
                    ? "bg-(--is-charcoal) text-(--is-frost)"
                    : s === "Disabled"
                      ? "text-[#5f676e]"
                      : "text-(--is-steel)"
            } ${s === "Focus" ? "outline-2 outline-offset-1 outline-(--is-frost)" : ""}`}
          >
            M2
          </span>
        </span>
      ),
    },
    {
      name: "Text input",
      note: "“Selected” here is the invalid state: Magenta border + ■ word.",
      render: (s) => <span className={`${FIELD_FORCED[s]} flex items-center ${s === "Disabled" ? "" : "text-(--is-frost)"}`}>{s === "Selected" ? (
          <>
            ch 99
            <span className={`${MONO} ml-auto pl-2 text-[10px] uppercase tracking-[0.1em] text-(--is-fault)`}>■ Invalid</span>
          </>
        ) : s === "Rest" || s === "Disabled" ? <span className="text-(--is-steel)">ch 41</span> : "ch 4"}</span>,
    },
    { name: "Switch", note: "Selected = on; the word On/Off always sits beside it.", render: (s) => <ToggleForced s={s} /> },
  ];
  return (
    <div className="is-corners overflow-hidden rounded-[2px] border border-(--is-line) bg-(--is-panel)" aria-label="Control states, forced for comparison" role="group">
      <div className={`hidden grid-cols-[180px_repeat(6,minmax(0,1fr))] border-b border-(--is-line) xl:grid`}>
        <span className={`${LABEL} px-4 py-2.5 text-(--is-steel)`}>Control</span>
        {STATES.map((s) => (
          <span key={s} className={`${LABEL} border-l border-(--is-line) px-4 py-2.5 text-(--is-frost)`}>
            {s}
          </span>
        ))}
      </div>
      {rows.map((r) => (
        <div key={r.name} className="grid border-b border-(--is-line) last:border-b-0 xl:grid-cols-[180px_repeat(6,minmax(0,1fr))]">
          <div className="px-4 pb-1 pt-4 xl:py-4">
            <p className={`${LABEL} text-(--is-frost)`}>{r.name}</p>
            <p className="mt-1 text-[13px] leading-snug text-(--is-steel)">{r.note}</p>
          </div>
          <div className="grid grid-cols-2 gap-px sm:grid-cols-3 xl:contents">
            {STATES.map((s) => (
              <div key={s} aria-hidden className="flex min-h-24 flex-col items-start justify-between gap-2 px-4 py-3 xl:border-l xl:border-(--is-line)">
                <span className={`${LABEL} text-(--is-steel) xl:hidden`}>{s}</span>
                <div className="w-full max-w-[180px]">{r.render(s)}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ======================================================================
   6 · UI states: side by side + a live simulator
   ====================================================================== */
type UiS = "empty" | "loading" | "error" | "success";

function StateBody({ s, onRetry, onShowAll }: { s: UiS; onRetry?: () => void; onShowAll?: () => void }) {
  if (s === "empty")
    return (
      <div className="flex flex-col items-start gap-3">
        <span aria-hidden className={`${DOT} text-[34px] font-semibold leading-none text-(--is-steel)`}>00</span>
        <p className="text-[16px] font-semibold leading-tight text-(--is-frost)">No runs match these filters.</p>
        <p className="text-[14px] leading-snug text-(--is-steel)">Baselines were only run on Mission 1. Switch mission or add a method family.</p>
        <button type="button" onClick={onShowAll} className={`group ${BTN.secondary}`}>
          <Br>Show all M2 runs</Br>
        </button>
      </div>
    );
  if (s === "loading")
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <p className={`${MONO} text-[11px] uppercase tracking-[0.12em] text-(--is-frost)`}>
          Scoring 3,062,401 timesteps
          <span className="isd-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="isd-skel h-3 w-8" />
            <span className="isd-skel h-3 flex-1" style={{ maxWidth: `${80 - i * 14}%` }} />
            <span className="isd-skel h-3 w-10" />
          </div>
        ))}
      </div>
    );
  if (s === "error")
    return (
      <div className="flex flex-col items-start gap-3" role="alert">
        <Status kind="fault">Couldn’t load scores</Status>
        <p className="text-[16px] font-semibold leading-tight text-(--is-frost)">tvae_run1_m2.npz didn’t respond.</p>
        <p className="text-[14px] leading-snug text-(--is-steel)">Nothing was lost. The other five runs are cached.</p>
        <button type="button" onClick={onRetry} className={`group ${BTN.secondary}`}>
          <Br>Try again</Br>
        </button>
      </div>
    );
  return (
    <div className="flex flex-col gap-3">
      <p className={`${MONO} text-[11px] uppercase tracking-[0.12em] text-(--is-frost)`}>
        <span aria-hidden>✓ </span>6 saved Mission 2 runs loaded · Table 1 PR-AUC
      </p>
      <ul className={`${MONO} divide-y divide-(--is-line) text-[11px] uppercase tracking-[0.1em]`}>
        {[
          ["TVAE", "0.438"],
          ["HVAE", "0.434"],
          ["CapVAE", "0.414"],
        ].map(([m, v]) => (
          <li key={m} className="flex justify-between py-1.5">
            <span className="text-(--is-frost)">{m}</span>
            <span className="text-(--is-frost)">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function UiStates() {
  const [s, setS] = useState<UiS>("success");
  const [sim, setSim] = useState(false);
  const timers = useRef<number[]>([]);
  const toast = useToast();
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const at = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
  const load = (to: UiS) => {
    clear();
    setS("loading");
    at(1400, () => setS(to));
  };
  const simulate = () => {
    clear();
    setSim(true);
    setS("empty");
    at(1600, () => setS("loading"));
    at(3200, () => setS("error"));
    at(5200, () => setS("loading"));
    at(6600, () => (setS("success"), setSim(false), toast("Simulation finished: empty → loading → error → retry → success.")));
  };
  const opts: { v: UiS; t: string }[] = [
    { v: "empty", t: "Empty" },
    { v: "loading", t: "Loading" },
    { v: "error", t: "Error" },
    { v: "success", t: "Success" },
  ];
  return (
    <div className="grid gap-3 lg:grid-cols-12">
      <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7 xl:grid-cols-2">
        {opts.map((o) => (
          <div key={o.v} className="is-corners flex min-h-56 flex-col rounded-[2px] border border-(--is-line) bg-(--is-panel)">
            <p className={`${LABEL} border-b border-(--is-line) px-4 py-2.5 text-(--is-frost)`}>[ 6.{opts.indexOf(o) + 1} ] {o.t}</p>
            <div className="flex-1 p-4" inert>
              <StateBody s={o.v} />
            </div>
          </div>
        ))}
      </div>
      <Panel
        id="c-sim"
        code="6.5"
        title="Live simulator"
        className="lg:col-span-5"
        spec={{
          use: "Empty says why and offers the first move; loading names what is happening; error keeps the user's place and offers Try again; success confirms the count.",
          tokens: "Skeleton = Panel+1 #1A1C20 with a slow scan sweep · error ■ Magenta + word · success ✓ Frost",
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Segmented label="UI state" value={s} onChange={(v) => (clear(), setSim(false), setS(v))} options={opts} />
          <Button variant="primary" onClick={simulate} disabled={sim}>
            {sim ? "Simulating…" : "Simulate"} <span aria-hidden>▶</span>
          </Button>
        </div>
        <div className="min-h-56 rounded-[2px] border border-(--is-line) bg-(--is-void) p-4" aria-live="polite">
          <StateBody s={s} onRetry={() => load("success")} onShowAll={() => load("success")} />
        </div>
      </Panel>
    </div>
  );
}

/* ======================================================================
   Parts of an Interface
   ====================================================================== */
export function Parts({ strands }: { strands: { s: number; a: number }[] }) {
  const toast = useToast();
  const [banner, setBanner] = useState(true);
  const [menu, setMenu] = useState(false);
  const [view, setView] = useState<"pr" | "roc" | "f1">("pr");
  const [skel, setSkel] = useState(true);
  const [acc, setAcc] = useState<number | null>(0);
  const [empty, setEmpty] = useState(true);
  const menuBtn = useRef<HTMLButtonElement>(null);

  return (
    <div className="grid gap-3 md:grid-flow-dense md:grid-cols-2 lg:grid-flow-row lg:grid-cols-12">
      {/* hero */}
      <Panel id="p-hero" code="P.01" title="Hero" className="md:col-span-2 lg:col-span-8" bodyClass="p-0 sm:p-0" spec={{ use: "The opening viewport: one finding, one primary action, 70% of the frame left to real data.", tokens: "Charcoal field + grain · Display 600 −4.5% · headline anchored bottom-left" }}>
        <div className="relative isolate flex min-h-[340px] flex-col justify-end overflow-hidden bg-(--is-charcoal) p-5 sm:min-h-[380px] sm:p-7">
          <svg aria-hidden viewBox="0 0 300 100" preserveAspectRatio="none" className="absolute inset-0 -z-10 h-full w-full">
            {strands.map((st, i) =>
              st.a > 0.6 || st.s > 0.45 || i % 2 === 0 ? (
                <line
                  key={i}
                  x1={i + 0.5}
                  x2={i + 0.5 + (st.a > 0.6 ? 3 : st.s * 2)}
                  y1="0"
                  y2="100"
                  stroke={st.a > 0.6 ? "#E04FD6" : "#37FD08"}
                  strokeOpacity={st.a > 0.6 ? 0.45 + st.a * 0.5 : 0.08 + st.s ** 2.4 * 0.85}
                  strokeWidth={st.a > 0.95 ? 1.6 : st.s > 0.93 ? 2.6 : 0.8}
                  vectorEffect="non-scaling-stroke"
                />
              ) : null,
            )}
          </svg>
          <div aria-hidden className="isd-grain absolute inset-0 -z-10" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,#0A0B0D_8%,rgba(10,11,13,0.6)_45%,transparent_80%)]" />
          <p className={`${LABEL} mb-4 text-(--is-frost)`}>[ ESA Mission 2 · 100 channels · 3.1M timesteps ]</p>
          <p className="max-w-[16ch] text-[clamp(34px,4.6vw,64px)] font-semibold leading-[0.92] tracking-[-0.045em] text-(--is-frost)">Structure lives at the group level.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="primary" onClick={() => toast("Opening the latent map (simulated).")}>
              Explore the latent map <span aria-hidden>→</span>
            </Button>
            <Button bracket>Read the paper</Button>
          </div>
        </div>
      </Panel>

      {/* menu ≡ */}
      <Panel id="p-menu" code="P.02" title="Menu ≡" className="lg:col-span-4" spec={{ use: "Phones: the full nav collapses behind ≡. Opens a sheet; Esc or ✕ closes; focus returns to ≡.", tokens: "40×40 target · sheet Void · items Host Grotesk 22" }}>
        <div className="relative mx-auto flex h-[320px] w-full max-w-[300px] flex-1 flex-col overflow-hidden rounded-[3px] border border-(--is-line) bg-(--is-void) lg:h-auto lg:min-h-[320px]">
          <div className={`${MONO} flex h-11 items-center justify-between border-b border-(--is-line) px-3 text-[11px] uppercase tracking-[0.14em] text-(--is-frost)`}>
            <span>ESA · Latent</span>
            <button
              ref={menuBtn}
              type="button"
              aria-expanded={menu}
              aria-controls="isd-demo-menu"
              aria-label={menu ? "Close menu" : "Open menu"}
              onClick={() => setMenu((m) => !m)}
              className={`inline-flex size-10 items-center justify-center rounded-[2px] text-[18px] ${TRANS} hover:bg-(--is-panel) active:bg-(--is-charcoal) aria-expanded:bg-(--is-panel) ${FR} focus-visible:outline-offset-[-2px]`}
            >
              {menu ? "✕" : "≡"}
            </button>
          </div>
          {menu ? (
            <nav
              id="isd-demo-menu"
              aria-label="Demo site menu"
              className="isd-pop absolute inset-x-0 bottom-0 top-11 flex flex-col gap-1 bg-(--is-void) p-3"
              onKeyDown={(e) => e.key === "Escape" && (setMenu(false), menuBtn.current?.focus())}
            >
              {["Finding", "Methods", "Missions", "Anomalies"].map((t, i) => (
                <a
                  key={t}
                  href="#p-menu"
                  onClick={(e) => (e.preventDefault(), setMenu(false), menuBtn.current?.focus())}
                  className={`flex min-h-11 items-baseline gap-3 rounded-[2px] border-b border-(--is-line) px-1 text-[22px] font-semibold tracking-[-0.02em] text-(--is-frost) ${TRANS} hover:pl-2 ${FR}`}
                >
                  <span className={`${MONO} text-[11px] text-(--is-steel)`}>0{i + 1}</span>
                  {t}
                </a>
              ))}
              <button type="button" onClick={() => (setMenu(false), toast("Opening the paper (simulated).", "info"))} className={`${BTN.primary} mt-auto w-full`}>
                Read the paper →
              </button>
            </nav>
          ) : (
            <div className="flex flex-1 flex-col gap-3 p-4">
              <p className={`${MONO} text-[10px] uppercase tracking-[0.14em] text-(--is-steel)`}>[ 300px phone frame ]</p>
              <p className="text-[26px] font-semibold leading-[0.95] tracking-[-0.04em] text-(--is-frost)">Structure lives at the group level.</p>
              <p className="text-[13px] leading-snug text-(--is-steel)">GMM picks K = 21 modes on Mission 1, near its 18 groups.</p>
              <p className={`${MONO} mt-auto border-t border-(--is-line) pt-3 text-[11px] uppercase tracking-[0.12em] text-(--is-frost)`}>
                <span aria-hidden>↗ </span>Press ≡ to open the menu
              </p>
            </div>
          )}
        </div>
      </Panel>

      {/* segmented */}
      <Panel id="p-seg" code="P.03" title="Segmented control" className="lg:col-span-4" spec={{ use: "2–4 mutually exclusive views of the same data. Arrow keys move.", tokens: "Hairline frame p 2 · selected Frost fill · r 3/2" }}>
        <Segmented label="Metric" value={view} onChange={setView} options={[{ v: "pr", t: "PR-AUC" }, { v: "roc", t: "ROC-AUC" }, { v: "f1", t: "Event F1" }]} />
        <p className={`${DOT} text-[52px] font-semibold leading-[0.85] text-(--is-frost)`}>{view === "pr" ? "0.438" : view === "roc" ? "0.749" : "n/a"}</p>
        <p className="text-[13px] text-(--is-steel)">TVAE · Mission 2{view === "f1" ? " · event F1 was only computed for baselines" : ""}</p>
      </Panel>

      {/* toast + banner */}
      <Panel id="p-toast" code="P.04" title="Toast & banner" className="md:col-span-2 lg:col-span-8" spec={{ use: "Toast: confirms an action and leaves on its own (4.2s, drain line). Banner: a condition that stays until dismissed.", tokens: "Panel, 1px Hairline · ✓ Frost / ◆ Teal / ■ Magenta + word · bottom-right, max 3" }}>
        <div className="flex flex-wrap gap-3">
          <Button bracket onClick={() => toast("Threshold set to τ99 = 36.24 NLL.")}>
            Show toast
          </Button>
          <Button bracket onClick={() => toast("Run tvae_run1_m2 failed to load.", "fault")}>
            Show fault toast
          </Button>
          <Button variant="ghost" onClick={() => setBanner(true)} disabled={banner}>
            Restore banner
          </Button>
        </div>
        {banner ? (
          <div role="region" aria-label="Notice" className="flex items-start gap-3 rounded-[2px] border border-(--is-teal) bg-(--is-void) p-3.5">
            <span aria-hidden className={`${MONO} pt-0.5 text-[12px] text-(--is-teal)`}>◆</span>
            <p className="min-w-0 flex-1 text-[14px] leading-snug text-(--is-frost)">
              <span className={`${MONO} mr-2 text-[11px] uppercase tracking-[0.12em] text-(--is-teal)`}>Note</span>
              GMM and VAE rows use different fitting protocols from the 80/20 baseline split. Compare within a family first.
            </p>
            <button type="button" aria-label="Dismiss notice" onClick={() => setBanner(false)} className={`${MONO} -mt-1 size-9 shrink-0 rounded-[2px] text-[14px] text-(--is-steel) ${TRANS} hover:text-(--is-frost) active:bg-(--is-charcoal) ${FR}`}>
              ✕
            </button>
          </div>
        ) : (
          <p className={`${MONO} text-[11px] uppercase tracking-[0.12em] text-(--is-steel)`}>Banner dismissed. It stays gone until restored.</p>
        )}
      </Panel>

      {/* skeleton */}
      <Panel id="p-skel" code="P.05" title="Skeleton screen" className="lg:col-span-4" spec={{ use: "Placeholder shaped like the content that is coming, so nothing jumps.", tokens: "#1A1C20 blocks, r 2 · slow scan sweep 1.6s · static when reduced motion" }}>
        <Switch checked={skel} onChange={setSkel} label="Loading" />
        {skel ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading method card">
            <span className="isd-skel h-3 w-1/2" />
            <span className="isd-skel h-6 w-4/5" />
            <span className="isd-skel h-12 w-1/3" />
            <span className="isd-skel h-3 w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className={`${LABEL} text-(--is-steel)`}>[ M1 · GMM K = 21 ]</p>
            <p className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-(--is-frost)">Gaussian mixture</p>
            <p className={`${DOT} text-[44px] font-semibold leading-[0.85] text-(--is-frost)`}>0.384</p>
            <p className="text-[13px] text-(--is-steel)">PR-AUC · highest of any Mission 1 row</p>
          </div>
        )}
      </Panel>

      {/* tooltip */}
      <Panel id="p-tip" code="P.06" title="Tooltip" className="lg:col-span-4" spec={{ use: "A definition on demand. Opens on hover AND keyboard focus; Esc closes.", tokens: "Void box, 1px Hairline · Mono 11 · 10px gap · fade + 4px rise" }}>
        <p className="pt-8 text-[16px] leading-[1.6] text-(--is-frost)">
          TVAE reaches <Tip label="PR-AUC" tip="Area under the precision–recall curve (average precision). Random = the positive rate: 0.047 on M2." /> 0.438 at{" "}
          <Tip label="τ99" tip="Alarm threshold: the 99th percentile of the training score. M1 GMM: 36.24 NLL." />.
        </p>
        <dl className="mt-auto flex flex-col border-t border-(--is-line)">
          {[
            ["BIC", "Bayesian information criterion: fit minus a cost per parameter. Lowest at K = 21 (M1) and 29 (M2).", "Model selection"],
            ["ARI", "Adjusted Rand index: agreement between two labelings. GMM vs subsystems 0.047; vs groups 0.094.", "Agreement"],
            ["GMM-OOD", "Score a VAE's latent codes by their negative log-likelihood under a GMM fitted to training latents.", "VAE scoring"],
          ].map(([t, tip, w]) => (
            <div key={t} className="flex min-h-11 items-center justify-between gap-3 border-b border-(--is-line)">
              <dt className={`${MONO} text-[11px] uppercase tracking-[0.12em] text-(--is-frost)`}>
                <Tip label={t} tip={tip} />
              </dt>
              <dd className="text-[13px] text-(--is-steel)">{w}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      {/* accordion */}
      <Panel id="p-acc" code="P.07" title="Accordion" className="lg:col-span-4" spec={{ use: "Stacked detail the reader opens one at a time.", tokens: "Hairline rules · + rotates to × · height eased 300ms" }}>
        <div className="border-t border-(--is-line)">
          {[
            ["Why PR-AUC, not ROC-AUC?", "Faults are rare (11% of M1, 4.7% of M2). ROC-AUC flatters a detector that floods false alarms; PR-AUC does not."],
            ["What is the linear plateau?", "K-Means, PCA and PCA + K-Means all land at PR-AUC ≈ 0.322. Linear structure alone stops there."],
            ["Why do VAEs win on M2 only?", "M2 labels are ≈95% rare operational events, closer to what reconstruction error catches."],
          ].map(([q, a], i) => (
            <div key={q} className="border-b border-(--is-line)">
              <h4>
                <button
                  type="button"
                  aria-expanded={acc === i}
                  aria-controls={`isd-acc-${i}`}
                  onClick={() => setAcc(acc === i ? null : i)}
                  className={`group flex min-h-12 w-full items-center justify-between gap-3 rounded-[2px] text-left text-[15px] font-medium text-(--is-frost) ${TRANS} hover:text-white active:opacity-70 ${FR}`}
                >
                  {q}
                  <span aria-hidden className={`${MONO} text-[16px] text-(--is-steel) transition-transform duration-300 group-aria-expanded:rotate-45`}>
                    +
                  </span>
                </button>
              </h4>
              <div id={`isd-acc-${i}`} className="isd-acc" data-open={acc === i} inert={acc !== i}>
                <div>
                  <p className="pb-4 text-[14px] leading-[1.5] text-(--is-steel)">{a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* empty state */}
      <Panel id="p-empty" code="P.08" title="Empty state" className="lg:col-span-4" spec={{ use: "Says what is empty and why, teaches, and offers the first move.", tokens: "Doto 00 in Steel · one heading · one secondary action" }}>
        {empty ? (
          <div className="flex flex-col items-start gap-3">
            <span aria-hidden className={`${DOT} text-[40px] font-semibold leading-none text-(--is-steel)`}>00</span>
            <p className="text-[18px] font-semibold leading-tight tracking-[-0.01em] text-(--is-frost)">No pinned methods yet.</p>
            <p className="text-[14px] leading-snug text-(--is-steel)">Pin two runs to compare their PR curves side by side.</p>
            <button type="button" onClick={() => setEmpty(false)} className={`group ${BTN.secondary}`}>
              <Br>Pin GMM + TVAE</Br>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <ul className={`${MONO} divide-y divide-(--is-line) border-y border-(--is-line) text-[11px] uppercase tracking-[0.1em]`}>
              <li className="flex justify-between py-2 text-(--is-frost)">
                <span>GMM · M1</span>
                <span>0.384</span>
              </li>
              <li className="flex justify-between py-2 text-(--is-frost)">
                <span>TVAE · M2</span>
                <span>0.438</span>
              </li>
            </ul>
            <Button variant="ghost" onClick={() => setEmpty(true)}>
              Clear pins
            </Button>
          </div>
        )}
      </Panel>

      {/* emphasize by de-emphasizing */}
      <Panel id="p-emph" code="P.11" title="Emphasize by de-emphasizing" className="md:col-span-2 lg:col-span-8" spec={{ use: "The primary action wins because everything else is quieter, not because it is louder.", tokens: "One Fiber Green per view · secondary hairline · tertiary Steel text" }}>
        <div className="grid flex-1 grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-[1fr_1fr_minmax(0,0.9fr)]">
          <div className="flex flex-col gap-2 rounded-[2px] border border-dashed border-(--is-line) p-3" inert>
            <p className={`${LABEL} text-(--is-steel)`}>✕ Before</p>
            <span className={`${BTN.primary} min-h-8 px-2 text-[10px]`}>Explore</span>
            <span className={`${BTN.primary} min-h-8 px-2 text-[10px]`}>Paper</span>
            <span className={`${BTN.primary} min-h-8 px-2 text-[10px]`}>BibTeX</span>
          </div>
          <div className="flex flex-col gap-2 rounded-[2px] border border-(--is-line) p-3" inert>
            <p className={`${LABEL} text-(--is-frost)`}>✓ After</p>
            <span className={`${BTN.primary} min-h-8 px-2 text-[10px]`}>Explore →</span>
            <span className={`${BTN.secondary} min-h-8 px-2 text-[10px]`}>[ Paper ]</span>
            <span className={`${BTN.ghost} min-h-8 px-2 text-[10px]`}>BibTeX</span>
          </div>
          <div className="flex flex-col justify-end gap-2 min-[400px]:col-span-2 lg:col-span-1 lg:pl-2">
            <p className="text-[18px] font-semibold leading-tight tracking-[-0.01em] text-(--is-frost)">One loud thing per view.</p>
            <p className="text-[13px] leading-snug text-(--is-steel)">Before, three greens compete. After, one green, one hairline and one gray read in order: explore first, the paper second, the citation last.</p>
          </div>
        </div>
      </Panel>

      {/* focus ring */}
      <Panel id="p-focus" code="P.09" title="Keyboard focus ring" className="lg:col-span-6" spec={{ use: "Every control shows the same ring on keyboard focus only (focus-visible), never removed.", tokens: "2px Frost outline, 2px offset (1px inside segmented and fields)" }}>
        <p className="text-[14px] leading-snug text-(--is-steel)">Press Tab here: the ring walks through four different controls and looks identical on each.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button bracket>Secondary</Button>
          <Chip on>Generative</Chip>
          <a href="#p-focus" className={`${MONO} rounded-[2px] text-[11px] uppercase tracking-[0.12em] text-(--is-frost) underline decoration-(--is-line) underline-offset-4 ${FR}`}>
            Link
          </a>
        </div>
        <div className="mt-auto grid grid-cols-2 gap-3 border-t border-(--is-line) pt-4" inert>
          {[
            ["Rest", ""],
            ["Focus-visible · forced", "outline-2 outline-offset-2 outline-(--is-frost)"],
          ].map(([t, ring]) => (
            <div key={t} className="flex flex-col items-start gap-3">
              <p className={`${MONO} text-[10px] uppercase tracking-[0.14em] text-(--is-steel)`}>{t}</p>
              <span className={`${BTN.secondary} ${ring}`}>[ Read the paper ]</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* color alone */}
      <Panel id="p-color" code="P.10" title="Don’t use color alone" className="lg:col-span-6" spec={{ use: "Every status pairs color with a glyph and a word, so it reads in grayscale and for color-blind readers.", tokens: "■ fault · □ rare event · ○ nominal · ● live · ◆ top PR-AUC · ◇ best VAE" }}>
        <ul className="flex flex-col divide-y divide-(--is-line) border-y border-(--is-line)">
          {[
            ["2009-05-25", "Longest M1 anomaly · 967 h", "fault"],
            ["M2 · class 19", "353 rare operational events", "rare"],
            ["M1 · slice 140", "Score below τ99", "nominal"],
          ].map(([a, b, k]) => (
            <li key={a} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0">
                <span className={`${MONO} block text-[10px] uppercase tracking-[0.12em] text-(--is-steel)`}>{a}</span>
                <span className="block text-[14px] text-(--is-frost)">{b}</span>
              </span>
              <Status kind={k as "fault"} />
            </li>
          ))}
        </ul>
      </Panel>

    </div>
  );
}



