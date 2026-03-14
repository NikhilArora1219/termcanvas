/**
 * Database Type Definitions
 *
 * Re-exports canvas and node types from @termcanvas/shared.
 * This file is kept for backwards compatibility with existing imports.
 */

// Re-export AgentNodeData for convenience (also available from agent-node types)
// Re-export attachment types used in node data
export type {
  AgentNodeData,
  CanvasEdge,
  CanvasMetadata,
  CanvasNode,
  // Canvas types
  CanvasNodeType,
  CanvasState,
  CustomNodeData,
  NodeData,
  TerminalAttachment,
  // Node data types
  TerminalNodeData,
  Viewport,
} from '@termcanvas/shared';
export {
  // Type guards
  isAgentNodeData,
  isTerminalNodeData,
} from '@termcanvas/shared';
