import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.jsx';
import { clearSession, savePosts, saveUsers, setSession } from '../utils/storage.js';

/** Display the current route for deterministic client navigation assertions. */
function RouteProbe() {
  const location = useLocation();
  return <p aria-label="Current route" className="sr-only">{location.pathname}</p>;
}

/** Render the application at a selected route for reading behavior tests. */
function renderRoute(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <RouteProbe />
    </MemoryRouter>,
  );
}

const ownPost = {
  id: 'own-post',
  title: 'A story of my own',
  content: 'First line\n\nSecond line, kept separate.',
  createdAt: '2026-04-03T12:00:00.000Z',
  authorId: 'user-1',
  authorName: 'Ari Reader',
};

const otherPost = {
  id: 'other-post',
  title: 'Another writer’s view',
  content: 'A different perspective.',
  createdAt: '2026-03-10T12:00:00.000Z',
  authorId: 'user-2',
  authorName: 'Riley Writer',
};

/** Establish local posts, users and a session before each reading test. */
function resetReaderState() {
  localStorage.clear();
  saveUsers([
    { id: 'user-1', displayName: 'Ari Reader', username: 'ari', password: 'demo', role: 'user' },
    { id: 'user-2', displayName: 'Riley Writer', username: 'riley', password: 'demo', role: 'user' },
  ]);
  savePosts([ownPost, otherPost]);
  setSession({ userId: 'user-1', username: 'ari', displayName: 'Ari Reader', role: 'user' });
}

describe('authenticated blog reading', () => {
  beforeEach(() => {
    resetReaderState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects guests from the blog list to login', () => {
    clearSession();
    renderRoute('/blogs');

    expect(screen.getByLabelText('Current route')).toHaveTextContent('/login');
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });

  it('redirects a standard user away from the administrator route to their blog home', () => {
    renderRoute('/admin');

    expect(screen.getByLabelText('Current route')).toHaveTextContent('/blogs');
    expect(screen.getByRole('heading', { name: 'All Blogs' })).toBeInTheDocument();
  });

  it('lists local posts newest first with author, date, excerpt, and owner-only edit link', () => {
    savePosts([otherPost, ownPost]);
    renderRoute('/blogs');

    const postCards = screen.getByRole('region', { name: 'All posts' });
    const titles = within(postCards).getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
    expect(titles).toEqual(['A story of my own', 'Another writer’s view']);
    expect(within(postCards).getByText(/Apr 03, 2026/)).toBeInTheDocument();
    expect(within(postCards).getByText(/Ari Reader/)).toBeInTheDocument();
    const ownCard = within(postCards).getByRole('heading', { name: 'A story of my own' }).closest('article');
    expect(ownCard).toHaveTextContent(/First line\s+Second line, kept separate\./);
    expect(within(postCards).getByRole('link', { name: 'Edit A story of my own' })).toHaveAttribute('href', '/edit/own-post');
    expect(within(postCards).queryByRole('link', { name: 'Edit Another writer’s view' })).not.toBeInTheDocument();
  });

  it('opens the mobile navigation menu and exposes authenticated page links', async () => {
    const user = userEvent.setup();
    renderRoute('/blogs');

    const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    await user.click(menuButton);
    expect(screen.getByRole('button', { name: 'Close navigation menu' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('link', { name: 'All Blogs' })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: 'Write' })).toHaveLength(2);
  });

  it('shows the useful empty state and write action when there are no posts', () => {
    savePosts([]);
    renderRoute('/blogs');

    expect(screen.getByRole('heading', { name: 'No blogs yet. Be the first to write one!' })).toBeInTheDocument();
    const emptyState = screen.getByRole('heading', { name: 'No blogs yet. Be the first to write one!' }).closest('section');
    expect(within(emptyState).getByRole('link', { name: 'Write a post' })).toHaveAttribute('href', '/write');
  });

  it('renders full whitespace-preserving content and hides controls on another author’s post', () => {
    renderRoute('/blog/other-post');

    expect(screen.getByRole('heading', { name: 'Another writer’s view' })).toBeInTheDocument();
    const body = screen.getByText('A different perspective.');
    expect(body).toHaveClass('whitespace-pre-wrap');
    expect(screen.getByText('Riley Writer')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Back to All Posts' })).toHaveLength(2);
  });

  it('shows a not-found message and a list back link for a missing post id', () => {
    renderRoute('/blog/missing');

    expect(screen.getByRole('heading', { name: 'Post not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to All Posts' })).toHaveAttribute('href', '/blogs');
  });

  it('allows the owner to cancel deletion or confirm it and returns to the list', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderRoute('/blog/own-post');

    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/edit/own-post');
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(confirm).toHaveBeenCalledWith('Delete this post? This action cannot be undone.');
    expect(JSON.parse(localStorage.getItem('writespace_posts'))).toHaveLength(2);

    confirm.mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(JSON.parse(localStorage.getItem('writespace_posts'))).toEqual([otherPost]);
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/blogs');
  });

  it('allows an administrator to manage another user’s post', () => {
    setSession({ userId: 'admin', username: 'admin', displayName: 'WriteSpace Administrator', role: 'admin' });
    renderRoute('/blog/other-post');

    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/edit/other-post');
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });
});
