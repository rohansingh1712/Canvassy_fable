import { useSettingsStore } from '../store/settingsStore';
import { worldOf } from './worlds';
import { burst, floatText } from './fx';
import { sfx } from './sfx';

/**
 * What each action feels like in a world. Every function is a no-op outside world themes,
 * so callers don't need to check.
 */

const world = () => worldOf(useSettingsStore.getState().theme);

const top = (el: Element) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, r };
};

export const game = {
  /** A word was added to a note: one more resident moves in. */
  word(plot: Element | null) {
    const w = world();
    if (!w || !plot) return;
    const building = plot.querySelector('.building') ?? plot;
    const { x, r } = top(building);
    floatText(x + (Math.random() * 24 - 12), r.top + 6, '+1');
    building.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-4px)' }, { transform: 'translateY(0)' }], {
      duration: 140,
      easing: 'steps(2)',
    });
    sfx.word();
  },

  /** A note crossed a word threshold and its building upgraded. */
  levelUp(plot: Element | null, name: string) {
    const w = world();
    if (!w || !plot) return;
    const { x, y, r } = top(plot.querySelector('.building') ?? plot);
    burst(x, y, w.dust, 18, 80);
    floatText(x, r.top - 4, `${name}!`, true);
    sfx.level();
  },

  /** A new note was placed. */
  place(card: Element | null) {
    const w = world();
    if (!w || !card) return;
    const r = card.getBoundingClientRect();
    burst(r.left + 20, r.top + 10, w.dust, 6, 40);
    burst(r.right - 20, r.top + 10, w.dust, 6, 40);
    sfx.place();
  },

  /** A note was put down after a drag. */
  drop(card: HTMLElement | null) {
    const w = world();
    if (!w || !card) return;
    const r = card.getBoundingClientRect();
    card.animate(
      [
        { transform: 'translateY(-6px) scale(1.02)' },
        { transform: 'translateY(0) scale(1.03, 0.95)', offset: 0.45 },
        { transform: 'scale(0.99, 1.02)', offset: 0.75 },
        { transform: 'none' },
      ],
      { duration: 240, easing: 'ease-out' }
    );
    burst(r.left + 12, r.bottom, w.dust.slice(0, 2), 5, 34);
    burst(r.right - 12, r.bottom, w.dust.slice(0, 2), 5, 34);
    sfx.drop();
  },

  connect() {
    if (world()) sfx.connect();
  },

  demolish(x: number, y: number) {
    const w = world();
    if (!w) return;
    burst(x, y, ['#8B8B8B', '#5E5E5E', ...w.dust.slice(0, 2)], 22, 90);
    sfx.demolish();
  },

  rankUp() {
    const w = world();
    if (!w) return;
    const { innerWidth: W, innerHeight: H } = window;
    [0.25, 0.5, 0.75].forEach((f, i) =>
      setTimeout(() => burst(W * f, H * (0.3 + 0.1 * (i % 2)), w.dust, 26, 130), i * 220)
    );
    sfx.rank();
  },
};
