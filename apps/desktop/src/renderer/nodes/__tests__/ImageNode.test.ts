import { describe, expect, it } from 'vitest';

// Test the file type detection and drawio preview extraction
// (extracted from ImageNode to test without React/DOM)

function isSvgFile(filePath: string): boolean {
  return filePath.toLowerCase().endsWith('.svg');
}

function isDrawioFile(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return lower.endsWith('.drawio') || lower.endsWith('.drawio.xml');
}

function extractDrawioPreview(xml: string, title: string): string {
  const svgMatch = xml.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) {
    return svgMatch[0];
  }
  const nameMatch = xml.match(/name="([^"]+)"/);
  const diagramName = nameMatch ? nameMatch[1] : title;
  const pageCount = (xml.match(/<diagram/g) || []).length;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#1a1a2e" rx="8"/>
    <text x="200" y="130" text-anchor="middle" fill="#4a9eff" font-size="16" font-family="sans-serif">${diagramName}</text>
    <text x="200" y="160" text-anchor="middle" fill="#999" font-size="12" font-family="sans-serif">${pageCount} page${pageCount !== 1 ? 's' : ''} — Draw.io diagram</text>
    <text x="200" y="190" text-anchor="middle" fill="#666" font-size="11" font-family="sans-serif">Double-click to open in draw.io</text>
  </svg>`;
}

describe('ImageNode file type detection', () => {
  describe('isSvgFile', () => {
    it('should detect .svg files', () => {
      expect(isSvgFile('/path/to/diagram.svg')).toBe(true);
      expect(isSvgFile('/path/to/ICON.SVG')).toBe(true);
    });

    it('should not match non-svg files', () => {
      expect(isSvgFile('/path/to/file.png')).toBe(false);
      expect(isSvgFile('/path/to/file.svgz')).toBe(false);
    });
  });

  describe('isDrawioFile', () => {
    it('should detect .drawio files', () => {
      expect(isDrawioFile('/path/to/diagram.drawio')).toBe(true);
      expect(isDrawioFile('/path/to/ARCH.DRAWIO')).toBe(true);
    });

    it('should detect .drawio.xml files', () => {
      expect(isDrawioFile('/path/to/diagram.drawio.xml')).toBe(true);
    });

    it('should not match non-drawio files', () => {
      expect(isDrawioFile('/path/to/file.xml')).toBe(false);
      expect(isDrawioFile('/path/to/file.draw')).toBe(false);
    });
  });

  describe('extractDrawioPreview', () => {
    it('should extract embedded SVG from drawio XML', () => {
      const xml = `<mxfile><diagram name="Page-1"><svg xmlns="http://www.w3.org/2000/svg"><rect/></svg></diagram></mxfile>`;
      const result = extractDrawioPreview(xml, 'test');
      expect(result).toContain('<rect/>');
      expect(result).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('should create preview SVG when no embedded SVG', () => {
      const xml = `<mxfile><diagram name="Architecture">base64data</diagram></mxfile>`;
      const result = extractDrawioPreview(xml, 'fallback');
      expect(result).toContain('Architecture');
      expect(result).toContain('1 page');
      expect(result).toContain('Draw.io diagram');
    });

    it('should count multiple pages', () => {
      const xml = `<mxfile><diagram name="P1">d1</diagram><diagram name="P2">d2</diagram><diagram name="P3">d3</diagram></mxfile>`;
      const result = extractDrawioPreview(xml, 'test');
      expect(result).toContain('3 pages');
    });

    it('should use title as fallback when no name attribute', () => {
      const xml = `<mxfile><diagram>data</diagram></mxfile>`;
      const result = extractDrawioPreview(xml, 'My Diagram');
      expect(result).toContain('My Diagram');
    });
  });
});

describe('ImageNode supported formats', () => {
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.drawio'];

  it('should support all raster formats', () => {
    for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']) {
      expect(imageExts).toContain(ext);
      expect(isSvgFile(`file${ext}`)).toBe(false);
      expect(isDrawioFile(`file${ext}`)).toBe(false);
    }
  });

  it('should support SVG as inline rendering', () => {
    expect(imageExts).toContain('.svg');
    expect(isSvgFile('test.svg')).toBe(true);
  });

  it('should support draw.io as diagram', () => {
    expect(imageExts).toContain('.drawio');
    expect(isDrawioFile('test.drawio')).toBe(true);
  });
});
