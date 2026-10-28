import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createManagedUser,
  deleteManagedUser,
  getAdminMetrics,
  getManagedUsers,
  getRecentPosts,
  validateManagedUser,
} from './admin.js';
import { getPosts, getUsers, savePosts, saveUsers } from './storage.js';

const administrator = { userId: 'admin', username: 'admin', displayName: 'WriteSpace Administrator', role: 'admin' };
const standardUser = { userId: 'user-1', username: 'ari', displayName: 'Ari Reader', role: 'user' };
const storedUsers = [
  { id: 'user-1', username: 'ari', displayName: 'Ari Reader', password: 'demo', role: 'user', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'admin-2', username: 'morgan', displayName: 'Morgan Admin', password: 'demo', role: 'admin', createdAt: '2026-01-02T00:00:00.000Z' },
];
const authoredPost = { id: 'post-1', title: 'Ari writing', authorId: 'user-1', authorName: 'Ari Reader', content: 'Body', createdAt: '2026-02-01T12:00:00.000Z' };

/** Reset browser-local posts and users before testing admin operations. */
function resetData() {
  localStorage.clear();
  saveUsers([]);
  savePosts([]);
}

describe('administrator account and dashboard operations', () => {
  beforeEach(() => {
    resetData();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('counts saved accounts separately from the default admin and standard users', () => {
    const metrics = getAdminMetrics([
      authoredPost,
      { ...authoredPost, id: 'post-2' },
    ], storedUsers);

    expect(metrics).toEqual({ totalPosts: 2, totalUsers: 2, totalAdmins: 2, standardUsers: 1 });
    expect(getAdminMetrics(null, null)).toEqual({ totalPosts: 0, totalUsers: 0, totalAdmins: 1, standardUsers: 0 });
  });

  it('returns a safe, newest-first top-five list and handles invalid limits', () => {
    const posts = [
      ...Array.from({ length: 6 }, (_, index) => ({ id: `p-${index}`, title: `Post ${index}`, createdAt: `2026-04-0${index + 1}T00:00:00.000Z` })),
      null,
    ];

    expect(getRecentPosts(posts).map((post) => post.id)).toEqual(['p-5', 'p-4', 'p-3', 'p-2', 'p-1']);
    expect(getRecentPosts(posts, 2).map((post) => post.id)).toEqual(['p-5', 'p-4']);
    expect(getRecentPosts(posts, -1)).toEqual([]);
    expect(getRecentPosts('not an array')).toEqual([]);
  });

  it('lists the built-in admin projection without exposing its password', () => {
    const users = getManagedUsers(storedUsers);

    expect(users).toHaveLength(3);
    expect(users[0]).toMatchObject({ id: 'admin', username: 'admin', role: 'admin', isDefault: true });
    expect(users[0]).not.toHaveProperty('password');
    expect(users.slice(1)).toEqual(storedUsers);
  });

  it('rejects missing fields, invalid roles, the reserved admin name and case-insensitive duplicates', () => {
    expect(validateManagedUser({})).toMatchObject({
      displayName: 'Display name is required.',
      username: 'Username is required.',
      password: 'Password is required.',
      role: 'Choose a valid account role.',
    });
    expect(validateManagedUser({ displayName: 'Admin', username: 'ADMIN', password: 'pw', role: 'user' }).username).toBe('That username is already taken.');
    expect(validateManagedUser({ displayName: 'Existing', username: 'MORGAN', password: 'pw', role: 'user' }, storedUsers).username).toBe('That username is already taken.');
    expect(validateManagedUser({ displayName: 'Ari', username: 'ari', password: 'pw', role: 'owner' }).role).toBe('Choose a valid account role.');
  });

  it('requires an administrator and persists a valid new admin account with a UUID and timestamp', () => {
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'new-admin-id') });
    vi.setSystemTime(new Date('2026-04-20T08:30:00.000Z'));

    expect(createManagedUser({ displayName: 'Morgan Admin', username: 'morgan', password: 'demo', role: 'admin' }, standardUser)).toEqual({ success: false, error: 'Administrator access is required.' });
    const result = createManagedUser({ displayName: '  Taylor Admin ', username: 'taylor', password: 'demo-pass', role: 'Admin' }, administrator);

    expect(result).toEqual({ success: true, user: {
      id: 'new-admin-id',
      displayName: 'Taylor Admin',
      username: 'taylor',
      password: 'demo-pass',
      role: 'admin',
      createdAt: '2026-04-20T08:30:00.000Z',
    } });
    expect(getUsers()).toEqual([result.user]);
  });

  it('does not persist invalid admin account creation requests', () => {
    const duplicate = createManagedUser({ displayName: 'Another Ari', username: 'ari', password: 'pw', role: 'user' }, administrator, storedUsers);
    const invalid = createManagedUser({ displayName: '', username: '', password: '', role: 'guest' }, administrator);

    expect(duplicate.success).toBe(false);
    expect(duplicate.errors.username).toBe('That username is already taken.');
    expect(invalid.success).toBe(false);
    expect(getUsers()).toEqual([]);
  });

  it('rejects unauthorized, default-admin, self, and missing-user deletion requests', () => {
    saveUsers(storedUsers);

    expect(deleteManagedUser('user-1', standardUser)).toEqual({ success: false, error: 'Administrator access is required.' });
    expect(deleteManagedUser('admin', administrator)).toEqual({ success: false, error: 'Default admin cannot be deleted.' });
    expect(deleteManagedUser('admin-2', { ...administrator, userId: 'admin-2' })).toEqual({ success: false, error: 'You cannot delete your own account.' });
    expect(deleteManagedUser('missing', administrator)).toEqual({ success: false, error: 'User not found.' });
    expect(getUsers()).toEqual(storedUsers);
  });

  it('removes another account after permission checks without deleting authored posts', () => {
    saveUsers(storedUsers);
    savePosts([authoredPost]);

    expect(deleteManagedUser('user-1', administrator)).toEqual({ success: true, user: storedUsers[0] });
    expect(getUsers()).toEqual([storedUsers[1]]);
    expect(getPosts()).toEqual([authoredPost]);
  });
});
