/** Exercise the real root controller across navigation and identity changes. */
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';
import { clearSession, savePosts, saveUsers } from './utils/storage.js';

/** Mount the existing route tree without introducing another application shell. */
function mount(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

const session = { userId: 'writer', username: 'writer', displayName: 'Local Writer', role: 'user' };
const post = {
  id: 'story', title: 'Local story', content: 'Saved words', authorId: 'writer',
  authorName: 'Local Writer', createdAt: '2026-03-04T12:00:00.000Z',
};

beforeEach(() => {
  localStorage.clear();
  clearSession();
  savePosts([]);
  saveUsers([]);
  document.documentElement.className = 'inherited';
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.documentElement.className = '';
});

describe('root theme preference', () => {
  it.each([null, '', 'system', 'Dark', '"dark"'])('initializes light for absent or invalid preference %j', (value) => {
    if (value !== null) localStorage.setItem('writespace_theme', value);
    document.documentElement.classList.add('dark');
    mount();
    expect(document.documentElement).not.toHaveClass('dark');
    expect(document.documentElement).toHaveClass('inherited');
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toHaveAttribute('aria-pressed', 'false');
    expect(localStorage.getItem('writespace_theme')).toBe('light');
  });

  it.each(['light', 'dark'])('initializes the saved %s preference and preserves unrelated root classes', (theme) => {
    localStorage.setItem('writespace_theme', theme);
    mount();
    expect(document.documentElement.classList.contains('dark')).toBe(theme === 'dark');
    expect(document.documentElement).toHaveClass('inherited');
    expect(localStorage.getItem('writespace_theme')).toBe(theme);
  });

  it('supports Tab focus, Enter and Space with immediate class and persistence updates', async () => {
    const user = userEvent.setup();
    mount();
    await user.tab();
    await user.tab();
    const toggle = screen.getByRole('button', { name: 'Switch to dark mode' });
    expect(toggle).toHaveFocus();
    expect(toggle.className).toContain('focus-visible:outline-2');
    expect(toggle.className).toContain('dark:focus-visible:outline-indigo-300');
    await user.keyboard('{Enter}');
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('writespace_theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toHaveFocus();
    await user.keyboard(' ');
    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('writespace_theme')).toBe('light');
  });

  it('rehydrates the persisted choice on a fresh root mount', async () => {
    const user = userEvent.setup();
    const view = mount();
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    view.unmount();
    document.documentElement.classList.remove('dark');
    mount();
    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
  });

  it('remains usable when reads fail and never consults the operating-system preference', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked read'); });
    const matchMedia = vi.fn();
    vi.stubGlobal('matchMedia', matchMedia);
    const user = userEvent.setup();
    mount();
    expect(document.documentElement).not.toHaveClass('dark');
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(document.documentElement).toHaveClass('dark');
    expect(matchMedia).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('updates the visible theme in both directions when writes fail', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
    expect(localStorage.getItem('writespace_theme')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('defaults safely and toggles when accessing localStorage itself throws', async () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('denied'); });
    const user = userEvent.setup();
    mount();
    expect(document.documentElement).not.toHaveClass('dark');
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(document.documentElement).toHaveClass('dark');
    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('persists across login, mobile-menu interaction, logout and a different identity', async () => {
    const user = userEvent.setup();
    localStorage.setItem('writespace_posts', JSON.stringify([post]));
    mount();
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    await user.click(within(screen.getByRole('navigation', { name: 'Main navigation' })).getByRole('link', { name: 'Login' }));
    await user.type(screen.getByLabelText('Username'), 'admin');
    await user.type(screen.getByLabelText('Password'), 'admin');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    expect(screen.getByRole('heading', { name: 'Community overview' })).toBeInTheDocument();
    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getAllByRole('navigation', { name: 'Authenticated navigation' })).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(screen.getByRole('button', { name: 'Close navigation menu' })).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(document.documentElement).not.toHaveClass('dark');
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    await user.click(screen.getByRole('button', { name: 'Logout' }));
    expect(localStorage.getItem('writespace_session')).toBeNull();
    expect(localStorage.getItem('writespace_theme')).toBe('dark');
    expect(JSON.parse(localStorage.getItem('writespace_posts'))).toEqual([post]);
    expect(screen.getAllByRole('navigation', { name: 'Main navigation' })).toHaveLength(1);
    cleanup();
    localStorage.setItem('writespace_session', JSON.stringify(session));
    mount('/blogs');
    expect(screen.getByText('Local Writer')).toBeInTheDocument();
    expect(document.documentElement).toHaveClass('dark');
  });

  it.each(['/blogs', '/blog/story', '/blog/missing', '/write', '/edit/story', '/edit/missing', '/admin', '/users'])(
    'forwards one functional theme toggle through the page-owned navigation at %s', async (path) => {
      localStorage.setItem('writespace_session', JSON.stringify({ ...session, userId: 'admin', role: 'admin' }));
      localStorage.setItem('writespace_posts', JSON.stringify([post]));
      const user = userEvent.setup();
      mount(path);
      expect(screen.getAllByRole('navigation', { name: 'Authenticated navigation' })).toHaveLength(1);
      expect(screen.queryByRole('navigation', { name: 'Main navigation' })).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
      expect(document.documentElement).toHaveClass('dark');
      expect(localStorage.getItem('writespace_theme')).toBe('dark');
      expect(JSON.parse(localStorage.getItem('writespace_session')).role).toBe('admin');
      expect(JSON.parse(localStorage.getItem('writespace_posts'))).toEqual([post]);
    },
  );

  it('preserves guest route protection and the selected preference', () => {
    localStorage.setItem('writespace_theme', 'dark');
    mount('/users');
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('writespace_session')).toBeNull();
  });
});
