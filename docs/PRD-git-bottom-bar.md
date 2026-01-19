# Product Requirements Document: Bottom Bar Git Status

## Overview

### Feature Description
Bottom Bar Git Status moves Easy Git feedback and actions from the left sidebar to a compact, always-visible bottom bar. In Easy mode, the left sidebar Git panel is removed entirely, and the bottom bar becomes the primary Git touchpoint. A single click on the status indicator performs a smart sync (pull if needed, auto-commit local changes, push). Advanced users can switch to Advanced Git Mode in Settings, which restores the existing left sidebar Git control panel.

### Goals
- Reduce Git UI footprint in Easy mode while keeping status always visible
- Make syncing feel one-tap and obvious for non-technical users
- Preserve Advanced Git UI for power users behind a toggle
- Provide clear visual status (color + text) for local and remote sync state

### Non-Goals
- No staging, branching, or commit message editing in Easy mode
- No inline conflict resolution UI
- No new Git provider integrations or OAuth flows

---

## User Stories

- As a user, I want to see Git sync status at a glance without opening a sidebar.
- As a user, I want one click to sync my work to the remote repository.
- As a user, I want to know when my local changes are not synced yet.
- As a power user, I want to switch back to the full Git panel when needed.
- As a user, I want to see clear errors if a sync cannot complete.

---

## Usage Scenarios

1. **Quick Sync**
   - A user edits files in a Git repo.
   - The bottom bar indicator turns amber and reads "Local changes".
   - The user clicks it.
   - The app auto-commits and pushes changes.
   - The indicator returns to "Up to date".

2. **Remote Updates Available**
   - A collaborator pushes updates.
   - The bottom bar shows "Updates available" in amber.
   - The user clicks it and the app pulls updates.

3. **Conflict or Error**
   - A user has local changes and remote updates.
   - The user clicks sync and a conflict occurs.
   - The bottom bar turns red with "Needs attention".
   - A toast explains that manual resolution is required.

4. **Advanced Mode**
   - The user opens Settings and enables Advanced Git Mode.
   - The left sidebar Git panel appears with full controls.
   - The bottom bar keeps a minimal status readout but does not replace the advanced panel.

---

## UI/UX Design

### Location
Bottom bar, right-aligned (or adjacent to existing project/status indicators). It is always visible when a Git repo is open.

### Bottom Bar Indicator (Easy Mode)

```
┌─────────────────────────────────────────────────────────────┐
│  Status: Up to date   [Git Sync]                             │
│  Status: Local changes (amber) [Git Sync]                    │
│  Status: Needs attention (red) [Git Sync]                    │
└─────────────────────────────────────────────────────────────┘
```

### Status States
| State | Color | Meaning |
|-------|-------|---------|
| Up to date | Green | No local or remote changes |
| Local changes | Amber | Local changes saved but not synced |
| Updates available | Amber | Remote commits available to pull |
| Sync in progress | Blue | Sync is running |
| Needs attention | Red | Sync failed or conflict detected |
| Not a repo | Gray | Open folder is not a Git repository |

### Interactions
- **Click indicator**: Runs Smart Sync (fetch, pull if behind, auto-commit local changes, push).
- **Hover**: Shows tooltip with last sync time and brief status detail.
- **Disabled**: If not a repo, indicator is present but non-interactive.
- **Notifications**: Success and error toasts for each sync attempt.

### Advanced Mode Behavior
- Left sidebar Git panel is visible and fully interactive.
- Bottom bar shows a compact status label (no primary action button) to avoid duplicate controls.

---

## Settings

### Toggle
Settings > Git > "Git Mode"
- **Easy (default)**: Bottom bar only, no left sidebar Git panel.
- **Advanced**: Restore left sidebar Git panel and controls.

### Settings Page
If a Settings page does not exist, create a basic Settings screen that includes a Git section with the Git Mode toggle.

---

## Smart Sync Behavior

### Logic
1. Fetch remote to update ahead/behind status.
2. If behind, pull remote changes.
3. If local changes exist, auto-commit with a generated message.
4. Push local commits to remote.

### Error Handling
- If pull results in conflict: show "Needs attention" with guidance to resolve externally.
- If push fails due to authentication: show "Check Git credentials".
- If no changes exist: show a short "Already up to date" toast.

---

## Technical Approach

### Git Commands
| Operation | Command |
|-----------|---------|
| Check repo | `git rev-parse --is-inside-work-tree` |
| Status | `git status --porcelain` |
| Ahead/behind | `git rev-list --left-right --count @{upstream}...HEAD` |
| Fetch | `git fetch` |
| Pull | `git pull` |
| Auto-commit | `git add -A && git commit -m "<auto message>"` |
| Push | `git push` |

### Auto-Commit Messages
Use short, consistent messages such as:
- `Sync from Desketch`
- `Desketch auto-sync`

---

## MVP Scope

### Included
- Bottom bar Git indicator with status text and color
- One-click Smart Sync in Easy mode
- Settings toggle for Easy vs Advanced Git
- Hide left sidebar Git panel in Easy mode
- Error and success toasts

### Deferred
- Inline diff viewer
- Conflict resolution UI
- Custom commit messages in Easy mode
- Branch switching or history

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Sync completion rate | 95% of sync attempts succeed |
| Easy mode adoption | 70% of Git users keep Easy mode enabled |
| Time to sync | Median time under 5 seconds |
| Error recovery | 80% of errors resolved within one retry |
