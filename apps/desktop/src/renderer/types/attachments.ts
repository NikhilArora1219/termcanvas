/**
 * Attachment Type Definitions
 *
 * Re-exports all attachment types from @termcanvas/shared.
 * This file is kept for backwards compatibility with existing imports.
 */

export type {
  BaseAttachment,
  LinearIssueAttachment,
  TerminalAttachment,
  WorkspaceMetadataAttachment,
} from '@termcanvas/shared';

export {
  createLinearIssueAttachment,
  createWorkspaceMetadataAttachment,
  isLinearIssueAttachment,
  isWorkspaceMetadataAttachment,
} from '@termcanvas/shared';
