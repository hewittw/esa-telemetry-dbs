# Design Log — Assignment 2

Running log of real decisions: what we chose, why, what we rejected, and where the user pushed back.
Append as decisions happen, newest at the bottom.

---

## 2026-10-09 · Setup
- Read all Week 2 materials (assignment PDF, 94 slides, 4 async lessons + practice) before starting.
- **Project root:** `week2/hw2/`, mirroring `week1/hw1`, so the repo stays separate from ~1GB of course media.
- **Context strategy:** slim always-loaded `AGENTS.md` with on-demand `docs/` files and a `verify-ui` skill,
  per the "context on demand" lesson. Rejected: carrying over week 1's long, all-in-one context file.
- **Bar:** Apple-level, professional craft while staying highly creative and distinct.
- **Open:** what the site is, its audience, and the three styles.

## 2026-10-09 · Browser tooling
- **Playwright MCP only** for browser checks. It opens its own fresh browser with no logins.
- **Rejected:** chrome-devtools MCP and Claude in Chrome (`/chrome`). The user doesn't want anything connecting
  to their own or a logged-in Chrome. chrome-devtools MCP is denied in `.claude/settings.json` for this project.

## 2026-10-09 · Site & audience
- **Site:** an interactive findings explorer for our TTIC 31220 ESA telemetry paper (with Rhea Madhogarhia).
  Chosen over a lacrosse playbook, dog log, or study-spot guide because it has deep real content, is
  portfolio-relevant, and is unique in the class.
- **Audience:** ML recruiters/engineers (~2 min skim) and research peers (want the evidence).
- **Rejected:** porting the whole report to HTML. It fails "simplicity". We lead with the one finding instead.
- **Direction from the user:** very modern and clean, like SpaceX/Apple, with incredible animations and all-new figures.
- **Scaffold:** Next.js 16.4 + Tailwind v4 (create-next-app, src/ dir, TS). Generated in a temp dir and merged,
  keeping our AGENTS.md plus Next's agent-rules block.

## 2026-10-09 · Reference research
- Three parallel research agents (aerospace/deep-tech, research data-viz, out-of-the-box) found ~35 live sites.
  Curated to 15 in `docs/references.md`.
- Strongest recurring idea: one interaction carries the thesis, e.g. a Planet-style zoom or an iCOMAT-style
  before/after, showing subsystem-level (4–5) vs. group-level (18–29) structure.

## 2026-10-09 · Research studies (`/research`)
- The user's idea: a mood board per reference site first, then remix them into our own.
  **Adjusted:** 15 lightweight *studies* (screenshots, palette, type, layout, motion, take/leave) rather than
  15 full 25–30 artifact boards, so the effort goes into the 3 official boards.
- **How:** one capture script ran 15 sites in parallel isolated headless browsers (1440 + 390 px screenshots
  plus computed palette/type extraction), then 5 parallel agents wrote one study each for 3 sites.
- **Bugs found in the browser check:** the client filter imported an `fs` module (split the types into
  `research-types.ts`); Apex, Igloo, and NASA Eyes heroes were captured before their video/WebGL loaded
  (recaptured with a 12s wait). Planet and Stoke screenshots still show cookie banners; kept, and their captions say so.
- Playwright MCP is configured for the system Chrome channel, which isn't at the default path. Verified via a script
  with Playwright's bundled Chromium instead (headless, logged out).

## 2026-10-12 · Three mood-board directions (the user's call)
- **1 · intense-space:** "intense space". Planet + NASA Eyes + **heavily iCOMAT** + Helion. Dark, charged,
  generative fiber lines, dot-matrix callouts, bracket instrument tags.
- **2 · refined-paper:** modern minimalist, lighter, more traditional but refined. Ciechanowski GPS + Apple +
  R2D3 + Distill, with the user also drawn to Distill and Anthropic's transformer-circuits pages.
- **3 · white-immersion:** intensely unique, a full immersive experience. Igloo merged with Skyviewer;
  **white**, interactive, immersive.
- **How:** three parallel agents, each owning only its route, public folder, and `docs/styles/<slug>.md`.
  A shared `MoodBoardMeta` contract feeds the hub previews; one shared dev server; `scripts/shot.mjs` for
  headless checks at 1440/390/320. Each agent must check its board in the browser before reporting (the user asked).
- Artifacts: ~28 per board, roughly half collected (public-domain NASA/ESA/Wikimedia plus research-screenshot crops,
  all credited) and half ✦ generated in code, with generative pieces drawn from our real telemetry data.

## 2026-10-12 · Mood boards built, independently verified, deployed
| Board | Mood name | Artifacts | Lead references |
|---|---|---|---|
| intense-space | Charged · Fibrous · Instrumented | 28 (14 collected, 14 ✦) | iCOMAT, Helion, Planet, NASA Eyes |
| refined-paper | Lucid · Patient · Inked | 28 (14 collected, 14 ✦) | Ciechanowski, Apple, R2D3, Distill, Anthropic |
| white-immersion | Whiteout · Crystalline · Instrumented | 28 (14 collected, 14 ✦) | Igloo, Skyviewer |
- Every ✦ data artifact is drawn from our real telemetry (GMM score timelines, BIC sweeps, PR curves, GMM
  components, channel hierarchy), not decoration. Collected images are public-domain NASA, ESA, and Wikimedia
  (credited), plus credited research-screenshot crops.
- **The user asked for all screen sizes, phones included.** Added `scripts/matrix.mjs` (11 viewports). It caught
  what 390/1440 checks missed: on iPad and phone landscape the intense-space notes were **overlaid on the
  artifacts**. Fixed to sit in flow below them; every board now keeps notes off the artifacts on touch.
- **Separate verifier agents found real bugs:** white-immersion's HUD buttons had *no* hover/focus/pressed
  states (CSS selector `button.circle` never matched `.wi-circle`); refined-paper figures appeared half-drawn
  on load; a Planet crop cut words mid-word; chart labels rendered under 10px; refined-paper's phone page was
  19.6k px tall (now tap-to-reveal notes, 14.5k px).
- **Honesty:** PR-curve captions say which curves are the exact Table 1 runs vs. earlier saved runs.
- Rejected: CSS Modules (this Turbopack setup routes all .css through Tailwind), so we use page-scoped
  prefixed classes instead.
- Deployed from a clean git worktree of HEAD so in-progress design-system files never ship half-built.

## 2026-10-13 · The user's review: design, not content; show the lecture's concepts
- The user loves the boards' creative pieces. **Pushback:** too many reference-website screenshots, and captions that
  explained those sites' subject matter. "We are interested in design and UI, not the other websites' content."
- **Change:** each board keeps ≤ 2 website crops; the rest become ✦ data-driven UI/type/color/texture pieces or
  physical-world design references. Every note is rewritten to name the design move and where it goes in our explorer.
  Color and texture each get ≥ 2 artifacts (the verifiers found color thin).
- **Change:** every design system gains a **Principles** section that rebuilds the Week 2 slides in its own style
  on our telemetry content: What You See, Emphasize by De-emphasizing, Type Roles, Color Roles, Accent Color,
  Alignment, What's Clickable, Choosing a Direction, and the Full Design System 1–6 overview, plus all 18
  Parts-of-an-Interface elements labelled with the slide's names.
- **Consistency fix:** "best" badges now say what they mean (highest PR-AUC = GMM on M1; best VAE as bolded in the paper = TVAE).

## 2026-10-13 · Design systems built, independently verified, deployed
| System | Standard | Novel (from) | Telemetry | Principles |
|---|---|---|---|---|
| intense-space | 30 | 10 (ICOMAT, Helion, Planet, NASA Eyes) | 8 | L1–L9 |
| refined-paper | 28 | 10 (Ciechanowski, R2D3, Distill, transformer-circuits, Apple) | 8 | L1–L9 |
| white-immersion | 32 | 9 (Igloo, Skyviewer) | 9 | L1–L9 |
- Each has the handout's sections 1–6 (colour roles with *computed* contrast, type roles, spacing/shape, components,
  a forced 6-state matrix built from the live class strings, empty/loading/error/success with a simulator), all 18
  Parts-of-an-Interface elements under the slide's names, and every component live and keyboard-accessible.
- **The user's spec:** ≥ 20 standard + 5–10 novel from the inspiration sites + 5–10 satellite-specific components.
  The telemetry pieces run on the real data: an alarm-threshold operating point that recomputes precision/recall/
  F1 live from a PR curve, a mission switcher, a BIC-vs-K picker, a timeline scrubber over fault segments, a sortable Table 1.
- **Verifier catches:** Tailwind v4 `outline-none` + `focus-visible:outline-2` renders *no* ring (needs
  `outline-solid`); the ≡ menu had no arrow keys; recomputed HVAE/TVAE M2 curves (0.450/0.452) read as Table 1 values
  (0.434/0.438) and are now labelled "recomputed · Table 1: …"; empty holes at 1440; magenta made strictly "failure + a word".
- **Decided:** "Best" means two different things. **Top PR-AUC** = GMM on M1 (0.384), TVAE on M2 (0.438);
  **Best VAE (bolded in the paper)** = TVAE. Both badges say which one they are.
- **Decided (white-immersion):** a scannable scroll library *inside* an immersive frame (HUD, fly-to, tour, atlas,
  real deep zoom) rather than a full pan/zoom canvas. A UI library has to be linkable, keyboard-usable, and readable at 320px.
- **User request:** "Designed & built by Hewitt Watkins" plus an About section on the hub; the paper keeps its accurate
  two-author citation. The final report PDF is added for an in-site viewer and download.

## 2026-10-13 · Three site versions → the pick
| Version | Hierarchy | Fit to the user's direction | Length (1440) | Main weakness |
|---|---|---|---|---|
| intense-space | Strongest: 112px finding, one green action | Closest to "SpaceX/Apple with incredible animation": live data-driven fiber hero | 6.7k px | Green fiber art dilutes "accent = primary action" |
| refined-paper | Strong: one serif sentence, colour-keyed words | Calm, literate; least spectacle | 11.8k px | Long; empty right third in the hero |
| white-immersion | Weakest: finding in 24px mono, numerals louder, 4 equal buttons | Most unique | n/a (a world) | Scroll-to-travel breaks convention; no text selection; tour pill overlaps on phones |
- **Picked: intense-space (Charged · Fibrous · Instrumented).** Why it fits the people who'd use it: an ML recruiter
  gets the finding in one look and the "instrument" feel says engineering rigor; peers get every number on real data
  with page-level provenance. It's also the most distinct of the three in a class of ~28.
- **Rejected for the final:** white-immersion's world-as-site (affordances and hierarchy cost too much for a 2-minute
  reader) and refined-paper's long-form essay (strong, but it fails Simplicity at 12k px).
- **Carried into the final:** monochrome fiber art (frost/steel, with magenta faults) so green appears *only* on
  the primary action; one global M1/M2 switch; colour-keyed words and footnote page chips from refined-paper; a short
  guided tour from white-immersion; figures that draw in on scroll; empty panels at 1440 filled.
- All three versions stay linked from the hub as the candidates, so the process is visible.

## 2026-10-13 · Be ready to explain (talking points)
- **Style:** Charged · Fibrous · Instrumented. Recruiters get the claim in one look and the instrument feel signals rigor;
  peers get every number on real data with a page link to the paper. Chosen over white-immersion (hierarchy and
  affordance cost) and refined-paper (too long for a two-minute reader).
- **What people see first:** the 112px finding, "operating modes" in the same teal as the group marks in the figures.
- **How they know what to click:** bracketed buttons whose brackets spread on hover, ⟷ handles, crosshair charts,
  page chips ending in ↗.
- **What each state tells them:** hover border, 2px focus ring, pressed drop, selected fill, dimmed disabled, plus
  designed empty/loading/error/success states.
- **How the agent was used:** a slim AGENTS.md + on-demand docs + a verify-ui skill; parallel research, build, and
  *separate* verifier agents.
  - **Hewitt pushed back on:** logged-in Chrome (Playwright only); testing every screen size (the 11-viewport matrix);
    design not other sites' content; including every lecture element; authorship ("Designed & built by Hewitt Watkins",
    paper citation kept accurate).
  - **Hewitt decided:** the project, the audience, the reference groupings for each direction, the public repo, the report viewer.
- Full notes: `docs/talking-points.md`.

## 2026-10-13 · Two more finalists (the user's call)
- The user decided to keep going overnight and asked for **two more finished sites in the other two styles**, so they
  can choose their favourite in the morning rather than accept the agent's pick.
- `/finalists/refined-paper` and `/finalists/white-immersion` are refined to the same bar as `/telemetry` (accent audit,
  one global mission control, page chips + provenance, a guided tour, draw-in motion, a simplicity pass, the authorship footer).
- Each also fixes the weaknesses that lost the comparison. **refined-paper:** 11.8k → ≤ 7k px, and a live figure in the
  empty hero third. **white-immersion:** the finding becomes the first thing seen, one cyan action, normal scrolling
  instead of scroll-to-travel, selectable text, no overlaps on phones.
- The final pick, and which route becomes the site linked from the hub, is Hewitt's decision tomorrow.

## 2026-10-13 · Hewitt's pick: Lucid · Patient · Inked, and three iterations
- **Hewitt picked refined-paper (Lucid · Patient · Inked)** after seeing all three finals live. This overrules the
  agent's earlier pick of intense-space.
- **Hewitt's critique:** titles like "Telemetry's structure sits at the level of operational groups" (or labels like
  "S1 4 gr") "mean nothing" to someone who doesn't know the project. The site should **use UI to bring the paper to
  life**, and that means explaining more. "We have the room."
- **New brief (`docs/lucid-spec.md`):** the hero is the paper's title, an ink line drawing of a satellite on the left,
  and one sentence on the goal. The first section explains the course (TTIC 31220 Unsupervised Learning), ESA,
  telemetry, the ESA Anomaly Dataset and why it's novel, then the gap (detectors fail on it, but *why*?). Then the
  paper's arc, with interactive figures as subsections inside the paper's sections. The audience is a researcher
  who knows nothing about the project (the grader).
- **Three iterations:** A · The Essay, B · The Paper Alive, C · The Explainer (a better version of the current page).
- **Decided with Hewitt:** a generic satellite drawn in ink, because the dataset anonymises the missions; no more work
  on the older finals; the hub puts the three Lucid iterations first.

## 2026-10-13 · Three Lucid iterations built and deployed
| Version | Shape | Prose / page words | Checks |
|---|---|---|---|
| A · The Essay | one 66ch long read, figures inline where the text needs them | ~2,200 prose | 30/30 |
| B · The Paper, Alive | the paper's own §1–§7, numbered subsections, ~35 margin glosses, sticky section rail | ~2,930 | 42/42 |
| C · The Explainer | the picked design rebuilt for a newcomer: "You'll learn" lines, a plain sentence before every result, a 12-term inline glossary | ~2,265 | 29 (2 false fails) |
- All three open with the paper's title, an ink satellite line drawing, and the goal, then a context section
  (the course → ESA → telemetry → the ESA Anomaly Dataset → why it's novel → the gap → Q1/Q2).
- **A builder caught an error in the agent's own spec:** it said the M1 VAEs "don't clear" 0.322, but TransformerVAE scores
  0.335. The spec was corrected to "land close to the plateau (0.293–0.335)" and pushed to the other builders mid-run.
- Remaining honest caveats on all three: the long-fault figure uses the saved K = 8 K-Means run, not the paper's K = 2
  (labelled); the paper's text says K ∈ {2…20} while the saved sweep runs to 30 (copy avoids stating a range).
