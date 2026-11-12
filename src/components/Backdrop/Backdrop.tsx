import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { worldOf } from '../../game/worlds';
import { Terrain } from '../../game/World';
import './Backdrop.css';

/**
 * The living part of a vibe. Sits behind the canvas and never takes pointer events.
 * Lamplight and Midnight are still; Beach day drifts; Playground bounces; Afterhours goes off.
 * `moving` is true while the user drags a note or pans, so each vibe can react to it.
 */

const WAVE_PATH =
  'M0 0 H2400 V120 Q2250 190 2100 120 T1800 120 T1500 120 T1200 120 T900 120 T600 120 T300 120 T0 120 Z';

function Beach() {
  return (
    <>
      <div className="beach-sun" />
      {[0, 1, 2].map((i) => (
        <div key={i} className={`beach-tide beach-tide--${i}`}>
          <svg className="beach-wave" viewBox="0 0 2400 200" preserveAspectRatio="none" aria-hidden>
            <path d={WAVE_PATH} />
          </svg>
        </div>
      ))}
      {/* Ripples that wash across the sand while you move things */}
      <div className="beach-ripples">
        <div />
      </div>
    </>
  );
}

const SHAPES = ['circle', 'square', 'triangle', 'squiggle', 'star', 'ring'];
const SHAPE_COLORS = ['#FF5C8A', '#5B5BFF', '#FFC531', '#2ED3A0', '#FF8A3D', '#3DB8FF'];
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  shape: SHAPES[i % SHAPES.length],
  color: SHAPE_COLORS[(i * 5 + 2) % SHAPE_COLORS.length],
  left: (i * 37 + 11) % 96,
  top: (i * 53 + 7) % 92,
  size: 22 + ((i * 13) % 34),
  duration: 9 + ((i * 7) % 11),
  delay: -((i * 3.7) % 12),
  path: i % 3,
}));

function Playground() {
  return (
    <div className="fun-confetti">
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          className={`fun-shape fun-shape--${c.shape} fun-path--${c.path}`}
          style={
            {
              left: `${c.left}%`,
              top: `${c.top}%`,
              '--size': `${c.size}px`,
              '--color': c.color,
              animationDuration: `${c.duration}s`,
              animationDelay: `${c.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

const BARS = Array.from({ length: 48 }, (_, i) => ({
  duration: 0.5 * (1 + ((i * 7) % 4)) * 0.5 + 0.25,
  delay: -((i * 0.37) % 2),
  peak: 0.35 + ((i * 29) % 65) / 100,
}));

function Afterhours() {
  const flashRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);

  // The room reacts to your typing: every keystroke kicks the lights and the equaliser.
  useEffect(() => {
    let cool: ReturnType<typeof setTimeout> | null = null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.key.length > 1) return;
      flashRef.current?.animate([{ opacity: 0.55 }, { opacity: 0 }], { duration: 420, easing: 'ease-out' });
      const bars = barsRef.current;
      if (!bars) return;
      bars.classList.add('is-hot');
      if (cool) clearTimeout(cool);
      cool = setTimeout(() => bars.classList.remove('is-hot'), 500);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      if (cool) clearTimeout(cool);
    };
  }, []);

  return (
    <>
      <div className="party-aurora" />
      <div className="party-beam party-beam--a" />
      <div className="party-beam party-beam--b" />
      <div className="party-beam party-beam--c" />
      <div className="party-beat" />
      <div className="party-flash" ref={flashRef} />
      <div className="party-bars" ref={barsRef}>
        {BARS.map((bar, i) => (
          <span
            key={i}
            style={
              {
                animationDuration: `${bar.duration}s`,
                animationDelay: `${bar.delay}s`,
                '--peak': bar.peak,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </>
  );
}

export function Backdrop({ moving }: { moving: boolean }) {
  const theme = useSettingsStore((s) => s.theme);
  const world = worldOf(theme);

  return (
    <div className={`backdrop backdrop--${theme}${moving ? ' is-moving' : ''}`} aria-hidden>
      <div className="backdrop-base" />
      {world && <Terrain world={world} />}
      {theme === 'beach' && <Beach />}
      {theme === 'fun' && <Playground />}
      {theme === 'party' && <Afterhours />}
    </div>
  );
}
