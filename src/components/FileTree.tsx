import { useState, useCallback, MouseEvent, KeyboardEvent, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { FileItem } from './FileItem';
import { ContextMenu, createFileMenuItems, createFolderMenuItems, createEmptyMenuItems } from './ContextMenu';
import { Icon } from './Icon';
import { FileSystemItem, ContextMenuPosition, ContextMenuItem, RenameState, SelectionState } from '../types';

interface FileTreeProps {
  items: FileSystemItem[];
  expandedIds: Set<string>;
  selection: SelectionState;
  renameState: RenameState;
  currentFilePath: string | null;
  dirtyFilePath: string | null;
  errorFilePaths: Set<string>;
  searchQuery: string;
  focusedId: string | null;
  onToggleExpand: (id: string) => void;
  onSelect: (id: string, event?: { ctrlKey?: boolean; shiftKey?: boolean }) => void;
  onOpenFile: (path: string) => void;
  onStartRename: (id: string) => void;
  onUpdateRename: (value: string) => void;
  onConfirmRename: () => void;
  onCancelRename: () => void;
  onCreateFile: (parentPath: string) => void;
  onCreateFolder: (parentPath: string) => void;
  onDelete: (ids: string[]) => void;
  onDuplicate: (id: string) => void;
  onMove: (id: string, targetPath: string) => void;
  onCopyPath: (id: string) => void;
  onCollapseAll: () => void;
  onRefresh: () => void;
  onFocusChange: (id: string | null) => void;
  projectPath: string;
}

interface ContextMenuState {
  isOpen: boolean;
  position: ContextMenuPosition;
  items: ContextMenuItem[];
  targetId: string | null;
}

export function FileTree({
  items,
  expandedIds,
  selection,
  renameState,
  currentFilePath,
  dirtyFilePath,
  errorFilePaths,
  searchQuery,
  focusedId,
  onToggleExpand,
  onSelect,
  onOpenFile,
  onStartRename,
  onUpdateRename,
  onConfirmRename,
  onCancelRename,
  onCreateFile,
  onCreateFolder,
  onDelete,
  onDuplicate,
  onMove,
  onCopyPath,
  onCollapseAll,
  onRefresh,
  onFocusChange,
  projectPath,
}: FileTreeProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    items: [],
    targetId: null,
  });

  const [dragState, setDragState] = useState<{
    activeId: string | null;
    activeItem: FileSystemItem | null;
    overId: string | null;
    overPosition: 'inside' | 'before' | 'after' | null;
  }>({
    activeId: null,
    activeItem: null,
    overId: null,
    overPosition: null,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Configure drag sensor with activation distance
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Flatten visible tree for keyboard navigation
  const flattenVisibleTree = useCallback((): FileSystemItem[] => {
    const flat: FileSystemItem[] = [];
    const traverse = (items: FileSystemItem[]) => {
      for (const item of items) {
        // Filter by search query
        if (searchQuery) {
          const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
          const hasMatchingChildren = item.children?.some(child =>
            child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            child.children?.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
          );
          if (!matchesSearch && !hasMatchingChildren) continue;
        }

        flat.push(item);
        if (item.type === 'folder' && expandedIds.has(item.id) && item.children) {
          traverse(item.children);
        }
      }
    };
    traverse(items);
    return flat;
  }, [items, expandedIds, searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const flat = flattenVisibleTree();
      const currentIndex = flat.findIndex((i) => i.id === focusedId);
      const currentItem = currentIndex >= 0 ? flat[currentIndex] : null;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < flat.length - 1) {
            onFocusChange(flat[currentIndex + 1].id);
          } else if (flat.length > 0) {
            onFocusChange(flat[0].id);
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            onFocusChange(flat[currentIndex - 1].id);
          } else if (flat.length > 0) {
            onFocusChange(flat[flat.length - 1].id);
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (currentItem?.type === 'folder') {
            if (!expandedIds.has(currentItem.id)) {
              onToggleExpand(currentItem.id);
            } else if (currentItem.children?.length) {
              onFocusChange(currentItem.children[0].id);
            }
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (currentItem?.type === 'folder' && expandedIds.has(currentItem.id)) {
            onToggleExpand(currentItem.id);
          } else if (currentItem) {
            // Go to parent
            const parentPath = currentItem.path.split('/').slice(0, -1).join('/');
            const parent = flat.find((i) => i.path === parentPath);
            if (parent) {
              onFocusChange(parent.id);
            }
          }
          break;

        case 'Enter':
          e.preventDefault();
          if (currentItem) {
            if (currentItem.type === 'file') {
              onOpenFile(currentItem.path);
            } else {
              onToggleExpand(currentItem.id);
            }
          }
          break;

        case 'F2':
          e.preventDefault();
          if (currentItem) {
            onStartRename(currentItem.id);
          }
          break;

        case 'Delete':
        case 'Backspace':
          if (e.key === 'Backspace' && !e.metaKey) break;
          e.preventDefault();
          if (selection.selectedIds.size > 0) {
            onDelete(Array.from(selection.selectedIds));
          } else if (currentItem) {
            onDelete([currentItem.id]);
          }
          break;

        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // Select all - handled by parent
          }
          break;
      }
    },
    [
      focusedId,
      flattenVisibleTree,
      expandedIds,
      selection.selectedIds,
      onFocusChange,
      onToggleExpand,
      onOpenFile,
      onStartRename,
      onDelete,
    ]
  );

  // Handle click on item
  const handleItemClick = useCallback(
    (item: FileSystemItem, e: MouseEvent) => {
      onSelect(item.id, { ctrlKey: e.ctrlKey || e.metaKey, shiftKey: e.shiftKey });
      onFocusChange(item.id);
    },
    [onSelect, onFocusChange]
  );

  // Handle double click on item
  const handleItemDoubleClick = useCallback(
    (item: FileSystemItem) => {
      if (item.type === 'file') {
        onOpenFile(item.path);
      } else {
        onToggleExpand(item.id);
      }
    },
    [onOpenFile, onToggleExpand]
  );

  // Handle context menu on item
  const handleItemContextMenu = useCallback(
    (item: FileSystemItem, e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Select the item if not already selected
      if (!selection.selectedIds.has(item.id)) {
        onSelect(item.id);
      }

      const menuItems =
        item.type === 'file'
          ? createFileMenuItems(
              () => onOpenFile(item.path),
              () => onStartRename(item.id),
              () => onDuplicate(item.id),
              () => onDelete([item.id]),
              () => onCopyPath(item.id)
            )
          : createFolderMenuItems(
              () => onCreateFile(item.path),
              () => onCreateFolder(item.path),
              () => onStartRename(item.id),
              () => onDelete([item.id]),
              onCollapseAll
            );

      setContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        items: menuItems,
        targetId: item.id,
      });
    },
    [
      selection.selectedIds,
      onSelect,
      onOpenFile,
      onStartRename,
      onDuplicate,
      onDelete,
      onCopyPath,
      onCreateFile,
      onCreateFolder,
      onCollapseAll,
    ]
  );

  // Handle context menu on empty space
  const handleEmptyContextMenu = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();

      const menuItems = createEmptyMenuItems(
        () => onCreateFile(projectPath),
        () => onCreateFolder(projectPath),
        onRefresh
      );

      setContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        items: menuItems,
        targetId: null,
      });
    },
    [projectPath, onCreateFile, onCreateFolder, onRefresh]
  );

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Drag and drop handlers
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const item = event.active.data.current?.item as FileSystemItem | undefined;
      setDragState({
        activeId: event.active.id as string,
        activeItem: item || null,
        overId: null,
        overPosition: null,
      });
    },
    []
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id as string | undefined;
    setDragState((prev) => ({
      ...prev,
      overId: overId || null,
      overPosition: overId ? 'inside' : null,
    }));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const overItem = over.data.current?.item as FileSystemItem | undefined;
        if (overItem?.type === 'folder') {
          onMove(active.id as string, overItem.path);
        }
      }

      setDragState({
        activeId: null,
        activeItem: null,
        overId: null,
        overPosition: null,
      });
    },
    [onMove]
  );

  // Render tree recursively
  const renderItems = useCallback(
    (items: FileSystemItem[], depth = 0): React.ReactNode => {
      return items.map((item) => {
        // Filter by search query
        if (searchQuery) {
          const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
          const hasMatchingChildren = item.children?.some(child =>
            child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            child.children?.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
          );
          if (!matchesSearch && !hasMatchingChildren) return null;
        }

        const isExpanded = expandedIds.has(item.id);
        const isSelected = selection.selectedIds.has(item.id);
        const isFocused = focusedId === item.id;
        const isCurrentFile = item.path === currentFilePath;
        const isDirty = item.path === dirtyFilePath;
        const hasError = errorFilePaths.has(item.path);
        const isRenaming = renameState.itemId === item.id;
        const isDragOver = dragState.overId === item.id;
        const dropPosition = isDragOver ? dragState.overPosition : null;

        return (
          <div key={item.id} role="group">
            <FileItem
              item={item}
              depth={depth}
              isExpanded={isExpanded}
              isSelected={isSelected}
              isFocused={isFocused}
              isCurrentFile={isCurrentFile}
              isDirty={isDirty}
              hasError={hasError}
              isRenaming={isRenaming}
              renameValue={isRenaming ? renameState.currentValue : ''}
              isDragOver={isDragOver}
              dropPosition={dropPosition}
              searchHighlight={searchQuery}
              onToggleExpand={() => onToggleExpand(item.id)}
              onClick={(e) => handleItemClick(item, e)}
              onDoubleClick={() => handleItemDoubleClick(item)}
              onContextMenu={(e) => handleItemContextMenu(item, e)}
              onRenameChange={onUpdateRename}
              onRenameConfirm={onConfirmRename}
              onRenameCancel={onCancelRename}
              onDragOver={(pos) => setDragState(prev => ({ ...prev, overPosition: pos }))}
              onDragLeave={() => setDragState(prev => ({ ...prev, overId: null, overPosition: null }))}
              onDrop={() => {}}
            />
            {item.type === 'folder' && isExpanded && item.children && (
              <div className="file-tree-children">{renderItems(item.children, depth + 1)}</div>
            )}
          </div>
        );
      });
    },
    [
      expandedIds,
      selection.selectedIds,
      focusedId,
      currentFilePath,
      dirtyFilePath,
      errorFilePaths,
      renameState,
      dragState,
      searchQuery,
      onToggleExpand,
      handleItemClick,
      handleItemDoubleClick,
      handleItemContextMenu,
      onUpdateRename,
      onConfirmRename,
      onCancelRename,
    ]
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        ref={containerRef}
        className="file-tree"
        role="tree"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onContextMenu={handleEmptyContextMenu}
      >
        {items.length === 0 ? (
          <div className="file-tree-empty">
            <p>No files yet</p>
          </div>
        ) : (
          renderItems(items)
        )}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {dragState.activeItem && (
          <div className="file-item dragging-overlay">
            <span className="file-icon">
              {dragState.activeItem.type === 'folder' ? (
                <Icon name="folder" />
              ) : (
                <Icon name="file" />
              )}
            </span>
            <span className="file-name">
              {dragState.activeItem.type === 'file'
                ? dragState.activeItem.name.replace(/\.tldr$/, '')
                : dragState.activeItem.name}
            </span>
          </div>
        )}
      </DragOverlay>

      {/* Context menu */}
      {contextMenu.isOpen && (
        <ContextMenu
          items={contextMenu.items}
          position={contextMenu.position}
          onClose={closeContextMenu}
        />
      )}
    </DndContext>
  );
}
