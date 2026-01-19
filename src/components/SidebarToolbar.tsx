import { useState, useCallback, useRef, useEffect } from 'react';
import { SortMode } from '../types';
import { Icon } from './Icon';

interface SidebarToolbarProps {
  onNewDrawing: () => void;
  onNewFolder: () => void;
  onRefresh: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  sortMode: SortMode;
  onSortModeChange: (mode: SortMode) => void;
  isSyncing: boolean;
  disabled: boolean;
}

export function SidebarToolbar({
  onNewDrawing,
  onNewFolder,
  onRefresh,
  onCollapseAll,
  onExpandAll,
  sortMode,
  onSortModeChange,
  isSyncing,
  disabled,
}: SidebarToolbarProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMoreMenu]);

  const handleSortChange = useCallback(
    (mode: SortMode) => {
      onSortModeChange(mode);
      setShowMoreMenu(false);
    },
    [onSortModeChange]
  );

  return (
    <div className="sidebar-toolbar">
      <button
        className="toolbar-btn"
        onClick={onNewDrawing}
        disabled={disabled}
        title="New Drawing (Ctrl+N)"
      >
        <span className="toolbar-icon">
          <Icon name="plus" />
        </span>
        <span className="toolbar-label">New</span>
      </button>

      <button
        className="toolbar-btn"
        onClick={onNewFolder}
        disabled={disabled}
        title="New Folder (Ctrl+Shift+N)"
      >
        <span className="toolbar-icon">
          <Icon name="folder-plus" />
        </span>
        <span className="toolbar-label">Folder</span>
      </button>

      <button
        className="toolbar-btn"
        onClick={onRefresh}
        disabled={disabled || isSyncing}
        title="Refresh"
      >
        <span className={`toolbar-icon ${isSyncing ? 'spinning' : ''}`}>
          <Icon name="refresh" />
        </span>
        <span className="toolbar-label">Refresh</span>
      </button>

      <div className="toolbar-spacer" />

      <div className="toolbar-dropdown" ref={menuRef}>
        <button
          className="toolbar-btn"
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          disabled={disabled}
          title="More options"
        >
          <span className="toolbar-icon">
            <Icon name="more" />
          </span>
        </button>

        {showMoreMenu && (
          <div className="dropdown-menu">
            <div className="dropdown-section">
              <span className="dropdown-label">Sort by</span>
              <button
                className={`dropdown-item ${sortMode === 'name-asc' ? 'active' : ''}`}
                onClick={() => handleSortChange('name-asc')}
              >
                Name (A-Z)
              </button>
              <button
                className={`dropdown-item ${sortMode === 'name-desc' ? 'active' : ''}`}
                onClick={() => handleSortChange('name-desc')}
              >
                Name (Z-A)
              </button>
              <button
                className={`dropdown-item ${sortMode === 'date-desc' ? 'active' : ''}`}
                onClick={() => handleSortChange('date-desc')}
              >
                Date Modified (Newest)
              </button>
              <button
                className={`dropdown-item ${sortMode === 'date-asc' ? 'active' : ''}`}
                onClick={() => handleSortChange('date-asc')}
              >
                Date Modified (Oldest)
              </button>
            </div>

            <div className="dropdown-divider" />

            <div className="dropdown-section">
              <button className="dropdown-item" onClick={() => { onExpandAll(); setShowMoreMenu(false); }}>
                Expand All
              </button>
              <button className="dropdown-item" onClick={() => { onCollapseAll(); setShowMoreMenu(false); }}>
                Collapse All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
