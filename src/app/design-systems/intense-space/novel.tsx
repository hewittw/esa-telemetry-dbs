"use client";

import { useEffect, useRef, useState } from "react";
import { FiberField } from "../../mood-boards/intense-space/fiber-field";
import type { Tree } from "./data";
import { BTN, Br, Button, DOT, FR, LABEL, MONO, Panel, Segmented, Status, TRANS, useToast } from "./ui";

type Strand = { s: number; a: number };
const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- N1 · generative fiber field (iCOMAT) with a pause control (NASA's Eyes) ---------- */
export function NovelFiber({ m1, m2 }: { m1: Strand[]; m2: Strand[] }) {
  const [m, setM] = useState<1 | 2>(1);
  const st = m === 1 ? m1 : m2;
  const faults = st.filter((x) => x.a > 0.6).length;
  return (
    <Panel
      id="n-fiber"
      code="N.01"
      title="Fiber field"
      novel="iCOMAT"
      className="lg:col-span-8"
      spec={{
        use: "Borrowed iCOMAT's steered-fiber hero; transformed so each strand is one slice of the test set (brightness = GMM score vs its local baseline, magenta = a labelled fault). Pause control from NASA's Eyes.",
        tokens: "Canvas on Charcoal · Green rgba(55,253,8,.1–1) · Magenta faults · shear amplitude ∝ score · paused when off-screen or reduced motion",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Mission" value={m} onChange={setM} options={[{ v: 1, t: "Mission 1" }, { v: 2, t: "Mission 2" }]} />
        <p className={`${LABEL} text-(--is-steel)`}>
          300 strands · <span className="text-(--is-fault)">■</span> {faults} fault slices · <span className="text-(--is-fiber)">■</span> GMM score
        </p>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2px] bg-(--is-charcoal) sm:aspect-[16/7]">
        <FiberField key={m} strands={st} />
      </div>
    </Panel>
  );
}

/* ---------- N2 · Doto readout (iCOMAT dot-matrix callout) ---------- */
const READOUTS = [
  { id: "m2", t: "Best PR-AUC · M2", v: 0.438, d: 3, note: "Transformer VAE, Neg. ELBO" },
  { id: "m1", t: "Best PR-AUC · M1", v: 0.384, d: 3, note: "GMM, K = 21, neg. log-lik." },
  { id: "ts", t: "Test timesteps · M1", v: 7364161, d: 0, note: "one reading per ~30 s" },
  { id: "ev", t: "Labelled events · M2", v: 644, d: 0, note: "613 rare events · 31 anomalies" },
];
function useTween(target: number, ms = 700) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (reduced()) {
      setV(target);
      from.current = target;
      return;
    }
    const a = from.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      const x = a + (target - a) * e;
      setV(x);
      from.current = x;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}
export function NovelDoto() {
  const [id, setId] = useState("m2");
  const r = READOUTS.find((x) => x.id === id)!;
  const v = useTween(r.v);
  const s = r.d ? v.toFixed(r.d) : Math.round(v).toLocaleString("en-US");
  const ghost = (r.d ? r.v.toFixed(r.d) : r.v.toLocaleString("en-US")).replace(/\d/g, "8");
  return (
    <Panel
      id="n-doto"
      code="N.02"
      title="Dot-matrix readout"
      novel="iCOMAT"
      className="lg:col-span-4"
      spec={{
        use: "Borrowed iCOMAT's sparing Doto callouts; transformed into an instrument readout with unlit 8-segments behind and a count-up when the value changes.",
        tokens: "Doto 600 · lit Frost, unlit Hairline #2E3135 · 700ms ease-out cubic · for ≤ 3 numbers per view",
      }}
    >
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Readout">
        {READOUTS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="radio"
            aria-checked={x.id === id}
            onClick={() => setId(x.id)}
            className={`${MONO} ${TRANS} min-h-8 rounded-[2px] border border-(--is-line) px-2 text-[10px] uppercase tracking-[0.1em] text-(--is-steel) hover:border-(--is-frost) hover:text-(--is-frost) active:bg-(--is-charcoal) aria-checked:border-(--is-frost) aria-checked:text-(--is-frost) ${FR}`}
          >
            {x.t}
          </button>
        ))}
      </div>
      <div className="relative mt-auto" aria-live="polite" aria-label={`${r.t}: ${r.d ? r.v.toFixed(r.d) : r.v.toLocaleString("en-US")}`}>
        <p aria-hidden className={`${DOT} text-[clamp(60px,7vw,128px)] font-semibold leading-[0.85] text-(--is-line)`}>{ghost}</p>
        <p aria-hidden className={`${DOT} absolute inset-0 text-[clamp(60px,7vw,128px)] font-semibold leading-[0.85] text-(--is-frost)`}>{s}</p>
      </div>
      <p className={`${LABEL} text-(--is-steel)`}>
        [ {r.t} ] {r.note}
      </p>
    </Panel>
  );
}

/* ---------- N3 · word-by-word scroll reveal (iCOMAT) ---------- */
export function NovelWords() {
  const text =
    "Every global detector we tried plateaus at PR-AUC 0.322. The telemetry is not one cloud of normal; it is 18 to 29 operating modes, and an anomaly is only strange relative to its own mode.";
  const words = text.split(" ");
  const ref = useRef<HTMLParagraphElement>(null);
  const [lit, setLit] = useState(words.length);
  const [run, setRun] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    let best = 0;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.9 - r.top) / (vh * 0.4)));
      best = Math.max(best, Math.round(p * words.length));
      setLit(best);
    };
    const on = () => !raf && (raf = requestAnimationFrame(update));
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [words.length, run]);
  // "Replay" dims the sentence and lights it word by word on a timer, so it can be seen without scrolling
  const replay = () => {
    if (reduced()) return;
    setLit(0);
    let i = 0;
    const t = window.setInterval(() => {
      i += 1;
      setLit(i);
      if (i >= words.length) (clearInterval(t), setRun((x) => x + 1));
    }, 70);
  };
  return (
    <Panel
      id="n-words"
      code="N.03"
      title="Word-by-word reveal"
      novel="iCOMAT"
      className="lg:col-span-7"
      spec={{
        use: "Borrowed iCOMAT's statement paragraph that brightens as you scroll; transformed so a word, once lit, stays lit (a fast scroller never sees a dimmed finding), plus a Replay.",
        tokens: "Host Grotesk 500 clamp(22–34px) / 1.08 · unread Frost @ 42% · 300ms per word · off under reduced motion",
      }}
    >
      <p ref={ref} className="text-[clamp(22px,2.3vw,34px)] font-medium leading-[1.1] tracking-[-0.02em]" aria-label={text}>
        <span aria-hidden className="text-(--is-steel)">The finding. </span>
        {words.map((w, i) => (
          <span key={i} aria-hidden className="transition-opacity duration-300 ease-out" style={{ color: "var(--is-frost)", opacity: i < lit ? 1 : 0.42 }}>
            {w}{" "}
          </span>
        ))}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3">
        <span className={`${LABEL} text-(--is-steel)`}>
          {Math.min(lit, words.length)} / {words.length} words lit
        </span>
        <Button variant="ghost" onClick={replay}>
          ↻ Replay
        </Button>
      </div>
    </Panel>
  );
}

/* ---------- N4 · blur-to-focus (Planet) ---------- */
export function NovelFocus() {
  const [m, setM] = useState<1 | 2>(2);
  const [n, setN] = useState(0);
  const word = m === 1 ? "GMM 0.384" : "TVAE 0.438";
  return (
    <Panel
      id="n-focus"
      code="N.04"
      title="Blur-to-focus"
      novel="Planet"
      className="lg:col-span-5"
      spec={{
        use: "Borrowed Planet's half-blurred UNDETECTED; transformed into a one-shot per-letter focus pull that fires whenever a headline value changes, so the change itself is visible.",
        tokens: "blur 14px → 0, opacity .2 → 1 · 900ms per letter, 60ms stagger · Host Grotesk 600 caps",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <Segmented label="Mission" value={m} onChange={(v) => (setM(v), setN((x) => x + 1))} options={[{ v: 1, t: "M1" }, { v: 2, t: "M2" }]} />
        <Button variant="ghost" onClick={() => setN((x) => x + 1)}>
          ↻ Replay
        </Button>
      </div>
      <p className={`${LABEL} text-(--is-steel)`}>[ Best PR-AUC · Mission {m} ]</p>
      <p key={`${m}-${n}`} aria-live="polite" aria-label={word} className="isd-focus text-[clamp(40px,4.6vw,68px)] font-semibold uppercase leading-[0.95] tracking-[-0.035em] text-(--is-frost)">
        {word.split("").map((c, i) => (
          <span key={i} aria-hidden style={{ animationDelay: `${i * 60}ms` }}>
            {c === " " ? " " : c}
          </span>
        ))}
      </p>
    </Panel>
  );
}

/* ---------- N5 · before/after comparison slider (iCOMAT) ---------- */
export function NovelCompare({ tree, ari }: { tree: Tree; ari: { sub: number; group: number } }) {
  const t = tree[1];
  const chans: { sub: number; group: number }[] = [];
  const groups: { sub: number; n: number }[] = [];
  t.subsystems.forEach((s, si) =>
    s.groups.forEach((g) => {
      groups.push({ sub: si, n: g.channels.length });
      g.channels.forEach(() => chans.push({ sub: si, group: groups.length - 1 }));
    }),
  );
  const W = 760;
  const H = 240;
  const cx = (i: number) => 10 + (i / (chans.length - 1)) * (W - 20);
  // node x = mean x of its channels, so bundles never cross
  const node = (pred: (c: { sub: number; group: number }) => boolean) => {
    const xs = chans.map((c, i) => (pred(c) ? cx(i) : null)).filter((x): x is number => x !== null);
    return xs.reduce((a, b) => a + b, 0) / xs.length;
  };
  const subX = t.subsystems.map((_, si) => node((c) => c.sub === si));
  const grpX = groups.map((_, gi) => node((c) => c.group === gi));
  const curve = (x0: number, x1: number) => `M${x0.toFixed(1)} 0 C${x0.toFixed(1)} ${H * 0.55} ${x1.toFixed(1)} ${H * 0.45} ${x1.toFixed(1)} ${H - 12}`;

  const [p, setP] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const fromX = (clientX: number) => {
    const r = box.current!.getBoundingClientRect();
    setP(Math.round(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100))));
  };
  return (
    <Panel
      id="n-compare"
      code="N.05"
      title="Before / after slider"
      novel="iCOMAT"
      className="lg:col-span-12"
      spec={{
        use: "Borrowed iCOMAT's straight-fiber vs steered-fiber comparison; transformed into our central claim: the same 76 Mission 1 channels bundled by the 4 subsystems (before) vs the 18 operational groups (after).",
        tokens: "Drag, click or ←/→ (Shift = 10) · 1px Frost divider + 32px handle · before Steel strands, after Frost strands + Teal nodes",
      }}
    >
      <div className={`${LABEL} -mb-3 flex justify-between gap-3`}>
        <span className="text-(--is-frost)">← Before · 4 subsystems</span>
        <span className="text-right text-(--is-teal)">After · 18 groups →</span>
      </div>
      <div
        ref={box}
        className="relative touch-pan-y select-none overflow-hidden rounded-[2px] border border-(--is-line) bg-(--is-void)"
        onPointerDown={(e) => {
          drag.current = true;
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          fromX(e.clientX);
        }}
        onPointerMove={(e) => drag.current && fromX(e.clientX)}
        onPointerUp={() => (drag.current = false)}
        onPointerCancel={() => (drag.current = false)}
      >
        <div className="is-regdots relative aspect-[16/9] sm:aspect-[760/280]">
          {/* after: groups (full width, underneath) */}
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-x-0 top-[6%] h-[80%] w-full" aria-hidden>
            <g fill="none" stroke="#CFD9E0" strokeOpacity="0.7">
              {chans.map((c, i) => (
                <path key={i} d={curve(cx(i), grpX[c.group])} strokeWidth="1" vectorEffect="non-scaling-stroke" />
              ))}
            </g>
            {grpX.map((x, i) => (
              <rect key={i} x={x - 3} y={H - 15} width="6" height="6" fill="#4BCFE0" />
            ))}
          </svg>
          {/* before: subsystems, clipped to the left of the divider */}
          <div className="absolute inset-0 bg-(--is-void)" style={{ clipPath: `inset(0 ${100 - p}% 0 0)` }}>
            <div className="is-regdots absolute inset-0" />
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-x-0 top-[6%] h-[80%] w-full" aria-hidden>
              <g fill="none" stroke="#8C979F" strokeOpacity="0.75">
                {chans.map((c, i) => (
                  <path key={i} d={curve(cx(i), subX[c.sub])} strokeWidth="1" vectorEffect="non-scaling-stroke" />
                ))}
              </g>
              {subX.map((x, i) => (
                <rect key={i} x={x - 4} y={H - 16} width="8" height="8" fill="#CFD9E0" />
              ))}
            </svg>
          </div>
          {/* divider */}
          <div className="pointer-events-none absolute inset-y-0 w-px bg-(--is-frost)" style={{ left: `${p}%` }} />
          <div
            role="slider"
            tabIndex={0}
            aria-label="Compare subsystems (before) with operational groups (after)"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={p}
            aria-valuetext={`${p}% showing subsystems`}
            onKeyDown={(e) => {
              const s = e.shiftKey ? 10 : 2;
              if (e.key === "ArrowLeft") (e.preventDefault(), setP((x) => Math.max(0, x - s)));
              if (e.key === "ArrowRight") (e.preventDefault(), setP((x) => Math.min(100, x + s)));
              if (e.key === "Home") (e.preventDefault(), setP(0));
              if (e.key === "End") (e.preventDefault(), setP(100));
            }}
            className={`${MONO} ${TRANS} absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-[2px] border border-(--is-frost) bg-(--is-void) text-[12px] text-(--is-frost) hover:bg-(--is-panel) active:bg-(--is-charcoal) ${FR}`}
            style={{ left: `${p}%` }}
          >
            ⟷
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <p className="text-[14px] leading-snug text-(--is-steel)">
          <span className="text-(--is-frost)">Subsystems.</span> 4 bundles. GMM clusters barely agree with them: ARI {ari.sub.toFixed(3)}.
        </p>
        <p className="text-[14px] leading-snug text-(--is-steel) sm:text-right">
          <span className="text-(--is-teal)">Operational groups.</span> 18 bundles, close to BIC&apos;s K* = 21. Agreement doubles: ARI {ari.group.toFixed(3)}.
        </p>
      </div>
    </Panel>
  );
}

/* ---------- N6 · O1–O7 process timeline (iCOMAT) ---------- */
const OPS = [
  ["Ingest", "ESA-ADB, temporal 50/50 train/test. Mission 1: 76 channels, 7.36M test timesteps.", "7.36M"],
  ["Clean", "Drop channels that never move: 8 on Mission 1, 33 on Mission 2.", "−8 ch"],
  ["Project", "Standardise, then PCA to 30 components (99.1% of M1 variance kept).", "30 PC"],
  ["Sweep", "Fit full-covariance GMMs for K = 2–30 on 800K sampled rows; score each by BIC.", "K 2–30"],
  ["Select", "BIC bottoms out at K* = 21 on M1 and 29 on M2, near the group counts (18, 29).", "K* 21"],
  ["Score", "Each test timestep's score is its negative log-likelihood; alarm above τ99 = 36.24.", "τ 36.24"],
  ["Evaluate", "Against labelled faults: PR-AUC 0.384, ROC-AUC 0.692, the best on Mission 1.", "0.384"],
] as const;
export function NovelProcess() {
  const [i, setI] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const go = (n: number) => {
    const k = (n + OPS.length) % OPS.length;
    setI(k);
    refs.current[k]?.focus();
  };
  return (
    <Panel
      id="n-process"
      code="N.06"
      title="O1–O7 process line"
      novel="iCOMAT"
      className="lg:col-span-12"
      spec={{
        use: "Borrowed iCOMAT's O1–O7 operations strip; transformed into our GMM pipeline, each stop carrying its one real number. A tab list: click or ←/→.",
        tokens: "Mono O-codes · 1px Hairline rail, Frost progress to the current stop · 8px square nodes · Doto value",
      }}
    >
      <div role="tablist" aria-label="GMM pipeline operations" className="relative grid grid-cols-7 gap-0">
        <span aria-hidden className="absolute left-[7.14%] right-[7.14%] top-[37px] h-px bg-(--is-line)" />
        <span aria-hidden className="absolute left-[7.14%] top-[37px] h-px bg-(--is-frost) transition-[width] duration-300 ease-(--is-ease)" style={{ width: `${(i / 6) * 85.72}%` }} />
        {OPS.map(([t], k) => (
          <button
            key={t}
            ref={(el) => {
              refs.current[k] = el;
            }}
            role="tab"
            type="button"
            id={`isd-op-${k}`}
            aria-selected={k === i}
            aria-controls="isd-op-panel"
            tabIndex={k === i ? 0 : -1}
            onClick={() => setI(k)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") (e.preventDefault(), go(i + 1));
              if (e.key === "ArrowLeft") (e.preventDefault(), go(i - 1));
            }}
            className={`group relative flex flex-col items-center gap-2 rounded-[2px] pb-1 pt-2 ${FR}`}
          >
            <span className={`${MONO} text-[11px] tracking-[0.08em] ${k === i ? "text-(--is-frost)" : "text-(--is-steel) group-hover:text-(--is-frost)"}`}>O{k + 1}</span>
            <span
              aria-hidden
              className={`size-2.5 ${TRANS} ${k <= i ? "bg-(--is-frost)" : "border border-(--is-steel) bg-(--is-void) group-hover:border-(--is-frost)"} ${k === i ? "scale-125 outline outline-offset-2 outline-(--is-frost)/40" : ""} group-active:scale-90`}
            />
            <span className={`${MONO} hidden text-[10px] uppercase tracking-[0.12em] md:block ${k === i ? "text-(--is-frost)" : "text-(--is-steel)"}`}>{t}</span>
          </button>
        ))}
      </div>
      <div id="isd-op-panel" role="tabpanel" aria-labelledby={`isd-op-${i}`} className="grid gap-4 border-t border-(--is-line) pt-5 md:grid-cols-12" aria-live="polite">
        <p className={`${DOT} text-[52px] font-semibold leading-[0.85] text-(--is-frost) md:col-span-3`}>{OPS[i][2]}</p>
        <div className="md:col-span-7">
          <p className={`${LABEL} text-(--is-steel)`}>
            O{i + 1} · {OPS[i][0]}
          </p>
          <p className="mt-2 max-w-[56ch] text-[16px] leading-[1.45] text-(--is-frost)">{OPS[i][1]}</p>
        </div>
        <div className="flex gap-2 md:col-span-2 md:justify-end">
          <Button variant="ghost" aria-label="Previous operation" onClick={() => setI((i + 6) % 7)}>
            ←
          </Button>
          <Button variant="ghost" aria-label="Next operation" onClick={() => setI((i + 1) % 7)}>
            →
          </Button>
        </div>
      </div>
    </Panel>
  );
}

/* ---------- N7 · bracketed instrument tags (Helion) ---------- */
export function NovelTags() {
  const toast = useToast();
  const tag = `${MONO} ${TRANS} group inline-flex min-h-8 items-center rounded-[2px] text-[11px] uppercase tracking-[0.14em] ${FR}`;
  const copy = (t: string) => toast(`Copied ${t}`);
  return (
    <Panel
      id="n-tags"
      code="N.07"
      title="Bracketed instrument tags"
      novel="Helion"
      className="lg:col-span-5"
      spec={{
        use: "Borrowed Helion's mono labels and square-bracket captions; transformed into one tag grammar for runs, links, live data and faults. Brackets drift 3px apart on hover/focus; click copies the tag.",
        tokens: "Fragment Mono 11 / 0.14em caps · [ ] in Steel · content Frost · glyph + word for status",
      }}
    >
      <ul className="flex flex-col gap-3">
        {[
          { t: "[ M1 · GMM K=21 ]", body: <>M1 · GMM K=21</>, k: "Run" },
          { t: "[ Read the paper ↗ ]", body: <>Read the paper ↗</>, k: "Link" },
          { t: "[ ● Live · M2 ]", body: <><span className="text-(--is-fiber)">●</span>&nbsp;Live · M2</>, k: "Live" },
          { t: "[ ■ Fault · 2009-05-25 ]", body: <><span className="text-(--is-fault)">■</span>&nbsp;Fault · 2009-05-25</>, k: "Fault" },
          { t: "[ ◆ AOI · P ≥ 0.9 ]", body: <><span className="text-(--is-teal)">◆</span>&nbsp;AOI · P ≥ 0.9</>, k: "Data" },
        ].map((x) => (
          <li key={x.t} className="flex items-center justify-between gap-3 border-b border-(--is-line) pb-3 last:border-b-0 last:pb-0">
            <button type="button" onClick={() => copy(x.t)} className={`${tag} text-(--is-frost) hover:text-white active:opacity-70`} aria-label={`Copy tag ${x.t}`}>
              <span className="text-(--is-steel)">
                <Br>
                  <span className="text-(--is-frost)">{x.body}</span>
                </Br>
              </span>
            </button>
            <span className={`${LABEL} text-(--is-steel)`}>{x.k}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ---------- N8 · 3-step mechanism explainer + Skip (Helion) ---------- */
const STEPS = [
  { t: "Learn the modes", b: "Fit a mixture of Gaussians to nominal telemetry. Each bump is one operating mode; Mission 1 needs 21." },
  { t: "Score each reading", b: "A new timestep's score is how unlikely it is under every mode at once: its negative log-likelihood." },
  { t: "Flag above τ99", b: "Readings past the training set's 99th-percentile score (36.24 on M1) raise an alarm, marked ■ fault." },
];
export function NovelMechanism() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [rm, setRm] = useState(false);
  useEffect(() => setRm(reduced()), []);
  useEffect(() => {
    if (paused || rm) return;
    const t = window.setTimeout(() => setI((x) => (x + 1) % 3), 5000);
    return () => clearTimeout(t);
  }, [i, paused, rm]);
  // a 3-mode density, drawn once
  const W = 400;
  const H = 150;
  const modes = [
    [0.22, 0.06, 0.9],
    [0.48, 0.08, 0.6],
    [0.7, 0.05, 1],
  ];
  const f = (x: number) => modes.reduce((a, [m, s, w]) => a + w * Math.exp(-((x - m) ** 2) / (2 * s * s)), 0);
  const pts = Array.from({ length: 121 }, (_, k) => k / 120);
  const y = (v: number) => H - 14 - v * 110;
  const path = pts.map((x, k) => `${k ? "L" : "M"}${(x * W).toFixed(1)} ${y(f(x)).toFixed(1)}`).join(" ");
  const nominal = 0.47;
  const odd = 0.9;
  return (
    <Panel
      id="n-mech"
      code="N.08"
      title="3-step mechanism"
      novel="Helion"
      className="lg:col-span-7"
      spec={{
        use: "Borrowed Helion's pinned 3-step technology story and its Skip link; transformed into a self-advancing explainer with Pause, step buttons and Skip, and no scroll-jacking.",
        tokens: "5s per step · 1px progress rule · step numbers Mono · Magenta only at step 3's flagged reading",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Mechanism steps" className="flex gap-2">
          {STEPS.map((s, k) => (
            <button
              key={s.t}
              role="tab"
              type="button"
              aria-selected={k === i}
              aria-controls="isd-mech-panel"
              onClick={() => setI(k)}
              className={`${MONO} ${TRANS} relative min-h-9 overflow-hidden rounded-[2px] border px-3 text-[11px] uppercase tracking-[0.12em] ${
                k === i ? "border-(--is-frost) text-(--is-frost)" : "border-(--is-line) text-(--is-steel) hover:border-(--is-frost) hover:text-(--is-frost)"
              } active:bg-(--is-charcoal) ${FR}`}
            >
              0{k + 1}
              {k === i ? <span key={`${i}-${paused}`} aria-hidden data-paused={paused || rm} className="isd-progress absolute inset-x-0 bottom-0 h-px bg-(--is-frost)" style={{ "--d": "5000ms" } as React.CSSProperties} /> : null}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" aria-pressed={paused} onClick={() => setPaused((p) => !p)} className="motion-reduce:hidden">
            {paused ? "▶ Play" : "❚❚ Pause"}
          </Button>
          <a href="#n-entries" className={`${MONO} ${TRANS} rounded-[2px] px-2 py-2 text-[11px] uppercase tracking-[0.14em] text-(--is-steel) underline decoration-(--is-line) underline-offset-4 hover:text-(--is-frost) hover:decoration-(--is-frost) ${FR}`}>
            Skip →
          </a>
        </div>
      </div>
      <div id="isd-mech-panel" role="tabpanel" className="grid items-center gap-5 sm:grid-cols-[1.2fr_1fr]">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Step ${i + 1}: ${STEPS[i].t}`}>
          <line x1="0" x2={W} y1={H - 14} y2={H - 14} stroke="#2E3135" />
          {modes.map(([m, s, w], k) => (
            <path
              key={k}
              d={pts.map((x, j) => `${j ? "L" : "M"}${(x * W).toFixed(1)} ${y(w * Math.exp(-((x - m) ** 2) / (2 * s * s))).toFixed(1)}`).join(" ")}
              fill="none"
              stroke="#8C979F"
              strokeDasharray="2 3"
              opacity={i === 0 ? 0.9 : 0.35}
              style={{ transition: "opacity 300ms" }}
            />
          ))}
          <path d={path} fill="none" stroke="#CFD9E0" strokeWidth="1.6" />
          {i >= 1 ? (
            <g>
              <line x1={nominal * W} x2={nominal * W} y1={H - 14} y2={y(f(nominal))} stroke="#CFD9E0" strokeDasharray="1 3" />
              <rect x={nominal * W - 4} y={H - 18} width="8" height="8" fill="#CFD9E0" />
            </g>
          ) : null}
          {i === 2 ? (
            <g>
              <line x1={0.8 * W} x2={0.8 * W} y1="10" y2={H - 14} stroke="#CFD9E0" strokeWidth="1" />
              <rect x={odd * W - 4} y={H - 18} width="8" height="8" fill="#E04FD6" />
            </g>
          ) : null}
        </svg>
        <div aria-live="polite">
          <p className={`${LABEL} text-(--is-steel)`}>Step 0{i + 1} / 03</p>
          <p className="mt-2 text-[24px] font-semibold leading-[1.05] tracking-[-0.02em] text-(--is-frost)">{STEPS[i].t}</p>
          <p className="mt-2 text-[15px] leading-[1.45] text-(--is-steel)">{STEPS[i].b}</p>
          {i === 2 ? (
            <p className="mt-3">
              <Status kind="fault">Flagged · NLL past τ99</Status>
            </p>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

/* ---------- N9 · broader / closer / deeper zoom (Planet) ---------- */
export function NovelZoom({ tree }: { tree: Tree }) {
  const [m, setM] = useState<1 | 2>(1);
  const [sub, setSub] = useState<number | null>(null);
  const [grp, setGrp] = useState<number | null>(null);
  const t = tree[m];
  const level = grp !== null ? "deeper" : sub !== null ? "closer" : "broader";
  const s = sub !== null ? t.subsystems[sub] : null;
  const g = s && grp !== null ? s.groups[grp] : null;
  const setLevel = (l: string) => {
    if (l === "broader") (setSub(null), setGrp(null));
    if (l === "closer") (setSub(sub ?? 0), setGrp(null));
    if (l === "deeper") (setSub(sub ?? 0), setGrp(grp ?? 0));
  };
  const block = `${MONO} ${TRANS} group relative flex min-h-28 min-w-[64px] flex-col justify-between overflow-hidden rounded-[2px] border p-2 text-left text-[10px] uppercase tracking-[0.1em] ${FR}`;
  const ticks = (n: number) => (
    <span aria-hidden className="absolute inset-x-2 bottom-2 top-11 flex justify-between">
      {Array.from({ length: n }).map((_, k) => (
        <span key={k} className="w-px bg-(--is-steel)/50 group-hover:bg-(--is-frost)/70" />
      ))}
    </span>
  );
  return (
    <Panel
      id="n-zoom"
      code="N.09"
      title="Broader · Closer · Deeper"
      novel="Planet"
      className="lg:col-span-12"
      spec={{
        use: "Borrowed Planet's broader / closer / deeper zoom through imagery; transformed into a zoom through the channel hierarchy: mission → subsystem → operational group → channel. The current region gets Planet's teal outline.",
        tokens: "Blocks sized by channel count · 1px Steel ticks = channels · Teal 1px AOI outline on the region you zoomed from",
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Mission" value={m} onChange={(v) => (setM(v), setSub(null), setGrp(null))} options={[{ v: 1, t: "M1" }, { v: 2, t: "M2" }]} />
        <Segmented
          label="Zoom level"
          value={level}
          onChange={setLevel}
          options={[
            { v: "broader", t: "Broader" },
            { v: "closer", t: "Closer" },
            { v: "deeper", t: "Deeper" },
          ]}
        />
        <p className={`${LABEL} text-(--is-steel)`} aria-live="polite">
          Mission {m} · {t.nChannels} ch{s ? ` › ${s.name} · ${s.n} ch` : ""}
          {g ? ` › group ${g.group} · ${g.channels.length} ch` : ""}
        </p>
      </div>
      {level === "broader" ? (
        <div className="flex flex-wrap gap-1.5">
          {t.subsystems.map((x, k) => (
            <button key={x.name} type="button" onClick={() => (setSub(k), setGrp(null))} className={`${block} border-(--is-line) text-(--is-frost) hover:border-(--is-frost) active:bg-(--is-charcoal)`} style={{ flexGrow: x.n, flexBasis: `${x.n * 6}px` }}>
              <span className="relative z-10 bg-(--is-panel) pr-1 leading-tight">
                {x.name.replace("Subsystem ", "SS-")}
                <span className="block text-(--is-steel)">{x.n} ch</span>
              </span>
              {ticks(x.n)}
            </button>
          ))}
        </div>
      ) : level === "closer" && s ? (
        <div className="rounded-[2px] border border-(--is-teal) p-1.5">
          <p className={`${LABEL} px-1 pb-1.5 text-(--is-teal)`}>[ {s.name} ]</p>
          <div className="flex flex-wrap gap-1.5">
            {s.groups.map((x, k) => (
              <button key={x.group} type="button" onClick={() => setGrp(k)} className={`${block} border-(--is-line) text-(--is-frost) hover:border-(--is-frost) active:bg-(--is-charcoal)`} style={{ flexGrow: x.channels.length, flexBasis: `${x.channels.length * 14}px` }}>
                <span className="relative z-10 bg-(--is-panel) pr-1 leading-tight">
                  G{x.group}
                  <span className="block text-(--is-steel)">{x.channels.length} ch</span>
                </span>
                {ticks(x.channels.length)}
              </button>
            ))}
          </div>
        </div>
      ) : s && g ? (
        <div className="rounded-[2px] border border-(--is-teal) p-3">
          <p className={`${LABEL} pb-3 text-(--is-teal)`}>
            [ {s.name} › Group {g.group} ]
          </p>
          <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
            {g.channels.map((c) => (
              <li key={c.ch} className={`${MONO} rounded-[2px] border border-(--is-line) px-2 py-2 text-[11px] uppercase tracking-[0.08em] text-(--is-frost)`}>
                {c.ch}
                <span className="block text-[10px] text-(--is-steel)">
                  {c.unit}
                  {c.target ? " · target" : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={level === "broader"} onClick={() => (grp !== null ? setGrp(null) : setSub(null))} className={`group ${BTN.secondary}`}>
          <Br>← Broader</Br>
        </button>
        <p className="self-center text-[13px] text-(--is-steel)">Click a block to go closer.</p>
      </div>
    </Panel>
  );
}

/* ---------- N10 · numbered entry list (NASA's Eyes) ---------- */
export function NovelEntries() {
  const items = [
    ["Drag the alarm threshold", "Watch precision trade against recall on a real PR curve.", "#t-threshold"],
    ["Switch missions", "M1's genuine faults vs M2's rare operational events.", "#t-mission"],
    ["Scrub the mission timeline", "Find where the score spikes inside a labelled fault.", "#t-timeline"],
    ["Pick K on the BIC sweep", "See why 21 and 29 modes beat 4 or 5.", "#t-bic"],
    ["Sort Table 1", "Every method, both missions, by PR-AUC.", "#t-table"],
  ];
  return (
    <Panel
      id="n-entries"
      code="N.10"
      title="Numbered entry points"
      novel="NASA's Eyes"
      className="lg:col-span-12"
      spec={{
        use: "Borrowed NASA's Eyes' numbered 01–05 'things to try' list; transformed into the explorer's five entry points, each a whole-row link into the Telemetry section.",
        tokens: "Mono numerals 28px Steel → Frost on hover · hairline rules · arrow slides 4px · row min-h 72",
      }}
    >
      <ol className="border-t border-(--is-line)">
        {items.map(([t, b, href], k) => (
          <li key={t}>
            <a href={href} className={`group grid min-h-[72px] grid-cols-[3.25rem_1fr_auto] items-center gap-4 border-b border-(--is-line) py-3 ${TRANS} hover:bg-(--is-void) active:bg-(--is-charcoal) ${FR} focus-visible:outline-offset-0 md:grid-cols-[4.5rem_minmax(0,22rem)_1fr_auto]`}>
              <span className={`${MONO} pl-1 text-[28px] leading-none text-(--is-steel) ${TRANS} group-hover:text-(--is-frost)`}>0{k + 1}</span>
              <span className="text-[18px] font-semibold leading-tight tracking-[-0.01em] text-(--is-frost)">
                {t}
                <span className="mt-1 block text-[14px] font-normal tracking-normal text-(--is-steel) md:hidden">{b}</span>
              </span>
              <span className="hidden text-[15px] text-(--is-steel) md:block">{b}</span>
              <span aria-hidden className={`${MONO} pr-2 text-[16px] text-(--is-steel) ${TRANS} group-hover:translate-x-1 group-hover:text-(--is-frost)`}>
                →
              </span>
            </a>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
