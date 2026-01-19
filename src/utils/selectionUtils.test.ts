import { describe, it, expect } from 'vitest';
import { computeSelection } from './selectionUtils';
import type { FileSystemItem, SelectionState } from '../types';

const flatItems: FileSystemItem[] = [
  { id: 'a', name: 'A.tldr', path: '/A.tldr', type: 'file' },
  { id: 'b', name: 'B.tldr', path: '/B.tldr', type: 'file' },
  { id: 'c', name: 'C.tldr', path: '/C.tldr', type: 'file' },
  { id: 'd', name: 'D.tldr', path: '/D.tldr', type: 'file' },
];

function emptySelection(): SelectionState {
  return { selectedIds: new Set(), lastSelectedId: null, anchorId: null };
}

describe('computeSelection', () => {
  it('selects a single item by default', () => {
    const result = computeSelection({
      prev: emptySelection(),
      flatItems,
      targetId: 'b',
    });

    expect(Array.from(result.selectedIds)).toEqual(['b']);
    expect(result.anchorId).toBe('b');
    expect(result.lastSelectedId).toBe('b');
  });

  it('toggles selection with ctrl key', () => {
    const withA = computeSelection({
      prev: emptySelection(),
      flatItems,
      targetId: 'a',
      ctrlKey: true,
    });

    const toggled = computeSelection({
      prev: withA,
      flatItems,
      targetId: 'a',
      ctrlKey: true,
    });

    expect(Array.from(toggled.selectedIds)).toEqual([]);
  });

  it('adds another item with ctrl key', () => {
    const first = computeSelection({
      prev: emptySelection(),
      flatItems,
      targetId: 'a',
      ctrlKey: true,
    });

    const second = computeSelection({
      prev: first,
      flatItems,
      targetId: 'c',
      ctrlKey: true,
    });

    expect(new Set(['a', 'c'])).toEqual(second.selectedIds);
    expect(second.anchorId).toBe('c');
  });

  it('selects a range with shift key', () => {
    const anchored: SelectionState = {
      selectedIds: new Set(['b']),
      lastSelectedId: 'b',
      anchorId: 'b',
    };

    const result = computeSelection({
      prev: anchored,
      flatItems,
      targetId: 'd',
      shiftKey: true,
    });

    expect(Array.from(result.selectedIds)).toEqual(['b', 'c', 'd']);
    expect(result.anchorId).toBe('b');
  });

  it('falls back to single selection when shift has no anchor', () => {
    const result = computeSelection({
      prev: emptySelection(),
      flatItems,
      targetId: 'c',
      shiftKey: true,
    });

    expect(Array.from(result.selectedIds)).toEqual(['c']);
    expect(result.anchorId).toBe('c');
  });
});
