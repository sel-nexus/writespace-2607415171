/** Verify the strict preference contract and storage failure fallbacks. */
import { getTheme, saveTheme, THEME_KEY } from './theme.js';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('getTheme', () => {
  it.each(['light', 'dark'])('reads the raw %s preference', (theme) => {
    localStorage.setItem(THEME_KEY, theme);
    expect(getTheme()).toBe(theme);
  });

  it('defaults to light for a missing preference', () => {
    expect(getTheme()).toBe('light');
  });

  it.each(['', 'Dark', 'system', ' dark ', 'null', '"dark"'])('rejects invalid saved value %j', (value) => {
    localStorage.setItem(THEME_KEY, value);
    expect(getTheme()).toBe('light');
  });

  it('defaults to light when reading storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(getTheme()).toBe('light');
  });

  it('defaults to light when the storage property is unavailable', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('denied'); });
    expect(getTheme()).toBe('light');
  });
});

describe('saveTheme', () => {
  it.each(['light', 'dark'])('saves only the raw %s value and leaves other keys unchanged', (theme) => {
    localStorage.setItem('writespace_session', 'session');
    localStorage.setItem('writespace_posts', '[]');
    expect(saveTheme(theme)).toBe(true);
    expect(localStorage.getItem(THEME_KEY)).toBe(theme);
    expect(localStorage.getItem('writespace_session')).toBe('session');
    expect(localStorage.getItem('writespace_posts')).toBe('[]');
    expect(localStorage.length).toBe(3);
  });

  it.each([undefined, null, false, 0, {}, [], '', 'system', 'Dark'])('rejects invalid input %j without writing', (value) => {
    localStorage.setItem(THEME_KEY, 'dark');
    expect(saveTheme(value)).toBe(false);
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    expect(localStorage.length).toBe(1);
  });

  it('returns false when a storage write throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    expect(saveTheme('dark')).toBe(false);
    expect(localStorage.getItem(THEME_KEY)).toBeNull();
  });

  it('returns false when accessing the storage property throws', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('denied'); });
    expect(saveTheme('light')).toBe(false);
  });
});
