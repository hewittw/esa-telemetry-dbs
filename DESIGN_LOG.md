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
