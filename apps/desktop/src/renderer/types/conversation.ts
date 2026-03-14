/**
 * Conversation Type Definitions
 *
 * Re-exports conversation types from @termcanvas/shared.
 * This file is kept for backwards compatibility with existing imports.
 */

export type {
  AssistantMessageEntry,
  AssistantMessageGroup,
  // Message types
  ClaudeMessage,
  ConversationEntry,
  FileHistorySnapshotEntry,
  MessageContent,
  MessageGroup,
  // Entry types
  QueueOperationEntry,
  // Content types
  TextContent,
  ThinkingContent,
  ToolResultContent,
  ToolUseContent,
  UserMessageEntry,
  // Group types
  UserMessageGroup,
} from '@termcanvas/shared';

export {
  isAssistantMessageEntry,
  isFileHistorySnapshotEntry,
  isQueueOperationEntry,
  isTextContent,
  isThinkingContent,
  isToolResultContent,
  isToolUseContent,
  // Type guards
  isUserMessageEntry,
} from '@termcanvas/shared';
