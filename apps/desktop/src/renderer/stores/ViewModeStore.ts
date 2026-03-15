/**
 * ViewMode Store
 *
 * Manages the split layout state: view mode (canvas/split/focus),
 * selected terminal for the right panel, and system log entries.
 */
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
  terminalCount: number;
  setViewMode: (mode: ViewMode) => void;
  selectTerminal: (terminalId: string | null) => void;
  addLog: (message: string, level: LogLevel) => void;
  setTerminalCount: (count: number) => void;
  getPanelWidths: () => { leftWidth: string; rightWidth: string };
}

const MAX_LOGS = 200;

export const useViewModeStore = create<ViewModeState>((set, get) => ({
  viewMode: 'canvas',
  selectedTerminalId: null,
  systemLogs: [],
  terminalCount: 0,

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

  setTerminalCount: (count) => set({ terminalCount: count }),

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
