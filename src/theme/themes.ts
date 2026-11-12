export type ThemeId = 'village' | 'city' | 'space' | 'lamp' | 'beach' | 'party' | 'fun' | 'night';

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  blurb: string;
  /** A world is a theme with the game layer on: buildings, roads, ranks (see src/game) */
  world?: boolean;
  /** Preview colours for the picker tile: canvas, card, accent, text */
  preview: { canvas: string; card: string; accent: string; text: string };
}

export const THEMES: ThemeInfo[] = [
  {
    id: 'village',
    name: 'Village',
    blurb: 'Huts, paths, windmills',
    world: true,
    preview: { canvas: '#8BC46A', card: '#FFF8E7', accent: '#D9562B', text: '#3B2A20' },
  },
  {
    id: 'city',
    name: 'City',
    blurb: 'Roads and towers',
    world: true,
    preview: { canvas: '#D5DBE1', card: '#FFFFFF', accent: '#2F6BFF', text: '#1F2430' },
  },
  {
    id: 'space',
    name: 'Outer space',
    blurb: 'Planets and star lanes',
    world: true,
    preview: { canvas: 'linear-gradient(135deg,#2A1B5C,#0B1026 60%)', card: '#141B3A', accent: '#6EE7F9', text: '#E6ECFF' },
  },
  {
    id: 'lamp',
    name: 'Lamplight',
    blurb: 'Warm and calm',
    preview: { canvas: '#F4EEE4', card: '#FFFCF6', accent: '#B9766E', text: '#2A1F1A' },
  },
  {
    id: 'beach',
    name: 'Beach day',
    blurb: 'Sea air and sand',
    preview: { canvas: 'linear-gradient(180deg,#BDE8F2,#FBF1DC 70%)', card: '#FFFFFF', accent: '#FF7A59', text: '#1F3A44' },
  },
  {
    id: 'party',
    name: 'Afterhours',
    blurb: 'Neon and bass',
    preview: { canvas: 'linear-gradient(135deg,#3A0B4F,#0A0614 55%,#0B2A44)', card: '#150E2B', accent: '#FF3DC8', text: '#F4EEFF' },
  },
  {
    id: 'fun',
    name: 'Playground',
    blurb: 'Loud and playful',
    preview: { canvas: '#FFF7E8', card: '#FFE680', accent: '#5B5BFF', text: '#1D1D1F' },
  },
  {
    id: 'night',
    name: 'Midnight',
    blurb: 'Quiet and dark',
    preview: { canvas: '#12151C', card: '#1A1E28', accent: '#8FB4FF', text: '#DDE1EA' },
  },
];

export function applyTheme(id: ThemeId) {
  const root = document.documentElement;
  root.dataset.theme = id;
  if (THEMES.find((t) => t.id === id)?.world) root.dataset.world = id;
  else delete root.dataset.world;
}
