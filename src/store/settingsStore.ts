import { create } from 'zustand';
import { applyTheme, ThemeId, THEMES } from '../theme/themes';

export type CardWidth = 'narrow' | 'medium' | 'wide';
export type SummaryMode = 'zoom' | 'toggle';

export const CARD_WIDTHS: Record<CardWidth, { full: number; summary: number }> = {
  narrow: { full: 320, summary: 240 },
  medium: { full: 420, summary: 280 },
  wide: { full: 560, summary: 320 },
};

interface Settings {
  arrowWidth: number;
  arrowHeadSize: number;
  summaryMode: SummaryMode;
  showSummaries: boolean;
  cardWidth: CardWidth;
  theme: ThemeId;
  /** Game sounds in world themes */
  sound: boolean;
}

interface SettingsState extends Settings {
  updateSettings: (settings: Partial<Pick<Settings, 'arrowWidth' | 'arrowHeadSize'>>) => void;
  setSummaryMode: (mode: SummaryMode) => void;
  setCardWidth: (width: CardWidth) => void;
  toggleSummaries: () => void;
  setTheme: (theme: ThemeId) => void;
  cycleTheme: () => void;
  toggleSound: () => void;
}

const STORAGE_KEY = 'canvassy-settings';

const DEFAULTS: Settings = {
  arrowWidth: 1.5,
  arrowHeadSize: 7,
  summaryMode: 'toggle',
  showSummaries: false,
  cardWidth: 'medium',
  theme: 'village',
  sound: true,
};

function load(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const merged = { ...DEFAULTS, ...JSON.parse(stored) };
      if (!THEMES.some((t) => t.id === merged.theme)) merged.theme = DEFAULTS.theme;
      return merged;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return DEFAULTS;
}

const initial = load();
applyTheme(initial.theme);

export const useSettingsStore = create<SettingsState>((set, get) => {
  const commit = (patch: Partial<Settings>) => {
    set(patch);
    const { arrowWidth, arrowHeadSize, summaryMode, showSummaries, cardWidth, theme, sound } = get();
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ arrowWidth, arrowHeadSize, summaryMode, showSummaries, cardWidth, theme, sound })
      );
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return {
    ...initial,
    updateSettings: (settings) => commit(settings),
    setSummaryMode: (summaryMode) => commit({ summaryMode }),
    setCardWidth: (cardWidth) => commit({ cardWidth }),
    toggleSummaries: () => commit({ showSummaries: !get().showSummaries }),
    setTheme: (theme) => {
      applyTheme(theme);
      commit({ theme });
    },
    toggleSound: () => commit({ sound: !get().sound }),
    cycleTheme: () => {
      const index = THEMES.findIndex((t) => t.id === get().theme);
      get().setTheme(THEMES[(index + 1) % THEMES.length].id);
    },
  };
});
