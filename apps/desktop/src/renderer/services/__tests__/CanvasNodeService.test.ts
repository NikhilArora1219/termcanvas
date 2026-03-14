import { describe, expect, it } from 'vitest';
import { CanvasNodeService } from '../CanvasNodeService';

const mockScreenToFlowPosition = (pos: { x: number; y: number }) => pos;

describe('CanvasNodeService', () => {
  const service = new CanvasNodeService();

  describe('createTerminalNode', () => {
    it('should create a terminal node with default data', () => {
      const node = service.createTerminalNode({
        position: { x: 100, y: 200 },
        screenToFlowPosition: mockScreenToFlowPosition,
      });

      expect(node.type).toBe('terminal');
      expect(node.position).toEqual({ x: 100, y: 200 });
      expect(node.data.terminalId).toBeDefined();
      expect(node.data.terminalId).toMatch(/^terminal-/);
      expect(node.style).toEqual({ width: 600, height: 400 });
    });

    it('should create a terminal node with a custom command', () => {
      const node = service.createTerminalNode({
        position: { x: 0, y: 0 },
        screenToFlowPosition: mockScreenToFlowPosition,
        command: 'claude',
        label: 'Claude Code Agent',
        cwd: '/Users/niarora/projects',
      });

      expect(node.data.command).toBe('claude');
      expect(node.data.label).toBe('Claude Code Agent');
      expect(node.data.cwd).toBe('/Users/niarora/projects');
    });

    it('should create unique IDs for each terminal node', () => {
      const node1 = service.createTerminalNode({
        position: { x: 0, y: 0 },
        screenToFlowPosition: mockScreenToFlowPosition,
      });
      const node2 = service.createTerminalNode({
        position: { x: 0, y: 0 },
        screenToFlowPosition: mockScreenToFlowPosition,
      });

      expect(node1.id).not.toBe(node2.id);
      expect(node1.data.terminalId).not.toBe(node2.data.terminalId);
    });

    it('should use context menu position when no explicit position', () => {
      const node = service.createTerminalNode({
        contextMenuPosition: { x: 300, y: 400 },
        screenToFlowPosition: mockScreenToFlowPosition,
      });

      expect(node.position).toEqual({ x: 300, y: 400 });
    });
  });

  describe('createTerminalNodesGrid', () => {
    it('should create a grid of terminal nodes', () => {
      const nodes = service.createTerminalNodesGrid({
        commands: [
          { command: 'claude' },
          { command: 'opencode' },
          { command: 'bash' },
          { command: 'python3' },
        ],
        startPosition: { x: 0, y: 0 },
      });

      expect(nodes).toHaveLength(4);
      // 4 items -> 2x2 grid (ceil(sqrt(4)) = 2)
      expect(nodes[0].position).toEqual({ x: 0, y: 0 });
      expect(nodes[1].position).toEqual({ x: 624, y: 0 }); // 600 + 24 gap
      expect(nodes[2].position).toEqual({ x: 0, y: 424 }); // 400 + 24 gap
      expect(nodes[3].position).toEqual({ x: 624, y: 424 });
    });

    it('should set command data on each node', () => {
      const nodes = service.createTerminalNodesGrid({
        commands: [
          { command: 'claude', label: 'Agent 1' },
          { command: 'bash', label: 'Shell' },
        ],
        startPosition: { x: 0, y: 0 },
      });

      expect(nodes[0].data.command).toBe('claude');
      expect(nodes[0].data.label).toBe('Agent 1');
      expect(nodes[1].data.command).toBe('bash');
      expect(nodes[1].data.label).toBe('Shell');
    });

    it('should respect custom columns', () => {
      const nodes = service.createTerminalNodesGrid({
        commands: [{ command: 'a' }, { command: 'b' }, { command: 'c' }, { command: 'd' }],
        startPosition: { x: 0, y: 0 },
        columns: 4, // single row
      });

      // All should be on the same row (y=0)
      for (const node of nodes) {
        expect(node.position.y).toBe(0);
      }
    });

    it('should create unique IDs for all nodes in grid', () => {
      const nodes = service.createTerminalNodesGrid({
        commands: [{ command: 'a' }, { command: 'b' }, { command: 'c' }],
        startPosition: { x: 0, y: 0 },
      });

      const ids = nodes.map((n) => n.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);

      const terminalIds = nodes.map((n) => n.data.terminalId);
      const uniqueTerminalIds = new Set(terminalIds);
      expect(uniqueTerminalIds.size).toBe(terminalIds.length);
    });

    it('should handle single terminal', () => {
      const nodes = service.createTerminalNodesGrid({
        commands: [{ command: 'bash' }],
        startPosition: { x: 100, y: 200 },
      });

      expect(nodes).toHaveLength(1);
      expect(nodes[0].position).toEqual({ x: 100, y: 200 });
    });

    it('should handle custom gap and dimensions', () => {
      const nodes = service.createTerminalNodesGrid({
        commands: [{ command: 'a' }, { command: 'b' }],
        startPosition: { x: 0, y: 0 },
        nodeWidth: 300,
        nodeHeight: 200,
        gap: 50,
        columns: 2,
      });

      expect(nodes[0].position).toEqual({ x: 0, y: 0 });
      expect(nodes[1].position).toEqual({ x: 350, y: 0 }); // 300 + 50 gap
      expect(nodes[0].style).toEqual({ width: 300, height: 200 });
    });
  });

  describe('createClaudeCodeTerminalNode', () => {
    it('should create terminal node with autoStartClaude flag', () => {
      const node = service.createClaudeCodeTerminalNode({
        position: { x: 0, y: 0 },
        screenToFlowPosition: mockScreenToFlowPosition,
      });

      expect(node.type).toBe('terminal');
      expect(node.data.autoStartClaude).toBe(true);
    });
  });

  describe('createBrowserNode', () => {
    it('should create a browser node', () => {
      const node = service.createBrowserNode({
        position: { x: 0, y: 0 },
        screenToFlowPosition: mockScreenToFlowPosition,
      });

      expect(node.type).toBe('browser');
      expect(node.data.browserId).toBeDefined();
      expect(node.style).toEqual({ width: 800, height: 600 });
    });
  });
});
