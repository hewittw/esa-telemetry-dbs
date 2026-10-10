# Design, Build, Ship — Assignment 2: UI/UX & Visual Design

MPCS 51238 · Autumn 2026 · UChicago · **Due Tue Oct 13, 5:30 PM**

This folder is the project root, the GitHub repo root, and the Vercel deploy root.
This is the only context file. Don't add a CLAUDE.md here or in any folder above it.

## What We're Building
One Next.js + Tailwind static site with four parts:
- **Hub** (`/`): the submitted URL. It links to the 3 mood boards, the 3 design systems,
  and the site, and also states which style we picked and why, plus the browser check.
- **3 mood boards** (`/mood-boards/<style>`): a name plus 25–30 artifacts each.
- **3 design systems** (`/design-systems/<style>`): a UI library built from each board, with
  every component in every state.
- **The site** (`/<site-route>`): in the style we pick, with at least 2 faked interactions.

**Site:** _TBD: what it is, who it's for, and what they should see/do first. Lives in `docs/brief.md`._
**Styles:** _TBD: three styles that feel clearly different from each other._

## Hard Rules (every task)
- Next.js App Router + Tailwind. Design tokens go in `@theme`, classes in the markup.
- Static only: no database, accounts, external APIs, or storage. Interactions are faked in
  the browser and nothing is saved. Push back on any backend, database, or unneeded package.
- No unit tests while prototyping unless asked.
- Never ship the agent's default look. Check `docs/avoid.md` before any visual work.
- Every control gets visible rest, hover, focus-visible, pressed, selected, and disabled states.
  Never use `outline: none` without a replacement.
- The accent color is only for the primary action.
- Before saying any UI change is done, verify it in a real browser (see the `verify-ui` skill).
  A claim isn't evidence; a screenshot is.

## Our Bar
- Apple-level craft: precise, restrained, confident, with nothing extra. Creative but professional.
- Uniqueness is graded across ~28 students. Push for distinct, specific directions, never safe or generic.
- The user steers and the agent executes. When unsure about a direction, offer several options
  (AskUserQuestion) instead of guessing.
- A one-shot result is graded incomplete, so iterate visibly in small steps.

## Keep a Trail (standing practice)
- **Commit after each meaningful step**, and name the change and the reason, e.g.
  `mood-board/swiss: add 8 transit-signage artifacts`, not `update`. The commit history is graded.
- **`DESIGN_LOG.md`**: append as decisions happen, covering what we chose, why, what we
  rejected, and where the user pushed back. This feeds the in-class explanation:
  style fit, design decisions, and how the agent was used.

## Read When Needed
- Full requirements and grading checklist → `docs/assignment.md`
- Site brief, audience, and content → `docs/brief.md`
- UI/UX principles and naming vocabulary → `docs/design-principles.md`
- Looks to avoid (AI defaults) → `docs/avoid.md`
- Style-specific tokens and rules → `docs/styles/<style>.md` (create one per style once its board exists)
- Writing Next.js code → read the docs for the installed version (next-devtools MCP `nextjs_docs`)

## Tools Available
- MCP: `playwright` (its own fresh browser: screenshots, resizing, console), `next-devtools`
  (dev-server errors, routes, Next.js docs), `context7` (library docs).
- CLI: `gh` (logged in as hewittw), `vercel` (logged in).
- **Never** use `chrome-devtools` MCP or Claude in Chrome (`/chrome`), or anything else that touches the
  user's own Chrome or a logged-in browser profile. Browser checks are Playwright only.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
