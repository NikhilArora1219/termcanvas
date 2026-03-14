/**
 * JSON Canvas Export Service
 *
 * Exports TermCanvas canvas state to the JSON Canvas format (.canvas)
 * for interoperability with Obsidian and other tools.
 * Spec: https://jsoncanvas.org
 */

interface JsonCanvasNode {
  id: string;
  type: 'text' | 'link' | 'file' | 'group';
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  url?: string;
  color?: string;
}

interface JsonCanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: 'top' | 'right' | 'bottom' | 'left';
  toSide?: 'top' | 'right' | 'bottom' | 'left';
  label?: string;
}

interface JsonCanvas {
  nodes: JsonCanvasNode[];
  edges: JsonCanvasEdge[];
}

interface TermCanvasNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  measured?: { width?: number; height?: number };
  style?: { width?: number; height?: number };
  data?: Record<string, unknown>;
}

interface TermCanvasEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

/**
 * Convert TermCanvas nodes and edges to JSON Canvas format.
 * Terminal nodes become text nodes with metadata.
 * Agent nodes become text nodes with agent info.
 * Browser nodes become link nodes.
 */
export function exportToJsonCanvas(nodes: TermCanvasNode[], edges: TermCanvasEdge[]): JsonCanvas {
  const canvasNodes: JsonCanvasNode[] = nodes.map((node) => {
    const width = node.style?.width ?? node.measured?.width ?? 400;
    const height = node.style?.height ?? node.measured?.height ?? 300;
    const x = Math.round(node.position.x);
    const y = Math.round(node.position.y);

    if (node.type === 'browser') {
      const url = (node.data?.url as string) || '';
      return {
        id: node.id,
        type: 'link' as const,
        x,
        y,
        width,
        height,
        url,
      };
    }

    // Terminal and agent nodes become text nodes
    const label =
      (node.data?.label as string) || (node.data?.title as string) || node.type || 'node';
    const command = (node.data?.command as string) || '';
    const agentType = (node.data?.agentType as string) || '';
    const cwd = (node.data?.cwd as string) || (node.data?.workspacePath as string) || '';

    const lines: string[] = [`**${label}**`];
    if (node.type) lines.push(`Type: ${node.type}`);
    if (command) lines.push(`Command: \`${command}\``);
    if (agentType) lines.push(`Agent: ${agentType}`);
    if (cwd) lines.push(`Dir: ${cwd}`);

    return {
      id: node.id,
      type: 'text' as const,
      x,
      y,
      width,
      height,
      text: lines.join('\n'),
      color: (node.data?.color as string) || undefined,
    };
  });

  const canvasEdges: JsonCanvasEdge[] = edges.map((edge) => ({
    id: edge.id,
    fromNode: edge.source,
    toNode: edge.target,
    label: edge.label || undefined,
  }));

  return { nodes: canvasNodes, edges: canvasEdges };
}

/**
 * Import nodes from a JSON Canvas file.
 * Returns TermCanvas-compatible node objects.
 */
export function importFromJsonCanvas(canvas: JsonCanvas): {
  nodes: TermCanvasNode[];
  edges: TermCanvasEdge[];
} {
  const nodes: TermCanvasNode[] = canvas.nodes.map((node) => {
    if (node.type === 'link') {
      return {
        id: node.id,
        type: 'browser',
        position: { x: node.x, y: node.y },
        style: { width: node.width, height: node.height },
        data: { url: node.url, browserId: `browser-${crypto.randomUUID()}` },
      };
    }

    // Default: text/file/group nodes become custom nodes
    return {
      id: node.id,
      type: 'custom',
      position: { x: node.x, y: node.y },
      style: { width: node.width, height: node.height },
      data: { label: node.text || '', color: node.color },
    };
  });

  const edges: TermCanvasEdge[] = canvas.edges.map((edge) => ({
    id: edge.id,
    source: edge.fromNode,
    target: edge.toNode,
    label: edge.label,
  }));

  return { nodes, edges };
}
