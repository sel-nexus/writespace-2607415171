import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_ADMIN,
  getCurrentSession,
  getHomeRoute,
  login,
  logout,
  normalizeUsername,
  register,
  validateLogin,
  validateRegistration,
} from './auth.js';
import { clearSession, getSession, getUsers, saveUsers, setSession } from './storage.js';

/** Reset browser-local identity state before each utility behavior test. */
function resetIdentity() {
  localStorage.clear();
  saveUsers([]);
  clearSession();
}

describe('browser-local identity', () => {
  beforeEach(() => {
    resetIdentity();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('normalizes usernames consistently and rejects invalid login fields', () => {
    expect(normalizeUsername('  MiXeD  ')).toBe('mixed');
    expect(normalizeUsername(null)).toBe('');
    expect(validateLogin('', '')).toEqual({ username: 'Username is required.', password: 'Password is required.' });
  });

  it.each([
    ['null session', null],
    ['unsupported role', { role: 'owner' }],
  ])('returns the login fallback for %s', (_, session) => {
    expect(getHomeRoute(session)).toBe('/login');
  });

  it.each(['username', 'password'].flatMap((field) => [
    { field, kind: 'omitted', value: undefined },
    { field, kind: 'null', value: null },
    { field, kind: 'nonstring', value: 42 },
  ]))('rejects login with $kind $field without changing users or session', ({ field, kind, value }) => {
    const users = [{ id: 'user-1', displayName: 'Ari', username: 'ari', password: 'pw', role: 'user' }];
    const session = { userId: 'user-1', displayName: 'Ari', username: 'ari', role: 'user' };
    saveUsers(users);
    setSession(session);
    const form = { username: 'admin', password: 'admin' };
    if (kind === 'omitted') {
      delete form[field];
    } else {
      form[field] = value;
    }
    const errors = { [field]: field === 'username' ? 'Username is required.' : 'Password is required.' };

    expect(validateLogin(form.username, form.password)).toEqual(errors);
    expect(login(form.username, form.password)).toEqual({ success: false, errors });
    expect(getUsers()).toEqual(users);
    expect(getSession()).toEqual(session);
  });

  it.each(['displayName', 'username', 'password', 'confirmPassword'].flatMap((field) => [
    { field, kind: 'omitted', value: undefined },
    { field, kind: 'null', value: null },
    { field, kind: 'nonstring', value: 42 },
  ]))('rejects registration with $kind $field without changing users or session', ({ field, kind, value }) => {
    const users = [{ id: 'user-1', displayName: 'Ari', username: 'ari', password: 'pw', role: 'user' }];
    const session = { userId: 'user-1', displayName: 'Ari', username: 'ari', role: 'user' };
    saveUsers(users);
    setSession(session);
    const form = { displayName: 'Taylor', username: 'taylor', password: 'demo-pass', confirmPassword: 'demo-pass' };
    if (kind === 'omitted') {
      delete form[field];
    } else {
      form[field] = value;
    }
    const fieldErrors = {
      displayName: { displayName: 'Display name is required.' },
      username: { username: 'Username is required.' },
      password: { password: 'Password is required.', confirmPassword: 'Passwords do not match.' },
      confirmPassword: { confirmPassword: 'Please confirm your password.' },
    };

    expect(validateRegistration(form)).toEqual(fieldErrors[field]);
    expect(register(form)).toEqual({ success: false, errors: fieldErrors[field] });
    expect(getUsers()).toEqual(users);
    expect(getSession()).toEqual(session);
  });

  it('authenticates the built-in admin and persists its stable session identity', () => {
    const result = login('ADMIN', 'admin');

    expect(result.success).toBe(true);
    expect(result.session).toEqual({
      userId: 'admin',
      username: 'admin',
      displayName: 'WriteSpace Administrator',
      role: 'admin',
    });
    expect(getSession()).toEqual(result.session);
    expect(getHomeRoute(result.session)).toBe('/admin');
    expect(DEFAULT_ADMIN.id).toBe('admin');
  });

  it('authenticates a registered standard user and persists a user-home session', () => {
    saveUsers([{ id: 'user-1', displayName: 'Ari Reader', username: 'ari', password: 'plain-demo', role: 'user' }]);

    const result = login(' Ari ', 'plain-demo');

    expect(result).toMatchObject({ success: true, session: { userId: 'user-1', displayName: 'Ari Reader', role: 'user' } });
    expect(getCurrentSession()).toEqual(result.session);
    expect(getHomeRoute(result.session)).toBe('/blogs');
  });

  it('normalizes administrator-role values when authenticating locally managed admin accounts', () => {
    saveUsers([{ id: 'admin-2', displayName: 'Morgan Admin', username: 'morgan', password: 'local-demo', role: 'Admin' }]);

    const result = login('morgan', 'local-demo');

    expect(result.success).toBe(true);
    expect(result.session).toMatchObject({ userId: 'admin-2', role: 'admin' });
    expect(getHomeRoute(result.session)).toBe('/admin');
  });

  it('shows a generic error for unknown usernames or incorrect passwords without creating a session', () => {
    saveUsers([{ id: 'user-1', displayName: 'Ari Reader', username: 'ari', password: 'plain-demo', role: 'user' }]);

    expect(login('ari', 'wrong')).toEqual({ success: false, error: 'Invalid username or password.' });
    expect(login('missing', 'wrong')).toEqual({ success: false, error: 'Invalid username or password.' });
    expect(getSession()).toBeNull();
  });

  it('creates a standard user with UUID, timestamp, and a persisted session', () => {
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'user-uuid-1') });
    vi.setSystemTime(new Date('2026-04-15T10:30:00.000Z'));
    const result = register({ displayName: '  Ari Reader ', username: 'ari', password: 'demo-pass', confirmPassword: 'demo-pass' });

    expect(result.success).toBe(true);
    expect(result.user).toEqual({
      id: 'user-uuid-1',
      displayName: 'Ari Reader',
      username: 'ari',
      password: 'demo-pass',
      role: 'user',
      createdAt: '2026-04-15T10:30:00.000Z',
    });
    expect(getUsers()).toEqual([result.user]);
    expect(getSession()).toEqual(result.session);
    vi.useRealTimers();
  });

  it('rejects required fields, mismatched passwords, reserved names, and case-insensitive duplicates', () => {
    const missingFields = validateRegistration({});
    expect(missingFields).toMatchObject({
      displayName: 'Display name is required.',
      username: 'Username is required.',
      password: 'Password is required.',
      confirmPassword: 'Please confirm your password.',
    });

    const mismatched = validateRegistration({ displayName: 'Ari', username: 'ari', password: 'one', confirmPassword: 'two' });
    expect(mismatched.confirmPassword).toBe('Passwords do not match.');

    expect(validateRegistration({ displayName: 'Admin', username: 'ADMIN', password: 'x', confirmPassword: 'x' }).username).toBe('That username is already taken.');
    saveUsers([{ id: 'user-2', username: 'Riley', password: 'pw', role: 'user' }]);
    expect(validateRegistration({ displayName: 'Riley', username: ' rIlEy ', password: 'x', confirmPassword: 'x' }).username).toBe('That username is already taken.');
    expect(getUsers()).toHaveLength(1);
  });

  it('does not change stored users or session when registration is rejected', () => {
    saveUsers([{ id: 'user-1', username: 'ari', displayName: 'Ari Reader', password: 'pw', role: 'user' }]);
    const result = register({ displayName: 'Another Ari', username: 'ARI', password: 'pw', confirmPassword: 'pw' });

    expect(result.success).toBe(false);
    expect(result.errors.username).toBe('That username is already taken.');
    expect(getUsers()).toHaveLength(1);
    expect(getSession()).toBeNull();
  });

  it('fails closed for malformed sessions and clears sessions on logout', () => {
    setSession({ username: 'incomplete', role: 'admin' });
    expect(getCurrentSession()).toBeNull();
    expect(getSession()).toBeNull();

    setSession({ userId: 'user-1', username: 'ari', displayName: 'Ari', role: 'user' });
    logout();
    expect(getCurrentSession()).toBeNull();
    expect(getSession()).toBeNull();
  });
});
