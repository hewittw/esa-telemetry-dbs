"use client";

// Principles (L1–L9): the week 2 lecture concepts rebuilt in refined paper on our own numbers.
// Phone mockups are ink-hairline devices with the system's 3px "stacked card" offset; every screen
// is drawn from the same Today component so the comparisons change one variable at a time.
import { useState, type ReactNode } from "react";
import {
  FOCUS, IconArrow, IconCheck, IconChevron, IconCross, IconWarn, MONO, SANS, SERIF, STATUS, btnPrimary, btnSecondary, caption, checkbox, chip, chipCheck, field,
  link, radio, switchKnob, switchTrack, tab,
} from "./kit";
import { CountBadge, Segmented, Switch, useToast } from "./ui";

/* ------------------------------------------------------------------ helpers */
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const DASH = "outline-dashed outline-[1.5px] outline-offset-2 outline-[color:var(--ink)]";

/** Ink-hairline phone with the paper-stack offset. */
function Phone({ children, title, sub, className = "" }: { children: ReactNode; title?: string; sub?: ReactNode; className?: string }) {
  return (
    <figure className={`mx-auto w-full max-w-[15rem] min-w-0 ${className}`}>
      <div className="relative">
        <span aria-hidden className="absolute inset-0 translate-x-[3px] translate-y-[3px] rounded-[20px] border border-[var(--rule-strong)] bg-[var(--paper)]" />
        <div className="relative overflow-hidden rounded-[20px] border border-[var(--ink)]">{children}</div>
      </div>
      {title && (
        <figcaption className="mt-4 text-center">
          <span className={`${SERIF} block text-[20px] leading-tight font-[450] text-[var(--ink)]`}>{title}</span>
          {sub && <span className={`${SANS} mt-1 block text-[12.5px] leading-[1.4] text-[var(--muted)]`}>{sub}</span>}
        </figcaption>
      )}
    </figure>
  );
}

/** Two screens side by side from sm up; below sm a segmented control shows one at a time. */
function Pair({ label, a, b, names }: { label: string; a: ReactNode; b: ReactNode; names: [string, string] }) {
  const [pick, setPick] = useState<0 | 1>(1);
  return (
    <div>
      <div className="mb-4 flex justify-center sm:hidden">
        <Segmented label={label} value={pick} onChange={setPick} options={[{ value: 0, label: names[0] }, { value: 1, label: names[1] }]} />
      </div>
      <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2">
        <div className={pick === 0 ? "" : "hidden sm:block"}>{a}</div>
        <div className={pick === 1 ? "" : "hidden sm:block"}>{b}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ the Today screen (Mission 2, TransformerVAE) */
type V = "one" | "loud" | "quiet" | "all";
export type Role = "bg" | "surface" | "text" | "muted" | "accent";
const CHECKS: [string, "ok" | "warn", string][] = [["GMM", "ok", "Verified"], ["CapacityVAE", "ok", "Verified"], ["TransformerVAE", "warn", "Mixed"]];

function Today({ v = "one", role = null, grey = false, mark = null }: { v?: V; role?: Role | null; grey?: boolean; mark?: "skim" | "inspect" | null }) {
  const loud = v === "loud", quiet = v === "quiet", all = v === "all";
  const A = "var(--accent)";
  const hl = (r: Role) => (role === r ? DASH : "");
  const ink = all ? A : "var(--ink)";
  const muted = all ? A : loud ? "var(--ink)" : "var(--muted)";
  const edge = loud ? "var(--ink)" : all ? A : "var(--rule)";
  const Tag = ({ t }: { t: string }) => <span className={`${MONO} absolute -top-2.5 right-2 rounded-[2px] bg-[var(--ink)] px-1.5 py-px text-[10.5px] text-[var(--paper)]`}>{t}</span>;
  return (
    <div className={`relative bg-[var(--paper)] px-3.5 pt-2.5 pb-4 transition-[filter] duration-300 ${grey ? "grayscale" : ""} ${role === "bg" ? "outline-dashed outline-[1.5px] -outline-offset-[6px] outline-[color:var(--ink)]" : ""}`}>
      <span aria-hidden className="mx-auto mb-3 block h-[5px] w-12 rounded-full bg-[var(--ink)]" />
      <p className={`${MONO} inline-block text-[10.5px] uppercase tracking-[0.08em] ${hl("muted")}`} style={{ color: muted, fontWeight: loud ? 600 : 400 }}>Today · Mission 2</p>
      <div className={`relative mt-2 rounded-[3px] border p-3 ${hl("surface")} ${mark === "skim" ? DASH : ""}`} style={{ background: all ? "var(--accent-wash)" : "var(--mount)", borderColor: edge, borderWidth: loud ? 1.5 : 1 }}>
        {mark === "skim" && <Tag t="skims this" />}
        <p className={`${SERIF} leading-tight ${hl("text")}`} style={{ color: ink, fontSize: loud ? 20 : 18, fontWeight: loud ? 700 : 450 }}>TransformerVAE</p>
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className={`${SERIF} leading-none tracking-[-0.03em] ${hl("text")}`} style={{ color: quiet ? "var(--graphite)" : ink, fontSize: loud ? 52 : quiet ? 32 : 46, fontWeight: loud ? 600 : 300 }}>0.438</span>
          <span className={`${SANS} text-[11px] whitespace-nowrap ${hl("muted")}`} style={{ color: muted, fontWeight: loud ? 700 : 400 }}>PR-AUC</span>
        </p>
        <p className={`${SERIF} mt-1.5 text-[13.5px] leading-snug ${hl("text")}`} style={{ color: quiet ? "var(--muted)" : ink, fontWeight: loud ? 600 : 400 }}>Best on rare events.</p>
      </div>
      <dl className={`relative mt-2 grid grid-cols-3 gap-1.5 ${mark === "inspect" ? DASH : ""}`}>
        {mark === "inspect" && <Tag t="checks this" />}
        {([["ROC-AUC", "0.749"], ["Latent K", "18"], ["vs. rate", "9.4×"]] as const).map(([k, val]) => (
          <div key={k} className={`min-w-0 rounded-[3px] border px-1.5 py-1.5 ${hl("surface")}`} style={{ background: loud ? "var(--paper)" : all ? "var(--paper)" : "var(--parchment)", borderColor: loud || all ? edge : "transparent", borderWidth: loud ? 1.5 : 1 }}>
            <dt className={`${SANS} truncate text-[10.5px] ${hl("muted")}`} style={{ color: muted, fontWeight: loud ? 600 : 400 }}>{k}</dt>
            <dd className={`${MONO} text-[14px] leading-tight ${hl("text")}`} style={{ color: quiet ? "var(--muted)" : ink, fontWeight: loud ? 600 : 400, fontSize: loud ? 16 : 14 }}>{val}</dd>
          </div>
        ))}
      </dl>
      <ul className={`relative mt-2 divide-y rounded-[3px] border px-2.5 ${hl("surface")} ${mark === "inspect" ? DASH : ""}`} style={{ background: "var(--mount)", borderColor: edge, borderWidth: loud ? 1.5 : 1 }} aria-label="Run checks">
        {CHECKS.map(([n, s, w]) => {
          const st = STATUS[s];
          const c = all ? A : quiet ? "var(--muted)" : st.color;
          return (
            <li key={n} className="flex items-center justify-between gap-2 py-1.5" style={{ borderColor: all ? "var(--accent-wash)" : "var(--rule)" }}>
              <span className={`${SANS} min-w-0 truncate text-[12px] ${hl("text")}`} style={{ color: quiet ? "var(--muted)" : ink, fontWeight: loud ? 700 : 500 }}>{n}</span>
              <span className={`${SANS} inline-flex shrink-0 items-center gap-1 text-[11px] font-medium`} style={{ color: c, fontWeight: loud ? 700 : 500 }}><st.Icon size={10} />{w}</span>
            </li>
          );
        })}
      </ul>
      <span className={`${SANS} ${loud || quiet ? "mt-10" : "mt-3"} flex items-center justify-center rounded-[3px] text-white ${hl("accent")}`} style={{ background: A, height: loud ? 46 : 40, fontSize: loud ? 15.5 : 14, fontWeight: loud ? 700 : 500 }}>Explore the latent map</span>
      {loud && (
        <svg aria-hidden viewBox="0 0 40 46" className="absolute right-5 bottom-[3.7rem] h-9 w-8" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round">
          <path d="M34 2C38 18 30 34 10 40" /><path d="M10 40l7-8M10 40l10 2" />
        </svg>
      )}
    </div>
  );
}

/** A deliberately wrong direction for our readers: gamified candy. */
function Candy() {
  const face = { fontFamily: 'ui-rounded, "Arial Rounded MT Bold", "Trebuchet MS", system-ui, sans-serif' };
  const bits: [number, number, string, number][] = [[12, 12, "#FFF200", 20], [82, 8, "#00E0FF", -30], [70, 30, "#FFFFFF", 45], [20, 46, "#00E0FF", 10], [88, 52, "#FFF200", -15], [8, 70, "#FFFFFF", 30], [60, 74, "#FFF200", 60]];
  return (
    <div className="relative overflow-hidden px-3.5 pt-2.5 pb-4" style={{ ...face, background: "linear-gradient(165deg,#9C1458,#C2185B 45%,#B23A0E)" }}>
      {bits.map(([x, y, c, r], i) => <span key={i} aria-hidden className="absolute h-[5px] w-[11px] rounded-[2px]" style={{ left: `${x}%`, top: `${y}%`, background: c, transform: `rotate(${r}deg)` }} />)}
      <span aria-hidden className="relative mx-auto mb-3 block h-[5px] w-12 rounded-full bg-white/70" />
      <p className="relative text-[11px] font-black tracking-[0.14em] text-[#FFF200] uppercase">★ Today’s high score ★</p>
      <p className="relative mt-1 text-[56px] leading-none font-black text-white italic" style={{ textShadow: "0 3px 0 #5E0B33" }}>0.438!</p>
      <p className="relative mt-1 text-[13px] font-black text-white uppercase">You’re #1 on Mission 2</p>
      <div className="relative mt-3 grid grid-cols-3 gap-1.5">
        {["ROC 0.75", "K 18", "9.4×!!"].map((t) => <span key={t} className="rounded-full bg-white/20 px-1 py-2 text-center text-[11.5px] font-black text-white ring-2 ring-white/60">{t}</span>)}
      </div>
      <ul className="relative mt-3 space-y-1.5">
        {["GMM", "CapacityVAE", "TransformerVAE"].map((t, i) => <li key={t} className="flex items-center justify-between rounded-full bg-black/25 px-3 py-1 text-[12px] font-black text-white uppercase"><span className="truncate">{t}</span><span className="text-[#FFF200]">{i < 2 ? "WIN" : "OK?"}</span></li>)}
      </ul>
      <span className="relative mt-3 flex h-11 items-center justify-center rounded-full bg-[#C6FF00] text-[15px] font-black text-[#1A1A1A] uppercase" style={{ boxShadow: "0 4px 0 #6B8A00" }}>Level up +1</span>
    </div>
  );
}

/* ================================================================== L1 · What you see */
const VALS: [string, string][] = [["GMM", "0.390"], ["CapacityVAE", "0.414"], ["HierarchicalVAE", "0.434"], ["TransformerVAE", "0.438"]];
const CUES = [
  { k: "Size", t: "Bigger things get noticed first." },
  { k: "Weight", t: "Bolder text stands out." },
  { k: "Contrast", t: "The most contrast with the background draws the eye." },
  { k: "Position", t: "Things near the top are seen first." },
] as const;
export function WhatYouSee() {
  const cell = (cue: string, name: string, v: string, hot: boolean) => {
    const base = `${SERIF} leading-none text-[var(--ink)] tabular-nums`;
    const num =
      cue === "Size" ? <span className={base} style={{ fontSize: hot ? 44 : 17, fontWeight: 400 }}>{v}</span>
      : cue === "Weight" ? <span className={base} style={{ fontSize: 22, fontWeight: hot ? 700 : 300 }}>{v}</span>
      : cue === "Contrast" ? <span className={`${base} rounded-[2px] px-1.5 py-0.5`} style={{ fontSize: 22, background: hot ? "var(--ink)" : "transparent", color: hot ? "var(--paper)" : "var(--ink)" }}>{v}</span>
      : <span className={base} style={{ fontSize: 22 }}>{v}</span>;
    return (
      <li key={name} className="flex items-baseline justify-between gap-3">
        <span className={`${SANS} min-w-0 truncate text-[11px] text-[var(--muted)]`}>{name}</span>
        {num}
      </li>
    );
  };
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CUES.map((c) => {
        const order = c.k === "Position" ? [VALS[3], ...VALS.slice(0, 3)] : VALS;
        return (
          <figure key={c.k} className="flex flex-col rounded-[3px] border border-[var(--rule)] bg-[var(--mount)]">
            <ul aria-hidden className={`flex h-[10.5rem] flex-col justify-end gap-2.5 px-4 pt-4 pb-4 ${c.k === "Position" ? "justify-start" : ""}`}>
              {order.map(([n, v], i) => (
                <div key={n} className={c.k === "Position" && i === 0 ? "mb-3 border-b border-[var(--rule)] pb-3" : ""}>{cell(c.k, n, v, n === "TransformerVAE")}</div>
              ))}
            </ul>
            <figcaption className="border-t border-[var(--rule)] px-4 py-3">
              <span className={`${SANS} block text-[13px] font-semibold text-[var(--ink)]`}>{c.k}</span>
              <span className={`${SANS} block text-[12.5px] leading-[1.4] text-[var(--muted)]`}>{c.t}<span className="sr-only"> Here 0.438, TransformerVAE on Mission 2, wins by {c.k.toLowerCase()} alone.</span></span>
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

/* ================================================================== L2 · Emphasise by de-emphasising */
export function LouderQuieter() {
  return (
    <Pair label="Version" names={["Louder", "Quieter"]}
      a={<Phone title="Louder" sub="Everything shouts, plus an arrow. Nothing leads."><Today v="loud" /></Phone>}
      b={<Phone title="Quieter" sub="The stats went quiet, so only the action stands out."><Today v="quiet" /></Phone>}
    />
  );
}

/* ================================================================== L3 · Type roles */
const TROLES: { r: string; f: string; el: ReactNode; row: string }[] = [
  { r: "Label", f: "Plex Sans 500 · 13", row: "row-start-1 pt-5", el: <p className={`${SANS} text-[13px] font-medium text-[var(--ink)]`}>Mission 2 · Generative</p> },
  { r: "Heading", f: "Newsreader 450 · 26", row: "row-start-2 pt-2", el: <p className={`${SERIF} text-[clamp(1.35rem,3vw,1.625rem)] leading-tight font-[450] text-[var(--ink)]`}>TransformerVAE</p> },
  { r: "Display", f: "Newsreader 300 · 72", row: "row-start-3 pt-1", el: <p className="flex items-baseline gap-2"><span className={`${SERIF} text-[clamp(2.6rem,9vw,4.5rem)] leading-none font-light tracking-[-0.03em] text-[var(--ink)]`}>0.438</span><span className={`${SANS} text-[12px] text-[var(--muted)]`}>PR-AUC</span></p> },
  { r: "Body", f: "Newsreader 400 · 17", row: "row-start-4 pt-3", el: <p className={`${SERIF} text-[17px] leading-snug text-[var(--ink)]`}>Best on rare events.</p> },
  { r: "Caption", f: "Plex Sans 400 · 12", row: "row-start-5 pt-2 pb-5", el: <p className={caption}>Neg. ELBO · Table 1, mixed run</p> },
];
export function TypeRolesCard() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_1rem_minmax(0,7.5rem)] sm:grid-cols-[minmax(0,19rem)_2.5rem_minmax(0,1fr)]">
      <div aria-hidden className="col-start-1 row-start-1 row-end-6 rounded-[3px] border border-[var(--ink)] bg-[var(--mount)]" />
      {TROLES.map((t) => (
        <div key={t.r} className={`col-start-1 min-w-0 px-4 sm:px-6 ${t.row}`}>{t.el}</div>
      ))}
      {TROLES.map((t) => (
        <div key={`l-${t.r}`} aria-hidden className={`col-start-2 flex items-center ${t.row.split(" ")[0]}`}>
          <span className="relative h-px w-full bg-[var(--ink)]"><span className="absolute -top-[2px] -right-[2.5px] size-[5px] rounded-full bg-[var(--ink)]" /></span>
        </div>
      ))}
      {TROLES.map((t) => (
        <div key={`n-${t.r}`} className={`col-start-3 flex min-w-0 flex-col justify-center pl-2 sm:pl-3 ${t.row.split(" ")[0]}`}>
          <span className={`${SANS} text-[14px] leading-tight font-semibold text-[var(--ink)]`}>{t.r}</span>
          <span className={`${MONO} text-[11px] leading-[1.35] text-[var(--muted)]`}>{t.f}</span>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== L4 · Colour roles, applied (and: don't use colour alone) */
const CROLES: { id: Role; role: string; name: string; hex: string; hex2?: string; job: string; fg: string; bg: string }[] = [
  { id: "bg", role: "Background", name: "Paper", hex: "#F6F2EA", job: "Behind content", fg: "#211F1B", bg: "#F6F2EA" },
  { id: "surface", role: "Surface", name: "Mount · Parchment", hex: "#FBF8F2", hex2: "#ECE6D8", job: "Cards, and quiet panels", fg: "#211F1B", bg: "#ECE6D8" },
  { id: "text", role: "Text", name: "Ink", hex: "#211F1B", job: "Headings, body, numbers", fg: "#211F1B", bg: "#F6F2EA" },
  { id: "muted", role: "Muted", name: "Pencil", hex: "#69625A", job: "Labels and small print", fg: "#69625A", bg: "#F6F2EA" },
  { id: "accent", role: "Accent", name: "Vermilion", hex: "#B0401C", job: "The primary action only", fg: "#FFFFFF", bg: "#B0401C" },
];
export function ColorRolesApplied() {
  const [pin, setPin] = useState<Role | null>("accent");
  const [hover, setHover] = useState<Role | null>(null);
  const [grey, setGrey] = useState(false);
  const live = hover ?? pin;
  return (
    <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)] sm:items-start">
      <div>
        <ul className="space-y-1" aria-label="Colour roles. Pick one to trace it on the screen.">
          {CROLES.map((c) => {
            const r = ratio(c.fg, c.bg);
            return (
              <li key={c.id}>
                <button type="button" aria-pressed={pin === c.id} onClick={() => setPin((p) => (p === c.id ? null : c.id))} onMouseEnter={() => setHover(c.id)} onMouseLeave={() => setHover(null)}
                  className={`${FOCUS} grid w-full grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 rounded-[3px] p-1.5 text-left transition-[background-color,box-shadow] duration-200 hover:bg-[var(--parchment)] active:bg-[var(--rule)] aria-pressed:bg-[var(--parchment)] aria-pressed:shadow-[inset_2px_0_0_var(--ink)]`}>
                  <span aria-hidden className="flex size-10 overflow-hidden rounded-[3px] border border-[var(--rule-strong)]">
                    <span className="flex-1" style={{ background: c.hex }} />{c.hex2 && <span className="flex-1" style={{ background: c.hex2 }} />}
                  </span>
                  <span className="min-w-0">
                    <span className={`${SANS} block text-[14px] font-semibold text-[var(--ink)]`}>{c.role} <span className="font-normal text-[var(--muted)]">· {c.name}</span></span>
                    <span className={`${SANS} block text-[12px] leading-[1.35] text-[var(--muted)]`}>{c.job} · <span className={MONO}>{c.hex2 ? `${c.hex} / ${c.hex2}` : c.hex}</span>{c.id !== "bg" && <> · <span className={MONO}>{r.toFixed(1)}:1</span></>}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 border-t border-[var(--rule)] pt-1">
          <Switch checked={grey} onChange={setGrey} label="Preview in greyscale" hint="Don’t use colour alone: the run checks keep their icon and word." />
        </div>
        <p className={`${caption} mt-1`} aria-live="polite">{live ? `Dashed ink marks every ${CROLES.find((c) => c.id === live)!.role.toLowerCase()} on the screen.` : "Pick a role to trace it on the screen."}</p>
      </div>
      <Phone><Today v="one" role={live} grey={grey} /></Phone>
    </div>
  );
}

/* ================================================================== L5 · Accent colour */
export function AccentDemo() {
  return (
    <Pair label="Accent use" names={["Everywhere", "One accent"]}
      a={<Phone title="Accent everywhere" sub="Nothing stands out."><Today v="all" /></Phone>}
      b={<Phone title="One accent" sub="Vermilion only on Explore the latent map."><Today v="one" /></Phone>}
    />
  );
}

/* ================================================================== L6 · Alignment */
function FindingCard({ aligned, guides }: { aligned: boolean; guides: boolean }) {
  const off = aligned ? [0, 0, 0, 0, 0] : [0, 18, 6, 28, 12];
  const G = ({ full }: { full?: boolean }) => guides ? <span aria-hidden className={`pointer-events-none absolute left-0 border-l border-dashed border-[var(--oxblood)] ${full ? "-top-3 -bottom-3" : "-top-1 -bottom-1"}`} /> : null;
  const Row = ({ i, children }: { i: number; children: ReactNode }) => (
    <div className="relative" style={{ marginLeft: off[i] }}>{!aligned && <G />}{children}</div>
  );
  return (
    <article className="rounded-[3px] border border-[var(--ink)] bg-[var(--mount)] p-4">
      <div className="relative space-y-2.5">
        {aligned && <G full />}
        <Row i={0}>
          <div className="h-20 rounded-[2px] bg-[var(--parchment)]">
            <svg aria-hidden viewBox="0 0 200 80" preserveAspectRatio="none" className="h-full w-full"><path d="M6,14 C40,16 60,30 90,42 S150,66 194,70" fill="none" stroke="var(--prussian)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>
          </div>
        </Row>
        <Row i={1}><p className={`${MONO} text-[10.5px] uppercase tracking-[0.08em] text-[var(--muted)]`}>Finding · Mission 1</p></Row>
        <Row i={2}><p className={`${SERIF} text-[21px] leading-tight font-[450] text-[var(--ink)]`}>GMM leads Mission 1</p></Row>
        <Row i={3}><p className={`${SANS} text-[13px] leading-[1.45] text-[var(--muted)]`}>PR-AUC 0.384 and ROC-AUC 0.692, above every VAE.</p></Row>
        <Row i={4}><span className={`${SANS} inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--ink)] underline decoration-[var(--rule-strong)] underline-offset-4`}>Go to the figure <IconArrow size={11} /></span></Row>
      </div>
    </article>
  );
}
export function AlignmentDemo() {
  const [guides, setGuides] = useState(true);
  return (
    <div>
      <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2">
        <figure><FindingCard aligned={false} guides={guides} /><figcaption className={`${caption} mt-2`}><b className="font-semibold text-[var(--ink)]">Misaligned.</b> Five left edges, so the eye keeps re-finding the start.</figcaption></figure>
        <figure><FindingCard aligned guides={guides} /><figcaption className={`${caption} mt-2`}><b className="font-semibold text-[var(--ink)]">Aligned.</b> One shared edge: the card reads as one object.</figcaption></figure>
      </div>
      <div className="mt-2 max-w-[16rem]"><Switch checked={guides} onChange={setGuides} label="Show guides" /></div>
    </div>
  );
}

/* ================================================================== L7 · What's clickable? (and the focus ring) */
export function ClickableDemo() {
  const toast = useToast();
  const [mode, setMode] = useState<"before" | "after">("before");
  const [show, setShow] = useState(true);
  const clear = mode === "after";
  const go = (t: string) => toast({ title: `${t}: a faked click`, body: "This mini page doesn’t navigate." });
  // A pseudo-element, not an outline, so it never fights the focus ring.
  const aff = show ? "relative after:pointer-events-none after:absolute after:-inset-[4px] after:rounded-[3px] after:border after:border-dashed after:border-[var(--ink)] after:content-['']" : "";
  const fake = show && !clear ? "outline-dashed outline-[1.5px] outline-offset-[3px] outline-[color:var(--oxblood)]" : "";
  const NotLink = () => (show && !clear ? <span className={`${MONO} absolute -top-3 right-1 z-[1] inline-flex items-center gap-1 rounded-[2px] bg-[var(--oxblood)] px-1.5 py-px text-[10.5px] font-normal tracking-normal text-[var(--paper)] no-underline`}><IconCross size={9} />not a link</span> : null);
  const navLink = clear ? `${link} ${SANS} text-[13px]` : `${SANS} ${FOCUS} rounded-[2px] text-[13px] text-[var(--muted)]`;
  return (
    <div className="@container">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Segmented label="Version" value={mode} onChange={setMode} options={[{ value: "before", label: "Ambiguous" }, { value: "after", label: "Clear" }]} />
        <div className="w-[13rem]"><Switch checked={show} onChange={setShow} label="Show affordances" /></div>
      </div>
      <div className="mt-3 overflow-hidden rounded-[3px] border border-[var(--ink)] bg-[var(--paper)]">
        <div className="flex items-center gap-2 border-b border-[var(--rule)] px-3 py-1.5" aria-hidden>
          {[0, 1, 2].map((i) => <span key={i} className="size-2 rounded-full border border-[var(--rule-strong)]" />)}
          <span className={`${MONO} ml-2 text-[11px] text-[var(--muted)]`}>/findings</span>
        </div>
        <div className="p-4 @md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <span className={`${SERIF} text-[15px] font-medium`}>ESA telemetry</span>
            <span className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
              {["Findings", "Methods", "Paper"].map((t) => <button key={t} type="button" onClick={() => go(t)} className={`${navLink} ${aff}`}>{t}</button>)}
              <button type="button" onClick={() => go("Explore")} className={clear ? `${btnPrimary} min-h-8 px-3 text-[13px] ${aff}` : `${SANS} ${FOCUS} rounded-[2px] text-[13px] font-semibold text-[var(--ink)] ${aff}`}>Explore</button>
            </span>
          </div>
          <p className={`${SERIF} relative mt-5 inline-block text-[clamp(1.4rem,3vw,1.75rem)] leading-[1.05] font-light tracking-[-0.02em] ${clear ? "text-[var(--ink)]" : "text-[var(--prussian)] underline decoration-[var(--prussian)] decoration-1 underline-offset-4"} ${fake}`}>18 to 29 modes, not 4 or 5.<NotLink /></p>
          <ul className="mt-4 grid gap-2.5 @md:grid-cols-3">
            {[["GMM leads Mission 1", "PR-AUC 0.384"], ["VAEs lead Mission 2", "TransformerVAE 0.438"]].map(([t, d]) => (
              <li key={t}>
                <button type="button" onClick={() => go(t)} className={`${FOCUS} flex h-full w-full flex-col items-start rounded-[3px] p-3 text-left transition-colors duration-200 ${clear ? "border border-[var(--ink)] bg-[var(--mount)] hover:bg-[var(--parchment)] active:bg-[var(--rule)]" : "bg-[var(--parchment)]"} ${aff}`}>
                  <span className={`${SANS} text-[13px] font-semibold text-[var(--ink)]`}>{t}</span>
                  <span className={`${SANS} text-[12px] text-[var(--muted)]`}>{d}</span>
                  {clear && <span className={`${SANS} mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--ink)] underline decoration-[var(--rule-strong)] underline-offset-4`}>Open <IconArrow size={10} /></span>}
                </button>
              </li>
            ))}
            <li className={`relative rounded-[3px] p-3 ${clear ? "" : "bg-[var(--parchment)]"} ${fake}`}><NotLink />
              <span className={`${SANS} flex items-center justify-between text-[13px] font-semibold text-[var(--ink)]`}>Limitations {!clear && <IconChevron className="-rotate-90" />}</span>
              <span className={`${SANS} block text-[12px] text-[var(--muted)]`}>A note, not a link.</span>
            </li>
          </ul>
        </div>
      </div>
      <p className={`${caption} mt-2`} aria-live="polite">
        {clear
          ? "Clear: links are underlined, the one action is the vermilion button, clickable cards have an ink edge and say Open. The note is plain text."
          : "Ambiguous: the links and the action look like plain text, the cards that open look like the note that doesn’t, and the underlined headline isn’t a link."}
        {show && <> Dashed ink = clickable{!clear && "; dashed oxblood = looks clickable, isn’t"}.</>} Press Tab: each clickable takes the 2px ink focus ring.
      </p>
    </div>
  );
}

/* ================================================================== L8 · Choosing a direction */
const WHY = {
  skim: "An ML recruiter skims for one number and one claim. Here 0.438 and “Best on rare events” land in a glance; the candy version buries them under confetti and a Level up button, and reads as a game, not evidence.",
  inspect: "A research peer inspects the evidence. Here ROC-AUC, latent K and the “Mixed” run check sit in plain mono, ready to be checked; the candy version has no room for provenance and turns a metric into a high score.",
} as const;
export function DirectionDemo() {
  const [who, setWho] = useState<"skim" | "inspect">("skim");
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,31rem)_minmax(0,1fr)] lg:items-center lg:gap-12">
      <Pair label="Direction" names={["This style", "Wrong style"]}
        a={<Phone title="Refined paper" sub="Calm, literate, exact."><Today v="one" mark={who} /></Phone>}
        b={<Phone title="Gamified candy" sub="Loud, playful, rewarding."><Candy /></Phone>}
      />
      <div>
        <p className={`${SANS} mb-2 text-[13px] font-medium text-[var(--ink)]`}>Who is reading?</p>
        <Segmented label="Reader" value={who} onChange={setWho} options={[{ value: "skim", label: "Recruiter, skimming" }, { value: "inspect", label: "Peer, inspecting" }]} />
        <p className={`${SERIF} mt-4 max-w-[46ch] text-[18px] leading-[1.55] text-[var(--ink)]`} aria-live="polite">{WHY[who]}</p>
        <p className={`${caption} mt-3 max-w-[52ch]`}>Same data, same layout. Only the direction changed, and the dashed box on the left marks what this reader looks at first.</p>
      </div>
    </div>
  );
}

/* ================================================================== L9 · The full design system, on one screen */
function Head({ n, t, href }: { n: number; t: string; href: string }) {
  return (
    <h3 className="mb-3">
      <a href={href} className={`${FOCUS} group inline-flex items-center gap-2.5 rounded-[2px]`}>
        <span className={`${MONO} grid size-[22px] place-items-center rounded-[2px] bg-[var(--ink)] text-[11.5px] text-[var(--paper)]`}>{n}</span>
        <span className={`${MONO} text-[12px] font-medium tracking-[0.08em] text-[var(--ink)] uppercase underline decoration-transparent underline-offset-4 transition-colors duration-200 group-hover:decoration-[var(--ink)]`}>{t}</span>
      </a>
    </h3>
  );
}
const SW: [string, string, string, string][] = [["Background", "#F6F2EA", "", ""], ["Surface", "#ECE6D8", "", ""], ["Text", "#211F1B", "#F6F2EA", "t"], ["Muted", "#69625A", "#F6F2EA", "t"], ["Border", "#D9D1C1", "", ""], ["Accent", "#B0401C", "#FFFFFF", "a"]];
export function FullSystem() {
  return (
    <div className="overflow-hidden rounded-[3px] border border-[var(--ink)] bg-[var(--paper)] shadow-[var(--lift)]">
      <div className="flex items-center gap-2 border-b border-[var(--rule)] bg-[var(--mount)] px-3 py-2">
        {[0, 1, 2].map((i) => <span key={i} aria-hidden className="size-2.5 rounded-full border border-[var(--rule-strong)]" />)}
        <span className={`${MONO} ml-2 truncate text-[11.5px] text-[var(--muted)]`}>/design-systems/refined-paper</span>
      </div>
      <div className="p-5 sm:p-7">
        <p className={`${SERIF} text-[clamp(1.6rem,3.4vw,2.25rem)] leading-tight font-light tracking-[-0.015em]`}>Lucid · Patient · Inked <span className="text-[var(--graphite)]">·</span> <i className="font-normal">Design System</i></p>
        <div className="mt-6 grid gap-x-10 gap-y-7 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="space-y-7">
            <section>
              <Head n={1} t="Color roles" href="#color" />
              <ul className="grid grid-cols-3 gap-1.5 min-[480px]:grid-cols-6">
                {SW.map(([n, hex, fg, kind]) => (
                  <li key={n} className="min-w-0">
                    <span className="block aspect-square rounded-[3px] border border-[var(--rule-strong)]" style={{ background: hex }} />
                    <span className={`${SANS} mt-1 block truncate text-[10.5px] text-[var(--muted)]`}>{n}</span>
                    {kind && <span className={`${MONO} block text-[10.5px] text-[var(--ink)]`}>{(kind === "a" ? ratio(fg, hex) : ratio(hex, fg)).toFixed(1)}:1</span>}
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <Head n={2} t="Type roles" href="#type" />
              <dl className="space-y-1.5">
                {([["Display", <span key="d" className={`${SERIF} text-[40px] leading-none font-light tracking-[-0.03em]`}>0.438</span>], ["Heading", <span key="h" className={`${SERIF} text-[22px] leading-tight font-[450]`}>Five method families</span>], ["Body", <span key="b" className={`${SERIF} text-[15.5px]`}>BIC picks K = 21 on Mission 1.</span>], ["Label", <span key="l" className={`${SANS} text-[13px] font-medium`}>Sort by PR-AUC</span>], ["Caption", <span key="c" className={caption}>Figure 3. GMM score, Mission 1.</span>]] as const).map(([k, el]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3"><dd className="min-w-0 truncate">{el}</dd><dt className={`${SANS} shrink-0 text-[11px] text-[var(--muted)]`}>{k}</dt></div>
                ))}
              </dl>
            </section>
            <section>
              <Head n={3} t="Spacing and shape" href="#space" />
              <div className="flex flex-wrap items-end gap-x-6 gap-y-3" aria-hidden>
                <div className="flex items-end gap-2">
                  {[4, 8, 12, 16, 24, 32].map((v) => <span key={v} className="flex flex-col items-center gap-1"><span className="w-3 bg-[var(--ink)]" style={{ height: v }} /><span className={`${MONO} text-[10.5px] text-[var(--muted)]`}>{v}</span></span>)}
                </div>
                <div className="flex items-end gap-2">
                  {[["0", "rounded-none"], ["2", "rounded-[2px]"], ["3", "rounded-[3px]"]].map(([v, c]) => <span key={v} className="flex flex-col items-center gap-1"><span className={`size-8 border border-[var(--ink)] bg-[var(--parchment)] ${c}`} /><span className={`${MONO} text-[10.5px] text-[var(--muted)]`}>{v}px</span></span>)}
                </div>
              </div>
              <p className={`${caption} mt-2`}>4px scale · paper-cut corners · no shadow, a hairline instead</p>
            </section>
          </div>
          <div className="min-w-0 space-y-7">
            <section>
              <Head n={4} t="Components" href="#components" />
              <div inert className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={btnPrimary}>Explore</span>
                  <span className={btnSecondary}>Read</span>
                  <span className={`${link} ${SANS} text-[14px]`}>Table 1 →</span>
                  <input readOnly tabIndex={-1} placeholder="channel_12" className={`${field} ${MONO} text-[13px]`} style={{ width: "8.5rem" }} />
                  <span className={`${field} inline-flex items-center gap-2 pr-2.5`} style={{ width: "auto" }}>Sort: PR-AUC <IconChevron /></span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
                  <span className={`${SANS} inline-flex items-center gap-2 text-[13.5px]`}><span className="relative grid"><input type="checkbox" readOnly checked tabIndex={-1} className={checkbox} /><IconCheck size={12} className="pointer-events-none absolute inset-0 m-auto text-[var(--paper)]" /></span>GMM</span>
                  <span className={`${SANS} inline-flex items-center gap-2 text-[13.5px]`}><input type="radio" readOnly checked tabIndex={-1} className={radio} />M1</span>
                  <span className={`${SANS} inline-flex items-center gap-2 text-[13.5px]`}><span role="presentation" aria-checked className={switchTrack}><span className={switchKnob} /></span>Bands</span>
                  <span className="inline-flex border-b border-[var(--rule)]"><span aria-selected className={tab}>Result</span><span className={tab}>Method</span></span>
                  <span className="inline-flex gap-1.5"><span className={chip}>All</span><span aria-pressed className={chip}><IconCheck size={11} className={chipCheck} />GMM</span></span>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  <div className="rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] p-3">
                    <p className={`${MONO} text-[10.5px] tracking-[0.08em] text-[var(--muted)] uppercase`}>Parametric · M1</p>
                    <p className={`${SERIF} mt-1 text-[17px] leading-tight`}>GMM · K = 21</p>
                    <p className={`${MONO} mt-1 text-[20px] leading-none`}>0.384</p>
                  </div>
                  <ul className="rounded-[3px] border border-[var(--rule)] bg-[var(--mount)] px-3 py-1">
                    {[["TransformerVAE", "0.438", true], ["HierarchicalVAE", "0.434", false]].map(([n, v, s]) => <li key={String(n)} className={`${SANS} flex items-center justify-between gap-2 border-b border-[var(--rule)] py-1.5 text-[12.5px] last:border-0 ${s ? "shadow-[inset_2px_0_0_var(--ink)] pl-2" : ""}`}><span className="truncate">{n}</span><span className={MONO}>{v}</span></li>)}
                    <li className={`${SANS} flex items-center justify-between py-1.5 text-[12.5px]`}>Events <CountBadge n={200} label="events" /></li>
                  </ul>
                  <div className="relative grid min-w-0 place-items-center rounded-[3px] bg-[rgba(33,31,27,0.38)] p-2.5">
                    <div className="w-full rounded-[3px] border border-[var(--ink)] bg-[var(--mount)] p-2.5 shadow-[var(--lift)]">
                      <p className={`${SANS} text-[12.5px] font-semibold`}>GMM, Mission 1</p>
                      <div className={`${SANS} mt-2 flex justify-end gap-1.5 text-[11.5px] font-medium`}><span className="rounded-[3px] border border-[var(--rule-strong)] px-2 py-1">Close</span><span className="rounded-[3px] bg-[var(--accent)] px-2 py-1 text-white">Compare</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <p className={`${caption} mt-2`}>Buttons, link, input, select, checkbox, radio, switch, tabs, chips, card, list rows, badge, modal</p>
            </section>
            <section>
              <Head n={5} t="Control states" href="#states" />
              <ul inert className="grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-6">
                {(["rest", "hover", "focus", "pressed", "selected", "disabled"] as const).map((s) => (
                  <li key={s} className="flex flex-col items-center gap-1.5">
                    {s === "selected" ? <span data-s="selected" className={chip}><IconCheck size={11} className={chipCheck} />GMM</span> : <button type="button" tabIndex={-1} data-s={s} disabled={s === "disabled"} className={`${btnPrimary} min-h-9 px-3`}>Explore</button>}
                    <span className={`${SANS} text-[11px] text-[var(--muted)] capitalize`}>{s}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <Head n={6} t="UI states" href="#ui-states" />
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Empty", <span key="e" className={`${SERIF} text-[14px]`}>No runs scored yet</span>, "border-dashed border-[var(--rule-strong)]"],
                  ["Loading", <span key="l" className="w-full space-y-1.5" aria-hidden><span className="rpd-skel block h-2.5 w-4/5" /><span className="rpd-skel block h-2.5 w-3/5" /></span>, "border-[var(--rule)] bg-[var(--mount)]"],
                  ["Error", <span key="x" className={`${SANS} inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--oxblood)]`}><IconWarn size={11} />Couldn’t load</span>, "border-[var(--oxblood)] bg-[#F7EDE8]"],
                  ["Success", <span key="s" className={`${SANS} inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--sage)]`}><IconCheck size={11} />Loaded 4 rows</span>, "border-[var(--rule)] bg-[var(--mount)]"],
                ].map(([n, el, cls]) => (
                  <li key={String(n)}>
                    <div className={`grid h-16 place-items-center rounded-[3px] border px-2.5 text-center ${cls}`}>{el}</div>
                    <p className={`${SANS} mt-1 text-center text-[11px] text-[var(--muted)]`}>{n as string}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

