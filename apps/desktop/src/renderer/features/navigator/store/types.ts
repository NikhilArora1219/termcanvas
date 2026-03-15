export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: string;
  extension: string;
}

export type SortMode = 'name' | 'modified' | 'created';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'tree' | 'feed';
