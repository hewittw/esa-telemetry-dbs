# Be Ready to Explain: talking points (Assignment 2)

## 1. My style, and why it fits
- **Charged · Fibrous · Instrumented.** A charcoal "instrument" with hairline panels, mono instrument tags, dot-matrix numerals, and a live fiber field drawn from the real anomaly scores.
- **Recruiters** (two minutes): the claim is the biggest thing on the page, and the instrument look signals engineering rigor before they read a word.
- **Peers**: every number is redrawn from the saved results, and every figure links to the page of the paper that backs it.
- **I explored three directions** (intense space, refined paper, white immersion) as mood boards → design systems → full site versions, then picked this one. The white world was the most unique but cost too much in hierarchy and affordances. The paper version was the most literate but too long for a two-minute reader.

## 2. My design decisions
- **What people see first:** "Telemetry runs in 18–29 operating modes, not 4–5 subsystems." It's 112px, with "operating modes" in teal, the same teal the figures use for groups. Everything else is quieter (emphasize by de-emphasizing).
- **How they know what to click:** bracketed buttons whose brackets spread on hover; drag handles with ⟷ and an ew-resize cursor; a crosshair over clickable charts; page chips ending in ↗. Static things never look clickable.
- **What each state tells them:** hover = Frost border; focus = 2px Frost ring (tested on every control by keyboard); pressed = a 1px drop; selected = a Frost fill or teal chip; disabled = dimmed with a not-allowed cursor; empty/loading/error/success each have a designed state.
- **One color, one job:** green is *only* the primary action ("Read the paper"), audited to ≤ 1 per view. Teal = groups and highlighted data. Magenta = labelled faults, always with ■ and a word (never color alone).
- **Responsive:** checked at 11 sizes, from a 320px phone to 2560px. Notes and panels never overlap on touch screens.

## 3. How I used the agent
- **Asked for:** a slim AGENTS.md with on-demand docs (the Week 2 "context on demand" lesson); research fan-out with parallel subagents; 15 reference studies; three mood boards, then design systems, then site versions; a separate verifier agent after every build.
- **Where I pushed back:**
  - "Don't connect to my logged-in Chrome." Playwright only, with chrome-devtools blocked in project settings.
  - "Test on all screen sizes, phones too." This produced the 11-viewport matrix script, which caught notes overlapping artifacts on iPad and phone landscape that 390/1440 checks had missed.
  - "We're interested in design and UI, not the other websites' content." Website screenshots were cut to ≤ 2 per board, and every note was rewritten as a design move.
  - "Include every lecture element." Every design system got a Principles section rebuilding the Week 2 slides, plus all 18 Parts of an Interface.
  - "This is my project." The site says "Designed & built by Hewitt Watkins"; I kept the paper's accurate co-author citation.
- **What I decided myself:** the project (my TTIC telemetry paper over a lacrosse site); the audience; which reference sites go into which direction; the three directions' groupings; public repo; the report viewer + PDF download.
- **What the agent caught that I'd have missed:** a Tailwind v4 quirk that erased focus rings; HUD buttons with no states (a selector that never matched); recomputed VAE curves that disagreed with Table 1 (now labelled); "Best" meaning two different things (now two badges).
