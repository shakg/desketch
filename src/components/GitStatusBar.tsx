import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGitSync } from '../hooks/useGitSync';
import { createAutoCommitMessage, getEasyGitStatus } from '../utils/gitEasyMode';

interface GitStatusBarProps {
  projectPath: string | null;
  advancedEnabled: boolean;
}

type GitTone = 'muted' | 'success' | 'warning' | 'error' | 'info';

function getGitTone({
  isRepo,
  hasUpstream,
  filesCount,
  ahead,
  behind,
  isLoading,
  isBusy,
  error,
}: {
  isRepo: boolean;
  hasUpstream: boolean;
  filesCount: number;
  ahead: number;
  behind: number;
  isLoading: boolean;
  isBusy: boolean;
  error?: string | null;
}): GitTone {
  if (!isRepo) return 'muted';
  if (error) return 'error';
  if (isLoading || isBusy) return 'info';
  if (!hasUpstream) return 'warning';
  if (behind > 0 || filesCount > 0 || ahead > 0) return 'warning';
  return 'success';
}

export function GitStatusBar({ projectPath, advancedEnabled }: GitStatusBarProps) {
  const git = useGitSync(projectPath);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!projectPath) return;
    git.refresh();
    const interval = window.setInterval(() => {
      git.refresh();
    }, 15000);
    const handleFocus = () => git.refresh();
    window.addEventListener('focus', handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [projectPath, git.refresh]);

  useEffect(() => {
    if (git.error) {
      setLastMessage(git.error);
    }
  }, [git.error]);

  const statusText = useMemo(
    () => {
      const baseStatus = getEasyGitStatus({
        isRepo: git.isRepo,
        hasUpstream: git.hasUpstream,
        filesCount: git.files.length,
        ahead: git.ahead,
        behind: git.behind,
        isLoading: git.isLoading,
        isBusy: git.isBusy,
        error: git.error,
      });
      if (!advancedEnabled && git.isRepo && git.hasUpstream && !git.isLoading && !git.isBusy) {
        return `${baseStatus} · Click to sync`;
      }
      return baseStatus;
    },
    [
      git.ahead,
      git.behind,
      git.error,
      git.files.length,
      git.hasUpstream,
      git.isBusy,
      git.isLoading,
      git.isRepo,
      advancedEnabled,
    ]
  );

  const tone = useMemo(
    () =>
      getGitTone({
        isRepo: git.isRepo,
        hasUpstream: git.hasUpstream,
        filesCount: git.files.length,
        ahead: git.ahead,
        behind: git.behind,
        isLoading: git.isLoading,
        isBusy: git.isBusy,
        error: git.error,
      }),
    [
      git.ahead,
      git.behind,
      git.error,
      git.files.length,
      git.hasUpstream,
      git.isBusy,
      git.isLoading,
      git.isRepo,
    ]
  );

  const isClickable =
    !advancedEnabled &&
    git.isRepo &&
    git.hasUpstream &&
    !git.isLoading &&
    !git.isBusy;

  const handleSmartSync = useCallback(async () => {
    if (!isClickable) return;
    setLastMessage(null);
    try {
      await git.fetch();
      let snapshot = await git.refresh();
      if (!snapshot) return;
      if (snapshot.behind > 0) {
        await git.pull();
        snapshot = await git.refresh();
      }
      if (snapshot && snapshot.files.length > 0) {
        await git.commitAll(createAutoCommitMessage());
        snapshot = await git.refresh();
      }
      if (snapshot && snapshot.ahead > 0) {
        await git.push();
        await git.refresh();
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Git sync failed.';
      setLastMessage(text);
    }
  }, [git, isClickable]);

  const tooltip = lastMessage || statusText;

  return (
    <button
      className={`status-git ${tone} ${isClickable ? '' : 'disabled'}`}
      type="button"
      onClick={handleSmartSync}
      title={tooltip}
      aria-disabled={!isClickable}
    >
      <span className="status-git-label">Git</span>
      <span className="status-git-text">{statusText}</span>
    </button>
  );
}
