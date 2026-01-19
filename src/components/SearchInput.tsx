import { useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { Icon } from './Icon';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onEscape: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  onEscape,
  placeholder = 'Search files...',
  disabled = false,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (value) {
          onClear();
        } else {
          onEscape();
        }
      }
    },
    [value, onClear, onEscape]
  );

  // Focus input on Ctrl+P or Ctrl+Shift+F
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || (e.shiftKey && e.key === 'F'))) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className="search-input-container">
      <span className="search-icon">
        <Icon name="search" size={14} />
      </span>
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Search files"
      />
      {value && (
        <button
          className="search-clear-btn"
          onClick={onClear}
          aria-label="Clear search"
          type="button"
        >
          <Icon name="close" size={12} />
        </button>
      )}
    </div>
  );
}
