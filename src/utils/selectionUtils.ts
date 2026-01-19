import { FileSystemItem, SelectionState } from '../types';

interface SelectionInput {
  prev: SelectionState;
  flatItems: FileSystemItem[];
  targetId: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
}

export function computeSelection({
  prev,
  flatItems,
  targetId,
  ctrlKey,
  shiftKey,
}: SelectionInput): SelectionState {
  const next: SelectionState = {
    selectedIds: new Set(prev.selectedIds),
    lastSelectedId: targetId,
    anchorId: prev.anchorId,
  };

  if (shiftKey && prev.anchorId) {
    const anchorIdx = flatItems.findIndex((item) => item.id === prev.anchorId);
    const currentIdx = flatItems.findIndex((item) => item.id === targetId);

    if (anchorIdx !== -1 && currentIdx !== -1) {
      const [start, end] = [Math.min(anchorIdx, currentIdx), Math.max(anchorIdx, currentIdx)];
      next.selectedIds = new Set(flatItems.slice(start, end + 1).map((item) => item.id));
    }

    return next;
  }

  if (ctrlKey) {
    if (next.selectedIds.has(targetId)) {
      next.selectedIds.delete(targetId);
    } else {
      next.selectedIds.add(targetId);
    }
    next.anchorId = targetId;
    return next;
  }

  next.selectedIds = new Set([targetId]);
  next.anchorId = targetId;
  return next;
}
