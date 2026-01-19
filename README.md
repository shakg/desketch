# Desketch

A local-first desktop drawing app powered by Tauri and tldraw.

## Features
- Open a project folder and browse drawings from the sidebar
- Create new drawings and save to `.tldr` files
- Dirty-state indicator and status bar for current file/project
- Keyboard shortcuts for open, new, and save

## Keyboard shortcuts
- `Ctrl/Cmd+O` Open project folder
- `Ctrl/Cmd+N` New drawing
- `Ctrl/Cmd+S` Save

## Development
Install dependencies:

```bash
npm install
```

Run the desktop app:

```bash
npm run tauri dev
```

Run the web app:

```bash
npm run dev
```

Build:

```bash
npm run build
```

## Tech stack
- Tauri 2
- React 19
- tldraw
