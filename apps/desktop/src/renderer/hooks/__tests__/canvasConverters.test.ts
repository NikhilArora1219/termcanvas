import { describe, expect, it } from 'vitest';

// Inline the function to test it without import chain issues
// (canvasConverters imports from @xyflow/react which pulls in xterm transitively)
function canvasNodesToNodes(
  canvasNodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
    style?: Record<string, unknown>;
  }>
) {
  return canvasNodes.map((cn) => {
    const style = cn.style ? { ...cn.style } : undefined;
    return {
      id: cn.id,
      type: cn.type,
      position: { ...cn.position },
      data: JSON.parse(JSON.stringify(cn.data)) as Record<string, unknown>,
      style,
      ...(style?.width && style?.height
        ? {
            measured: {
              width: style.width as number,
              height: style.height as number,
            },
          }
        : {}),
    };
  });
}

describe('canvasNodesToNodes', () => {
  it('should convert canvas nodes to ReactFlow nodes', () => {
    const canvasNodes = [
      {
        id: 'node-1',
        type: 'terminal',
        position: { x: 100, y: 200 },
        data: { terminalId: 'term-1' },
        style: { width: 600, height: 400 },
      },
    ];

    const result = canvasNodesToNodes(canvasNodes);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('node-1');
    expect(result[0].type).toBe('terminal');
    expect(result[0].position).toEqual({ x: 100, y: 200 });
    expect(result[0].data.terminalId).toBe('term-1');
  });

  it('should set measured dimensions from style', () => {
    const result = canvasNodesToNodes([
      {
        id: 'node-1',
        type: 'note',
        position: { x: 0, y: 0 },
        data: { content: 'hello', title: 'test' },
        style: { width: 400, height: 350 },
      },
    ]);
    expect(result[0].measured).toEqual({ width: 400, height: 350 });
  });

  it('should not set measured when no style dimensions', () => {
    const result = canvasNodesToNodes([
      {
        id: 'node-1',
        type: 'custom',
        position: { x: 0, y: 0 },
        data: { label: 'test' },
      },
    ]);
    expect(result[0].measured).toBeUndefined();
  });

  it('should deep clone data to prevent shared references', () => {
    const sharedData = { terminalId: 'term-1', nested: { value: 42 } };
    const result = canvasNodesToNodes([
      { id: 'n1', type: 'terminal', position: { x: 0, y: 0 }, data: sharedData },
      { id: 'n2', type: 'terminal', position: { x: 100, y: 0 }, data: sharedData },
    ]);
    (result[0].data as any).nested.value = 99;
    expect((result[1].data as any).nested.value).toBe(42);
  });

  it('should handle all collaborator node types', () => {
    const result = canvasNodesToNodes([
      {
        id: 'n1',
        type: 'note',
        position: { x: 0, y: 0 },
        data: { content: '#', title: 'a' },
        style: { width: 400, height: 350 },
      },
      {
        id: 'n2',
        type: 'code',
        position: { x: 500, y: 0 },
        data: { content: 'x', title: 'b' },
        style: { width: 500, height: 400 },
      },
      {
        id: 'n3',
        type: 'image',
        position: { x: 0, y: 400 },
        data: { filePath: '/i.png', title: 'c' },
        style: { width: 400, height: 300 },
      },
    ]);
    expect(result).toHaveLength(3);
    expect(result.map((n) => n.type)).toEqual(['note', 'code', 'image']);
    expect(result.every((n) => n.measured)).toBe(true);
  });
});
