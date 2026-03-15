/**
 * Canvas Context Menu Component
 *
 * Right-click menu for adding nodes to the canvas.
 */
import { useCallback, useState } from 'react';
import type { UseCanvasActionsReturn, UseContextMenuReturn } from '../../../hooks';

export interface ContextMenuProps {
  contextMenuState: UseContextMenuReturn;
  canvasActions: UseCanvasActionsReturn;
  onDeleteNode?: (nodeId: string) => void;
}

export function ContextMenu({ contextMenuState, canvasActions, onDeleteNode }: ContextMenuProps) {
  const [showSpawnModal, setShowSpawnModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  if (!contextMenuState.contextMenu && !showSpawnModal && !showBulkModal) return null;

  const isMac = navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;

  return (
    <>
      {contextMenuState.contextMenu && !showSpawnModal && !showBulkModal && (
        <>
          <div className="context-menu-overlay" onClick={contextMenuState.closeContextMenu} />
          <div
            ref={contextMenuState.contextMenuRef}
            className="context-menu"
            style={{
              position: 'fixed',
              top: contextMenuState.contextMenu.y,
              left: contextMenuState.contextMenu.x,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="context-menu-item" onClick={() => canvasActions.addTerminalNode()}>
              <span className="context-menu-label">Quick Terminal</span>
              <span className="context-menu-shortcut">{isMac ? '⌘K' : 'Ctrl+K'}</span>
            </div>
            <div className="context-menu-item" onClick={() => setShowSpawnModal(true)}>
              <span className="context-menu-label">Spawn Command...</span>
              <span className="context-menu-shortcut">{isMac ? '⇧⌘K' : 'Ctrl+Shift+K'}</span>
            </div>
            <div className="context-menu-item" onClick={() => setShowBulkModal(true)}>
              <span className="context-menu-label">Spawn Multiple...</span>
            </div>
            <div className="context-menu-divider" />
            <div className="context-menu-item" onClick={() => canvasActions.addNoteNode()}>
              <span className="context-menu-label">Add Note</span>
              <span className="context-menu-shortcut">{isMac ? '⇧⌘N' : 'Ctrl+Shift+N'}</span>
            </div>
            <div className="context-menu-item" onClick={() => canvasActions.addCodeNode()}>
              <span className="context-menu-label">Add Code</span>
              <span className="context-menu-shortcut">{isMac ? '⇧⌘C' : 'Ctrl+Shift+C'}</span>
            </div>
            <div className="context-menu-divider" />
            <div className="context-menu-item" onClick={() => canvasActions.addAgentNode()}>
              <span className="context-menu-label">Add Agent</span>
              <span className="context-menu-shortcut">{isMac ? '⌘T' : 'Ctrl+T'}</span>
            </div>
            <div className="context-menu-divider" />
            <div
              className="context-menu-item highlight"
              onClick={() => canvasActions.addStarterNode()}
            >
              <span className="context-menu-label">New Conversation</span>
              <span className="context-menu-shortcut">{isMac ? '⌘N' : 'Ctrl+N'}</span>
            </div>
            {contextMenuState.contextNodeId && onDeleteNode && (
              <>
                <div className="context-menu-divider" />
                <div
                  className="context-menu-item danger"
                  onClick={() => {
                    onDeleteNode(contextMenuState.contextNodeId!);
                    contextMenuState.closeContextMenu();
                  }}
                >
                  <span className="context-menu-label">Close</span>
                  <span className="context-menu-shortcut">⌫</span>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {showSpawnModal && (
        <SpawnCommandModal
          onSpawn={(command, label, cwd) => {
            canvasActions.addCommandTerminal(command, label, cwd);
            setShowSpawnModal(false);
          }}
          onClose={() => {
            setShowSpawnModal(false);
            contextMenuState.closeContextMenu();
          }}
        />
      )}

      {showBulkModal && (
        <BulkSpawnModal
          onSpawn={(commands) => {
            canvasActions.addTerminalGrid(commands);
            setShowBulkModal(false);
          }}
          onClose={() => {
            setShowBulkModal(false);
            contextMenuState.closeContextMenu();
          }}
        />
      )}
    </>
  );
}

// =============================================================================
// Spawn Command Modal
// =============================================================================

interface SpawnCommandModalProps {
  onSpawn: (command: string, label?: string, cwd?: string) => void;
  onClose: () => void;
}

function SpawnCommandModal({ onSpawn, onClose }: SpawnCommandModalProps) {
  const [command, setCommand] = useState('');
  const [label, setLabel] = useState('');
  const [cwd, setCwd] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!command.trim()) return;
      onSpawn(command.trim(), label.trim() || undefined, cwd.trim() || undefined);
    },
    [command, label, cwd, onSpawn]
  );

  return (
    <>
      <div className="context-menu-overlay" onClick={onClose} />
      <div
        className="spawn-modal"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          background: 'var(--color-bg-secondary, #1a1a2e)',
          border: '1px solid var(--color-border, #333)',
          borderRadius: '12px',
          padding: '24px',
          minWidth: '400px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <h3
          style={{
            margin: '0 0 16px 0',
            color: 'var(--color-text-primary, #e0e0e0)',
            fontSize: '16px',
          }}
        >
          Spawn Command
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                color: 'var(--color-text-secondary, #999)',
                fontSize: '12px',
              }}
            >
              Command *
            </label>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="claude, opencode, python3, htop..."
              autoFocus
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--color-bg-primary, #0d0d1a)',
                border: '1px solid var(--color-border, #333)',
                borderRadius: '6px',
                color: 'var(--color-text-primary, #e0e0e0)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                color: 'var(--color-text-secondary, #999)',
                fontSize: '12px',
              }}
            >
              Label (optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="My Agent, Test Runner..."
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--color-bg-primary, #0d0d1a)',
                border: '1px solid var(--color-border, #333)',
                borderRadius: '6px',
                color: 'var(--color-text-primary, #e0e0e0)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '4px',
                color: 'var(--color-text-secondary, #999)',
                fontSize: '12px',
              }}
            >
              Working Directory (optional)
            </label>
            <input
              type="text"
              value={cwd}
              onChange={(e) => setCwd(e.target.value)}
              placeholder="/Users/niarora/projects/myapp"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--color-bg-primary, #0d0d1a)',
                border: '1px solid var(--color-border, #333)',
                borderRadius: '6px',
                color: 'var(--color-text-primary, #e0e0e0)',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={buttonStyle}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={!command.trim()}
              style={{ ...buttonStyle, ...primaryButtonStyle, opacity: command.trim() ? 1 : 0.5 }}
            >
              Spawn
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// =============================================================================
// Bulk Spawn Modal
// =============================================================================

interface BulkSpawnModalProps {
  onSpawn: (commands: Array<{ command?: string; label?: string; cwd?: string }>) => void;
  onClose: () => void;
}

function BulkSpawnModal({ onSpawn, onClose }: BulkSpawnModalProps) {
  const [count, setCount] = useState(4);
  const [command, setCommand] = useState('bash');
  const [mode, setMode] = useState<'same' | 'different'>('same');
  const [commandList, setCommandList] = useState('claude\nopencode\nbash\npython3');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (mode === 'same') {
        const commands = Array.from({ length: count }, (_, i) => ({
          command: command.trim() || undefined,
          label: `Terminal ${i + 1}`,
        }));
        onSpawn(commands);
      } else {
        const lines = commandList.split('\n').filter((l) => l.trim());
        const commands = lines.map((line, i) => ({
          command: line.trim(),
          label: `Terminal ${i + 1}`,
        }));
        onSpawn(commands);
      }
    },
    [mode, count, command, commandList, onSpawn]
  );

  const terminalCount =
    mode === 'same' ? count : commandList.split('\n').filter((l) => l.trim()).length;

  return (
    <>
      <div className="context-menu-overlay" onClick={onClose} />
      <div
        className="spawn-modal"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          background: 'var(--color-bg-secondary, #1a1a2e)',
          border: '1px solid var(--color-border, #333)',
          borderRadius: '12px',
          padding: '24px',
          minWidth: '420px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <h3
          style={{
            margin: '0 0 16px 0',
            color: 'var(--color-text-primary, #e0e0e0)',
            fontSize: '16px',
          }}
        >
          Spawn Multiple Terminals
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setMode('same')}
              style={{ ...tabStyle, ...(mode === 'same' ? activeTabStyle : {}) }}
            >
              Same Command
            </button>
            <button
              type="button"
              onClick={() => setMode('different')}
              style={{ ...tabStyle, ...(mode === 'different' ? activeTabStyle : {}) }}
            >
              Different Commands
            </button>
          </div>

          {mode === 'same' ? (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Count (1-20)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) =>
                    setCount(Math.max(1, Math.min(20, Number.parseInt(e.target.value) || 1)))
                  }
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Command</label>
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="bash"
                  style={inputStyle}
                />
              </div>
            </>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Commands (one per line)</label>
              <textarea
                value={commandList}
                onChange={(e) => setCommandList(e.target.value)}
                placeholder={'claude\nopencode\nbash\npython3'}
                rows={6}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }}
              />
            </div>
          )}

          <div
            style={{
              marginBottom: '16px',
              color: 'var(--color-text-secondary, #999)',
              fontSize: '12px',
            }}
          >
            Will create {terminalCount} terminal{terminalCount !== 1 ? 's' : ''} in a{' '}
            {Math.ceil(Math.sqrt(terminalCount))}x
            {Math.ceil(terminalCount / Math.ceil(Math.sqrt(terminalCount)))} grid
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={buttonStyle}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={terminalCount === 0}
              style={{
                ...buttonStyle,
                ...primaryButtonStyle,
                opacity: terminalCount > 0 ? 1 : 0.5,
              }}
            >
              Spawn {terminalCount} Terminal{terminalCount !== 1 ? 's' : ''}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// =============================================================================
// Shared Styles
// =============================================================================

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: 'var(--color-bg-primary, #0d0d1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: '6px',
  color: 'var(--color-text-primary, #e0e0e0)',
  fontSize: '13px',
  cursor: 'pointer',
};

const primaryButtonStyle: React.CSSProperties = {
  background: 'var(--color-accent, #4a9eff)',
  border: '1px solid var(--color-accent, #4a9eff)',
  color: '#fff',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'var(--color-bg-primary, #0d0d1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: '6px',
  color: 'var(--color-text-primary, #e0e0e0)',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '4px',
  color: 'var(--color-text-secondary, #999)',
  fontSize: '12px',
};

const tabStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 12px',
  background: 'transparent',
  border: '1px solid var(--color-border, #333)',
  borderRadius: '6px',
  color: 'var(--color-text-secondary, #999)',
  fontSize: '12px',
  cursor: 'pointer',
};

const activeTabStyle: React.CSSProperties = {
  background: 'var(--color-bg-primary, #0d0d1a)',
  color: 'var(--color-text-primary, #e0e0e0)',
  borderColor: 'var(--color-accent, #4a9eff)',
};
