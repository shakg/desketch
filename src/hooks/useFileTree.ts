import { useState, useCallback, useRef, useEffect } from 'react';
import { readDir, stat, rename, remove, mkdir, copyFile, writeTextFile, exists } from '@tauri-apps/plugin-fs';
import { watch } from '@tauri-apps/plugin-fs';
import type { UnlistenFn } from '@tauri-apps/api/event';
import {
  FileSystemItem,
  SortMode,
  SelectionState,
  RenameState,
  FileOperationResult,
} from '../types';
import {
  sortItems,
  generateUniqueName,
  getParentPath,
  validateRenameName,
  isMoveIntoSelf,
  collectFolderIds,
} from '../utils/fileTreeUtils';
import { computeSelection } from '../utils/selectionUtils';
import { copyTextToClipboard } from '../utils/clipboardUtils';
import { createDebouncedCallback } from '../utils/debounce';

interface UseFileTreeOptions {
  projectPath: string | null;
  onFileSelect: (path: string) => void;
  onError: (error: string) => void;
}

interface UseFileTreeReturn {
  items: FileSystemItem[];
  expandedIds: Set<string>;
  selection: SelectionState;
  renameState: RenameState;
  sortMode: SortMode;
  isLoading: boolean;
  isSyncing: boolean;

  // Actions
  loadTree: () => Promise<void>;
  toggleExpand: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setSortMode: (mode: SortMode) => void;

  // Selection
  selectItem: (id: string, event?: { ctrlKey?: boolean; shiftKey?: boolean }) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Rename
  startRename: (id: string) => void;
  updateRename: (value: string) => void;
  confirmRename: () => Promise<FileOperationResult>;
  cancelRename: () => void;

  // File operations
  createFile: (parentPath: string, name?: string) => Promise<FileOperationResult>;
  createFolder: (parentPath: string, name?: string) => Promise<FileOperationResult>;
  deleteItems: (ids: string[]) => Promise<FileOperationResult>;
  duplicateItem: (id: string) => Promise<FileOperationResult>;
  moveItem: (id: string, newParentPath: string) => Promise<FileOperationResult>;
  copyPath: (id: string) => void;

  // Utility
  getItemById: (id: string) => FileSystemItem | null;
  getParentPath: (path: string) => string;
  flattenTree: () => FileSystemItem[];
}

// Build tree recursively from directory
async function buildTree(
  dirPath: string,
  sortMode: SortMode,
  depth = 0,
  maxDepth = 10
): Promise<FileSystemItem[]> {
  if (depth > maxDepth) return [];

  try {
    const entries = await readDir(dirPath);
    const items: FileSystemItem[] = [];

    for (const entry of entries) {
      // Skip hidden files and directories
      if (entry.name?.startsWith('.')) continue;

      const fullPath = `${dirPath}/${entry.name}`;
      let modifiedAt: number | undefined;

      try {
        const fileStat = await stat(fullPath);
        modifiedAt = fileStat.mtime ? new Date(fileStat.mtime).getTime() : undefined;
      } catch {
        // Ignore stat errors
      }

      if (entry.isDirectory) {
        const children = await buildTree(fullPath, sortMode, depth + 1, maxDepth);
        items.push({
          id: fullPath,
          name: entry.name!,
          path: fullPath,
          type: 'folder',
          children,
          isExpanded: false,
          modifiedAt,
        });
      } else if (entry.name?.endsWith('.tldr')) {
        items.push({
          id: fullPath,
          name: entry.name!,
          path: fullPath,
          type: 'file',
          modifiedAt,
        });
      }
    }

    return sortItems(items, sortMode);
  } catch (error) {
    console.error('Failed to build tree:', error);
    return [];
  }
}

export function useFileTree({
  projectPath,
  onFileSelect,
  onError,
}: UseFileTreeOptions): UseFileTreeReturn {
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [sortMode, setSortModeState] = useState<SortMode>('name-asc');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [selection, setSelection] = useState<SelectionState>({
    selectedIds: new Set(),
    lastSelectedId: null,
    anchorId: null,
  });

  const [renameState, setRenameState] = useState<RenameState>({
    itemId: null,
    originalName: '',
    currentValue: '',
  });

  const unwatchRef = useRef<UnlistenFn | null>(null);
  // Load the file tree
  const loadTree = useCallback(async () => {
    if (!projectPath) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const tree = await buildTree(projectPath, sortMode);
      setItems(tree);
    } catch (error) {
      onError(`Failed to load project: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [projectPath, sortMode, onError]);

  // Set up file watcher
  useEffect(() => {
    if (!projectPath) return;

    const debouncedSync = createDebouncedCallback(() => {
      setIsSyncing(true);
      loadTree().finally(() => setIsSyncing(false));
    }, 300);

    const setupWatcher = async () => {
      try {
        // Clean up previous watcher
        if (unwatchRef.current) {
          unwatchRef.current();
          unwatchRef.current = null;
        }

        unwatchRef.current = await watch(
          projectPath,
          () => {
            debouncedSync.call();
          },
          { recursive: true }
        );
      } catch (error) {
        console.error('Failed to set up file watcher:', error);
      }
    };

    setupWatcher();

    return () => {
      if (unwatchRef.current) {
        unwatchRef.current();
        unwatchRef.current = null;
      }
      debouncedSync.cancel();
    };
  }, [projectPath, loadTree]);

  // Toggle folder expand/collapse
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Expand all folders
  const expandAll = useCallback(() => {
    setExpandedIds(new Set(collectFolderIds(items)));
  }, [items]);

  // Collapse all folders
  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  // Set sort mode and re-sort
  const setSortMode = useCallback((mode: SortMode) => {
    setSortModeState(mode);
    setItems((prev) => sortItems(prev, mode));
  }, []);

  // Flatten tree for navigation
  const flattenTree = useCallback((): FileSystemItem[] => {
    const flat: FileSystemItem[] = [];
    const traverse = (items: FileSystemItem[]) => {
      for (const item of items) {
        flat.push(item);
        if (item.type === 'folder' && expandedIds.has(item.id) && item.children) {
          traverse(item.children);
        }
      }
    };
    traverse(items);
    return flat;
  }, [items, expandedIds]);

  // Get item by ID
  const getItemById = useCallback(
    (id: string): FileSystemItem | null => {
      const find = (items: FileSystemItem[]): FileSystemItem | null => {
        for (const item of items) {
          if (item.id === id) return item;
          if (item.children) {
            const found = find(item.children);
            if (found) return found;
          }
        }
        return null;
      };
      return find(items);
    },
    [items]
  );

  // Select item with ctrl/shift modifiers
  const selectItem = useCallback(
    (id: string, event?: { ctrlKey?: boolean; shiftKey?: boolean }) => {
      const item = getItemById(id);
      if (!item) return;

      if (item.type === 'file' && !event?.ctrlKey && !event?.shiftKey) {
        onFileSelect(item.path);
      }

      setSelection((prev) => {
        return computeSelection({
          prev,
          flatItems: flattenTree(),
          targetId: id,
          ctrlKey: event?.ctrlKey,
          shiftKey: event?.shiftKey,
        });
      });
    },
    [getItemById, flattenTree, onFileSelect]
  );

  // Select all items in tree
  const selectAll = useCallback(() => {
    const flat = flattenTree();
    setSelection({
      selectedIds: new Set(flat.map((i) => i.id)),
      lastSelectedId: flat[flat.length - 1]?.id || null,
      anchorId: flat[0]?.id || null,
    });
  }, [flattenTree]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelection({
      selectedIds: new Set(),
      lastSelectedId: null,
      anchorId: null,
    });
  }, []);

  // Start rename mode
  const startRename = useCallback(
    (id: string) => {
      const item = getItemById(id);
      if (!item) return;

      setRenameState({
        itemId: id,
        originalName: item.name,
        currentValue: item.type === 'file' ? item.name.replace(/\.tldr$/, '') : item.name,
      });
    },
    [getItemById]
  );

  // Update rename value
  const updateRename = useCallback((value: string) => {
    setRenameState((prev) => ({ ...prev, currentValue: value }));
  }, []);

  // Confirm rename
  const confirmRename = useCallback(async (): Promise<FileOperationResult> => {
    if (!renameState.itemId) {
      return { success: false, error: 'No item selected for rename' };
    }

    const item = getItemById(renameState.itemId);
    if (!item) {
      setRenameState({ itemId: null, originalName: '', currentValue: '' });
      return { success: false, error: 'Item not found' };
    }

    const validated = validateRenameName(renameState.currentValue, item.type);
    if (!validated.ok) {
      return { success: false, error: validated.error };
    }
    const newName = validated.name;

    if (newName === item.name) {
      setRenameState({ itemId: null, originalName: '', currentValue: '' });
      return { success: true };
    }

    const parentPath = getParentPath(item.path);
    const newPath = `${parentPath}/${newName}`;

    try {
      // Check if target exists
      const targetExists = await exists(newPath);
      if (targetExists) {
        return { success: false, error: 'A file or folder with this name already exists' };
      }

      await rename(item.path, newPath);
      setRenameState({ itemId: null, originalName: '', currentValue: '' });
      await loadTree();
      return { success: true, newPath };
    } catch (error) {
      return { success: false, error: `Failed to rename: ${error}` };
    }
  }, [renameState, getItemById, getParentPath, loadTree]);

  // Cancel rename
  const cancelRename = useCallback(() => {
    setRenameState({ itemId: null, originalName: '', currentValue: '' });
  }, []);

  // Create new file
  const createFile = useCallback(
    async (parentPath: string, name?: string): Promise<FileOperationResult> => {
      const baseName = name || 'New Drawing.tldr';
      const actualName = baseName.endsWith('.tldr') ? baseName : `${baseName}.tldr`;

      try {
        const entries = await readDir(parentPath);
        const existingNames = new Set(entries.map((e) => e.name || ''));
        const uniqueName = generateUniqueName(actualName, existingNames, true);
        const filePath = `${parentPath}/${uniqueName}`;

        // Create empty tldr file with minimal content
        const emptyContent = JSON.stringify({
          store: {},
          schema: { schemaVersion: 2, sequences: {} },
        });
        await writeTextFile(filePath, emptyContent);
        await loadTree();

        // Start rename mode for the new file
        setTimeout(() => startRename(filePath), 100);

        return { success: true, newPath: filePath };
      } catch (error) {
        return { success: false, error: `Failed to create file: ${error}` };
      }
    },
    [loadTree, startRename]
  );

  // Create new folder
  const createFolder = useCallback(
    async (parentPath: string, name?: string): Promise<FileOperationResult> => {
      const baseName = name || 'New Folder';

      try {
        const entries = await readDir(parentPath);
        const existingNames = new Set(entries.map((e) => e.name || ''));
        const uniqueName = generateUniqueName(baseName, existingNames, false);
        const folderPath = `${parentPath}/${uniqueName}`;

        await mkdir(folderPath);
        await loadTree();

        // Expand parent and start rename
        setExpandedIds((prev) => new Set(prev).add(parentPath));
        setTimeout(() => startRename(folderPath), 100);

        return { success: true, newPath: folderPath };
      } catch (error) {
        return { success: false, error: `Failed to create folder: ${error}` };
      }
    },
    [loadTree, startRename]
  );

  // Delete items
  const deleteItems = useCallback(
    async (ids: string[]): Promise<FileOperationResult> => {
      try {
        for (const id of ids) {
          const item = getItemById(id);
          if (!item) continue;

          await remove(item.path, { recursive: true });
        }

        clearSelection();
        await loadTree();
        return { success: true };
      } catch (error) {
        return { success: false, error: `Failed to delete: ${error}` };
      }
    },
    [getItemById, clearSelection, loadTree]
  );

  // Duplicate item
  const duplicateItem = useCallback(
    async (id: string): Promise<FileOperationResult> => {
      const item = getItemById(id);
      if (!item) {
        return { success: false, error: 'Item not found' };
      }

      if (item.type === 'folder') {
        return { success: false, error: 'Folder duplication not yet supported' };
      }

      const parentPath = getParentPath(item.path);

      try {
        const entries = await readDir(parentPath);
        const existingNames = new Set(entries.map((e) => e.name || ''));
        const newName = generateUniqueName(item.name, existingNames, true);
        const newPath = `${parentPath}/${newName}`;

        await copyFile(item.path, newPath);
        await loadTree();

        return { success: true, newPath };
      } catch (error) {
        return { success: false, error: `Failed to duplicate: ${error}` };
      }
    },
    [getItemById, getParentPath, loadTree]
  );

  // Move item to new parent
  const moveItem = useCallback(
    async (id: string, newParentPath: string): Promise<FileOperationResult> => {
      const item = getItemById(id);
      if (!item) {
        return { success: false, error: 'Item not found' };
      }

      // Prevent moving folder into itself
      if (isMoveIntoSelf(item.path, newParentPath)) {
        return { success: false, error: 'Cannot move folder into itself' };
      }

      const newPath = `${newParentPath}/${item.name}`;

      try {
        // Check if target exists
        const targetExists = await exists(newPath);
        if (targetExists) {
          return { success: false, error: 'An item with this name already exists in the destination' };
        }

        await rename(item.path, newPath);
        await loadTree();

        return { success: true, newPath };
      } catch (error) {
        return { success: false, error: `Failed to move: ${error}` };
      }
    },
    [getItemById, loadTree]
  );

  // Copy path to clipboard
  const copyPath = useCallback((id: string) => {
    const item = getItemById(id);
    if (item) {
      copyTextToClipboard(item.path);
    }
  }, [getItemById]);

  return {
    items,
    expandedIds,
    selection,
    renameState,
    sortMode,
    isLoading,
    isSyncing,
    loadTree,
    toggleExpand,
    expandAll,
    collapseAll,
    setSortMode,
    selectItem,
    selectAll,
    clearSelection,
    startRename,
    updateRename,
    confirmRename,
    cancelRename,
    createFile,
    createFolder,
    deleteItems,
    duplicateItem,
    moveItem,
    copyPath,
    getItemById,
    getParentPath,
    flattenTree,
  };
}
