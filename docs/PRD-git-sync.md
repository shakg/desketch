# Product Requirements Document: Git Sync Feature

## Overview

### Feature Description
Git Sync brings version control directly into Desketch through a collapsible sidebar section positioned below the file tree. Users can perform essential Git operations—view status, stage changes, commit, push, and pull—without leaving the application or opening a terminal.

### Goals
- Enable designers and creators to version their work with minimal friction
- Provide visibility into the state of the local repository at a glance
- Support collaboration by allowing push and pull operations within the app
- Maintain a simple, approachable interface that does not overwhelm non-technical users

### Design Philosophy
Git Sync follows the same local-first, keyboard-friendly principles as the rest of Desketch. The feature exposes only fundamental operations so that users can benefit from version control without needing to learn advanced Git concepts. Authentication relies on the system's existing Git credentials (SSH keys or credential manager), avoiding additional configuration inside the app.

---

## User Stories

- As a user, I want to see the Git status of my project folder so that I know which files have changed.
- As a user, I want to stage individual files so that I can choose exactly what goes into each commit.
- As a user, I want to stage all changed files at once so that committing is quick when I want everything included.
- As a user, I want to unstage files so that I can correct mistakes before committing.
- As a user, I want to write a commit message and commit staged changes so that my work is saved in version history.
- As a user, I want to push commits to a remote repository so that my work is backed up and shared with collaborators.
- As a user, I want to pull changes from a remote repository so that I can receive updates from collaborators.
- As a user, I want to see a clear indicator when my branch is ahead or behind the remote so that I know when to push or pull.
- As a user, I want feedback when a Git operation succeeds or fails so that I understand what happened.
- As a user, I want the Git section to collapse so that I can hide it when I am not using version control.

---

## Usage Scenarios

1. **Check Project Status**
   - A user opens a project folder that is a Git repository.
   - The Git Sync section appears in the sidebar and displays the current branch name and a summary of changed files.

2. **Stage and Commit Work**
   - After editing several drawings, the user reviews the list of modified files in the Git Sync section.
   - They click the checkbox next to each file they want to include, or click "Stage All."
   - They type a commit message and press the Commit button.
   - A success notification confirms the commit was created.

3. **Push Changes to Remote**
   - The user finishes a session and wants to back up their work.
   - The Git Sync section shows "1 commit ahead" next to the branch name.
   - They click Push and the indicator updates to show the branch is up to date.

4. **Pull Collaborator Updates**
   - A user opens a shared project and sees "2 commits behind" in the Git Sync section.
   - They click Pull to fetch and merge remote changes.
   - The file tree updates to reflect new or modified files.

5. **Recover from a Failed Push**
   - A user clicks Push but the operation fails because the remote has new commits.
   - An error message suggests pulling first.
   - The user clicks Pull, resolves any conflicts externally if needed, and then pushes successfully.

6. **Work Without Git**
   - A user opens a folder that is not a Git repository.
   - The Git Sync section displays a message: "Not a Git repository" and remains collapsed by default.

---

## UI/UX Design

### Location
The Git Sync section lives in the sidebar, directly below the file tree. It is collapsible so users can hide it when not needed.

### Layout

```
┌─────────────────────────────────┐
│  ▼ Git Sync                     │
├─────────────────────────────────┤
│  Branch: main  ↑1 ↓0            │
├─────────────────────────────────┤
│  Modified Files                 │
│  ☐ drawings/sketch-01.tldr      │
│  ☐ drawings/sketch-02.tldr      │
│  ☑ notes/readme.md              │
├─────────────────────────────────┤
│  [Stage All]  [Unstage All]     │
├─────────────────────────────────┤
│  Commit Message                 │
│  ┌───────────────────────────┐  │
│  │ Add initial sketches      │  │
│  └───────────────────────────┘  │
│           [Commit]              │
├─────────────────────────────────┤
│  [Pull]           [Push]        │
└─────────────────────────────────┘
```

### Status Indicators
| Indicator | Meaning |
|-----------|---------|
| `↑N` | N commits ahead of remote (ready to push) |
| `↓N` | N commits behind remote (should pull) |
| `●` (colored dot) | Uncommitted changes exist |
| Branch name | Current checked-out branch |

### File Status Icons
| Icon | Meaning |
|------|---------|
| `M` | Modified |
| `A` | Added (new file) |
| `D` | Deleted |
| `?` | Untracked |

### Interactions
- **Collapse/Expand**: Click the section header to toggle visibility.
- **Stage/Unstage**: Click checkboxes next to files, or use Stage All / Unstage All buttons.
- **Commit**: Type a message and click Commit (disabled if message is empty or nothing is staged).
- **Push/Pull**: Single-click buttons; disabled when there is nothing to push or the repo is up to date.
- **Refresh**: Status refreshes automatically when the section expands and after each operation.

### Error States
- Network errors display a toast notification with a retry option.
- Authentication failures prompt the user to check their system Git credentials.
- Merge conflicts show an alert directing the user to resolve conflicts externally.

---

## Technical Approach

### Git Operations via Tauri Shell Commands
All Git operations are executed by invoking the system `git` binary through Tauri's shell command API. This approach:
- Reuses the user's existing Git installation and configuration
- Leverages system-level credential storage (SSH agent, credential manager)
- Avoids bundling or maintaining a separate Git library

### Command Mapping

| Operation | Command |
|-----------|---------|
| Check if repo | `git rev-parse --is-inside-work-tree` |
| Get branch | `git branch --show-current` |
| Get status | `git status --porcelain` |
| Ahead/behind | `git rev-list --left-right --count @{upstream}...HEAD` |
| Stage file | `git add <path>` |
| Stage all | `git add -A` |
| Unstage file | `git reset HEAD <path>` |
| Unstage all | `git reset HEAD` |
| Commit | `git commit -m "<message>"` |
| Push | `git push` |
| Pull | `git pull` |

### Authentication
The feature relies entirely on system Git credentials:
- **SSH keys**: Users configure `~/.ssh` and ssh-agent as usual.
- **HTTPS**: Users rely on Git credential manager (e.g., `git-credential-manager`, macOS Keychain, Windows Credential Manager).

No credentials are stored or managed within Desketch.

### Error Handling
- Parse exit codes and stderr from Git commands to detect errors.
- Surface user-friendly messages for common issues (not a repo, no remote configured, authentication failure, merge conflict).
- Log raw output for debugging purposes.

---

## MVP Scope

### Included in MVP
- Detect whether opened folder is a Git repository
- Display current branch name
- Show ahead/behind counts relative to upstream
- List changed files with status indicators
- Stage and unstage individual files
- Stage all / unstage all
- Commit with a user-provided message
- Push to upstream
- Pull from upstream
- Collapsible sidebar section
- Success and error notifications

### Deferred to Future Releases
- Branch creation and switching
- Viewing commit history / log
- Diff viewer for individual files
- Stash management
- Merge conflict resolution UI
- GitHub/GitLab integration (issues, PRs)
- Credential entry within the app
- Git clone from URL
- Submodule support
- Rebase and advanced merge strategies

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Adoption | 50% of users who open a Git repo use Git Sync at least once per week |
| Task completion | 90% of commit attempts succeed without errors |
| Error recovery | Users resolve push/pull errors within one retry 80% of the time |
| Usability | Average time to commit a change is under 15 seconds |
| User satisfaction | Feature receives a net positive rating in feedback surveys |

---

## Open Questions

1. Should the Git Sync section auto-expand when uncommitted changes are detected?
2. How should large numbers of changed files (100+) be displayed—pagination, virtual list, or summary only?
3. Should there be a manual refresh button, or is automatic refresh on focus sufficient?

---

## References

- Existing documentation: `docs/usage-scenarios-and-user-stories.md`
- Tauri shell command API: https://tauri.app/develop/calling-rust/#commands
