"use client";
// Section L · Lecture principles: each Week 2 concept rebuilt in the White Immersion style on our telemetry content.
import { useState } from "react";
import type { DSData } from "./data";
import { Icon, Segmented, StatusTag, Switch, useToast } from "./kit";
import { Section, Spec } from "./shell";
import { ratio } from "./standard";

const HEX = { bg: "#F4F6F8", surface: "#FFFFFF", rime: "#D5DCE4", muted: "#56616F", ink: "#111824", signal: "#2FE0E3" };

/* a phone mockup: device frame is illustration, so it may be round */
function Phone({ children, label, sub }: { children: React.ReactNode; label?: string; sub?: string }) {
  return (
    <figure className="grid justify-items-center gap-3">
      <div className="relative w-[214px] rounded-[30px] border-[1.5px] border-[var(--ink)] bg-[var(--bg)] p-2.5 shadow-[0_40px_70px_-50px_rgba(61,69,88,.45)]">
        <span className="mx-auto mb-2 block h-[5px] w-[54px] rounded-full bg-[var(--ink)]" aria-hidden="true" />
        <div className="flex min-h-[340px] flex-col gap-2 overflow-hidden rounded-[20px] px-1 pb-1">{children}</div>
      </div>
      {label && (
        <figcaption className="text-center">
          <span className="wids-display block text-[13px] tracking-[0.05em]">{label}</span>
          {sub && <span className="wids-caption block">{sub}</span>}
        </figcaption>
      )}
    </figure>
  );
}

/* the "Mission 2 · Today" screen used by L2, L4, L5, L8, in several treatments */
type Mode = "loud" | "quiet" | "accentAll" | "one" | "wrong";
function TodayScreen({ d, mode, onPrimary }: { d: DSData; mode: Mode; onPrimary?: () => void }) {
  const r = d.rows.find((x) => x.trend === "Best M2")!;
  const stats: [string, string][] = [["Best", r.prAuc.toFixed(3).slice(1)], ["ROC", r.rocAuc.toFixed(3).slice(1)], ["K", String(r.latentK)]];
  const rows: [string, boolean][] = [["GMM K = 29", true], ["CapacityVAE", true], ["HVAE", false]];
  if (mode === "wrong") {
    return (
      <div className="flex flex-1 flex-col gap-2 rounded-[16px] bg-[linear-gradient(160deg,#ff2bd6,#6a00ff)] p-3 text-white" style={{ fontFamily: "Impact, 'Arial Black', sans-serif" }}>
        <span className="text-[10.5px] tracking-[0.2em] text-[#fff700]">★ TODAY ★</span>
        <span className="text-[44px] leading-none text-[#fff700] [text-shadow:0_0_12px_#fff700]">0.438!!</span>
        <div className="grid grid-cols-3 gap-1">{stats.map(([k, v]) => <span key={k} className="rounded-md border-2 border-[#00fff0] p-1 text-center text-[12px]">{v}</span>)}</div>
        {rows.map(([k]) => <span key={k} className="text-[12px] text-[#00fff0]">▶ {k.toUpperCase()}</span>)}
        <button type="button" tabIndex={-1} className="mt-auto rounded-lg bg-[#fff700] py-2 text-[14px] text-[#6a00ff]">EXPLORE +1 ★</button>
      </div>
    );
  }
  const loud = mode === "loud", all = mode === "accentAll", quiet = mode === "quiet";
  const tint = all ? { background: "rgba(47,224,227,.28)", borderColor: HEX.signal } : undefined;
  return (
    <>
      <span className="wids-label px-1 pt-1" style={all ? { color: "#0a6e70" } : undefined}>Mission 2 · Today</span>
      <div className="border border-[var(--rime)] bg-white p-3" style={tint}>
        <span className={`block ${loud ? "text-[14px] font-medium" : "text-[12px]"}`}>TransformerVAE</span>
        <span className={`wids-num block leading-none ${loud ? "mt-1 text-[40px]" : quiet ? "mt-1 text-[24px] text-[var(--muted)]" : "mt-1 text-[32px]"}`}>{r.prAuc.toFixed(3)}</span>
        <span className={`mt-1 block text-[10px] uppercase tracking-[0.1em] ${quiet ? "text-[var(--muted)]" : ""} ${loud ? "font-medium" : ""}`}>PR-AUC</span>
        <span className={`wids-caption mt-1 block ${loud ? "text-[var(--ink)]" : ""}`}>Best on rare events</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {stats.map(([k, v]) => (
          <div key={k} className={`bg-white px-1.5 py-1 ${loud ? "border-2 border-[var(--ink)]" : "border border-[var(--rime)]"}`} style={tint}>
            <span className={`block text-[10px] uppercase tracking-[0.08em] ${quiet ? "text-[var(--muted)]" : ""}`}>{k}</span>
            <span className={`wids-num block ${loud ? "text-[15px]" : quiet ? "text-[12px] text-[var(--muted)]" : "text-[13px]"}`}>{v}</span>
          </div>
        ))}
      </div>
      <ul className="border border-[var(--rime)] bg-white px-2 py-1" style={tint}>
        {rows.map(([k, on]) => (
          <li key={k} className="flex items-center gap-2 border-b border-[var(--rime)] py-1 text-[11.5px] last:border-0">
            <span className="grid h-3 w-3 place-items-center border" style={{ borderColor: all ? HEX.signal : HEX.ink, background: on ? (all ? HEX.signal : HEX.ink) : "transparent" }}>{on && <Icon n="check" size={8} className="text-white" />}</span>
            <span style={all ? { color: "#0a6e70" } : quiet ? { color: HEX.muted } : undefined}>{k}</span>
          </li>
        ))}
      </ul>
      <div className="relative mt-auto">
        {loud && <svg className="absolute -top-7 right-4" width="34" height="28" viewBox="0 0 34 28" aria-hidden="true"><path d="M30 2C26 14 16 20 6 22m0 0 6-6m-6 6 7 4" stroke="#111824" strokeWidth="2.2" fill="none" strokeLinecap="round" /></svg>}
        <button type="button" className={`wids-pill w-full ${loud ? "min-h-[52px] text-[14px]" : quiet ? "is-sm" : ""}`} tabIndex={onPrimary ? 0 : -1} onClick={onPrimary}>Explore findings</button>
      </div>
    </>
  );
}

/* L1 · what you see */
function WhatYouSee({ d }: { d: DSData }) {
  const vals = d.rows.filter((r) => r.mission === 2).map((r) => r.prAuc.toFixed(3)).slice(0, 4);
  const best = d.rows.find((r) => r.trend === "Best M2")!.prAuc.toFixed(3);
  const items = [best, ...vals.filter((v) => v !== best)].slice(0, 4);
  const lever: { k: string; line: string; cell: (v: string, i: number) => React.ReactNode }[] = [
    { k: "Size", line: "Bigger things get noticed first.", cell: (v, i) => <span className={`wids-num ${i === 0 ? "text-[30px]" : "text-[13px]"}`}>{v}</span> },
    { k: "Weight", line: "Heavier text stands out.", cell: (v, i) => <span className={`text-[15px] tabular-nums ${i === 0 ? "font-medium" : "font-light"}`}>{v}</span> },
    { k: "Contrast", line: "Most contrast with the background draws the eye.", cell: (v, i) => <span className="text-[15px] tabular-nums" style={{ color: i === 0 ? HEX.ink : "#a7b0bb" }}>{v}</span> },
    { k: "Position", line: "Things near the top are seen first.", cell: (v) => <span className="text-[15px] tabular-nums">{v}</span> },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {lever.map((l) => (
        <figure key={l.k} className="grid content-start gap-3 border border-[var(--rime)] bg-white p-4">
          <div className="grid min-h-[132px] content-center gap-1.5">
            {(l.k === "Position" ? items : [items[2], items[0], items[3], items[1]]).map((v, i) => {
              const hot = l.k === "Position" ? i === 0 : v === items[0];
              return <div key={i} className={`flex items-baseline gap-2 ${l.k === "Position" && hot ? "border-l-2 border-[var(--ink)] pl-2" : ""}`}>{l.cell(v, hot ? 0 : i + 1)}</div>;
            })}
          </div>
          <figcaption className="border-t border-[var(--rime)] pt-2"><span className="wids-title block text-[13px]">{l.k}</span><span className="wids-caption">{l.line}</span></figcaption>
        </figure>
      ))}
    </div>
  );
}

/* L3 · annotated type roles */
function TypeRoles({ d }: { d: DSData }) {
  const r = d.rows.find((x) => x.trend === "Best M2")!;
  const rows: { role: string; font: string; node: React.ReactNode; h: string }[] = [
    { role: "Label", font: "Martian Mono 400 · 10.5 caps", node: <span className="wids-label">Mission 2 · Today</span>, h: "min-h-[52px]" },
    { role: "Heading", font: "Michroma 400 · 17 caps", node: <span className="wids-display text-[12px] tracking-[0.04em] sm:text-[17px]">TransformerVAE</span>, h: "min-h-[52px]" },
    { role: "Display", font: "Michroma 400 · 48 tabular", node: <span className="wids-num text-[34px] leading-none sm:text-[48px]">{r.prAuc.toFixed(3)}<span className="ml-2 hidden text-[13px] sm:inline">PR-AUC</span></span>, h: "min-h-[84px]" },
    { role: "Body", font: "Martian Mono 400 · 13", node: <span className="text-[13px]">Best on rare events. ROC-AUC {r.rocAuc.toFixed(3)}.</span>, h: "min-h-[52px]" },
    { role: "Caption", font: "Martian Mono 300 · 11 · Glacier", node: <span className="wids-caption">Neg. ELBO · latent K = {r.latentK} · Table 1</span>, h: "min-h-[52px]" },
  ];
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,420px)_1fr]">
      {rows.map((x, i) => (
        <div key={x.role} className="contents">
          <div className={`flex items-center border-x-[1.5px] border-[var(--ink)] bg-white px-4 sm:px-5 ${x.h} ${i === 0 ? "border-t-[1.5px] pt-3" : ""} ${i === rows.length - 1 ? "border-b-[1.5px] pb-3" : ""}`}>{x.node}</div>
          <div className={`flex items-center ${x.h} ${i === 0 ? "pt-3" : ""} ${i === rows.length - 1 ? "pb-3" : ""}`}>
            <span className="h-px w-4 bg-[var(--ink)] sm:w-12" aria-hidden="true" />
            <span className="pl-2"><span className="wids-title block text-[12.5px] leading-tight sm:text-[14px]">{x.role}</span><span className="wids-caption hidden sm:block">{x.font}</span></span>
          </div>
        </div>
      ))}
      <p className="wids-caption col-span-2 mt-3 sm:hidden">Fonts: Label, Body, Caption = Martian Mono. Heading, Display = Michroma.</p>
    </div>
  );
}

/* L4 · color roles applied */
function ColorRoles({ d }: { d: DSData }) {
  const sw: [string, string, string, string][] = [
    ["Background", "Behind content", HEX.bg, HEX.ink], ["Surface", "Cards and panels", HEX.surface, HEX.ink], ["Text", "Headings and body", HEX.ink, HEX.surface],
    ["Muted", "Labels and small print", HEX.muted, HEX.surface], ["Border", "1px hairlines", HEX.rime, HEX.ink], ["Accent", "Primary action only", HEX.signal, HEX.ink],
  ];
  return (
    <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
      <ul className="grid max-w-[460px] gap-2.5">
        {sw.map(([k, s, hex, on]) => (
          <li key={k} className="grid grid-cols-[52px_1fr_auto] items-center gap-3">
            <span className="h-[38px] border border-[var(--rime)]" style={{ background: hex }} />
            <span><span className="wids-title block text-[13.5px]">{k}</span><span className="wids-caption">{s} · {hex}</span></span>
            <span className="wids-label text-[var(--ink)]">{ratio(on, hex).toFixed(2)}:1</span>
          </li>
        ))}
      </ul>
      <Phone><TodayScreen d={d} mode="one" /></Phone>
    </div>
  );
}

/* L6 · alignment */
function AlignCard({ good }: { good: boolean }) {
  const offs = good ? [0, 0, 0, 0, 0] : [0, 36, 12, 58, 24];
  return (
    <figure className="grid gap-3">
      <div className="relative border-[1.5px] border-[var(--ink)] bg-white p-5">
        {(good ? [0] : [...new Set(offs)]).map((o) => <span key={o} aria-hidden="true" className="absolute inset-y-2 w-0 border-l border-dashed border-[var(--ink)] opacity-60" style={{ left: 20 + o }} />)}
        <div className="h-[64px] bg-[var(--bg)]" style={{ marginLeft: offs[0] }}><svg viewBox="0 0 200 64" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true"><path d="M0 50 L30 46 L60 48 L80 20 L95 44 L140 40 L160 12 L175 38 L200 36" fill="none" stroke="#56616f" strokeWidth="1" vectorEffect="non-scaling-stroke" /></svg></div>
        <p className="wids-label mt-4" style={{ marginLeft: offs[1] }}>Finding</p>
        <p className="wids-title mt-1" style={{ marginLeft: offs[2] }}>Structure is operational</p>
        <p className="mt-1 text-[12.5px]" style={{ marginLeft: offs[3] }}>BIC settles at K = 21, near the 18 groups.</p>
        <a className="wids-link mt-2 inline-block text-[12.5px]" href="#telemetry" style={{ marginLeft: offs[4] }}>Read the BIC sweep</a>
      </div>
      <figcaption className="flex items-center gap-2">{good ? <StatusTag s="best" label="One shared edge" solid /> : <StatusTag s="gap" label="Five left edges" />}</figcaption>
    </figure>
  );
}

/* L7 · what's clickable */
function Clickable() {
  const [clear, setClear] = useState<"ambiguous" | "clear">("ambiguous");
  const [show, setShow] = useState(false);
  const toast = useToast();
  const A = show ? "outline outline-2 outline-offset-2 outline-dashed outline-[var(--ink)]" : "";
  const amb = clear === "ambiguous";
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <Segmented label="Version" value={clear} set={setClear} options={[{ v: "ambiguous", label: "Ambiguous" }, { v: "clear", label: "Clear" }]} />
        <span className="flex items-center gap-2.5"><Switch on={show} set={setShow} label="Show affordances" /><span className="text-[13px]">Show affordances</span></span>
      </div>
      <div className="border border-[var(--rime)] bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--rime)] pb-3">
          <span className="wids-display text-[12px] tracking-[0.05em]">ESA telemetry</span>
          <nav className="flex items-center gap-4 text-[12px]" aria-label="Mock navigation">
            {["Methods", "Data", "Paper"].map((t) => amb
              ? <span key={t} className="text-[var(--muted)]">{t}</span>
              : <a key={t} href="#principles" className={`wids-link ${A}`} onClick={(e) => { e.preventDefault(); toast(`${t} (pretend)`); }}>{t}</a>)}
            {amb ? <span className="wids-label text-[var(--ink)]">Explore</span> : <button type="button" className={`wids-pill is-sm ${A}`} onClick={() => toast("Explore (pretend)", "arrow")}>Explore</button>}
          </nav>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[["GMM", "0.384"], ["TVAE", "0.438"], ["K-Means", "0.322"]].map(([k, v]) => amb ? (
            <div key={k} className="rounded-full border-2 border-[var(--ink)] bg-[var(--bg)] px-4 py-3 text-center"><span className="block text-[12px] font-medium">{k}</span><span className="wids-num text-[16px]">{v}</span></div>
          ) : (
            <button key={k} type="button" className={`wids-card p-3 ${A}`} onClick={() => toast(`${k} detail (pretend)`)}>
              <span className="flex items-center justify-between"><span className="text-[12px] font-medium">{k}</span><Icon n="right" size={12} /></span>
              <span className="wids-num text-[18px]">{v}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="wids-caption" aria-live="polite">{amb
        ? "Ambiguous: the links look like plain labels, the pill-shaped stat boxes look pressable but aren't, and the real action looks like a caption."
        : "Clear: links are underlined, cards have a hairline, hover ring and arrow, and the one action is the filled pill."}{show ? " Dashed outlines mark everything clickable." : ""}</p>
    </div>
  );
}

/* L9 · the full design system, one screen */
function Overview() {
  const sw = [HEX.bg, HEX.surface, HEX.ink, HEX.muted, HEX.rime, HEX.signal];
  const names = ["Background", "Surface", "Text", "Muted", "Border", "Accent"];
  const H = ({ n, t }: { n: number; t: string }) => (
    <p className="mb-2 flex items-center gap-2"><span className="grid h-4 w-4 place-items-center rounded-full bg-[var(--ink)] text-[10px] text-white">{n}</span><span className="wids-label text-[var(--ink)]">{t}</span></p>
  );
  return (
    <div className="overflow-hidden border-[1.5px] border-[var(--ink)] bg-white" inert>
      <div className="flex items-center gap-2 border-b border-[var(--rime)] bg-[var(--bg)] px-3 py-2">
        {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 rounded-full border border-[var(--muted)]" />)}
        <span className="wids-caption ml-2 truncate">/design-systems/white-immersion</span>
      </div>
      <div className="p-4 sm:p-6">
        <p className="wids-display text-[15px] tracking-[0.05em]">Whiteout · Design System</p>
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]">
          <div className="grid content-start gap-5">
            <div><H n={1} t="Color roles" />
              <div className="grid grid-cols-6 gap-1">{sw.map((c, i) => <div key={c}><span className="block h-8 border border-[var(--rime)]" style={{ background: c }} /><span className="mt-1 block truncate text-[10px] text-[var(--muted)]">{names[i]}</span></div>)}</div>
            </div>
            <div><H n={2} t="Type roles" />
              <div className="grid gap-1">
                <div className="flex items-baseline justify-between"><span className="wids-num text-[26px] leading-none">0.438</span><span className="text-[10px] text-[var(--muted)]">Display</span></div>
                <div className="flex items-baseline justify-between"><span className="wids-display text-[12px]">TransformerVAE</span><span className="text-[10px] text-[var(--muted)]">Heading</span></div>
                <div className="flex items-baseline justify-between"><span className="text-[11.5px]">Best on rare events.</span><span className="text-[10px] text-[var(--muted)]">Body</span></div>
                <div className="flex items-baseline justify-between"><span className="wids-label">Mission 2</span><span className="text-[10px] text-[var(--muted)]">Label</span></div>
              </div>
            </div>
            <div><H n={3} t="Spacing & shape" />
              <div className="flex items-end gap-1.5">{[4, 8, 12, 16, 24, 32].map((s) => <span key={s} className="w-2 bg-[var(--ink)]" style={{ height: s }} />)}<span className="ml-3 h-6 w-8 border border-[var(--rime)] bg-white" /><span className="h-6 w-6 rounded-full border border-[var(--rime)]" /></div>
              <p className="mt-1 text-[10px] text-[var(--muted)]">4–32 scale · square slabs · round floats · hairline + cold drop</p>
            </div>
          </div>
          <div className="grid content-start gap-5">
            <div><H n={4} t="Components" />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="wids-pill is-sm">Explore</span><span className="wids-btn min-h-[30px] px-2.5 text-[10px]">Export</span><span className="wids-link text-[11px]">BIC sweep</span>
                <span className="wids-input inline-flex min-h-[30px] w-[96px] items-center text-[11px] text-[var(--muted)]">ch_41</span>
                <span className="wids-check is-sel" /><span className="wids-radio is-sel" /><span className="wids-switch is-sel inline-block" />
                <span className="wids-chip is-sel min-h-[28px] px-2 text-[10px]">GMM</span><span className="wids-chip min-h-[28px] px-2 text-[10px]">VAE</span>
                <span className="wids-badge">▲ Anomaly</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2"><div className="border border-[var(--rime)] p-2"><span className="wids-label block text-[10px]">GMM · M1</span><span className="wids-num text-[16px]">0.384</span></div><div className="border border-[var(--rime)] p-2 text-[11px]"><div className="flex justify-between border-b border-[var(--rime)] pb-1"><span>TVAE M2</span><span>.438</span></div><div className="flex justify-between pt-1"><span>HVAE M2</span><span>.434</span></div></div></div>
            </div>
            <div><H n={5} t="Control states" />
              <div className="flex flex-wrap gap-2">{[["", "Rest"], ["is-hover", "Hover"], ["is-focus", "Focus"], ["is-press", "Pressed"], ["is-sel", "Selected"], ["is-dis", "Disabled"]].map(([c, l]) => (
                <span key={l} className="grid justify-items-center gap-1"><span className={`wids-pill is-sm ${c}`}>Fly</span><span className="text-[10px] text-[var(--muted)]">{l}</span></span>
              ))}</div>
            </div>
            <div><H n={6} t="UI states" />
              <div className="grid grid-cols-2 gap-1.5 text-center text-[10px] sm:grid-cols-4">
                {[["shard", "No run yet", "Empty"], ["retry", "----===+++", "Loading"], ["cross", "Couldn't load", "Error"], ["check", "0.438 loaded", "Success"]].map(([i, t, l]) => (
                  <div key={l} className="grid justify-items-center gap-1 border border-[var(--rime)] px-1 py-2"><Icon n={i} size={14} /><span className="truncate">{t}</span><span className="text-[var(--muted)]">{l}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrinciplesSection({ d }: { d: DSData }) {
  const toast = useToast();
  return (
    <Section id="principles" n={10} title="Lecture principles" intro={<>The Week 2 lecture, rebuilt in this style on our results. Each card shows one design principle, usually as a bad and a good version side by side, so the rule is visible rather than described.</>}>
      <div className="grid gap-5 md:grid-cols-2">
        <Spec code="L1" name="What you see" sub="Visual hierarchy" use="Four levers decide what is read first: size, weight, contrast, position. The same four PR-AUC values, one lever at a time." tokens="Numeral 30 vs 13 · 500 vs 300 · Ink vs #A7B0BB · top + 2px rail" wide><WhatYouSee d={d} /></Spec>
        <Spec code="L2" name="Emphasize by de-emphasizing" sub="To make one thing stand out, make the rest quieter" use="Louder: every element shouts and an arrow points at the button. Quieter: stats drop to Glacier, so the cyan action wins without growing." tokens="Glacier for supporting numbers · one Signal pill" wide>
          <div className="flex flex-wrap justify-center gap-10">
            <Phone label="Louder" sub="Everything competes."><TodayScreen d={d} mode="loud" /></Phone>
            <Phone label="Quieter" sub="Only the action stands out."><TodayScreen d={d} mode="quiet" onPrimary={() => toast("Opening findings (pretend).", "arrow")} /></Phone>
          </div>
        </Spec>
        <Spec code="L3" name="Type roles" sub="Working with multiple styles" use="One card, five named roles. Each role keeps one family, size and weight everywhere." tokens="Michroma: Heading, Display · Martian Mono: Label, Body, Caption" wide><TypeRoles d={d} /></Spec>
        <Spec code="L4" name="Color roles" sub="Each color is used deliberately" use="The palette by job, then the same jobs applied to a real screen." tokens="Whiteout · Frost · Ink · Glacier · Rime · Signal" wide><ColorRoles d={d} /></Spec>
        <Spec code="L5" name="Accent color" sub="Use it sparingly, for the main action" use="Accent everywhere means nothing stands out. One accent, only on Explore findings." tokens="Signal on the primary pill only" wide>
          <div className="flex flex-wrap justify-center gap-10">
            <Phone label="Accent everywhere" sub="Nothing stands out."><TodayScreen d={d} mode="accentAll" /></Phone>
            <Phone label="One accent" sub="Cyan only on Explore findings."><TodayScreen d={d} mode="one" onPrimary={() => toast("Opening findings (pretend).", "arrow")} /></Phone>
          </div>
        </Spec>
        <Spec code="L6" name="Alignment" sub="Line up elements to make designs cohesive" use="Same card twice. Five left edges read as careless; one shared edge reads as designed." tokens="20px inset · one left edge · dashed guides show edges" wide>
          <div className="grid gap-6 sm:grid-cols-2"><AlignCard good={false} /><AlignCard good /></div>
        </Spec>
        <Spec code="L7" name="What's clickable?" sub="Where are the affordances?" use="Toggle the version and reveal the affordances. Shape must say what can be pressed." tokens="underline = link · hairline + arrow = card · filled pill = action" wide><Clickable /></Spec>
        <Spec code="L8" name="Choosing a direction" sub="Fit the style to the context" use="The same screen in this style and in a deliberately wrong one." tokens="audience: ML recruiters skimming, peers inspecting" wide>
          <div className="flex flex-wrap justify-center gap-10">
            <Phone label="Whiteout" sub="Calm, legible, one action."><TodayScreen d={d} mode="one" /></Phone>
            <Phone label="Neon arcade" sub="Wrong for this audience."><TodayScreen d={d} mode="wrong" /></Phone>
          </div>
          <p className="mt-5 border-t border-[var(--rime)] pt-3 text-[12.5px] leading-[1.65]">Recruiters skim for one number in a few seconds and peers inspect curves for minutes. The neon version turns 0.438 into a score to celebrate, buries the method name, and tires the eye; the white field keeps the number exact and quiet.</p>
        </Spec>
        <Spec code="L9" name="The full design system" sub="Every component, in every state" use="The whole system on one screen, in the handout's layout: 1 color, 2 type, 3 spacing, 4 components, 5 control states, 6 UI states." tokens="summary of sections 01–06" wide><Overview /></Spec>
      </div>
    </Section>
  );
}
