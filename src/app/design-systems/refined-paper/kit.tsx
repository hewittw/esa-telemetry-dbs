// Refined paper design system: shared class strings and glyphs.
// Every control string carries its live states (hover:, active:, focus-visible:, aria-*:, disabled:)
// AND a forced twin (data-[s=hover]: …) so the state matrix in section 5 renders from the very same
// string as the live control and can never drift from it.

export const FOCUS =
  "outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ink)] data-[s=focus]:outline-solid data-[s=focus]:outline-2 data-[s=focus]:outline-offset-2 data-[s=focus]:outline-[color:var(--ink)]";

const T = "transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-out";

export const SERIF = "rpd-serif";
export const SANS = "rpd-sans";
export const MONO = "rpd-mono tabular-nums";

/* ------------------------------------------------------------------ buttons */
const BTN = `${SANS} ${T} ${FOCUS} inline-flex min-h-10 select-none items-center justify-center gap-2 rounded-[3px] px-4 text-[14px] font-medium leading-none whitespace-nowrap disabled:cursor-not-allowed`;

export const btnPrimary = `${BTN} bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] data-[s=hover]:bg-[var(--accent-hover)] active:translate-y-px active:bg-[var(--accent-press)] data-[s=pressed]:translate-y-px data-[s=pressed]:bg-[var(--accent-press)] disabled:translate-y-0 disabled:bg-[var(--rule)] disabled:text-[var(--muted)] data-[s=disabled]:bg-[var(--rule)] data-[s=disabled]:text-[var(--muted)]`;

export const btnSecondary = `${BTN} border border-[var(--rule-strong)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--ink)] hover:bg-[var(--parchment)] data-[s=hover]:border-[var(--ink)] data-[s=hover]:bg-[var(--parchment)] active:translate-y-px active:bg-[var(--rule)] data-[s=pressed]:translate-y-px data-[s=pressed]:bg-[var(--rule)] disabled:translate-y-0 disabled:border-dashed disabled:border-[var(--rule-strong)] disabled:bg-transparent disabled:text-[var(--muted)] data-[s=disabled]:border-dashed data-[s=disabled]:bg-transparent data-[s=disabled]:text-[var(--muted)]`;

/** Quiet text button: for tertiary actions beside a primary. */
export const btnQuiet = `${BTN} px-2 text-[var(--ink)] underline decoration-[var(--rule-strong)] underline-offset-4 hover:decoration-[var(--ink)] active:text-[var(--muted)] disabled:text-[var(--muted)] disabled:no-underline`;

/** Round transport button (play/pause/step). The only round controls in the system, with slider thumbs. */
export const btnTransport = `${SANS} ${T} ${FOCUS} grid size-10 shrink-0 place-items-center rounded-full border border-[var(--rule-strong)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--ink)] hover:bg-[var(--parchment)] active:bg-[var(--rule)] disabled:cursor-not-allowed disabled:border-dashed disabled:text-[var(--muted)] disabled:hover:bg-transparent`;
export const btnTransportMain = `${SANS} ${T} ${FOCUS} grid size-10 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--ink-soft)] active:bg-black aria-pressed:bg-[var(--oxblood)]`;

/** Square icon button (menu ≡, more ⋮, close ×). */
export const btnIcon = `${SANS} ${T} ${FOCUS} relative grid size-10 shrink-0 place-items-center rounded-[3px] text-[var(--ink)] hover:bg-[var(--parchment)] active:bg-[var(--rule)] aria-expanded:bg-[var(--parchment)] disabled:text-[var(--muted)]`;

/* ------------------------------------------------------------------ link */
export const link = `${T} ${FOCUS} rounded-[2px] text-[var(--ink)] underline decoration-[var(--rule-strong)] decoration-1 underline-offset-[0.22em] hover:decoration-[var(--ink)] data-[s=hover]:decoration-[var(--ink)] active:text-[var(--muted)] data-[s=pressed]:text-[var(--muted)]`;

/* ------------------------------------------------------------------ chips */
export const chip = `${SANS} ${T} ${FOCUS} group inline-flex h-8 select-none items-center gap-1.5 rounded-[3px] border border-[var(--rule-strong)] bg-transparent px-3 text-[13px] font-medium text-[var(--ink)] hover:bg-[var(--parchment)] data-[s=hover]:bg-[var(--parchment)] active:bg-[var(--rule)] data-[s=pressed]:bg-[var(--rule)] aria-pressed:border-[var(--ink)] aria-pressed:bg-[var(--parchment)] data-[s=selected]:border-[var(--ink)] data-[s=selected]:bg-[var(--parchment)] disabled:cursor-not-allowed disabled:border-dashed disabled:bg-transparent disabled:text-[var(--muted)] data-[s=disabled]:border-dashed data-[s=disabled]:text-[var(--muted)]`;
export const chipCheck = "hidden group-aria-pressed:inline group-data-[s=selected]:inline";

/* ------------------------------------------------------------------ tabs */
export const tab = `${SANS} ${T} ${FOCUS} relative -mb-px inline-flex h-10 select-none items-center rounded-t-[3px] border-b-2 border-transparent px-3 text-[14px] font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--rule-strong)] data-[s=hover]:text-[var(--ink)] data-[s=hover]:border-[var(--rule-strong)] active:bg-[var(--parchment)] data-[s=pressed]:bg-[var(--parchment)] aria-selected:border-[var(--ink)] aria-selected:text-[var(--ink)] data-[s=selected]:border-[var(--ink)] data-[s=selected]:text-[var(--ink)] disabled:cursor-not-allowed disabled:text-[var(--muted)] disabled:line-through disabled:decoration-[var(--rule-strong)] disabled:hover:border-transparent data-[s=disabled]:line-through`;

/* ------------------------------------------------------------------ segmented */
export const segTrack = "inline-flex rounded-[3px] border border-[var(--rule-strong)] bg-[var(--parchment)] p-[3px]";
export const seg = `${SANS} ${T} ${FOCUS} inline-flex h-8 min-w-[3.25rem] select-none items-center justify-center gap-1.5 rounded-[2px] border border-transparent px-3 text-[13px] font-medium text-[var(--muted)] hover:text-[var(--ink)] data-[s=hover]:text-[var(--ink)] active:bg-[var(--rule)] data-[s=pressed]:bg-[var(--rule)] aria-checked:border-[var(--ink)] aria-checked:bg-[var(--paper)] aria-checked:text-[var(--ink)] data-[s=selected]:border-[var(--ink)] data-[s=selected]:bg-[var(--paper)] data-[s=selected]:text-[var(--ink)] disabled:cursor-not-allowed disabled:line-through`;

/* ------------------------------------------------------------------ inputs */
export const field = `${SANS} ${T} ${FOCUS} h-10 w-full min-w-0 rounded-[3px] border border-[var(--rule-strong)] bg-[var(--mount)] px-3 text-[15px] text-[var(--ink)] placeholder:text-[var(--muted)] hover:border-[var(--muted)] data-[s=hover]:border-[var(--muted)] focus-visible:border-[var(--ink)] data-[s=focus]:border-[var(--ink)] aria-invalid:border-[var(--oxblood)] aria-invalid:bg-[#F7EDE8] disabled:cursor-not-allowed disabled:border-dashed disabled:bg-transparent disabled:text-[var(--muted)] data-[s=disabled]:border-dashed data-[s=disabled]:bg-transparent data-[s=disabled]:text-[var(--muted)]`;
export const fieldLabel = `${SANS} block text-[13px] font-medium text-[var(--ink)]`;
export const fieldHelp = `${SANS} mt-1.5 block text-[12px] leading-[1.4] text-[var(--muted)]`;

/* ------------------------------------------------------------------ switch */
export const switchTrack = `${T} ${FOCUS} group relative inline-flex h-[22px] w-[40px] shrink-0 items-center rounded-[3px] border border-[var(--rule-strong)] bg-[var(--parchment)] hover:border-[var(--ink)] data-[s=hover]:border-[var(--ink)] active:bg-[var(--rule)] data-[s=pressed]:bg-[var(--rule)] aria-checked:border-[var(--ink)] aria-checked:bg-[var(--ink)] data-[s=selected]:border-[var(--ink)] data-[s=selected]:bg-[var(--ink)] disabled:cursor-not-allowed disabled:border-dashed disabled:bg-transparent data-[s=disabled]:border-dashed data-[s=disabled]:bg-transparent`;
export const switchKnob = "pointer-events-none absolute left-[3px] size-[14px] rounded-[2px] border border-[var(--ink)] bg-[var(--paper)] transition-transform duration-300 ease-[cubic-bezier(.22,.61,.36,1)] group-aria-checked:translate-x-[18px] group-aria-checked:border-[var(--paper)] group-data-[s=selected]:translate-x-[18px] group-data-[s=selected]:border-[var(--paper)] group-disabled:border-[var(--rule-strong)] group-data-[s=disabled]:border-[var(--rule-strong)]";

/* ------------------------------------------------------------------ checkbox + radio (native, restyled) */
export const checkbox = `${T} ${FOCUS} peer relative size-[18px] shrink-0 cursor-pointer appearance-none rounded-[2px] border border-[var(--ink)] bg-[var(--mount)] hover:bg-[var(--parchment)] active:bg-[var(--rule)] checked:bg-[var(--ink)] indeterminate:bg-[var(--ink)] disabled:cursor-not-allowed disabled:border-dashed disabled:border-[var(--rule-strong)] disabled:bg-transparent`;
export const radio = `${T} ${FOCUS} peer relative size-[18px] shrink-0 cursor-pointer appearance-none rounded-full border border-[var(--ink)] bg-[var(--mount)] hover:bg-[var(--parchment)] active:bg-[var(--rule)] checked:shadow-[inset_0_0_0_4px_var(--mount)] checked:bg-[var(--ink)] disabled:cursor-not-allowed disabled:border-dashed disabled:border-[var(--rule-strong)]`;

/* ------------------------------------------------------------------ type roles */
export const eyebrow = `${MONO} text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]`;
export const caption = `${SANS} text-[12px] leading-[1.45] text-[var(--muted)]`;
export const label = `${SANS} text-[13px] font-medium text-[var(--ink)]`;
export const body = `${SERIF} text-[17px] leading-[1.6] text-[var(--ink)] sm:text-[19px] sm:leading-[1.58]`;

/* ------------------------------------------------------------------ glyphs (1.4px hairline strokes) */
type G = { className?: string; size?: number };
export const IconCheck = ({ className = "", size = 12 }: G) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 12 12" className={className}><path d="M2.2 6.4 4.9 9 9.8 3.2" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
);
export const IconCross = ({ className = "", size = 12 }: G) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 12 12" className={className}><path d="M3 3l6 6M9 3 3 9" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
);
export const IconDash = ({ className = "", size = 12 }: G) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 12 12" className={className}><path d="M2.5 6h7" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
);
export const IconWarn = ({ className = "", size = 12 }: G) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 12 12" className={className}><path d="M6 1.4 11 10.4H1z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M6 4.6v2.8M6 8.4v.9" stroke="currentColor" strokeWidth="1.3" /></svg>
);
export const IconInfo = ({ className = "", size = 12 }: G) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 12 12" className={className}><circle cx="6" cy="6" r="4.9" fill="none" stroke="currentColor" strokeWidth="1.2" /><path d="M6 5.2v3.4M6 3.4v.9" stroke="currentColor" strokeWidth="1.3" /></svg>
);
export const IconMenu = ({ className = "", size = 16 }: G) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 16 16" className={className}><path d="M2 4.5h12M2 8h12M2 11.5h12" stroke="currentColor" strokeWidth="1.4" /></svg>
);
export const IconMore = ({ className = "", size = 16 }: G) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 16 16" className={className}><circle cx="8" cy="3.5" r="1.3" fill="currentColor" /><circle cx="8" cy="8" r="1.3" fill="currentColor" /><circle cx="8" cy="12.5" r="1.3" fill="currentColor" /></svg>
);
export const IconChevron = ({ className = "", size = 12 }: G) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 12 12" className={className}><path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
);
export const IconPlay = ({ className = "", size = 12 }: G) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 12 12" className={className}><path d="M3 1.5v9l7.5-4.5z" fill="currentColor" /></svg>
);
export const IconPause = ({ className = "", size = 12 }: G) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 12 12" className={className}><rect x="2" y="1" width="3" height="10" fill="currentColor" /><rect x="7" y="1" width="3" height="10" fill="currentColor" /></svg>
);
export const IconStep = ({ className = "", size = 12, back }: G & { back?: boolean }) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 12 12" className={className}><path d={back ? "M8 2 4 6l4 4" : "m4 2 4 4-4 4"} fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
);
export const IconArrow = ({ className = "", size = 12 }: G) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 12 12" className={className}><path d="M1.5 6h8.5M7 3l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
);
export const IconSearch = ({ className = "", size = 14 }: G) => (
  <svg aria-hidden width={size} height={size} viewBox="0 0 14 14" className={className}><circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="m9.2 9.2 3.3 3.3" stroke="currentColor" strokeWidth="1.3" /></svg>
);

/** Status = colour + icon + word, never colour alone. */
export type Status = "ok" | "warn" | "fail" | "info" | "idle";
export const STATUS: Record<Status, { word: string; color: string; Icon: (p: G) => React.ReactElement }> = {
  ok: { word: "Pass", color: "var(--sage)", Icon: IconCheck },
  warn: { word: "Check", color: "var(--ochre)", Icon: IconWarn },
  fail: { word: "Fail", color: "var(--oxblood)", Icon: IconCross },
  info: { word: "Note", color: "var(--prussian)", Icon: IconInfo },
  idle: { word: "None", color: "var(--muted)", Icon: IconDash },
};
