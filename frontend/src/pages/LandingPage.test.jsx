import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.jsx';
import {
  clearSession,
  savePosts,
  saveUsers,
  setSession,
} from '../utils/storage.js';

const browserStorage = window.localStorage;

/** Render the application at a chosen route for a user-visible test. */
function renderApp(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>,
  );
}

/** Prepare isolated browser-local state before each home-page test. */
function resetBrowserData() {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: browserStorage,
  });
  browserStorage.clear();
  savePosts([]);
  saveUsers([]);
  clearSession();
}

describe('WriteSpace public home', () => {
  beforeEach(() => {
    resetBrowserData();
  });

  it('shows the public introduction, guest links, feature explanations, and empty message', () => {
    const { container } = renderApp();

    expect(container.firstChild).toHaveClass('bg-[#fbfaf7]');
    expect(container.querySelector('section[aria-labelledby="hero-title"]')).toHaveClass('min-h-[100dvh]');
    expect(screen.getByRole('link', { name: 'WriteSpace home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('heading', { name: 'WriteSpace' })).toBeInTheDocument();
    expect(screen.getByText('Your thoughts. Your space. Beautifully simple.')).toBeInTheDocument();
    expect(screen.getByText('Your posts are stored only in this browser, not shared across devices.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start reading' })).toHaveAttribute('href', '/login');
    expect(screen.getAllByRole('link', { name: 'Get started' })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: 'Get started' }).every((link) => link.getAttribute('href') === '/register')).toBe(true);
    expect(screen.getByRole('heading', { name: 'Space for the words that matter.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Write Freely' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Private & Local' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Instant & Fast' })).toBeInTheDocument();
    expect(screen.getByText('No posts yet - check back soon!')).toBeInTheDocument();
    const footer = screen.getByRole('navigation', { name: 'Footer navigation' });
    expect(footer).toHaveTextContent('Home');
    expect(footer).toHaveTextContent('All Blogs');
    expect(footer).toHaveTextContent('Login');
    expect(footer).toHaveTextContent('Register');
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()} WriteSpace`))).toBeInTheDocument();
  });

  it('shows at most the three newest local posts with working story links', () => {
    savePosts([
      { id: 'older', title: 'Older story', createdAt: '2022-01-01', excerpt: 'An older idea.' },
      { id: 'newest', title: 'Newest story', createdAt: '2025-04-01', excerpt: 'A fresh idea.' },
      { id: 'middle', title: 'Middle story', createdAt: '2024-02-01', excerpt: 'A thoughtful idea.' },
      { id: 'second-newest', title: 'Second newest', createdAt: '2025-02-01', excerpt: 'A recent idea.' },
    ]);
    renderApp();

    const latest = screen.getByRole('heading', { name: 'Latest writing' }).closest('section');
    const storyLinks = within(latest).getAllByRole('link');
    expect(storyLinks).toHaveLength(6);
    expect(storyLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/blog/newest', '/blog/newest', '/blog/second-newest', '/blog/second-newest', '/blog/middle', '/blog/middle',
    ]);
    expect(within(latest).getByRole('link', { name: 'Newest story' })).toHaveAttribute('href', '/blog/newest');
    expect(within(latest).getByRole('link', { name: 'Second newest' })).toHaveAttribute('href', '/blog/second-newest');
    expect(within(latest).getByRole('link', { name: 'Middle story' })).toHaveAttribute('href', '/blog/middle');
    expect(within(latest).queryByRole('link', { name: 'Older story' })).not.toBeInTheDocument();
    expect(within(latest).getByText('A fresh idea.')).toBeInTheDocument();
  });

  it('handles malformed post data as an empty preview and explains the fallback', () => {
    window.localStorage.setItem('writespace_posts', '{not valid json');
    renderApp();

    expect(screen.getByText('No posts yet - check back soon!')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/temporary in-memory data/i);
  });

  it('keeps rendering with a visible warning when browser storage access is denied', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('Storage access denied');
      },
    });
    renderApp();

    expect(screen.getByRole('heading', { name: 'WriteSpace' })).toBeInTheDocument();
    expect(screen.getByText('Your thoughts. Your space. Beautifully simple.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/changes may not persist/i);
  });

  it('uses the admin dashboard destination for signed-in administrators', () => {
    setSession({ user: { name: 'Avery Admin', role: 'admin' } });
    renderApp();

    expect(screen.getByText('Avery Admin')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/admin');
    expect(screen.getByRole('link', { name: 'Start reading' })).toHaveAttribute('href', '/blogs');
    expect(screen.queryByRole('link', { name: 'Get started' })).not.toBeInTheDocument();
  });

  it('retains post data in memory and displays a warning when a storage write fails', () => {
    const setItem = vi.spyOn(browserStorage, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
    savePosts([{ id: 'memory', title: 'Memory-backed story', excerpt: 'Still available locally.' }]);
    setItem.mockRestore();
    renderApp();

    expect(screen.getByRole('link', { name: 'Memory-backed story' })).toHaveAttribute('href', '/blog/memory');
    expect(screen.getByRole('status')).toHaveTextContent(/temporary in-memory data/i);
  });

  it('uses the reader dashboard destination for signed-in users', () => {
    setSession({ user: { name: 'Riley Reader', role: 'user' } });
    renderApp();

    expect(screen.getByText('Riley Reader')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/blogs');
    expect(screen.getByRole('link', { name: 'Start reading' })).toHaveAttribute('href', '/blogs');
  });

  it('routes guest calls to action to their named destinations', () => {
    renderApp();

    expect(screen.getByRole('link', { name: 'Start reading' })).toHaveAttribute('href', '/login');
    expect(screen.getAllByRole('link', { name: 'Get started' }).every((link) => link.getAttribute('href') === '/register')).toBe(true);
  });
});
