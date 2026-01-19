export const EASY_GIT_AUTO_MESSAGE = 'Desketch auto-sync';

export function createAutoCommitMessage(): string {
  return EASY_GIT_AUTO_MESSAGE;
}

export interface EasyGitStatusInput {
  isRepo: boolean;
  hasUpstream: boolean;
  filesCount: number;
  ahead: number;
  behind: number;
  isLoading: boolean;
  isBusy: boolean;
  error?: string | null;
}

export function getEasyGitStatus(input: EasyGitStatusInput): string {
  if (!input.isRepo) return 'Not a Git repository.';
  if (input.isLoading) return 'Checking...';
  if (input.isBusy) return 'Sync in progress';
  if (input.error) return 'Needs attention';
  if (!input.hasUpstream) return 'No upstream configured';
  if (input.behind > 0) return 'Remote updates available';
  if (input.filesCount > 0 || input.ahead > 0) return 'Local changes detected';
  return 'Up to date';
}

export interface EasyGitActionInput {
  isRepo: boolean;
  hasUpstream: boolean;
  filesCount: number;
  ahead: number;
  isLoading: boolean;
  isBusy: boolean;
}

export function getEasyGitActions(input: EasyGitActionInput) {
  const busy = input.isLoading || input.isBusy;
  const canSync =
    input.isRepo &&
    input.hasUpstream &&
    !busy &&
    (input.filesCount > 0 || input.ahead > 0);
  const canCheckRemote = input.isRepo && input.hasUpstream && !busy;

  return { canSync, canCheckRemote };
}
