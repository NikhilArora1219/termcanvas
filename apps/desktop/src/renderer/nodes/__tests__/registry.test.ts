import { describe, expect, it, vi } from 'vitest';

// Mock browser globals that xterm needs
vi.stubGlobal('self', globalThis);

// Mock the heavy node components to avoid xterm/codemirror deps
vi.mock('../../TerminalNode', () => ({
  default: () => null,
}));
vi.mock('../AgentNode', () => ({
  AgentNode: () => null,
}));
vi.mock('../AgentChatNode', () => ({
  default: () => null,
}));
vi.mock('../BrowserNode', () => ({
  default: () => null,
}));
vi.mock('../ConversationNode', () => ({
  default: () => null,
}));
vi.mock('../StarterNode', () => ({
  default: () => null,
}));
vi.mock('../NoteNode', () => ({
  NoteNode: () => null,
}));
vi.mock('../CodeNode', () => ({
  CodeNode: () => null,
}));
vi.mock('../ImageNode', () => ({
  ImageNode: () => null,
}));

import { nodeRegistry } from '../registry';

describe('nodeRegistry — all node types registered', () => {
  const expectedTypes = [
    'custom',
    'terminal',
    'agent',
    'conversation',
    'agent-chat',
    'starter',
    'browser',
    'note',
    'code',
    'image',
  ];

  it('should have all 10 node types registered', () => {
    expect(nodeRegistry.types).toHaveLength(10);
  });

  for (const type of expectedTypes) {
    it(`should have "${type}" type registered`, () => {
      expect(nodeRegistry.isValidType(type)).toBe(true);
    });
  }

  describe('persistence configuration', () => {
    const persistedTypes = [
      'custom',
      'terminal',
      'agent',
      'conversation',
      'agent-chat',
      'browser',
      'note',
      'code',
      'image',
    ];
    const nonPersistedTypes = ['starter'];

    for (const type of persistedTypes) {
      it(`"${type}" should be persisted`, () => {
        expect(nodeRegistry.isPersistedType(type)).toBe(true);
      });

      it(`"${type}" should have a data schema`, () => {
        expect(nodeRegistry.getSchema(type)).toBeDefined();
      });
    }

    for (const type of nonPersistedTypes) {
      it(`"${type}" should NOT be persisted`, () => {
        expect(nodeRegistry.isPersistedType(type)).toBe(false);
      });
    }
  });

  describe('data validation', () => {
    it('should validate note node data', () => {
      const result = nodeRegistry.validateNodeData('note', {
        content: '# Hello',
        title: 'test.md',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid note data (missing content)', () => {
      const result = nodeRegistry.validateNodeData('note', {
        title: 'test.md',
      });
      expect(result.success).toBe(false);
    });

    it('should validate code node data', () => {
      const result = nodeRegistry.validateNodeData('code', {
        content: 'const x = 1;',
        title: 'file.ts',
        language: 'typescript',
      });
      expect(result.success).toBe(true);
    });

    it('should validate image node data', () => {
      const result = nodeRegistry.validateNodeData('image', {
        filePath: '/path/to/img.png',
        title: 'img.png',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid image data (missing filePath)', () => {
      const result = nodeRegistry.validateNodeData('image', {
        title: 'img.png',
      });
      expect(result.success).toBe(false);
    });
  });
});
