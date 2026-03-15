/**
 * ImageNode — Image display tile on the canvas.
 * Read-only. Supports drag from navigator for .png, .jpg, .svg, .gif, .webp.
 * Uses local-file:// custom protocol to bypass Electron security in dev mode.
 */
import { Handle, type NodeProps, Position } from '@xyflow/react';
import { useEffect, useState } from 'react';
import type { ImageNodeData } from '../schemas';
import './ImageNode.css';

export function ImageNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as ImageNodeData;
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nodeData.filePath) return;
    // Use custom protocol registered in main process to serve local files
    setImageSrc(`local-file://${encodeURIComponent(nodeData.filePath)}`);
  }, [nodeData.filePath]);

  return (
    <div className={`image-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="image-node-header">
        <span className="image-node-badge">IMAGE</span>
        <span className="image-node-title">{nodeData.title || 'Image'}</span>
      </div>
      <div className="image-node-body">
        {error ? (
          <div className="image-node-error">{error}</div>
        ) : imageSrc ? (
          <img
            src={imageSrc}
            alt={nodeData.title}
            className="image-node-img"
            onError={() => setError('Failed to load image')}
          />
        ) : (
          <div className="image-node-placeholder">No image</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
