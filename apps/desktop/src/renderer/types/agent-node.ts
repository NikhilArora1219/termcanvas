/**
 * Agent Node Type Definitions
 *
 * Re-exports all agent node types from @termcanvas/shared.
 * This file is kept for backwards compatibility with existing imports.
 */

export type {
  AgentChatMessage,
  // Main node data
  AgentNodeData,
  // View types
  AgentNodeView,
  AgentProgress,
  // Title types
  AgentTitle,
  // Progress types
  BaseProgress,
  PercentageProgress,
  TodoItem,
  TodoListProgress,
} from '@termcanvas/shared';

export {
  // Helper functions
  createDefaultAgentTitle,
  createPercentageProgress,
  createTodoListProgress,
  getTodoListCompletionPercent,
  // Type guards
  isPercentageProgress,
  isTodoListProgress,
} from '@termcanvas/shared';
