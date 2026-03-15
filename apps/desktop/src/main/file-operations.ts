/**
 * File Operations Module
 *
 * Pure functions for file system operations.
 * Used by IPC handlers in main.ts.
 * Separated for testability (no Electron imports).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface DirEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: string;
  extension: string;
}

export interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: string;
  createdAt: string;
  extension: string;
}

export async function readDirectory(dirPath: string): Promise<{
  success: boolean;
  entries?: DirEntry[];
  error?: string;
}> {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const result: DirEntry[] = entries
      .filter((e) => !e.name.startsWith('.'))
      .map((entry) => {
        const fullPath = path.join(dirPath, entry.name);
        const stat = fs.statSync(fullPath);
        return {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          size: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          extension: entry.isDirectory() ? '' : path.extname(entry.name),
        };
      })
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    return { success: true, entries: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function readFileContent(filePath: string): Promise<{
  success: boolean;
  content?: string;
  error?: string;
}> {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: `File not found: ${filePath}` };
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function writeFileContent(
  filePath: string,
  content: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getFileInfo(filePath: string): Promise<{
  success: boolean;
  info?: FileInfo;
  error?: string;
}> {
  try {
    const stat = fs.statSync(filePath);
    return {
      success: true,
      info: {
        name: path.basename(filePath),
        path: filePath,
        isDirectory: stat.isDirectory(),
        size: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        createdAt: stat.birthtime.toISOString(),
        extension: stat.isDirectory() ? '' : path.extname(filePath),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createDirectory(dirPath: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function renameFile(
  oldPath: string,
  newPath: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    fs.renameSync(oldPath, newPath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteFile(filePath: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    fs.rmSync(filePath, { recursive: true, force: true });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
