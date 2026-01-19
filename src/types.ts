import type { ReactNode } from 'react';

// File system item for hierarchical tree structure
export interface FileSystemItem {
  id: string;           // Unique identifier (path-based)
  name: string;         // Display name
  path: string;         // Full file path
  type: 'file' | 'folder';
  children?: FileSystemItem[];  // For folders
  isExpanded?: boolean;        // Folder expand state
  modifiedAt?: number;         // Timestamp for sorting
}

// Legacy flat file structure (for backwards compatibility)
export interface ProjectFile {
  name: string;
  path: string;
}

// Sort modes for file tree
export type SortMode =
  | 'name-asc'
  | 'name-desc'
  | 'date-asc'
  | 'date-desc'
  | 'custom';

// Context menu types
export type ContextMenuTarget =
  | { type: 'file'; item: FileSystemItem }
  | { type: 'folder'; item: FileSystemItem }
  | { type: 'empty' };

export interface ContextMenuPosition {
  x: number;
  y: number;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  shortcut?: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
  action?: () => void;
}

// File status indicators
export interface FileStatus {
  isOpen: boolean;
  isDirty: boolean;
  hasError: boolean;
}

// Drag and drop types
export interface DragItem {
  id: string;
  type: 'file' | 'folder';
  item: FileSystemItem;
}

export interface DropTarget {
  id: string;
  type: 'folder' | 'root' | 'between';
  position?: 'before' | 'after';
}

// Selection state
export interface SelectionState {
  selectedIds: Set<string>;
  lastSelectedId: string | null;
  anchorId: string | null;  // For shift-click range selection
}

// Search/Filter state
export interface SearchState {
  query: string;
  isActive: boolean;
  results: FileSystemItem[];
}

// File tree state
export interface FileTreeState {
  items: FileSystemItem[];
  expandedIds: Set<string>;
  sortMode: SortMode;
  customOrder?: Map<string, number>;  // For custom sorting
}

// Sidebar state
export interface SidebarState {
  isCollapsed: boolean;
  width: number;
  isResizing: boolean;
}

// App state (extended)
export interface AppState {
  projectPath: string | null;
  files: ProjectFile[];  // Kept for compatibility
  fileTree: FileSystemItem[];  // New hierarchical structure
  currentFile: ProjectFile | null;
  isDirty: boolean;
  expandedFolders: Set<string>;
  sortMode: SortMode;
}

// Rename state for inline editing
export interface RenameState {
  itemId: string | null;
  originalName: string;
  currentValue: string;
}

// Confirmation dialog types
export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  isDanger: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// File operations
export interface FileOperationResult {
  success: boolean;
  error?: string;
  newPath?: string;
}

// Sidebar toolbar action
export interface ToolbarAction {
  id: string;
  icon: ReactNode;
  label: string;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
}

// File watcher events
export type FileWatchEventType =
  | 'create'
  | 'modify'
  | 'remove'
  | 'rename';

export interface FileWatchEvent {
  type: FileWatchEventType;
  path: string;
  newPath?: string;  // For rename events
}

// Keyboard navigation state
export interface KeyboardNavState {
  focusedId: string | null;
  isNavigating: boolean;
}
