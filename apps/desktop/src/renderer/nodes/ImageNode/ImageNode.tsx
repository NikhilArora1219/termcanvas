/**
 * ImageNode — Image/diagram display tile on the canvas.
 * Supports: .png, .jpg, .gif, .webp, .bmp (raster via local-file://)
 *           .svg (inline SVG rendering for full fidelity)
 *           .drawio (draw.io XML — extracts embedded SVG or renders as diagram)
 */
import { Handle, type NodeProps, NodeResizer, Position } from '@xyflow/react';
import { useEffect, useState } from 'react';
import type { ImageNodeData } from '../schemas';
import './ImageNode.css';

function isSvgFile(filePath: string): boolean {
  return filePath.toLowerCase().endsWith('.svg');
}

function isDrawioFile(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return lower.endsWith('.drawio') || lower.endsWith('.drawio.xml');
}

/**
 * Extract SVG content from a draw.io XML file.
 * Draw.io files store diagram data as base64-encoded, deflated XML.
 * For display, we create a simple SVG placeholder with the diagram name.
 * Full rendering would require the draw.io renderer library.
 */
function extractDrawioPreview(xml: string, title: string): string {
  // Try to find embedded SVG in the drawio XML
  const svgMatch = xml.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) {
    return svgMatch[0];
  }

  // Extract diagram name from the XML
  const nameMatch = xml.match(/name="([^"]+)"/);
  const diagramName = nameMatch ? nameMatch[1] : title;

  // Count pages
  const pageCount = (xml.match(/<diagram/g) || []).length;

  // Create a preview SVG
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#1a1a2e" rx="8"/>
    <text x="200" y="130" text-anchor="middle" fill="#4a9eff" font-size="16" font-family="sans-serif">${diagramName}</text>
    <text x="200" y="160" text-anchor="middle" fill="#999" font-size="12" font-family="sans-serif">${pageCount} page${pageCount !== 1 ? 's' : ''} — Draw.io diagram</text>
    <text x="200" y="190" text-anchor="middle" fill="#666" font-size="11" font-family="sans-serif">Double-click to open in draw.io</text>
  </svg>`;
}

export function ImageNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as ImageNodeData;
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nodeData.filePath) return;

    const filePath = nodeData.filePath;

    if (isSvgFile(filePath) || isDrawioFile(filePath)) {
      // Read SVG/drawio as text and render inline
      window.navigatorAPI
        ?.readFile(filePath)
        .then((content) => {
          if (isDrawioFile(filePath)) {
            const preview = extractDrawioPreview(content, nodeData.title || 'Diagram');
            setSvgContent(preview);
          } else {
            // Sanitize SVG: remove script tags for safety
            const sanitized = content.replace(/<script[\s\S]*?<\/script>/gi, '');
            setSvgContent(sanitized);
          }
        })
        .catch(() => {
          setError('Failed to load file');
        });
    } else {
      // Raster images — use local-file:// protocol
      setImageSrc(`local-file://${encodeURIComponent(filePath)}`);
    }
  }, [nodeData.filePath, nodeData.title]);

  return (
    <div className={`image-node ${selected ? 'selected' : ''}`}>
      <NodeResizer
        minWidth={200}
        minHeight={150}
        isVisible={true}
        lineStyle={{ borderColor: 'transparent' }}
        handleStyle={{ width: 8, height: 8, borderRadius: '50%' }}
      />
      <Handle type="target" position={Position.Top} />
      <div className="image-node-header">
        <span className="image-node-badge">
          {isDrawioFile(nodeData.filePath) ? 'DIAGRAM' : 'IMAGE'}
        </span>
        <span className="image-node-title">{nodeData.title || 'Image'}</span>
      </div>
      <div className="image-node-body nodrag nowheel">
        {error ? (
          <div className="image-node-error">{error}</div>
        ) : svgContent ? (
          <div className="image-node-svg" dangerouslySetInnerHTML={{ __html: svgContent }} />
        ) : imageSrc ? (
          <img
            src={imageSrc}
            alt={nodeData.title}
            className="image-node-img"
            onError={() => setError('Failed to load image')}
          />
        ) : (
          <div className="image-node-placeholder">Loading...</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
