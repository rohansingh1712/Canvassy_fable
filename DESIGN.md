# Design guidelines

**Product:** Canvassy
**Last updated:** November 11, 2026

---

## Design philosophy

The canvas is for thinking, so the UI recedes and the ideas come forward. Every interaction should work the way your hands already expect from other canvas tools: scroll pans, pinch zooms, drag moves, click edits, ⌘Z undoes. Nothing asks "are you sure?"—destructive actions are instant and undoable.

The mood is yours to pick. Canvassy ships with five vibes that change colour, type, shape, and backdrop together, so the same board can feel like a quiet desk or a dance floor.

---

## Themes (vibes)

All visual values are CSS variables in `src/theme/tokens.css`. A vibe is a block of overrides keyed on `<html data-theme="…">`; the list shown in the picker lives in `src/theme/themes.ts`. No hard-coded colours or fonts anywhere else.

| ID | Name | Feel | Writing / heading fonts |
|---|---|---|---|
| `lamp` | Lamplight (default) | Warm parchment, dusty rose accent | Newsreader / Newsreader |
| `beach` | Beach day | Sky-to-sand gradient, coral and sea-glass | DM Sans / Fraunces |
| `party` | Afterhours | Near-black with drifting neon glows, gradient headlines | Space Grotesk |
| `fun` | Playground | Sticker colours, 2px outlines, hard offset shadows, tinted cards | DM Sans / Bricolage Grotesque |
| `night` | Midnight | Low-contrast dark for long sessions | Newsreader / Newsreader |

Switch with the palette button in the dock or press **T** to cycle. The choice persists.

### Token groups

- **Canvas:** `--canvas-bg`, `--canvas-image` (backdrop gradient), `--canvas-dot`
- **Surfaces:** `--card-bg`, `--card-border`, `--surface`, `--surface-2`, `--border`, `--border-w`
- **Text:** `--text`, `--text-2`, `--text-3`
- **Accent and status:** `--accent`, `--accent-strong`, `--accent-soft`, `--accent-contrast`, `--edge`, `--danger`, `--warn`, `--selection`
- **Depth and shape:** `--shadow-card`, `--shadow-hover`, `--shadow-lift`, `--shadow-pop`, `--radius-card`, `--radius-ui`
- **Type:** `--font-writing`, `--font-heading`, `--font-ui`, `--font-mono`, `--heading-weight`, `--heading-tracking`, `--writing-size`, `--writing-leading`
- **Optional:** `--tint-0` … `--tint-3` colour cards by ID (Playground only)

To add a vibe, add a `[data-theme='x']` block and an entry in `themes.ts`. Avoid `color-mix()` and other newer colour functions—the PNG/PDF export (html2canvas) can't parse them.

---

## Worlds

Village, City, and Outer space are themes with a game layer (`src/game/`). They set `<html data-world>` as well as `data-theme`; everything world-only is styled in `game.css` under `[data-world]`.

- **Look:** pixel art drawn procedurally as rectangles on a small grid (no image files), Pixelify Sans for headings and game UI, 3px borders, hard shadows. Body text stays DM Sans so notes remain easy to read.
- **Ground:** repeating terrain tiles pan and zoom with the notes (grass, trees and ponds; paving and parks; star fields at three parallax depths). Clouds or shooting stars drift over the top.
- **Buildings:** each note has a sprite standing on its top-left edge. It has five levels driven by word count and one of four colour variants from the note's ID. It pops in when it changes.
- **Roads:** a connection gets a wide bed under the line that draws itself in when created. Travellers (villagers, cars, ships) follow the path using SVG `animateMotion`.
- **Feedback rules:** every action gets a response within a frame (particles, a floating label, a sound), but nothing covers or moves the text being written. Effects are short (under 1s) apart from the rank-up banner (3.4s).
- **Adding a world:** add an entry in `worlds.ts`, drawing functions and terrain in `sprites.tsx`, tokens in `tokens.css`, road colours in `game.css`, and a tile in `themes.ts`.

---

## Typography

One shared stylesheet, `src/theme/prose.css`, styles writing in both the card and focus mode, so text looks the same in each (focus mode only scales it up).

- Body: `--writing-size` (16–16.5px in cards, 18–19px in focus mode), line height 1.6
- Headings: 1.6em / 1.28em / 1.08em, line height 1.2, balanced wrapping
- Block spacing: 0.7em between blocks, 1.15em above headings
- UI text: 11–13px, `--font-ui`, tabular numbers for counts
- Display text uses sentence case

---

## Icons

All icons come from `lucide-react` at 13–18px with the default 2px stroke. No emoji in the UI.

---

## Cards

- Plain paper surface, no header bar. A grip and two actions (focus mode, delete) fade in at the top on hover.
- **Drag anywhere** on a card to move it. **Click** to place the cursor and edit; while editing, the text area behaves like text (select, drag-select) and the card can still be moved by its top strip and padding.
- Selected or editing: accent border. Dragging: lifted shadow, slight scale.
- Word count sits in the bottom-right corner, visible on hover or while editing. Past 500 words it turns amber as a nudge—it never blocks typing.
- Connection handles: four accent dots on the card edges, visible on hover and on every card while a line is being drawn.
- Summary view: the card collapses to its `@summary` line, or its first line of text if it has none.

---

## Connections

- Lines attach to whichever sides of the two cards face each other and re-route as cards move.
- Drag from a handle onto any part of another card to connect. Drop on empty canvas to create a new linked card there.
- Click a line to select it: a small toolbar appears with line style (cycles solid/dashed/dotted), direction (cycles →, ↔, ←, —), label, and delete. Double-click a line to label it directly.
- Hover and selected states use the accent colour.

---

## Canvas and chrome

- Dot grid over a themed backdrop. Scroll to pan, pinch or ⌘-scroll to zoom, drag empty canvas to pan, Shift-drag to marquee-select.
- The view (position and zoom) is restored on reload.
- **Dock (bottom centre):** new note, summaries toggle, vibe picker, export, settings, shortcuts.
- **Corner (bottom left):** undo, redo, zoom out, zoom level (click to reset), zoom in, fit everything.
- **Toast:** confirms deletes with an Undo button for five seconds.
- **Focus mode:** full-screen, single column (680px), word count and a "Back to canvas" button. Grows out of the card it was opened from.

---

## Motion

Motion is part of what a vibe is. The five vibes sit on a scale from still to loud; the three worlds add game feedback on top:

| Vibe | Level | What moves |
|---|---|---|
| Lamplight | Still | Nothing ambient |
| Midnight | Still | Nothing ambient |
| Beach day | Gentle | Three layers of tide roll in and out at the top, the sun glow breathes, beads drift along arrows |
| Playground | Lively | Confetti shapes drift and spin behind the notes, notes pop in and tilt on hover, dock buttons spring, the + button wiggles |
| Village, City, Outer space | Game | Terrain pans with the board, travellers move along roads, buildings animate (smoke, windmill, blinking lights, orbiting moons), and every action triggers particles and sound |
| Afterhours | Loud | Sweeping stage lights, a hue-shifting aurora, a 120 bpm floor pulse, an equaliser along the bottom, notes glow on the beat, lights race along arrows, headlines shimmer |

**The canvas reacts to you.** While you drag a note or pan, the backdrop gets an `is-moving` class and each animated vibe answers: ripples wash across the sand (Beach day), the confetti jumps (Playground), the lights and equaliser surge (Afterhours). In Afterhours every keystroke also kicks the lights and equaliser.

Where it lives:
- `src/components/Backdrop/` — the ambient layers behind the canvas, one small component per animated vibe
- `src/theme/motion.css` — vibe motion on notes, arrows, and the dock

Rules:
- Animate only `transform` and `opacity` (plus `stroke-dashoffset` on arrows) so panning stays smooth.
- The note being edited holds still: no pulsing or tilting under the text you're writing.
- Everything ambient stops under `prefers-reduced-motion`.
- UI state changes stay quick in every vibe: 120–200ms for hover, 320ms for focus mode, 350ms cross-fade between vibes.

---

## What to avoid

- Confirmation dialogs—use undo instead
- Emoji as icons
- Hard-coded colours, fonts, or shadows outside `tokens.css`
- Anything that blocks typing
