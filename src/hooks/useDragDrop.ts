import { useState, useCallback } from 'react';
import { FileSystemItem } from '../types';

export interface DragState {
  isDragging: boolean;
  draggedId: string | null;
  draggedItem: FileSystemItem | null;
  dropTargetId: string | null;
  dropPosition: 'inside' | 'before' | 'after' | null;
}

interface UseDragDropOptions {
  onMove: (sourceId: string, targetPath: string) => Promise<{ success: boolean; error?: string }>;
  getItemById: (id: string) => FileSystemItem | null;
  getParentPath: (path: string) => string;
  selectedIds: Set<string>;
}

interface UseDragDropReturn {
  dragState: DragState;
  handleDragStart: (item: FileSystemItem) => void;
  handleDragEnd: () => void;
  handleDragOver: (targetId: string, position: 'inside' | 'before' | 'after') => void;
  handleDragLeave: () => void;
  handleDrop: () => Promise<void>;
  canDrop: (targetId: string) => boolean;
}

export function useDragDrop({
  onMove,
  getItemById,
  getParentPath,
  selectedIds,
}: UseDragDropOptions): UseDragDropReturn {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedId: null,
    draggedItem: null,
    dropTargetId: null,
    dropPosition: null,
  });

  // Check if we can drop on target
  const canDrop = useCallback(
    (targetId: string): boolean => {
      if (!dragState.draggedItem) return false;

      const target = getItemById(targetId);
      if (!target) return false;

      // Can't drop on itself
      if (targetId === dragState.draggedId) return false;

      // Can't drop into a selected item if dragging multiple
      if (selectedIds.has(targetId)) return false;

      // If dropping inside, target must be a folder
      if (dragState.dropPosition === 'inside' && target.type !== 'folder') {
        return false;
      }

      // Can't drop a folder into its own children
      if (
        dragState.draggedItem.type === 'folder' &&
        target.path.startsWith(dragState.draggedItem.path + '/')
      ) {
        return false;
      }

      return true;
    },
    [dragState.draggedItem, dragState.draggedId, dragState.dropPosition, getItemById, selectedIds]
  );

  const handleDragStart = useCallback((item: FileSystemItem) => {
    setDragState({
      isDragging: true,
      draggedId: item.id,
      draggedItem: item,
      dropTargetId: null,
      dropPosition: null,
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedId: null,
      draggedItem: null,
      dropTargetId: null,
      dropPosition: null,
    });
  }, []);

  const handleDragOver = useCallback(
    (targetId: string, position: 'inside' | 'before' | 'after') => {
      setDragState((prev) => ({
        ...prev,
        dropTargetId: targetId,
        dropPosition: position,
      }));
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      dropTargetId: null,
      dropPosition: null,
    }));
  }, []);

  const handleDrop = useCallback(async () => {
    if (!dragState.draggedItem || !dragState.dropTargetId || !dragState.dropPosition) {
      handleDragEnd();
      return;
    }

    if (!canDrop(dragState.dropTargetId)) {
      handleDragEnd();
      return;
    }

    const target = getItemById(dragState.dropTargetId);
    if (!target) {
      handleDragEnd();
      return;
    }

    let targetPath: string;
    if (dragState.dropPosition === 'inside') {
      // Dropping into folder
      targetPath = target.path;
    } else {
      // Dropping before/after - use parent folder
      targetPath = getParentPath(target.path);
    }

    // Move all selected items if multiple selected
    const itemsToMove = selectedIds.has(dragState.draggedId!)
      ? Array.from(selectedIds)
      : [dragState.draggedId!];

    for (const id of itemsToMove) {
      const item = getItemById(id);
      if (!item) continue;

      // Skip if trying to move into same folder
      const itemParent = getParentPath(item.path);
      if (itemParent === targetPath) continue;

      await onMove(id, targetPath);
    }

    handleDragEnd();
  }, [
    dragState,
    canDrop,
    getItemById,
    getParentPath,
    selectedIds,
    onMove,
    handleDragEnd,
  ]);

  return {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    canDrop,
  };
}
