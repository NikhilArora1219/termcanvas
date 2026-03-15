/**
 * SplitLayout Component
 *
 * Wraps the canvas and terminal panel in a MiroFish-inspired layout.
 * Three modes: canvas (100% left), split (50/50), focus (100% right).
 * CSS transitions animate width changes smoothly.
 */
import type { ReactNode } from 'react';
import { useViewModeStore } from '../stores/ViewModeStore';
import { HeaderBar } from './HeaderBar';
// SystemLog moved to Canvas.tsx as a floating panel
import { TerminalPanel } from './TerminalPanel';
import './SplitLayout.css';

interface SplitLayoutProps {
  children: ReactNode;
}

export function SplitLayout({ children }: SplitLayoutProps) {
  const viewMode = useViewModeStore((s) => s.viewMode);
  const { leftWidth, rightWidth } = useViewModeStore((s) => s.getPanelWidths());

  return (
    <div className="split-layout">
      <HeaderBar />
      <div className="split-layout-content">
        <div
          className="split-layout-panel split-layout-left"
          style={{
            width: leftWidth,
            opacity: viewMode === 'focus' ? 0 : 1,
            transform: viewMode === 'focus' ? 'translateX(-20px)' : 'translateX(0)',
          }}
        >
          {children}
        </div>
        <div
          className="split-layout-panel split-layout-right"
          style={{
            width: rightWidth,
            opacity: viewMode === 'canvas' ? 0 : 1,
            transform: viewMode === 'canvas' ? 'translateX(20px)' : 'translateX(0)',
          }}
        >
          <TerminalPanel />
        </div>
      </div>
    </div>
  );
}
