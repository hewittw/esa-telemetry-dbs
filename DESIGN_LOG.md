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
