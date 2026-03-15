/**
 * Navigator Store — File tree state management.
 * Manages the file tree for the Navigator sidebar.
 * Lazy-loads directory contents on expand.
 */
import { create } from 'zustand';
import type { FileEntry, SortDirection, SortMode, ViewMode } from './types';

interface NavigatorState {
  rootPath: string | null;
  entries: FileEntry[];
  childEntries: Record<string, FileEntry[]>;
  expandedPaths: Set<string>;
  selectedPath: string | null;
  searchQuery: string;
  sortMode: SortMode;
  sortDirection: SortDirection;
  viewMode: ViewMode;
  isLoading: boolean;
  error: string | null;
  recentWorkspaces: Array<{ path: string; name: string }>;

  setRootPath: (path: string) => Promise<void>;
  toggleExpanded: (path: string) => Promise<void>;
  setSelectedPath: (path: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSortMode: (mode: SortMode) => void;
  setSortDirection: (direction: SortDirection) => void;
  setViewMode: (mode: ViewMode) => void;
  refresh: () => Promise<void>;
  loadRecentWorkspaces: () => Promise<void>;
}

async function loadDirectory(dirPath: string): Promise<FileEntry[]> {
  if (!window.navigatorAPI) {
    throw new Error('Navigator API not available');
  }
  return window.navigatorAPI.readDirectory(dirPath);
}

export const useNavigatorStore = create<NavigatorState>((set, get) => ({
  rootPath: null,
  entries: [],
  childEntries: {},
  expandedPaths: new Set(),
  selectedPath: null,
  searchQuery: '',
  sortMode: 'name',
  sortDirection: 'asc',
  viewMode: 'tree',
  isLoading: false,
  error: null,
  recentWorkspaces: [],

  setRootPath: async (path: string) => {
    set({ isLoading: true, error: null, rootPath: path });
    try {
      const entries = await loadDirectory(path);
      set({
        entries,
        childEntries: {},
        expandedPaths: new Set(),
        selectedPath: null,
        isLoading: false,
      });
      // Save as recent workspace
      const name = path.split('/').pop() || path;
      window.recentWorkspacesAPI?.addWorkspace(path, { name });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  toggleExpanded: async (path: string) => {
    const { expandedPaths, childEntries } = get();
    const newExpanded = new Set(expandedPaths);

    if (newExpanded.has(path)) {
      newExpanded.delete(path);
      set({ expandedPaths: newExpanded });
    } else {
      newExpanded.add(path);
      set({ expandedPaths: newExpanded });

      if (!childEntries[path]) {
        try {
          const entries = await loadDirectory(path);
          set((state) => ({
            childEntries: { ...state.childEntries, [path]: entries },
          }));
        } catch (error: any) {
          console.error('[Navigator] Failed to load directory:', path, error);
        }
      }
    }
  },

  setSelectedPath: (path) => set({ selectedPath: path }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortMode: (mode) => set({ sortMode: mode }),
  setSortDirection: (direction) => set({ sortDirection: direction }),
  setViewMode: (mode) => set({ viewMode: mode }),

  refresh: async () => {
    const { rootPath } = get();
    if (rootPath) {
      await get().setRootPath(rootPath);
    }
  },

  loadRecentWorkspaces: async () => {
    try {
      const workspaces = await window.recentWorkspacesAPI?.getRecentWorkspaces(10);
      if (workspaces) {
        set({
          recentWorkspaces: workspaces.map((w) => ({
            path: w.path,
            name: w.name,
          })),
        });
      }
    } catch (error) {
      console.error('[Navigator] Failed to load recent workspaces:', error);
    }
  },
}));
