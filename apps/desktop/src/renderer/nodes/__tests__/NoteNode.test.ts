import { describe, expect, it } from 'vitest';

/**
 * NoteNode frontmatter stripping tests.
 * Tests the stripFrontmatter logic extracted from NoteNode.
 */

function stripFrontmatter(text: string): string {
  const trimmed = text.trimStart();
  if (!trimmed.startsWith('---')) return text;
  const endIndex = trimmed.indexOf('---', 3);
  if (endIndex === -1) return text;
  return trimmed.slice(endIndex + 3).trimStart();
}

describe('NoteNode frontmatter stripping', () => {
  it('should strip YAML frontmatter', () => {
    const input = `---
title: Hello
type: article
---
# Hello World

Content here.`;
    const result = stripFrontmatter(input);
    expect(result).toBe(`# Hello World

Content here.`);
  });

  it('should return content as-is when no frontmatter', () => {
    const input = '# Just a heading\n\nSome text.';
    const result = stripFrontmatter(input);
    expect(result).toBe(input);
  });

  it('should handle frontmatter with no body', () => {
    const input = `---
type: note
---`;
    const result = stripFrontmatter(input);
    expect(result).toBe('');
  });

  it('should handle empty string', () => {
    expect(stripFrontmatter('')).toBe('');
  });

  it('should handle --- in body (not frontmatter)', () => {
    const input = 'Some text\n---\nMore text';
    const result = stripFrontmatter(input);
    expect(result).toBe(input);
  });

  it('should handle leading whitespace before frontmatter', () => {
    const input = `  ---
type: note
---
Content`;
    const result = stripFrontmatter(input);
    expect(result).toBe('Content');
  });

  it('should not treat single --- as frontmatter', () => {
    const input = '---\nJust a divider with no closing';
    const result = stripFrontmatter(input);
    expect(result).toBe(input);
  });
});
