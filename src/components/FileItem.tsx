import { useRef, useEffect, useCallback, KeyboardEvent, MouseEvent } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { FileSystemItem } from '../types';
import { Icon } from './Icon';

interface FileItemProps {
  item: FileSystemItem;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  isFocused: boolean;
  isCurrentFile: boolean;
  isDirty: boolean;
  hasError: boolean;
  isRenaming: boolean;
  renameValue: string;
  isDragOver: boolean;
  dropPosition: 'inside' | 'before' | 'after' | null;
  searchHighlight?: string;
  onToggleExpand: () => void;
  onClick: (e: MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (e: MouseEvent) => void;
  onRenameChange: (value: string) => void;
  onRenameConfirm: () => void;
  onRenameCancel: () => void;
  onDragOver: (position: 'inside' | 'before' | 'after') => void;
  onDragLeave: () => void;
  onDrop: () => void;
}

export function FileItem({
  item,
  depth,
  isExpanded,
  isSelected,
  isFocused,
  isCurrentFile,
  isDirty,
  hasError,
  isRenaming,
  renameValue,
  isDragOver,
  dropPosition,
  searchHighlight,
  onToggleExpand,
  onClick,
  onDoubleClick,
  onContextMenu,
  onRenameChange,
  onRenameConfirm,
  onRenameCancel,
  onDragOver,
  onDragLeave,
  onDrop,
}: FileItemProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  // Set up dnd-kit draggable
  const {
    attributes: dragAttributes,
    listeners: dragListeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: item.id,
    data: { item },
  });

  // Set up dnd-kit droppable (only for folders)
  const { setNodeRef: setDropRef } = useDroppable({
    id: item.id,
    data: { item },
    disabled: item.type === 'file',
  });

  // Combine refs
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      setDragRef(node);
      setDropRef(node);
      (itemRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [setDragRef, setDropRef]
  );

  // Focus input when entering rename mode
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  // Scroll into view when focused
  useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isFocused]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isRenaming) {
        if (e.key === 'Enter') {
          e.preventDefault();
          onRenameConfirm();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onRenameCancel();
        }
      }
    },
    [isRenaming, onRenameConfirm, onRenameCancel]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const rect = itemRef.current?.getBoundingClientRect();
      if (!rect) return;

      const y = e.clientY - rect.top;
      const height = rect.height;

      let position: 'inside' | 'before' | 'after';
      if (item.type === 'folder') {
        // For folders: top 25% = before, middle 50% = inside, bottom 25% = after
        if (y < height * 0.25) {
          position = 'before';
        } else if (y > height * 0.75) {
          position = 'after';
        } else {
          position = 'inside';
        }
      } else {
        // For files: top 50% = before, bottom 50% = after
        position = y < height * 0.5 ? 'before' : 'after';
      }

      onDragOver(position);
    },
    [item.type, onDragOver]
  );

  const handleDragLeave = useCallback(() => {
    onDragLeave();
  }, [onDragLeave]);

  const handleDropEvent = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      onDrop();
    },
    [onDrop]
  );

  // Highlight matching text in search
  const renderName = () => {
    const displayName = item.type === 'file' ? item.name.replace(/\.tldr$/, '') : item.name;

    if (searchHighlight && displayName.toLowerCase().includes(searchHighlight.toLowerCase())) {
      const index = displayName.toLowerCase().indexOf(searchHighlight.toLowerCase());
      const before = displayName.slice(0, index);
      const match = displayName.slice(index, index + searchHighlight.length);
      const after = displayName.slice(index + searchHighlight.length);

      return (
        <>
          {before}
          <mark className="search-highlight">{match}</mark>
          {after}
        </>
      );
    }

    return displayName;
  };

  const itemClasses = [
    'file-item',
    item.type === 'folder' ? 'folder' : 'file',
    isSelected && 'selected',
    isFocused && 'focused',
    isCurrentFile && 'current',
    isDirty && 'dirty',
    hasError && 'error',
    isDragging && 'dragging',
    isDragOver && 'drag-over',
    dropPosition === 'before' && 'drop-before',
    dropPosition === 'inside' && 'drop-inside',
    dropPosition === 'after' && 'drop-after',
  ]
    .filter(Boolean)
    .join(' ');

  // Extract aria attributes from dragAttributes, excluding tabIndex and role
  const { tabIndex: _tabIndex, role: _role, ...restDragAttributes } = dragAttributes;

  return (
    <div
      ref={setRefs}
      className={itemClasses}
      style={{ paddingLeft: `${12 + depth * 16}px` }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropEvent}
      tabIndex={0}
      role="treeitem"
      aria-selected={isSelected}
      aria-expanded={item.type === 'folder' ? isExpanded : undefined}
      {...restDragAttributes}
      {...dragListeners}
    >
      {/* Expand/Collapse toggle for folders */}
      {item.type === 'folder' ? (
        <button
          className="expand-toggle"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
        >
          {isExpanded ? '▾' : '▸'}
        </button>
      ) : (
        <span className="expand-spacer" />
      )}

      {/* Icon */}
      <span className="file-icon">
        {item.type === 'folder' ? (
          <Icon name={isExpanded ? 'folder-open' : 'folder'} />
        ) : (
          <Icon name="file" />
        )}
      </span>

      {/* Name or rename input */}
      {isRenaming ? (
        <input
          ref={inputRef}
          type="text"
          className="rename-input"
          value={renameValue}
          onChange={(e) => onRenameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={onRenameConfirm}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="file-name">{renderName()}</span>
      )}

      {/* Status indicators */}
      {isDirty && <span className="status-dot dirty-indicator" title="Unsaved changes" />}
      {hasError && <span className="status-dot error-indicator" title="Error" />}
    </div>
  );
}
