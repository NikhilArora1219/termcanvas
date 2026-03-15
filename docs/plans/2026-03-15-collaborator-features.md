# TermCanvas Collaborator Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Navigator sidebar with file tree, Note/Code/Image tile nodes, drag-drop from file tree to canvas, and workspace management — achieving feature parity with Collaborator app.

**Architecture:** New node types (note, code, image) follow the existing pattern: Zod schema in `schemas.ts`, component in `nodes/`, registration in `registry.tsx`, factory method in `CanvasNodeService.ts`, action in `useCanvasActions.ts`. Navigator sidebar replaces the Agent Hierarchy section with a tabbed layout (Files / Agents). File operations use new IPC handlers in `main.ts`. CodeMirror 6 for syntax highlighting. react-markdown (already installed) for markdown rendering.

**Tech Stack:** React 18, @xyflow/react v12, Zustand 4, @codemirror/view + @codemirror/lang-*, react-markdown 9, remark-gfm 4, Electron IPC, node-pty, SQLite, Vitest, TypeScript 5.9

---

## Task 1: Install CodeMirror Dependencies

**Files:**
- Modify: `apps/desktop/package.json`

**Step 1: Install CodeMirror 6 packages**

Run:
```bash
cd apps/desktop && npm install @codemirror/view @codemirror/state @codemirror/language @codemirror/lang-javascript @codemirror/lang-python @codemirror/lang-html @codemirror/lang-css @codemirror/lang-json @codemirror/lang-markdown @codemirror/theme-one-dark
```

**Step 2: Verify install succeeded**

Run: `cd apps/desktop && node -e "require('@codemirror/view'); console.log('OK')"`
Expected: `OK`

**Step 3: Commit**

```bash
git add apps/desktop/package.json apps/desktop/package-lock.json
git commit -m "deps: add codemirror 6 packages for code tile syntax highlighting"
```

---

## Task 2: Add File System IPC Handlers

**Files:**
- Modify: `apps/desktop/src/main/main.ts` (after existing `file:exists` handler, ~line 738)
- Create: `apps/desktop/src/main/__tests__/file-ipc.test.ts`

**Step 1: Write the failing test**

Create `apps/desktop/src/main/__tests__/file-ipc.test.ts`:

```typescript
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('file-ipc handlers', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'termcanvas-test-'));
    // Create test file structure
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
      expect(result.entries!.length).toBe(3); // readme.md, index.ts, subdir
      const names = result.entries!.map(e => e.name);
      expect(names).toContain('readme.md');
      expect(names).toContain('index.ts');
      expect(names).toContain('subdir');
      const subdir = result.entries!.find(e => e.name === 'subdir');
      expect(subdir!.isDirectory).toBe(true);
      const readme = result.entries!.find(e => e.name === 'readme.md');
      expect(readme!.isDirectory).toBe(false);
      expect(readme!.size).toBeGreaterThan(0);
    });

    it('should return error for non-existent directory', async () => {
      const { readDirectory } = await import('../file-operations');
      const result = await readDirectory('/nonexistent-path-12345');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
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
  });

  describe('createDirectory', () => {
    it('should create a new directory', async () => {
      const { createDirectory } = await import('../file-operations');
      const dirPath = path.join(tmpDir, 'newdir');
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
      expect(fs.existsSync(oldPath)).toBe(false);
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
```

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npx vitest run src/main/__tests__/file-ipc.test.ts`
Expected: FAIL — `Cannot find module '../file-operations'`

**Step 3: Create the file-operations module**

Create `apps/desktop/src/main/file-operations.ts`:

```typescript
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
      .filter(e => !e.name.startsWith('.'))
      .map(entry => {
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
        // Directories first, then alphabetical
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

export async function writeFileContent(filePath: string, content: string): Promise<{
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

export async function renameFile(oldPath: string, newPath: string): Promise<{
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
```

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop && npx vitest run src/main/__tests__/file-ipc.test.ts`
Expected: ALL PASS

**Step 5: Wire IPC handlers in main.ts**

Add after the existing `file:exists` handler (~line 738) in `apps/desktop/src/main/main.ts`:

```typescript
import {
  readDirectory, readFileContent, writeFileContent,
  getFileInfo, createDirectory, renameFile, deleteFile
} from './file-operations';

// ... inside setupIpcHandlers():

ipcMain.handle('fs:readdir', async (_event, dirPath: string) => {
  return readDirectory(dirPath);
});

ipcMain.handle('fs:read-file', async (_event, filePath: string) => {
  return readFileContent(filePath);
});

ipcMain.handle('fs:write-file', async (_event, filePath: string, content: string) => {
  return writeFileContent(filePath, content);
});

ipcMain.handle('fs:file-info', async (_event, filePath: string) => {
  return getFileInfo(filePath);
});

ipcMain.handle('fs:mkdir', async (_event, dirPath: string) => {
  return createDirectory(dirPath);
});

ipcMain.handle('fs:rename', async (_event, oldPath: string, newPath: string) => {
  return renameFile(oldPath, newPath);
});

ipcMain.handle('fs:delete', async (_event, filePath: string) => {
  return deleteFile(filePath);
});

ipcMain.handle('dialog:open-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { success: true, path: null };
  }
  return { success: true, path: result.filePaths[0] };
});
```

**Step 6: Commit**

```bash
git add apps/desktop/src/main/file-operations.ts apps/desktop/src/main/__tests__/file-ipc.test.ts apps/desktop/src/main/main.ts
git commit -m "feat: add file system IPC handlers for navigator sidebar"
```

---

## Task 3: Add New Node Data Schemas

**Files:**
- Modify: `apps/desktop/src/renderer/nodes/schemas.ts`
- Create: `apps/desktop/src/renderer/nodes/__tests__/schemas.test.ts`

**Step 1: Write the failing test**

Create `apps/desktop/src/renderer/nodes/__tests__/schemas.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import {
  NoteNodeDataSchema,
  CodeNodeDataSchema,
  ImageNodeDataSchema,
} from '../schemas';

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

  it('should fail without filePath', () => {
    const data = { title: 'image.png' };
    const result = ImageNodeDataSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npx vitest run src/renderer/nodes/__tests__/schemas.test.ts`
Expected: FAIL — schemas not exported

**Step 3: Add schemas to schemas.ts**

Append to `apps/desktop/src/renderer/nodes/schemas.ts` before the "Inferred Types" section:

```typescript
/**
 * Schema for NoteNode data (markdown content on canvas)
 */
export const NoteNodeDataSchema = z.object({
  filePath: z.string().optional(),
  content: z.string(),
  title: z.string(),
  isEditing: z.boolean().optional(),
  lastModified: z.string().optional(),
});

/**
 * Schema for CodeNode data (syntax-highlighted code on canvas)
 */
export const CodeNodeDataSchema = z.object({
  filePath: z.string().optional(),
  content: z.string(),
  language: z.string().optional(),
  title: z.string(),
  isEditing: z.boolean().optional(),
  lastModified: z.string().optional(),
});

/**
 * Schema for ImageNode data (image display on canvas)
 */
export const ImageNodeDataSchema = z.object({
  filePath: z.string(),
  title: z.string(),
  mimeType: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});
```

Also add the inferred types:

```typescript
export type NoteNodeData = z.infer<typeof NoteNodeDataSchema>;
export type CodeNodeData = z.infer<typeof CodeNodeDataSchema>;
export type ImageNodeData = z.infer<typeof ImageNodeDataSchema>;
```

**Step 4: Run test to verify it passes**

Run: `cd apps/desktop && npx vitest run src/renderer/nodes/__tests__/schemas.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/renderer/nodes/schemas.ts apps/desktop/src/renderer/nodes/__tests__/schemas.test.ts
git commit -m "feat: add zod schemas for note, code, and image node types"
```

---

## Task 4: NoteNode Component

**Files:**
- Create: `apps/desktop/src/renderer/nodes/NoteNode/NoteNode.tsx`
- Create: `apps/desktop/src/renderer/nodes/NoteNode/NoteNode.css`
- Create: `apps/desktop/src/renderer/nodes/NoteNode/index.ts`

**Step 1: Create the NoteNode component**

Create `apps/desktop/src/renderer/nodes/NoteNode/NoteNode.tsx`:

```tsx
/**
 * NoteNode — Markdown content tile on the canvas.
 *
 * Displays rendered markdown. Click to edit (textarea), blur to render.
 * Supports files from navigator or inline notes from context menu.
 */
import { Handle, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { NoteNodeData } from '../schemas';
import './NoteNode.css';

export function NoteNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as NoteNodeData;
  const { updateNodeData } = useReactFlow();
  const [isEditing, setIsEditing] = useState(nodeData.isEditing ?? false);
  const [content, setContent] = useState(nodeData.content ?? '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // Sync external content changes
  useEffect(() => {
    if (!isEditing) {
      setContent(nodeData.content ?? '');
    }
  }, [nodeData.content, isEditing]);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    updateNodeData(id, { content, isEditing: false });
    // Persist to file if backed by a file
    if (nodeData.filePath) {
      window.electron?.ipcRenderer.invoke('fs:write-file', nodeData.filePath, content);
    }
  }, [id, content, nodeData.filePath, updateNodeData]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSave();
      }
    },
    [handleSave]
  );

  return (
    <div className={`note-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="note-node-header">
        <span className="note-node-badge">NOTE</span>
        <span className="note-node-title">{nodeData.title || 'Untitled'}</span>
      </div>
      <div
        className="note-node-body"
        onDoubleClick={() => {
          setIsEditing(true);
          updateNodeData(id, { isEditing: true });
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="note-node-editor"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <div className="note-node-content">
            {content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <span className="note-node-placeholder">Double-click to edit...</span>
            )}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

**Step 2: Create the CSS**

Create `apps/desktop/src/renderer/nodes/NoteNode/NoteNode.css`:

```css
.note-node {
  background: var(--color-bg-secondary, #1a1a2e);
  border: 1px solid var(--color-border, #333);
  border-radius: 8px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.note-node.selected {
  border-color: var(--color-accent, #4a9eff);
}

.note-node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border, #333);
  cursor: grab;
}

.note-node-badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-accent, #4a9eff);
  background: rgba(74, 158, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.note-node-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary, #e0e0e0);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-node-body {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

.note-node-editor {
  width: 100%;
  height: 100%;
  min-height: 100px;
  padding: 12px;
  background: transparent;
  border: none;
  color: var(--color-text-primary, #e0e0e0);
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: none;
  outline: none;
  box-sizing: border-box;
}

.note-node-content {
  padding: 12px;
  color: var(--color-text-primary, #e0e0e0);
  font-size: 14px;
  line-height: 1.6;
}

.note-node-content h1,
.note-node-content h2,
.note-node-content h3 {
  margin-top: 0;
  margin-bottom: 8px;
  color: var(--color-text-primary, #e0e0e0);
}

.note-node-content h1 { font-size: 20px; }
.note-node-content h2 { font-size: 17px; }
.note-node-content h3 { font-size: 15px; }

.note-node-content p {
  margin: 0 0 8px 0;
}

.note-node-content a {
  color: var(--color-accent, #4a9eff);
}

.note-node-content code {
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 12px;
}

.note-node-content pre {
  background: rgba(0, 0, 0, 0.3);
  padding: 10px;
  border-radius: 6px;
  overflow-x: auto;
}

.note-node-content pre code {
  background: none;
  padding: 0;
}

.note-node-placeholder {
  color: var(--color-text-secondary, #666);
  font-style: italic;
}
```

**Step 3: Create barrel export**

Create `apps/desktop/src/renderer/nodes/NoteNode/index.ts`:

```typescript
export { NoteNode } from './NoteNode';
```

**Step 4: Commit**

```bash
git add apps/desktop/src/renderer/nodes/NoteNode/
git commit -m "feat: add NoteNode component with markdown rendering and inline editing"
```

---

## Task 5: CodeNode Component

**Files:**
- Create: `apps/desktop/src/renderer/nodes/CodeNode/CodeNode.tsx`
- Create: `apps/desktop/src/renderer/nodes/CodeNode/CodeNode.css`
- Create: `apps/desktop/src/renderer/nodes/CodeNode/useCodeMirror.ts`
- Create: `apps/desktop/src/renderer/nodes/CodeNode/index.ts`

**Step 1: Create the CodeMirror hook**

Create `apps/desktop/src/renderer/nodes/CodeNode/useCodeMirror.ts`:

```typescript
/**
 * useCodeMirror — React hook for CodeMirror 6 editor integration.
 */
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { useEffect, useRef } from 'react';

// Language imports
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';

const LANGUAGE_MAP: Record<string, () => Extension> = {
  javascript: () => javascript(),
  typescript: () => javascript({ typescript: true }),
  jsx: () => javascript({ jsx: true }),
  tsx: () => javascript({ jsx: true, typescript: true }),
  python: () => python(),
  html: () => html(),
  css: () => css(),
  json: () => json(),
  markdown: () => markdown(),
};

export function getLanguageFromExtension(ext: string): string | undefined {
  const map: Record<string, string> = {
    '.ts': 'typescript', '.tsx': 'tsx', '.js': 'javascript', '.jsx': 'jsx',
    '.py': 'python', '.html': 'html', '.htm': 'html',
    '.css': 'css', '.json': 'json', '.md': 'markdown',
    '.mjs': 'javascript', '.cjs': 'javascript',
  };
  return map[ext.toLowerCase()];
}

interface UseCodeMirrorOptions {
  content: string;
  language?: string;
  readOnly?: boolean;
  onChange?: (content: string) => void;
}

export function useCodeMirror({ content, language, readOnly, onChange }: UseCodeMirrorOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const extensions: Extension[] = [
      lineNumbers(),
      highlightActiveLine(),
      syntaxHighlighting(defaultHighlightStyle),
      oneDark,
      keymap.of(defaultKeymap),
      EditorView.theme({
        '&': { height: '100%', fontSize: '13px' },
        '.cm-scroller': { overflow: 'auto' },
        '.cm-content': { fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace" },
      }),
    ];

    if (readOnly) {
      extensions.push(EditorState.readOnly.of(true));
    }

    if (language && LANGUAGE_MAP[language]) {
      extensions.push(LANGUAGE_MAP[language]());
    }

    if (onChange) {
      extensions.push(
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        })
      );
    }

    const state = EditorState.create({ doc: content, extensions });
    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [language, readOnly]); // Recreate on language/readOnly change

  // Update content without recreating editor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentContent = view.state.doc.toString();
    if (currentContent !== content) {
      view.dispatch({
        changes: { from: 0, to: currentContent.length, insert: content },
      });
    }
  }, [content]);

  return { containerRef };
}
```

**Step 2: Create the CodeNode component**

Create `apps/desktop/src/renderer/nodes/CodeNode/CodeNode.tsx`:

```tsx
/**
 * CodeNode — Syntax-highlighted code tile on the canvas.
 *
 * Displays code with CodeMirror 6 (line numbers, syntax highlighting).
 * Supports files from navigator or inline code from context menu.
 */
import { Handle, type NodeProps, Position, useReactFlow } from '@xyflow/react';
import { useCallback, useState } from 'react';
import type { CodeNodeData } from '../schemas';
import { getLanguageFromExtension, useCodeMirror } from './useCodeMirror';
import './CodeNode.css';

export function CodeNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as CodeNodeData;
  const { updateNodeData } = useReactFlow();
  const [content, setContent] = useState(nodeData.content ?? '');

  // Determine language from explicit prop or file extension
  const language =
    nodeData.language ??
    (nodeData.filePath ? getLanguageFromExtension(nodeData.filePath.slice(nodeData.filePath.lastIndexOf('.'))) : undefined);

  const handleChange = useCallback(
    (newContent: string) => {
      setContent(newContent);
      updateNodeData(id, { content: newContent });
    },
    [id, updateNodeData]
  );

  const handleSave = useCallback(() => {
    if (nodeData.filePath) {
      window.electron?.ipcRenderer.invoke('fs:write-file', nodeData.filePath, content);
    }
  }, [nodeData.filePath, content]);

  const { containerRef } = useCodeMirror({
    content,
    language,
    readOnly: false,
    onChange: handleChange,
  });

  return (
    <div className={`code-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="code-node-header">
        <span className="code-node-badge">CODE</span>
        <span className="code-node-title">{nodeData.title || 'Untitled'}</span>
        {language && <span className="code-node-lang">{language}</span>}
        {nodeData.filePath && (
          <button
            className="code-node-save"
            onClick={handleSave}
            title="Save to file (Cmd+S)"
          >
            Save
          </button>
        )}
      </div>
      <div className="code-node-body" ref={containerRef} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

**Step 3: Create the CSS**

Create `apps/desktop/src/renderer/nodes/CodeNode/CodeNode.css`:

```css
.code-node {
  background: var(--color-bg-secondary, #1a1a2e);
  border: 1px solid var(--color-border, #333);
  border-radius: 8px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.code-node.selected {
  border-color: var(--color-accent, #4a9eff);
}

.code-node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border, #333);
  cursor: grab;
}

.code-node-badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #a78bfa;
  background: rgba(167, 139, 250, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.code-node-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary, #e0e0e0);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.code-node-lang {
  font-size: 11px;
  color: var(--color-text-secondary, #999);
  text-transform: lowercase;
}

.code-node-save {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(74, 158, 255, 0.15);
  border: 1px solid rgba(74, 158, 255, 0.3);
  border-radius: 4px;
  color: var(--color-accent, #4a9eff);
  cursor: pointer;
}

.code-node-save:hover {
  background: rgba(74, 158, 255, 0.25);
}

.code-node-body {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.code-node-body .cm-editor {
  height: 100%;
}
```

**Step 4: Create barrel export**

Create `apps/desktop/src/renderer/nodes/CodeNode/index.ts`:

```typescript
export { CodeNode } from './CodeNode';
```

**Step 5: Commit**

```bash
git add apps/desktop/src/renderer/nodes/CodeNode/
git commit -m "feat: add CodeNode component with CodeMirror 6 syntax highlighting"
```

---

## Task 6: ImageNode Component

**Files:**
- Create: `apps/desktop/src/renderer/nodes/ImageNode/ImageNode.tsx`
- Create: `apps/desktop/src/renderer/nodes/ImageNode/ImageNode.css`
- Create: `apps/desktop/src/renderer/nodes/ImageNode/index.ts`

**Step 1: Create the ImageNode component**

Create `apps/desktop/src/renderer/nodes/ImageNode/ImageNode.tsx`:

```tsx
/**
 * ImageNode — Image display tile on the canvas.
 *
 * Displays images from the file system. Read-only.
 * Supports drag from navigator for .png, .jpg, .svg, .gif, .webp files.
 */
import { Handle, type NodeProps, Position } from '@xyflow/react';
import { useEffect, useState } from 'react';
import type { ImageNodeData } from '../schemas';
import './ImageNode.css';

export function ImageNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as ImageNodeData;
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nodeData.filePath) return;
    // Use file:// protocol for local images in Electron
    setImageSrc(`file://${nodeData.filePath}`);
  }, [nodeData.filePath]);

  return (
    <div className={`image-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="image-node-header">
        <span className="image-node-badge">IMAGE</span>
        <span className="image-node-title">{nodeData.title || 'Image'}</span>
      </div>
      <div className="image-node-body">
        {error ? (
          <div className="image-node-error">{error}</div>
        ) : imageSrc ? (
          <img
            src={imageSrc}
            alt={nodeData.title}
            className="image-node-img"
            onError={() => setError('Failed to load image')}
          />
        ) : (
          <div className="image-node-placeholder">No image</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

**Step 2: Create the CSS**

Create `apps/desktop/src/renderer/nodes/ImageNode/ImageNode.css`:

```css
.image-node {
  background: var(--color-bg-secondary, #1a1a2e);
  border: 1px solid var(--color-border, #333);
  border-radius: 8px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.image-node.selected {
  border-color: var(--color-accent, #4a9eff);
}

.image-node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border, #333);
  cursor: grab;
}

.image-node-badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #34d399;
  background: rgba(52, 211, 153, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.image-node-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary, #e0e0e0);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-node-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-height: 0;
  padding: 8px;
}

.image-node-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.image-node-error {
  color: #f87171;
  font-size: 13px;
}

.image-node-placeholder {
  color: var(--color-text-secondary, #666);
  font-style: italic;
  font-size: 13px;
}
```

**Step 3: Create barrel export**

Create `apps/desktop/src/renderer/nodes/ImageNode/index.ts`:

```typescript
export { ImageNode } from './ImageNode';
```

**Step 4: Commit**

```bash
git add apps/desktop/src/renderer/nodes/ImageNode/
git commit -m "feat: add ImageNode component for displaying images on canvas"
```

---

## Task 7: Register New Node Types in Registry

**Files:**
- Modify: `apps/desktop/src/renderer/nodes/registry.tsx`

**Step 1: Add imports and registrations**

In `registry.tsx`, add imports after the existing imports (~line 21):

```typescript
import { NoteNode } from './NoteNode';
import { CodeNode } from './CodeNode';
import { ImageNode } from './ImageNode';
```

Add schema imports (~line 28):

```typescript
import {
  // ... existing imports ...
  NoteNodeDataSchema,
  CodeNodeDataSchema,
  ImageNodeDataSchema,
} from './schemas';
```

Add to `NODE_CONFIGS` array (before the closing `]` at ~line 147):

```typescript
  {
    type: 'note',
    component: NoteNode as ComponentType<NodeProps>,
    persistence: {
      enabled: true,
      dataSchema: NoteNodeDataSchema,
    },
  },
  {
    type: 'code',
    component: CodeNode as ComponentType<NodeProps>,
    persistence: {
      enabled: true,
      dataSchema: CodeNodeDataSchema,
    },
  },
  {
    type: 'image',
    component: ImageNode as ComponentType<NodeProps>,
    persistence: {
      enabled: true,
      dataSchema: ImageNodeDataSchema,
    },
  },
```

**Step 2: Run all tests to verify no regressions**

Run: `cd apps/desktop && npx vitest run`
Expected: All existing tests PASS

**Step 3: Commit**

```bash
git add apps/desktop/src/renderer/nodes/registry.tsx
git commit -m "feat: register note, code, and image node types in registry"
```

---

## Task 8: Add Canvas Actions for New Node Types

**Files:**
- Modify: `apps/desktop/src/renderer/services/CanvasNodeService.ts`
- Modify: `apps/desktop/src/renderer/features/canvas/hooks/useCanvasActions.ts`

**Step 1: Add factory methods to CanvasNodeService**

In `CanvasNodeService.ts`, add before the `createAgentNodeFromStarter` method:

```typescript
  /**
   * Create a note node
   */
  createNoteNode(
    options: CreateNodeOptions & { filePath?: string; content?: string; title?: string }
  ): Node {
    const nodePosition = this.resolvePosition(options);

    return {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'note',
      position: nodePosition,
      data: {
        filePath: options.filePath,
        content: options.content ?? '',
        title: options.title ?? 'Untitled Note',
        isEditing: !options.filePath, // Start in edit mode for new inline notes
      },
      style: {
        width: 400,
        height: 350,
      },
    };
  }

  /**
   * Create a code node
   */
  createCodeNode(
    options: CreateNodeOptions & {
      filePath?: string;
      content?: string;
      title?: string;
      language?: string;
    }
  ): Node {
    const nodePosition = this.resolvePosition(options);

    return {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'code',
      position: nodePosition,
      data: {
        filePath: options.filePath,
        content: options.content ?? '',
        title: options.title ?? 'Untitled',
        language: options.language,
        isEditing: false,
      },
      style: {
        width: 500,
        height: 400,
      },
    };
  }

  /**
   * Create an image node
   */
  createImageNode(
    options: CreateNodeOptions & { filePath: string; title?: string; mimeType?: string }
  ): Node {
    const nodePosition = this.resolvePosition(options);

    return {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'image',
      position: nodePosition,
      data: {
        filePath: options.filePath,
        title: options.title ?? options.filePath.split('/').pop() ?? 'Image',
        mimeType: options.mimeType,
      },
      style: {
        width: 400,
        height: 300,
      },
    };
  }
```

**Step 2: Add actions to useCanvasActions**

In `useCanvasActions.ts`, add to the `UseCanvasActionsReturn` interface:

```typescript
  /** Add a note node to the canvas */
  addNoteNode: (position?: { x: number; y: number }) => void;
  /** Add a code node to the canvas */
  addCodeNode: (position?: { x: number; y: number }) => void;
  /** Add a file-backed node from a file path (auto-detects type) */
  addFileNode: (filePath: string, content: string, position?: { x: number; y: number }) => void;
```

Add implementations inside the hook function:

```typescript
  const addNoteNode = useCallback(
    (position?: { x: number; y: number }) => {
      const newNode = canvasNodeService.createNoteNode({
        position,
        contextMenuPosition: contextMenu,
        screenToFlowPosition,
      });
      setNodes((nds) => [...nds, newNode]);
      closeContextMenu();
    },
    [contextMenu, screenToFlowPosition, setNodes, closeContextMenu]
  );

  const addCodeNode = useCallback(
    (position?: { x: number; y: number }) => {
      const newNode = canvasNodeService.createCodeNode({
        position,
        contextMenuPosition: contextMenu,
        screenToFlowPosition,
        content: '// Start coding here...\n',
        title: 'Untitled',
      });
      setNodes((nds) => [...nds, newNode]);
      closeContextMenu();
    },
    [contextMenu, screenToFlowPosition, setNodes, closeContextMenu]
  );

  const addFileNode = useCallback(
    (filePath: string, content: string, position?: { x: number; y: number }) => {
      const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
      const fileName = filePath.split('/').pop() ?? filePath;
      const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp'];
      const mdExts = ['.md', '.mdx', '.markdown'];

      let newNode: Node;

      if (imageExts.includes(ext)) {
        newNode = canvasNodeService.createImageNode({
          position,
          contextMenuPosition: contextMenu,
          screenToFlowPosition,
          filePath,
          title: fileName,
        });
      } else if (mdExts.includes(ext)) {
        newNode = canvasNodeService.createNoteNode({
          position,
          contextMenuPosition: contextMenu,
          screenToFlowPosition,
          filePath,
          content,
          title: fileName,
        });
      } else {
        newNode = canvasNodeService.createCodeNode({
          position,
          contextMenuPosition: contextMenu,
          screenToFlowPosition,
          filePath,
          content,
          title: fileName,
        });
      }

      setNodes((nds) => [...nds, newNode]);
      closeContextMenu();
    },
    [contextMenu, screenToFlowPosition, setNodes, closeContextMenu]
  );
```

Add to the return object:

```typescript
  return {
    // ... existing returns ...
    addNoteNode,
    addCodeNode,
    addFileNode,
  };
```

**Step 3: Run tests**

Run: `cd apps/desktop && npx vitest run`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add apps/desktop/src/renderer/services/CanvasNodeService.ts apps/desktop/src/renderer/features/canvas/hooks/useCanvasActions.ts
git commit -m "feat: add canvas actions for note, code, and image nodes"
```

---

## Task 9: Add New Tiles to Context Menu

**Files:**
- Modify: `apps/desktop/src/renderer/features/canvas/components/ContextMenu.tsx`

**Step 1: Add new menu items**

In `ContextMenu.tsx`, add after the "Spawn Multiple..." item (~line 47) and before the divider:

```tsx
            <div className="context-menu-divider" />
            <div className="context-menu-item" onClick={() => canvasActions.addNoteNode()}>
              <span className="context-menu-label">Add Note</span>
              <span className="context-menu-shortcut">{isMac ? '⌘M' : 'Ctrl+M'}</span>
            </div>
            <div className="context-menu-item" onClick={() => canvasActions.addCodeNode()}>
              <span className="context-menu-label">Add Code</span>
            </div>
```

**Step 2: Commit**

```bash
git add apps/desktop/src/renderer/features/canvas/components/ContextMenu.tsx
git commit -m "feat: add note and code tiles to context menu"
```

---

## Task 10: Navigator File Tree Store

**Files:**
- Create: `apps/desktop/src/renderer/features/navigator/store/navigatorStore.ts`
- Create: `apps/desktop/src/renderer/features/navigator/store/types.ts`
- Create: `apps/desktop/src/renderer/features/navigator/__tests__/navigatorStore.test.ts`

**Step 1: Write the failing test**

Create `apps/desktop/src/renderer/features/navigator/__tests__/navigatorStore.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock electron IPC
vi.stubGlobal('window', {
  electron: {
    ipcRenderer: {
      invoke: vi.fn(),
    },
  },
});

describe('navigatorStore', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(window.electron!.ipcRenderer.invoke).mockReset();
  });

  it('should initialize with no root path', async () => {
    const { useNavigatorStore } = await import('../store/navigatorStore');
    const state = useNavigatorStore.getState();
    expect(state.rootPath).toBeNull();
    expect(state.entries).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('should load directory entries when setRootPath is called', async () => {
    vi.mocked(window.electron!.ipcRenderer.invoke).mockResolvedValueOnce({
      success: true,
      entries: [
        { name: 'src', path: '/project/src', isDirectory: true, size: 0, modifiedAt: '2026-01-01', extension: '' },
        { name: 'README.md', path: '/project/README.md', isDirectory: false, size: 100, modifiedAt: '2026-01-01', extension: '.md' },
      ],
    });

    const { useNavigatorStore } = await import('../store/navigatorStore');
    await useNavigatorStore.getState().setRootPath('/project');

    const state = useNavigatorStore.getState();
    expect(state.rootPath).toBe('/project');
    expect(state.entries.length).toBe(2);
    expect(state.entries[0].name).toBe('src');
  });

  it('should expand a directory', async () => {
    vi.mocked(window.electron!.ipcRenderer.invoke)
      .mockResolvedValueOnce({
        success: true,
        entries: [
          { name: 'src', path: '/project/src', isDirectory: true, size: 0, modifiedAt: '2026-01-01', extension: '' },
        ],
      })
      .mockResolvedValueOnce({
        success: true,
        entries: [
          { name: 'index.ts', path: '/project/src/index.ts', isDirectory: false, size: 50, modifiedAt: '2026-01-01', extension: '.ts' },
        ],
      });

    const { useNavigatorStore } = await import('../store/navigatorStore');
    await useNavigatorStore.getState().setRootPath('/project');
    await useNavigatorStore.getState().toggleExpanded('/project/src');

    const state = useNavigatorStore.getState();
    expect(state.expandedPaths.has('/project/src')).toBe(true);
    expect(state.childEntries['/project/src']).toBeDefined();
    expect(state.childEntries['/project/src'].length).toBe(1);
  });

  it('should collapse a directory', async () => {
    vi.mocked(window.electron!.ipcRenderer.invoke)
      .mockResolvedValueOnce({
        success: true,
        entries: [
          { name: 'src', path: '/project/src', isDirectory: true, size: 0, modifiedAt: '2026-01-01', extension: '' },
        ],
      })
      .mockResolvedValueOnce({
        success: true,
        entries: [],
      });

    const { useNavigatorStore } = await import('../store/navigatorStore');
    await useNavigatorStore.getState().setRootPath('/project');
    await useNavigatorStore.getState().toggleExpanded('/project/src');
    await useNavigatorStore.getState().toggleExpanded('/project/src');

    const state = useNavigatorStore.getState();
    expect(state.expandedPaths.has('/project/src')).toBe(false);
  });

  it('should filter entries by search query', async () => {
    vi.mocked(window.electron!.ipcRenderer.invoke).mockResolvedValueOnce({
      success: true,
      entries: [
        { name: 'index.ts', path: '/project/index.ts', isDirectory: false, size: 50, modifiedAt: '2026-01-01', extension: '.ts' },
        { name: 'README.md', path: '/project/README.md', isDirectory: false, size: 100, modifiedAt: '2026-01-01', extension: '.md' },
        { name: 'src', path: '/project/src', isDirectory: true, size: 0, modifiedAt: '2026-01-01', extension: '' },
      ],
    });

    const { useNavigatorStore } = await import('../store/navigatorStore');
    await useNavigatorStore.getState().setRootPath('/project');
    useNavigatorStore.getState().setSearchQuery('index');

    const state = useNavigatorStore.getState();
    expect(state.searchQuery).toBe('index');
    // Filtering is done in the component via selector, store just holds the query
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/desktop && npx vitest run src/renderer/features/navigator/__tests__/navigatorStore.test.ts`
Expected: FAIL

**Step 3: Create types**

Create `apps/desktop/src/renderer/features/navigator/store/types.ts`:

```typescript
export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: string;
  extension: string;
}

export type SortMode = 'name' | 'modified' | 'created';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'tree' | 'feed';
```

**Step 4: Create the store**

Create `apps/desktop/src/renderer/features/navigator/store/navigatorStore.ts`:

```typescript
/**
 * Navigator Store — File tree state management.
 *
 * Manages the file tree for the Navigator sidebar.
 * Lazy-loads directory contents on expand.
 */
import { create } from 'zustand';
import type { FileEntry, SortDirection, SortMode, ViewMode } from './types';

interface NavigatorState {
  rootPath: string | null;
  entries: FileEntry[];
  childEntries: Record<string, FileEntry[]>;
  expandedPaths: Set<string>;
  selectedPath: string | null;
  searchQuery: string;
  sortMode: SortMode;
  sortDirection: SortDirection;
  viewMode: ViewMode;
  isLoading: boolean;
  error: string | null;

  setRootPath: (path: string) => Promise<void>;
  toggleExpanded: (path: string) => Promise<void>;
  setSelectedPath: (path: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSortMode: (mode: SortMode) => void;
  setSortDirection: (direction: SortDirection) => void;
  setViewMode: (mode: ViewMode) => void;
  refresh: () => Promise<void>;
}

async function loadDirectory(dirPath: string): Promise<FileEntry[]> {
  const result = await window.electron!.ipcRenderer.invoke('fs:readdir', dirPath);
  if (!result.success) {
    throw new Error(result.error || 'Failed to read directory');
  }
  return result.entries;
}

export const useNavigatorStore = create<NavigatorState>((set, get) => ({
  rootPath: null,
  entries: [],
  childEntries: {},
  expandedPaths: new Set(),
  selectedPath: null,
  searchQuery: '',
  sortMode: 'name',
  sortDirection: 'asc',
  viewMode: 'tree',
  isLoading: false,
  error: null,

  setRootPath: async (path: string) => {
    set({ isLoading: true, error: null, rootPath: path });
    try {
      const entries = await loadDirectory(path);
      set({
        entries,
        childEntries: {},
        expandedPaths: new Set(),
        selectedPath: null,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  toggleExpanded: async (path: string) => {
    const { expandedPaths, childEntries } = get();
    const newExpanded = new Set(expandedPaths);

    if (newExpanded.has(path)) {
      newExpanded.delete(path);
      set({ expandedPaths: newExpanded });
    } else {
      newExpanded.add(path);
      set({ expandedPaths: newExpanded });

      // Load children if not already loaded
      if (!childEntries[path]) {
        try {
          const entries = await loadDirectory(path);
          set((state) => ({
            childEntries: { ...state.childEntries, [path]: entries },
          }));
        } catch (error: any) {
          console.error('[Navigator] Failed to load directory:', path, error);
        }
      }
    }
  },

  setSelectedPath: (path) => set({ selectedPath: path }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortMode: (mode) => set({ sortMode: mode }),
  setSortDirection: (direction) => set({ sortDirection: direction }),
  setViewMode: (mode) => set({ viewMode: mode }),

  refresh: async () => {
    const { rootPath } = get();
    if (rootPath) {
      await get().setRootPath(rootPath);
    }
  },
}));
```

**Step 5: Run test to verify it passes**

Run: `cd apps/desktop && npx vitest run src/renderer/features/navigator/__tests__/navigatorStore.test.ts`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add apps/desktop/src/renderer/features/navigator/
git commit -m "feat: add navigator file tree store with lazy directory loading"
```

---

## Task 11: Navigator Sidebar Component

**Files:**
- Create: `apps/desktop/src/renderer/features/navigator/Navigator.tsx`
- Create: `apps/desktop/src/renderer/features/navigator/Navigator.css`
- Create: `apps/desktop/src/renderer/features/navigator/components/FileTreeItem.tsx`
- Create: `apps/desktop/src/renderer/features/navigator/index.ts`

**Step 1: Create FileTreeItem component**

Create `apps/desktop/src/renderer/features/navigator/components/FileTreeItem.tsx`:

```tsx
/**
 * FileTreeItem — Single file/folder row in the navigator tree.
 */
import type { FileEntry } from '../store/types';

interface FileTreeItemProps {
  entry: FileEntry;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  children?: FileEntry[];
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  onDragStart: (e: React.DragEvent, entry: FileEntry) => void;
  renderChildren?: (entries: FileEntry[], depth: number) => React.ReactNode;
}

const FILE_ICONS: Record<string, string> = {
  '.ts': '📄', '.tsx': '⚛️', '.js': '📄', '.jsx': '⚛️',
  '.py': '🐍', '.md': '📝', '.json': '📋', '.css': '🎨',
  '.html': '🌐', '.svg': '🖼️', '.png': '🖼️', '.jpg': '🖼️',
  '.gif': '🖼️', '.webp': '🖼️',
};

function getFileIcon(entry: FileEntry): string {
  if (entry.isDirectory) return '📁';
  return FILE_ICONS[entry.extension] ?? '📄';
}

export function FileTreeItem({
  entry,
  depth,
  isExpanded,
  isSelected,
  children,
  onToggle,
  onSelect,
  onDragStart,
  renderChildren,
}: FileTreeItemProps) {
  return (
    <>
      <div
        className={`nav-tree-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => {
          onSelect(entry.path);
          if (entry.isDirectory) {
            onToggle(entry.path);
          }
        }}
        draggable={!entry.isDirectory}
        onDragStart={(e) => onDragStart(e, entry)}
      >
        {entry.isDirectory && (
          <span className={`nav-tree-chevron ${isExpanded ? 'expanded' : ''}`}>▶</span>
        )}
        <span className="nav-tree-icon">{getFileIcon(entry)}</span>
        <span className="nav-tree-name">{entry.name}</span>
      </div>
      {entry.isDirectory && isExpanded && children && renderChildren?.(children, depth + 1)}
    </>
  );
}
```

**Step 2: Create Navigator component**

Create `apps/desktop/src/renderer/features/navigator/Navigator.tsx`:

```tsx
/**
 * Navigator — File tree sidebar panel.
 *
 * Displays hierarchical file tree for the selected workspace.
 * Supports search, sort, drag-to-canvas.
 */
import { useCallback } from 'react';
import { FileTreeItem } from './components/FileTreeItem';
import { useNavigatorStore } from './store/navigatorStore';
import type { FileEntry } from './store/types';
import './Navigator.css';

interface NavigatorProps {
  onOpenDirectory: () => void;
}

export function Navigator({ onOpenDirectory }: NavigatorProps) {
  const {
    rootPath, entries, childEntries, expandedPaths, selectedPath,
    searchQuery, isLoading, error,
    toggleExpanded, setSelectedPath, setSearchQuery, refresh,
  } = useNavigatorStore();

  const handleDragStart = useCallback((e: React.DragEvent, entry: FileEntry) => {
    e.dataTransfer.setData('application/termcanvas-file', JSON.stringify(entry));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const filteredEntries = searchQuery
    ? entries.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : entries;

  const renderEntries = useCallback(
    (items: FileEntry[], depth: number) => {
      return items.map((entry) => (
        <FileTreeItem
          key={entry.path}
          entry={entry}
          depth={depth}
          isExpanded={expandedPaths.has(entry.path)}
          isSelected={selectedPath === entry.path}
          children={childEntries[entry.path]}
          onToggle={toggleExpanded}
          onSelect={setSelectedPath}
          onDragStart={handleDragStart}
          renderChildren={renderEntries}
        />
      ));
    },
    [expandedPaths, selectedPath, childEntries, toggleExpanded, setSelectedPath, handleDragStart]
  );

  if (!rootPath) {
    return (
      <div className="navigator-empty">
        <p>No workspace open</p>
        <button className="navigator-open-btn" onClick={onOpenDirectory}>
          Open Folder
        </button>
      </div>
    );
  }

  return (
    <div className="navigator">
      <div className="navigator-header">
        <span className="navigator-title">{rootPath.split('/').pop()}</span>
        <button className="navigator-action" onClick={refresh} title="Refresh">↻</button>
        <button className="navigator-action" onClick={onOpenDirectory} title="Open folder">+</button>
      </div>
      <div className="navigator-search">
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="navigator-search-input"
        />
      </div>
      <div className="navigator-tree">
        {isLoading && <div className="navigator-loading">Loading...</div>}
        {error && <div className="navigator-error">{error}</div>}
        {!isLoading && !error && renderEntries(filteredEntries, 0)}
      </div>
    </div>
  );
}
```

**Step 3: Create the CSS**

Create `apps/desktop/src/renderer/features/navigator/Navigator.css`:

```css
.navigator {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.navigator-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--color-text-secondary, #999);
  font-size: 13px;
}

.navigator-open-btn {
  padding: 6px 16px;
  background: var(--color-accent, #4a9eff);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

.navigator-open-btn:hover {
  opacity: 0.9;
}

.navigator-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border, #333);
}

.navigator-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary, #e0e0e0);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.navigator-action {
  background: none;
  border: none;
  color: var(--color-text-secondary, #999);
  font-size: 14px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.navigator-action:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-primary, #e0e0e0);
}

.navigator-search {
  padding: 6px 8px;
  border-bottom: 1px solid var(--color-border, #333);
}

.navigator-search-input {
  width: 100%;
  padding: 5px 8px;
  background: var(--color-bg-primary, #0d0d1a);
  border: 1px solid var(--color-border, #333);
  border-radius: 4px;
  color: var(--color-text-primary, #e0e0e0);
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
}

.navigator-search-input:focus {
  border-color: var(--color-accent, #4a9eff);
}

.navigator-tree {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 0;
}

.navigator-loading,
.navigator-error {
  padding: 12px;
  font-size: 12px;
  color: var(--color-text-secondary, #999);
  text-align: center;
}

.navigator-error {
  color: #f87171;
}

/* File tree items */
.nav-tree-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 12px;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text-primary, #e0e0e0);
  user-select: none;
}

.nav-tree-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.nav-tree-item.selected {
  background: rgba(74, 158, 255, 0.12);
}

.nav-tree-chevron {
  font-size: 8px;
  transition: transform 0.15s;
  width: 12px;
  text-align: center;
  color: var(--color-text-secondary, #999);
}

.nav-tree-chevron.expanded {
  transform: rotate(90deg);
}

.nav-tree-icon {
  font-size: 14px;
  width: 18px;
  text-align: center;
}

.nav-tree-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

**Step 4: Create barrel export**

Create `apps/desktop/src/renderer/features/navigator/index.ts`:

```typescript
export { Navigator } from './Navigator';
export { useNavigatorStore } from './store/navigatorStore';
export type { FileEntry } from './store/types';
```

**Step 5: Commit**

```bash
git add apps/desktop/src/renderer/features/navigator/
git commit -m "feat: add navigator sidebar component with file tree and search"
```

---

## Task 12: Integrate Navigator into Sidebar

**Files:**
- Modify: `apps/desktop/src/renderer/features/sidebar/Sidebar.tsx`
- Modify: `apps/desktop/src/renderer/features/index.ts` (if barrel exists)

**Step 1: Add Navigator tab to Sidebar**

Replace the Sidebar component to include a tabbed layout. Modify `apps/desktop/src/renderer/features/sidebar/Sidebar.tsx`:

Add import at top:
```typescript
import { useState } from 'react';
import { Navigator } from '../navigator';
```

Inside the `Sidebar` component, add tab state and tab UI before the existing content:

```tsx
export function Sidebar({ sidebar, githubUser, /* ... rest of existing props */ }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'agents'>('files');

  const handleOpenDirectory = async () => {
    const result = await window.electron?.ipcRenderer.invoke('dialog:open-directory');
    if (result?.success && result.path) {
      const { useNavigatorStore } = await import('../navigator');
      useNavigatorStore.getState().setRootPath(result.path);
    }
  };

  return (
    <>
      <div
        className={`canvas-sidebar ${sidebar.isSidebarCollapsed ? 'collapsed' : ''}`}
        style={{ width: sidebar.isSidebarCollapsed ? 0 : `${sidebar.sidebarWidth}px` }}
      >
        <SidebarHeader
          username={githubUser.username}
          error={githubUser.error}
          onToggle={sidebar.toggleSidebar}
        />

        {!sidebar.isSidebarCollapsed && (
          <>
            <div className="sidebar-tabs">
              <button
                className={`sidebar-tab ${activeTab === 'files' ? 'active' : ''}`}
                onClick={() => setActiveTab('files')}
              >
                Files
              </button>
              <button
                className={`sidebar-tab ${activeTab === 'agents' ? 'active' : ''}`}
                onClick={() => setActiveTab('agents')}
              >
                Agents
              </button>
            </div>

            <div className="sidebar-content">
              {activeTab === 'files' && (
                <Navigator onOpenDirectory={handleOpenDirectory} />
              )}

              {activeTab === 'agents' && (
                <>
                  {hasAgents && (
                    <AgentHierarchySection
                      hierarchy={agentHierarchy}
                      folderPathMap={folderPathMap}
                      collapsedProjects={sidebar.collapsedProjects}
                      collapsedBranches={sidebar.collapsedBranches}
                      onToggleProject={sidebar.toggleProject}
                      onToggleBranch={sidebar.toggleBranch}
                      folderLock={folderLock}
                      folderHighlight={folderHighlight}
                    />
                  )}

                  {linear.isConnected && (
                    <LinearIssuesPanel
                      linear={linear}
                      linearPanel={linearPanel}
                      onIssueDragStart={onIssueDragStart}
                      onIssueClick={onIssueClick}
                    />
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {!sidebar.isSidebarCollapsed && (
        <div className="sidebar-resize-handle" onMouseDown={linearPanel.handleResizeStart} />
      )}
    </>
  );
}
```

**Step 2: Add sidebar tab styles**

Add to existing Canvas.css or create sidebar tab styles (look for where sidebar styles live):

```css
.sidebar-tabs {
  display: flex;
  padding: 4px 8px;
  gap: 4px;
  border-bottom: 1px solid var(--color-border, #333);
}

.sidebar-tab {
  flex: 1;
  padding: 5px 8px;
  background: none;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--color-text-secondary, #999);
  font-size: 12px;
  cursor: pointer;
  text-align: center;
}

.sidebar-tab.active {
  background: var(--color-bg-primary, #0d0d1a);
  color: var(--color-text-primary, #e0e0e0);
  border-color: var(--color-border, #333);
}

.sidebar-tab:hover:not(.active) {
  color: var(--color-text-primary, #e0e0e0);
}
```

**Step 3: Run all tests**

Run: `cd apps/desktop && npx vitest run`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add apps/desktop/src/renderer/features/sidebar/Sidebar.tsx
git commit -m "feat: integrate navigator file tree as sidebar tab alongside agents"
```

---

## Task 13: Drag & Drop from Navigator to Canvas

**Files:**
- Modify: `apps/desktop/src/renderer/Canvas.tsx` (the `onDrop` handler)
- Modify: `apps/desktop/src/renderer/features/canvas/hooks/useCanvasDrop.ts` (if exists) or Canvas.tsx drop handler

**Step 1: Add file drop handler to canvas**

Find the existing drop handling in Canvas.tsx (likely in `useCanvasDrop` or inline). Add a handler for `application/termcanvas-file` data transfer:

```typescript
const handleFileDrop = useCallback(
  async (event: React.DragEvent) => {
    const fileData = event.dataTransfer.getData('application/termcanvas-file');
    if (!fileData) return false;

    event.preventDefault();
    const entry = JSON.parse(fileData) as { name: string; path: string; isDirectory: boolean; extension: string };
    if (entry.isDirectory) return false;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp'];

    if (imageExts.includes(entry.extension.toLowerCase())) {
      // Image — no need to read content
      canvasActions.addFileNode(entry.path, '', position);
    } else {
      // Read file content, then create appropriate node
      const result = await window.electron?.ipcRenderer.invoke('fs:read-file', entry.path);
      const content = result?.success ? result.content : '';
      canvasActions.addFileNode(entry.path, content, position);
    }

    return true;
  },
  [screenToFlowPosition, canvasActions]
);
```

Wire this into the existing `onDrop` / `onDragOver` handler in the ReactFlow component:

In the `<ReactFlow>` component props:
```tsx
onDrop={(event) => {
  // Try file drop first, then fall back to existing drop handlers
  handleFileDrop(event);
}}
onDragOver={(event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
}}
```

**Step 2: Run tests**

Run: `cd apps/desktop && npx vitest run`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add apps/desktop/src/renderer/Canvas.tsx
git commit -m "feat: add drag-drop from navigator file tree to canvas"
```

---

## Task 14: Workspace Management

**Files:**
- Modify: `apps/desktop/src/renderer/features/navigator/Navigator.tsx` (add workspace selector)
- Modify: `apps/desktop/src/renderer/features/navigator/store/navigatorStore.ts` (recent workspaces)

**Step 1: Extend navigator store with workspace list**

Add to `navigatorStore.ts`:

```typescript
// Add to state interface:
recentWorkspaces: Array<{ path: string; name: string }>;
loadRecentWorkspaces: () => Promise<void>;

// Add to store implementation:
recentWorkspaces: [],

loadRecentWorkspaces: async () => {
  const result = await window.electron!.ipcRenderer.invoke('recent-workspaces:get', 10);
  if (result.success) {
    set({ recentWorkspaces: result.data.map((w: any) => ({ path: w.path, name: w.name })) });
  }
},

// Modify setRootPath to also save as recent workspace:
setRootPath: async (path: string) => {
  set({ isLoading: true, error: null, rootPath: path });
  try {
    const entries = await loadDirectory(path);
    set({
      entries,
      childEntries: {},
      expandedPaths: new Set(),
      selectedPath: null,
      isLoading: false,
    });
    // Save as recent workspace
    const name = path.split('/').pop() || path;
    await window.electron!.ipcRenderer.invoke('recent-workspaces:upsert', { path, name });
  } catch (error: any) {
    set({ error: error.message, isLoading: false });
  }
},
```

**Step 2: Add workspace selector dropdown to Navigator**

Add a workspace selector at the top of the Navigator component (in `Navigator.tsx`):

```tsx
// Add near top of Navigator component:
const { recentWorkspaces, loadRecentWorkspaces, setRootPath } = useNavigatorStore();
const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);

useEffect(() => {
  loadRecentWorkspaces();
}, [loadRecentWorkspaces]);

// In the navigator-header, add a dropdown:
<div className="navigator-workspace-selector">
  <button
    className="navigator-workspace-btn"
    onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
  >
    {rootPath?.split('/').pop() ?? 'Select workspace'} ▾
  </button>
  {showWorkspaceDropdown && (
    <div className="navigator-workspace-dropdown">
      {recentWorkspaces.map((w) => (
        <div
          key={w.path}
          className={`navigator-workspace-option ${w.path === rootPath ? 'active' : ''}`}
          onClick={() => {
            setRootPath(w.path);
            setShowWorkspaceDropdown(false);
          }}
        >
          {w.name}
        </div>
      ))}
      <div className="navigator-workspace-divider" />
      <div
        className="navigator-workspace-option"
        onClick={() => {
          onOpenDirectory();
          setShowWorkspaceDropdown(false);
        }}
      >
        Open Folder...
      </div>
    </div>
  )}
</div>
```

**Step 3: Add IPC handler for recent-workspaces:upsert (if not existing)**

Check if `recent-workspaces:upsert` exists in main.ts. If not, it's already covered by `recent-workspaces:get` and the database's `upsertRecentWorkspace`. Add:

```typescript
ipcMain.handle('recent-workspaces:upsert', async (_event, workspace: { path: string; name: string }) => {
  try {
    await database.upsertRecentWorkspace(workspace);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
```

**Step 4: Run tests**

Run: `cd apps/desktop && npx vitest run`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add apps/desktop/src/renderer/features/navigator/ apps/desktop/src/main/main.ts
git commit -m "feat: add workspace selector with recent workspaces to navigator"
```

---

## Task 15: Final Integration Test & Verification

**Step 1: Run full test suite**

Run: `cd /Users/niarora/openclaw_workspace/termcanvas && npx vitest run`
Expected: All tests PASS (existing 258+ plus new tests)

**Step 2: Build check**

Run: `cd /Users/niarora/openclaw_workspace/termcanvas && npm run build 2>&1 | tail -20`
Expected: No TypeScript errors, build succeeds

**Step 3: Dev mode visual verification**

Run: `cd /Users/niarora/openclaw_workspace/termcanvas && npm run dev`

Verify:
- [ ] Sidebar has Files/Agents tabs
- [ ] Files tab shows "Open Folder" button when no workspace
- [ ] Opening a folder populates file tree
- [ ] Expanding folders shows children
- [ ] Search filters entries
- [ ] Right-click canvas shows "Add Note" and "Add Code" options
- [ ] Note tile renders markdown with edit-on-doubleclick
- [ ] Code tile shows syntax highlighting with line numbers
- [ ] Dragging .md file from tree creates Note tile
- [ ] Dragging .ts file creates Code tile
- [ ] Dragging .png file creates Image tile
- [ ] Workspace selector shows recent workspaces
- [ ] All existing features (terminals, agents, browsers) still work

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete collaborator feature parity — navigator, note/code/image tiles, workspace management"
```

---

## Summary

| Task | Description | Est. Steps |
|------|-------------|-----------|
| 1 | Install CodeMirror deps | 3 |
| 2 | File system IPC handlers + tests | 6 |
| 3 | Note/Code/Image node schemas + tests | 5 |
| 4 | NoteNode component | 4 |
| 5 | CodeNode component + CodeMirror hook | 5 |
| 6 | ImageNode component | 4 |
| 7 | Register new nodes in registry | 3 |
| 8 | Canvas actions for new node types | 4 |
| 9 | Context menu additions | 2 |
| 10 | Navigator store + tests | 6 |
| 11 | Navigator sidebar component | 5 |
| 12 | Integrate navigator into sidebar | 4 |
| 13 | Drag & drop file-to-canvas | 3 |
| 14 | Workspace management | 5 |
| 15 | Final integration & verification | 4 |
| **Total** | | **63 steps** |
