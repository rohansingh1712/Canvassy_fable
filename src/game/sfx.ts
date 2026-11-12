import { useSettingsStore } from '../store/settingsStore';

/** Tiny chiptune sounds, synthesised on the fly. No audio files. */

let ctx: AudioContext | null = null;

function play(notes: [number, number][], type: OscillatorType = 'square', volume = 0.04) {
  if (!useSettingsStore.getState().sound) return;
  try {
    ctx = ctx ?? new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    let at = ctx.currentTime;
    for (const [freq, dur] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + dur + 0.02);
      at += dur * 0.8;
    }
  } catch {
    /* audio unavailable: stay silent */
  }
}

// Each new word plays the next note of a pentatonic walk, so writing makes a little tune.
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
let step = 0;

export const sfx = {
  word() {
    step = (step + (Math.random() < 0.7 ? 1 : 2)) % SCALE.length;
    play([[SCALE[step], 0.07]], 'triangle', 0.05);
  },
  place: () => play([[196, 0.06], [294, 0.06], [392, 0.1]]),
  drop: () => play([[110, 0.08]], 'triangle', 0.09),
  connect: () => play([[392, 0.06], [523, 0.06], [659, 0.06], [784, 0.12]]),
  demolish: () => play([[220, 0.07], [165, 0.07], [110, 0.14]], 'sawtooth', 0.03),
  level: () => play([[523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.2]]),
  rank: () => play([[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.1], [784, 0.1], [1047, 0.1], [1319, 0.35]]),
};
