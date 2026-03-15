/**
 * NoteNode — Markdown content tile on the canvas.
 * Displays rendered markdown. Double-click to edit (textarea), blur/Esc to render.
 */
import { Handle, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { NoteNodeData } from '../schemas';
import './NoteNode.css';

export function NoteNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as NoteNodeData;
  const { updateNodeData } = useReactFlow();
  const [isEditing, setIsEditing] = useState(nodeData.isEditing ?? false);
  const [content, setContent] = useState(nodeData.content ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setContent(nodeData.content ?? '');
    }
  }, [nodeData.content, isEditing]);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    updateNodeData(id, { content, isEditing: false });
    if (nodeData.filePath) {
      window.navigatorAPI?.writeFile(nodeData.filePath, content);
    }
  }, [id, content, nodeData.filePath, updateNodeData]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSave();
      }
    },
    [handleSave]
  );

  return (
    <div className={`note-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="note-node-header">
        <span className="note-node-badge">NOTE</span>
        <span className="note-node-title">{nodeData.title || 'Untitled'}</span>
      </div>
      <div
        className="note-node-body"
        onDoubleClick={() => {
          setIsEditing(true);
          updateNodeData(id, { isEditing: true });
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="note-node-editor"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <div className="note-node-content">
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <span className="note-node-placeholder">Double-click to edit...</span>
            )}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
