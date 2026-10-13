"use client";

// Section L · Principles. The Week 2 lecture slides (visual hierarchy → full design system), each
// rebuilt in this system on our telemetry content. Mockups are pictures of a screen, so their
// "buttons" are spans; the real controls are the toggles that drive each demonstration.
import { useState, type ReactNode } from "react";
import { BTN, BTN_FORCED, CHIP_FORCED, DOT, FR, LABEL, MONO, Panel, Segmented, Switch, TAB_FORCED, TRANS, useToast } from "./ui";

/* ---------- shared: contrast, measured ---------- */
function lum(hex: string) {
  const c = hex.replace("#", "").match(/.{2}/g)!.map((x) => parseInt(x, 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

/* ---------- shared: one principle = one panel with the slide's title + subtitle ---------- */
function Principle({
  id,
  code,
  kicker,
  title,
  sub,
  spec,
  className = "",
  children,
}: {
  id: string;
  code: string;
  kicker: string;
  title: string;
  sub: string;
  spec: { use: string; tokens: string };
  className?: string;
  children: ReactNode;
}) {
  return (
    <Panel id={id} code={code} title={kicker} spec={spec} className={className}>
      <div className="flex flex-col gap-1.5">
        <p className="text-[clamp(26px,2.4vw,34px)] font-semibold leading-[0.95] tracking-[-0.035em] text-(--is-frost)">{title}</p>
        <p className="max-w-[56ch] text-[15px] leading-[1.4] text-(--is-steel)">{sub}</p>
      </div>
      {children}
    </Panel>
  );
}

function Verdict({ ok, title, note }: { ok: boolean; title: string; note: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <p className="text-[20px] font-semibold leading-tight tracking-[-0.02em] text-(--is-frost)">
        <span aria-hidden className={`${MONO} mr-2 text-[13px] ${ok ? "text-(--is-frost)" : "text-(--is-steel)"}`}>
          {ok ? "✓" : "✕"}
        </span>
        {title}
      </p>
      <p className="text-[13px] leading-snug text-(--is-steel)">{note}</p>
    </div>
  );
}

/* ---------- shared: the telemetry "Today" phone ---------- */
type Look = "system" | "loud" | "quiet" | "accentAll";
type Role = "background" | "surface" | "text" | "muted" | "accent";
const HL = "outline-1 outline-dashed outline-offset-2 outline-(--is-teal)";

function Phone({ children, label, className = "", screen = "bg-(--is-void)" }: { children: ReactNode; label: string; className?: string; screen?: string }) {
  return (
    <div role="img" aria-label={label} className={`mx-auto w-full max-w-[252px] rounded-[20px] border border-[#4a4f55] bg-[#060708] p-[7px] ${className}`}>
      <div className={`relative flex min-h-[468px] flex-col gap-2.5 overflow-hidden rounded-[14px] px-3 pb-3 pt-7 ${screen}`}>
        <span aria-hidden className="absolute left-1/2 top-2.5 h-[5px] w-14 -translate-x-1/2 rounded-full bg-(--is-line)" />
        {children}
      </div>
    </div>
  );
}

function Today({ look = "system", hl, focus, label }: { look?: Look; hl?: Role | null; focus?: "recruiter" | "peer" | null; label: string }) {
  const L = look === "loud";
  const Q = look === "quiet";
  const A = look === "accentAll";
  const h = (r: Role) => (hl === r ? HL : "");
  const f = (k: "recruiter" | "peer") => (focus === k ? HL : "");
  const ink = A ? "text-(--is-fiber)" : "text-(--is-frost)";
  const muted = A ? "text-(--is-fiber)" : L ? "text-(--is-frost)" : "text-(--is-steel)";
  const tile = A ? "border-(--is-fiber)" : L ? "border-(--is-frost)" : "border-(--is-line)";
  return (
    <Phone label={label} screen={`bg-(--is-void) ${h("background")}`}>
      <p className={`${MONO} flex justify-between text-[10px] uppercase tracking-[0.16em] ${muted} ${h("muted")}`}>
        <span>[ M2 · Today ]</span>
        <span>ESA-ADB</span>
      </p>
      <div className={`is-corners flex flex-col gap-1 rounded-[2px] border bg-(--is-panel) p-3 ${A ? "border-(--is-fiber)" : L ? "border-(--is-frost)" : "border-(--is-line)"} ${h("surface")}`}>
        <p className={`${L ? "text-[20px]" : Q ? "text-[15px] font-medium" : "text-[17px]"} font-semibold leading-tight tracking-[-0.02em] ${ink} ${h("text")}`}>TransformerVAE</p>
        <p className={`flex flex-wrap items-baseline gap-x-2 ${f("recruiter")}`}>
          <span className={`${DOT} font-semibold leading-[0.85] ${L ? "text-[52px]" : Q ? "text-[34px] text-(--is-steel)" : `text-[44px] ${ink}`} ${L ? ink : ""} ${h("text")}`}>0.438</span>
          <span className={`${MONO} text-[10px] uppercase tracking-[0.12em] ${L ? "text-[13px] text-(--is-frost)" : muted} ${h("muted")}`}>PR-AUC</span>
        </p>
        <p className={`${L ? "text-[14px] font-semibold" : "text-[12.5px]"} leading-snug ${Q ? "text-(--is-steel)" : ink}`}>Highest PR-AUC on Mission 2.</p>
        <p className={`${MONO} text-[10px] uppercase tracking-[0.1em] ${muted} ${f("recruiter")}`}>Source · Table 1</p>
      </div>
      <div className={`grid grid-cols-3 gap-1.5 ${f("peer")}`}>
        {[
          ["ROC", "0.749"],
          ["Lat. K", "18"],
          ["Events", "644"],
        ].map(([k, v]) => (
          <div key={k} className={`rounded-[2px] border bg-(--is-panel) px-2 py-1.5 ${tile} ${h("surface")}`}>
            <p className={`${MONO} text-[10px] uppercase tracking-[0.08em] ${muted} ${h("muted")}`}>{k}</p>
            <p className={`${MONO} ${L ? "text-[17px] font-semibold" : Q ? "text-[12px] text-(--is-steel)" : `text-[15px] ${ink}`} ${L ? ink : ""}`}>{v}</p>
          </div>
        ))}
      </div>
      <ul className={`flex flex-col divide-y rounded-[2px] border bg-(--is-panel) px-2.5 ${A ? "divide-(--is-fiber)/40 border-(--is-fiber)" : "divide-(--is-line) border-(--is-line)"} ${h("surface")}`}>
        {[
          ["Fault bands", true],
          ["τ99 threshold", true],
          ["Rare events", false],
        ].map(([t, on]) => (
          <li key={t as string} className={`flex min-h-8 items-center gap-2 ${L ? "text-[14px] font-semibold" : "text-[12.5px]"} ${Q ? "text-(--is-steel)" : ink}`}>
            <span
              aria-hidden
              className={`inline-flex size-3.5 items-center justify-center rounded-[2px] border text-[10px] leading-none ${
                on ? (A ? "border-(--is-fiber) bg-(--is-fiber) text-(--is-void)" : Q ? "border-(--is-steel) bg-(--is-steel) text-(--is-void)" : "border-(--is-frost) bg-(--is-frost) text-(--is-void)") : A ? "border-(--is-fiber)" : "border-(--is-steel)"
              }`}
            >
              {on ? "✓" : ""}
            </span>
            {t}
          </li>
        ))}
      </ul>
      <div className="relative mt-auto">
        {L ? (
          <svg aria-hidden viewBox="0 0 60 50" className="absolute -top-12 right-1 h-12 w-14 text-(--is-fiber)">
            <path d="M52 2 C56 22 44 34 20 42" fill="none" stroke="currentColor" strokeWidth="2.4" />
            <path d="M28 34 L18 43 L31 46" fill="none" stroke="currentColor" strokeWidth="2.4" />
          </svg>
        ) : null}
        <span className={`${BTN.primary} w-full ${L ? "min-h-14 whitespace-nowrap px-2 text-[12px] tracking-[0.08em]" : ""} ${h("accent")}`}>
          Pin to comparison <span aria-hidden>→</span>
        </span>
      </div>
    </Phone>
  );
}

/* ===================== L1 · What you see ===================== */
const VALUES = ["0.322", "0.384", "0.438", "0.414"];
export function LSee() {
  const levers: { k: string; rule: string; demo: ReactNode }[] = [
    {
      k: "Size",
      rule: "bigger things get noticed first.",
      demo: (
        <p className="flex items-baseline gap-x-3">
          {VALUES.slice(0, 3).map((v) => (
            <span key={v} className={v === "0.438" ? `${DOT} text-[56px] font-semibold leading-[0.85] text-(--is-frost)` : `${MONO} text-[13px] text-(--is-frost)`}>
              {v}
            </span>
          ))}
        </p>
      ),
    },
    {
      k: "Weight",
      rule: "bolder text stands out.",
      demo: (
        <ul className="flex flex-col gap-1 text-[16px] leading-tight text-(--is-frost)">
          {[
            ["K-Means", "0.322"],
            ["GMM", "0.384"],
            ["TransformerVAE", "0.438"],
            ["HierarchicalVAE", "0.434"],
          ].map(([m, v]) => (
            <li key={m} className={`flex justify-between gap-3 ${v === "0.438" ? "font-semibold" : "font-light"}`}>
              <span>{m}</span>
              <span>{v}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      k: "Contrast",
      rule: "the most contrast with the background draws the eye.",
      demo: (
        <p className="flex flex-wrap items-center gap-2">
          {VALUES.map((v) => (
            <span key={v} className={`${MONO} rounded-[2px] px-2 py-1 text-[15px] ${v === "0.438" ? "bg-(--is-frost) text-(--is-void)" : "bg-(--is-panel) text-(--is-steel)"}`}>
              {v}
            </span>
          ))}
        </p>
      ),
    },
    {
      k: "Position",
      rule: "things near the top are seen first.",
      demo: (
        <ol className={`${MONO} flex flex-col gap-1 text-[13px] text-(--is-frost)`}>
          {["0.438 · TVAE M2", "0.414 · CapVAE M2", "0.390 · GMM M2", "0.384 · GMM M1"].map((v, i) => (
            <li key={v} className="flex gap-3">
              <span className="w-6 text-(--is-steel)">{String(i + 1).padStart(2, "0")}</span>
              {v}
            </li>
          ))}
        </ol>
      ),
    },
  ];
  return (
    <Principle
      id="l-see"
      code="L.01"
      kicker="Visual hierarchy"
      title="What you see"
      sub="Four levers decide what is read first. Each tile pulls one lever and holds the other three still; every tile points at the same number."
      className="lg:col-span-12"
      spec={{ use: "Pull one lever at a time: when size, weight, contrast and position all shout, none of them works.", tokens: "Doto 600 56 vs Mono 13 · Host Grotesk 600 vs 300 · Frost fill vs Steel on Panel · same style, first row" }}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {levers.map((l) => (
          <div key={l.k} className="flex min-w-0 flex-col rounded-[2px] border border-(--is-line) bg-(--is-void)">
            <p className={`${LABEL} flex justify-between gap-3 border-b border-(--is-line) px-3 py-2 text-(--is-steel)`}>
              <span className="text-(--is-frost)">{l.k}</span>
              <span>eye → 0.438</span>
            </p>
            <div className="flex min-h-[148px] flex-1 items-end px-3 pb-3 pt-5">{l.demo}</div>
            <p className="border-t border-(--is-line) px-3 py-2.5 text-[14px] leading-snug text-(--is-steel)">
              <span className="font-semibold text-(--is-frost)">{l.k}:</span> {l.rule}
            </p>
          </div>
        ))}
      </div>
    </Principle>
  );
}

/* ===================== L2 · Emphasize by de-emphasizing ===================== */
export function LEmphasis() {
  return (
    <Principle
      id="l-emph"
      code="L.02"
      kicker="Visual hierarchy"
      title="Emphasize by de-emphasizing"
      sub="To make one thing stand out, make the rest quieter. The button is identical in both; only its surroundings change."
      className="lg:col-span-7"
      spec={{ use: "Louder shouts on every line and needs an arrow to point at the action. Quieter mutes the stats to Steel, so the one green action leads.", tokens: "Loud: Frost borders, Doto 52, 600 everywhere · Quiet: Steel 12–34, Hairline tiles · primary unchanged" }}
    >
      <div className="grid flex-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Today look="loud" label="Louder: every element on the Mission 2 screen is large and bright, and an arrow points at the Pin to comparison button." />
          <Verdict ok={false} title="Louder" note="Everything shouts, so the arrow has to." />
        </div>
        <div className="flex flex-col gap-4">
          <Today look="quiet" label="Quieter: the stats are muted to gray and only the green Pin to comparison button stands out." />
          <Verdict ok title="Quieter" note="Stats step back; the action leads." />
        </div>
      </div>
    </Principle>
  );
}

/* ===================== L3 · Type roles ===================== */
const TYPE_ROWS: { role: string; font: string; el: ReactNode }[] = [
  { role: "Label", font: "Fragment Mono 400 · 11 caps", el: <p className={`${MONO} text-[11px] uppercase tracking-[0.14em] text-(--is-steel)`}>[ Mission 2 · Neg. ELBO ]</p> },
  { role: "Heading", font: "Host Grotesk 600 · 24", el: <p className="text-[clamp(19px,2vw,24px)] font-semibold leading-[1.05] tracking-[-0.02em] text-(--is-frost)">TransformerVAE</p> },
  {
    role: "Display",
    font: "Doto 600 · 72 numeral",
    el: (
      <p className="flex items-baseline gap-2">
        <span className={`${DOT} text-[clamp(50px,5.4vw,76px)] font-semibold leading-[0.85] text-(--is-frost)`}>0.438</span>
        <span className={`${MONO} whitespace-nowrap text-[11px] uppercase tracking-[0.12em] text-(--is-steel)`}>PR-AUC</span>
      </p>
    ),
  },
  { role: "Body", font: "Host Grotesk 400 · 16", el: <p className="text-[clamp(14px,1.2vw,16px)] leading-[1.4] text-(--is-frost)">Highest PR-AUC on Mission 2, where most labels are rare events.</p> },
  { role: "Caption", font: "Host Grotesk 400 · 13 Steel", el: <p className="text-[13px] leading-snug text-(--is-steel)">Table 1 · lat. K = 18 · ROC-AUC 0.749</p> },
];
export function LType() {
  return (
    <Principle
      id="l-type"
      code="L.03"
      kicker="Type"
      title="Type roles"
      sub="Working with multiple styles. Five roles on one card, each named with its family and weight."
      className="lg:col-span-5"
      spec={{ use: "Each role does one job and keeps it everywhere: mono labels the instrument, the grotesk speaks, Doto lights the one number.", tokens: "Leader lines = 1px Steel + 4px Frost registration square · roles in Host Grotesk 600 16" }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_16px_6.5rem] content-center sm:grid-cols-[minmax(0,1fr)_32px_10.5rem]">
        <div className="is-corners col-start-1 row-span-5 row-start-1 grid grid-rows-subgrid gap-y-3 rounded-[2px] border border-(--is-frost)/60 bg-(--is-void) p-4 sm:p-5">
          {TYPE_ROWS.map((r) => (
            <div key={r.role} className="flex min-w-0 items-center">
              {r.el}
            </div>
          ))}
        </div>
        {TYPE_ROWS.map((r, i) => (
          <span key={r.role} aria-hidden className="col-start-2 flex items-center" style={{ gridRowStart: i + 1 }}>
            <span className="h-px flex-1 bg-(--is-steel)" />
            <span className="size-1 bg-(--is-frost)" />
          </span>
        ))}
        {TYPE_ROWS.map((r, i) => (
          <div key={r.role} className="col-start-3 flex flex-col justify-center pl-2" style={{ gridRowStart: i + 1 }}>
            <p className="text-[16px] font-semibold leading-tight tracking-[-0.01em] text-(--is-frost)">{r.role}</p>
            <p className={`${MONO} text-[10px] leading-snug tracking-[0.02em] text-(--is-steel)`}>{r.font}</p>
          </div>
        ))}
      </div>
      <ul className="mt-auto grid grid-cols-3 gap-px overflow-hidden rounded-[2px] border border-(--is-line) bg-(--is-line)" aria-label="The three type families">
        {[
          ["Host Grotesk", "300–600 · speaks", "font-semibold tracking-[-0.04em]", ""],
          ["Fragment Mono", "400 · labels", "", MONO],
          ["Doto", "600 · ≤ 3 numbers", "font-semibold", DOT],
        ].map(([n, w, c, fam]) => (
          <li key={n} className="flex flex-col gap-1 bg-(--is-void) p-3">
            <span aria-hidden className={`${fam} ${c} text-[34px] leading-none text-(--is-frost)`}>Aa</span>
            <span className="text-[13px] font-semibold text-(--is-frost)">{n}</span>
            <span className={`${MONO} text-[10px] text-(--is-steel)`}>{w}</span>
          </li>
        ))}
      </ul>
    </Principle>
  );
}

/* ===================== L4 · Color roles ===================== */
const SW: { r: Role; name: string; hex: string; use: string; vs: [string, string] }[] = [
  { r: "background", name: "Background", hex: "#0A0B0D", use: "Behind content · Void", vs: ["#CFD9E0", "#0A0B0D"] },
  { r: "surface", name: "Surface", hex: "#121316", use: "Cards and panels · Panel", vs: ["#CFD9E0", "#121316"] },
  { r: "text", name: "Text", hex: "#CFD9E0", use: "Headings and body · Frost", vs: ["#CFD9E0", "#0A0B0D"] },
  { r: "muted", name: "Muted", hex: "#8C979F", use: "Labels and small print · Steel", vs: ["#8C979F", "#121316"] },
  { r: "accent", name: "Accent", hex: "#37FD08", use: "Primary action · Fiber Green", vs: ["#0A0B0D", "#37FD08"] },
];
export function LColor() {
  const [hl, setHl] = useState<Role | null>(null);
  return (
    <Principle
      id="l-color"
      code="L.04"
      kicker="Color"
      title="Color roles"
      sub="Each color is used deliberately. Pick a role to outline every place it is applied on the screen."
      className="lg:col-span-6"
      spec={{ use: "Five roles, one job each. Selecting a swatch outlines its uses in Teal, the system's highlight color, so the mapping is checkable.", tokens: "Swatch 44px, 1px Hairline · ratio = the role's text pair · selected = 2px Frost left bar" }}
    >
      <div className="grid flex-1 items-center gap-5 sm:grid-cols-[minmax(0,1fr)_252px]">
        <ul className="flex flex-col border-t border-(--is-line)" aria-label="Color roles">
          {SW.map((s) => (
            <li key={s.r}>
              <button
                type="button"
                aria-pressed={hl === s.r}
                onClick={() => setHl(hl === s.r ? null : s.r)}
                className={`group flex min-h-[60px] w-full items-center gap-3 rounded-[2px] border-b border-(--is-line) px-2 text-left ${TRANS} hover:bg-(--is-void) active:bg-(--is-charcoal) aria-pressed:bg-(--is-void) aria-pressed:shadow-[inset_2px_0_0_var(--is-frost)] ${FR} focus-visible:outline-offset-0`}
              >
                <span aria-hidden className="size-11 shrink-0 rounded-[2px] border border-(--is-line)" style={{ background: s.hex }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-semibold leading-tight tracking-[-0.01em] text-(--is-frost)">{s.name}</span>
                  <span className="block text-[13px] leading-snug text-(--is-steel)">
                    {s.use} · <span className={MONO}>{s.hex}</span>
                  </span>
                </span>
                <span className={`${MONO} shrink-0 text-[11px] text-(--is-steel) group-aria-pressed:text-(--is-frost)`}>{ratio(...s.vs).toFixed(1)}:1</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2">
          <Today hl={hl} label={`Mission 2 Today screen built from the five color roles${hl ? `; the ${hl} role is outlined` : ""}.`} />
          <p className={`${MONO} text-center text-[11px] uppercase tracking-[0.12em] text-(--is-steel)`} aria-live="polite">
            {hl ? `◆ outlined: ${hl}` : "Pick a role to outline it"}
          </p>
        </div>
      </div>
    </Principle>
  );
}

/* ===================== L5 · Accent color ===================== */
export function LAccent() {
  return (
    <Principle
      id="l-accent"
      code="L.05"
      kicker="Color"
      title="Accent color"
      sub="Use it sparingly, for the main action. The same screen twice: green on everything, then green on one button."
      className="lg:col-span-6"
      spec={{ use: "Green marks the one thing to do. Spread across labels, numbers and checks it stops meaning anything, and green body text breaks the system's own rule.", tokens: "Fiber Green #37FD08 · one per view · Void text on it 14.3:1" }}
    >
      <div className="grid flex-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Today look="accentAll" label="Accent everywhere: labels, the heading, the number, tiles, checks and the button are all green." />
          <Verdict ok={false} title="Accent everywhere" note="Nothing stands out." />
        </div>
        <div className="flex flex-col gap-4">
          <Today label="One accent: the screen is Frost and Steel on Void, and only the Pin to comparison button is green." />
          <Verdict ok title="One accent" note="Green only on Pin to comparison." />
        </div>
      </div>
    </Principle>
  );
}

/* ===================== L6 · Alignment ===================== */
function Strands() {
  return (
    <svg aria-hidden viewBox="0 0 200 60" preserveAspectRatio="none" className="h-full w-full">
      {Array.from({ length: 46 }).map((_, i) => {
        const x = i * 4.4 + 2;
        const s = (Math.sin(i * 0.9) + 1) / 2;
        return <line key={i} x1={x} x2={x + 2 + s * 4} y1="0" y2="60" stroke={i === 31 ? "#E04FD6" : "#37FD08"} strokeOpacity={i === 31 ? 0.9 : 0.12 + s * s * 0.6} strokeWidth="1" vectorEffect="non-scaling-stroke" />;
      })}
    </svg>
  );
}
function AlignCard({ aligned, guides }: { aligned: boolean; guides: boolean }) {
  // five different left edges (misaligned) vs one shared edge
  const off = aligned ? [0, 0, 0, 0, 0] : [0, 26, 6, 38, 14];
  const rows: ReactNode[] = [
    <div key="a" className="h-20 overflow-hidden rounded-[2px] bg-(--is-charcoal)" style={{ marginRight: aligned ? 0 : 10 }}>
      <Strands />
    </div>,
    <p key="o" className={`${MONO} text-[10px] uppercase tracking-[0.2em] text-(--is-steel)`}>[ Finding 01 ]</p>,
    <p key="h" className="text-[21px] font-semibold leading-[1.02] tracking-[-0.03em] text-(--is-frost)">Structure lives at the group level</p>,
    <p key="b" className="text-[14px] leading-[1.4] text-(--is-steel)">GMM picks K = 21 modes on Mission 1, close to its 18 operational groups.</p>,
    <p key="l" className={`${MONO} text-[11px] uppercase tracking-[0.12em] text-(--is-frost) underline decoration-(--is-steel) underline-offset-4`}>Read the finding →</p>,
  ];
  return (
    <div className="is-corners relative flex flex-col gap-3 rounded-[2px] border border-(--is-line) bg-(--is-void) p-4">
      {guides && aligned ? <span aria-hidden className="absolute bottom-3 left-4 top-3 border-l border-dashed border-(--is-teal)" /> : null}
      {rows.map((r, i) => (
        <div key={i} className="relative" style={{ paddingLeft: off[i] }}>
          {guides && !aligned ? <span aria-hidden className="absolute -bottom-1 -top-1 border-l border-dashed border-(--is-teal)" style={{ left: off[i] }} /> : null}
          {r}
        </div>
      ))}
    </div>
  );
}
export function LAlign() {
  const [guides, setGuides] = useState(true);
  return (
    <Principle
      id="l-align"
      code="L.06"
      kicker="Layout"
      title="Alignment"
      sub="Line up elements to make designs cohesive. Same card, same content: five left edges, then one."
      className="lg:col-span-5"
      spec={{ use: "Every element in a panel starts on one edge; offsets are reserved for meaning (a stepped opener), never drift.", tokens: "Guides = 1px dashed Teal · panel padding 16 · one shared x" }}
    >
      <Switch checked={guides} onChange={setGuides} label="Alignment guides" />
      <div className="grid flex-1 gap-5 sm:grid-cols-2" role="img" aria-label="Two finding cards. The first has five different left edges; the second lines everything up on one edge.">
        <div className="flex flex-col gap-3">
          <AlignCard aligned={false} guides={guides} />
          <Verdict ok={false} title="Five edges" note="The eye re-finds the start of every line." />
        </div>
        <div className="flex flex-col gap-3">
          <AlignCard aligned guides={guides} />
          <Verdict ok title="One edge" note="One line down the card holds it together." />
        </div>
      </div>
    </Principle>
  );
}

/* ===================== L7 · What's clickable? ===================== */
function Aff({ kind, show, children, className = "" }: { kind: "link" | "button" | "false"; show: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={`relative inline-flex ${className}`}>
      {children}
      {show ? (
        <>
          <span aria-hidden className={`pointer-events-none absolute -inset-1 rounded-[3px] border border-dashed ${kind === "false" ? "border-(--is-steel)" : "border-(--is-teal)"}`} />
          <span aria-hidden className={`${MONO} pointer-events-none absolute -top-[15px] left-0 whitespace-nowrap bg-(--is-void) px-1 text-[10px] uppercase leading-[12px] tracking-[0.08em] ${kind === "false" ? "text-(--is-steel)" : "text-(--is-teal)"}`}>
            {kind === "false" ? "✕ not clickable" : kind === "link" ? "↗ link" : "▶ button"}
          </span>
        </>
      ) : null}
    </span>
  );
}
export function LClickable() {
  const [ver, setVer] = useState<"ambiguous" | "clear">("ambiguous");
  const [show, setShow] = useState(false);
  const toast = useToast();
  const C = ver === "clear";
  const go = (t: string) => (e: React.MouseEvent) => (e.preventDefault(), toast(`${t} (simulated).`, "info"));
  const plain = `rounded-[2px] ${FR}`;
  return (
    <Principle
      id="l-click"
      code="L.07"
      kicker="Affordance"
      title="What's clickable?"
      sub="Where are the affordances? Switch on the overlay to outline everything that responds to a click, then compare the two versions."
      className="lg:col-span-7"
      spec={{ use: "A control must look like one: bracketed or underlined, with an arrow or a fill. Nothing that is not clickable may borrow those cues.", tokens: "Overlay: dashed Teal = clickable, dashed Steel = false affordance · mono 10 tags" }}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Segmented
          label="Version"
          value={ver}
          onChange={setVer}
          options={[
            { v: "ambiguous", t: "Ambiguous" },
            { v: "clear", t: "Clear" },
          ]}
        />
        <Switch checked={show} onChange={setShow} label="Show affordances" />
      </div>
      <div className="overflow-hidden rounded-[3px] border border-(--is-line) bg-(--is-void)">
        <p className={`${MONO} flex h-8 items-center gap-2 border-b border-(--is-line) px-3 text-[10px] uppercase tracking-[0.12em] text-(--is-steel)`}>
          <span aria-hidden className="flex gap-1">
            <span className="size-1.5 border border-(--is-steel)" />
            <span className="size-1.5 border border-(--is-steel)" />
            <span className="size-1.5 border border-(--is-steel)" />
          </span>
          esa-latent / explorer · {C ? "clear" : "ambiguous"}
        </p>
        <div className="flex flex-col gap-5 p-4 pt-5 sm:p-5 sm:pt-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-4">
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-(--is-frost)">ESA · Latent</span>
            <span className="flex flex-wrap items-center gap-x-4 gap-y-4">
              {["Methods", "Missions"].map((t) => (
                <Aff key={t} kind="link" show={show}>
                  <a href="#l-click" onClick={go(`Opening ${t}`)} className={`${C ? `${MONO} text-[11px] uppercase tracking-[0.12em] text-(--is-frost) underline decoration-(--is-steel) underline-offset-4 hover:decoration-(--is-frost)` : "text-[13px] text-(--is-steel)"} ${plain} ${TRANS}`}>
                    {t}
                  </a>
                </Aff>
              ))}
              <Aff kind="button" show={show}>
                <button type="button" onClick={go("Exploring the latent map")} className={C ? `${BTN.primary} min-h-9 px-3` : `text-[13px] text-(--is-frost) ${plain}`}>
                  {C ? "Explore →" : "Explore"}
                </button>
              </Aff>
            </span>
          </div>
          <div className="flex flex-col gap-3 border-y border-(--is-line) py-4">
            <p className={`${MONO} text-[10px] uppercase tracking-[0.16em] text-(--is-steel)`}>Mission 2 · finding</p>
            <p className="max-w-[20ch] text-[clamp(22px,2.2vw,30px)] font-semibold leading-[0.95] tracking-[-0.035em] text-(--is-frost)">Structure lives at the group level.</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-4">
              {C ? (
                <span className={`${MONO} text-[13px] text-(--is-frost)`}>PR-AUC 0.438</span>
              ) : (
                <Aff kind="false" show={show}>
                  <span className={`${MONO} inline-flex min-h-9 items-center rounded-[3px] border border-(--is-frost) px-3 text-[11px] uppercase tracking-[0.12em] text-(--is-frost)`}>[ PR-AUC 0.438 ]</span>
                </Aff>
              )}
              <Aff kind="button" show={show}>
                <button type="button" onClick={go("Opening the paper")} className={C ? `group ${BTN.secondary} min-h-9` : `text-[13px] text-(--is-steel) ${plain}`}>
                  {C ? "[ Read the paper ]" : "Read the paper"}
                </button>
              </Aff>
            </div>
          </div>
          <div className="grid gap-x-2 gap-y-5 sm:grid-cols-3">
            {[
              ["01", "Missions", "Two ESA missions"],
              ["02", "Methods", "13 Table 1 rows"],
              ["03", "Anomalies", "844 labelled events"],
            ].map(([n, t, d]) => (
              <Aff key={t} kind="link" show={show} className="w-full">
                <a
                  href="#l-click"
                  onClick={go(`Opening ${t}`)}
                  className={`flex w-full flex-col gap-1 rounded-[2px] p-3 ${C ? `border border-(--is-line) ${TRANS} hover:border-(--is-frost) active:bg-(--is-charcoal)` : "bg-(--is-panel)"} ${FR}`}
                >
                  <span className={`${MONO} flex justify-between text-[10px] uppercase tracking-[0.12em] text-(--is-steel)`}>
                    {n}
                    {C ? <span className="text-(--is-frost)">→</span> : null}
                  </span>
                  <span className="text-[15px] font-semibold text-(--is-frost)">{t}</span>
                  <span className="text-[13px] text-(--is-steel)">{d}</span>
                </a>
              </Aff>
            ))}
          </div>
        </div>
      </div>
      <p className={`${MONO} mt-auto text-[11px] uppercase tracking-[0.1em] text-(--is-steel)`} aria-live="polite">
        {C ? "7 clickable · all 7 look it · 0 false affordances" : "7 clickable · 0 look it · 1 false affordance (the boxed number)"}
      </p>
    </Principle>
  );
}

/* ===================== L8 · Choosing a direction ===================== */
function Arcade() {
  return (
    <Phone
      label="Counter-example: the same Mission 2 screen in a gamified arcade style, with a candy gradient, stickers, a level badge and a Claim reward button."
      screen="bg-[linear-gradient(165deg,#ff4fa3_0%,#ff9f43_55%,#ffe94d_100%)]"
    >
      <div className="flex flex-col gap-2.5 font-[ui-rounded,'Arial_Rounded_MT_Bold',system-ui,sans-serif] text-[#2a0638]">
        <p className="flex items-center justify-between">
          <span className="rounded-full bg-[#2a0638] px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[#ffe94d]">Level 7 ★</span>
          <span aria-hidden className="text-[18px] font-black text-[#2a0638]">✦ ✦</span>
        </p>
        <p className="-rotate-2 text-[24px] font-black leading-[0.95]">TVAE totally crushed it!</p>
        <p className="flex items-baseline gap-1">
          <span className="rotate-[-4deg] text-[54px] font-black leading-none text-[#2a0638] [text-shadow:3px_3px_0_#ffffff]">0.438</span>
          <span className="text-[14px] font-extrabold">pts!!</span>
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            ["Streak", "12"],
            ["XP", "644"],
            ["Combo", "×18"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-[14px] bg-[#fff4dc] px-2 py-1.5 text-center">
              <p className="text-[10px] font-extrabold uppercase">{k}</p>
              <p className="text-[17px] font-black">{v}</p>
            </div>
          ))}
        </div>
        <p className="rounded-[14px] bg-[#fff4dc] px-3 py-2 text-[13px] font-bold">★ Beat 12 other models! Share your score?</p>
      </div>
      <span className="mt-auto inline-flex min-h-12 items-center justify-center rounded-full bg-[#6b2bff] font-[ui-rounded,system-ui,sans-serif] text-[15px] font-black uppercase tracking-wide text-white">Claim reward ✦</span>
    </Phone>
  );
}
const WHY = {
  recruiter: "An ML recruiter skims for one number and its source: here 0.438 and Table 1 are the first two things read; the arcade screen buries both under stickers.",
  peer: "A research peer inspects how it was measured: here ROC, latent K and the event count sit in one mono row; the arcade screen swaps them for a streak and a level.",
};
export function LDirection() {
  const [who, setWho] = useState<"recruiter" | "peer">("recruiter");
  return (
    <Principle
      id="l-direction"
      code="L.08"
      kicker="Mood"
      title="Choosing a direction"
      sub="A style is right only for an audience. Same screen, same numbers: this system against a deliberately wrong one."
      className="lg:col-span-12"
      spec={{ use: "Pick the direction from who reads and how fast. The audience toggle outlines what each reader looks for, and shows where the wrong style drops it.", tokens: "Outline = dashed Teal on what the reader needs · counter-example uses no system tokens on purpose" }}
    >
      <div className="grid flex-1 items-center gap-8 lg:grid-cols-12 lg:gap-3">
        <div className="flex flex-col gap-5 lg:col-span-4">
          <Segmented
            label="Audience"
            value={who}
            onChange={setWho}
            options={[
              { v: "recruiter", t: "Recruiter · skims" },
              { v: "peer", t: "Peer · inspects" },
            ]}
          />
          <p className="max-w-[44ch] text-[18px] leading-[1.4] text-(--is-frost)" aria-live="polite">
            {WHY[who]}
          </p>
          <p className={`${MONO} text-[11px] uppercase tracking-[0.12em] text-(--is-steel)`}>
            <span className="text-(--is-teal)">◆</span> outlined: what this reader needs first
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7 lg:col-start-6">
          <div className="flex flex-col gap-4">
            <Today focus={who} label={`Mission 2 screen in this system, with what the ${who} needs outlined.`} />
            <Verdict ok title="Instrumented" note="Number, source and method in one glance." />
          </div>
          <div className="flex flex-col gap-4">
            <Arcade />
            <Verdict ok={false} title="Arcade" note="Fun for a habit app, wrong for evidence." />
          </div>
        </div>
      </div>
    </Principle>
  );
}

/* ===================== L9 · The full design system ===================== */
function N({ n, t }: { n: number; t: string }) {
  return (
    <p className={`${LABEL} mb-3 flex items-center gap-2.5 text-(--is-frost)`}>
      <span className="inline-flex size-5 items-center justify-center rounded-[2px] border border-(--is-frost) text-[10px] tracking-normal">{n}</span>
      {t}
    </p>
  );
}
const FULL_COLORS: [string, string, string | null][] = [
  ["Background", "#0A0B0D", null],
  ["Surface", "#121316", null],
  ["Text", "#CFD9E0", `${ratio("#CFD9E0", "#0A0B0D").toFixed(1)}:1`],
  ["Muted", "#8C979F", `${ratio("#8C979F", "#0A0B0D").toFixed(1)}:1`],
  ["Border", "#2E3135", null],
  ["Accent", "#37FD08", `${ratio("#0A0B0D", "#37FD08").toFixed(1)}:1`],
];
export function LFull() {
  const states = ["Rest", "Hover", "Focus", "Pressed", "Selected", "Disabled"] as const;
  return (
    <Panel
      id="l-full"
      code="L.09"
      title="The full design system"
      className="lg:col-span-12"
      spec={{ use: "The whole system on one screen, in the handout's 1–6 order: the summary a reader checks the other sections against.", tokens: "Browser frame, 1px Hairline · numbered Frost squares · all specimens use the live class strings" }}
    >
      <div className="flex flex-col gap-1.5">
        <p className="text-[clamp(26px,2.4vw,34px)] font-semibold leading-[0.95] tracking-[-0.035em] text-(--is-frost)">The full design system</p>
        <p className="text-[15px] leading-[1.4] text-(--is-steel)">Charged, Fibrous, Instrumented: every component, in every state.</p>
      </div>
      <div className="overflow-hidden rounded-[3px] border border-(--is-frost)/50 bg-(--is-void)">
        <p className={`${MONO} flex h-9 items-center gap-3 border-b border-(--is-line) px-3.5 text-[11px] tracking-[0.04em] text-(--is-steel)`}>
          <span aria-hidden className="flex gap-1.5">
            <span className="size-2 rounded-full border border-(--is-steel)" />
            <span className="size-2 rounded-full border border-(--is-steel)" />
            <span className="size-2 rounded-full border border-(--is-steel)" />
          </span>
          /design-systems/intense-space
        </p>
        <div className="flex flex-col gap-8 p-4 sm:p-7" inert>
          <p className="text-[clamp(26px,3vw,40px)] font-semibold leading-none tracking-[-0.04em] text-(--is-frost)">
            Intense Space <span className="font-light">·</span> Design System
          </p>
          <div className="grid gap-9 lg:grid-cols-12 lg:gap-x-10">
            {/* left: 1 color, 2 type, 3 space */}
            <div className="flex flex-col gap-9 lg:col-span-5">
              <div>
                <N n={1} t="Color roles" />
                <ul className="grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-6">
                  {FULL_COLORS.map(([n, hex, cr]) => (
                    <li key={n} className="flex flex-col items-center gap-1 text-center">
                      <span className="h-11 w-full rounded-[2px] border border-(--is-line)" style={{ background: hex }} />
                      <span className="text-[12px] text-(--is-steel)">{n}</span>
                      <span className={`${MONO} min-h-4 text-[10px] text-(--is-frost)`}>{cr ?? ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <N n={2} t="Type roles" />
                <ul className="flex flex-col gap-2">
                  {[
                    [<span key="d" className={`${DOT} text-[48px] font-semibold leading-[0.9] text-(--is-frost)`}>0.438</span>, "Display"],
                    [<span key="h" className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-(--is-frost)">Transformer VAE</span>, "Heading"],
                    [<span key="b" className="text-[15px] text-(--is-frost)">Highest PR-AUC on Mission 2.</span>, "Body"],
                    [<span key="l" className={`${MONO} text-[11px] uppercase tracking-[0.14em] text-(--is-frost)`}>[ M2 · Neg. ELBO ]</span>, "Label"],
                  ].map(([el, r]) => (
                    <li key={r as string} className="flex items-end justify-between gap-3 border-b border-(--is-line) pb-2">
                      {el}
                      <span className={`${MONO} text-[10px] uppercase tracking-[0.12em] text-(--is-steel)`}>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <N n={3} t="Spacing and shape" />
                <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
                  <div className="flex items-end gap-2.5">
                    {[4, 8, 12, 16, 24, 32].map((px) => (
                      <span key={px} className="flex flex-col items-center gap-1">
                        <span className="w-4 bg-(--is-frost)" style={{ height: px * 1.4 }} />
                        <span className={`${MONO} text-[10px] text-(--is-steel)`}>{px}</span>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-end gap-3">
                    {[
                      ["2px", "rounded-[2px]"],
                      ["3px", "rounded-[3px]"],
                      ["full", "rounded-full"],
                    ].map(([t, c]) => (
                      <span key={t} className="flex flex-col items-center gap-1">
                        <span className={`size-10 border border-(--is-frost) ${c}`} />
                        <span className={`${MONO} text-[10px] text-(--is-steel)`}>{t}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-[13px] text-(--is-steel)">Spacing scale · corners · no shadow, a hairline instead</p>
              </div>
            </div>
            {/* right: 4 components, 5 control states, 6 UI states */}
            <div className="flex min-w-0 flex-col gap-9 lg:col-span-7">
              <div>
                <N n={4} t="Components" />
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={BTN.primary}>Pin →</span>
                    <span className={BTN.secondary}>[ Paper ]</span>
                    <span className={`${MONO} text-[11px] uppercase tracking-[0.12em] text-(--is-frost) underline decoration-(--is-steel) underline-offset-4`}>Table 1 ↘</span>
                    <span className="flex min-h-10 min-w-[150px] flex-1 items-center rounded-[2px] border border-(--is-line) px-3 text-[14px] text-(--is-steel)">Search channels</span>
                    <span className="flex min-h-10 items-center gap-3 rounded-[2px] border border-(--is-line) px-3 text-[14px] text-(--is-frost)">
                      Sort: PR-AUC <span className="text-(--is-steel)">▾</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 text-[14px] text-(--is-frost)">
                    <span className="flex items-center gap-2">
                      <span className="inline-flex size-4 items-center justify-center rounded-[2px] bg-(--is-frost) text-[10px] text-(--is-void)">✓</span>Faults
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="relative inline-flex size-4 rounded-full border border-(--is-frost)">
                        <span className="absolute inset-[4px] rounded-full bg-(--is-frost)" />
                      </span>
                      M2
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="relative inline-flex h-5 w-9 rounded-full border border-(--is-frost) bg-(--is-frost)">
                        <span className="absolute left-[19px] top-[3px] size-3 rounded-full bg-(--is-void)" />
                      </span>
                      Grid
                    </span>
                    <span className="flex gap-4 border-b border-(--is-line)">
                      <span className={TAB_FORCED.Selected}>PR</span>
                      <span className={TAB_FORCED.Rest}>ROC</span>
                    </span>
                    <span className={CHIP_FORCED.Selected}>● Generative</span>
                    <span className={CHIP_FORCED.Rest}>○ Baseline</span>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    <span className="is-corners flex flex-col rounded-[2px] border border-(--is-line) bg-(--is-panel) p-3">
                      <span className={`${MONO} text-[10px] uppercase tracking-[0.12em] text-(--is-steel)`}>[ M2 · TVAE ]</span>
                      <span className={`${DOT} text-[30px] font-semibold leading-none text-(--is-frost)`}>0.438</span>
                      <span className={`${MONO} mt-1 text-[10px] uppercase tracking-[0.12em] text-(--is-teal)`}>◆ Top PR-AUC · M2</span>
                    </span>
                    <span className="flex flex-col justify-center rounded-[2px] border border-(--is-line) bg-(--is-panel)">
                      {[
                        ["TVAE", "0.438"],
                        ["HVAE", "0.434"],
                      ].map(([m, v], i) => (
                        <span key={m} className={`flex min-h-10 items-center justify-between px-3 text-[13px] text-(--is-frost) ${i === 0 ? "border-b border-(--is-line) shadow-[inset_2px_0_0_var(--is-frost)]" : ""}`}>
                          {m} <span className={MONO}>{v}</span>
                        </span>
                      ))}
                    </span>
                    <span className="relative flex items-center justify-center overflow-hidden rounded-[2px] bg-(--is-charcoal) p-3">
                      <span className="w-full rounded-[2px] border border-(--is-line) bg-(--is-panel) p-2.5">
                        <span className="block text-[13px] font-semibold text-(--is-frost)">Pin TVAE?</span>
                        <span className="mt-2 flex justify-end gap-1.5">
                          <span className={`${BTN.secondary} min-h-7 px-2 text-[10px]`}>Cancel</span>
                          <span className={`${BTN.primary} min-h-7 px-2 text-[10px]`}>Pin</span>
                        </span>
                      </span>
                    </span>
                  </div>
                  <p className="text-[13px] text-(--is-steel)">Buttons, link, input, select, checkbox, radio, switch, tabs, chips, card, list rows, badge, modal</p>
                </div>
              </div>
              <div>
                <N n={5} t="Control states" />
                <div className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-6">
                  {states.map((s) => (
                    <span key={s} className="flex flex-col items-center gap-2">
                      <span className={`${s === "Selected" ? BTN_FORCED.secondary.Selected : BTN_FORCED.primary[s]} w-full whitespace-nowrap px-1`}>{s === "Selected" ? "✓ Pinned" : "Pin"}</span>
                      <span className={`${MONO} text-[10px] uppercase tracking-[0.1em] text-(--is-steel)`}>{s}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <N n={6} t="UI states" />
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {[
                    ["Empty", <span key="e" className={`${DOT} text-[26px] font-semibold leading-none text-(--is-steel)`}>00</span>, "No runs yet", "text-(--is-frost)"],
                    ["Loading", <span key="l" className="isd-skel block h-3 w-16" />, "Loading runs…", "text-(--is-frost)"],
                    ["Error", <span key="r" className={`${MONO} text-[16px] text-(--is-fault)`}>■</span>, "Couldn't load", "text-(--is-fault)"],
                    ["Success", <span key="s" className={`${MONO} text-[16px] text-(--is-frost)`}>✓</span>, "13 runs loaded", "text-(--is-frost)"],
                  ].map(([k, icon, t, c]) => (
                    <span key={k as string} className="flex flex-col items-center gap-2">
                      <span className={`flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-[2px] border bg-(--is-panel) px-2 ${k === "Error" ? "border-(--is-fault)/60" : "border-(--is-line)"}`}>
                        {icon}
                        <span className={`text-[13px] ${c}`}>{t}</span>
                      </span>
                      <span className={`${MONO} text-[10px] uppercase tracking-[0.1em] text-(--is-steel)`}>{k}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- section body ---------- */
export function Principles() {
  return (
    <div className="grid gap-3 lg:grid-cols-12">
      <LSee />
      <LEmphasis />
      <LType />
      <LColor />
      <LAccent />
      <LAlign />
      <LClickable />
      <LDirection />
      <LFull />
    </div>
  );
}
