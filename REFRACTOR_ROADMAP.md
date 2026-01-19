# Desketch Refactor Roadmap

## Scope
- Codebase: Desketch (Tauri + React)
- Goal: improve maintainability and readability without changing behavior.

## Code Smells and Refactor Targets
- Large, multi-responsibility modules: `src/hooks/useFileTree.ts`, `src/components/FileTree.tsx`, `src/App.css`.
- Duplicated and shallow search filter logic in `src/components/FileTree.tsx` (two copies, only checks a couple of levels deep).
- Unused code and dependencies: `src/hooks/useDragDrop.ts` is unused; `@dnd-kit/sortable`, `@dnd-kit/utilities`, and `@tauri-apps/plugin-opener` are not referenced in `src`.
- Path handling via string splits (`src/App.tsx`, `src/components/FileTree.tsx`, `src/utils/fileTreeUtils.ts`) is not OS-safe.
- Global key listeners spread across components (`src/App.tsx`, `src/components/Sidebar.tsx`, `src/components/SearchInput.tsx`) risk conflicts.
- Effects with brittle dependencies or re-attaching listeners on every render (`src/components/Sidebar.tsx`).
- Unused or constant state holders (`src/App.tsx` `sidebarCollapsed`, `src/components/Sidebar.tsx` `errorFilePaths`).
- Duplicated editor reset/file-name logic in `src/App.tsx`.

## Roadmap

### Phase 0: Quick Wins (1-2 days)
- Remove unused dependencies from `package.json` after confirming no runtime usage.
- Remove unused hook `src/hooks/useDragDrop.ts` or wire it into `FileTree` and delete duplicate DnD logic.
- Replace constant state with constants; remove unused sets (`src/App.tsx`, `src/components/Sidebar.tsx`).
- Fix effect dependency lists and avoid re-adding listeners every render (`src/components/Sidebar.tsx`).
- Extract `matchesSearch` and recursive `hasMatchingDescendants` helpers to remove duplication (`src/components/FileTree.tsx`).
- Switch path ops to `@tauri-apps/api/path` helpers (basename/dirname/join) (`src/App.tsx`, `src/utils/fileTreeUtils.ts`, `src/components/FileTree.tsx`).

### Phase 1: Structural Refactors (1-2 weeks)
- Split `useFileTree` into smaller hooks: data loading/watching, selection, rename, file ops, clipboard (`src/hooks/useFileTree.ts`).
- Extract keyboard navigation and context menu handling into focused hooks/subcomponents (`src/components/FileTree.tsx`).
- Create `useGlobalShortcuts` to centralize keyboard bindings used by App/Sidebar/SearchInput.
- Extract editor file operations into `useEditorFiles` or `useProjectFiles` to reduce duplication in `src/App.tsx`.
- Add unit tests for the extracted helpers (selection, search filter, path utilities).

### Phase 2: Styling Cleanup (1 week)
- Split `src/App.css` into component-level styles (e.g., `Sidebar.css`, `FileTree.css`, `GitSync.css`).
- Keep shared tokens in a single file such as `src/styles/variables.css` to reduce global sprawl.

### Phase 3: Tooling and Hygiene (ongoing)
- Add ESLint + Prettier with React Hooks rules; add a `lint` script.
- Add dependency checks to prevent unused packages in `package.json`.
- Document architecture in `docs/` (file tree flow, Git sync flow).
