import { describe, expect, it } from 'vitest';
import { CanvasNodeService } from '../CanvasNodeService';

const mockScreenToFlowPosition = (pos: { x: number; y: number }) => pos;

describe('CanvasNodeService — Collaborator Tiles', () => {
  const service = new CanvasNodeService();

  describe('createNoteNode', () => {
    it('should create a note node with default data', () => {
      const node = service.createNoteNode({
        position: { x: 100, y: 200 },
        screenToFlowPosition: mockScreenToFlowPosition,
      });

      expect(node.type).toBe('note');
      expect(node.position).toEqual({ x: 100, y: 200 });
      expect(node.data.content).toBe('');
      expect(node.data.title).toBe('Untitled Note');
      expect(node.data.isEditing).toBe(true); // inline notes start in edit mode
      expect(node.style).toEqual({ width: 400, height: 350 });
    });

    it('should create a file-backed note node', () => {
      const node = service.createNoteNode({
        position: { x: 0, y: 0 },
        screenToFlowPosition: mockScreenToFlowPosition,
        filePath: '/path/to/readme.md',
        content: '# Hello\nWorld',
        title: 'readme.md',
      });

      expect(node.data.filePath).toBe('/path/to/readme.md');
      expect(node.data.content).toBe('# Hello\nWorld');
      expect(node.data.title).toBe('readme.md');
      expect(node.data.isEditing).toBe(false); // file-backed notes start in view mode
    });

    it('should create unique IDs', () => {
      const n1 = service.createNoteNode({
        position: { x: 0, y: 0 },
        screenToFlowPosition: mockScreenToFlowPosition,
      });
      const n2 = service.createNoteNode({
        position: { x: 0, y: 0 },
        screenToFlowPosition: mockScreenToFlowPosition,
      });
      expect(n1.id).not.toBe(n2.id);
    });

    it('should use context menu position as fallback', () => {
      const node = service.createNoteNode({
        contextMenuPosition: { x: 300, y: 400 },
        screenToFlowPosition: mockScreenToFlowPosition,
      });
      expect(node.position).toEqual({ x: 300, y: 400 });
    });
  });

  describe('createCodeNode', () => {
    it('should create a code node with default data', () => {
      const node = service.createCodeNode({
        position: { x: 100, y: 200 },
        screenToFlowPosition: mockScreenToFlowPosition,
      });

      expect(node.type).toBe('code');
      expect(node.position).toEqual({ x: 100, y: 200 });
      expect(node.data.content).toBe('');
      expect(node.data.title).toBe('Untitled');
      expect(node.data.isEditing).toBe(false);
      expect(node.style).toEqual({ width: 500, height: 400 });
    });

    it('should create a file-backed code node with language', () => {
      const node = service.createCodeNode({
        position: { x: 0, y: 0 },
        screenToFlowPosition: mockScreenToFlowPosition,
        filePath: '/path/to/index.ts',
        content: 'export const x = 1;',
        title: 'index.ts',
        language: 'typescript',
      });

      expect(node.data.filePath).toBe('/path/to/index.ts');
      expect(node.data.content).toBe('export const x = 1;');
      expect(node.data.language).toBe('typescript');
    });

    it('should create unique IDs', () => {
      const n1 = service.createCodeNode({
        position: { x: 0, y: 0 },
        screenToFlowPosition: mockScreenToFlowPosition,
      });
      const n2 = service.createCodeNode({
        position: { x: 0, y: 0 },
        screenToFlowPosition: mockScreenToFlowPosition,
      });
      expect(n1.id).not.toBe(n2.id);
    });
  });

  describe('createImageNode', () => {
    it('should create an image node', () => {
      const node = service.createImageNode({
        position: { x: 100, y: 200 },
        screenToFlowPosition: mockScreenToFlowPosition,
        filePath: '/path/to/image.png',
      });

      expect(node.type).toBe('image');
      expect(node.position).toEqual({ x: 100, y: 200 });
      expect(node.data.filePath).toBe('/path/to/image.png');
      expect(node.data.title).toBe('image.png');
      expect(node.style).toEqual({ width: 400, height: 300 });
    });

    it('should accept custom title and mimeType', () => {
      const node = service.createImageNode({
        position: { x: 0, y: 0 },
        screenToFlowPosition: mockScreenToFlowPosition,
        filePath: '/path/to/photo.jpg',
        title: 'My Photo',
        mimeType: 'image/jpeg',
      });

      expect(node.data.title).toBe('My Photo');
      expect(node.data.mimeType).toBe('image/jpeg');
    });

    it('should extract filename from path for default title', () => {
      const node = service.createImageNode({
        position: { x: 0, y: 0 },
        screenToFlowPosition: mockScreenToFlowPosition,
        filePath: '/deep/nested/dir/screenshot.webp',
      });

      expect(node.data.title).toBe('screenshot.webp');
    });
  });
});
