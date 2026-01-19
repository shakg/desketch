import { describe, it, expect } from 'vitest';
import {
  sortItems,
  generateUniqueName,
  getParentPath,
  validateRenameName,
  isMoveIntoSelf,
  collectFolderIds,
} from './fileTreeUtils';
import type { FileSystemItem } from '../types';

describe('generateUniqueName', () => {
  it('keeps the name when no conflict exists', () => {
    const result = generateUniqueName('Sketch.tldr', new Set(['Notes.tldr']), true);
    expect(result).toBe('Sketch.tldr');
  });

  it('adds -copy when a file name already exists', () => {
    const result = generateUniqueName('Sketch.tldr', new Set(['Sketch.tldr']), true);
    expect(result).toBe('Sketch-copy.tldr');
  });

  it('increments copy number when needed', () => {
    const existing = new Set(['Sketch.tldr', 'Sketch-copy.tldr', 'Sketch-copy-2.tldr']);
    const result = generateUniqueName('Sketch.tldr', existing, true);
    expect(result).toBe('Sketch-copy-3.tldr');
  });

  it('handles folders without extensions', () => {
    const result = generateUniqueName('Ideas', new Set(['Ideas', 'Ideas-copy']), false);
    expect(result).toBe('Ideas-copy-2');
  });
});

describe('validateRenameName', () => {
  it('trims whitespace from names', () => {
    const result = validateRenameName('  Roadmap  ', 'folder');
    if (!result.ok) throw new Error('expected valid result');
    expect(result.name).toBe('Roadmap');
  });

  it('rejects empty names', () => {
    const result = validateRenameName('   ', 'file');
    if (result.ok) throw new Error('expected invalid result');
    expect(result.error).toBe('Name cannot be empty');
  });

  it('rejects invalid filename characters', () => {
    const result = validateRenameName('bad:name', 'file');
    if (result.ok) throw new Error('expected invalid result');
    expect(result.error).toBe('Name contains invalid characters');
  });

  it('appends .tldr for file names', () => {
    const result = validateRenameName('Wireframe', 'file');
    if (!result.ok) throw new Error('expected valid result');
    expect(result.name).toBe('Wireframe.tldr');
  });
});

describe('sortItems', () => {
  const items: FileSystemItem[] = [
    { id: 'f1', name: 'B', path: '/B', type: 'folder', children: [] },
    { id: 'a', name: 'a.tldr', path: '/a.tldr', type: 'file', modifiedAt: 2 },
    { id: 'c', name: 'c.tldr', path: '/c.tldr', type: 'file', modifiedAt: 1 },
    { id: 'f2', name: 'A', path: '/A', type: 'folder', children: [] },
  ];

  it('keeps folders before files', () => {
    const result = sortItems(items, 'name-asc');
    expect(result[0].type).toBe('folder');
    expect(result[1].type).toBe('folder');
  });

  it('sorts by name ascending within type', () => {
    const result = sortItems(items, 'name-asc');
    expect(result[0].name).toBe('A');
    expect(result[1].name).toBe('B');
  });

  it('sorts by date descending for files', () => {
    const result = sortItems(items, 'date-desc');
    const fileNames = result.filter((item) => item.type === 'file').map((item) => item.name);
    expect(fileNames).toEqual(['a.tldr', 'c.tldr']);
  });
});

describe('path helpers', () => {
  it('returns the parent path for a file', () => {
    expect(getParentPath('/projects/alpha/sketch.tldr')).toBe('/projects/alpha');
  });

  it('detects moves into a folder itself', () => {
    expect(isMoveIntoSelf('/projects/alpha', '/projects/alpha/sub')).toBe(true);
    expect(isMoveIntoSelf('/projects/alpha', '/projects/beta')).toBe(false);
  });

  it('collects folder ids recursively', () => {
    const tree: FileSystemItem[] = [
      {
        id: 'root',
        name: 'root',
        path: '/root',
        type: 'folder',
        children: [
          { id: 'child', name: 'child', path: '/root/child', type: 'folder', children: [] },
          { id: 'file', name: 'file.tldr', path: '/root/file.tldr', type: 'file' },
        ],
      },
    ];
    expect(collectFolderIds(tree)).toEqual(['root', 'child']);
  });
});
