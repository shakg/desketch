import { FileSystemItem, SortMode } from '../types';

// Sort items: folders first, then apply sort mode
export function sortItems(items: FileSystemItem[], mode: SortMode): FileSystemItem[] {
  const sorted = [...items].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }

    switch (mode) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'date-asc':
        return (a.modifiedAt || 0) - (b.modifiedAt || 0);
      case 'date-desc':
        return (b.modifiedAt || 0) - (a.modifiedAt || 0);
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return sorted.map((item) => ({
    ...item,
    children: item.children ? sortItems(item.children, mode) : undefined,
  }));
}

// Generate unique name for duplicates
export function generateUniqueName(
  baseName: string,
  existingNames: Set<string>,
  isFile: boolean
): string {
  if (!existingNames.has(baseName)) return baseName;

  let ext = '';
  let nameWithoutExt = baseName;

  if (isFile) {
    const lastDot = baseName.lastIndexOf('.');
    if (lastDot > 0) {
      ext = baseName.slice(lastDot);
      nameWithoutExt = baseName.slice(0, lastDot);
    }
  }

  let copyName = `${nameWithoutExt}-copy${ext}`;
  if (!existingNames.has(copyName)) return copyName;

  let counter = 2;
  while (existingNames.has(`${nameWithoutExt}-copy-${counter}${ext}`)) {
    counter++;
  }
  return `${nameWithoutExt}-copy-${counter}${ext}`;
}

export async function getParentPath(path: string): Promise<string> {
  if (typeof window === 'undefined') {
    const { dirname } = await import('path');
    return dirname(path);
  }
  const { dirname } = await import('@tauri-apps/api/path');
  return dirname(path);
}

export function collectFolderIds(items: FileSystemItem[]): string[] {
  const ids: string[] = [];
  for (const item of items) {
    if (item.type === 'folder') {
      ids.push(item.id);
      if (item.children) {
        ids.push(...collectFolderIds(item.children));
      }
    }
  }
  return ids;
}

export function validateRenameName(
  rawValue: string,
  itemType: 'file' | 'folder'
): { ok: true; name: string } | { ok: false; error: string } {
  let name = rawValue.trim();
  if (!name) {
    return { ok: false, error: 'Name cannot be empty' };
  }

  if (/[<>:"/\\|?*]/.test(name)) {
    return { ok: false, error: 'Name contains invalid characters' };
  }

  if (itemType === 'file' && !name.endsWith('.tldr')) {
    name = `${name}.tldr`;
  }

  return { ok: true, name };
}

export async function isMoveIntoSelf(itemPath: string, newParentPath: string): Promise<boolean> {
  if (typeof window === 'undefined') {
    const { normalize, sep } = await import('path');
    const normalizedItemPath = normalize(itemPath);
    const normalizedNewParentPath = normalize(newParentPath);
    const prefix = normalizedItemPath.endsWith(sep)
      ? normalizedItemPath
      : `${normalizedItemPath}${sep}`;
    return normalizedNewParentPath.startsWith(prefix);
  }

  const { normalize, sep } = await import('@tauri-apps/api/path');
  const [normalizedItemPath, normalizedNewParentPath, separator] = await Promise.all([
    normalize(itemPath),
    normalize(newParentPath),
    sep(),
  ]);
  const prefix = normalizedItemPath.endsWith(separator)
    ? normalizedItemPath
    : `${normalizedItemPath}${separator}`;
  return normalizedNewParentPath.startsWith(prefix);
}
