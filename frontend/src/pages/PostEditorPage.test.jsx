import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.jsx';
import { getPosts, savePosts, setSession } from '../utils/storage.js';

/** Display route changes in an accessible test-only node. */
function RouteProbe() {
  const location = useLocation();
  return <p aria-label="Current route" className="sr-only">{location.pathname}</p>;
}

/** Render a local writer route with the app and a route probe. */
function renderRoute(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <RouteProbe />
    </MemoryRouter>,
  );
}

const authorSession = { userId: 'writer-1', username: 'ari', displayName: 'Ari Reader', role: 'user' };
const savedPost = { id: 'post-1', title: 'Saved title', content: 'Saved body.\nSecond line.', createdAt: '2026-04-01T12:00:00.000Z', authorId: 'writer-1', authorName: 'Ari Reader' };

/** Establish an authenticated writer and known local post state. */
function resetEditorState() {
  localStorage.clear();
  setSession(authorSession);
  savePosts([savedPost]);
}

describe('post editor', () => {
  beforeEach(() => {
    resetEditorState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows field-level required errors and a live character count for an empty new post', async () => {
    const user = userEvent.setup();
    savePosts([]);
    renderRoute('/write');

    expect(screen.getByRole('heading', { name: 'Write a new post' })).toBeInTheDocument();
    expect(screen.getByText('0 characters')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Publish post' }));

    expect(screen.getByText('Title is required.')).toBeInTheDocument();
    expect(screen.getByText('Content is required.')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true');
    expect(getPosts()).toEqual([]);
  });

  it('accepts a 140-character title and prevents typing beyond the limit', async () => {
    const user = userEvent.setup();
    savePosts([]);
    renderRoute('/write');

    const titleInput = screen.getByLabelText('Title');
    const titleAtLimit = 'a'.repeat(140);
    expect(titleInput).toHaveAttribute('maxLength', '140');

    await user.type(titleInput, titleAtLimit);
    expect(titleInput).toHaveValue(titleAtLimit);
    expect(titleInput.value).toHaveLength(140);

    await user.type(titleInput, ' beyond the limit');
    expect(titleInput).toHaveValue(titleAtLimit);
    expect(titleInput.value).toHaveLength(140);
  });

  it('creates and saves a valid post, then routes to the new reader page', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'new-post-id') });
    savePosts([]);
    renderRoute('/write');

    await user.type(screen.getByLabelText('Title'), 'A draft made real');
    await user.type(screen.getByLabelText('Content'), 'The first line.');
    expect(screen.getByText('15 characters')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Publish post' }));

    expect(screen.getByLabelText('Current route')).toHaveTextContent('/blog/new-post-id');
    expect(getPosts()).toEqual([{
      id: 'new-post-id',
      title: 'A draft made real',
      content: 'The first line.',
      authorId: 'writer-1',
      authorName: 'Ari Reader',
      createdAt: expect.any(String),
    }]);
    expect(screen.getByRole('heading', { name: 'A draft made real' })).toBeInTheDocument();
  });

  it('prefills an edit, saves changes without duplicating, and retains author metadata', async () => {
    const user = userEvent.setup();
    renderRoute('/edit/post-1');

    expect(screen.getByLabelText('Title')).toHaveValue('Saved title');
    expect(screen.getByLabelText('Content')).toHaveValue('Saved body.\nSecond line.');
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Updated title');
    await user.clear(screen.getByLabelText('Content'));
    await user.type(screen.getByLabelText('Content'), 'Updated body.');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByLabelText('Current route')).toHaveTextContent('/blog/post-1');
    expect(getPosts()).toEqual([{ ...savedPost, title: 'Updated title', content: 'Updated body.' }]);
    expect(screen.getByRole('heading', { name: 'Updated title' })).toBeInTheDocument();
  });

  it('cancel leaves an edit unchanged and returns to its reader, or returns a new draft to the list', async () => {
    const user = userEvent.setup();
    const { unmount } = renderRoute('/edit/post-1');
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Unsaved change');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByLabelText('Current route')).toHaveTextContent('/blog/post-1');
    expect(getPosts()).toEqual([savedPost]);
    unmount();

    renderRoute('/write');
    await user.type(screen.getByLabelText('Title'), 'Discard this');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/blogs');
    expect(getPosts()).toEqual([savedPost]);
  });

  it('sends a non-owner away from an edit and gives a safe message for a missing id', () => {
    setSession({ userId: 'writer-2', username: 'riley', displayName: 'Riley Writer', role: 'user' });
    renderRoute('/edit/post-1');
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/blogs');

    const { unmount } = renderRoute('/edit/missing');
    expect(screen.getByRole('heading', { name: 'Post not found' })).toBeInTheDocument();
    unmount();
  });
});
