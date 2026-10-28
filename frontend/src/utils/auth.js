import {
  clearSession,
  getSession,
  getUsers,
  setSession,
  saveUsers,
} from './storage.js';

// Demo contract: the built-in password is plain text and must never be used as a real credential.
export const DEFAULT_ADMIN = Object.freeze({
  id: 'admin',
  displayName: 'WriteSpace Administrator',
  username: 'admin',
  password: 'admin',
  role: 'admin',
  createdAt: '2026-03-04T12:00:00.000Z',
});

/** Return a role-appropriate route for an authenticated session.
 *
 * Args:
 *   session: Locally persisted session object.
 *
 * Returns:
 *   The administrator dashboard or standard reader route.
 */
export function getHomeRoute(session) {
  if (session?.role === 'admin') {
    return '/admin';
  }
  if (session?.role === 'user') {
    return '/blogs';
  }
  return '/login';
}

/** Normalize usernames for case-insensitive local account comparisons.
 *
 * Args:
 *   username: Candidate username.
 *
 * Returns:
 *   A trimmed lowercase username.
 */
export function normalizeUsername(username) {
  return typeof username === 'string' ? username.trim().toLocaleLowerCase('en-US') : '';
}

/** Validate login fields without exposing whether an account exists.
 *
 * Args:
 *   username: Submitted username.
 *   password: Submitted password.
 *
 * Returns:
 *   Field errors keyed by form field.
 */
export function validateLogin(username, password) {
  const errors = {};
  if (!normalizeUsername(username)) {
    errors.username = 'Username is required.';
  }
  if (typeof password !== 'string' || !password) {
    errors.password = 'Password is required.';
  }
  return errors;
}

/** Authenticate the built-in demo account or a locally registered user.
 *
 * Args:
 *   username: Submitted username.
 *   password: Submitted plain-text demo password.
 *
 * Returns:
 *   A success result with session, or a generic credential error.
 */
export function login(username, password) {
  const errors = validateLogin(username, password);
  if (Object.keys(errors).length) {
    return { success: false, errors };
  }

  const normalizedUsername = normalizeUsername(username);
  const account = normalizedUsername === DEFAULT_ADMIN.username
    ? DEFAULT_ADMIN
    : getUsers().find((user) => normalizeUsername(user?.username) === normalizedUsername);

  if (!account || account.password !== password) {
    return { success: false, error: 'Invalid username or password.' };
  }

  const session = {
    userId: account.id,
    username: account.username,
    displayName: account.displayName,
    role: String(account.role || '').toLowerCase() === 'admin' ? 'admin' : 'user',
  };
  setSession(session);
  return { success: true, session };
}

/** Validate registration fields and reject reserved or duplicate usernames.
 *
 * Args:
 *   form: Display name, username, password, and confirmation values.
 *   users: Saved users to check for case-insensitive collisions.
 *
 * Returns:
 *   Field errors keyed by form field.
 */
export function validateRegistration(form, users = getUsers()) {
  const errors = {};
  const displayName = typeof form?.displayName === 'string' ? form.displayName.trim() : '';
  const username = normalizeUsername(form?.username);
  const password = typeof form?.password === 'string' ? form.password : '';
  const confirmation = typeof form?.confirmPassword === 'string' ? form.confirmPassword : '';

  if (!displayName) {
    errors.displayName = 'Display name is required.';
  }
  if (!username) {
    errors.username = 'Username is required.';
  } else if (username === DEFAULT_ADMIN.username || users.some((user) => normalizeUsername(user?.username) === username)) {
    errors.username = 'That username is already taken.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  }
  if (!confirmation) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (password !== confirmation) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}

/** Create a standard local account and persist its browser-only session.
 *
 * Args:
 *   form: Registration form fields.
 *
 * Returns:
 *   The created user and session, or field errors without modifying storage.
 */
export function register(form) {
  const users = getUsers();
  const errors = validateRegistration(form, users);
  if (Object.keys(errors).length) {
    return { success: false, errors };
  }

  const user = {
    id: crypto.randomUUID(),
    displayName: form.displayName.trim(),
    username: form.username.trim(),
    password: form.password,
    role: 'user',
    createdAt: new Date().toISOString(),
  };
  saveUsers([...users, user]);
  const session = {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
  setSession(session);
  return { success: true, user, session };
}

/** End the local demo session and discard the active session value. */
export function logout() {
  clearSession();
}

/** Return the currently authenticated local session. */
export function getCurrentSession() {
  const session = getSession();
  if (!session || typeof session !== 'object' || Array.isArray(session)) {
    return null;
  }
  if (!['admin', 'user'].includes(session.role) || !session.userId || !session.username || !session.displayName) {
    clearSession();
    return null;
  }
  return session;
}


