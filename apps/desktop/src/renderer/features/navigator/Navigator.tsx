/**
 * Navigator — File tree sidebar panel.
 *
 * Displays hierarchical file tree for the selected workspace.
 * Supports search, sort, drag-to-canvas.
 */
import { useCallback, useEffect, useState } from 'react';
import { FileTreeItem } from './components/FileTreeItem';
import { useNavigatorStore } from './store/navigatorStore';
import type { FileEntry } from './store/types';
import './Navigator.css';

interface NavigatorProps {
  onOpenDirectory: () => void;
}

export function Navigator({ onOpenDirectory }: NavigatorProps) {
  const {
    rootPath,
    entries,
    childEntries,
    expandedPaths,
    selectedPath,
    searchQuery,
    isLoading,
    error,
    recentWorkspaces,
    toggleExpanded,
    setSelectedPath,
    setSearchQuery,
    refresh,
    setRootPath,
    loadRecentWorkspaces,
  } = useNavigatorStore();

  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);

  useEffect(() => {
    loadRecentWorkspaces();
  }, [loadRecentWorkspaces]);

  const handleDragStart = useCallback((e: React.DragEvent, entry: FileEntry) => {
    e.dataTransfer.setData('application/termcanvas-file', JSON.stringify(entry));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const filteredEntries = searchQuery
    ? entries.filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : entries;

  const renderEntries = useCallback(
    (items: FileEntry[], depth: number) => {
      return items.map((entry) => (
        <FileTreeItem
          key={entry.path}
          entry={entry}
          depth={depth}
          isExpanded={expandedPaths.has(entry.path)}
          isSelected={selectedPath === entry.path}
          childItems={childEntries[entry.path]}
          onToggle={toggleExpanded}
          onSelect={setSelectedPath}
          onDragStart={handleDragStart}
          renderChildren={renderEntries}
        />
      ));
    },
    [expandedPaths, selectedPath, childEntries, toggleExpanded, setSelectedPath, handleDragStart]
  );

  if (!rootPath) {
    return (
      <div className="navigator-empty">
        <p>No workspace open</p>
        <button className="navigator-open-btn" onClick={onOpenDirectory}>
          Open Folder
        </button>
        {recentWorkspaces.length > 0 && (
          <div className="navigator-recent">
            <span className="navigator-recent-label">Recent</span>
            {recentWorkspaces.map((w) => (
              <button
                key={w.path}
                className="navigator-recent-item"
                onClick={() => setRootPath(w.path)}
              >
                {w.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="navigator">
      <div className="navigator-header">
        <div className="navigator-workspace-selector">
          <button
            className="navigator-workspace-btn"
            onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
          >
            {rootPath.split('/').pop()} ▾
          </button>
          {showWorkspaceDropdown && (
            <div className="navigator-workspace-dropdown">
              {recentWorkspaces.map((w) => (
                <div
                  key={w.path}
                  className={`navigator-workspace-option ${w.path === rootPath ? 'active' : ''}`}
                  onClick={() => {
                    setRootPath(w.path);
                    setShowWorkspaceDropdown(false);
                  }}
                >
                  {w.name}
                </div>
              ))}
              <div className="navigator-workspace-divider" />
              <div
                className="navigator-workspace-option"
                onClick={() => {
                  onOpenDirectory();
                  setShowWorkspaceDropdown(false);
                }}
              >
                Open Folder...
              </div>
            </div>
          )}
        </div>
        <button className="navigator-action" onClick={refresh} title="Refresh">
          ↻
        </button>
        <button className="navigator-action" onClick={onOpenDirectory} title="Open folder">
          +
        </button>
      </div>
      <div className="navigator-search">
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="navigator-search-input"
        />
      </div>
      <div className="navigator-tree">
        {isLoading && <div className="navigator-loading">Loading...</div>}
        {error && <div className="navigator-error">{error}</div>}
        {!isLoading && !error && renderEntries(filteredEntries, 0)}
      </div>
    </div>
  );
}
