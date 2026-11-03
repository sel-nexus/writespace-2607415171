/** Read and persist a browser-local preference independently of identity. */
export const THEME_KEY = 'writespace_theme';

/** Read a valid saved preference, falling back to light when storage is blocked.
 *
 * Returns:
 *   The raw light or dark preference; never throws for unavailable storage.
 */
export function getTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/** Persist only valid raw preferences without interrupting the visible theme.
 *
 * Args:
 *   theme: Candidate light or dark preference.
 * Returns:
 *   Whether the preference was saved; false for invalid input or blocked storage.
 */
export function saveTheme(theme) {
  if (theme !== 'light' && theme !== 'dark') {
    return false;
  }
  try {
    window.localStorage.setItem(THEME_KEY, theme);
    return true;
  } catch {
    return false;
  }
}
