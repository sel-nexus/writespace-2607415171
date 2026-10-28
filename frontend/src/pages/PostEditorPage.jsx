import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { getCurrentSession } from '../utils/auth.js';
import { createPost, findPost, updatePost } from '../utils/posts.js';
import { getPosts, getStorageWarning } from '../utils/storage.js';

/** Render a validated create or ownership-aware edit form for plain-text posts. */
export default function PostEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = getCurrentSession();
  const editing = id !== undefined;
  const originalPost = editing ? findPost(id) : null;
  const canEdit = originalPost && (session?.role === 'admin' || originalPost.authorId === session?.userId);
  const [title, setTitle] = useState(originalPost?.title || '');
  const [content, setContent] = useState(originalPost?.content || '');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const warning = getStorageWarning();

  if (!session) {
    return <Navigate replace to="/login" />;
  }
  if (editing && originalPost && !canEdit) {
    return <Navigate replace to="/blogs" />;
  }

  /** Validate the draft, persist it, then navigate to its reader view. */
  function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    const input = { title, content };
    const result = editing
      ? updatePost(id, input, session)
      : createPost(input, session);

    setErrors(result.errors || {});
    if (!result.success) {
      setFormError(result.error || 'Please correct the highlighted fields.');
      return;
    }
    navigate(`/blog/${encodeURIComponent(result.post.id)}`, { replace: true });
  }

  /** Leave the form without persisting any unsaved changes. */
  function handleCancel() {
    navigate(editing && originalPost ? `/blog/${encodeURIComponent(id)}` : '/blogs', { replace: true });
  }

  if (editing && !originalPost) {
    return (
      <div className="min-h-[100dvh] bg-[#fbfaf7] text-stone-900">
        <Navbar session={session} />
        <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
          <h1 className="font-display text-4xl font-medium">Post not found</h1>
          <p className="mt-3 text-stone-600">This post is not saved in this browser.</p>
          <Link
            className="mt-6 inline-flex rounded-lg border border-indigo-200 px-4 py-2 font-semibold text-indigo-800 hover:bg-indigo-50"
            to="/blogs"
          >
            Back to All Posts
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#fbfaf7] text-stone-900">
      <Navbar session={session} />
      {warning && (
        <p
          className="border-b border-amber-300 bg-amber-50 px-5 py-3 text-center text-sm text-amber-950"
          role="status"
        >
          {warning}
        </p>
      )}
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <Link
          className="text-sm font-semibold text-indigo-800 underline underline-offset-4"
          to="/blogs"
        >
          Back to All Posts
        </Link>
        <section
          aria-labelledby="editor-title"
          className="mt-8 rounded-2xl border border-stone-200 bg-white p-7 shadow-sm sm:p-10"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-indigo-800">Plain-text editor</p>
          <h1 className="mt-3 font-display text-4xl font-medium tracking-tight" id="editor-title">
            {editing ? 'Edit your post' : 'Write a new post'}
          </h1>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-sm font-medium text-stone-800" htmlFor="post-title">
                Title
              </label>
              <input
                aria-describedby={errors.title ? 'post-title-error' : undefined}
                aria-invalid={Boolean(errors.title)}
                aria-required="true"
                className={
                  "mt-2 w-full rounded-lg border border-stone-300 px-4 py-3 text-lg text-stone-900 " +
                  "focus:border-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700"
                }
                id="post-title"
                maxLength={140}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setErrors((current) => ({ ...current, title: '' }));
                }}
                value={title}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-700" id="post-title-error" role="alert">
                  {errors.title}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-800" htmlFor="post-content">
                Content
              </label>
              <textarea
                aria-describedby={errors.content ? 'post-content-error' : 'post-content-count'}
                aria-invalid={Boolean(errors.content)}
                aria-required="true"
                className={
                  "mt-2 min-h-64 w-full resize-y rounded-lg border border-stone-300 px-4 py-3 leading-7 text-stone-900 " +
                  "focus:border-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700"
                }
                id="post-content"
                onChange={(event) => {
                  setContent(event.target.value);
                  setErrors((current) => ({ ...current, content: '' }));
                }}
                value={content}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-700" id="post-content-error" role="alert">
                  {errors.content}
                </p>
              )}
              <p className="mt-2 text-right text-xs text-stone-500" id="post-content-count" aria-live="polite">
                {content.length} characters
              </p>
            </div>
            {formError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">
                {formError}
              </p>
            )}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className={
                  "rounded-lg px-5 py-3 font-semibold text-stone-600 hover:bg-stone-100 " +
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-600"
                }
                onClick={handleCancel}
                type="button"
              >
                Cancel
              </button>
              <button
                className={
                  "rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 " +
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700"
                }
                type="submit"
              >
                {editing ? 'Save changes' : 'Publish post'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
