import { useEffect, useMemo, useState } from 'react';
import { useGitSync } from '../hooks/useGitSync';
import {
  createAutoCommitMessage,
  getEasyGitActions,
  getEasyGitStatus,
} from '../utils/gitEasyMode';

interface GitSyncProps {
  projectPath: string | null;
  fileTreeSyncing?: boolean;
}

type GitMessage = {
  type: 'success' | 'error';
  text: string;
};

function getStatusClass(status: string) {
  switch (status) {
    case 'A':
      return 'added';
    case 'D':
      return 'deleted';
    case 'M':
      return 'modified';
    case '?':
      return 'untracked';
    case 'R':
      return 'modified';
    default:
      return 'modified';
  }
}

export function GitSync({ projectPath, fileTreeSyncing }: GitSyncProps) {
  const git = useGitSync(projectPath);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [commitMessage, setCommitMessage] = useState('');
  const [message, setMessage] = useState<GitMessage | null>(null);
  const [advancedEnabled, setAdvancedEnabled] = useState(() => {
    try {
      return localStorage.getItem('desketch.git.advanced') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    setCommitMessage('');
    setMessage(null);
  }, [projectPath]);

  useEffect(() => {
    if (!projectPath) {
      setIsCollapsed(true);
      return;
    }

    let active = true;

    git.refresh().then((snapshot) => {
      if (!active || !snapshot) return;
      setIsCollapsed(!snapshot.isRepo);
    });

    return () => {
      active = false;
    };
  }, [projectPath, git.refresh]);

  useEffect(() => {
    if (git.error) {
      setMessage({ type: 'error', text: git.error });
    }
  }, [git.error]);

  useEffect(() => {
    try {
      localStorage.setItem('desketch.git.advanced', String(advancedEnabled));
    } catch {
      // Ignore storage failures to keep the UI usable.
    }
  }, [advancedEnabled]);

  useEffect(() => {
    if (!projectPath || isCollapsed) return;
    if (!fileTreeSyncing) {
      git.refresh();
    }
  }, [fileTreeSyncing, isCollapsed, projectPath, git.refresh]);

  const stagedCount = useMemo(
    () => git.files.filter((file) => file.staged).length,
    [git.files]
  );
  const controlsDisabled = git.isBusy || git.isLoading;
  const hasChanges = git.files.length > 0;
  const canCommit = stagedCount > 0 && commitMessage.trim().length > 0;
  const canStageAll = hasChanges;
  const canUnstageAll = stagedCount > 0;
  const canPush = git.isRepo && git.hasUpstream && git.ahead > 0;
  const canPull = git.isRepo && git.hasUpstream && git.behind > 0;
  const easyStatus = getEasyGitStatus({
    isRepo: git.isRepo,
    hasUpstream: git.hasUpstream,
    filesCount: git.files.length,
    ahead: git.ahead,
    behind: git.behind,
    isLoading: git.isLoading,
    isBusy: git.isBusy,
    error: git.error,
  });
  const easyActions = getEasyGitActions({
    isRepo: git.isRepo,
    hasUpstream: git.hasUpstream,
    filesCount: git.files.length,
    ahead: git.ahead,
    isLoading: git.isLoading,
    isBusy: git.isBusy,
  });

  const handleAction = async (action: () => Promise<void>, successText?: string) => {
    setMessage(null);
    try {
      await action();
      if (successText) {
        setMessage({ type: 'success', text: successText });
      }
    } catch (error) {
      const text =
        error instanceof Error ? error.message : 'Git command failed.';
      setMessage({ type: 'error', text });
    }
  };

  const handleEasySync = () =>
    handleAction(async () => {
      if (hasChanges) {
        await git.commitAll(createAutoCommitMessage());
      }
      await git.push();
    }, 'Sync complete.');

  return (
    <section className={`git-sync ${isCollapsed ? 'collapsed' : ''}`}>
      <button
        className="git-sync-header"
        onClick={() =>
          setIsCollapsed((prev) => {
            const next = !prev;
            if (!next && projectPath) {
              git.refresh();
            }
            return next;
          })
        }
        type="button"
      >
        <span className="git-sync-title">
          <span className="git-sync-toggle">{isCollapsed ? '▶' : '▼'}</span>
          Git Sync
          {(git.files.length > 0 || git.ahead > 0 || git.behind > 0) && (
            <span className="git-change-dot" />
          )}
        </span>
        <span className="git-sync-status">
          {git.isLoading ? 'Checking...' : git.isRepo ? 'Ready' : 'Not a repo'}
        </span>
      </button>

      {!isCollapsed && (
        <div className="git-sync-body">
          {!git.isRepo ? (
            <div className="git-empty">Not a Git repository.</div>
          ) : (
            <>
              {advancedEnabled ? (
                <>
                  <div className="git-branch-row">
                    <span className="git-branch">Branch: {git.branch ?? 'unknown'}</span>
                    <span className="git-ahead-behind">
                      {git.hasUpstream ? (
                        <>
                          <span>↑{git.ahead}</span>
                          <span>↓{git.behind}</span>
                        </>
                      ) : (
                        <span className="git-upstream-missing">No upstream</span>
                      )}
                    </span>
                  </div>

                  {git.isLoading ? (
                    <div className="git-loading">Loading status...</div>
                  ) : hasChanges ? (
                    <div className="git-file-list">
                      {git.files.map((file) => (
                        <label className="git-file-item" key={file.path}>
                          <input
                            className="git-file-checkbox"
                            type="checkbox"
                            checked={file.staged}
                            disabled={controlsDisabled}
                            onChange={() =>
                              handleAction(() =>
                                file.staged ? git.unstageFile(file.path) : git.stageFile(file.path)
                              )
                            }
                          />
                          <span className={`git-file-status ${getStatusClass(file.status)}`}>
                            {file.status}
                          </span>
                          <span className="git-file-name" title={file.path}>
                            {file.path}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="git-empty">Working tree clean.</div>
                  )}

                  <div className="git-action-row">
                    <button
                      className="git-action-btn"
                      type="button"
                      disabled={!canStageAll || controlsDisabled}
                      onClick={() => handleAction(git.stageAll)}
                    >
                      Stage All
                    </button>
                    <button
                      className="git-action-btn"
                      type="button"
                      disabled={!canUnstageAll || controlsDisabled}
                      onClick={() => handleAction(git.unstageAll)}
                    >
                      Unstage All
                    </button>
                  </div>

                  <div className="git-commit">
                    <label className="git-commit-label" htmlFor="git-commit-message">
                      Commit Message
                    </label>
                    <textarea
                      id="git-commit-message"
                      className="git-commit-message"
                      value={commitMessage}
                      onChange={(event) => setCommitMessage(event.target.value)}
                      placeholder="Describe your changes"
                      rows={2}
                      disabled={controlsDisabled}
                    />
                    <button
                      className="git-action-btn git-commit-btn"
                      type="button"
                      disabled={!canCommit || controlsDisabled}
                      onClick={() =>
                        handleAction(async () => {
                          await git.commit(commitMessage);
                          setCommitMessage('');
                        }, 'Commit created.')
                      }
                    >
                      Commit
                    </button>
                  </div>

                  <div className="git-action-row">
                    <button
                      className="git-action-btn"
                      type="button"
                      disabled={!canPull || controlsDisabled}
                      onClick={() => handleAction(git.pull, 'Pull complete.')}
                    >
                      Pull
                    </button>
                    <button
                      className="git-action-btn"
                      type="button"
                      disabled={!canPush || controlsDisabled}
                      onClick={() => handleAction(git.push, 'Push complete.')}
                    >
                      Push
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="git-easy-status">{easyStatus}</div>
                  <div className="git-action-row">
                    <button
                      className="git-action-btn git-easy-btn"
                      type="button"
                      disabled={!easyActions.canSync}
                      onClick={handleEasySync}
                    >
                      Sync with Remote
                    </button>
                  </div>
                  <div className="git-action-row">
                    <button
                      className="git-action-btn git-easy-btn"
                      type="button"
                      disabled={!easyActions.canCheckRemote}
                      onClick={() => handleAction(git.pull, 'Check complete.')}
                    >
                      Check Remote
                    </button>
                  </div>
                </>
              )}

              <div className="git-toggle-row">
                <label className="git-toggle-label" htmlFor="git-advanced-toggle">
                  Advanced Git
                </label>
                <input
                  id="git-advanced-toggle"
                  className="git-toggle-input"
                  type="checkbox"
                  checked={advancedEnabled}
                  onChange={(event) => setAdvancedEnabled(event.target.checked)}
                />
              </div>
            </>
          )}

          {message && (
            <div className={`git-message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
