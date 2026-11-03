import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.jsx';
import { getPosts, getUsers, savePosts, saveUsers, setSession } from '../utils/storage.js';

/** Expose the current route for protected page redirect assertions. */
function RouteProbe() {
  const location = useLocation();
  return (
    <p aria-label="Current route" className="sr-only">
      {location.pathname}
    </p>
  );
}

/** Render WriteSpace at a requested route and expose its current path. */
function renderRoute(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <RouteProbe />
    </MemoryRouter>,
  );
}

const administrator = { userId: 'admin', username: 'admin', displayName: 'WriteSpace Administrator', role: 'admin' };
const reader = { userId: 'reader-1', username: 'ari', displayName: 'Ari Reader', role: 'user' };

/** Prepare an admin session and local demo entities for each page test. */
function resetAdminState() {
  localStorage.clear();
  setSession(administrator);
  saveUsers([
    { id: 'reader-1', username: 'ari', displayName: 'Ari Reader', password: 'demo', role: 'user', createdAt: '2026-02-01T12:00:00.000Z' },
    { id: 'admin-2', username: 'morgan', displayName: 'Morgan Admin', password: 'demo', role: 'admin', createdAt: '2026-02-02T12:00:00.000Z' },
    { id: 'reader-2', username: 'riley', displayName: 'Riley Writer', password: 'demo', role: 'user', createdAt: '2026-02-03T12:00:00.000Z' },
  ]);
  savePosts(Array.from({ length: 6 }, (_, index) => ({
    id: `post-${index + 1}`,
    title: `Post ${index + 1}`,
    content: `Body for post ${index + 1}`,
    createdAt: `2026-04-0${index + 1}T12:00:00.000Z`,
    authorId: index % 2 ? 'reader-1' : 'reader-2',
    authorName: index % 2 ? 'Ari Reader' : 'Riley Writer',
  })));
}

describe.each(['light', 'dark'])('administrator pages in %s mode', (theme) => {
  beforeEach(() => {
    resetAdminState();
    localStorage.setItem('writespace_theme', theme);
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows the four distinct metric counts and at most the five newest posts', () => {
    renderRoute('/admin');

    expect(screen.getByRole('heading', { name: 'Community overview' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Total Posts' }).parentElement).toHaveTextContent('6');
    expect(screen.getByRole('heading', { name: 'Total Users' }).parentElement).toHaveTextContent('3');
    expect(screen.getByRole('heading', { name: 'Total Admins' }).parentElement).toHaveTextContent('2');
    expect(screen.getByRole('heading', { name: 'Total users' }).parentElement).toHaveTextContent('2');
    const recentPosts = screen.getByRole('region', { name: 'Recent posts' });
    expect(within(recentPosts).getAllByRole('article')).toHaveLength(5);
    expect(within(recentPosts).getByRole('link', { name: 'Post 6' })).toHaveAttribute('href', '/blog/post-6');
    expect(within(recentPosts).queryByRole('link', { name: 'Post 1' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Write New Post' })).toHaveAttribute('href', '/write');
    expect(screen.getByRole('link', { name: 'Manage Users' })).toHaveAttribute('href', '/users');
  });

  it('confirms removal of a recent post and updates the dashboard and saved posts', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderRoute('/admin');

    const recentPosts = screen.getByRole('region', { name: 'Recent posts' });
    await user.click(within(recentPosts).getAllByRole('button', { name: 'Delete' })[0]);
    expect(confirm).toHaveBeenCalledWith('Delete “Post 6”? This action cannot be undone.');
    expect(getPosts().map((post) => post.id)).not.toContain('post-6');
    expect(within(screen.getByRole('region', { name: 'Recent posts' })).queryByRole('link', { name: 'Post 6' })).not.toBeInTheDocument();
  });

  it('creates a unique admin account and reports the result visibly', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'admin-new-uuid') });
    renderRoute('/users');

    await user.type(screen.getByLabelText('Display Name'), 'Taylor Admin');
    await user.type(screen.getByLabelText('Username'), 'taylor');
    await user.type(screen.getByLabelText('Password'), 'plain-demo');
    await user.selectOptions(screen.getByLabelText('Role'), 'admin');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(getUsers()).toContainEqual(expect.objectContaining({ id: 'admin-new-uuid', displayName: 'Taylor Admin', username: 'taylor', role: 'admin' }));
    expect(screen.getByRole('status')).toHaveTextContent('Taylor Admin was added as an admin.');
  });

  it('rejects duplicate usernames without changing saved account data', async () => {
    const user = userEvent.setup();
    renderRoute('/users');
    const usersBefore = getUsers();
    await user.type(screen.getByLabelText('Display Name'), 'Another Ari');
    await user.type(screen.getByLabelText('Username'), 'ARI');
    await user.type(screen.getByLabelText('Password'), 'plain-demo');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByText('That username is already taken.')).toBeInTheDocument();
    expect(getUsers()).toEqual(usersBefore);
  });

  it('displays script- and image-like account values as inert React text', () => {
    const displayName = '<img src=x onerror="window.compromised = true">';
    const username = '<script>window.compromised = true;</script>';
    saveUsers([...getUsers(), {
      id: 'markup-user',
      displayName,
      username,
      password: 'demo',
      role: 'user',
      createdAt: '2026-02-04T12:00:00.000Z',
    }]);

    const { container } = renderRoute('/users');

    expect(screen.getAllByText(displayName, { exact: true })).toHaveLength(2);
    expect(screen.getAllByText(`@${username}`, { exact: true })).toHaveLength(2);
    expect(container.querySelector('img[src="x"], script')).toBeNull();
    expect(window.compromised).toBeUndefined();
    expect(getUsers().at(-1)).toMatchObject({ id: 'markup-user', displayName, username });
  });

  it('accepts and saves reasonable long account input through the administrator form', async () => {
    const user = userEvent.setup();
    const displayName = 'Taylor Longname '.repeat(20).trim();
    const username = `reader${'x'.repeat(120)}`;
    const password = 'long-demo-password-'.repeat(8);
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'long-form-user') });
    renderRoute('/users');

    fireEvent.change(screen.getByLabelText('Display Name'), { target: { value: displayName } });
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: username } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(getUsers()).toContainEqual(expect.objectContaining({
      id: 'long-form-user', displayName, username, password, role: 'user',
    }));
    expect(screen.getByRole('status')).toHaveTextContent(`${displayName} was added as a user.`);
  });

  it('disables default-admin and self-delete, while confirmed deletion preserves authored posts', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const authored = { id: 'riley-post', title: 'Riley post', content: 'Keep me', authorId: 'reader-2', authorName: 'Riley Writer' };
    setSession({ userId: 'admin-2', username: 'morgan', displayName: 'Morgan Admin', role: 'admin' });
    savePosts([authored]);
    renderRoute('/users');

    const defaultAdminButtons = screen.getAllByRole('button', { name: 'Delete WriteSpace Administrator' });
    const selfDeleteButtons = screen.getAllByRole('button', { name: 'Delete Morgan Admin' });
    expect(defaultAdminButtons).toHaveLength(2);
    expect(defaultAdminButtons.every((button) => button.disabled)).toBe(true);
    expect(selfDeleteButtons).toHaveLength(2);
    expect(selfDeleteButtons.every((button) => button.disabled)).toBe(true);
    await user.click(screen.getAllByRole('button', { name: 'Delete Riley Writer' })[0]);

    expect(confirm).toHaveBeenCalledWith('Delete Riley Writer? Authored posts will remain in this browser.');
    expect(getUsers().map((savedUser) => savedUser.id)).toEqual(['reader-1', 'admin-2']);
    expect(getPosts()).toEqual([authored]);
    expect(screen.getByRole('status')).toHaveTextContent('Their posts remain saved.');
  });

  it('associates required-field errors and clears feedback without changing saved users', async () => {
    const user = userEvent.setup();
    renderRoute('/users');
    const usersBefore = getUsers();
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    for (const [label, id, message] of [
      ['Display Name', 'admin-display-name-error', 'Display name is required.'],
      ['Username', 'admin-username-error', 'Username is required.'],
      ['Password', 'admin-password-error', 'Password is required.'],
    ]) {
      expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText(label)).toHaveAttribute('aria-describedby', id);
      expect(screen.getByText(message)).toHaveAttribute('role', 'alert');
      expect(screen.getByText(message)).toHaveClass('dark:text-red-300');
    }
    expect(getUsers()).toEqual(usersBefore);
    await user.type(screen.getByLabelText('Display Name'), 'Valid name');
    expect(screen.queryByText('Display name is required.')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Display Name')).toHaveAttribute('aria-invalid', 'false');
    expect(getUsers()).toEqual(usersBefore);
  });

  it('keeps form, table, mobile cards and safeguards themed while toggling appearance', async () => {
    const user = userEvent.setup();
    setSession({ userId: 'admin-2', username: 'morgan', displayName: 'Morgan Admin', role: 'admin' });
    const { container } = renderRoute('/users');
    const accounts = screen.getByRole('region', { name: 'Accounts' });
    expect(container.firstChild).toHaveClass('dark:bg-slate-950', 'dark:text-slate-100');
    expect(screen.getByRole('region', { name: 'Add an account' })).toHaveClass('dark:bg-slate-900');
    for (const label of ['Display Name', 'Username', 'Password', 'Role']) {
      expect(screen.getByLabelText(label)).toHaveClass('dark:bg-slate-800', 'dark:text-slate-100');
    }
    expect(within(accounts).getByRole('table').parentElement).toHaveClass('dark:bg-slate-900');
    expect(within(accounts).getAllByRole('article')).toHaveLength(4);
    for (const card of within(accounts).getAllByRole('article')) {
      expect(card).toHaveClass('dark:bg-slate-900', 'dark:border-slate-700');
    }
    for (const button of screen.getAllByRole('button', { name: 'Delete Morgan Admin' })) {
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('title', 'You cannot delete your own account.');
      expect(button).toHaveClass('dark:text-red-300');
    }
    await user.type(screen.getByLabelText('Username'), 'unfinished');
    await user.click(screen.getByRole('button', { name: `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode` }));
    expect(screen.getByLabelText('Username')).toHaveValue('unfinished');
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/users');
    expect(localStorage.getItem('writespace_theme')).toBe(theme === 'dark' ? 'light' : 'dark');
  });

  it('cancels account and post deletion without changing storage and re-reads retained data', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const usersBefore = getUsers();
    const postsBefore = getPosts();
    const view = renderRoute('/users');
    await user.click(screen.getAllByRole('button', { name: 'Delete Riley Writer' })[0]);
    expect(getUsers()).toEqual(usersBefore);
    expect(getPosts()).toEqual(postsBefore);
    expect(screen.getAllByText('Riley Writer')).toHaveLength(2);
    view.unmount();
    const dashboard = renderRoute('/admin');
    await user.click(within(screen.getByRole('region', { name: 'Recent posts' })).getAllByRole('button', { name: 'Delete' })[0]);
    expect(getPosts()).toEqual(postsBefore);
    dashboard.unmount();
    renderRoute('/admin');
    expect(screen.getByRole('link', { name: 'Post 6' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Total Posts' }).parentElement).toHaveTextContent('6');
  });

  it('re-reads a created standard account after remount and keeps the dashboard empty state readable', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'new-reader') });
    const view = renderRoute('/users');
    await user.type(screen.getByLabelText('Display Name'), 'New Reader');
    await user.type(screen.getByLabelText('Username'), 'newreader');
    await user.type(screen.getByLabelText('Password'), 'demo-only');
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(getUsers()).toContainEqual(expect.objectContaining({ id: 'new-reader', role: 'user' }));
    expect(screen.getByLabelText('Display Name')).toHaveValue('');
    expect(screen.getByRole('status')).toHaveClass('dark:text-emerald-200');
    view.unmount();
    const remount = renderRoute('/users');
    expect(screen.getAllByText('New Reader')).toHaveLength(2);
    remount.unmount();
    savePosts([]);
    renderRoute('/admin');
    expect(screen.getByText('No posts yet. Create a post to start the community.')).toHaveClass('dark:bg-slate-900/70', 'dark:text-slate-300');
    expect(screen.getByRole('heading', { name: 'Total Posts' }).parentElement).toHaveTextContent('0');
  });

  it('denies account management to a standard user', () => {
    setSession(reader);
    renderRoute('/users');

    expect(screen.getByLabelText('Current route')).toHaveTextContent('/blogs');
    expect(screen.getByRole('heading', { name: 'All Blogs' })).toBeInTheDocument();
  });
});
