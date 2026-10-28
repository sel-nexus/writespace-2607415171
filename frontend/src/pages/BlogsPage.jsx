import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar.jsx';
import Navbar from '../components/Navbar.jsx';
import { getCurrentSession } from '../utils/auth.js';
import { getPosts, getStorageWarning, getUsers } from '../utils/storage.js';

const accentClasses = ['border-indigo-500', 'border-violet-500', 'border-pink-500', 'border-teal-500'];

/** Return valid local posts in reverse chronological order.
 *
 * Args:
 *   posts: Candidate browser-local post records.
 *
 * Returns:
 *   Posts with an id, sorted newest first.
 */
function newestPosts(posts) {
  return posts
    .filter((post) => post && typeof post === 'object' && !Array.isArray(post) && post.id !== undefined && post.id !== null)
    .slice()
    .sort((first, second) => (Date.parse(second.createdAt || '') || 0) - (Date.parse(first.createdAt || '') || 0));
}

/** Format a saved ISO date without throwing for malformed values.
 *
 * Args:
 *   createdAt: Optional ISO timestamp.
 *
 * Returns:
 *   A formatted date or a non-specific fallback label.
 */
function formatDate(createdAt) {
  const timestamp = Date.parse(createdAt || '');
  return timestamp ? new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(timestamp) : 'Date unavailable';
}

/** Render all locally saved posts for an authenticated reader. */
export default function BlogsPage() {
  const session = getCurrentSession();
  const posts = newestPosts(getPosts());
  const users = getUsers();
  const warning = getStorageWarning();

  return (
    <div className="min-h-[100dvh] bg-[#fbfaf7] text-stone-900">
      <Navbar session={session} />
      {warning && <p className="border-b border-amber-300 bg-amber-50 px-5 py-3 text-center text-sm text-amber-950" role="status">{warning}</p>}
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-indigo-800">Writing in this browser</p>
            <h1 className="mt-3 font-display text-4xl font-medium tracking-tight sm:text-5xl">All Blogs</h1>
          </div>
          <Link className="rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" to="/write">Write a post</Link>
        </header>
        {posts.length ? (
          <section aria-label="All posts" className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => {
              const isOwner = post.authorId === session.userId;
              const canEdit = session.role === 'admin' || isOwner;
              const content = String(post.content || '');
              const excerpt = post.excerpt || content.slice(0, 120);
              const author = users.find((user) => user.id === post.authorId);
              const authorRole = post.authorId === 'admin' || String(author?.role || '').toLowerCase() === 'admin' ? 'admin' : 'user';
              return (
                <article className={`rounded-2xl border border-stone-200 border-t-4 bg-white p-6 shadow-sm ${accentClasses[index % accentClasses.length]}`} key={post.id}>
                  <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
                    <Avatar role={authorRole} />
                    <span>{formatDate(post.createdAt)}{post.authorName ? ` · ${post.authorName}` : ''}</span>
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-medium leading-snug tracking-tight">
                    <Link className="underline-offset-4 hover:text-indigo-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" to={`/blog/${encodeURIComponent(post.id)}`}>{post.title || 'Untitled post'}</Link>
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-stone-600">{String(excerpt).slice(0, 120)}</p>
                  {canEdit && <Link aria-label={`Edit ${post.title || 'untitled post'}`} className="mt-5 inline-flex rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" to={`/edit/${encodeURIComponent(post.id)}`}>Edit</Link>}
                </article>
              );
            })}
          </section>
        ) : (
          <section className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-white/70 px-6 py-12 text-center">
            <h2 className="font-display text-2xl font-medium">No blogs yet. Be the first to write one!</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-stone-600">Posts saved here belong to this browser. Start a draft and it will appear in this list.</p>
            <Link className="mt-6 inline-flex rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" to="/write">Write a post</Link>
          </section>
        )}
      </main>
    </div>
  );
}
