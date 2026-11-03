import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import StatCard from '../components/StatCard.jsx';
import { getCurrentSession } from '../utils/auth.js';
import { deletePost } from '../utils/posts.js';
import { getAdminMetrics, getRecentPosts } from '../utils/admin.js';
import { getPosts, getStorageWarning, getUsers } from '../utils/storage.js';

const metricCards = [
  { key: 'totalPosts', title: 'Total Posts', tone: 'indigo' },
  { key: 'totalUsers', title: 'Total Users', tone: 'violet' },
  { key: 'totalAdmins', title: 'Total Admins', tone: 'pink' },
  { key: 'standardUsers', title: 'Total users', tone: 'teal' },
];

/** Format a local publication date without failing on invalid saved values.
 *
 * Args:
 *   date: Optional saved ISO date.
 *
 * Returns:
 *   A readable date or an unavailable-date label.
 */
function formatDate(date) {
  const timestamp = Date.parse(date || '');
  return Number.isFinite(timestamp)
    ? new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(timestamp)
    : 'Date unavailable';
}

/** Render administrator activity metrics and the five latest local posts. */
export default function AdminDashboardPage({ theme = 'light', onToggleTheme } = {}) {
  const session = getCurrentSession();
  const [posts, setPosts] = useState(() => getPosts());
  const users = getUsers();
  const warning = getStorageWarning();
  const metrics = getAdminMetrics(posts, users);
  const recentPosts = getRecentPosts(posts, 5);

  /** Confirm and delete a post through the shared ownership-aware operation. */
  function handleDelete(post) {
    if (!window.confirm(`Delete “${post.title || 'Untitled post'}”? This action cannot be undone.`)) {
      return;
    }
    const result = deletePost(post.id, session, posts);
    if (result.success) {
      const savedPosts = getPosts();
      setPosts(savedPosts);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#fbfaf7] text-stone-900 dark:text-slate-100 dark:bg-slate-950">
      <Navbar session={session} theme={theme} onToggleTheme={onToggleTheme} />
      {warning && (
        <p
          className={
            'border-b border-amber-300 bg-amber-50 px-5 py-3 text-center text-sm text-amber-950 ' +
            'dark:border-amber-700 dark:bg-slate-800 dark:text-amber-200'
          }
          role="status"
        >
          {warning}
        </p>
      )}
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <section aria-labelledby="admin-title" className={
          'rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-8 text-white shadow-sm ' +
          'sm:px-9 sm:py-10'
        }>
          <p className="text-sm font-semibold text-violet-100">
            WriteSpace community
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl" id="admin-title">
            Community overview
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-indigo-50">
            Review the activity and accounts saved in this browser. This local demo does not combine data from other devices.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className={
              'rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-indigo-900 hover:bg-indigo-50 ' +
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
              'focus-visible:outline-white'
            } to="/write">
              Write New Post
            </Link>
            <Link className={
              'rounded-lg border border-white/70 px-4 py-2.5 text-sm font-semibold text-white ' +
              'hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
              'focus-visible:outline-white'
            } to="/users">
              Manage Users
            </Link>
          </div>
        </section>

        <section aria-label="Community statistics" className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((card) => (
            <StatCard key={card.key} title={card.title} tone={card.tone} value={metrics[card.key]} />
          ))}
        </section>
        <p className="mt-3 text-xs leading-5 text-stone-500 dark:text-slate-400">
          Total Users counts saved accounts. Total Admins includes the built-in admin. Standard Users counts saved accounts with the user role.
        </p>

        <section aria-labelledby="recent-posts-title" className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-stone-500 dark:text-slate-400">
                Saved in this browser
              </p>
              <h2 className="mt-2 font-display text-3xl font-medium tracking-tight" id="recent-posts-title">
                Recent posts
              </h2>
            </div>
            <Link className={
              'text-sm font-semibold text-indigo-800 dark:text-indigo-200 underline underline-offset-4 ' +
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
              'focus-visible:outline-indigo-700 dark:focus-visible:outline-indigo-300'
            } to="/blogs">
              View all posts
            </Link>
          </div>
          {recentPosts.length ? (
            <div className={
              'mt-5 divide-y divide-stone-200 dark:divide-slate-700 rounded-2xl border border-stone-200 ' +
              'dark:border-slate-700 bg-white dark:bg-slate-900 px-5'
            }>
              {recentPosts.map((post) => (
                <article className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between" key={post.id}>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-stone-900 dark:text-slate-100">
                      <Link className={
                        'hover:text-indigo-800 dark:hover:text-indigo-200 hover:underline focus-visible:outline ' +
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 ' +
                        'dark:focus-visible:outline-indigo-300'
                      } to={`/blog/${encodeURIComponent(post.id)}`}>
                        {post.title || 'Untitled post'}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
                      {formatDate(post.createdAt)}{post.authorName ? ` · ${post.authorName}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link aria-label={`Edit ${post.title || 'untitled post'}`} className={
                      'rounded-lg border border-indigo-200 dark:border-indigo-700 px-3 py-2 text-sm font-semibold ' +
                      'text-indigo-800 dark:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-slate-800 ' +
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
                      'focus-visible:outline-indigo-700 dark:focus-visible:outline-indigo-300'
                    } to={`/edit/${encodeURIComponent(post.id)}`}>
                      Edit
                    </Link>
                    <button className={
                      'rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2 ' +
                      'text-sm font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 ' +
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
                      'focus-visible:outline-indigo-700 dark:focus-visible:outline-indigo-300'
                    }
                      onClick={() => handleDelete(post)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className={
              'mt-5 rounded-2xl border border-dashed border-stone-300 dark:border-slate-600 bg-white/70 ' +
              'dark:bg-slate-900/70 px-6 py-10 text-center text-stone-600 dark:text-slate-300'
            }>
              No posts yet. Create a post to start the community.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
