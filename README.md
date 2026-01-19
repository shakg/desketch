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

## Initialize a repo for drawings
Create a new Git repo and use it as your Desketch project folder.

1) Create a new repository named `docs` (on GitHub or locally).
2) Clone it:

```bash
git clone git@github.com:YOUR_USER/docs.git
```

3) Open Desketch, choose "Open Project Folder", and select the cloned `docs` folder.
4) Create or save `.tldr` drawings inside the repo so they are Git-enabled and easy to version.

## Tech stack
- Tauri 2
- React 19
- tldraw
