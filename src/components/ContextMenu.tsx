import { useEffect, useRef, useCallback } from 'react';
import { ContextMenuItem, ContextMenuPosition } from '../types';
import { Icon } from './Icon';

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: ContextMenuPosition;
  onClose: () => void;
}

export function ContextMenu({ items, position, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (!menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = position.x;
    let y = position.y;

    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 8;
    }
    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 8;
    }

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }, [position]);

  const handleItemClick = useCallback(
    (item: ContextMenuItem) => {
      if (item.disabled || item.separator) return;
      item.action?.();
      onClose();
    },
    [onClose]
  );

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item, index) =>
        item.separator ? (
          <div key={`sep-${index}`} className="context-menu-separator" />
        ) : (
          <button
            key={item.id}
            className={`context-menu-item ${item.disabled ? 'disabled' : ''} ${
              item.danger ? 'danger' : ''
            }`}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
          >
            {item.icon && <span className="context-menu-icon">{item.icon}</span>}
            <span className="context-menu-label">{item.label}</span>
            {item.shortcut && (
              <span className="context-menu-shortcut">{item.shortcut}</span>
            )}
          </button>
        )
      )}
    </div>
  );
}

// Helper function to create menu items for files
export function createFileMenuItems(
  onOpen: () => void,
  onRename: () => void,
  onDuplicate: () => void,
  onDelete: () => void,
  onCopyPath: () => void
): ContextMenuItem[] {
  return [
    {
      id: 'open',
      label: 'Open',
      shortcut: 'Enter',
      icon: <Icon name="file" />,
      action: onOpen,
    },
    { id: 'sep1', label: '', separator: true },
    {
      id: 'rename',
      label: 'Rename',
      shortcut: 'F2',
      icon: <Icon name="edit" />,
      action: onRename,
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      shortcut: 'Ctrl+D',
      icon: <Icon name="copy" />,
      action: onDuplicate,
    },
    { id: 'sep2', label: '', separator: true },
    {
      id: 'copyPath',
      label: 'Copy Path',
      icon: <Icon name="link" />,
      action: onCopyPath,
    },
    { id: 'sep3', label: '', separator: true },
    {
      id: 'delete',
      label: 'Delete',
      shortcut: 'Delete',
      icon: <Icon name="trash" />,
      danger: true,
      action: onDelete,
    },
  ];
}

// Helper function to create menu items for folders
export function createFolderMenuItems(
  onNewDrawing: () => void,
  onNewFolder: () => void,
  onRename: () => void,
  onDelete: () => void,
  onCollapseAll: () => void
): ContextMenuItem[] {
  return [
    {
      id: 'newDrawing',
      label: 'New Drawing',
      icon: <Icon name="file" />,
      action: onNewDrawing,
    },
    {
      id: 'newFolder',
      label: 'New Folder',
      icon: <Icon name="folder-plus" />,
      action: onNewFolder,
    },
    { id: 'sep1', label: '', separator: true },
    {
      id: 'rename',
      label: 'Rename',
      shortcut: 'F2',
      icon: <Icon name="edit" />,
      action: onRename,
    },
    { id: 'sep2', label: '', separator: true },
    {
      id: 'collapseAll',
      label: 'Collapse All',
      icon: <Icon name="folder-open" />,
      action: onCollapseAll,
    },
    { id: 'sep3', label: '', separator: true },
    {
      id: 'delete',
      label: 'Delete',
      shortcut: 'Delete',
      icon: <Icon name="trash" />,
      danger: true,
      action: onDelete,
    },
  ];
}

// Helper function to create menu items for empty space
export function createEmptyMenuItems(
  onNewDrawing: () => void,
  onNewFolder: () => void,
  onRefresh: () => void
): ContextMenuItem[] {
  return [
    {
      id: 'newDrawing',
      label: 'New Drawing',
      icon: <Icon name="file" />,
      action: onNewDrawing,
    },
    {
      id: 'newFolder',
      label: 'New Folder',
      icon: <Icon name="folder-plus" />,
      action: onNewFolder,
    },
    { id: 'sep1', label: '', separator: true },
    {
      id: 'refresh',
      label: 'Refresh',
      icon: <Icon name="refresh" />,
      action: onRefresh,
    },
  ];
}
