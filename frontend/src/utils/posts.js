import { getPosts, savePosts } from './storage.js';

/** Validate a plain-text post title and body before saving.
 *
 * Args:
 *   input: Candidate title and content values.
 *
 * Returns:
 *   Field errors keyed by title or content.
 */
export function validatePost(input) {
  const errors = {};
  if (typeof input?.title !== 'string' || !input.title.trim()) {
    errors.title = 'Title is required.';
  }
  if (typeof input?.content !== 'string' || !input.content.trim()) {
    errors.content = 'Content is required.';
  }
  return errors;
}

/** Check whether a session may change a post owned by a given user.
 *
 * Args:
 *   session: Current local session.
 *   authorId: User id saved on the target post.
 *
 * Returns:
 *   Whether the session is the post owner or an administrator.
 */
export function canManagePost(session, authorId) {
  return Boolean(session && (session.role === 'admin' || (session.role === 'user' && session.userId === authorId)));
}

/** Find a post by id without assuming the saved data is well-formed.
 *
 * Args:
 *   id: Requested post id.
 *   posts: Posts to search, defaulting to locally persisted data.
 *
 * Returns:
 *   The matching post, or null when the id is missing or unknown.
 */
export function findPost(id, posts = getPosts()) {
  if (id === undefined || id === null || id === '') {
    return null;
  }
  return posts.find((post) => post && typeof post === 'object' && String(post.id) === String(id)) || null;
}

/** Create and persist a post for the authenticated local session.
 *
 * Args:
 *   input: Draft title and plain-text content.
 *   session: Authenticated local session supplying author metadata.
 *   posts: Existing post records, defaulting to the local storage value.
 *
 * Returns:
 *   A success result with the saved post, or validation/authorization errors.
 */
export function createPost(input, session, posts = getPosts()) {
  const errors = validatePost(input);
  if (!session || !session.userId || !['admin', 'user'].includes(session.role)) {
    return { success: false, error: 'Sign in before writing a post.' };
  }
  if (Object.keys(errors).length) {
    return { success: false, errors };
  }

  const post = {
    id: crypto.randomUUID(),
    title: input.title.trim(),
    content: input.content,
    createdAt: new Date().toISOString(),
    authorId: session.userId,
    authorName: session.displayName,
  };
  savePosts([...posts, post]);
  return { success: true, post };
}

/** Update only the editable fields on a post the session can manage.
 *
 * Args:
 *   id: Id of the post to update.
 *   input: New title and plain-text content.
 *   session: Authenticated local session making the change.
 *   posts: Existing post records, defaulting to local storage.
 *
 * Returns:
 *   The updated record, or a safe missing/unauthorized/validation result.
 */
export function updatePost(id, input, session, posts = getPosts()) {
  const post = findPost(id, posts);
  if (!post) {
    return { success: false, error: 'Post not found.' };
  }
  if (!canManagePost(session, post.authorId)) {
    return { success: false, error: 'You cannot edit this post.' };
  }
  const errors = validatePost(input);
  if (Object.keys(errors).length) {
    return { success: false, errors };
  }

  const updatedPost = { ...post, title: input.title.trim(), content: input.content };
  savePosts(posts.map((savedPost) => (String(savedPost?.id) === String(id) ? updatedPost : savedPost)));
  return { success: true, post: updatedPost };
}

/** Remove a post only when the session owns it or has administrator role.
 *
 * Args:
 *   id: Id of the post to remove.
 *   session: Authenticated local session making the change.
 *   posts: Existing post records, defaulting to local storage.
 *
 * Returns:
 *   A successful removal result or a safe missing/unauthorized error.
 */
export function deletePost(id, session, posts = getPosts()) {
  const post = findPost(id, posts);
  if (!post) {
    return { success: false, error: 'Post not found.' };
  }
  if (!canManagePost(session, post.authorId)) {
    return { success: false, error: 'You cannot delete this post.' };
  }

  savePosts(posts.filter((savedPost) => String(savedPost?.id) !== String(id)));
  return { success: true, post };
}
