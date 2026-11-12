import { memo } from 'react';
import { WorldId } from './worlds';

/**
 * Pixel art, drawn procedurally: every sprite is a list of rectangles on a small grid.
 * Rectangles can carry a class (`k`) for the tiny animations in game.css (blink, smoke, spin, orbit).
 */

interface Px {
  x: number;
  y: number;
  w: number;
  h: number;
  c: string;
  k?: string;
  o?: string;
}

class Pen {
  list: Px[] = [];
  r(x: number, y: number, w: number, h: number, c: string, k?: string, o?: string) {
    this.list.push({ x, y, w, h, c, k, o });
    return this;
  }
  /** Stepped triangle whose base row sits at y */
  roof(x: number, y: number, w: number, c: string) {
    for (let i = 0; w - 2 * i > 0; i++) this.r(x + i, y - i, w - 2 * i, 1, c);
    return this;
  }
  row(cx: number, cy: number, rad: number, dy: number, c: string) {
    const hw = Math.floor(Math.sqrt((rad + 0.5) ** 2 - dy * dy));
    return this.r(cx - hw, cy + dy, 2 * hw + 1, 1, c);
  }
  disc(cx: number, cy: number, rad: number, c: string) {
    for (let dy = -rad; dy <= rad; dy++) this.row(cx, cy, rad, dy, c);
    return this;
  }
}

const rects = (list: Px[]) =>
  list.map((p, i) => (
    <rect
      key={i}
      x={p.x}
      y={p.y}
      width={p.w}
      height={p.h}
      fill={p.c}
      className={p.k}
      style={p.o ? { transformOrigin: p.o } : undefined}
    />
  ));

/* ---------- Buildings: a 24 × 30 grid, ground at y = 30 ---------- */

const WOOD = '#8A5A3C';
const DARK = '#4A2F22';
const CREAM = '#F6E7C6';
const SKY = '#8FD3F4';
const LIT = '#FFE08A';
const INK = '#2B3140';
const STEEL = '#B8C0CC';
const SHADE = 'rgba(0,0,0,0.16)';
const SHINE = 'rgba(255,255,255,0.3)';

const VARIANTS: Record<WorldId, string[]> = {
  village: ['#D9562B', '#3D7EA6', '#8E5BB5', '#E0A030'],
  city: ['#EF6F6C', '#F2C14E', '#5FA8D3', '#8E7DBE'],
  space: ['#F28482', '#5EC4B6', '#F6BD60', '#9D8DF1'],
};

function village(level: number, v: string): Px[] {
  const p = new Pen();
  if (level === 0) {
    p.r(4, 28, 16, 2, WOOD).r(6, 27, 12, 1, '#A06A45');
    p.r(4, 23, 1, 5, DARK).r(19, 23, 1, 5, DARK).r(5, 25, 14, 1, '#E8D8B0');
    p.r(11, 20, 2, 8, DARK).r(6, 13, 12, 8, DARK).r(7, 14, 10, 6, CREAM);
    p.r(9, 16, 6, 1, WOOD).r(9, 18, 4, 1, WOOD);
  } else if (level === 1) {
    p.r(11, 17, 1, 5, DARK).r(12, 17, 4, 2, CREAM);
    p.roof(3, 29, 16, v).roof(8, 29, 6, DARK).r(3, 29, 16, 1, SHADE);
    p.r(19, 29, 5, 1, DARK).r(20, 28, 3, 1, '#FF7A1A', 'px-flicker').r(21, 26, 1, 2, '#FFB703').r(20, 27, 3, 1, '#FFB703');
    p.r(21, 23, 1, 1, '#FFFFFF', 'px-smoke');
  } else if (level === 2) {
    p.r(6, 21, 12, 9, CREAM).r(6, 29, 12, 1, '#D8C49A');
    p.roof(4, 21, 16, v).r(4, 22, 16, 1, DARK);
    p.r(9, 25, 3, 5, WOOD).r(14, 24, 3, 3, SKY).r(14, 25, 3, 1, DARK);
    p.r(3, 29, 2, 1, '#5E9E4A').r(19, 29, 2, 1, '#5E9E4A');
  } else if (level === 3) {
    p.r(16, 9, 3, 7, WOOD).r(16, 9, 3, 1, DARK);
    p.r(17, 6, 2, 2, '#FFFFFF', 'px-smoke').r(18, 3, 2, 2, '#FFFFFF', 'px-smoke px-late');
    p.r(3, 20, 18, 10, CREAM).r(3, 29, 18, 1, '#D8C49A');
    p.roof(1, 20, 22, v).r(1, 21, 22, 1, DARK);
    p.r(10, 24, 4, 6, WOOD).r(13, 27, 1, 1, LIT);
    p.r(5, 23, 3, 3, SKY).r(16, 23, 3, 3, LIT).r(5, 24, 3, 1, DARK).r(16, 24, 3, 1, DARK);
    p.r(1, 29, 1, 1, '#FF6B6B').r(22, 29, 1, 1, LIT).r(2, 28, 1, 2, '#5E9E4A');
  } else {
    // House on the left, windmill on the right
    p.r(1, 23, 9, 7, CREAM).roof(0, 23, 11, v).r(4, 26, 2, 4, WOOD).r(7, 25, 2, 2, SKY);
    p.r(12, 14, 9, 16, CREAM).r(13, 10, 7, 4, CREAM).r(19, 14, 2, 16, SHADE).r(18, 10, 2, 4, SHADE);
    p.roof(12, 9, 9, v).r(15, 25, 3, 5, WOOD).r(15, 18, 3, 3, SKY).r(15, 19, 3, 1, DARK);
    const o = '16.5px 11.5px';
    p.r(16, 0, 1, 23, DARK, 'px-spin', o).r(5, 11, 23, 1, DARK, 'px-spin', o);
    p.r(17, 1, 3, 7, '#FFFFFF', 'px-spin', o).r(13, 15, 3, 7, '#FFFFFF', 'px-spin', o);
    p.r(20, 12, 7, 3, '#FFFFFF', 'px-spin', o).r(6, 8, 7, 3, '#FFFFFF', 'px-spin', o);
    p.r(15, 10, 3, 3, DARK);
  }
  return p.list;
}

function city(level: number, v: string): Px[] {
  const p = new Pen();
  if (level === 0) {
    p.r(2, 28, 20, 2, '#9AA3AD');
    p.r(3, 21, 1, 7, INK).r(20, 21, 1, 7, INK).r(3, 22, 18, 3, '#F2C14E');
    for (let i = 0; i < 5; i++) p.r(4 + i * 4, 22, 2, 3, INK);
    p.roof(10, 27, 4, '#FF7A1A').r(11, 24, 2, 2, '#FF7A1A').r(11, 25, 2, 1, '#FFFFFF').r(9, 28, 6, 1, '#FF7A1A');
  } else if (level === 1) {
    p.r(8, 12, 8, 5, INK).r(9, 13, 6, 3, LIT, 'px-blink px-slow').r(11, 17, 2, 2, INK);
    p.r(6, 22, 12, 8, '#F4F1EA').r(7, 23, 10, 3, INK).r(5, 26, 14, 1, STEEL);
    p.r(4, 19, 16, 3, v).r(4, 22, 16, 1, SHADE);
    for (let i = 0; i < 4; i++) p.r(6 + i * 4, 19, 2, 3, '#FFFFFF');
  } else if (level === 2) {
    p.r(4, 13, 16, 17, v).r(18, 13, 2, 17, SHADE).r(3, 12, 18, 2, INK);
    p.r(6, 16, 4, 4, SKY).r(13, 16, 4, 4, LIT).r(6, 18, 4, 1, INK).r(13, 18, 4, 1, INK);
    p.r(6, 24, 7, 4, SKY).r(6, 24, 7, 1, SHINE).r(15, 24, 3, 6, INK).r(17, 27, 1, 1, LIT);
    p.r(3, 21, 18, 2, '#FFFFFF');
    for (let i = 0; i < 5; i++) p.r(3 + i * 4, 21, 2, 2, INK);
  } else if (level === 3) {
    p.r(13, 0, 5, 4, WOOD).r(13, 0, 5, 1, DARK).r(14, 4, 1, 1, INK).r(16, 4, 1, 1, INK);
    p.r(5, 6, 14, 24, v).r(17, 6, 2, 24, SHADE).r(4, 5, 16, 1, INK);
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 3; col++)
        p.r(7 + col * 4, 8 + row * 4, 2, 3, (row * 3 + col) % 4 === 1 ? LIT : SKY);
    p.r(10, 27, 4, 3, INK).r(9, 26, 6, 1, '#FFFFFF');
  } else {
    p.r(12, -5, 1, 5, INK).r(12, -6, 1, 1, '#FF3B3B', 'px-blink');
    p.r(9, 0, 6, 3, v).r(6, 3, 12, 27, v).r(16, 3, 2, 27, SHADE).r(6, 3, 12, 1, SHINE);
    for (let row = 0; row < 7; row++)
      for (let col = 0; col < 4; col++) {
        const lit = (row * 5 + col * 3) % 7 < 2;
        p.r(7 + col * 3, 5 + row * 3, 2, 2, lit ? LIT : SKY, lit && (row + col) % 3 === 0 ? 'px-blink px-slow' : undefined);
      }
    p.r(10, 27, 4, 3, INK).r(4, 29, 16, 1, '#9AA3AD');
  }
  return p.list;
}

function space(level: number, v: string): Px[] {
  const p = new Pen();
  if (level === 0) {
    p.r(12, 12, 1, 5, STEEL).r(12, 11, 1, 1, '#FF5D5D', 'px-blink');
    p.r(10, 17, 5, 5, STEEL).r(11, 18, 3, 2, '#6EE7F9').r(13, 17, 2, 5, SHADE);
    p.r(3, 18, 6, 3, '#4F7CFF').r(16, 18, 6, 3, '#4F7CFF').r(9, 19, 1, 1, STEEL).r(15, 19, 1, 1, STEEL);
    p.r(5, 18, 1, 3, INK).r(18, 18, 1, 3, INK);
  } else if (level === 1) {
    p.disc(12, 22, 6, '#7D7F8C').row(12, 22, 6, 5, '#5E606B').row(12, 22, 6, 6, '#5E606B');
    p.r(8, 21, 2, 1, '#5E606B').r(14, 24, 3, 1, '#5E606B').r(7, 18, 3, 1, SHINE);
    p.r(10, 13, 5, 1, '#6EE7F9').r(9, 14, 7, 2, '#6EE7F9').r(10, 14, 2, 1, '#FFFFFF').r(8, 16, 9, 1, STEEL);
    p.r(17, 12, 1, 4, STEEL).r(17, 11, 1, 1, '#FF5D5D', 'px-blink');
  } else if (level === 2) {
    p.disc(12, 18, 8, '#CFD3DC');
    for (const dy of [5, 6, 7, 8]) p.row(12, 18, 8, dy, '#AEB3C0');
    // Craters take the note's colour so moons aren't all alike
    p.r(7, 14, 3, 2, v).r(14, 19, 3, 2, v).r(10, 21, 2, 1, v).r(15, 13, 2, 1, v).r(11, 16, 2, 1, v);
    p.r(7, 12, 3, 1, '#FFFFFF').r(6, 13, 1, 2, '#FFFFFF');
  } else {
    const ring = '#F6E7B0';
    if (level === 4) p.r(-2, 15, 28, 1, ring);
    p.disc(12, 17, 9, v);
    for (const dy of [-4, 1, 2]) p.row(12, 17, 9, dy, SHINE);
    for (const dy of [5, 6, 7, 8, 9]) p.row(12, 17, 9, dy, SHADE);
    p.r(7, 10, 3, 1, '#FFFFFF').r(5, 12, 1, 2, '#FFFFFF');
    if (level === 4) p.r(-3, 16, 2, 2, ring).r(25, 16, 2, 2, ring).r(-2, 18, 28, 2, ring).r(0, 18, 24, 1, '#FFFFFF');
    p.r(24, 16, 2, 2, level === 4 ? '#6EE7F9' : '#FFFFFF', 'px-orbit', '12.5px 17.5px');
  }
  return p.list;
}

const DRAW = { village, city, space };
const cache = new Map<string, Px[]>();

export const Building = memo(function Building({ world, level, tint }: { world: WorldId; level: number; tint: number }) {
  const key = `${world}-${level}-${tint}`;
  let list = cache.get(key);
  if (!list) cache.set(key, (list = DRAW[world](level, VARIANTS[world][tint % 4])));
  return (
    <span className="building">
      <svg viewBox="0 0 24 30" width="72" height="90" aria-hidden>
        {rects(list)}
      </svg>
    </span>
  );
});

export function Hammer() {
  return (
    <svg className="plot-hammer" viewBox="0 0 7 10" width="21" height="30" aria-hidden>
      <rect x="0" y="0" width="7" height="3" fill="#8B93A1" />
      <rect x="0" y="0" width="2" height="3" fill="#5F6675" />
      <rect x="3" y="3" width="2" height="7" fill={WOOD} />
    </svg>
  );
}

/* ---------- Travellers: who moves along a connection ---------- */

const COATS = ['#D9562B', '#3D7EA6', '#8E5BB5', '#E0A030', '#5E9E4A'];
const PAINT = ['#EF6F6C', '#F2C14E', '#5FA8D3', '#FFFFFF', '#8E7DBE'];

function TravellerShape({ world, seed }: { world: WorldId; seed: number }) {
  if (world === 'village') {
    return (
      <g className="px-walk">
        <rect x="-3" y="-9" width="6" height="7" fill={COATS[seed % COATS.length]} />
        <rect x="-2" y="-14" width="4" height="5" fill="#F1C9A5" />
        <rect x="-2" y="-15" width="4" height="2" fill={DARK} />
        <rect x="-3" y="-2" width="2" height="3" fill={DARK} />
        <rect x="1" y="-2" width="2" height="3" fill={DARK} />
      </g>
    );
  }
  if (world === 'city') {
    return (
      <g transform="translate(0 4)">
        <rect x="-8" y="-4" width="16" height="8" rx="2" fill={PAINT[seed % PAINT.length]} />
        <rect x="1" y="-3" width="4" height="6" fill="#BFE6FF" />
        <rect x="-6" y="-3" width="3" height="6" fill="rgba(0,0,0,0.25)" />
        <rect x="7" y="-3" width="1" height="2" fill={LIT} />
        <rect x="7" y="1" width="1" height="2" fill={LIT} />
      </g>
    );
  }
  return (
    <g>
      <rect x="-12" y="-1.5" width="5" height="3" fill="#FFB347" className="px-flicker" />
      <polygon points="9,0 -7,-5 -4,0 -7,5" fill="#E6ECFF" />
      <rect x="-1" y="-1" width="4" height="2" fill="#6EE7F9" />
    </g>
  );
}

const SPEED: Record<WorldId, number> = { village: 28, city: 85, space: 60 };

/** Something that travels along a connection's path, forever. */
export function Traveller({
  world,
  path,
  length,
  reverse,
  seed,
}: {
  world: WorldId;
  path: string;
  length: number;
  reverse?: boolean;
  seed: number;
}) {
  // Rounded so the trip doesn't restart on every pixel of a drag
  const dur = Math.max(3, Math.round(length / SPEED[world]));
  const rotate = world === 'village' ? undefined : reverse ? 'auto-reverse' : 'auto';
  return (
    <g className="connection-traveller">
      <TravellerShape world={world} seed={seed} />
      <animateMotion
        dur={`${dur}s`}
        begin={`${-(seed % 7)}s`}
        repeatCount="indefinite"
        path={path}
        rotate={rotate}
        calcMode="linear"
        keyPoints={reverse ? '1;0' : '0;1'}
        keyTimes="0;1"
      />
    </g>
  );
}

/* ---------- Terrain: repeating tiles that pan with the canvas ---------- */

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tile(units: number, list: Px[]) {
  const body = list.map((p) => `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${p.c}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${units} ${units}" shape-rendering="crispEdges">${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function tree(p: Pen, x: number, y: number, rad = 5) {
  p.r(x - rad + 1, y + rad + 4, rad * 2 - 1, 2, 'rgba(0,0,0,0.14)').r(x - 1, y + rad - 1, 2, 6, '#7A5230');
  p.disc(x, y, rad, '#3F8F4F').disc(x - 1, y - 1, rad - 2, '#56A85F').r(x - 2, y - 3, 2, 1, '#7CC47A');
}

export interface TerrainLayer {
  image: string;
  /** Tile size in screen pixels at 100% zoom */
  size: number;
  /** 1 = moves with the notes; less = further away */
  depth: number;
  className?: string;
}

function buildTerrain(): Record<WorldId, TerrainLayer[]> {
  // Village: grass tufts and flowers, then trees, bushes, rocks and a pond
  let rnd = rng(7);
  const at = (units: number, pad = 3) => pad + Math.floor(rnd() * (units - pad * 2));
  const grass = new Pen();
  for (let i = 0; i < 36; i++) {
    const x = at(80), y = at(80);
    grass.r(x, y, 1, 2, '#74AD56').r(x + 2, y, 1, 2, '#74AD56').r(x + 1, y + 1, 1, 1, '#A5D884');
  }
  for (let i = 0; i < 8; i++) {
    const x = at(80), y = at(80), c = ['#FFFFFF', '#FFD166', '#FF8FAB'][i % 3];
    grass.r(x, y - 1, 1, 3, c).r(x - 1, y, 3, 1, c).r(x, y, 1, 1, '#F2A541');
  }
  const woods = new Pen();
  woods.disc(110, 40, 9, '#6EC3E8').disc(101, 43, 6, '#6EC3E8').r(104, 37, 6, 1, '#B5E4F7').r(98, 44, 3, 1, '#B5E4F7');
  tree(woods, 24, 22, 6);
  tree(woods, 36, 30);
  tree(woods, 70, 108, 6);
  tree(woods, 132, 96);
  tree(woods, 18, 124);
  for (let i = 0; i < 4; i++) {
    const x = at(150, 10), y = at(150, 10);
    woods.disc(x, y, 2, '#4C9A57').r(x - 1, y - 1, 1, 1, '#FF6B6B');
  }
  for (let i = 0; i < 4; i++) {
    const x = at(150, 10), y = at(150, 10);
    woods.r(x, y, 4, 3, '#A8ADB5').r(x + 1, y - 1, 2, 1, '#A8ADB5').r(x, y + 2, 4, 1, '#858B94');
  }

  // City: paving slabs, then parks, planters, crossings
  rnd = rng(21);
  const slabs = new Pen().r(0, 0, 48, 1, '#C5CCD4').r(0, 0, 1, 48, '#C5CCD4').r(0, 24, 48, 1, '#CDD4DB').r(24, 0, 1, 48, '#CDD4DB');
  for (let i = 0; i < 10; i++) slabs.r(at(48), at(48), 1, 1, '#BCC4CD');
  const blocks = new Pen();
  blocks.r(18, 28, 50, 32, '#7FB35F').r(19, 29, 48, 30, '#9CCB7A').r(40, 29, 4, 30, '#E3D9BF');
  tree(blocks, 28, 38);
  tree(blocks, 56, 44, 6);
  blocks.r(46, 52, 8, 2, WOOD);
  for (const [x, y] of [[110, 24], [130, 90], [36, 120], [96, 138]]) {
    blocks.disc(x, y, 6, '#8D96A3').disc(x, y, 4, '#3F8F4F').disc(x - 1, y - 1, 2, '#56A85F');
  }
  for (let i = 0; i < 6; i++) blocks.r(96 + i * 4, 60, 2, 10, '#F4F6F8');
  blocks.disc(140, 40, 2, '#AEB6C0').disc(70, 96, 2, '#AEB6C0');

  // Space: three depths of stars
  rnd = rng(99);
  const far = new Pen();
  for (let i = 0; i < 46; i++) far.r(at(120, 1), at(120, 1), 1, 1, `rgba(255,255,255,${(0.25 + rnd() * 0.6).toFixed(2)})`);
  const near = new Pen();
  for (let i = 0; i < 16; i++) {
    const x = at(180), y = at(180), c = ['#FFFFFF', '#A5F3FC', '#FFD6A5', '#D0BFFF'][i % 4];
    near.r(x, y, 1, 1, c);
    if (i % 4 === 0) near.r(x - 1, y, 3, 1, c).r(x, y - 1, 1, 3, c);
  }
  const twinkle = new Pen();
  for (let i = 0; i < 9; i++) {
    const x = at(100), y = at(100);
    twinkle.r(x - 1, y, 3, 1, '#FFFFFF').r(x, y - 1, 1, 3, '#FFFFFF');
  }

  return {
    village: [
      { image: tile(80, grass.list), size: 320, depth: 1 },
      { image: tile(150, woods.list), size: 600, depth: 1 },
    ],
    city: [
      { image: tile(48, slabs.list), size: 192, depth: 1 },
      { image: tile(160, blocks.list), size: 640, depth: 1 },
    ],
    space: [
      { image: tile(120, far.list), size: 240, depth: 0.15 },
      { image: tile(100, twinkle.list), size: 300, depth: 0.3, className: 'terrain-twinkle' },
      { image: tile(180, near.list), size: 540, depth: 0.5 },
    ],
  };
}

export const TERRAIN = buildTerrain();

const cloudPen = new Pen().r(4, 6, 24, 5, '#FFFFFF').r(8, 3, 11, 3, '#FFFFFF').r(12, 1, 6, 2, '#FFFFFF').r(19, 4, 6, 2, '#FFFFFF').r(4, 10, 24, 1, '#DCEBFA');
export const CLOUD = tile(32, cloudPen.list);
