---
name: verify-ui
description: Check pages in a real browser and report what's broken, with screenshots as evidence. Use after creating or changing any page, component, style, or interaction, before saying UI work is done, or when asked to check, test, screenshot, review, or make a contact sheet of the site.
---

# Verify UI in a Real Browser

1. Make sure the dev server is running (`npm run dev`). Use next-devtools MCP to read compile and runtime errors first.
2. Run `node scripts/matrix.mjs <url> screenshots/<name>` for EVERY screen size: phones 320/375/390/430 (touch), 844x390 landscape, iPad 768/1024, 1280/1440/1920/2560. View each screenshot. (Single shots: `scripts/shot.mjs`.)
3. Try every interaction: click, filter, open and close panels/modals, and Tab through every control
   (a focus ring must be visible). Check hover and pressed states.
4. Check the console for errors and warnings (Playwright console messages). Never use chrome-devtools MCP or Claude in Chrome.
5. Save screenshots to `screenshots/<route>-<width>-<state>.png`. For many states, build a
   contact sheet (one image or page showing every state side by side) so the user can review it at a glance.
6. Report **evidence, not claims**: list what's broken (overflow, overlap, clipped text, missing
   states, contrast < 4.5:1, console errors) with the screenshot paths. Don't rate your own work generously.
7. Mechanics (overlap, overflow, errors) can be judged from the screenshots. Judgment calls (does the style
   fit, is the main task first) get flagged for the user, not decided.
