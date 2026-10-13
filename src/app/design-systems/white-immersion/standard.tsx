"use client";
// Sections 1–6 and "Parts of an Interface": tokens, standard components, control states, UI states.
import { useEffect, useMemo, useRef, useState } from "react";
import type { DSData, Row } from "./data";
import { Accordion, Circle, Corners, GlyphLoader, Icon, Menu, Modal, Segmented, StatusTag, Switch, Tabs, Tip, fmt, useReduced, useToast } from "./kit";
import { Section, Spec, StateCell, useShell } from "./shell";

/* ---------- WCAG contrast, computed, never typed ---------- */
function lum(hex: string) {
  const c = hex.replace("#", "").match(/.{2}/g)!.map((x) => parseInt(x, 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function ratio(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
const C = { bg: "#F4F6F8", surface: "#FFFFFF", rime: "#D5DCE4", muted: "#56616F", ink: "#111824", signal: "#2FE0E3", dis: "#7B8794", edge: "#E3E8EE" };
const famWord: Record<string, string> = { baseline: "Baseline", parametric: "Parametric", generative: "Generative" };
const short = (m: string) => m.replace("HierarchicalVAE", "HVAE").replace("TransformerVAE", "TVAE").replace("CapacityVAE", "CapVAE").replace("Nystroem-KPCA", "KPCA");
const grid2 = "grid gap-5 md:grid-cols-2";

/* ====================================================================== */
/* 1 · Color roles                                                         */
/* ====================================================================== */
const ROLES = [
  { role: "Background", name: "Whiteout", hex: C.bg, on: C.ink, onName: "Ink", use: "The field. Vignettes to #E3E8EE at the edges." },
  { role: "Surface", name: "Frost", hex: C.surface, on: C.ink, onName: "Ink", use: "Ice slabs, HUD glass (78% + 12px blur), dialogs." },
  { role: "Text", name: "Ink", hex: C.ink, on: C.surface, onName: "Frost", use: "Body, values, icons, focus rings, selected fills." },
  { role: "Muted text", name: "Glacier", hex: C.muted, on: C.surface, onName: "Frost", use: "Labels, captions, HUD keys. Never lighter than this." },
  { role: "Border", name: "Rime", hex: C.rime, on: C.ink, onName: "Ink", use: "1px hairlines only. Never carries meaning alone." },
  { role: "Accent", name: "Signal", hex: C.signal, on: C.ink, onName: "Ink", use: "Primary action fill only. Never text, never decoration." },
];
const PAIRS: { fg: string; bg: string; fgN: string; bgN: string; job: string; min: number }[] = [
  { fg: C.ink, bg: C.bg, fgN: "Ink", bgN: "Whiteout", job: "Body on the field", min: 4.5 },
  { fg: C.ink, bg: C.surface, fgN: "Ink", bgN: "Frost", job: "Body on slabs", min: 4.5 },
  { fg: C.muted, bg: C.surface, fgN: "Glacier", bgN: "Frost", job: "Labels on slabs", min: 4.5 },
  { fg: C.muted, bg: C.bg, fgN: "Glacier", bgN: "Whiteout", job: "Labels on the field", min: 4.5 },
  { fg: C.muted, bg: C.edge, fgN: "Glacier", bgN: "Vignette edge", job: "Worst-case field corner", min: 4.5 },
  { fg: C.ink, bg: C.signal, fgN: "Ink", bgN: "Signal", job: "Primary action label", min: 4.5 },
  { fg: C.surface, bg: C.ink, fgN: "Frost", bgN: "Ink", job: "Selected fills, tooltips", min: 4.5 },
  { fg: C.dis, bg: C.surface, fgN: "Disabled", bgN: "Frost", job: "Disabled (exempt, kept ≥3)", min: 3 },
  { fg: C.signal, bg: C.surface, fgN: "Signal", bgN: "Frost", job: "Why cyan is never text", min: 99 },
  { fg: C.rime, bg: C.bg, fgN: "Rime", bgN: "Whiteout", job: "Hairline, decorative only", min: 99 },
];

export function ColorSection() {
  return (
    <Section id="color" n={1} title="Color roles" intro={<>Six colors, six jobs. White on white has no contrast, so separation comes from Rime hairlines and Ink. Signal cyan appears once per screen, on the primary action. Every ratio below is computed from the hex in the browser.</>}>
      <div className="grid gap-5">
        <Spec code="1.1" name="Palette" use="Pick by role, not by look. Each role has exactly one color." tokens="--bg --surface --ink --muted --rime --signal">
          <ul className="grid grid-cols-2 gap-px bg-[var(--rime)] sm:grid-cols-3 lg:grid-cols-6">
            {ROLES.map((r) => {
              const cr = ratio(r.on, r.hex);
              return (
                <li key={r.name} className="flex min-w-0 flex-col bg-[var(--surface)]">
                  <div className="relative flex h-[112px] items-end p-3" style={{ background: r.hex, color: r.on }}>
                    <span className="wids-num text-[20px]">{cr.toFixed(2)}</span>
                    <span className="ml-1.5 pb-[3px] text-[10.5px] uppercase tracking-[0.1em]">{r.onName}</span>
                  </div>
                  <div className="grid gap-0.5 p-3">
                    <span className="wids-label">{r.role}</span>
                    <span className="wids-title text-[13.5px]">{r.name}</span>
                    <span className="text-[12px] tabular-nums">{r.hex}</span>
                    <span className="wids-caption mt-1">{r.use}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Spec>
        <Spec code="1.2" name="Contrast pairs (WCAG 2.x, measured)" use="Every text style sits on one of these pairs. Body and labels need ≥ 4.5:1." tokens="ratio(fg, bg) computed from relative luminance">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-[12px]">
              <thead><tr className="wids-label border-b border-[var(--ink)]">
                <th className="py-2 pr-3 font-normal">Sample</th><th className="py-2 pr-3 font-normal">Pair</th><th className="py-2 pr-3 font-normal">Job</th><th className="py-2 pr-3 text-right font-normal">Ratio</th><th className="py-2 text-right font-normal">Result</th>
              </tr></thead>
              <tbody>
                {PAIRS.map((p) => {
                  const r = ratio(p.fg, p.bg);
                  const pass = p.min === 99 ? false : r >= p.min;
                  return (
                    <tr key={p.fgN + p.bgN} className="border-b border-[var(--rime)]">
                      <td className="py-2 pr-3"><span className="inline-block px-2 py-1 text-[12px]" style={{ background: p.bg, color: p.fg, boxShadow: "inset 0 0 0 1px #d5dce4" }}>{p.min === 99 ? "Aa · example" : "Aa 0.438"}</span></td>
                      <td className="py-2 pr-3">{p.fgN} on {p.bgN}</td>
                      <td className="wids-caption py-2 pr-3">{p.job}</td>
                      <td className="wids-num py-2 pr-3 text-right text-[14px]">{r.toFixed(2)}</td>
                      <td className="py-2 text-right">{p.min === 99 ? <StatusTag s="gap" label="Fill only" /> : pass ? <StatusTag s="best" label={p.min === 3 ? "≥ 3 ✓" : "AA ✓"} solid /> : <StatusTag s="anomaly" label="Fail" />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="wids-caption mt-3">Rows marked <span className="text-[var(--ink)]">Fill only</span> are deliberate low-contrast examples. Those pairs never carry text anywhere in the system.</p>
        </Spec>
      </div>
    </Section>
  );
}

/* ====================================================================== */
/* 2 · Type roles (each sample measures itself)                           */
/* ====================================================================== */
const TYPE = [
  { role: "Display", spec: "Michroma 400 · caps · +0.04em", cls: "wids-display text-[26px] leading-[1.12] tracking-[0.04em] sm:text-[34px]", sample: "Latent structure" },
  { role: "Heading", spec: "Michroma 400 · caps · +0.05em", cls: "wids-display text-[16px] leading-[1.3] tracking-[0.05em] sm:text-[17px]", sample: "GMM finds 21 modes in Mission 1" },
  { role: "Numeral", spec: "Michroma 400 · tabular", cls: "wids-num text-[32px] leading-none sm:text-[40px]", sample: "0.438" },
  { role: "Title", spec: "Martian Mono 500", cls: "wids-title", sample: "TransformerVAE · M2 · PR-AUC 0.438" },
  { role: "Body", spec: "Martian Mono 400", cls: "text-[13px] leading-[1.6]", sample: "Structure lives at the operational-group level (18–29 modes), not the subsystem level (4–5). Raising K past the subsystem count keeps lowering BIC until it reaches the number of groups." },
  { role: "Label", spec: "Martian Mono 400 · caps · +0.12em · Glacier", cls: "wids-label", sample: "Neg. log-likelihood · K = 21" },
  { role: "HUD", spec: "Martian Mono 300 · caps · +0.1em · Ink", cls: "wids-hud", sample: "Zoom 1.00× · Frame 0742 / 1500" },
  { role: "Caption", spec: "Martian Mono 300 · Glacier", cls: "wids-caption", sample: "Fig. 3a · longest test anomaly, 116,061 timesteps (~967 h), from 2009-05-25." },
];
function TypeRow({ t }: { t: (typeof TYPE)[number] }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [m, setM] = useState("");
  useEffect(() => {
    const f = () => {
      const s = getComputedStyle(ref.current!);
      const fs = parseFloat(s.fontSize), lh = parseFloat(s.lineHeight);
      const tr = s.letterSpacing === "normal" ? 0 : parseFloat(s.letterSpacing) / fs;
      setM(`${fs}px / ${Number.isFinite(lh) ? (lh / fs).toFixed(2) : "1.2"} · ${s.fontWeight} · ${tr ? `+${tr.toFixed(2)}em` : "0"}`);
    };
    f(); window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return (
    <li className="grid gap-2 border-b border-[var(--rime)] py-5 first:pt-0 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8">
      <div className="grid content-start gap-0.5">
        <span className="wids-title text-[13px]">{t.role}</span>
        <span className="wids-caption">{t.spec}</span>
        <span className="wids-hud wids-tick text-[var(--ink)]">{m || "—"}</span>
      </div>
      <p ref={ref} className={`${t.cls} min-w-0 break-words`}>{t.sample}</p>
    </li>
  );
}
export function TypeSection() {
  return (
    <Section id="type" n={2} title="Type roles" intro={<>Two families. Michroma, a squared techno face in the spirit of Igloo&apos;s wordmark, is for display and numerals only, six words max. Martian Mono carries everything else. Nothing is heavier than 500, and nothing renders below 10px. The readout under each role is measured live from the browser.</>}>
      <Spec code="2.1" name="Type scale, set in our content" use="Use a role by name. Never invent a size." tokens="--wi-display (Michroma) · --wi-mono (Martian Mono, variable 300–500)">
        <ul>{TYPE.map((t) => <TypeRow key={t.role} t={t} />)}</ul>
      </Spec>
    </Section>
  );
}

/* ====================================================================== */
/* 3 · Spacing, shape, shadow, motion                                      */
/* ====================================================================== */
const SPACE = [4, 8, 12, 16, 24, 32, 48, 72, 96];
function EaseDemo() {
  const reduced = useReduced();
  const [k, setK] = useState(0);
  const [run, setRun] = useState(0);
  const path = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 40; i++) { const t = i / 40; const x = 3 * 0.22 * (1 - t) ** 2 * t + 3 * 0.36 * (1 - t) * t * t + t ** 3; const y = 3 * 1 * (1 - t) ** 2 * t + 3 * 1 * (1 - t) * t * t + t ** 3; pts.push(`${(x * 200).toFixed(1)},${(100 - y * 100).toFixed(1)}`); }
    return "M" + pts.join("L");
  }, []);
  return (
    <div className="grid gap-4 sm:grid-cols-[220px_1fr] sm:items-center">
      <svg viewBox="-6 -6 212 112" className="w-full max-w-[220px]" aria-label="Easing curve cubic-bezier(0.22, 1, 0.36, 1): fast start, long settle">
        <path d="M0 100H200M0 0V100" stroke="#d5dce4" fill="none" />
        <path d={path} stroke="#111824" strokeWidth="1.4" fill="none" />
      </svg>
      <div className="grid gap-3">
        <div className="relative h-[34px] border-y border-[var(--rime)]">
          <span key={run} className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[var(--ink)]"
            style={{ left: `calc(${k * 100}% - ${k * 12}px)`, transition: reduced ? "none" : "left 900ms cubic-bezier(0.22, 1, 0.36, 1)" }} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="wids-btn" onClick={() => { setK(k ? 0 : 1); setRun(run + 1); }}><Icon n="play" size={12} />Play ease · 900ms</button>
          <span className="wids-caption">{reduced ? "Reduced motion: jumps, no tween." : "cubic-bezier(0.22, 1, 0.36, 1)"}</span>
        </div>
      </div>
    </div>
  );
}
export function SpaceSection() {
  return (
    <Section id="space" n={3} title="Spacing & shape" intro={<>Sparse and grouped: 8–12px inside a group, 24px or more between groups. Slabs have square corners. Only floating controls and the primary pill are round. One hairline plus a long cold drop is the only shadow.</>}>
      <div className={grid2}>
        <Spec code="3.1" name="Spacing scale" use="Inside a group 8–12. Between groups 24+. HUD sits 24 from the edge (12 on phones)." tokens="4 · 8 · 12 · 16 · 24 · 32 · 48 · 72 · 96 (px)">
          <ul className="grid gap-2">
            {SPACE.map((s) => (
              <li key={s} className="grid grid-cols-[40px_1fr] items-center gap-3">
                <span className="wids-label tabular-nums text-[var(--ink)]">{s}</span>
                <span className="block h-3 bg-[var(--ink)]" style={{ width: s * 2.4, maxWidth: "100%" }} />
              </li>
            ))}
          </ul>
        </Spec>
        <Spec code="3.2" name="Corners, borders, shadow" use="Square for anything that holds content. Round for anything that floats over the field." tokens="radius 0 / 999 · 1px Rime · 1px Ink hover · 2px Ink focus · 4px Ink selected rail">
          <div className="grid grid-cols-2 gap-5">
            <div className="grid gap-2"><div className="wids-slab h-[72px]" /><span className="wids-caption">Slab · radius 0 · 1px Rime · cold drop</span></div>
            <div className="grid gap-2"><div className="flex h-[72px] items-center gap-2"><span className="wids-circle"><Icon n="plus" /></span><span className="wids-pill is-sm pointer-events-none">Primary</span></div><span className="wids-caption">Float · radius 999 · glass</span></div>
            <div className="grid gap-2"><div className="h-[72px] border border-[var(--ink)]" /><span className="wids-caption">Hover · 1px Ink ring</span></div>
            <div className="grid gap-2"><div className="h-[72px] border border-[var(--rime)] bg-white" style={{ boxShadow: "inset 4px 0 0 #111824" }} /><span className="wids-caption">Selected · 4px Ink rail</span></div>
          </div>
          <p className="wids-caption mt-4 border-t border-[var(--rime)] pt-3"><span className="text-[var(--ink)]">Never</span> a grey card, soft 12px radius and a fuzzy grey shadow. Our shadow is <code className="text-[var(--ink)]">0 40px 70px -50px rgba(61,69,88,.45)</code>: long, cold, mostly invisible.</p>
        </Spec>
        <Spec code="3.3" name="Motion" use="UI responds in 160ms. Things crystallize in 400–700ms. Camera flights take 850–1900ms by distance." tokens="--ease cubic-bezier(.22,1,.36,1) · --fast 160 · --slow 520 · flight 850–1900" wide>
          <EaseDemo />
          <ul className="mt-5 grid gap-x-6 gap-y-1 border-t border-[var(--rime)] pt-4 text-[12px] sm:grid-cols-2">
            <li><span className="wids-label mr-2">160ms</span>hover, press, toggle</li>
            <li><span className="wids-label mr-2">400–900ms</span>scramble-in labels, left to right</li>
            <li><span className="wids-label mr-2">520ms</span>panels and dialogs crystallize (blur → sharp)</li>
            <li><span className="wids-label mr-2">850–1900ms</span>fly-to with a zoom-out arc</li>
            <li className="sm:col-span-2"><span className="wids-label mr-2">Reduced</span>flights jump, scramble and draw-in are off, the shards freeze.</li>
          </ul>
        </Spec>
      </div>
    </Section>
  );
}

/* ====================================================================== */
/* 4 · Components                                                          */
/* ====================================================================== */
function MethodCard({ r, sel, onClick }: { r: Row; sel?: boolean; onClick?: () => void }) {
  return (
    <button type="button" className="wids-card text-left" data-sel={!!sel} aria-pressed={!!sel} onClick={onClick}>
      <Corners />
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span className="wids-label">{famWord[r.family]} · M{r.mission}</span>
        {r.trend.startsWith("Best") && <StatusTag s="best" label={r.trend} solid />}
      </span>
      <span className="wids-title mt-2 block">{short(r.method)}</span>
      <span className="wids-caption block">{r.scoring}{r.latentK ? ` · K = ${r.latentK}` : ""}</span>
      <span className="mt-4 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <span><span className="wids-label block">PR-AUC</span><span className="wids-num text-[26px] leading-none">{r.prAuc.toFixed(3)}</span></span>
        <span className="text-right"><span className="wids-label block">ROC-AUC</span><span className="text-[13px] tabular-nums">{r.rocAuc.toFixed(3)}</span></span>
      </span>
      <span className="mt-3 block h-[3px] bg-[var(--rime)]"><span className="block h-full bg-[var(--ink)]" style={{ width: `${(r.prAuc / 0.5) * 100}%` }} /></span>
    </button>
  );
}

export function ComponentsSection({ d }: { d: DSData }) {
  const toast = useToast();
  const { flyTo } = useShell();
  const channels = useMemo(() => d.hier["1"].flatMap((s) => s.groups.flatMap((g) => g.channels.map((c) => ({ ...c, sub: s.subsystem, group: g.group })))), [d]);
  const [q, setQ] = useState("");
  const qBad = q !== "" && !/^[a-z0-9_ ]+$/i.test(q);
  const hits = qBad ? [] : channels.filter((c) => c.name.includes(q.trim().toLowerCase()) || `group ${c.group}` === q.trim().toLowerCase());
  const [method, setMethod] = useState(d.rows.findIndex((r) => r.method === "GMM" && r.mission === 1));
  const [fams, setFams] = useState<Record<string, boolean>>({ baseline: true, parametric: true, generative: false });
  const [scoring, setScoring] = useState("Neg. ELBO");
  const [overlay, setOverlay] = useState(true);
  const [tab, setTab] = useState("m1");
  const [chips, setChips] = useState<string[]>(["generative"]);
  const [cmp, setCmp] = useState(false);
  const cards = [d.rows.find((r) => r.method === "GMM" && r.mission === 1)!, d.rows.find((r) => r.method === "TransformerVAE" && r.mission === 2)!, d.rows.find((r) => r.method === "K-Means")!];
  const [card, setCard] = useState<number | null>(0);
  const cats = Object.entries(d.catalogue.m1.cat);
  const [row, setRow] = useState(0);
  const sel = d.rows[method];
  const famRows = d.rows.filter((r) => fams[r.family]);
  const chipRows = d.rows.filter((r) => chips.length === 0 || chips.includes(r.family));
  const tl = d.tl["1"].series[1].v;

  return (
    <Section id="components" n={4} title="Components" intro={<>The kit, live and wired to our results. Each slab names the component, when to use it and its tokens. Every control works, so try them; the states are laid out side by side in section 05.</>}>
      <div className={grid2}>
        <Spec code="C01" name="Primary button" use="The one action per screen. Cyan fill, Ink label (10.93:1). If two things look primary, one is not." tokens="--signal fill · --ink 500 11.5px caps · radius 999 · 44px">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="wids-pill" onClick={() => { toast("Flying to the longest anomaly: 116,061 timesteps, ~967 h.", "arrow"); flyTo("telemetry"); }}>
              <Icon n="arrow" size={14} />Fly to longest anomaly
            </button>
          </div>
          <p className="wids-caption mt-3">Press it: the camera flies to Telemetry and a toast confirms.</p>
        </Spec>

        <Spec code="C02" name="Secondary button" use="Everything that is not the primary action. Frost glass, hairline. Toggle form uses aria-pressed." tokens="Frost 78% · 1px Rime · Ink 11px caps · radius 0 · 40px">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="wids-btn" onClick={() => toast("PR curve exported (pretend): pr-curves-m2.csv")}>Export curve</button>
            <button type="button" className="wids-btn" aria-pressed={cmp} onClick={() => setCmp(!cmp)}>{cmp ? <Icon n="check" size={13} /> : null}Compare M1 / M2</button>
            <button type="button" className="wids-btn" disabled>Retrain</button>
          </div>
          <p className="wids-caption mt-3">{cmp ? "Comparing: M1 best PR-AUC 0.384 (GMM) vs M2 0.438 (TransformerVAE)." : "Compare is off."}</p>
        </Spec>

        <Spec code="C03" name="Floating circle (icon button)" use="Camera and view tools that float over the field. Always labelled (aria-label + title)." tokens="44px (40 phone) · radius 999 · glass · 1.3px Ink stroke">
          <div className="flex flex-wrap items-center gap-2.5">
            <Circle label="Zoom in" icon="plus" onClick={() => toast("Zoom in · 1.40×", "plus")} />
            <Circle label="Zoom out" icon="minus" onClick={() => toast("Zoom out · 0.71×", "minus")} />
            <Circle label="Fit everything" icon="fit" onClick={() => toast("Fit · 0.18×", "fit")} />
            <Circle label="Coordinate grid" icon="grid" pressed={overlay} onClick={() => setOverlay(!overlay)} />
            <Circle label="Share (unavailable offline)" icon="arrow" disabled />
          </div>
        </Spec>

        <Spec code="C04" name="Link" use="Navigation inside text. Underlined at rest so it never relies on color." tokens="Ink · 1px Glacier underline → 2px Ink on hover · offset 3px">
          <p className="text-[13px] leading-[1.7]">
            Read the <a className="wids-link" href="#telemetry" onClick={(e) => { e.preventDefault(); flyTo("telemetry"); }}>BIC sweep</a> before trusting K, or open the{" "}
            <a className="wids-link" href="/mood-boards/white-immersion">mood board</a> this kit came from. The <a className="wids-link" aria-current="page" href="#components">current page</a> is marked with a bar, not a color.
          </p>
        </Spec>

        <Spec code="C05" name="Text input" use="Free text with a visible label, a hint, and an error that says how to fix it." tokens="Frost · 1px Rime → Glacier hover → 2px Ink focus · error = 4px Ink rail + ✕ word">
          <label htmlFor="wids-q" className="wids-label block text-[var(--ink)]">Filter Mission 1 channels</label>
          <input id="wids-q" className="wids-input mt-2" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ch_41 or group 18" aria-invalid={qBad} aria-describedby="wids-q-h" autoComplete="off" spellCheck={false} />
          <p id="wids-q-h" className="wids-caption mt-2 flex items-center gap-1.5" aria-live="polite">
            {qBad ? <><Icon n="cross" size={12} /><span className="text-[var(--ink)]">Letters, digits and _ only. Try ch_41.</span></> : <>{fmt(hits.length)} of {channels.length} channels{q && hits.length ? `: ${hits.slice(0, 4).map((h) => h.name).join(", ")}${hits.length > 4 ? "…" : ""}` : ""}</>}
          </p>
        </Spec>

        <Spec code="C06" name="Select" use="One choice from a long, known list (the 13 Table 1 rows)." tokens="Frost · 1px Rime · Ink chevron · 44px">
          <label htmlFor="wids-m" className="wids-label block text-[var(--ink)]">Method</label>
          <select id="wids-m" className="wids-select mt-2" value={method} onChange={(e) => setMethod(+e.target.value)}>
            {d.rows.map((r, i) => <option key={r.id} value={i}>{r.label}</option>)}
          </select>
          <p className="mt-3 text-[12.5px]"><span className="wids-label mr-2">PR-AUC</span><span className="wids-num text-[16px]">{sel.prAuc.toFixed(3)}</span><span className="wids-label ml-4 mr-2">ROC</span>{sel.rocAuc.toFixed(3)}<span className="wids-label ml-4 mr-2">Trend</span>{sel.trend}</p>
        </Spec>

        <Spec code="C07" name="Checkbox" use="Independent on/off choices in a list. Ink fill + check when on." tokens="18px · 1px Glacier → Ink · checked = Ink + white check">
          <fieldset>
            <legend className="wids-label text-[var(--ink)]">Method families</legend>
            <div className="mt-2 grid gap-1">
              {Object.keys(famWord).map((f) => (
                <label key={f} className="flex min-h-[36px] cursor-pointer items-center gap-3 text-[13px]">
                  <input type="checkbox" className="wids-check" checked={fams[f]} onChange={(e) => setFams({ ...fams, [f]: e.target.checked })} />
                  {famWord[f]}<span className="wids-label ml-auto">{d.rows.filter((r) => r.family === f).length} rows</span>
                </label>
              ))}
              <label className="flex min-h-[36px] cursor-not-allowed items-center gap-3 text-[13px] text-[var(--dis)]"><input type="checkbox" className="wids-check" disabled />Supervised (out of scope)</label>
            </div>
          </fieldset>
          <p className="wids-caption mt-2">{famRows.length} of {d.rows.length} rows shown.</p>
        </Spec>

        <Spec code="C08" name="Radio" use="Exactly one of a few options, all visible." tokens="18px round · Ink dot 4.5px">
          <fieldset>
            <legend className="wids-label text-[var(--ink)]">VAE anomaly score</legend>
            <div className="mt-2 grid gap-1">
              {["Recon. MSE", "Neg. ELBO", "GMM-OOD"].map((s) => (
                <label key={s} className="flex min-h-[36px] cursor-pointer items-center gap-3 text-[13px]">
                  <input type="radio" name="wids-score" className="wids-radio" checked={scoring === s} onChange={() => setScoring(s)} />
                  {s}<span className="wids-label ml-auto">{d.rows.filter((r) => r.scoring === s).map((r) => `M${r.mission}`).join(" · ") || "—"}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </Spec>

        <Spec code="C09" name="Switch" use="An instant on/off setting that applies right away (no Save)." tokens="44×24 · off = Frost + Glacier thumb · on = Ink + white thumb">
          <div className="flex items-center gap-3">
            <Switch on={overlay} set={setOverlay} label="Anomaly overlay" />
            <span className="text-[13px]">Anomaly overlay <span className="wids-label ml-1">{overlay ? "On" : "Off"}</span></span>
          </div>
          <svg viewBox="0 0 360 60" className="mt-4 h-[60px] w-full" preserveAspectRatio="none" aria-label="GMM M1 score sparkline with labelled anomalies">
            {overlay && d.tl["1"].segs.map(([a, b], i) => <rect key={i} x={a * 360} width={Math.max(0.8, (b - a) * 360)} y="0" height="60" fill="#111824" opacity=".09" />)}
            <path d={"M" + tl.map((p, i) => `${i},${(56 - p[0] * 50).toFixed(1)}`).join("L")} fill="none" stroke="#111824" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </svg>
          <p className="wids-caption">GMM (K = 21) · Mission 1 test set · {d.tl["1"].segs.length} labelled anomaly segments</p>
        </Spec>

        <Spec code="C10" name="Tabs" use="Switch between parallel views of the same thing. Arrow keys move." tokens="Glacier → Ink · 2px Ink underline grows in 300ms">
          <Tabs idBase="wids-tabs" label="Mission" value={tab} set={setTab} tabs={[{ v: "m1", label: "Mission 1" }, { v: "m2", label: "Mission 2" }, { v: "m3", label: "Mission 3", disabled: true }]} />
          {(["m1", "m2"] as const).map((m) => {
            const M = d.missions[m === "m1" ? "1" : "2"];
            return (
              <div key={m} role="tabpanel" id={`wids-tabs-p-${m}`} aria-labelledby={`wids-tabs-t-${m}`} hidden={tab !== m} className="grid grid-cols-3 gap-3 pt-4">
                <div><span className="wids-label block">Channels</span><span className="wids-num text-[22px]">{M.channels}</span></div>
                <div><span className="wids-label block">Groups</span><span className="wids-num text-[22px]">{M.groups}</span></div>
                <div><span className="wids-label block">BIC K*</span><span className="wids-num text-[22px]">{M.k}</span></div>
                <p className="wids-caption col-span-3">{M.train} training timesteps · {(M.testRate * 100).toFixed(2)}% anomalous test steps · {M.labels}</p>
              </div>
            );
          })}
        </Spec>

        <Spec code="C11" name="Filter chips + list rows" use="Chips narrow a list in place; rows are the list. Selected chip = Ink fill + check (not color alone)." tokens="chip 36px · radius 0 · row 48px · hover 2px rail · selected 4px rail" wide>
          <div role="group" aria-label="Filter by family" className="flex flex-wrap gap-2">
            {Object.keys(famWord).map((f) => {
              const on = chips.includes(f);
              return (
                <button key={f} type="button" className="wids-chip" aria-pressed={on} onClick={() => setChips(on ? chips.filter((c) => c !== f) : [...chips, f])}>
                  <span className="wids-chipMark">{on && <Icon n="check" size={10} />}</span>{famWord[f]}<span className="opacity-70">{d.rows.filter((r) => r.family === f).length}</span>
                </button>
              );
            })}
            <button type="button" className="wids-chip" disabled>Supervised 0</button>
            {chips.length > 0 && <button type="button" className="wids-btn is-ghost min-h-[36px]" onClick={() => setChips([])}>Clear</button>}
          </div>
          <div className="mt-4 max-h-[300px] overflow-y-auto border-t border-[var(--ink)]" role="listbox" aria-label="Table 1 rows" tabIndex={-1}>
            {chipRows.map((r) => {
              const i = d.rows.indexOf(r);
              return (
                <button key={r.id} type="button" role="option" aria-selected={row === i} className="wids-row grid-cols-[1fr_auto] sm:grid-cols-[1fr_120px_90px_70px]" onClick={() => setRow(i)}>
                  <span className="min-w-0 truncate text-[12.5px]">{r.label}</span>
                  <span className="wids-label hidden sm:block">{r.scoring}</span>
                  <span className="wids-label hidden sm:block">{famWord[r.family]}</span>
                  <span className="wids-num text-right text-[14px]">{r.prAuc.toFixed(3)}</span>
                </button>
              );
            })}
          </div>
        </Spec>

        <Spec code="C12" name="Card + detail panel" use="A card is one method or one event; pressing it opens its detail panel beside (below on phones). Selected = Ink corner brackets." tokens="slab · 20px pad · hover 1px Ink ring · selected corners 12px · panel crystallizes in 520ms" wide>
          <div className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-3">
              {cards.map((r, i) => <MethodCard key={r.id} r={r} sel={card === i} onClick={() => setCard(card === i ? null : i)} />)}
            </div>
            <div aria-live="polite">
              {card === null ? (
                <div className="grid h-full min-h-[120px] place-items-center border border-dashed border-[var(--rime)] p-6 text-center">
                  <p className="wids-caption">No card selected. Press a card to open its detail panel.</p>
                </div>
              ) : (
                <aside key={card} className="wids-glass h-full p-5" style={{ animation: "wids-crystal 520ms var(--ease) both" }} aria-label={`Detail: ${cards[card].label}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div><span className="wids-label">Detail panel</span><h4 className="wids-title mt-1">{cards[card].label}</h4></div>
                    <Circle small label="Close detail panel" icon="close" onClick={() => setCard(null)} />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[12.5px]">
                    <div><dt className="wids-label">Family</dt><dd>{famWord[cards[card].family]}</dd></div>
                    <div><dt className="wids-label">Scoring</dt><dd>{cards[card].scoring}</dd></div>
                    <div><dt className="wids-label">PR-AUC</dt><dd className="wids-num text-[18px]">{cards[card].prAuc.toFixed(3)}</dd></div>
                    <div><dt className="wids-label">ROC-AUC</dt><dd className="wids-num text-[18px]">{cards[card].rocAuc.toFixed(3)}</dd></div>
                    <div><dt className="wids-label">Event F1</dt><dd>{cards[card].eventF1?.toFixed(3) ?? "n/a (not computed)"}</dd></div>
                    <div><dt className="wids-label">Trend</dt><dd>{cards[card].trend}</dd></div>
                  </dl>
                  <p className="wids-caption mt-4 border-t border-[var(--rime)] pt-3">vs the linear plateau (PR-AUC 0.322): {cards[card].prAuc >= 0.322 ? "+" : "−"}{Math.abs(cards[card].prAuc - 0.322).toFixed(3)}</p>
                </aside>
              )}
            </div>
          </div>
        </Spec>

        <Spec code="C13" name="Badge + status tag" use="Badges count or label. Status always pairs a shape with a word, never color alone." tokens="22px · 1px Ink · solid = Ink fill · count = 20px Ink circle">
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag s="nominal" /><StatusTag s="anomaly" /><StatusTag s="rare" /><StatusTag s="gap" /><StatusTag s="best" label="Best M2" solid />
            <span className="wids-badge is-quiet">Baseline</span>
          </div>
          <div className="mt-4 flex items-center gap-5">
            <span className="relative inline-flex"><span className="wids-circle"><Icon n="warn" /></span><span className="wids-count">{d.catalogue.m1.cat["Anomaly"]}</span></span>
            <span className="wids-caption">{d.catalogue.m1.cat["Anomaly"]} labelled anomalies in M1 ({d.catalogue.m1.n} events in total)</span>
          </div>
        </Spec>

        <Spec code="C14" name="List rows (anomaly categories)" use="Scannable rows with one primary value. The selected row gets the 4px rail." tokens="48px · Rime divider · tabular numerals right">
          <div role="listbox" aria-label="Mission 1 event categories" className="border-t border-[var(--ink)]">
            {cats.map(([k, v], i) => (
              <button key={k} type="button" role="option" aria-selected={row === 100 + i} className="wids-row grid-cols-[auto_1fr_auto]" onClick={() => setRow(100 + i)}>
                <StatusTag s={k === "Anomaly" ? "anomaly" : k === "Rare Event" ? "rare" : "gap"} label={k} />
                <span className="wids-caption truncate">median {d.catalogue.m1.dur[k]?.p50 ?? "—"} h · max {d.catalogue.m1.dur[k]?.max ?? "—"} h</span>
                <span className="wids-num text-[16px]">{v}</span>
              </button>
            ))}
          </div>
        </Spec>
      </div>
    </Section>
  );
}

/* ====================================================================== */
/* 5 · Control states, side by side                                        */
/* ====================================================================== */
const STATES = [["Rest", ""], ["Hover", "is-hover"], ["Focus", "is-focus"], ["Pressed", "is-press"], ["Selected", "is-sel"], ["Disabled", "is-dis"]] as const;
function StateRow({ name, render }: { name: string; render: (cls: string, state: string) => React.ReactNode }) {
  return (
    <div className="grid gap-3 border-b border-[var(--rime)] py-5 md:grid-cols-[150px_minmax(0,1fr)]">
      <h4 className="wids-title text-[13px]">{name}</h4>
      <div className="wids-states" aria-hidden="true" inert>
        {STATES.map(([s, c]) => <StateCell key={s} label={s}>{render(c, s)}</StateCell>)}
      </div>
    </div>
  );
}
export function StatesSection() {
  return (
    <Section id="states" n={5} title="Control states" intro={<>Six states for every control, frozen side by side so they can be compared. Hover adds an Ink hairline, focus is a 2px Ink ring offset 3px, pressed sinks a pixel, selected fills with Ink, and disabled goes dashed. The cyan leaves a disabled primary, because there is nothing to do.</>}>
      <Spec code="5.1" name="State matrix" use="Reference for every control. Live versions are in 04 and 07; Tab through them to see the real focus ring." tokens="hover inset 1px Ink · focus 2px Ink +3 · press translateY 1 / scale .97 · selected Ink fill · disabled dashed #7B8794">
        <StateRow name="Primary pill" render={(c) => <span className={`wids-pill is-sm ${c}`}>Fly to</span>} />
        <StateRow name="Secondary button" render={(c) => <span className={`wids-btn ${c}`}>Export</span>} />
        <StateRow name="Floating circle" render={(c) => <span className={`wids-circle ${c}`}><Icon n="plus" /></span>} />
        <StateRow name="Link" render={(c) => <span className={`wids-link text-[13px] ${c}`}>BIC sweep</span>} />
        <StateRow name="Filter chip" render={(c) => <span className={`wids-chip ${c}`}><span className="wids-chipMark">{c === "is-sel" && <Icon n="check" size={10} />}</span>GMM</span>} />
        <StateRow name="Tab" render={(c) => <span className={`wids-tab inline-flex items-center border-b border-[var(--rime)] ${c}`}>Mission 1</span>} />
        <StateRow name="Segmented" render={(c) => <span className="wids-seg"><span className={`wids-segBtn inline-flex items-center ${c}`}>M1</span></span>} />
        <StateRow name="Text input" render={(c, s) => <span className={`wids-input inline-flex w-[118px] items-center text-[12px] ${c}`}>{s === "Disabled" ? "—" : s === "Rest" ? <span className="text-[var(--muted)]">ch_41</span> : "ch_41"}</span>} />
        <StateRow name="Select" render={(c) => <span className={`wids-select inline-flex w-[118px] items-center text-[12px] ${c}`}>GMM</span>} />
        <StateRow name="Checkbox · radio" render={(c) => <span className="flex gap-3"><span className={`wids-check ${c}`} /><span className={`wids-radio ${c}`} /></span>} />
        <StateRow name="Switch" render={(c) => <span className={`wids-switch inline-block ${c}`} />} />
        <StateRow name="List row" render={(c) => <span className={`wids-row grid w-[118px] grid-cols-[1fr_auto] text-[12px] ${c}`}><span>GMM</span><span className="wids-num">.384</span></span>} />
      </Spec>
    </Section>
  );
}

/* ====================================================================== */
/* 6 · UI states + simulator                                               */
/* ====================================================================== */
type UI = "empty" | "loading" | "error" | "success";
function StatePanel({ s, d, onRetry, onStart }: { s: UI; d: DSData; onRetry?: () => void; onStart?: () => void }) {
  const best = d.rows.find((r) => r.trend === "Best M2")!;
  if (s === "empty") return (
    <div className="grid justify-items-start gap-3">
      <span className="wids-circle"><Icon n="shard" /></span>
      <p className="wids-title">No run selected</p>
      <p className="wids-caption max-w-[38ch]">Pick a mission and a method to see its PR-AUC. Mission 2 has the best score so far.</p>
      {onStart && <button type="button" className="wids-btn" onClick={onStart}>Load Mission 2 · TVAE</button>}
    </div>
  );
  if (s === "loading") return (
    <div className="grid gap-3" aria-busy="true">
      <GlyphLoader />
      <div className="wids-skel h-4 w-2/3" /><div className="wids-skel h-9 w-1/3" /><div className="wids-skel h-3 w-full" /><div className="wids-skel h-3 w-5/6" />
    </div>
  );
  if (s === "error") return (
    <div className="grid justify-items-start gap-3" role="alert">
      <StatusTag s="gap" label="Error" solid />
      <p className="wids-title">Score file did not load</p>
      <p className="wids-caption max-w-[40ch]">tvae_m2_scores.npz timed out after 8s. Nothing was lost. Try again, or use the saved PR curve.</p>
      {onRetry && <button type="button" className="wids-btn" onClick={onRetry}><Icon n="retry" size={13} />Try again</button>}
    </div>
  );
  return (
    <div className="grid justify-items-start gap-2">
      <StatusTag s="best" label="Loaded" solid />
      <p className="wids-title mt-1">{best.label}</p>
      <p className="flex flex-wrap items-baseline gap-x-2"><span className="wids-num text-[34px] leading-none">{best.prAuc.toFixed(3)}</span><span className="wids-label whitespace-nowrap">PR-AUC</span></p>
      <p className="wids-caption">ROC-AUC {best.rocAuc.toFixed(3)} · {best.scoring} · best on Mission 2</p>
    </div>
  );
}
export function UiStatesSection({ d }: { d: DSData }) {
  const [s, setS] = useState<UI>("empty");
  const [runs, setRuns] = useState(0);
  const timer = useRef(0);
  const run = () => {
    window.clearTimeout(timer.current);
    setS("loading");
    const n = runs + 1; setRuns(n);
    timer.current = window.setTimeout(() => setS(n % 2 === 1 ? "error" : "success"), 1600);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <Section id="ui" n={6} title="UI states" intro={<>Every data view has four states. Empty says what is missing and offers the first move. Loading draws the shape of what is coming. Error says what happened and how to recover. Success shows the number.</>}>
      <div className="grid gap-5">
        <Spec code="6.1" name="State simulator" use="Run a fake fetch: the first attempt fails, the retry succeeds. Or jump straight to a state." tokens="skeleton #E8EDF2 + frost sweep 1.8s · error = solid tag + word + retry" wide>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented label="UI state" value={s} set={(v) => { window.clearTimeout(timer.current); setS(v); }} options={[{ v: "empty", label: "Empty" }, { v: "loading", label: "Loading" }, { v: "error", label: "Error" }, { v: "success", label: "Success" }]} />
            <button type="button" className="wids-btn" onClick={run}><Icon n="play" size={12} />Simulate fetch</button>
          </div>
          <div className="relative mt-5 min-h-[200px] border border-[var(--rime)] bg-white p-5 sm:p-6" aria-live="polite">
            <StatePanel s={s} d={d} onRetry={run} onStart={run} />
          </div>
        </Spec>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {(["empty", "loading", "error", "success"] as UI[]).map((k) => (
            <div key={k} className="wids-slab p-5" inert>
              <p className="wids-label mb-4">{k}</p>
              <StatePanel s={k} d={d} onRetry={() => {}} onStart={() => {}} />
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ====================================================================== */
/* 7 · Parts of an interface                                               */
/* ====================================================================== */
export function PartsSection({ d }: { d: DSData }) {
  const toast = useToast();
  const { flyTo, openAtlas, setGrid, grid } = useShell();
  const [seg, setSeg] = useState<"point" | "event">("point");
  const [sw, setSw] = useState({ alerts: true, sound: false });
  const [chk, setChk] = useState({ m1: true, m2: true });
  const [rad, setRad] = useState("99");
  const [pills, setPills] = useState<string[]>(["GMM"]);
  const [tags, setTags] = useState(["Mission 1", "GMM", "K = 21", "Neg. log-lik."]);
  const [banner, setBanner] = useState(true);
  const [skel, setSkel] = useState(true);
  const [modal, setModal] = useState(false);
  const [q, setQ] = useState("ch_999");
  const [rings, setRings] = useState(false);
  const [cardSel, setCardSel] = useState(false);
  const gmm = d.rows.find((r) => r.method === "GMM" && r.mission === 1)!;
  const tvae = d.rows.find((r) => r.trend === "Best M2")!;
  const chans = d.hier["1"].flatMap((s) => s.groups.flatMap((g) => g.channels.map((c) => c.name)));
  const hits = chans.filter((c) => q && c.includes(q.toLowerCase()));
  useEffect(() => { if (!skel) return; const id = window.setTimeout(() => setSkel(false), 2600); return () => window.clearTimeout(id); }, [skel]);

  return (
    <Section id="parts" n={7} title="Parts of an interface" intro={<>All eighteen elements from the Week 2 slide, each under the slide&apos;s own name and subtitle, built in this kit and wired to our results. Two rules close the section: a visible focus ring everywhere, and status that never relies on color.</>}>
      <div className={grid2}>
        <Spec code="P01" name="Hero" sub="The big opening section" use="The first thing on a page: one claim, one number, one primary action." tokens="Display 24–36 · Numeral · one Signal pill" wide>
          <div className="relative overflow-hidden border border-[var(--rime)] bg-[radial-gradient(120%_120%_at_70%_30%,#fff_0%,#f4f6f8_60%,#e3e8ee_100%)] p-6 sm:p-10">
            <p className="wids-label">ESA-ADB · Missions 1 + 2 · TTIC 31220</p>
            <h4 className="wids-display mt-3 max-w-[16ch] text-[22px] leading-[1.12] tracking-[0.04em] sm:text-[36px]">The structure is operational, not architectural</h4>
            <p className="mt-4 max-w-[52ch] text-[13px] leading-[1.65]">BIC keeps falling past the 4 subsystems and settles at K = {d.missions["1"].k} for Mission 1 and K = {d.missions["2"].k} for Mission 2, the scale of the 18–29 operational groups.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button type="button" className="wids-pill" onClick={() => flyTo("wids-t06")}><Icon n="arrow" size={14} />See the BIC sweep</button>
              <button type="button" className="wids-btn" onClick={() => flyTo("wids-t08")}>Read Table 1</button>
            </div>
            <div className="mt-8 grid max-w-[520px] grid-cols-3 gap-4 border-t border-[var(--rime)] pt-4">
              {[["Channels", "76 · 100"], ["K* (BIC)", `${d.missions["1"].k} · ${d.missions["2"].k}`], ["Best PR-AUC", "0.384 · 0.438"]].map(([k, v]) => (
                <div key={k}><span className="wids-label block">{k}</span><span className="wids-num text-[13px] sm:text-[17px]">{v}</span></div>
              ))}
            </div>
          </div>
        </Spec>

        <Spec code="P02" name="Card" sub="One item, one box" use="One method or one event in one slab. The whole card is the target; selected shows Ink corner brackets." tokens="slab · 20px pad · hover 1px Ink ring · corners 12px">
          <MethodCard r={tvae} sel={cardSel} onClick={() => setCardSel(!cardSel)} />
          <p className="wids-caption mt-3">{cardSel ? "Selected: brackets crystallize around the card." : "Press the card to select it."}</p>
        </Spec>

        <Spec code="P03" name="Primary and secondary buttons" sub="Filled, and outlined" use="Filled Signal pill for the one main action; outlined Frost button for everything else." tokens="pill Signal 44px · button 1px Rime 40px">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="wids-pill" onClick={() => toast("Opening findings (pretend).", "arrow")}>Explore findings</button>
            <button type="button" className="wids-btn" onClick={() => toast("Methods notes opened (pretend).")}>Read methods</button>
          </div>
        </Spec>

        <Spec code="P04" name="Menu and more" sub="≡ opens a menu, ⋮ more actions" use="≡ opens navigation; ⋮ opens actions on this object. Arrow keys move, Esc closes and returns focus." tokens="circle 44 · popover Frost 96% · item 40px · hover 2px rail">
          <div className="flex items-center justify-between gap-3 border border-[var(--rime)] bg-white px-3 py-2">
            <Menu icon="menu" label="Sections" count={10} items={[{ label: "Color roles", hint: "01", onSelect: () => flyTo("color") }, { label: "Components", hint: "04", onSelect: () => flyTo("components") }, { label: "Novel", hint: "08", onSelect: () => flyTo("novel") }, { label: "Telemetry", hint: "09", onSelect: () => flyTo("telemetry") }, { label: "Atlas (all)", hint: "0", onSelect: openAtlas }]} />
            <span className="min-w-0 flex-1 truncate text-[12px]">GMM · M1 · K = 21</span>
            <Menu icon="more" label="More actions for GMM M1" align="right" items={[{ label: "Copy PR-AUC", hint: "0.384", onSelect: () => toast("Copied PR-AUC 0.384") }, { label: "Export curve", onSelect: () => toast("Exported gmm_m1 PR curve (pretend)") }, { label: "Delete run", disabled: true }]} />
          </div>
        </Spec>

        <Spec code="P05" name="Segmented control" sub="Material: segmented buttons" use="2–4 mutually exclusive views of the same data. Arrow keys switch." tokens="Frost track · 3px inset · selected Ink fill">
          <Segmented label="Evaluation" value={seg} set={setSeg} options={[{ v: "point", label: "Point-wise" }, { v: "event", label: "Event-wise" }]} />
          <p className="mt-4 text-[12.5px]">{seg === "point" ? <>K-Means M1: <span className="wids-num">PR-AUC 0.322</span> on every timestep.</> : <>K-Means M1: <span className="wids-num">event F1 0.661</span> (Hundman et al., 2018).</>}</p>
        </Spec>

        <Spec code="P06" name="Switch" sub="Also: toggle" use="An instant on/off setting. It applies right away, no Save." tokens="44×24 · off Frost + Glacier thumb · on Ink + white thumb">
          <div className="grid gap-3">
            {(["alerts", "sound"] as const).map((k) => (
              <div key={k} className="flex items-center justify-between gap-3">
                <span className="text-[13px]">{k === "alerts" ? "Alert on new anomaly" : "Alert sound (unavailable)"}</span>
                <Switch on={sw[k]} set={(b) => setSw({ ...sw, [k]: b })} label={k === "alerts" ? "Alert on new anomaly" : "Alert sound"} disabled={k === "sound"} />
              </div>
            ))}
          </div>
        </Spec>

        <Spec code="P07" name="Checkbox and radio" sub="Pick many, or pick one" use="Checkboxes choose any number; radios choose exactly one, all options visible." tokens="18px · Ink fill + check · Ink dot">
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {(["m1", "m2"] as const).map((k) => (
                <label key={k} className="flex min-h-[32px] cursor-pointer items-center gap-2.5 text-[13px]"><input type="checkbox" className="wids-check" checked={chk[k]} onChange={(e) => setChk({ ...chk, [k]: e.target.checked })} />Mission {k[1]}</label>
              ))}
            </div>
            <fieldset className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--rime)] pt-3">
              <legend className="wids-label float-left mb-1 w-full">Threshold percentile</legend>
              {["98.5", "99", "99.5"].map((p) => (
                <label key={p} className="flex min-h-[32px] cursor-pointer items-center gap-2.5 text-[13px]"><input type="radio" name="wids-pct" className="wids-radio" checked={rad === p} onChange={() => setRad(p)} />{p}th</label>
              ))}
            </fieldset>
          </div>
        </Spec>

        <Spec code="P08" name="Pills" sub="Material: filter chips. Also: tags" use="Filter chips toggle a filter on and off; tags show filters in effect and × removes one." tokens="chip 36 · radius 0 · selected Ink fill + check · tag × 24">
          <div role="group" aria-label="Filter methods" className="flex flex-wrap gap-2">
            {["GMM", "VAE", "Baselines"].map((t) => { const on = pills.includes(t); return (
              <button key={t} type="button" className="wids-chip" aria-pressed={on} onClick={() => setPills(on ? pills.filter((x) => x !== t) : [...pills, t])}><span className="wids-chipMark">{on && <Icon n="check" size={10} />}</span>{t}</button>
            ); })}
          </div>
          <ul className="mt-3 flex flex-wrap gap-2 border-t border-[var(--rime)] pt-3" aria-label="Active filters">
            {tags.map((t) => (
              <li key={t} className="wids-chip cursor-default pr-1.5" style={{ borderColor: "var(--ink)" }}>
                {t}
                <button type="button" className="grid h-6 w-6 place-items-center rounded-full hover:bg-[var(--press)]" aria-label={`Remove ${t}`} onClick={() => setTags(tags.filter((x) => x !== t))}><Icon n="close" size={11} /></button>
              </li>
            ))}
            {tags.length < 4 && <li><button type="button" className="wids-btn is-ghost min-h-[36px]" onClick={() => setTags(["Mission 1", "GMM", "K = 21", "Neg. log-lik."])}>Reset</button></li>}
          </ul>
        </Spec>

        <Spec code="P09" name="Toast" sub="Material: snackbar. It goes away." use="Quiet confirmation that leaves on its own after 4.2s (hover pauses). Never for errors that need action." tokens="glass · Ink drain line · rises 420ms · role=status">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="wids-btn" onClick={() => toast("Threshold saved: top 11.1% of scores flagged.")}>Save threshold</button>
            <button type="button" className="wids-btn" onClick={() => toast("Copied link to Mission 2 · TransformerVAE.", "arrow")}>Copy link</button>
          </div>
        </Spec>

        <Spec code="P10" name="Banner" sub="It stays until dismissed" use="Page-level context people must read. It stays until dismissed." tokens="Frost · 1px Ink · 4px Ink rail · icon + word">
          {banner ? (
            <div className="wids-banner" role="region" aria-label="Notice">
              <Icon n="info" />
              <p className="flex-1 text-[12.5px] leading-[1.6]"><span className="font-medium">Mission 2 labels differ.</span> About 95% are rare operational events, not true failures, so M2 PR-AUC is not comparable with M1.</p>
              <Circle small label="Dismiss banner" icon="close" onClick={() => setBanner(false)} />
            </div>
          ) : (
            <button type="button" className="wids-btn" onClick={() => setBanner(true)}>Show banner again</button>
          )}
        </Spec>

        <Spec code="P11" name="Badge" sub="A count or a status dot" use="A count on an icon, or a dot + word for status." tokens="count 20px Ink · dot 7px + word">
          <div className="flex flex-wrap items-center gap-6">
            <span className="relative inline-flex"><span className="wids-circle"><Icon n="warn" /></span><span className="wids-count">{d.catalogue.m2.cat["Anomaly"]}</span></span>
            <span className="relative inline-flex"><span className="wids-circle"><Icon n="info" /></span><span className="wids-count">{d.catalogue.m2.cat["Rare Event"]}</span></span>
            <span className="flex items-center gap-2 text-[12px]"><span className="h-[7px] w-[7px] rounded-full bg-[var(--ink)]" />Live</span>
            <span className="flex items-center gap-2 text-[12px]"><span className="h-[7px] w-[7px] rounded-full border border-[var(--ink)]" />Paused</span>
          </div>
          <p className="wids-caption mt-3">M2: {d.catalogue.m2.cat["Anomaly"]} anomalies · {d.catalogue.m2.cat["Rare Event"]} rare events</p>
        </Spec>

        <Spec code="P12" name="Skeleton screen" sub="Also: skeleton loader" use="Hold the layout while data loads, so nothing jumps. Loads for 2.6s here." tokens="#E8EDF2 blocks · white frost sweep 1.8s · aria-busy">
          <div className="min-h-[150px]" aria-busy={skel} aria-live="polite">
            {skel ? (
              <div className="grid gap-3 border border-[var(--rime)] bg-white p-5"><div className="wids-skel h-3 w-24" /><div className="wids-skel h-4 w-2/3" /><div className="wids-skel h-8 w-28" /><div className="wids-skel h-[3px] w-full" /></div>
            ) : <MethodCard r={gmm} />}
          </div>
          <button type="button" className="wids-btn mt-3" onClick={() => setSkel(true)} disabled={skel}><Icon n="retry" size={13} />Reload</button>
        </Spec>

        <Spec code="P13" name="Tooltip" sub="On hover or focus" use="A short definition on hover AND keyboard focus. Esc hides it. Never hides required info." tokens="Ink fill · Frost 11px · 160ms · role=tooltip">
          <p className="text-[13px] leading-[2.2]">
            Our primary metric is{" "}
            <Tip text="Average precision over all thresholds. Chance level equals the anomaly rate (11.1% for M1).">
              {(p) => <button type="button" className="wids-link" {...p}>PR-AUC</button>}
            </Tip>
            , not{" "}
            <Tip text="Area under the ROC curve. Easy to inflate when anomalies are rare.">
              {(p) => <button type="button" className="wids-link" {...p}>ROC-AUC</button>}
            </Tip>.
            <span className="ml-3 inline-flex align-middle">
              <Tip text="Fit everything (0)">{(p) => <button type="button" className="wids-circle is-sm" aria-label="Fit everything" {...p}><Icon n="fit" size={14} /></button>}</Tip>
            </span>
          </p>
        </Spec>

        <Spec code="P14" name="Modal dialog" sub="With a scrim behind it" use="Interrupts for one focused task. Focus is trapped; Esc or × closes and returns focus to the opener." tokens="native <dialog> · scrim Rime 72% + 6px blur · crystallize 480ms">
          <button type="button" className="wids-btn" onClick={() => setModal(true)}>Why K = 21?</button>
          <Modal open={modal} onClose={() => setModal(false)} title="Why K = 21 for Mission 1" labelId="wids-modal-t">
            <p className="mt-4 text-[13px] leading-[1.65]">The GMM sweep ran K = 2…30 on an 800K-row sample in 30 PCA dimensions. BIC kept dropping past the 4 subsystems and bottomed out at K = 21, close to the 18 operational groups.</p>
            <p className="wids-caption mt-3">ARI vs groups 0.094 · vs subsystems 0.047</p>
            <label htmlFor="wids-modal-note" className="wids-label mt-5 block text-[var(--ink)]">Note for the reviewer</label>
            <input id="wids-modal-note" className="wids-input mt-2" placeholder="Optional" />
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" className="wids-btn" onClick={() => setModal(false)}>Cancel</button>
              <button type="button" className="wids-pill" onClick={() => { setModal(false); toast("Note saved (pretend)."); }}>Save note</button>
            </div>
          </Modal>
        </Spec>

        <Spec code="P15" name="Accordion" sub="Sections that open and close" use="Long answers people only sometimes need. One open at a time." tokens="52px header · + turns to × in 360ms · grid-rows reveal 420ms">
          <Accordion items={[
            { q: "Why does PCA plateau at 0.322?", tag: "Baseline", a: "PC1 loads almost equally on every channel (CV 0.006), so linear projections see one big shared mode. K-Means, PCA recon and PCA + K-Means all land at PR-AUC ≈ 0.32." },
            { q: "Why is GMM best on Mission 1?", tag: "Parametric", a: "Full-covariance components at K = 21 model the operational modes directly: PR-AUC 0.384, ROC-AUC 0.692, against 0.628 ROC for the best VAE." },
            { q: "Why do VAEs win on Mission 2?", tag: "Generative", a: "Mission 2's labels are mostly rare operational events. The TransformerVAE's negative ELBO reaches PR-AUC 0.438, above GMM's 0.390." },
          ]} />
        </Spec>

        <Spec code="P16" name="Empty state" sub="When there's nothing yet" use="Says what is missing, why, and offers the first move." tokens="shard glyph · Title · Caption · one secondary action">
          <label htmlFor="wids-empty-q" className="wids-label block text-[var(--ink)]">Search channels</label>
          <input id="wids-empty-q" className="wids-input mt-2" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
          <div className="mt-4 min-h-[120px]" aria-live="polite">
            {hits.length === 0 ? (
              <div className="grid justify-items-start gap-2 border border-dashed border-[var(--rime)] p-4">
                <Icon n="search" />
                <p className="wids-title text-[13.5px]">No channel called “{q || "…"}”</p>
                <p className="wids-caption">Mission 1 has 76 channels, ch_1 to ch_76.</p>
                <button type="button" className="wids-btn mt-1" onClick={() => setQ("ch_4")}>Show ch_4…</button>
              </div>
            ) : (
              <p className="text-[12.5px]">{hits.length} match{hits.length > 1 ? "es" : ""}: {hits.slice(0, 8).join(", ")}{hits.length > 8 ? "…" : ""}</p>
            )}
          </div>
        </Spec>

        <Spec code="P17" name="Keyboard focus ring" sub="Tab shows where you are" use="Tab moves a visible ring through every control. Press Tab, or force every ring on." tokens="2px Ink · offset 3px (inputs 0, tabs inset) · never outline: none">
          <div className="flex items-center gap-3"><Switch on={rings} set={setRings} label="Show every focus ring" /><span className="text-[13px]">Show every focus ring</span></div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className={`wids-pill is-sm ${rings ? "is-focus" : ""}`}>Primary</span>
            <span className={`wids-btn ${rings ? "is-focus" : ""}`}>Secondary</span>
            <span className={`wids-circle ${rings ? "is-focus" : ""}`}><Icon n="plus" /></span>
            <span className={`wids-chip ${rings ? "is-focus" : ""}`}>Chip</span>
            <span className={`wids-link text-[13px] ${rings ? "is-focus" : ""}`}>Link</span>
          </div>
        </Spec>

        <Spec code="P18" name="Never color alone" sub="Shape + word, every time" use="Status = shape + word (+ fill). Works in grayscale, for colorblind readers, and in print." tokens="○ nominal · ▲ anomaly · ◇ rare · ✕ gap · ● best">
          <ul className="grid gap-2 text-[12.5px]">
            <li className="flex items-center justify-between gap-3"><StatusTag s="anomaly" /><span className="wids-caption">{d.catalogue.m1.cat["Anomaly"]} events · M1</span></li>
            <li className="flex items-center justify-between gap-3"><StatusTag s="rare" /><span className="wids-caption">{d.catalogue.m1.cat["Rare Event"]} events · M1</span></li>
            <li className="flex items-center justify-between gap-3"><StatusTag s="gap" /><span className="wids-caption">{d.catalogue.m1.cat["Communication Gap"]} events · M1</span></li>
            <li className="flex items-center justify-between gap-3"><StatusTag s="nominal" /><span className="wids-caption">{(100 - d.missions["1"].testRate * 100).toFixed(1)}% of test steps</span></li>
          </ul>
        </Spec>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="wids-caption">Overlay the 8px baseline + 96px columns used above:</span>
        <button type="button" className="wids-btn" aria-pressed={grid} onClick={() => setGrid(!grid)}><Icon n="grid" size={13} />Coordinate grid</button>
      </div>
    </Section>
  );
}
