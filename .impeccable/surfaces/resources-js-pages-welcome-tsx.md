---
version: 1
slug: "resources-js-pages-welcome-tsx"
primary_target: "resources/js/pages/welcome.tsx"
related_targets: []
---

## Scope

`resources/js/pages/welcome.tsx` (route `/`), always dark. Mode: Persuade. Build path: code-first (no image generation).

## Audience, job, action

- Car owners, on a phone, often from social media: believe GTECH makes cars measurably quicker, then send the contact form with topic Workshop (`#contact`).
- Tuners, on a desktop: see that the file service is real, then register.

## Proof and content

Dragy runs, stock vs tuned (100–200 km/h; 1/4 mile ET + trap), each with a proof link. Phase 1 renders the typed sample fixture `resources/js/data/sample-dragy-runs.ts` with the footnote "Sample data — not real runs"; task 2.3 swaps in live data. No photos, no testimonials.

## Constraints

- 0 runs: hero collapses to one column, board not rendered. Run without a stock time: tuned time, no Δ, never featured. One-metric runs appear only under that tab. 0 to ~100 runs in one prop. Long vehicle names wrap.
- Landmarks, `chalk` focus rings, bars `aria-hidden`, Δ as sign plus text, 44px tap targets, every field labelled with an error.

## Direction contract

THESIS: The homepage is a timing slip: the first viewport is a real Dragy run, stock vs tuned, with the delta at huge scale. It refuses the car-photo hero, "Unleash your potential", icon cards and testimonials.

OWN-WORLD: Warm asphalt ground, raised panels and hairlines, chalk text; logo red committed to delta figures, tuned lanes and the full-bleed contact field. Saira 800 italic uppercase display, Martian Mono timings and kickers. Square corners; the logo's −12° slant only on primary buttons, stage badges, lane ends and one rule. No glows, gradients, glass or clip-path.

STORY: The visitor watches stock and tuned race, reads the Δ, scans recorded runs with proof, picks a door (workshop or file service), then books or registers.

FIRST VIEWPORT: Header with logo, nav, "Tuner login", red "Book your car". Left 7 columns: kicker, headline, subline, CTAs to `#contact` and register. Right 5 columns: the Timeslip panel, whose lanes fill at real time × 0.35 so GTECH finishes first and the red Δ lands last (reduced motion: final state). This race replay is the only orchestrated motion.

FORM: Owner-pinned direction "Proven on the clock" (ClickUp context doc); the pin beats the roll, so assigned candidate 4 was not built. Seed key fd6e7c16.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved decisions

- Headline and all copy are DRAFT until owner approval (task 3.2).
- SVG logo master (3.1). The raster wordmark reads "CALIBRATIONS" while the confirmed name is "GTECH Calibration".
- Workshop address; privacy notice under the form; Register CTA vs contact form (topic File service) while no portal exists.
