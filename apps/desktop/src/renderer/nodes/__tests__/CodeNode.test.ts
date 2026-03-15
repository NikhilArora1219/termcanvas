import { describe, expect, it } from 'vitest';
import { getLanguageFromExtension } from '../CodeNode/useCodeMirror';

describe('CodeNode language detection', () => {
  it('should detect TypeScript from .ts', () => {
    expect(getLanguageFromExtension('.ts')).toBe('typescript');
  });

  it('should detect TSX from .tsx', () => {
    expect(getLanguageFromExtension('.tsx')).toBe('tsx');
  });

  it('should detect JavaScript from .js', () => {
    expect(getLanguageFromExtension('.js')).toBe('javascript');
  });

  it('should detect JSX from .jsx', () => {
    expect(getLanguageFromExtension('.jsx')).toBe('jsx');
  });

  it('should detect Python from .py', () => {
    expect(getLanguageFromExtension('.py')).toBe('python');
  });

  it('should detect HTML from .html', () => {
    expect(getLanguageFromExtension('.html')).toBe('html');
  });

  it('should detect HTML from .htm', () => {
    expect(getLanguageFromExtension('.htm')).toBe('html');
  });

  it('should detect CSS from .css', () => {
    expect(getLanguageFromExtension('.css')).toBe('css');
  });

  it('should detect JSON from .json', () => {
    expect(getLanguageFromExtension('.json')).toBe('json');
  });

  it('should detect Markdown from .md', () => {
    expect(getLanguageFromExtension('.md')).toBe('markdown');
  });

  it('should detect JavaScript from .mjs', () => {
    expect(getLanguageFromExtension('.mjs')).toBe('javascript');
  });

  it('should detect JavaScript from .cjs', () => {
    expect(getLanguageFromExtension('.cjs')).toBe('javascript');
  });

  it('should return undefined for unknown extensions', () => {
    expect(getLanguageFromExtension('.rs')).toBeUndefined();
    expect(getLanguageFromExtension('.go')).toBeUndefined();
    expect(getLanguageFromExtension('.txt')).toBeUndefined();
  });

  it('should be case-insensitive', () => {
    expect(getLanguageFromExtension('.TS')).toBe('typescript');
    expect(getLanguageFromExtension('.PY')).toBe('python');
    expect(getLanguageFromExtension('.HTML')).toBe('html');
  });
});
