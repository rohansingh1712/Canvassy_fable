import { Fragment, useEffect, useRef, useState, ReactNode } from 'react';
import { useReactFlow, useStore } from 'reactflow';
import {
  Plus,
  Minus,
  Maximize,
  Undo2,
  Redo2,
  Palette,
  SlidersHorizontal,
  Keyboard,
  Rows3,
  FileText,
  Check,
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { useSettingsStore } from '../../store/settingsStore';
import { THEMES } from '../../theme/themes';
import { Export } from '../Export/Export';
import './Dock.css';

interface DockProps {
  onNewCard: () => void;
  onOpenSettings: () => void;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
}

const SHORTCUTS: [string, string][] = [
  ['New note', 'N or double-click'],
  ['Pan', 'Scroll or drag canvas'],
  ['Zoom', 'Pinch or ⌘ scroll'],
  ['Select several', 'Shift-drag'],
  ['Delete selection', '⌫'],
  ['Undo / redo', '⌘Z / ⇧⌘Z'],
  ['Focus mode', '⌘↵ in a note'],
  ['Stop editing', 'Esc'],
  ['Summaries', 'S'],
  ['Next world or vibe', 'T'],
  ['Fit everything', '1'],
  ['Zoom to 100%', '0'],
];

/** Dock button with a popover that closes on outside click or Esc. */
function DockPopover({
  open,
  setOpen,
  label,
  icon,
  children,
  align = 'center',
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  label: string;
  icon: ReactNode;
  children: ReactNode;
  align?: 'center' | 'end';
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, setOpen]);

  return (
    <div className="dock-popover-anchor" ref={ref}>
      <button
        className={`dock-btn${open ? ' is-active' : ''}`}
        onClick={() => setOpen(!open)}
        data-tip={open ? undefined : label}
        aria-label={label}
        aria-expanded={open}
      >
        {icon}
      </button>
      {open && <div className={`dock-popover dock-popover--${align}`}>{children}</div>}
    </div>
  );
}

export function Dock({ onNewCard, onOpenSettings, helpOpen, setHelpOpen }: DockProps) {
  const { zoomIn, zoomOut, zoomTo, fitView, screenToFlowPosition } = useReactFlow();
  const zoom = useStore((state) => state.transform[2]);
  const canUndo = useCanvasStore((s) => s.past.length > 0);
  const canRedo = useCanvasStore((s) => s.future.length > 0);
  const { undo, redo, addWelcomeCards } = useCanvasStore.getState();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const summaryMode = useSettingsStore((s) => s.summaryMode);
  const showSummaries = useSettingsStore((s) => s.showSummaries);
  const toggleSummaries = useSettingsStore((s) => s.toggleSummaries);
  const [themesOpen, setThemesOpen] = useState(false);

  return (
    <>
      <div className="dock dock--main">
        <button className="dock-btn dock-btn--primary" onClick={onNewCard} data-tip="New note · N" aria-label="New note">
          <Plus size={18} strokeWidth={2.25} />
        </button>

        <span className="dock-sep" />

        {summaryMode === 'toggle' && (
          <button
            className={`dock-btn${showSummaries ? ' is-active' : ''}`}
            onClick={toggleSummaries}
            data-tip={showSummaries ? 'Show full notes · S' : 'Show summaries · S'}
            aria-label="Toggle summaries"
            aria-pressed={showSummaries}
          >
            {showSummaries ? <FileText size={17} /> : <Rows3 size={17} />}
          </button>
        )}

        <DockPopover open={themesOpen} setOpen={setThemesOpen} label="Vibe · T" icon={<Palette size={17} />}>
          <div className="theme-grid">
            {THEMES.map((t, i) => (
              <Fragment key={t.id}>
              {(i === 0 || (!t.world && THEMES[i - 1].world)) && (
                <div className="dock-popover-title theme-group">{t.world ? 'Worlds to build' : 'Vibes'}</div>
              )}
              <button
                className={`theme-tile${theme === t.id ? ' is-current' : ''}`}
                onClick={() => setTheme(t.id)}
              >
                <span className="theme-swatch" style={{ background: t.preview.canvas }}>
                  <span className="theme-swatch-card" style={{ background: t.preview.card }}>
                    <span style={{ background: t.preview.text }} />
                    <span style={{ background: t.preview.accent }} />
                  </span>
                  {theme === t.id && (
                    <span className="theme-check">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span className="theme-name">{t.name}</span>
                <span className="theme-blurb">{t.blurb}</span>
              </button>
              </Fragment>
            ))}
          </div>
        </DockPopover>

        <Export />

        <button className="dock-btn" onClick={onOpenSettings} data-tip="Settings" aria-label="Settings">
          <SlidersHorizontal size={17} />
        </button>

        <DockPopover
          open={helpOpen}
          setOpen={setHelpOpen}
          label="Shortcuts · ?"
          icon={<Keyboard size={17} />}
          align="end"
        >
          <div className="dock-popover-title">Shortcuts</div>
          <dl className="shortcut-list">
            {SHORTCUTS.map(([action, keys]) => (
              <div key={action}>
                <dt>{action}</dt>
                <dd>{keys}</dd>
              </div>
            ))}
          </dl>
          <button
            className="dock-text-btn"
            onClick={() => {
              const centre = screenToFlowPosition({ x: window.innerWidth / 2 - 450, y: window.innerHeight / 2 - 250 });
              addWelcomeCards(centre);
              setHelpOpen(false);
            }}
          >
            Add the welcome notes again
          </button>
        </DockPopover>
      </div>

      <div className="dock dock--corner">
        <button className="dock-btn" onClick={undo} disabled={!canUndo} data-tip="Undo · ⌘Z" aria-label="Undo">
          <Undo2 size={16} />
        </button>
        <button className="dock-btn" onClick={redo} disabled={!canRedo} data-tip="Redo · ⇧⌘Z" aria-label="Redo">
          <Redo2 size={16} />
        </button>
        <span className="dock-sep" />
        <button className="dock-btn" onClick={() => zoomOut({ duration: 200 })} data-tip="Zoom out" aria-label="Zoom out">
          <Minus size={16} />
        </button>
        <button className="dock-zoom" onClick={() => zoomTo(1, { duration: 250 })} data-tip="Reset to 100% · 0">
          {Math.round(zoom * 100)}%
        </button>
        <button className="dock-btn" onClick={() => zoomIn({ duration: 200 })} data-tip="Zoom in" aria-label="Zoom in">
          <Plus size={16} />
        </button>
        <button
          className="dock-btn"
          onClick={() => fitView({ duration: 300, padding: 0.2, maxZoom: 1 })}
          data-tip="Fit everything · 1"
          aria-label="Fit everything"
        >
          <Maximize size={15} />
        </button>
      </div>
    </>
  );
}
