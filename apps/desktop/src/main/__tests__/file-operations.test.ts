import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('file-operations', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'termcanvas-test-'));
    fs.mkdirSync(path.join(tmpDir, 'subdir'));
    fs.writeFileSync(path.join(tmpDir, 'readme.md'), '# Hello\nWorld');
    fs.writeFileSync(path.join(tmpDir, 'index.ts'), 'export const x = 1;');
    fs.writeFileSync(path.join(tmpDir, 'subdir', 'nested.txt'), 'nested content');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('readDirectory', () => {
    it('should list files and directories with metadata', async () => {
      const { readDirectory } = await import('../file-operations');
      const result = await readDirectory(tmpDir);
      expect(result.success).toBe(true);
      expect(result.entries).toBeDefined();
      expect(result.entries!.length).toBe(3);
      const names = result.entries!.map((e) => e.name);
      expect(names).toContain('readme.md');
      expect(names).toContain('index.ts');
      expect(names).toContain('subdir');
      const subdir = result.entries!.find((e) => e.name === 'subdir');
      expect(subdir!.isDirectory).toBe(true);
      const readme = result.entries!.find((e) => e.name === 'readme.md');
      expect(readme!.isDirectory).toBe(false);
      expect(readme!.size).toBeGreaterThan(0);
    });

    it('should sort directories first then alphabetical', async () => {
      const { readDirectory } = await import('../file-operations');
      const result = await readDirectory(tmpDir);
      expect(result.entries![0].name).toBe('subdir');
      expect(result.entries![0].isDirectory).toBe(true);
    });

    it('should return error for non-existent directory', async () => {
      const { readDirectory } = await import('../file-operations');
      const result = await readDirectory('/nonexistent-path-12345');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should exclude hidden files by default', async () => {
      fs.writeFileSync(path.join(tmpDir, '.hidden'), 'secret');
      const { readDirectory } = await import('../file-operations');
      const result = await readDirectory(tmpDir);
      const names = result.entries!.map((e) => e.name);
      expect(names).not.toContain('.hidden');
    });
  });

  describe('readFileContent', () => {
    it('should read file content as string', async () => {
      const { readFileContent } = await import('../file-operations');
      const result = await readFileContent(path.join(tmpDir, 'readme.md'));
      expect(result.success).toBe(true);
      expect(result.content).toBe('# Hello\nWorld');
    });

    it('should return error for non-existent file', async () => {
      const { readFileContent } = await import('../file-operations');
      const result = await readFileContent(path.join(tmpDir, 'nope.md'));
      expect(result.success).toBe(false);
    });
  });

  describe('writeFileContent', () => {
    it('should write content to a file', async () => {
      const { writeFileContent, readFileContent } = await import('../file-operations');
      const filePath = path.join(tmpDir, 'new.md');
      const result = await writeFileContent(filePath, '# New\ncontent');
      expect(result.success).toBe(true);
      const read = await readFileContent(filePath);
      expect(read.content).toBe('# New\ncontent');
    });

    it('should create parent directories if needed', async () => {
      const { writeFileContent } = await import('../file-operations');
      const filePath = path.join(tmpDir, 'deep', 'nested', 'file.txt');
      const result = await writeFileContent(filePath, 'deep content');
      expect(result.success).toBe(true);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('getFileInfo', () => {
    it('should return file stats', async () => {
      const { getFileInfo } = await import('../file-operations');
      const result = await getFileInfo(path.join(tmpDir, 'readme.md'));
      expect(result.success).toBe(true);
      expect(result.info!.isDirectory).toBe(false);
      expect(result.info!.size).toBeGreaterThan(0);
      expect(result.info!.extension).toBe('.md');
    });

    it('should return directory info', async () => {
      const { getFileInfo } = await import('../file-operations');
      const result = await getFileInfo(path.join(tmpDir, 'subdir'));
      expect(result.success).toBe(true);
      expect(result.info!.isDirectory).toBe(true);
    });
  });

  describe('createDirectory', () => {
    it('should create a new directory', async () => {
      const { createDirectory } = await import('../file-operations');
      const dirPath = path.join(tmpDir, 'newdir');
      const result = await createDirectory(dirPath);
      expect(result.success).toBe(true);
      expect(fs.existsSync(dirPath)).toBe(true);
    });

    it('should create nested directories', async () => {
      const { createDirectory } = await import('../file-operations');
      const dirPath = path.join(tmpDir, 'a', 'b', 'c');
      const result = await createDirectory(dirPath);
      expect(result.success).toBe(true);
      expect(fs.existsSync(dirPath)).toBe(true);
    });
  });

  describe('renameFile', () => {
    it('should rename a file', async () => {
      const { renameFile } = await import('../file-operations');
      const oldPath = path.join(tmpDir, 'readme.md');
      const newPath = path.join(tmpDir, 'README.md');
      const result = await renameFile(oldPath, newPath);
      expect(result.success).toBe(true);
      expect(fs.existsSync(newPath)).toBe(true);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      const { deleteFile } = await import('../file-operations');
      const filePath = path.join(tmpDir, 'index.ts');
      const result = await deleteFile(filePath);
      expect(result.success).toBe(true);
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('should delete a directory recursively', async () => {
      const { deleteFile } = await import('../file-operations');
      const dirPath = path.join(tmpDir, 'subdir');
      const result = await deleteFile(dirPath);
      expect(result.success).toBe(true);
      expect(fs.existsSync(dirPath)).toBe(false);
    });
  });
});
