import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockNavigatorAPI = {
  readDirectory: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  getFileInfo: vi.fn(),
  createDirectory: vi.fn(),
  renameFile: vi.fn(),
  deleteFile: vi.fn(),
  openDirectoryDialog: vi.fn(),
};

const mockRecentWorkspacesAPI = {
  addWorkspace: vi.fn(),
  getRecentWorkspaces: vi.fn().mockResolvedValue([]),
  removeWorkspace: vi.fn(),
  clearAll: vi.fn(),
  hasWorkspace: vi.fn(),
};

vi.stubGlobal('window', {
  navigatorAPI: mockNavigatorAPI,
  recentWorkspacesAPI: mockRecentWorkspacesAPI,
});

describe('navigatorStore', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(mockNavigatorAPI.readDirectory).mockReset();
    vi.mocked(mockRecentWorkspacesAPI.addWorkspace).mockReset();
    vi.mocked(mockRecentWorkspacesAPI.getRecentWorkspaces).mockReset().mockResolvedValue([]);
  });

  it('should initialize with no root path', async () => {
    const { useNavigatorStore } = await import('../store/navigatorStore');
    const state = useNavigatorStore.getState();
    expect(state.rootPath).toBeNull();
    expect(state.entries).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('should load directory entries when setRootPath is called', async () => {
    mockNavigatorAPI.readDirectory.mockResolvedValueOnce([
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
    ]);

    const { useNavigatorStore } = await import('../store/navigatorStore');
    await useNavigatorStore.getState().setRootPath('/project');

    const state = useNavigatorStore.getState();
    expect(state.rootPath).toBe('/project');
    expect(state.entries.length).toBe(2);
    expect(state.entries[0].name).toBe('src');
  });

  it('should expand a directory', async () => {
    mockNavigatorAPI.readDirectory
      .mockResolvedValueOnce([
        {
          name: 'src',
          path: '/project/src',
          isDirectory: true,
          size: 0,
          modifiedAt: '2026-01-01',
          extension: '',
        },
      ])
      .mockResolvedValueOnce([
        {
          name: 'index.ts',
          path: '/project/src/index.ts',
          isDirectory: false,
          size: 50,
          modifiedAt: '2026-01-01',
          extension: '.ts',
        },
      ]);

    const { useNavigatorStore } = await import('../store/navigatorStore');
    await useNavigatorStore.getState().setRootPath('/project');
    await useNavigatorStore.getState().toggleExpanded('/project/src');

    const state = useNavigatorStore.getState();
    expect(state.expandedPaths.has('/project/src')).toBe(true);
    expect(state.childEntries['/project/src']).toBeDefined();
    expect(state.childEntries['/project/src'].length).toBe(1);
  });

  it('should collapse a directory', async () => {
    mockNavigatorAPI.readDirectory
      .mockResolvedValueOnce([
        {
          name: 'src',
          path: '/project/src',
          isDirectory: true,
          size: 0,
          modifiedAt: '2026-01-01',
          extension: '',
        },
      ])
      .mockResolvedValueOnce([]);

    const { useNavigatorStore } = await import('../store/navigatorStore');
    await useNavigatorStore.getState().setRootPath('/project');
    await useNavigatorStore.getState().toggleExpanded('/project/src');
    await useNavigatorStore.getState().toggleExpanded('/project/src');

    const state = useNavigatorStore.getState();
    expect(state.expandedPaths.has('/project/src')).toBe(false);
  });

  it('should set search query', async () => {
    mockNavigatorAPI.readDirectory.mockResolvedValueOnce([
      {
        name: 'index.ts',
        path: '/project/index.ts',
        isDirectory: false,
        size: 50,
        modifiedAt: '2026-01-01',
        extension: '.ts',
      },
    ]);

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
