# UI/UX Principles (Week 2 lecture)

Get the UI/UX foundation right before the visual style. Most design problems live at the
hierarchy, layout, and affordance layer, not in the colors.

## Visual Hierarchy
- Hierarchy is the order people read a screen: first, second, third. People scan; they don't read.
- The levers are size, weight, contrast, and position (top is seen first).
- **Emphasize by de-emphasizing:** to make the primary action win, make everything else quieter
  (smaller, grayer). Don't make it louder; two loud things still compete, and arrows add decoration, not order.

## Type
- A typeface is the family; a font is one weight or style within it.
- Use named roles (display, heading, body, label, caption), each with a fixed size and weight, used the same way everywhere.

## Color
- Roles: background, surface, text, muted, border, accent. Each color has one job.
- The accent is used sparingly, only on the main action. Accent everywhere means nothing stands out.
- Don't use color alone for meaning; pair it with a word or icon (Done ✓ / Missed ✕ / Not yet).
- Body text contrast ≥ 4.5:1 (WebAIM Contrast Checker).

## Layout
- **Alignment:** share edges. One left edge beats five.
- **Space:** more space between groups than inside them.
- **Responsive:** same content at every width, arranged differently. 390 = one column plus a menu
  button, 768 = two columns, 1440 = three columns plus the full menu.

## Affordances & States
- Discoverability (can people find what they can do?) and understanding (do they know how it works?).
  "A UI is like a joke. If you have to explain it, it's not that good."
- The shape communicates use: a button looks pressable.
- Control states: rest, hover, focus (keyboard ring), pressed, selected, disabled.
  In Tailwind: `hover:` `focus-visible:` `active:` `aria-pressed:`/`aria-selected:` `disabled:`.
- UI states: empty (says the status, teaches, offers the first move), loading, error (with Try again), success.
- Keyboard: Tab must move a visible focus ring through every control.

## Vocabulary (name things precisely)
Hero, card, primary/secondary button, menu (≡) / more (⋮), segmented control, switch/toggle,
checkbox, radio, filter chip/tag, toast/snackbar (goes away), banner (stays until dismissed), badge,
skeleton screen, tooltip, modal dialog + scrim, accordion, empty state, detail panel, navbar,
sticky header, gutter, type scale, leading, tracking, weight.

## Directing Changes
- A good note says: the element (scope) + direction + amount (a little / noticeably / dramatically) +
  quality + **why** + what to keep. Example: "Make the hours block noticeably bigger and bolder.
  First-time visitors look for hours first. Keep the layout and colors as they are."
- Feedback ladder: gut reaction < direction < critical thinking ("If people open this right after X,
  why is Y the hardest thing to find?").
- When stuck, ask for several directions and choose. Explore, then reduce.
