/**
 * FileTreeItem — Single file/folder row in the navigator tree.
 */
import type { FileEntry } from '../store/types';

interface FileTreeItemProps {
  entry: FileEntry;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  childItems?: FileEntry[];
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  onDragStart: (e: React.DragEvent, entry: FileEntry) => void;
  renderChildren?: (entries: FileEntry[], depth: number) => React.ReactNode;
}

const FILE_ICONS: Record<string, string> = {
  '.ts': '📄',
  '.tsx': '⚛️',
  '.js': '📄',
  '.jsx': '⚛️',
  '.py': '🐍',
  '.md': '📝',
  '.json': '📋',
  '.css': '🎨',
  '.html': '🌐',
  '.svg': '🖼️',
  '.drawio': '📐',
  '.png': '🖼️',
  '.jpg': '🖼️',
  '.gif': '🖼️',
  '.webp': '🖼️',
};

function getFileIcon(entry: FileEntry): string {
  if (entry.isDirectory) return '📁';
  return FILE_ICONS[entry.extension] ?? '📄';
}

export function FileTreeItem({
  entry,
  depth,
  isExpanded,
  isSelected,
  childItems,
  onToggle,
  onSelect,
  onDragStart,
  renderChildren,
}: FileTreeItemProps) {
  return (
    <>
      <div
        className={`nav-tree-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => {
          onSelect(entry.path);
          if (entry.isDirectory) {
            onToggle(entry.path);
          }
        }}
        draggable={!entry.isDirectory}
        onDragStart={(e) => onDragStart(e, entry)}
      >
        {entry.isDirectory && (
          <span className={`nav-tree-chevron ${isExpanded ? 'expanded' : ''}`}>▶</span>
        )}
        <span className="nav-tree-icon">{getFileIcon(entry)}</span>
        <span className="nav-tree-name">{entry.name}</span>
      </div>
      {entry.isDirectory && isExpanded && childItems && renderChildren?.(childItems, depth + 1)}
    </>
  );
}
