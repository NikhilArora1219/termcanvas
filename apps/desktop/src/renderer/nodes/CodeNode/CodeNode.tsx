/**
 * CodeNode — Syntax-highlighted code tile on the canvas.
 */
import { Handle, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { useCallback, useState } from 'react';
import type { CodeNodeData } from '../schemas';
import { getLanguageFromExtension, useCodeMirror } from './useCodeMirror';
import './CodeNode.css';

export function CodeNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as CodeNodeData;
  const { updateNodeData } = useReactFlow();
  const [content, setContent] = useState(nodeData.content ?? '');

  const language =
    nodeData.language ??
    (nodeData.filePath
      ? getLanguageFromExtension(nodeData.filePath.slice(nodeData.filePath.lastIndexOf('.')))
      : undefined);

  const handleChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      updateNodeData(id, { content: newContent });
    },
    [id, updateNodeData]
  );

  const handleSave = useCallback(() => {
    if (nodeData.filePath) {
      window.navigatorAPI?.writeFile(nodeData.filePath, content);
    }
  }, [nodeData.filePath, content]);

  const { containerRef } = useCodeMirror({
    content,
    language,
    readOnly: false,
    onChange: handleChange,
  });

  return (
    <div className={`code-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="code-node-header">
        <span className="code-node-badge">CODE</span>
        <span className="code-node-title">{nodeData.title || 'Untitled'}</span>
        {language && <span className="code-node-lang">{language}</span>}
        {nodeData.filePath && (
          <button className="code-node-save" onClick={handleSave} title="Save to file">
            Save
          </button>
        )}
      </div>
      <div className="code-node-body" ref={containerRef} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
