import { beforeEach, describe, expect, it } from 'vitest';
import { useViewModeStore } from '../ViewModeStore';

describe('ViewModeStore', () => {
  beforeEach(() => {
    useViewModeStore.setState({
      viewMode: 'canvas',
      selectedTerminalId: null,
      systemLogs: [],
      terminalCount: 0,
    });
  });

  it('should default to canvas mode', () => {
    expect(useViewModeStore.getState().viewMode).toBe('canvas');
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

  it('should not change view mode when selecting terminal in split mode', () => {
    useViewModeStore.getState().setViewMode('split');
    useViewModeStore.getState().selectTerminal('terminal-xyz');
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

  it('should track terminal count', () => {
    useViewModeStore.getState().setTerminalCount(5);
    expect(useViewModeStore.getState().terminalCount).toBe(5);
  });
});
