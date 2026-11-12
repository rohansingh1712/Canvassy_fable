/**
 * The game layer. A "world" is a theme where the board is a place you build:
 * notes are buildings that grow as you write, connections are roads, and the
 * whole board earns a rank as it fills out.
 */

export type WorldId = 'village' | 'city' | 'space';

export interface World {
  id: WorldId;
  /** What a note is called at each growth level (see LEVEL_AT) */
  levels: string[];
  /** What the whole board is called at each rank (see RANK_AT) */
  ranks: string[];
  nouns: { notes: string; links: string; words: string; link: string };
  /** Particle colours for dust, sparks and confetti */
  dust: string[];
  empty: [string, string];
}

/** Words needed for a note to reach each level */
export const LEVEL_AT = [0, 1, 25, 80, 200];
/** Score needed for the board to reach each rank. Score = words + 10 per note + 10 per connection. */
export const RANK_AT = [0, 60, 200, 500, 1200, 3000];

export const WORLDS: Record<WorldId, World> = {
  village: {
    id: 'village',
    levels: ['Empty plot', 'Camp', 'Hut', 'Cottage', 'Windmill farm'],
    ranks: ['Clearing', 'Camp', 'Hamlet', 'Village', 'Town', 'Kingdom'],
    nouns: { notes: 'Homes', links: 'Paths', words: 'Villagers', link: 'path' },
    dust: ['#E8D8B0', '#C9A66B', '#FFFFFF', '#FFD166'],
    empty: ['Unclaimed land', 'Double-click anywhere to stake your first plot.'],
  },
  city: {
    id: 'city',
    levels: ['Empty lot', 'Kiosk', 'Shop', 'Apartments', 'Skyscraper'],
    ranks: ['Empty lot', 'Block', 'Neighbourhood', 'District', 'City', 'Metropolis'],
    nouns: { notes: 'Buildings', links: 'Roads', words: 'Residents', link: 'road' },
    dust: ['#C9CED6', '#F2C14E', '#FFFFFF', '#5FA8D3'],
    empty: ['Nothing built yet', 'Double-click anywhere to break ground.'],
  },
  space: {
    id: 'space',
    levels: ['Beacon', 'Asteroid base', 'Moon', 'Planet', 'Ringed world'],
    ranks: ['Drifting rock', 'Outpost', 'Colony', 'System', 'Sector', 'Galaxy'],
    nouns: { notes: 'Worlds', links: 'Lanes', words: 'Crew', link: 'lane' },
    dust: ['#6EE7F9', '#FFFFFF', '#9D8DF1', '#FFD6A5'],
    empty: ['Empty space', 'Double-click anywhere to launch your first beacon.'],
  },
};

export const worldOf = (theme: string): World | null => WORLDS[theme as WorldId] ?? null;

export function levelOf(words: number) {
  let level = 0;
  for (let i = 0; i < LEVEL_AT.length; i++) if (words >= LEVEL_AT[i]) level = i;
  const next = LEVEL_AT[level + 1] ?? null;
  const from = LEVEL_AT[level];
  return { level, next, progress: next ? (words - from) / (next - from) : 1 };
}

export function rankOf(score: number) {
  let index = 0;
  for (let i = 0; i < RANK_AT.length; i++) if (score >= RANK_AT[i]) index = i;
  const next = RANK_AT[index + 1] ?? null;
  const from = RANK_AT[index];
  return { index, next, progress: next ? (score - from) / (next - from) : 1 };
}
