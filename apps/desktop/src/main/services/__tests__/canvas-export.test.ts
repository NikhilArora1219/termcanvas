import { describe, expect, it } from 'vitest';
import { exportToJsonCanvas, importFromJsonCanvas } from '../canvas-export';

describe('canvas-export', () => {
  describe('exportToJsonCanvas', () => {
    it('should export terminal nodes as text nodes', () => {
      const result = exportToJsonCanvas(
        [
          {
            id: 'node-1',
            type: 'terminal',
            position: { x: 100, y: 200 },
            style: { width: 600, height: 400 },
            data: { terminalId: 't1', command: 'claude', label: 'My Agent' },
          },
        ],
        []
      );

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].type).toBe('text');
      expect(result.nodes[0].x).toBe(100);
      expect(result.nodes[0].y).toBe(200);
      expect(result.nodes[0].width).toBe(600);
      expect(result.nodes[0].height).toBe(400);
      expect(result.nodes[0].text).toContain('**My Agent**');
      expect(result.nodes[0].text).toContain('Command: `claude`');
      expect(result.nodes[0].text).toContain('Type: terminal');
    });

    it('should export agent nodes with agent type info', () => {
      const result = exportToJsonCanvas(
        [
          {
            id: 'node-2',
            type: 'agent',
            position: { x: 0, y: 0 },
            style: { width: 500, height: 450 },
            data: {
              agentType: 'claude_code',
              title: 'Claude Agent',
              workspacePath: '/projects/app',
            },
          },
        ],
        []
      );

      expect(result.nodes[0].text).toContain('**Claude Agent**');
      expect(result.nodes[0].text).toContain('Agent: claude_code');
      expect(result.nodes[0].text).toContain('Dir: /projects/app');
    });

    it('should export browser nodes as link nodes', () => {
      const result = exportToJsonCanvas(
        [
          {
            id: 'node-3',
            type: 'browser',
            position: { x: 500, y: 0 },
            style: { width: 800, height: 600 },
            data: { url: 'https://example.com' },
          },
        ],
        []
      );

      expect(result.nodes[0].type).toBe('link');
      expect(result.nodes[0].url).toBe('https://example.com');
    });

    it('should export edges', () => {
      const result = exportToJsonCanvas(
        [],
        [{ id: 'e1', source: 'node-1', target: 'node-2', label: 'pipes to' }]
      );

      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].id).toBe('e1');
      expect(result.edges[0].fromNode).toBe('node-1');
      expect(result.edges[0].toNode).toBe('node-2');
      expect(result.edges[0].label).toBe('pipes to');
    });

    it('should round positions to integers', () => {
      const result = exportToJsonCanvas(
        [
          {
            id: 'n1',
            type: 'terminal',
            position: { x: 100.7, y: 200.3 },
            style: { width: 600, height: 400 },
            data: {},
          },
        ],
        []
      );

      expect(result.nodes[0].x).toBe(101);
      expect(result.nodes[0].y).toBe(200);
    });

    it('should handle missing style with defaults', () => {
      const result = exportToJsonCanvas(
        [{ id: 'n1', type: 'terminal', position: { x: 0, y: 0 }, data: {} }],
        []
      );

      expect(result.nodes[0].width).toBe(400);
      expect(result.nodes[0].height).toBe(300);
    });

    it('should handle multiple nodes and edges', () => {
      const result = exportToJsonCanvas(
        [
          {
            id: 'n1',
            type: 'terminal',
            position: { x: 0, y: 0 },
            style: { width: 600, height: 400 },
            data: { command: 'claude' },
          },
          {
            id: 'n2',
            type: 'terminal',
            position: { x: 700, y: 0 },
            style: { width: 600, height: 400 },
            data: { command: 'bash' },
          },
          {
            id: 'n3',
            type: 'browser',
            position: { x: 0, y: 500 },
            style: { width: 800, height: 600 },
            data: { url: 'https://sim.ai' },
          },
        ],
        [
          { id: 'e1', source: 'n1', target: 'n2' },
          { id: 'e2', source: 'n2', target: 'n3' },
        ]
      );

      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toHaveLength(2);
    });
  });

  describe('importFromJsonCanvas', () => {
    it('should import text nodes as custom nodes', () => {
      const result = importFromJsonCanvas({
        nodes: [
          { id: 'n1', type: 'text', x: 100, y: 200, width: 400, height: 300, text: 'Hello world' },
        ],
        edges: [],
      });

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].type).toBe('custom');
      expect(result.nodes[0].position).toEqual({ x: 100, y: 200 });
      expect(result.nodes[0].data?.label).toBe('Hello world');
    });

    it('should import link nodes as browser nodes', () => {
      const result = importFromJsonCanvas({
        nodes: [
          {
            id: 'n1',
            type: 'link',
            x: 0,
            y: 0,
            width: 800,
            height: 600,
            url: 'https://example.com',
          },
        ],
        edges: [],
      });

      expect(result.nodes[0].type).toBe('browser');
      expect(result.nodes[0].data?.url).toBe('https://example.com');
      expect(result.nodes[0].data?.browserId).toBeDefined();
    });

    it('should import edges with correct field mapping', () => {
      const result = importFromJsonCanvas({
        nodes: [],
        edges: [{ id: 'e1', fromNode: 'n1', toNode: 'n2', label: 'connects' }],
      });

      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].source).toBe('n1');
      expect(result.edges[0].target).toBe('n2');
      expect(result.edges[0].label).toBe('connects');
    });

    it('should round-trip export and import', () => {
      const originalNodes = [
        {
          id: 'n1',
          type: 'terminal',
          position: { x: 100, y: 200 },
          style: { width: 600, height: 400 },
          data: { command: 'claude', label: 'Test' },
        },
      ];
      const originalEdges = [{ id: 'e1', source: 'n1', target: 'n2' }];

      const exported = exportToJsonCanvas(originalNodes, originalEdges);
      const imported = importFromJsonCanvas(exported);

      // Positions should match
      expect(imported.nodes[0].position).toEqual({ x: 100, y: 200 });
      // Edges should round-trip
      expect(imported.edges[0].source).toBe('n1');
      expect(imported.edges[0].target).toBe('n2');
    });
  });
});
