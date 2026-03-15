/**
 * TerminalPanel Component
 *
 * Right panel for split/focus view. Shows the selected terminal's
 * live xterm.js output connected to the same PTY.
 */
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import { useEffect, useRef } from 'react';
import '@xterm/xterm/css/xterm.css';
import { useViewModeStore } from '../stores/ViewModeStore';
import './TerminalPanel.css';

export function TerminalPanel() {
  const selectedTerminalId = useViewModeStore((s) => s.selectedTerminalId);
  const viewMode = useViewModeStore((s) => s.viewMode);
  const setViewMode = useViewModeStore((s) => s.setViewMode);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current || !selectedTerminalId) return;

    // Clean up previous terminal
    if (terminalInstanceRef.current) {
      terminalInstanceRef.current.dispose();
      terminalInstanceRef.current = null;
    }

    const terminal = new Terminal({
      fontFamily: '"SF Mono", "Menlo", "Monaco", monospace',
      fontSize: 13,
      theme: {
        background: '#0d0d0d',
        foreground: '#e0e0e0',
        cursor: '#e0e0e0',
        selectionBackground: 'rgba(74, 158, 255, 0.3)',
      },
      scrollback: 10000,
      cursorBlink: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(terminalRef.current);

    terminalInstanceRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Fit after container renders
    setTimeout(() => {
      try {
        if (fitAddonRef.current && terminalRef.current && terminalRef.current.clientWidth > 0) {
          fitAddonRef.current.fit();
        }
      } catch {
        /* ignore initial fit errors */
      }
    }, 100);

    // Connect to PTY via Electron IPC
    if (window.electronAPI) {
      // Get buffer from existing terminal
      const buffer = (window.electronAPI as any).getTerminalBuffer?.(selectedTerminalId);
      if (buffer && Array.isArray(buffer)) {
        for (const chunk of buffer) {
          terminal.write(chunk);
        }
      }

      // Listen for terminal data
      const handleData = ({ terminalId, data }: { terminalId: string; data: string }) => {
        if (terminalId === selectedTerminalId) {
          terminal.write(data);
        }
      };

      terminal.onData((inputData: string) => {
        window.electronAPI?.sendTerminalInput(selectedTerminalId, inputData);
      });

      window.electronAPI.onTerminalData(handleData);
    } else {
      terminal.writeln('Select a terminal node to view its output here.');
      terminal.writeln('Electron IPC not available in browser mode.');
    }

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      try {
        if (fitAddonRef.current && terminalRef.current && terminalRef.current.clientWidth > 0) {
          fitAddonRef.current.fit();
        }
      } catch {
        /* ignore */
      }
    });
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
      terminalInstanceRef.current = null;
      fitAddonRef.current = null;
    };
  }, [selectedTerminalId]);

  // Re-fit when view mode changes (panel width changes)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (fitAddonRef.current && terminalRef.current && terminalRef.current.clientWidth > 0) {
          fitAddonRef.current.fit();
        }
      } catch {
        /* ignore */
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [viewMode]);

  if (!selectedTerminalId) {
    return (
      <div className="terminal-panel-empty">
        <div className="terminal-panel-empty-text">Click a terminal node to view it here</div>
      </div>
    );
  }

  return (
    <div className="terminal-panel">
      <div className="terminal-panel-header">
        <span className="terminal-panel-title">{selectedTerminalId.slice(-12)}</span>
        <div className="terminal-panel-actions">
          <button
            className="terminal-panel-btn"
            onClick={() => setViewMode(viewMode === 'focus' ? 'split' : 'focus')}
            title={viewMode === 'focus' ? 'Split view' : 'Focus view'}
          >
            {viewMode === 'focus' ? '\u2B05' : '\u2B1C'}
          </button>
          <button
            className="terminal-panel-btn"
            onClick={() => {
              useViewModeStore.getState().selectTerminal(null);
              setViewMode('canvas');
            }}
            title="Close panel"
          >
            \u2715
          </button>
        </div>
      </div>
      <div ref={terminalRef} className="terminal-panel-content nodrag nowheel" />
    </div>
  );
}
