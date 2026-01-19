import { useState, useCallback, useEffect } from 'react';
import { ask } from '@tauri-apps/plugin-dialog';
import { SidebarToolbar } from './SidebarToolbar';
import { SearchInput } from './SearchInput';
import { FileTree } from './FileTree';
import { GitSync } from './GitSync';
import { useFileTree } from '../hooks/useFileTree';

interface SidebarProps {
  projectPath: string | null;
  projectName: string | null;
  currentFilePath: string | null;
  isDirty: boolean;
  isCollapsed: boolean;
  onOpenFolder: () => void;
  onOpenFile: (path: string) => void;
  onNewDrawing: () => void;
}

export function Sidebar({
  projectPath,
  projectName,
  currentFilePath,
  isDirty,
  isCollapsed,
  onOpenFolder,
  onOpenFile,
  onNewDrawing,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [errorFilePaths] = useState<Set<string>>(new Set());

  // Error handler
  const handleError = useCallback((error: string) => {
    console.error('File tree error:', error);
    // Could show a toast notification here
  }, []);

  // File tree hook
  const fileTree = useFileTree({
    projectPath,
    onFileSelect: onOpenFile,
    onError: handleError,
  });

  // Load tree when project changes
  useEffect(() => {
    if (projectPath) {
      fileTree.loadTree();
    }
  }, [projectPath]);

  // Handle new file creation
  const handleCreateFile = useCallback(
    async (parentPath: string) => {
      const result = await fileTree.createFile(parentPath);
      if (!result.success) {
        handleError(result.error || 'Failed to create file');
      }
    },
    [fileTree, handleError]
  );

  // Handle new folder creation
  const handleCreateFolder = useCallback(
    async (parentPath: string) => {
      const result = await fileTree.createFolder(parentPath);
      if (!result.success) {
        handleError(result.error || 'Failed to create folder');
      }
    },
    [fileTree, handleError]
  );

  // Handle delete with confirmation
  const handleDelete = useCallback(
    async (ids: string[]) => {
      const items = ids.map((id) => fileTree.getItemById(id)).filter(Boolean);
      if (items.length === 0) return;

      const hasFolder = items.some((item) => item?.type === 'folder');
      const hasCurrentFile = items.some((item) => item?.path === currentFilePath);

      let message = items.length === 1
        ? `Delete "${items[0]?.name}"?`
        : `Delete ${items.length} items?`;

      if (hasFolder) {
        message += '\n\nThis will also delete all contents.';
      }
      if (hasCurrentFile && isDirty) {
        message += '\n\nWarning: Current file has unsaved changes.';
      }

      const confirmed = await ask(message, {
        title: 'Confirm Delete',
        kind: 'warning',
      });

      if (confirmed) {
        const result = await fileTree.deleteItems(ids);
        if (!result.success) {
          handleError(result.error || 'Failed to delete');
        }
      }
    },
    [fileTree, currentFilePath, isDirty, handleError]
  );

  // Handle duplicate
  const handleDuplicate = useCallback(
    async (id: string) => {
      const result = await fileTree.duplicateItem(id);
      if (!result.success) {
        handleError(result.error || 'Failed to duplicate');
      }
    },
    [fileTree, handleError]
  );

  // Handle move (drag and drop)
  const handleMove = useCallback(
    async (id: string, targetPath: string) => {
      const result = await fileTree.moveItem(id, targetPath);
      if (!result.success) {
        handleError(result.error || 'Failed to move');
      }
    },
    [fileTree, handleError]
  );

  // Handle rename confirmation
  const handleConfirmRename = useCallback(async () => {
    const result = await fileTree.confirmRename();
    if (!result.success && result.error) {
      handleError(result.error);
    }
  }, [fileTree, handleError]);

  // Handle search clear
  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Handle Ctrl+N for new drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!projectPath) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        if (e.shiftKey) {
          // Ctrl+Shift+N for new folder
          e.preventDefault();
          handleCreateFolder(projectPath);
        }
        // Regular Ctrl+N is handled by parent
      }

      // Ctrl+D for duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        const selectedId = fileTree.selection.lastSelectedId;
        if (selectedId) {
          const item = fileTree.getItemById(selectedId);
          if (item?.type === 'file') {
            handleDuplicate(selectedId);
          }
        }
      }

      // Ctrl+A for select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        // Only handle if sidebar is focused
        const sidebar = document.querySelector('.sidebar');
        if (sidebar?.contains(document.activeElement)) {
          e.preventDefault();
          fileTree.selectAll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [projectPath, fileTree, handleCreateFolder, handleDuplicate]);

  // No project open
  if (!projectPath) {
    return (
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="empty-state">
          <p>No project open</p>
          <button onClick={onOpenFolder}>Open Folder</button>
        </div>
      </aside>
    );
  }

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <span className="project-name">{projectName}</span>
        {fileTree.isSyncing && <span className="sync-indicator">Syncing...</span>}
      </div>

      <SidebarToolbar
        onNewDrawing={() => handleCreateFile(projectPath)}
        onNewFolder={() => handleCreateFolder(projectPath)}
        onRefresh={fileTree.loadTree}
        onCollapseAll={fileTree.collapseAll}
        onExpandAll={fileTree.expandAll}
        sortMode={fileTree.sortMode}
        onSortModeChange={fileTree.setSortMode}
        isSyncing={fileTree.isSyncing}
        disabled={!projectPath}
      />

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={handleSearchClear}
        onEscape={handleSearchClear}
        disabled={!projectPath}
      />

      <div className="file-list">
        {fileTree.isLoading ? (
          <div className="loading-state">
            <p>Loading...</p>
          </div>
        ) : fileTree.items.length === 0 ? (
          <div className="empty-state">
            <p>No .tldr files</p>
            <button onClick={onNewDrawing}>Create New</button>
          </div>
        ) : (
          <FileTree
            items={fileTree.items}
            expandedIds={fileTree.expandedIds}
            selection={fileTree.selection}
            renameState={fileTree.renameState}
            currentFilePath={currentFilePath}
            dirtyFilePath={isDirty ? currentFilePath : null}
            errorFilePaths={errorFilePaths}
            searchQuery={searchQuery}
            focusedId={focusedId}
            onToggleExpand={fileTree.toggleExpand}
            onSelect={fileTree.selectItem}
            onOpenFile={onOpenFile}
            onStartRename={fileTree.startRename}
            onUpdateRename={fileTree.updateRename}
            onConfirmRename={handleConfirmRename}
            onCancelRename={fileTree.cancelRename}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onMove={handleMove}
            onCopyPath={fileTree.copyPath}
            onCollapseAll={fileTree.collapseAll}
            onRefresh={fileTree.loadTree}
            onFocusChange={setFocusedId}
            projectPath={projectPath}
          />
        )}
      </div>

      <GitSync projectPath={projectPath} />
    </aside>
  );
}
