import { useEffect } from 'react';
import { Icon } from './Icon';

interface SettingsModalProps {
  isOpen: boolean;
  advancedGit: boolean;
  onClose: () => void;
  onChangeAdvancedGit: (next: boolean) => void;
}

export function SettingsModal({
  isOpen,
  advancedGit,
  onClose,
  onChangeAdvancedGit,
}: SettingsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" role="dialog" aria-modal="true">
      <div className="settings-modal">
        <header className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" type="button" onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>

        <section className="settings-section">
          <div className="settings-row">
            <div className="settings-labels">
              <span className="settings-title">Git Mode</span>
              <span className="settings-help">
                Easy uses the bottom bar only. Advanced restores the Git sidebar panel.
              </span>
            </div>
            <div className="settings-toggle">
              <button
                type="button"
                className={`settings-option ${advancedGit ? '' : 'active'}`}
                onClick={() => onChangeAdvancedGit(false)}
              >
                Easy
              </button>
              <button
                type="button"
                className={`settings-option ${advancedGit ? 'active' : ''}`}
                onClick={() => onChangeAdvancedGit(true)}
              >
                Advanced
              </button>
            </div>
          </div>
        </section>
      </div>
      <button className="settings-backdrop" type="button" onClick={onClose} aria-label="Close settings" />
    </div>
  );
}
