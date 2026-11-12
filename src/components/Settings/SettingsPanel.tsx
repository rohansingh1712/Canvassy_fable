import { useSettingsStore } from '../../store/settingsStore';
import { X } from 'lucide-react';
import './SettingsPanel.css';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { arrowWidth, arrowHeadSize, summaryMode, cardWidth, updateSettings, setSummaryMode, setCardWidth } = useSettingsStore();

  return (
    <>
      {/* Settings Panel - No backdrop, canvas fully interactive */}
      <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose} title="Close (Esc)">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="settings-content">
          <div className="settings-section">
            <h3>Arrows</h3>
            <div className="slider-control">
              <label className="slider-label">Arrow Line Width</label>
              <div className="slider-row">
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={arrowWidth}
                  onChange={(e) => updateSettings({ arrowWidth: parseFloat(e.target.value) })}
                />
                <span className="slider-value">{arrowWidth.toFixed(1)} px</span>
              </div>
            </div>
            <div className="slider-control">
              <label className="slider-label">Arrow Head Size</label>
              <div className="slider-row">
                <input
                  type="range"
                  min="4"
                  max="16"
                  step="1"
                  value={arrowHeadSize}
                  onChange={(e) => updateSettings({ arrowHeadSize: parseInt(e.target.value) })}
                />
                <span className="slider-value">{arrowHeadSize}</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="settings-divider" />

          <div className="settings-section">
            <h3>Notes</h3>
            <div className="settings-radio-group">
              <label className="settings-radio-label">
                <input
                  type="radio"
                  name="cardWidth"
                  value="narrow"
                  checked={cardWidth === 'narrow'}
                  onChange={() => setCardWidth('narrow')}
                />
                <div>
                  <span className="settings-radio-title">Narrow</span>
                  <p className="settings-description">
                    Compact cards, great for fitting many notes on screen
                  </p>
                </div>
              </label>

              <label className="settings-radio-label">
                <input
                  type="radio"
                  name="cardWidth"
                  value="medium"
                  checked={cardWidth === 'medium'}
                  onChange={() => setCardWidth('medium')}
                />
                <div>
                  <span className="settings-radio-title">Medium (default)</span>
                  <p className="settings-description">
                    Balanced width for comfortable reading and writing
                  </p>
                </div>
              </label>

              <label className="settings-radio-label">
                <input
                  type="radio"
                  name="cardWidth"
                  value="wide"
                  checked={cardWidth === 'wide'}
                  onChange={() => setCardWidth('wide')}
                />
                <div>
                  <span className="settings-radio-title">Wide</span>
                  <p className="settings-description">
                    Maximum width for long-form writing and detailed notes
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Divider */}
          <div className="settings-divider" />

          <div className="settings-section">
            <h3>Summaries</h3>
            <div className="settings-radio-group">
              <label className="settings-radio-label">
                <input
                  type="radio"
                  name="summaryMode"
                  value="zoom"
                  checked={summaryMode === 'zoom'}
                  onChange={() => setSummaryMode('zoom')}
                />
                <div>
                  <span className="settings-radio-title">Zoom-based (automatic)</span>
                  <p className="settings-description">
                    Cards collapse to summaries when zoomed out below 60%
                  </p>
                </div>
              </label>

              <label className="settings-radio-label">
                <input
                  type="radio"
                  name="summaryMode"
                  value="toggle"
                  checked={summaryMode === 'toggle'}
                  onChange={() => setSummaryMode('toggle')}
                />
                <div>
                  <span className="settings-radio-title">Toggle-based (manual)</span>
                  <p className="settings-description">
                    Use the toggle button to switch between full and summary views
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Divider */}
          <div className="settings-divider" />

          <div className="settings-section">
            <h3>About</h3>
            <p className="settings-description">
              Canvassy — Spatial note-taking for creative thinking
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <button className="settings-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </>
  );
}
