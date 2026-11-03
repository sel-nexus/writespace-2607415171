import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Avatar from '../components/Avatar.jsx';
import { getCurrentSession } from '../utils/auth.js';
import { getPosts, getStorageWarning, getUsers, savePosts } from '../utils/storage.js';

/** Format a local post timestamp without failing on malformed saved data.
 *
 * Args:
 *   createdAt: Optional ISO timestamp from browser-local post data.
 *
 * Returns:
 *   A formatted date or a clear unavailable-date label.
 */
function formatDate(createdAt) {
  const timestamp = Date.parse(createdAt || '');
  return Number.isFinite(timestamp)
    ? new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(timestamp)
    : 'Date unavailable';
}

/** Render one full local post and only the actions allowed to its owner. */
export default function BlogReaderPage({ theme = 'light', onToggleTheme } = {}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = getCurrentSession();
  const posts = getPosts();
  const post = posts.find((savedPost) => String(savedPost?.id) === id);
  const users = getUsers();
  const warning = getStorageWarning();
  const canManage = post && (session.role === 'admin' || post.authorId === session.userId);
  const author = post && users.find((user) => user.id === post.authorId);
  const authorRole = post?.authorId === 'admin' || String(author?.role || '').toLowerCase() === 'admin' ? 'admin' : 'user';

  /** Confirm and remove an owned or administrator-managed post. */
  function handleDelete() {
    if (!canManage || !window.confirm('Delete this post? This action cannot be undone.')) {
      return;
    }
    savePosts(getPosts().filter((savedPost) => String(savedPost?.id) !== id));
    navigate('/blogs', { replace: true });
  }

  if (!post) {
    return (
      <div className="min-h-[100dvh] bg-[#fbfaf7] dark:bg-slate-950 text-stone-900 dark:text-slate-100">
        <Navbar session={session} theme={theme} onToggleTheme={onToggleTheme} />
        <main className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
          <h1 className="font-display text-4xl font-medium">
            Post not found
          </h1>
          <p className="mt-3 text-stone-600 dark:text-slate-300">
            This post may have been removed from this browser.
          </p>
          <Link
            className={
              'mt-6 inline-flex rounded-lg border border-indigo-200 dark:border-indigo-500/50 px-4 py-2 ' +
              'font-semibold text-indigo-800 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-800 ' +
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 dark:focus-visible:outline-indigo-400'
            }
            to="/blogs"
          >
            Back to All Posts
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#fbfaf7] dark:bg-slate-950 text-stone-900 dark:text-slate-100">
      <Navbar session={session} theme={theme} onToggleTheme={onToggleTheme} />
      {warning && (
        <p
          className={
            'border-b border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 px-5 py-3 ' +
            'text-center text-sm text-amber-950 dark:text-amber-200'
          }
          role="status"
        >
          {warning}
        </p>
      )}
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <Link
          className={
            'text-sm font-semibold text-indigo-800 dark:text-indigo-300 underline underline-offset-4 ' +
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
            'focus-visible:outline-indigo-700 dark:focus-visible:outline-indigo-400'
          }
          to="/blogs"
        >
          Back to All Posts
        </Link>
        <article className="mt-8 rounded-2xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-7 shadow-sm sm:p-10">
          <p className="text-sm text-stone-500 dark:text-slate-400">
            {formatDate(post.createdAt)}
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
            {post.title || 'Untitled post'}
          </h1>
          <div className="mt-6 flex items-center gap-3">
            <Avatar role={authorRole} />
            <p className="text-sm font-medium text-stone-700 dark:text-slate-200">
              {post.authorName || 'Unknown author'}
            </p>
          </div>
          <p className="mt-9 whitespace-pre-wrap text-base leading-8 text-stone-700 dark:text-slate-200">
            {String(post.content || '')}
          </p>
          {canManage ? (
            <div className="mt-10 flex flex-wrap gap-3 border-t border-stone-200 dark:border-slate-700 pt-6">
              <Link
                className={
                  'rounded-lg border border-indigo-200 dark:border-indigo-500/50 px-4 py-2 font-semibold ' +
                  'text-indigo-800 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-800 ' +
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
                  'focus-visible:outline-indigo-700 dark:focus-visible:outline-indigo-400'
                }
                to={`/edit/${encodeURIComponent(id)}`}
              >
                Edit
              </Link>
              <button
                className={
                  'rounded-lg border border-red-200 dark:border-red-500/50 bg-red-50 dark:bg-red-950/50 px-4 py-2 ' +
                  'font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 ' +
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
                  'focus-visible:outline-red-700 dark:focus-visible:outline-red-400'
                }
                onClick={handleDelete}
                type="button"
              >
                Delete
              </button>
            </div>
          ) : (
            <div className="mt-10 border-t border-stone-200 dark:border-slate-700 pt-6">
              <Link
                className={
                  'text-sm font-semibold text-indigo-800 dark:text-indigo-300 underline underline-offset-4 ' +
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
                  'focus-visible:outline-indigo-700 dark:focus-visible:outline-indigo-400'
                }
                to="/blogs"
              >
                Back to All Posts
              </Link>
            </div>
          )}
        </article>
      </main>
    </div>
  );
}
