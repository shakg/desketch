import { describe, it, expect } from 'vitest';
import {
  createAutoCommitMessage,
  getEasyGitActions,
  getEasyGitStatus,
} from './gitEasyMode';

describe('gitEasyMode', () => {
  it('returns the auto commit message', () => {
    expect(createAutoCommitMessage()).toBe('Desketch auto-sync');
  });

  it('shows not a repo status', () => {
    const status = getEasyGitStatus({
      isRepo: false,
      hasUpstream: false,
      filesCount: 0,
      ahead: 0,
      behind: 0,
      isLoading: false,
      isBusy: false,
      error: null,
    });

    expect(status).toBe('Not a Git repository.');
  });

  it('shows remote updates when behind', () => {
    const status = getEasyGitStatus({
      isRepo: true,
      hasUpstream: true,
      filesCount: 0,
      ahead: 0,
      behind: 2,
      isLoading: false,
      isBusy: false,
      error: null,
    });

    expect(status).toBe('Remote updates available');
  });

  it('shows local changes when there are files or ahead commits', () => {
    const withFiles = getEasyGitStatus({
      isRepo: true,
      hasUpstream: true,
      filesCount: 1,
      ahead: 0,
      behind: 0,
      isLoading: false,
      isBusy: false,
      error: null,
    });

    const withAhead = getEasyGitStatus({
      isRepo: true,
      hasUpstream: true,
      filesCount: 0,
      ahead: 1,
      behind: 0,
      isLoading: false,
      isBusy: false,
      error: null,
    });

    expect(withFiles).toBe('Local changes detected');
    expect(withAhead).toBe('Local changes detected');
  });

  it('enables actions only when available', () => {
    const actions = getEasyGitActions({
      isRepo: true,
      hasUpstream: true,
      filesCount: 1,
      ahead: 0,
      isLoading: false,
      isBusy: false,
    });

    const blocked = getEasyGitActions({
      isRepo: true,
      hasUpstream: false,
      filesCount: 1,
      ahead: 1,
      isLoading: false,
      isBusy: false,
    });

    expect(actions.canSync).toBe(true);
    expect(actions.canCheckRemote).toBe(true);
    expect(blocked.canSync).toBe(false);
    expect(blocked.canCheckRemote).toBe(false);
  });
});
