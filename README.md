# Desketch

[![Build desktop apps](https://github.com/shakg/desketch/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/shakg/desketch/actions/workflows/build.yml)

A local-first desktop drawing app powered by Tauri and tldraw.

<img width="1205" height="838" alt="Screenshot from 2026-01-19 19-59-59" src="https://github.com/user-attachments/assets/135d7ead-3a9d-4a22-b779-8ac6803aaf36" />



## At a glance
- Works offline with local folders and Git-friendly `.tldr` files
- Fast canvas with a minimal UI focused on drawing
- Desktop-first workflow with project folders and a status bar

## Quick start
1) Install dependencies:

```bash
npm install
```

2) Run the desktop app:

```bash
npm run tauri dev
```

3) Open a project folder and start drawing.

## Features
- Open a project folder and browse drawings from the sidebar
- Create new drawings and save to `.tldr` files
- Dirty-state indicator and status bar for current file/project
- Keyboard shortcuts for open, new, and save

## Usage
Desketch is folder-based: you open a directory and the app treats it as your drawing project. Files are stored as `.tldr` so they are easy to version with Git and share.

### Open a project folder
1) Launch Desketch.
2) Use **Open Project Folder** or `Ctrl/Cmd+O`.
3) Choose a folder on disk (an existing repo works great).

Once opened, the sidebar lists the drawings in that folder.

### Create a new drawing
1) Use **New Drawing** or `Ctrl/Cmd+N`.
2) Give the drawing a name.
3) Start sketching on the canvas.

Desketch creates a new `.tldr` file in the project folder.

### Save changes
Desketch shows a dirty-state indicator when there are unsaved changes.

1) Use **Save** or `Ctrl/Cmd+S`.
2) The current drawing is saved back to its `.tldr` file.

### Organize with Git
Because drawings are plain files in your project folder, you can commit them like any other asset.

```bash
git status
git add .
git commit -m "Add new concept sketches"
```

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

### Windows developer setup
Use the PowerShell installer on Windows:

```powershell
.\install.ps1
```

Notes:
- The script installs Node.js (LTS), Rust (rustup), and Visual Studio Build Tools.
- When the Visual Studio installer opens, select **Desktop development with C++**.
- After installation, run `npm install` and `npm run tauri dev`.

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
