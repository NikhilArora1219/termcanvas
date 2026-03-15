import { describe, expect, it } from 'vitest';
import { CodeNodeDataSchema, ImageNodeDataSchema, NoteNodeDataSchema } from '../schemas';

describe('NoteNodeDataSchema', () => {
  it('should validate valid note data', () => {
    const data = {
      filePath: '/path/to/note.md',
      content: '# Hello\nWorld',
      title: 'note.md',
      isEditing: false,
    };
    const result = NoteNodeDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should validate note without filePath (inline note)', () => {
    const data = {
      content: '# Quick note',
      title: 'Untitled',
      isEditing: true,
    };
    const result = NoteNodeDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should fail without content', () => {
    const data = { title: 'note.md' };
    const result = NoteNodeDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should fail without title', () => {
    const data = { content: 'hello' };
    const result = NoteNodeDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('CodeNodeDataSchema', () => {
  it('should validate valid code data', () => {
    const data = {
      filePath: '/path/to/file.ts',
      content: 'export const x = 1;',
      language: 'typescript',
      title: 'file.ts',
      isEditing: false,
    };
    const result = CodeNodeDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should validate code without language (auto-detect)', () => {
    const data = {
      filePath: '/path/to/file.py',
      content: 'print("hello")',
      title: 'file.py',
      isEditing: false,
    };
    const result = CodeNodeDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should validate code without filePath (inline code)', () => {
    const data = {
      content: 'console.log("hi")',
      title: 'scratch.js',
    };
    const result = CodeNodeDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should fail without content', () => {
    const data = { title: 'file.ts', language: 'typescript' };
    const result = CodeNodeDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('ImageNodeDataSchema', () => {
  it('should validate valid image data', () => {
    const data = {
      filePath: '/path/to/image.png',
      title: 'image.png',
      mimeType: 'image/png',
    };
    const result = ImageNodeDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should validate image with dimensions', () => {
    const data = {
      filePath: '/path/to/image.jpg',
      title: 'photo.jpg',
      width: 1920,
      height: 1080,
    };
    const result = ImageNodeDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should fail without filePath', () => {
    const data = { title: 'image.png' };
    const result = ImageNodeDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should fail without title', () => {
    const data = { filePath: '/path/to/img.png' };
    const result = ImageNodeDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
