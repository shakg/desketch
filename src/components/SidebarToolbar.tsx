import { Icon } from './Icon';

interface SidebarToolbarProps {
  onNewDrawing: () => void;
  onNewFolder: () => void;
  onRefresh: () => void;
  isSyncing: boolean;
  disabled: boolean;
}

export function SidebarToolbar({
  onNewDrawing,
  onNewFolder,
  onRefresh,
  isSyncing,
  disabled,
}: SidebarToolbarProps) {
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

    </div>
  );
}
