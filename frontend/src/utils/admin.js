import { DEFAULT_ADMIN } from './auth.js';
import { getPosts, getUsers, saveUsers } from './storage.js';
import { normalizeUsername } from './auth.js';

/** Count stored accounts and local posts for the admin dashboard.
 *
 * Args:
 *   posts: Locally saved posts, defaulting to browser storage.
 *   users: Registered accounts, defaulting to browser storage.
 *
 * Returns:
 *   Distinct post, registered-account, admin, and standard-user totals.
 */
export function getAdminMetrics(posts = getPosts(), users = getUsers()) {
  const safePosts = Array.isArray(posts) ? posts.filter((post) => post && typeof post === 'object') : [];
  const safeUsers = Array.isArray(users) ? users.filter((user) => user && typeof user === 'object') : [];
  const admins = safeUsers.filter((user) => String(user.role || '').toLowerCase() === 'admin').length;
  const standardUsers = safeUsers.filter((user) => String(user.role || '').toLowerCase() === 'user').length;

  return {
    totalPosts: safePosts.length,
    totalUsers: safeUsers.length,
    totalAdmins: admins + 1,
    standardUsers,
  };
}

/** Return the newest valid posts up to the requested display limit.
 *
 * Args:
 *   posts: Candidate post records.
 *   limit: Maximum number of records to return.
 *
 * Returns:
 *   Posts ordered newest first.
 */
export function getRecentPosts(posts, limit = 5) {
  if (!Array.isArray(posts) || !Number.isInteger(limit) || limit < 0) {
    return [];
  }
  return posts
    .filter((post) => post && typeof post === 'object' && post.id !== undefined && post.id !== null)
    .slice()
    .sort((first, second) => (Date.parse(second.createdAt || '') || 0) - (Date.parse(first.createdAt || '') || 0))
    .slice(0, limit);
}

/** Build a safe display list that includes the indelible built-in admin.
 *
 * Args:
 *   users: Saved accounts, defaulting to browser storage.
 *
 * Returns:
 *   A default-admin projection followed by saved accounts.
 */
export function getManagedUsers(users = getUsers()) {
  const safeUsers = Array.isArray(users) ? users.filter((user) => user && typeof user === 'object') : [];
  const { id, username, displayName, role, createdAt } = DEFAULT_ADMIN;
  return [{ id, username, displayName, role, createdAt, isDefault: true }, ...safeUsers];
}

/** Validate account fields and enforce a unique username and supported role.
 *
 * Args:
 *   form: Candidate display name, username, password, and role.
 *   users: Saved accounts to check for duplicate names.
 *
 * Returns:
 *   Field errors keyed by form field.
 */
export function validateManagedUser(form, users = getUsers()) {
  const errors = {};
  const displayName = typeof form?.displayName === 'string' ? form.displayName.trim() : '';
  const username = normalizeUsername(form?.username);
  const password = typeof form?.password === 'string' ? form.password : '';
  const role = typeof form?.role === 'string' ? form.role.trim().toLowerCase() : '';
  const safeUsers = Array.isArray(users) ? users : [];

  if (!displayName) {
    errors.displayName = 'Display name is required.';
  }
  if (!username) {
    errors.username = 'Username is required.';
  } else if (username === normalizeUsername(DEFAULT_ADMIN.username) || safeUsers.some((user) => normalizeUsername(user?.username) === username)) {
    errors.username = 'That username is already taken.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  }
  if (!['admin', 'user'].includes(role)) {
    errors.role = 'Choose a valid account role.';
  }
  return errors;
}

/** Create a browser-local admin or standard account for an administrator.
 *
 * Args:
 *   form: Display name, username, plain-text demo password and role.
 *   session: Current local session that must have admin role.
 *   users: Existing account records, defaulting to browser storage.
 *
 * Returns:
 *   The created account or validation/authorization errors.
 */
export function createManagedUser(form, session, users = getUsers()) {
  if (session?.role !== 'admin') {
    return { success: false, error: 'Administrator access is required.' };
  }
  const errors = validateManagedUser(form, users);
  if (Object.keys(errors).length) {
    return { success: false, errors };
  }

  // Passwords remain unencrypted because this application is a local demo only.
  const user = {
    id: crypto.randomUUID(),
    displayName: form.displayName.trim(),
    username: form.username.trim(),
    password: form.password,
    role: form.role.toLowerCase(),
    createdAt: new Date().toISOString(),
  };
  saveUsers([...users, user]);
  return { success: true, user };
}

/** Remove a saved account without touching posts authored by that account.
 *
 * Args:
 *   userId: Id of the registered account to remove.
 *   session: Current session that must be an administrator.
 *   users: Saved account records, defaulting to browser storage.
 *
 * Returns:
 *   The removed account or a safe missing/default/self/authorization error.
 */
export function deleteManagedUser(userId, session, users = getUsers()) {
  if (session?.role !== 'admin') {
    return { success: false, error: 'Administrator access is required.' };
  }
  if (userId === DEFAULT_ADMIN.id) {
    return { success: false, error: 'Default admin cannot be deleted.' };
  }
  if (userId === session.userId) {
    return { success: false, error: 'You cannot delete your own account.' };
  }
  const user = users.find((savedUser) => String(savedUser?.id) === String(userId));
  if (!user) {
    return { success: false, error: 'User not found.' };
  }

  saveUsers(users.filter((savedUser) => String(savedUser?.id) !== String(userId)));
  return { success: true, user };
}
