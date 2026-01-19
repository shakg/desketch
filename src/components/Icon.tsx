import type { ReactNode } from 'react';

type IconName =
  | 'plus'
  | 'folder'
  | 'folder-plus'
  | 'folder-open'
  | 'refresh'
  | 'more'
  | 'search'
  | 'close'
  | 'file'
  | 'edit'
  | 'copy'
  | 'link'
  | 'trash'
  | 'settings';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

const commonProps = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
  'aria-hidden': true,
  focusable: false,
});

export function Icon({ name, size = 16, className }: IconProps): ReactNode {
  switch (name) {
    case 'plus':
      return (
        <svg {...commonProps(size, className)}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'folder':
      return (
        <svg {...commonProps(size, className)}>
          <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
        </svg>
      );
    case 'folder-plus':
      return (
        <svg {...commonProps(size, className)}>
          <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
          <path d="M16 13v6M13 16h6" />
        </svg>
      );
    case 'folder-open':
      return (
        <svg {...commonProps(size, className)}>
          <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v1H5a2 2 0 0 0-2 2l-1 7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2l1-7a2 2 0 0 0-2-2H5" />
        </svg>
      );
    case 'refresh':
      return (
        <svg {...commonProps(size, className)}>
          <path d="M3 12a9 9 0 0 1 15-6l2-2v6h-6l2-2" />
          <path d="M21 12a9 9 0 0 1-15 6l-2 2v-6h6l-2 2" />
        </svg>
      );
    case 'more':
      return (
        <svg {...commonProps(size, className)}>
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      );
    case 'search':
      return (
        <svg {...commonProps(size, className)}>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      );
    case 'close':
      return (
        <svg {...commonProps(size, className)}>
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      );
    case 'file':
      return (
        <svg {...commonProps(size, className)}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
        </svg>
      );
    case 'edit':
      return (
        <svg {...commonProps(size, className)}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
      );
    case 'copy':
      return (
        <svg {...commonProps(size, className)}>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <rect x="2" y="2" width="13" height="13" rx="2" />
        </svg>
      );
    case 'link':
      return (
        <svg {...commonProps(size, className)}>
          <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" />
          <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...commonProps(size, className)}>
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...commonProps(size, className)}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-1.42 3.42h-.09a1.65 1.65 0 0 0-1.51 1.05l-.03.09a2 2 0 0 1-3.76 0l-.03-.09a1.65 1.65 0 0 0-1.51-1.05h-.09a2 2 0 0 1-1.42-3.42l.06-.06a1.65 1.65 0 0 0 .33-1.82l-.03-.09a2 2 0 0 1 0-1.6l.03-.09a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 1.42-3.42h.09a1.65 1.65 0 0 0 1.51-1.05l.03-.09a2 2 0 0 1 3.76 0l.03.09a1.65 1.65 0 0 0 1.51 1.05h.09a2 2 0 0 1 1.42 3.42l-.06.06a1.65 1.65 0 0 0-.33 1.82l.03.09a2 2 0 0 1 0 1.6z" />
        </svg>
      );
    default:
      return null;
  }
}
