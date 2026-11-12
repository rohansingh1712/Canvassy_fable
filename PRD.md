# Product requirements document (PRD)

**Product name:** Canvassy *(working title)*
**Status:** Personal prototype
**Last updated:** November 11, 2026

---

## Overview

Canvassy is a canvas-style note-taking web app that lets users think and write spatially. Users create notes in cards, arrange them freely on an infinite canvas, and connect them with arrows to map relationships between ideas. It also provides a focused writing experience inside individual cards—supporting both the messy, exploratory phase of thinking and the deeper, focused phase of writing.

## Problem statement

Writing and thinking are non-linear, but most note apps force a linear, hierarchical structure. Canvas tools (Miro, FigJam) are built for diagrams, not writing; note apps (Notion, Obsidian) are strong for writing but weak for spatial thinking. Canvassy bridges both.

## Target user

Personal use, single user, no collaboration. Someone who thinks non-linearly and wants spatial organization plus focused writing.

## Guiding principle

The app has to be enjoyable enough to reach for. That means standard gestures, no dead ends, nothing that blocks writing, and everything undoable.

---

## Features

### Canvas
- Infinite canvas (React Flow) with a dot grid
- Scroll to pan, pinch or ⌘-scroll to zoom, drag empty canvas to pan
- Shift-drag to select several cards; ⌫ deletes the selection
- View position and zoom persist across reloads
- Empty-state hint when there are no notes

### Notes (cards)
- Create by double-clicking the canvas, pressing **N**, or the dock's + button; the new note takes the cursor immediately
- Drag from anywhere on the card to move it; click to edit in place (Markdown via TipTap)
- Delete is instant with an Undo toast—no confirmation
- Word count shown on hover; amber past 500 words as a soft nudge (no hard limit)
- Global card width setting (narrow / medium / wide)

### Connections
- Drag from a handle onto another card to connect
- Drop the line on empty canvas to create a new, linked note
- Lines choose the facing sides of both cards automatically and re-route when cards move
- Select a line for a toolbar: line style, direction, label, delete; double-click to label

### Summaries
- A line starting with `@summary` becomes the note's title in summary view; otherwise the first line of text is used
- Summary view via the dock or **S** (toggle mode), or automatically below 60% zoom (zoom mode, in settings)

### Focus mode
- Full-screen single-note editor, opened from the card or with **⌘↵**; **Esc** returns to the canvas
- Same typography as the card, scaled up

### Worlds (the game layer)
Three themes turn the board into a place you build: **Village**, **City**, and **Outer space**. The note-taking is unchanged; every action just has a visible consequence in the world.

| You do | In the world |
|---|---|
| Create a note | Stake a plot: an empty lot, signpost, or beacon appears with a puff of dust |
| Write | Each new word adds a resident (+1) and a hammer taps away. The note's building upgrades at 1, 25, 80, and 200 words (for example plot → camp → hut → cottage → windmill farm) |
| Connect notes | A road, path, or star lane is laid between them, and villagers, cars, or ships start travelling it in the direction of the arrow |
| Move a note | It lifts, then lands with a thud and dust |
| Delete a note | Demolition burst (still undoable) |
| Grow the board | Score = words + 10 per note + 10 per connection. The board ranks up through six names (Clearing → Camp → Hamlet → Village → Town → Kingdom, and equivalents) with a banner and fireworks |

- A scoreboard (top left) shows the current rank, progress to the next, and counts of buildings, roads, and residents
- Hover or edit a note to see its building name and progress to the next upgrade
- Summary view doubles as a map view: notes collapse to a title under their building
- Sounds are synthesised chiptune blips (each new word plays the next note of a scale); toggle with the speaker button in the scoreboard
- Nothing is gated: ranks and levels are feedback, never requirements

### Vibes (themes)
- Five non-game themes that change colour, fonts, shapes, and backdrop: Lamplight, Beach day, Afterhours, Playground, Midnight
- Each vibe has its own level of motion, from still (Lamplight, Midnight) through gentle (Beach day) and lively (Playground) to loud (Afterhours)
- The backdrop reacts while you drag or pan, and in Afterhours to typing
- Picker in the dock; **T** cycles; choice persists
- See DESIGN.md for tokens and how to add one

### Undo and redo
- **⌘Z** / **⇧⌘Z** and dock buttons
- Covers creating, deleting, moving, and connecting notes, connection edits, and text edits (one step per editing session)
- History is per session (not persisted)

### Export
- PNG and PDF of the board (html2canvas + jsPDF)

### Persistence
- Notes, connections, view, and settings in localStorage; writes are debounced and flushed on unload

### Keyboard shortcuts
| Action | Keys |
|---|---|
| New note | N |
| Delete selection | ⌫ |
| Undo / redo | ⌘Z / ⇧⌘Z |
| Focus mode | ⌘↵ in a note |
| Stop editing | Esc |
| Summaries | S |
| Next world or vibe | T |
| Fit everything / 100% | 1 / 0 |
| Shortcut list | ? |

---

## Out of scope

- Multiple canvases
- Collaboration
- AI-generated summaries
- Mobile

## Ideas for later

- Search across notes
- Per-card colour or size
- Duplicate and copy/paste cards
- Tidy-up / auto-layout
- Multiple boards

---

## Technical notes

**Stack:** React 18, TypeScript, Vite, React Flow 11, Zustand, TipTap 3 (+ tiptap-markdown), lucide-react.

```
src/
  components/
    Canvas/       Canvas.tsx — React Flow setup, gestures, keyboard shortcuts
    Card/         Card.tsx — note card with inline editor and summary view
    CardEditor/   CardEditor.tsx — focus mode
    Connection/   Connection.tsx — self-routing arrows, label, toolbar
    Backdrop/     Backdrop.tsx — animated layers behind the canvas, per vibe
    Dock/         Dock.tsx (toolbar, vibe picker, shortcuts), Toast.tsx
    Export/       Export.tsx — PNG/PDF
    Settings/     SettingsPanel.tsx — arrow size, card width, summary mode
  game/
    worlds.ts     world definitions, level and rank thresholds
    sprites.tsx   procedural pixel art: buildings, travellers, terrain tiles
    World.tsx     terrain layer and scoreboard (HUD)
    game.ts       what each action triggers; fx.ts particles; sfx.ts sounds
    game.css      all world-only styling
  store/
    canvasStore.ts    notes, connections, undo history, persistence
    settingsStore.ts  settings and current theme
  theme/
    tokens.css    design tokens and theme definitions
    prose.css     shared writing typography
    motion.css    per-vibe motion on notes, arrows, and the dock
    themes.ts     theme list for the picker
  utils/          markdown, word count, @summary highlighting
```

| Concern | Where |
|---|---|
| Game rules (levels, ranks, names) | `game/worlds.ts` |
| Pixel art | `game/sprites.tsx` |
| Vibes, colours, fonts | `theme/tokens.css`, `theme/themes.ts` |
| Writing typography | `theme/prose.css` |
| Gestures and shortcuts | `components/Canvas/Canvas.tsx` |
| Card behaviour | `components/Card/` |
| Arrows | `components/Connection/` |
| Undo, saving | `store/canvasStore.ts` |
