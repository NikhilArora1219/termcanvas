import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.stubGlobal('window', {
  electron: {
    ipcRenderer: {
      invoke: vi.fn(),
    },
  },
});

/**
 * Helper to mock IPC by channel name.
 * setRootPath calls both 'fs:readdir' and 'recent-workspaces:upsert',
 * so sequential mockResolvedValueOnce is unreliable.
 */
function mockIpc(responses: Record<string, any[]>) {
  const counters: Record<string, number> = {};
  vi.mocked(window.electron!.ipcRenderer.invoke).mockImplementation(
    async (channel: string, ..._args: any[]) => {
      if (!responses[channel]) return { success: true };
      counters[channel] = counters[channel] ?? 0;
      const result = responses[channel][counters[channel]] ?? { success: true };
      counters[channel]++;
      return result;
    }
  );
}

describe('navigatorStore', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(window.electron!.ipcRenderer.invoke).mockReset();
  });

  it('should initialize with no root path', async () => {
    const { useNavigatorStore } = await import('../store/navigatorStore');
    const state = useNavigatorStore.getState();
    expect(state.rootPath).toBeNull();
    expect(state.entries).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('should load directory entries when setRootPath is called', async () => {
    mockIpc({
      'fs:readdir': [
        {
          success: true,
          entries: [
            {
              name: 'src',
              path: '/project/src',
              isDirectory: true,
              size: 0,
              modifiedAt: '2026-01-01',
              extension: '',
            },
            {
              name: 'README.md',
              path: '/project/README.md',
              isDirectory: false,
              size: 100,
              modifiedAt: '2026-01-01',
              extension: '.md',
            },
          ],
        },
      ],
    });

    const { useNavigatorStore } = await import('../store/navigatorStore');
    await useNavigatorStore.getState().setRootPath('/project');

    const state = useNavigatorStore.getState();
    expect(state.rootPath).toBe('/project');
    expect(state.entries.length).toBe(2);
    expect(state.entries[0].name).toBe('src');
  });

  it('should expand a directory', async () => {
    mockIpc({
      'fs:readdir': [
        {
          success: true,
          entries: [
            {
              name: 'src',
              path: '/project/src',
              isDirectory: true,
              size: 0,
              modifiedAt: '2026-01-01',
              extension: '',
            },
          ],
        },
        {
          success: true,
          entries: [
            {
              name: 'index.ts',
              path: '/project/src/index.ts',
              isDirectory: false,
              size: 50,
              modifiedAt: '2026-01-01',
              extension: '.ts',
            },
          ],
        },
      ],
    });

    const { useNavigatorStore } = await import('../store/navigatorStore');
    await useNavigatorStore.getState().setRootPath('/project');
    await useNavigatorStore.getState().toggleExpanded('/project/src');

    const state = useNavigatorStore.getState();
    expect(state.expandedPaths.has('/project/src')).toBe(true);
    expect(state.childEntries['/project/src']).toBeDefined();
    expect(state.childEntries['/project/src'].length).toBe(1);
  });

  it('should collapse a directory', async () => {
    mockIpc({
      'fs:readdir': [
        {
          success: true,
          entries: [
            {
              name: 'src',
              path: '/project/src',
              isDirectory: true,
              size: 0,
              modifiedAt: '2026-01-01',
              extension: '',
            },
          ],
        },
        {
          success: true,
          entries: [],
        },
      ],
    });

    const { useNavigatorStore } = await import('../store/navigatorStore');
    await useNavigatorStore.getState().setRootPath('/project');
    await useNavigatorStore.getState().toggleExpanded('/project/src');
    await useNavigatorStore.getState().toggleExpanded('/project/src');

    const state = useNavigatorStore.getState();
    expect(state.expandedPaths.has('/project/src')).toBe(false);
  });

  it('should set search query', async () => {
    mockIpc({
      'fs:readdir': [
        {
          success: true,
          entries: [
            {
              name: 'index.ts',
              path: '/project/index.ts',
              isDirectory: false,
              size: 50,
              modifiedAt: '2026-01-01',
              extension: '.ts',
            },
          ],
        },
      ],
    });

    const { useNavigatorStore } = await import('../store/navigatorStore');
    await useNavigatorStore.getState().setRootPath('/project');
    useNavigatorStore.getState().setSearchQuery('index');

    const state = useNavigatorStore.getState();
    expect(state.searchQuery).toBe('index');
  });

  it('should set sort mode and direction', async () => {
    const { useNavigatorStore } = await import('../store/navigatorStore');
    useNavigatorStore.getState().setSortMode('modified');
    useNavigatorStore.getState().setSortDirection('desc');

    const state = useNavigatorStore.getState();
    expect(state.sortMode).toBe('modified');
    expect(state.sortDirection).toBe('desc');
  });

  it('should set view mode', async () => {
    const { useNavigatorStore } = await import('../store/navigatorStore');
    useNavigatorStore.getState().setViewMode('feed');

    const state = useNavigatorStore.getState();
    expect(state.viewMode).toBe('feed');
  });
});
