import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let storage;
const localStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

beforeEach(async () => {
  vi.restoreAllMocks();
  Object.defineProperty(window, 'localStorage', localStorageDescriptor);
  vi.resetModules();
  window.localStorage.clear();
  storage = await import('./storage.js');
});

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(window, 'localStorage', localStorageDescriptor);
  window.localStorage.clear();
});

describe('browser storage utilities', () => {
  it('reads and writes posts and users as arrays', () => {
    const posts = [{ id: 'post-1', title: 'A local post' }];
    const users = [{ id: 'user-1', username: 'writer' }];

    storage.savePosts(posts);
    storage.saveUsers(users);

    expect(storage.getPosts()).toEqual(posts);
    expect(storage.getUsers()).toEqual(users);
    expect(window.localStorage.getItem('writespace_posts')).toBe(JSON.stringify(posts));
    expect(window.localStorage.getItem('writespace_users')).toBe(JSON.stringify(users));
  });

  it('returns empty arrays for missing posts and users', () => {
    expect(storage.getPosts()).toEqual([]);
    expect(storage.getUsers()).toEqual([]);
  });

  it('clears cached posts when the stored JSON becomes malformed', () => {
    const priorPosts = [{ id: 'post-1' }];
    storage.savePosts(priorPosts);
    window.localStorage.setItem('writespace_posts', '{malformed');

    expect(storage.getPosts()).toEqual([]);
    expect(storage.getStorageWarning()).toContain('temporary in-memory data');
    expect(storage.getPosts()).toEqual([]);
  });

  it('clears cached users when stored JSON has the wrong shape', () => {
    storage.saveUsers([{ id: 'user-1' }]);
    window.localStorage.setItem('writespace_users', JSON.stringify({ users: [] }));

    expect(storage.getUsers()).toEqual([]);
    expect(storage.getStorageWarning()).toContain('invalid data');
  });

  it('uses cached values and warns when browser storage getter access is denied', () => {
    const priorPosts = [{ id: 'post-1' }];
    storage.savePosts(priorPosts);
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('Storage access denied');
    });

    expect(storage.getPosts()).toEqual(priorPosts);
    expect(storage.getStorageWarning()).toContain('temporary in-memory data');
  });

  it('uses cached values and warns when writing to browser storage fails', () => {
    const priorUsers = [{ id: 'user-1' }];
    vi.spyOn(window, 'localStorage', 'get').mockReturnValue({
      getItem: () => null,
      setItem: () => {
        throw new Error('Quota exceeded');
      },
      removeItem: () => {},
    });

    storage.saveUsers(priorUsers);

    expect(storage.getUsers()).toEqual(priorUsers);
    expect(storage.getStorageWarning()).toContain('temporary in-memory data');
  });

  it('reads, writes, and clears a session', () => {
    const session = { userId: 'user-1', role: 'writer' };

    expect(storage.getSession()).toBeNull();
    storage.setSession(session);
    expect(storage.getSession()).toEqual(session);
    expect(window.localStorage.getItem('writespace_session')).toBe(JSON.stringify(session));

    storage.clearSession();

    expect(storage.getSession()).toBeNull();
    expect(window.localStorage.getItem('writespace_session')).toBeNull();
  });

  it('uses a cached session when access to browser storage is denied', () => {
    const session = { userId: 'user-1', username: 'writer', displayName: 'Writer', role: 'user' };
    storage.setSession(session);
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('Storage access denied');
    });

    expect(storage.getSession()).toEqual(session);
    expect(storage.getStorageWarning()).toContain('temporary in-memory data');
  });

  it('retains a session in memory when browser storage session writes fail', () => {
    const session = { userId: 'user-1', username: 'writer', displayName: 'Writer', role: 'user' };
    vi.spyOn(window, 'localStorage', 'get').mockReturnValue({
      getItem: () => null,
      setItem: () => {
        throw new Error('Quota exceeded');
      },
      removeItem: () => {},
    });

    storage.setSession(session);

    expect(storage.getSession()).toEqual(session);
    expect(storage.getStorageWarning()).toContain('temporary in-memory data');
  });

  it('clears a cached session when the stored session JSON is malformed', () => {
    storage.setSession({ userId: 'user-1' });
    window.localStorage.setItem('writespace_session', '{malformed');

    expect(storage.getSession()).toBeNull();
    expect(storage.getStorageWarning()).toContain('invalid data');
    expect(storage.getSession()).toBeNull();
  });

  it('clears a cached session when stored JSON is not a session object', () => {
    storage.setSession({ userId: 'user-1' });
    window.localStorage.setItem('writespace_session', JSON.stringify(['not', 'a session']));

    expect(storage.getSession()).toBeNull();
    expect(storage.getStorageWarning()).toContain('invalid data');
  });

  it('replaces invalid save values with empty arrays or a null session', () => {
    storage.savePosts({ id: 'not-an-array' });
    storage.saveUsers('not-an-array');
    storage.setSession(['not', 'a session']);

    expect(storage.getPosts()).toEqual([]);
    expect(storage.getUsers()).toEqual([]);
    expect(storage.getSession()).toBeNull();
    expect(storage.getStorageWarning()).toContain('invalid data');
  });

  it('clears session memory and warns when browser storage cannot remove it', () => {
    storage.setSession({ userId: 'user-1', username: 'writer', displayName: 'Writer', role: 'user' });
    vi.spyOn(window, 'localStorage', 'get').mockReturnValue({
      getItem: () => JSON.stringify({ userId: 'user-1', username: 'writer', displayName: 'Writer', role: 'user' }),
      setItem: () => {},
      removeItem: () => {
        throw new Error('Storage access denied');
      },
    });

    storage.clearSession();

    expect(storage.getSession()).toBeNull();
    expect(storage.getStorageWarning()).toContain('temporary in-memory data');
  });
});
