/**
 * HeaderBar Component
 *
 * Top bar with brand, view mode tabs, and terminal count.
 */
import type { ViewMode } from '../stores/ViewModeStore';
import { useViewModeStore } from '../stores/ViewModeStore';
import './HeaderBar.css';

export function getViewModes(): ViewMode[] {
  return ['canvas', 'split', 'focus'];
}

export function getViewModeLabel(mode: ViewMode): string {
  const labels: Record<ViewMode, string> = {
    canvas: 'Canvas',
    split: 'Split',
    focus: 'Focus',
  };
  return labels[mode];
}

export function HeaderBar() {
  const viewMode = useViewModeStore((s) => s.viewMode);
  const setViewMode = useViewModeStore((s) => s.setViewMode);
  const terminalCount = useViewModeStore((s) => s.terminalCount);

  return (
    <div className="header-bar">
      <div className="header-bar-left">
        <span className="header-bar-brand">TermCanvas</span>
      </div>
      <div className="header-bar-center">
        {getViewModes().map((mode) => (
          <button
            key={mode}
            className={`header-bar-tab ${viewMode === mode ? 'active' : ''}`}
            onClick={() => setViewMode(mode)}
          >
            {getViewModeLabel(mode)}
          </button>
        ))}
      </div>
      <div className="header-bar-right">
        <span className="header-bar-stat">
          {terminalCount} terminal{terminalCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
