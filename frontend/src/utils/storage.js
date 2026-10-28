/** Provide resilient browser storage for local WriteSpace data. */

const STORAGE_KEYS = {
  posts: 'writespace_posts',
  users: 'writespace_users',
  session: 'writespace_session',
};

const memoryStore = {
  [STORAGE_KEYS.posts]: [],
  [STORAGE_KEYS.users]: [],
  [STORAGE_KEYS.session]: null,
};

let storageWarning = '';
const memoryOnlyKeys = new Set();

/** Record a visible warning when browser storage cannot be trusted. */
function warnStorage() {
  storageWarning = 'Browser storage is unavailable or contains invalid data. WriteSpace is using temporary in-memory data; changes may not persist after you leave this page.';
}

/** Read an array value from browser storage, falling back to memory.
 *
 * Args:
 *   key: Browser storage key for a posts or users array.
 */
function readArray(key) {
  if (memoryOnlyKeys.has(key)) {
    return memoryStore[key];
  }
  try {
    const rawValue = window.localStorage.getItem(key);
    if (rawValue === null) {
      return memoryStore[key];
    }

    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      warnStorage();
      memoryStore[key] = [];
      return memoryStore[key];
    }

    memoryStore[key] = parsedValue;
    return parsedValue;
  } catch (error) {
    warnStorage();
    return memoryStore[key];
  }
}

/** Read a session object from browser storage, falling back to memory. */
function readSession() {
  if (memoryOnlyKeys.has(STORAGE_KEYS.session)) {
    return memoryStore[STORAGE_KEYS.session];
  }
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEYS.session);
    if (rawValue === null) {
      return memoryStore[STORAGE_KEYS.session];
    }

    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
      warnStorage();
      memoryStore[STORAGE_KEYS.session] = null;
      return null;
    }

    memoryStore[STORAGE_KEYS.session] = parsedValue;
    return parsedValue;
  } catch (error) {
    warnStorage();
    return memoryStore[STORAGE_KEYS.session];
  }
}

/** Save a value to browser storage and retain it in memory if writing fails.
 *
 * Args:
 *   key: Browser storage key to update.
 *   value: Serializable value to save.
 */
function writeValue(key, value) {
  memoryStore[key] = value;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    memoryOnlyKeys.delete(key);
  } catch (error) {
    memoryOnlyKeys.add(key);
    warnStorage();
  }
}

/** Return locally stored posts as an array. */
export function getPosts() {
  return readArray(STORAGE_KEYS.posts);
}

/** Save locally authored posts, preserving an in-memory fallback on failure.
 *
 * Args:
 *   posts: Posts to save as an array.
 */
export function savePosts(posts) {
  if (!Array.isArray(posts)) {
    warnStorage();
    writeValue(STORAGE_KEYS.posts, []);
    return;
  }
  writeValue(STORAGE_KEYS.posts, posts);
}

/** Return locally stored users as an array. */
export function getUsers() {
  return readArray(STORAGE_KEYS.users);
}

/** Save local user records, preserving an in-memory fallback on failure.
 *
 * Args:
 *   users: User records to save as an array.
 */
export function saveUsers(users) {
  if (!Array.isArray(users)) {
    warnStorage();
    writeValue(STORAGE_KEYS.users, []);
    return;
  }
  writeValue(STORAGE_KEYS.users, users);
}

/** Return the current local session or null when signed out. */
export function getSession() {
  return readSession();
}

/** Save the current local session.
 *
 * Args:
 *   session: Session object to save, or null to clear it.
 */
export function setSession(session) {
  if (session !== null && (!session || typeof session !== 'object' || Array.isArray(session))) {
    warnStorage();
    writeValue(STORAGE_KEYS.session, null);
    return;
  }
  writeValue(STORAGE_KEYS.session, session);
}

/** Clear the current local session from storage and memory. */
export function clearSession() {
  memoryStore[STORAGE_KEYS.session] = null;
  memoryOnlyKeys.delete(STORAGE_KEYS.session);
  try {
    window.localStorage.removeItem(STORAGE_KEYS.session);
  } catch (error) {
    warnStorage();
  }
}

/** Return the warning that should be displayed to users, if any. */
export function getStorageWarning() {
  return storageWarning;
}
