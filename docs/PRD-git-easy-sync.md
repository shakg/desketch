# Product Requirements Document: Easy Git Sidebar

## Overview

### Feature Description
Easy Git Sidebar simplifies Git usage in Desketch's left sidebar for non-technical users. The interface removes advanced concepts (staging, cherry-pick, branch management) and replaces them with two primary actions:
- Sync with Remote (push local changes)
- Check Remote (pull remote changes)

Commit messages are auto-generated (dummy text) to keep the flow fast and friendly. Advanced Git features remain available behind a feature toggle, but the default experience is Easy Git Sidebar.

### Goals
- Let users sync their work without learning Git concepts
- Keep the sidebar workflow minimal and obvious
- Preserve advanced Git features for power users via a toggle
- Minimize setup by using system Git credentials

### Non-Goals
- No cherry-pick, rebase, stash, or branch management in easy mode
- No manual commit message entry in easy mode
- No diff viewer or conflict resolution UI

---

## User Stories

- As a user, I want a simple button to sync my changes to the remote repository.
- As a user, I want a simple button to check for remote updates and pull them.
- As a user, I want the app to handle commits for me without asking for messages.
- As a power user, I want to switch back to advanced Git tools when needed.
- As a user, I want to know whether I have local changes or remote updates.

---

## Usage Scenarios

1. **Sync My Work**
   - A user makes changes to files in the project.
   - The Git section shows "Local changes detected".
   - The user clicks "Sync with Remote".
   - The app creates a dummy commit and pushes it.

2. **Get Remote Updates**
   - A user opens a shared project.
   - The Git section shows "Remote updates available".
   - The user clicks "Check Remote".
   - The app pulls the changes into local.

3. **Use Advanced Git**
   - A power user opens Settings and enables "Advanced Git".
   - The sidebar switches to the existing advanced Git UI.

---

## UI/UX Design

### Location
The Git section remains in the left sidebar under the file tree.

### Easy Mode Layout

```
┌─────────────────────────────────┐
│  ▼ Git                         │
├─────────────────────────────────┤
│  Status: Up to date             │
├─────────────────────────────────┤
│  [Sync with Remote]             │
│  [Check Remote]                 │
└─────────────────────────────────┘
```

### Status Messages
| Status | Meaning |
|--------|---------|
| Up to date | No local or remote changes |
| Local changes detected | Local changes not yet synced |
| Remote updates available | Remote has commits not in local |
| Sync in progress | Push or pull is running |
| Needs attention | Error or conflict detected |

### Interactions
- **Sync with Remote**: Creates a dummy commit for all local changes and pushes it.
- **Check Remote**: Fetches and pulls remote changes into local.
- **Auto-refresh**: Status refreshes on section expand and after each action.
- **Toasts**: Success and error notifications for each action.

---

## Feature Toggle

### Default Behavior
Easy Git Sidebar is enabled by default.

### Toggle Location
Settings > Git > "Enable Advanced Git Tools"

### Toggle Behavior
- **Off (default)**: Show Easy Git Sidebar UI.
- **On**: Show the advanced Git UI (stage, commit message, push/pull, etc).

---

## Technical Approach

### Git Operations
Easy mode wraps simple Git commands using Tauri shell commands.

| Operation | Command |
|-----------|---------|
| Check repo | `git rev-parse --is-inside-work-tree` |
| Status | `git status --porcelain` |
| Ahead/behind | `git rev-list --left-right --count @{upstream}...HEAD` |
| Dummy commit | `git add -A && git commit -m "<auto message>"` |
| Push | `git push` |
| Pull | `git pull` |

### Dummy Commit Messages
Auto-generated commit text keeps flow minimal, examples:
- `Sync from Desketch`
- `Desketch auto-sync`
- `Update files`

The message does not need to be editable in easy mode.

### Error Handling
- If `git status` shows no changes, Sync button is disabled.
- If push fails due to remote changes, show a toast: "Remote changed. Click Check Remote."
- If pull results in conflicts, show: "Merge conflict. Resolve externally."

---

## MVP Scope

### Included
- Easy Git Sidebar with two buttons
- Auto-generated commit messages
- Status summary (local/remote changes)
- Feature toggle for advanced Git UI
- Success/error notifications

### Deferred
- Custom commit messages in easy mode
- In-app conflict resolution
- Branch management and other advanced Git features

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Sync success | 95% of sync attempts succeed without errors |
| Ease-of-use | 80% of Git users keep easy mode enabled |
| Support load | 30% fewer Git-related support requests |
