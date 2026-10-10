# Site Brief

- **What it is:** an interactive findings explorer for *Uncovering Latent Structure in ESA Satellite
  Telemetry* (Rhea Madhogarhia & Hewitt Watkins, TTIC 31220, Spring 2026). It's not the paper ported
  to HTML; it's the finding, made explorable.
- **Who it's for:**
  1. **ML recruiters / engineers:** ~2 minutes; want to grasp the problem, the rigor, and Hewitt's range fast.
  2. **Research peers:** want to compare methods across missions and inspect the evidence.
- **What they see first:** the one-sentence finding. ESA telemetry has real latent structure at
  the operational-group level (18–29 modes), not the subsystem level (4–5), and that multi-modality
  is why global detectors fail.
- **Then:** compare five method families across Mission 1 / Mission 2, then drill into one method.
- **Primary action (gets the accent):** TBD, e.g. "Explore the latent map" or "Read the paper".
- **Interactions (≥2, faked/static):** mission toggle (M1/M2) · method filter chips · sort by PR-AUC ·
  method detail panel · explorable latent/t-SNE map · scrubbable anomaly timeline.
- **Figures:** all redrawn as new, animated figures from exported data, not the old matplotlib PNGs.
- **Route:** `/telemetry` (working name)
- **Content source:** `content/` (report transcription, `results.json`, `figures-data/`).
  Report Table 1 is the source of truth; `RESULTS_SUMMARY.md` in the old repo has stale numbers.
- **Credit:** Rhea Madhogarhia is co-author. Credit her clearly; she implemented the K-Means / PCA /
  KPCA baselines, and Hewitt implemented GMM + VAEs.

## Direction
Very modern and clean: SpaceX, Apple. Incredible motion, all-new figures, precise, confident, restrained.

## Styles
| Style | Mood words | Why it might fit | Mood board | Design system |
|---|---|---|---|---|
| | | | `/mood-boards/` | `/design-systems/` |
| | | | `/mood-boards/` | `/design-systems/` |
| | | | `/mood-boards/` | `/design-systems/` |

**Picked:** _TBD_, and why (this goes on the hub too).
