import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canManagePost, createPost, deletePost, findPost, updatePost, validatePost } from './posts.js';
import { getPosts, savePosts } from './storage.js';

const writer = { userId: 'writer-1', username: 'ari', displayName: 'Ari Reader', role: 'user' };
const admin = { userId: 'admin', username: 'admin', displayName: 'WriteSpace Administrator', role: 'admin' };
const stranger = { userId: 'writer-2', username: 'riley', displayName: 'Riley Writer', role: 'user' };
const post = { id: 'post-1', title: 'First thought', content: 'A paragraph.', createdAt: '2026-02-01T10:00:00.000Z', authorId: 'writer-1', authorName: 'Ari Reader' };

/** Clear saved posts before each real-storage post mutation test. */
function resetPosts() {
  localStorage.clear();
  savePosts([]);
}

describe('local plain-text posts', () => {
  beforeEach(() => {
    resetPosts();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('validates required title/content and rejects non-string or whitespace-only values', () => {
    expect(validatePost({ title: '  ', content: 'text' })).toEqual({ title: 'Title is required.' });
    expect(validatePost({ title: 'title', content: ' \n ' })).toEqual({ content: 'Content is required.' });
    expect(validatePost({ title: null, content: 12 })).toEqual({ title: 'Title is required.', content: 'Content is required.' });
    expect(validatePost({ title: 'Title', content: 'Body' })).toEqual({});
  });

  it('creates a UUID post with timestamp and session author snapshot, then persists it', () => {
    vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'created-uuid') });
    vi.setSystemTime(new Date('2026-04-04T09:08:07.000Z'));
    const result = createPost({ title: '  A new note  ', content: 'First line\n\nSecond line.' }, writer);

    expect(result).toEqual({
      success: true,
      post: {
        id: 'created-uuid',
        title: 'A new note',
        content: 'First line\n\nSecond line.',
        createdAt: '2026-04-04T09:08:07.000Z',
        authorId: 'writer-1',
        authorName: 'Ari Reader',
      },
    });
    expect(getPosts()).toEqual([result.post]);
  });

  it('rejects unauthenticated or invalid-role create attempts and does not persist data', () => {
    expect(createPost({ title: 'A title', content: 'Body' }, null)).toEqual({ success: false, error: 'Sign in before writing a post.' });
    expect(createPost({ title: 'A title', content: 'Body' }, { userId: 'x', role: 'guest' })).toEqual({ success: false, error: 'Sign in before writing a post.' });
    expect(getPosts()).toEqual([]);
  });

  it('rejects invalid create fields and leaves persisted state unchanged', () => {
    const result = createPost({ title: ' ', content: '' }, writer);

    expect(result.success).toBe(false);
    expect(result.errors).toEqual({ title: 'Title is required.', content: 'Content is required.' });
    expect(getPosts()).toEqual([]);
  });

  it('allows an owner or admin to manage a post and denies another standard user', () => {
    expect(canManagePost(writer, 'writer-1')).toBe(true);
    expect(canManagePost(admin, 'writer-1')).toBe(true);
    expect(canManagePost(stranger, 'writer-1')).toBe(false);
    expect(canManagePost(null, 'writer-1')).toBe(false);
  });

  it('updates an owned post without changing id, author snapshot, or creation date', () => {
    savePosts([post]);
    const result = updatePost('post-1', { title: 'Revised title', content: 'Revised body.' }, writer);

    expect(result).toEqual({ success: true, post: { ...post, title: 'Revised title', content: 'Revised body.' } });
    expect(getPosts()).toEqual([{ ...post, title: 'Revised title', content: 'Revised body.' }]);
  });

  it('permits admin update and rejects non-owner update, missing id, and invalid update without altering storage', () => {
    savePosts([post]);
    expect(updatePost('post-1', { title: 'Admin edit', content: 'Updated.' }, admin).success).toBe(true);
    const beforeUnauthorized = getPosts();
    expect(updatePost('post-1', { title: 'Blocked', content: 'No.' }, stranger)).toEqual({ success: false, error: 'You cannot edit this post.' });
    expect(getPosts()).toEqual(beforeUnauthorized);
    expect(updatePost('absent', { title: 'Title', content: 'Body' }, admin)).toEqual({ success: false, error: 'Post not found.' });
    expect(updatePost('post-1', { title: '', content: 'Body' }, admin).errors).toEqual({ title: 'Title is required.' });
  });

  it('deletes posts for owners or admins and denies unauthorized or missing-id deletes', () => {
    savePosts([post, { ...post, id: 'post-2', title: 'Second' }]);
    expect(deletePost('post-1', stranger)).toEqual({ success: false, error: 'You cannot delete this post.' });
    expect(getPosts()).toHaveLength(2);
    expect(deletePost('post-1', writer)).toEqual({ success: true, post });
    expect(getPosts().map((savedPost) => savedPost.id)).toEqual(['post-2']);
    expect(deletePost('post-2', admin).success).toBe(true);
    expect(getPosts()).toEqual([]);
    expect(deletePost('missing', admin)).toEqual({ success: false, error: 'Post not found.' });
  });

  it('returns null for absent and malformed post records when searching', () => {
    expect(findPost(undefined, [post])).toBeNull();
    expect(findPost('missing', [post])).toBeNull();
    expect(findPost('post-1', [null, 'not-a-record', post])).toEqual(post);
  });
});
