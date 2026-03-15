/**
 * Canvas Actions Hook
 *
 * Provides actions for adding different types of nodes to the canvas.
 * Wraps CanvasNodeService with React state management.
 */

import type { Node } from '@xyflow/react';
import { useReactFlow } from '@xyflow/react';
import { useCallback } from 'react';
import { type CreateAgentOptions, canvasNodeService } from '../../../services/CanvasNodeService';

// =============================================================================
// Types
// =============================================================================

/**
 * Return type for useCanvasActions hook
 */
export interface UseCanvasActionsReturn {
  /** Add an agent node to the canvas */
  addAgentNode: (position?: { x: number; y: number }) => void;
  /** Add a terminal node to the canvas */
  addTerminalNode: (position?: { x: number; y: number }) => void;
  /** Add a terminal node with a specific command */
  addCommandTerminal: (
    command: string,
    label?: string,
    cwd?: string,
    position?: { x: number; y: number }
  ) => void;
  /** Add multiple terminal nodes in a grid layout */
  addTerminalGrid: (
    commands: Array<{ command?: string; label?: string; cwd?: string }>,
    position?: { x: number; y: number }
  ) => void;
  /** Add a starter node to the canvas */
  addStarterNode: (position?: { x: number; y: number }) => void;
  /** Add a Claude Code terminal node (auto-starts claude command) */
  addClaudeCodeTerminal: (position?: { x: number; y: number }) => void;
  /** Add a browser node to the canvas */
  addBrowserNode: (position?: { x: number; y: number }) => void;
  /** Create an agent node with modal data (for programmatic creation) */
  createAgentWithData: (options: Omit<CreateAgentOptions, 'screenToFlowPosition'>) => void;
  /** Add a note node to the canvas */
  addNoteNode: (position?: { x: number; y: number }) => void;
  /** Add a code node to the canvas */
  addCodeNode: (position?: { x: number; y: number }) => void;
  /** Add a file-backed node (auto-detects type from extension) */
  addFileNode: (filePath: string, content: string, position?: { x: number; y: number }) => void;
}

/**
 * Input parameters for useCanvasActions hook
 */
export interface UseCanvasActionsInput {
  /** Function to update nodes state */
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  /** Current context menu position (if open) */
  contextMenu: { x: number; y: number } | null;
  /** Function to close context menu */
  closeContextMenu: () => void;
  /** Locked folder path from canvas settings */
  lockedFolderPath?: string | null;
  /** Callback when agent modal should be shown */
  onShowAgentModal?: (position: { x: number; y: number }) => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Hook for canvas node actions
 *
 * @example
 * ```tsx
 * const {
 *   addAgentNode,
 *   addTerminalNode,
 *   addConversationNode,
 * } = useCanvasActions({
 *   setNodes,
 *   contextMenu,
 *   closeContextMenu: () => setContextMenu(null),
 *   lockedFolderPath,
 * });
 *
 * // Add terminal at context menu position
 * addTerminalNode();
 *
 * // Add agent at specific position
 * addAgentNode({ x: 100, y: 200 });
 * ```
 */
export function useCanvasActions({
  setNodes,
  contextMenu,
  closeContextMenu,
  lockedFolderPath,
  onShowAgentModal,
}: UseCanvasActionsInput): UseCanvasActionsReturn {
  const { screenToFlowPosition } = useReactFlow();

  /**
   * Add an agent node (shows modal first if callback provided)
   */
  const addAgentNode = useCallback(
    (position?: { x: number; y: number }) => {
      // Calculate position
      let nodePosition = position;

      if (!nodePosition && contextMenu) {
        nodePosition = screenToFlowPosition({
          x: contextMenu.x,
          y: contextMenu.y,
        });
      }

      if (!nodePosition) {
        nodePosition = screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
      }

      // Always show modal - gitInfo is required for agent creation
      if (onShowAgentModal) {
        onShowAgentModal(nodePosition);
        closeContextMenu();
        return;
      }

      // Modal is required for agent creation (gitInfo validation)
      console.warn(
        '[useCanvasActions] addAgentNode called without onShowAgentModal - cannot create agent without git validation'
      );
      closeContextMenu();
    },
    [contextMenu, screenToFlowPosition, closeContextMenu, onShowAgentModal]
  );

  /**
   * Create an agent node with modal data (for use after modal confirmation)
   */
  const createAgentWithData = useCallback(
    (options: Omit<CreateAgentOptions, 'screenToFlowPosition'>) => {
      const newNode = canvasNodeService.createAgentNode({
        ...options,
        contextMenuPosition: null,
        screenToFlowPosition,
        lockedFolderPath: options.lockedFolderPath ?? lockedFolderPath,
      });

      setNodes((nds) => [...nds, newNode]);
      closeContextMenu();
    },
    [screenToFlowPosition, setNodes, closeContextMenu, lockedFolderPath]
  );

  /**
   * Add a terminal node
   */
  const addTerminalNode = useCallback(
    (position?: { x: number; y: number }) => {
      const newNode = canvasNodeService.createTerminalNode({
        position,
        contextMenuPosition: contextMenu,
        screenToFlowPosition,
      });

      setNodes((nds) => [...nds, newNode]);
      closeContextMenu();
    },
    [contextMenu, screenToFlowPosition, setNodes, closeContextMenu]
  );

  /**
   * Add a starter node
   */
  const addStarterNode = useCallback(
    (position?: { x: number; y: number }) => {
      const newNode = canvasNodeService.createStarterNode({
        position,
        contextMenuPosition: contextMenu,
        screenToFlowPosition,
      });

      setNodes((nds) => [...nds, newNode]);
      closeContextMenu();
    },
    [contextMenu, screenToFlowPosition, setNodes, closeContextMenu]
  );

  /**
   * Add a Claude Code terminal node
   */
  const addClaudeCodeTerminal = useCallback(
    (position?: { x: number; y: number }) => {
      const newNode = canvasNodeService.createClaudeCodeTerminalNode({
        position,
        contextMenuPosition: contextMenu,
        screenToFlowPosition,
      });

      setNodes((nds) => [...nds, newNode]);
      closeContextMenu();
    },
    [contextMenu, screenToFlowPosition, setNodes, closeContextMenu]
  );

  /**
   * Add a browser node
   */
  const addBrowserNode = useCallback(
    (position?: { x: number; y: number }) => {
      const newNode = canvasNodeService.createBrowserNode({
        position,
        contextMenuPosition: contextMenu,
        screenToFlowPosition,
      });

      setNodes((nds) => [...nds, newNode]);
      closeContextMenu();
    },
    [contextMenu, screenToFlowPosition, setNodes, closeContextMenu]
  );

  /**
   * Add a terminal node with a specific command
   */
  const addCommandTerminal = useCallback(
    (command: string, label?: string, cwd?: string, position?: { x: number; y: number }) => {
      const newNode = canvasNodeService.createTerminalNode({
        position,
        contextMenuPosition: contextMenu,
        screenToFlowPosition,
        command,
        label,
        cwd,
      });

      setNodes((nds) => [...nds, newNode]);
      closeContextMenu();
    },
    [contextMenu, screenToFlowPosition, setNodes, closeContextMenu]
  );

  /**
   * Add multiple terminal nodes in a grid layout
   */
  const addTerminalGrid = useCallback(
    (
      commands: Array<{ command?: string; label?: string; cwd?: string }>,
      position?: { x: number; y: number }
    ) => {
      let startPosition = position;

      if (!startPosition && contextMenu) {
        startPosition = screenToFlowPosition({
          x: contextMenu.x,
          y: contextMenu.y,
        });
      }

      if (!startPosition) {
        startPosition = screenToFlowPosition({
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        });
      }

      const newNodes = canvasNodeService.createTerminalNodesGrid({
        commands,
        startPosition,
      });

      setNodes((nds) => [...nds, ...newNodes]);
      closeContextMenu();
    },
    [contextMenu, screenToFlowPosition, setNodes, closeContextMenu]
  );

  /**
   * Add a note node
   */
  const addNoteNode = useCallback(
    (position?: { x: number; y: number }) => {
      const newNode = canvasNodeService.createNoteNode({
        position,
        contextMenuPosition: contextMenu,
        screenToFlowPosition,
      });
      setNodes((nds) => [...nds, newNode]);
      closeContextMenu();
    },
    [contextMenu, screenToFlowPosition, setNodes, closeContextMenu]
  );

  /**
   * Add a code node
   */
  const addCodeNode = useCallback(
    (position?: { x: number; y: number }) => {
      const newNode = canvasNodeService.createCodeNode({
        position,
        contextMenuPosition: contextMenu,
        screenToFlowPosition,
        content: '// Start coding here...\n',
        title: 'Untitled',
      });
      setNodes((nds) => [...nds, newNode]);
      closeContextMenu();
    },
    [contextMenu, screenToFlowPosition, setNodes, closeContextMenu]
  );

  /**
   * Add a file-backed node (auto-detects type from extension)
   */
  const addFileNode = useCallback(
    (filePath: string, content: string, position?: { x: number; y: number }) => {
      const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
      const fileName = filePath.split('/').pop() ?? filePath;
      const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp'];
      const mdExts = ['.md', '.mdx', '.markdown'];

      let newNode: Node;

      if (imageExts.includes(ext)) {
        newNode = canvasNodeService.createImageNode({
          position,
          contextMenuPosition: contextMenu,
          screenToFlowPosition,
          filePath,
          title: fileName,
        });
      } else if (mdExts.includes(ext)) {
        newNode = canvasNodeService.createNoteNode({
          position,
          contextMenuPosition: contextMenu,
          screenToFlowPosition,
          filePath,
          content,
          title: fileName,
        });
      } else {
        newNode = canvasNodeService.createCodeNode({
          position,
          contextMenuPosition: contextMenu,
          screenToFlowPosition,
          filePath,
          content,
          title: fileName,
        });
      }

      setNodes((nds) => [...nds, newNode]);
      closeContextMenu();
    },
    [contextMenu, screenToFlowPosition, setNodes, closeContextMenu]
  );

  return {
    addAgentNode,
    addTerminalNode,
    addCommandTerminal,
    addTerminalGrid,
    addStarterNode,
    addClaudeCodeTerminal,
    addBrowserNode,
    createAgentWithData,
    addNoteNode,
    addCodeNode,
    addFileNode,
  };
}
