import { useCallback, useEffect, useState } from 'react';
import { Command } from '@tauri-apps/plugin-shell';

export interface GitFileStatus {
  path: string;
  status: string;
  indexStatus: string;
  worktreeStatus: string;
  staged: boolean;
}

export interface GitStatusSnapshot {
  isRepo: boolean;
  branch: string | null;
  ahead: number;
  behind: number;
  hasUpstream: boolean;
  files: GitFileStatus[];
}

interface GitSyncState extends GitStatusSnapshot {
  isLoading: boolean;
  isBusy: boolean;
  error: string | null;
}

const emptySnapshot: GitStatusSnapshot = {
  isRepo: false,
  branch: null,
  ahead: 0,
  behind: 0,
  hasUpstream: false,
  files: [],
};

const emptyState: GitSyncState = {
  ...emptySnapshot,
  isLoading: false,
  isBusy: false,
  error: null,
};

function toRepoPath(fullPath: string, repoPath: string): string {
  const normalizedRepo = repoPath.replace(/\\/g, '/');
  const normalizedFull = fullPath.replace(/\\/g, '/');
  if (normalizedFull === normalizedRepo) return '.';
  if (normalizedFull.startsWith(`${normalizedRepo}/`)) {
    return normalizedFull.slice(normalizedRepo.length + 1);
  }
  return fullPath;
}

function parseStatusOutput(output: string): GitFileStatus[] {
  return output
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const indexStatus = line[0] ?? ' ';
      const worktreeStatus = line[1] ?? ' ';
      let path = line.slice(3);

      if (path.includes(' -> ')) {
        path = path.split(' -> ')[1] || path;
      }

      const staged = indexStatus !== ' ' && indexStatus !== '?';
      const status = worktreeStatus !== ' ' ? worktreeStatus : indexStatus;

      return {
        path,
        status: status === ' ' ? '?' : status,
        indexStatus,
        worktreeStatus,
        staged,
      };
    });
}

function formatGitError(args: string[], stderr: string, stdout: string): string {
  const detail = stderr.trim() || stdout.trim();
  if (detail) return detail;
  return `Git command failed: git ${args.join(' ')}`;
}

export function useGitSync(projectPath: string | null) {
  const [state, setState] = useState<GitSyncState>(emptyState);

  useEffect(() => {
    setState(emptyState);
  }, [projectPath]);

  const runGitCommand = useCallback(
    async (args: string[], allowError = false) => {
      if (!projectPath) {
        throw new Error('No project folder selected.');
      }
      const command = Command.create('git', args, { cwd: projectPath });
      const output = await command.execute();

      if (output.code !== 0 && !allowError) {
        throw new Error(formatGitError(args, output.stderr, output.stdout));
      }

      return output;
    },
    [projectPath]
  );

  const refresh = useCallback(async () => {
    if (!projectPath) {
      setState(emptyState);
      return null;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const repoCheck = await runGitCommand(
        ['rev-parse', '--is-inside-work-tree'],
        true
      );
      const isRepo = repoCheck.code === 0 && repoCheck.stdout.trim() === 'true';

      if (!isRepo) {
        setState((prev) => ({
          ...prev,
          ...emptySnapshot,
          isRepo: false,
          isLoading: false,
        }));
        return { ...emptySnapshot, isRepo: false };
      }

      const branchResult = await runGitCommand(['branch', '--show-current'], true);
      let branch = branchResult.stdout.trim();

      if (!branch) {
        const headResult = await runGitCommand(['rev-parse', '--short', 'HEAD'], true);
        branch = headResult.code === 0 ? `detached@${headResult.stdout.trim()}` : 'detached';
      }

      const statusResult = await runGitCommand(['status', '--porcelain'], true);
      const files = parseStatusOutput(statusResult.stdout);

      let ahead = 0;
      let behind = 0;
      let hasUpstream = true;
      const upstreamResult = await runGitCommand(
        ['rev-list', '--left-right', '--count', '@{upstream}...HEAD'],
        true
      );
      if (upstreamResult.code === 0) {
        const [behindRaw, aheadRaw] = upstreamResult.stdout.trim().split(/\s+/);
        behind = Number(behindRaw) || 0;
        ahead = Number(aheadRaw) || 0;
      } else {
        hasUpstream = false;
      }

      const nextSnapshot: GitStatusSnapshot = {
        isRepo: true,
        branch,
        ahead,
        behind,
        hasUpstream,
        files,
      };

      setState((prev) => ({
        ...prev,
        ...nextSnapshot,
        isLoading: false,
      }));

      return nextSnapshot;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to read Git status.';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      return null;
    }
  }, [projectPath, runGitCommand]);

  const runWithBusy = useCallback(
    async (action: () => Promise<void>) => {
      setState((prev) => ({ ...prev, isBusy: true, error: null }));
      try {
        await action();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Git command failed.';
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      } finally {
        setState((prev) => ({ ...prev, isBusy: false }));
      }
    },
    []
  );

  const stageFile = useCallback(
    async (filePath: string) => {
      await runWithBusy(async () => {
        if (!projectPath) throw new Error('No project folder selected.');
        await runGitCommand(['add', '--', toRepoPath(filePath, projectPath)]);
        await refresh();
      });
    },
    [projectPath, runGitCommand, refresh, runWithBusy]
  );

  const unstageFile = useCallback(
    async (filePath: string) => {
      await runWithBusy(async () => {
        if (!projectPath) throw new Error('No project folder selected.');
        await runGitCommand(['reset', 'HEAD', '--', toRepoPath(filePath, projectPath)]);
        await refresh();
      });
    },
    [projectPath, runGitCommand, refresh, runWithBusy]
  );

  const stageAll = useCallback(async () => {
    await runWithBusy(async () => {
      await runGitCommand(['add', '-A']);
      await refresh();
    });
  }, [runGitCommand, refresh, runWithBusy]);

  const unstageAll = useCallback(async () => {
    await runWithBusy(async () => {
      await runGitCommand(['reset', 'HEAD']);
      await refresh();
    });
  }, [runGitCommand, refresh, runWithBusy]);

  const commit = useCallback(
    async (message: string) => {
      await runWithBusy(async () => {
        const trimmed = message.trim();
        if (!trimmed) {
          throw new Error('Commit message cannot be empty.');
        }
        await runGitCommand(['commit', '-m', trimmed]);
        await refresh();
      });
    },
    [runGitCommand, refresh, runWithBusy]
  );

  const commitAll = useCallback(
    async (message: string) => {
      await runWithBusy(async () => {
        const trimmed = message.trim();
        if (!trimmed) {
          throw new Error('Commit message cannot be empty.');
        }
        await runGitCommand(['add', '-A']);
        await runGitCommand(['commit', '-m', trimmed]);
        await refresh();
      });
    },
    [runGitCommand, refresh, runWithBusy]
  );

  const push = useCallback(async () => {
    await runWithBusy(async () => {
      await runGitCommand(['push']);
      await refresh();
    });
  }, [runGitCommand, refresh, runWithBusy]);

  const pull = useCallback(async () => {
    await runWithBusy(async () => {
      await runGitCommand(['pull']);
      await refresh();
    });
  }, [runGitCommand, refresh, runWithBusy]);

  const fetch = useCallback(async () => {
    await runWithBusy(async () => {
      await runGitCommand(['fetch']);
      await refresh();
    });
  }, [runGitCommand, refresh, runWithBusy]);

  return {
    ...state,
    refresh,
    stageFile,
    unstageFile,
    stageAll,
    unstageAll,
    commit,
    commitAll,
    push,
    pull,
    fetch,
  };
}
