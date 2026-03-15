# MiroFish UI Enhancement — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add MiroFish-inspired 3-view layout (Canvas / Split / Focus), system dashboard log, entity type legend, and enhanced header bar to TermCanvas.

**Architecture:** Wrap the existing Canvas component in a new SplitLayout that manages view modes via a `viewMode` state. Left panel = existing xyflow canvas, right panel = focused terminal xterm.js output. Both panels stay mounted, only CSS widths change. A bottom SystemLog panel captures terminal lifecycle events. HeaderBar replaces TitleBar with brand + view tabs + status.

**Tech Stack:** React 18, @xyflow/react v12, @xterm/xterm 5.5, Zustand, CSS transitions, Vitest

---

## Task 1: ViewMode Store (Zustand)

**Files:**
- Create: `apps/desktop/src/renderer/stores/ViewModeStore.ts`
- Test: `apps/desktop/src/renderer/stores/__tests__/ViewModeStore.test.ts`

**Step 1: Write the failing test**

```typescript
// apps/desktop/src/renderer/stores/__tests__/ViewModeStore.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useViewModeStore } from '../ViewModeStore';

describe('ViewModeStore', () => {
  beforeEach(() => {
    useViewModeStore.setState({
      viewMode: 'canvas',
      selectedTerminalId: null,
      systemLogs: [],
    });
  });

  it('should default to canvas mode', () => {
    const state = useViewModeStore.getState();
    expect(state.viewMode).toBe('canvas');
  });

  it('should switch to split mode', () => {
    useViewModeStore.getState().setViewMode('split');
    expect(useViewModeStore.getState().viewMode).toBe('split');
  });

  it('should switch to focus mode', () => {
    useViewModeStore.getState().setViewMode('focus');
    expect(useViewModeStore.getState().viewMode).toBe('focus');
  });

  it('should track selected terminal', () => {
    expect(useViewModeStore.getState().selectedTerminalId).toBeNull();
    useViewModeStore.getState().selectTerminal('terminal-abc');
    expect(useViewModeStore.getState().selectedTerminalId).toBe('terminal-abc');
  });

  it('should auto-switch to split mode when selecting terminal in canvas mode', () => {
    useViewModeStore.getState().selectTerminal('terminal-abc');
    expect(useViewModeStore.getState().viewMode).toBe('split');
  });

  it('should add system logs', () => {
    useViewModeStore.getState().addLog('Terminal created', 'info');
    const logs = useViewModeStore.getState().systemLogs;
    expect(logs).toHaveLength(1);
    expect(logs[0].message).toBe('Terminal created');
    expect(logs[0].level).toBe('info');
    expect(logs[0].timestamp).toBeDefined();
  });

  it('should cap logs at 200 entries', () => {
    const store = useViewModeStore.getState();
    for (let i = 0; i < 210; i++) {
      store.addLog(`Log ${i}`, 'info');
    }
    expect(useViewModeStore.getState().systemLogs).toHaveLength(200);
  });

  it('should clear selected terminal', () => {
    useViewModeStore.getState().selectTerminal('terminal-abc');
    useViewModeStore.getState().selectTerminal(null);
    expect(useViewModeStore.getState().selectedTerminalId).toBeNull();
  });

  it('should compute panel widths for canvas mode', () => {
    const { leftWidth, rightWidth } = useViewModeStore.getState().getPanelWidths();
    expect(leftWidth).toBe('100%');
    expect(rightWidth).toBe('0%');
  });

  it('should compute panel widths for split mode', () => {
    useViewModeStore.getState().setViewMode('split');
    const { leftWidth, rightWidth } = useViewModeStore.getState().getPanelWidths();
    expect(leftWidth).toBe('50%');
    expect(rightWidth).toBe('50%');
  });

  it('should compute panel widths for focus mode', () => {
    useViewModeStore.getState().setViewMode('focus');
    const { leftWidth, rightWidth } = useViewModeStore.getState().getPanelWidths();
    expect(leftWidth).toBe('0%');
    expect(rightWidth).toBe('100%');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npx vitest run src/renderer/stores/__tests__/ViewModeStore.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

```typescript
// apps/desktop/src/renderer/stores/ViewModeStore.ts
import { create } from 'zustand';

export type ViewMode = 'canvas' | 'split' | 'focus';
export type LogLevel = 'info' | 'warn' | 'error';

export interface SystemLogEntry {
  timestamp: number;
  message: string;
  level: LogLevel;
}

interface ViewModeState {
  viewMode: ViewMode;
  selectedTerminalId: string | null;
  systemLogs: SystemLogEntry[];
  setViewMode: (mode: ViewMode) => void;
  selectTerminal: (terminalId: string | null) => void;
  addLog: (message: string, level: LogLevel) => void;
  getPanelWidths: () => { leftWidth: string; rightWidth: string };
}

const MAX_LOGS = 200;

export const useViewModeStore = create<ViewModeState>((set, get) => ({
  viewMode: 'canvas',
  selectedTerminalId: null,
  systemLogs: [],

  setViewMode: (mode) => set({ viewMode: mode }),

  selectTerminal: (terminalId) => {
    const current = get();
    if (terminalId && current.viewMode === 'canvas') {
      set({ selectedTerminalId: terminalId, viewMode: 'split' });
    } else {
      set({ selectedTerminalId: terminalId });
    }
  },

  addLog: (message, level) => {
    set((state) => {
      const entry: SystemLogEntry = { timestamp: Date.now(), message, level };
      const logs = [...state.systemLogs, entry];
      return { systemLogs: logs.length > MAX_LOGS ? logs.slice(-MAX_LOGS) : logs };
    });
  },

  getPanelWidths: () => {
    const { viewMode } = get();
    switch (viewMode) {
      case 'canvas':
        return { leftWidth: '100%', rightWidth: '0%' };
      case 'split':
        return { leftWidth: '50%', rightWidth: '50%' };
      case 'focus':
        return { leftWidth: '0%', rightWidth: '100%' };
    }
  },
}));
```

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop && npx vitest run src/renderer/stores/__tests__/ViewModeStore.test.ts`
Expected: ALL PASS (11 tests)

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add ViewModeStore for split layout state management"
```

---

## Task 2: HeaderBar Component

**Files:**
- Create: `apps/desktop/src/renderer/components/HeaderBar.tsx`
- Create: `apps/desktop/src/renderer/components/HeaderBar.css`
- Test: `apps/desktop/src/renderer/components/__tests__/HeaderBar.test.ts`

**Step 1: Write the failing test**

```typescript
// apps/desktop/src/renderer/components/__tests__/HeaderBar.test.ts
import { describe, expect, it } from 'vitest';
import { getViewModeLabel, getViewModes } from '../HeaderBar';

describe('HeaderBar helpers', () => {
  it('should return 3 view modes', () => {
    expect(getViewModes()).toEqual(['canvas', 'split', 'focus']);
  });

  it('should return correct labels', () => {
    expect(getViewModeLabel('canvas')).toBe('Canvas');
    expect(getViewModeLabel('split')).toBe('Split');
    expect(getViewModeLabel('focus')).toBe('Focus');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npx vitest run src/renderer/components/__tests__/HeaderBar.test.ts`
Expected: FAIL

**Step 3: Write implementation**

```typescript
// apps/desktop/src/renderer/components/HeaderBar.tsx
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

interface HeaderBarProps {
  terminalCount: number;
}

export function HeaderBar({ terminalCount }: HeaderBarProps) {
  const viewMode = useViewModeStore((s) => s.viewMode);
  const setViewMode = useViewModeStore((s) => s.setViewMode);

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
        <span className="header-bar-stat">{terminalCount} terminal{terminalCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
```

```css
/* apps/desktop/src/renderer/components/HeaderBar.css */
.header-bar {
  height: 40px;
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 0 80px; /* 80px left for macOS traffic lights */
  -webkit-app-region: drag;
  flex-shrink: 0;
  z-index: 100;
}

.header-bar-left {
  display: flex;
  align-items: center;
  -webkit-app-region: no-drag;
}

.header-bar-brand {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.5px;
}

.header-bar-center {
  display: flex;
  gap: 2px;
  background: var(--color-bg-secondary);
  border-radius: 6px;
  padding: 2px;
  -webkit-app-region: no-drag;
}

.header-bar-tab {
  padding: 4px 16px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-app-region: no-drag;
}

.header-bar-tab:hover {
  color: var(--color-text-primary);
}

.header-bar-tab.active {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.header-bar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  -webkit-app-region: no-drag;
}

.header-bar-stat {
  font-size: 11px;
  color: var(--color-text-secondary);
  font-family: "SF Mono", "Menlo", monospace;
}
```

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop && npx vitest run src/renderer/components/__tests__/HeaderBar.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add HeaderBar with view mode tab switcher"
```

---

## Task 3: SystemLog Component

**Files:**
- Create: `apps/desktop/src/renderer/components/SystemLog.tsx`
- Create: `apps/desktop/src/renderer/components/SystemLog.css`
- Test: `apps/desktop/src/renderer/components/__tests__/SystemLog.test.ts`

**Step 1: Write the failing test**

```typescript
// apps/desktop/src/renderer/components/__tests__/SystemLog.test.ts
import { describe, expect, it } from 'vitest';
import { formatLogTimestamp } from '../SystemLog';

describe('SystemLog helpers', () => {
  it('should format timestamp as HH:MM:SS.mmm', () => {
    // Create a known timestamp: 2026-03-15 10:30:45.123
    const ts = new Date(2026, 2, 15, 10, 30, 45, 123).getTime();
    const result = formatLogTimestamp(ts);
    expect(result).toBe('10:30:45.123');
  });

  it('should pad single digits', () => {
    const ts = new Date(2026, 0, 1, 5, 3, 7, 9).getTime();
    const result = formatLogTimestamp(ts);
    expect(result).toBe('05:03:07.009');
  });
});
```

**Step 2: Run test, verify fails**

**Step 3: Write implementation**

```typescript
// apps/desktop/src/renderer/components/SystemLog.tsx
import { useEffect, useRef, useState } from 'react';
import { useViewModeStore } from '../stores/ViewModeStore';
import type { SystemLogEntry } from '../stores/ViewModeStore';
import './SystemLog.css';

export function formatLogTimestamp(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

export function SystemLog() {
  const logs = useViewModeStore((s) => s.systemLogs);
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  return (
    <div className={`system-log ${collapsed ? 'collapsed' : ''}`}>
      <div className="system-log-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="system-log-title">SYSTEM DASHBOARD</span>
        <span className="system-log-toggle">{collapsed ? '+' : '-'}</span>
      </div>
      {!collapsed && (
        <div className="system-log-content" ref={scrollRef}>
          {logs.length === 0 && (
            <div className="system-log-empty">No events yet</div>
          )}
          {logs.map((entry, i) => (
            <div key={`${entry.timestamp}-${i}`} className={`system-log-entry level-${entry.level}`}>
              <span className="system-log-ts">{formatLogTimestamp(entry.timestamp)}</span>
              <span className="system-log-msg">{entry.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

```css
/* apps/desktop/src/renderer/components/SystemLog.css */
.system-log {
  background: #0a0a0a;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  transition: height 0.2s ease;
}

.system-log.collapsed {
  height: 28px;
}

.system-log:not(.collapsed) {
  height: 100px;
}

.system-log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 12px;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.system-log-title {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #666;
  font-family: "SF Mono", "Menlo", monospace;
}

.system-log-toggle {
  font-size: 12px;
  color: #666;
  font-family: "SF Mono", "Menlo", monospace;
}

.system-log-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 4px;
  font-family: "SF Mono", "Menlo", "Monaco", monospace;
  font-size: 11px;
  line-height: 1.5;
}

.system-log-empty {
  color: #444;
  font-style: italic;
}

.system-log-entry {
  display: flex;
  gap: 8px;
}

.system-log-ts {
  color: #555;
  flex-shrink: 0;
}

.system-log-msg {
  color: #aaa;
}

.system-log-entry.level-warn .system-log-msg {
  color: #f5c348;
}

.system-log-entry.level-error .system-log-msg {
  color: #ff6b6b;
}
```

**Step 4: Run test, verify passes**

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add SystemLog dashboard component"
```

---

## Task 4: EntityLegend Component

**Files:**
- Create: `apps/desktop/src/renderer/components/EntityLegend.tsx`
- Create: `apps/desktop/src/renderer/components/EntityLegend.css`
- Test: `apps/desktop/src/renderer/components/__tests__/EntityLegend.test.ts`

**Step 1: Write the failing test**

```typescript
// apps/desktop/src/renderer/components/__tests__/EntityLegend.test.ts
import { describe, expect, it } from 'vitest';
import { getNodeTypeColor, getNodeTypeLabel } from '../EntityLegend';

describe('EntityLegend helpers', () => {
  it('should return correct colors', () => {
    expect(getNodeTypeColor('terminal')).toBe('#0ecf85');
    expect(getNodeTypeColor('agent')).toBe('#4a9eff');
    expect(getNodeTypeColor('browser')).toBe('#f5c348');
    expect(getNodeTypeColor('conversation')).toBe('#9b59b6');
    expect(getNodeTypeColor('unknown')).toBe('#666');
  });

  it('should return correct labels', () => {
    expect(getNodeTypeLabel('terminal')).toBe('Terminal');
    expect(getNodeTypeLabel('agent')).toBe('Agent');
    expect(getNodeTypeLabel('browser')).toBe('Browser');
  });
});
```

**Step 2: Run test, verify fails**

**Step 3: Write implementation**

```typescript
// apps/desktop/src/renderer/components/EntityLegend.tsx
import './EntityLegend.css';

const NODE_TYPE_COLORS: Record<string, string> = {
  terminal: '#0ecf85',
  agent: '#4a9eff',
  browser: '#f5c348',
  conversation: '#9b59b6',
  'agent-chat': '#9b59b6',
  custom: '#666',
};

const NODE_TYPE_LABELS: Record<string, string> = {
  terminal: 'Terminal',
  agent: 'Agent',
  browser: 'Browser',
  conversation: 'Conversation',
  'agent-chat': 'Chat',
  custom: 'Custom',
};

export function getNodeTypeColor(type: string): string {
  return NODE_TYPE_COLORS[type] || '#666';
}

export function getNodeTypeLabel(type: string): string {
  return NODE_TYPE_LABELS[type] || type;
}

interface EntityLegendProps {
  nodeTypes: string[];
}

export function EntityLegend({ nodeTypes }: EntityLegendProps) {
  if (nodeTypes.length === 0) return null;

  return (
    <div className="entity-legend">
      <div className="entity-legend-title">NODE TYPES</div>
      <div className="entity-legend-items">
        {nodeTypes.map((type) => (
          <div key={type} className="entity-legend-item">
            <span
              className="entity-legend-dot"
              style={{ background: getNodeTypeColor(type) }}
            />
            <span className="entity-legend-label">{getNodeTypeLabel(type)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

```css
/* apps/desktop/src/renderer/components/EntityLegend.css */
.entity-legend {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 14px;
  z-index: 5;
  pointer-events: auto;
}

.entity-legend-title {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  font-family: "SF Mono", "Menlo", monospace;
}

.entity-legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
}

.entity-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.entity-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.entity-legend-label {
  font-size: 11px;
  color: var(--color-text-secondary);
}
```

**Step 4: Run test, verify passes**

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add EntityLegend with node type colors"
```

---

## Task 5: TerminalPanel Component (Right Panel for Split/Focus)

**Files:**
- Create: `apps/desktop/src/renderer/components/TerminalPanel.tsx`
- Create: `apps/desktop/src/renderer/components/TerminalPanel.css`

**Step 1: Write implementation**

This is the right panel that shows the selected terminal's live output. It creates its own xterm.js instance connected to the same PTY via the existing IPC.

```typescript
// apps/desktop/src/renderer/components/TerminalPanel.tsx
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
    if (!terminalRef.current || !selectedTerminalId || !window.electronAPI) return;

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

    // Fit after a short delay to let the container render
    setTimeout(() => {
      try {
        if (fitAddonRef.current && terminalRef.current && terminalRef.current.clientWidth > 0) {
          fitAddonRef.current.fit();
        }
      } catch { /* ignore initial fit errors */ }
    }, 100);

    // Get buffer from existing terminal
    const buffer = window.electronAPI.getTerminalBuffer?.(selectedTerminalId);
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

    const handleInput = (inputData: string) => {
      window.electronAPI?.sendTerminalInput(selectedTerminalId, inputData);
    };

    terminal.onData(handleInput);
    window.electronAPI.onTerminalData(handleData);

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      try {
        if (fitAddonRef.current && terminalRef.current && terminalRef.current.clientWidth > 0) {
          fitAddonRef.current.fit();
        }
      } catch { /* ignore */ }
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      window.electronAPI?.removeAllListeners?.('terminal-data');
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
      } catch { /* ignore */ }
    }, 450); // After CSS transition completes (400ms)
    return () => clearTimeout(timer);
  }, [viewMode]);

  if (!selectedTerminalId) {
    return (
      <div className="terminal-panel-empty">
        <div className="terminal-panel-empty-text">
          Click a terminal node to view it here
        </div>
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
            {viewMode === 'focus' ? '⬅' : '⬜'}
          </button>
          <button
            className="terminal-panel-btn"
            onClick={() => {
              useViewModeStore.getState().selectTerminal(null);
              setViewMode('canvas');
            }}
            title="Close panel"
          >
            ✕
          </button>
        </div>
      </div>
      <div ref={terminalRef} className="terminal-panel-content nodrag nowheel" />
    </div>
  );
}
```

```css
/* apps/desktop/src/renderer/components/TerminalPanel.css */
.terminal-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0d0d0d;
}

.terminal-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.terminal-panel-title {
  font-size: 12px;
  font-family: "SF Mono", "Menlo", monospace;
  color: var(--color-text-secondary);
}

.terminal-panel-actions {
  display: flex;
  gap: 4px;
}

.terminal-panel-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.terminal-panel-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.terminal-panel-content {
  flex: 1;
  padding: 4px;
  overflow: hidden;
}

.terminal-panel-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-primary);
}

.terminal-panel-empty-text {
  color: var(--color-text-secondary);
  font-size: 13px;
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add TerminalPanel for split/focus right panel"
```

---

## Task 6: SplitLayout — Wire Everything Together

**Files:**
- Create: `apps/desktop/src/renderer/components/SplitLayout.tsx`
- Create: `apps/desktop/src/renderer/components/SplitLayout.css`
- Modify: `apps/desktop/src/renderer/App.tsx` — replace current layout with SplitLayout
- Modify: `apps/desktop/src/renderer/Canvas.tsx` — add EntityLegend overlay

**Step 1: Create SplitLayout**

```typescript
// apps/desktop/src/renderer/components/SplitLayout.tsx
import type { ReactNode } from 'react';
import { useViewModeStore } from '../stores/ViewModeStore';
import { HeaderBar } from './HeaderBar';
import { SystemLog } from './SystemLog';
import { TerminalPanel } from './TerminalPanel';
import './SplitLayout.css';

interface SplitLayoutProps {
  children: ReactNode; // The canvas component
  terminalCount: number;
}

export function SplitLayout({ children, terminalCount }: SplitLayoutProps) {
  const { leftWidth, rightWidth } = useViewModeStore((s) => s.getPanelWidths());
  const viewMode = useViewModeStore((s) => s.viewMode);

  return (
    <div className="split-layout">
      <HeaderBar terminalCount={terminalCount} />
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
      <SystemLog />
    </div>
  );
}
```

```css
/* apps/desktop/src/renderer/components/SplitLayout.css */
.split-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.split-layout-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.split-layout-panel {
  height: 100%;
  overflow: hidden;
  transition:
    width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1),
    opacity 0.3s ease,
    transform 0.3s ease;
  will-change: width, opacity, transform;
}

.split-layout-left {
  position: relative;
}

.split-layout-right {
  border-left: 1px solid var(--color-border);
}
```

**Step 2: Update App.tsx**

Replace the current layout in `apps/desktop/src/renderer/App.tsx`:

```typescript
import { useEffect, useMemo } from 'react';
import Canvas from './Canvas';
import { SplitLayout } from './components/SplitLayout';
import { TitleBar } from './components/TitleBar';
import { NodeServicesRegistryProvider, ThemeProvider } from './context';
import { createServiceFactories, sharedEventDispatcher } from './services';
import './App.css';

function App() {
  const factories = useMemo(() => createServiceFactories(), []);

  useEffect(() => {
    sharedEventDispatcher.initialize();
    return () => sharedEventDispatcher.dispose();
  }, []);

  return (
    <ThemeProvider>
      <NodeServicesRegistryProvider factories={factories}>
        <div className="app">
          <TitleBar />
          <div className="app-content">
            <SplitLayout terminalCount={0}>
              <Canvas />
            </SplitLayout>
          </div>
        </div>
      </NodeServicesRegistryProvider>
    </ThemeProvider>
  );
}

export default App;
```

Note: Remove the `app-sidebar-left`, `app-sidebar-right`, and `app-bottom-bar` divs — the SplitLayout replaces them.

**Step 3: Add EntityLegend to Canvas.tsx**

Add inside the ReactFlow component area in `Canvas.tsx`, after the Background element. Find the section with `<Background />` and add below it:

```tsx
import { EntityLegend } from './components/EntityLegend';
// ... inside the ReactFlow JSX, after <Background>:
<EntityLegend nodeTypes={Array.from(new Set(nodes.map(n => n.type).filter(Boolean) as string[]))} />
```

**Step 4: Run all tests**

```bash
cd apps/desktop && npx vitest run
```

Expected: All existing 229 tests + new tests pass.

**Step 5: Run biome lint fix**

```bash
cd ~/openclaw_workspace/termcanvas && npx biome check --write .
```

**Step 6: Commit**

```bash
git add -A && git commit -m "feat: integrate SplitLayout with HeaderBar, SystemLog, TerminalPanel, EntityLegend"
```

---

## Task 7: Wire Terminal Node Selection to Split Panel

**Files:**
- Modify: `apps/desktop/src/renderer/TerminalNode.tsx` — add click handler to select terminal in ViewModeStore
- Modify: `apps/desktop/src/renderer/TerminalNode.tsx` — add colored badge to header

**Step 1: Add terminal selection on header click**

In `TerminalNode.tsx`, find the drag handle header div and add an onClick to select the terminal:

```tsx
import { useViewModeStore } from './stores/ViewModeStore';
import { getNodeTypeColor } from './components/EntityLegend';

// Inside the component, before the return:
const selectTerminal = useViewModeStore((s) => s.selectTerminal);
const addLog = useViewModeStore((s) => s.addLog);

// Update the header div:
<div className="terminal-node-header" style={{ cursor: 'grab' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <span
      style={{
        width: 8, height: 8, borderRadius: '50%',
        background: getNodeTypeColor('terminal'),
        flexShrink: 0,
      }}
    />
    <span className="terminal-node-title">{nodeData.label || nodeData.command || 'Terminal'}</span>
  </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <button
      className="terminal-panel-btn"
      onClick={(e) => { e.stopPropagation(); selectTerminal(terminalId); }}
      title="Open in side panel"
      style={{ background: 'transparent', border: 'none', color: '#4a9eff', cursor: 'pointer', fontSize: 11 }}
    >
      ⬜
    </button>
    <span className="terminal-node-id">{terminalId.slice(-8)}</span>
  </div>
</div>
```

**Step 2: Add system log events for terminal lifecycle**

In the terminal creation section of TerminalNode.tsx, add log calls:

```typescript
// After creating terminal process:
addLog(`Terminal created: ${terminalId.slice(-8)}`, 'info');

// In the exit handler:
addLog(`Terminal exited: ${terminalId.slice(-8)} (code ${code})`, code === 0 ? 'info' : 'warn');
```

**Step 3: Run all tests**

```bash
cd apps/desktop && npx vitest run
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: wire terminal node selection to split panel + system log events"
```

---

## Task 8: Terminal Count in HeaderBar

**Files:**
- Modify: `apps/desktop/src/renderer/App.tsx` — pass node count to SplitLayout
- Modify: `apps/desktop/src/renderer/Canvas.tsx` — expose node count via context or callback

**Step 1: Use a simple approach — count nodes via ViewModeStore**

Add a `terminalCount` field to ViewModeStore:

```typescript
// Add to ViewModeStore.ts:
terminalCount: 0,
setTerminalCount: (count: number) => set({ terminalCount: count }),
```

In Canvas.tsx, add an effect that updates the count when nodes change:

```tsx
const setTerminalCount = useViewModeStore((s) => s.setTerminalCount);

useEffect(() => {
  const count = nodes.filter((n) => n.type === 'terminal' || n.type === 'agent').length;
  setTerminalCount(count);
}, [nodes.length, setTerminalCount]);
```

Update HeaderBar to read from store:

```tsx
const terminalCount = useViewModeStore((s) => s.terminalCount);
```

**Step 2: Update tests**

Add to ViewModeStore.test.ts:

```typescript
it('should track terminal count', () => {
  useViewModeStore.getState().setTerminalCount(5);
  expect(useViewModeStore.getState().terminalCount).toBe(5);
});
```

**Step 3: Run all tests**

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: track and display terminal count in header bar"
```

---

## Task 9: Final Polish and Full E2E Verification

**Files:**
- Run all tests
- Run biome lint
- Run TypeScript type check
- Visual verification via Playwright

**Step 1: Full test suite**

```bash
cd ~/openclaw_workspace/termcanvas
npm run build --workspace=@termcanvas/shared
cd apps/desktop
npx vitest run
```

Expected: All tests pass (229 existing + ~16 new = ~245 total).

**Step 2: Lint**

```bash
cd ~/openclaw_workspace/termcanvas && npx biome check --write .
```

**Step 3: Type check**

```bash
cd apps/desktop && npx tsc -p tsconfig.main.json --noEmit
```

**Step 4: Playwright visual test**

```bash
NODE_PATH=$(npm root -g) node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check header bar exists
  const brand = await page.locator('.header-bar-brand').textContent();
  console.log('Brand:', brand);

  // Check view mode tabs
  const tabs = await page.locator('.header-bar-tab').allTextContents();
  console.log('Tabs:', tabs);

  // Check system log exists
  const logTitle = await page.locator('.system-log-title').textContent();
  console.log('Log title:', logTitle);

  // Screenshot
  await page.screenshot({ path: '/tmp/tc-mirofish-final.png' });

  // Click Split tab
  await page.locator('.header-bar-tab', { hasText: 'Split' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/tc-mirofish-split.png' });

  // Click Focus tab
  await page.locator('.header-bar-tab', { hasText: 'Focus' }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/tc-mirofish-focus.png' });

  console.log('ALL VISUAL TESTS PASSED');
  await browser.close();
})();
"
```

**Step 5: Commit and push**

```bash
git add -A && git commit -m "chore: full e2e verification of mirofish ui enhancement"
git push origin main
```

---

## Task Dependencies

```
Task 1 (ViewModeStore) ──┬──> Task 2 (HeaderBar)
                         ├──> Task 3 (SystemLog)
                         ├──> Task 4 (EntityLegend)
                         └──> Task 5 (TerminalPanel)
                                    │
Task 2 + 3 + 4 + 5 ────────> Task 6 (SplitLayout integration)
                                    │
                              Task 7 (Wire terminal selection)
                                    │
                              Task 8 (Terminal count)
                                    │
                              Task 9 (E2E verification)
```

**Tasks 2, 3, 4, 5 can be done in parallel** after Task 1. Tasks 6-9 are sequential.

## Verification Commands

After each task:

```bash
cd ~/openclaw_workspace/termcanvas/apps/desktop && npx vitest run
cd ~/openclaw_workspace/termcanvas && npx biome check --write .
```

After all tasks:

```bash
npm run build --workspace=@termcanvas/shared
cd apps/desktop && npx tsc -p tsconfig.main.json --noEmit
npx vitest run
```
