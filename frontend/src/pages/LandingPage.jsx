import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar.jsx';
import { getPosts, getSession, getStorageWarning } from '../utils/storage.js';

const features = [
  {
    title: 'Write Freely',
    description: 'Plain-text writing without distractions, so you can focus on the words.',
  },
  {
    title: 'Private & Local',
    description: 'Your posts live in this browser. They are not shared with other visitors.',
  },
  {
    title: 'Instant & Fast',
    description: 'A lightweight static app with no server or network wait.',
  },
];

/** Sort local posts by their newest available publication date.
 *
 * Args:
 *   posts: Local post records to order.
 *
 * Returns:
 *   Posts ordered newest first, with undated posts after dated posts.
 */
function newestPosts(posts) {
  return posts.filter((post) => post && typeof post === 'object' && !Array.isArray(post) && post.id !== undefined && post.id !== null).sort((first, second) => {
    const firstDate = Date.parse(first.publishedAt || first.createdAt || first.updatedAt || '') || 0;
    const secondDate = Date.parse(second.publishedAt || second.createdAt || second.updatedAt || '') || 0;
    return secondDate - firstDate;
  }).slice(0, 3);
}

/** Format a post date for readers without failing on missing or invalid dates.
 *
 * Args:
 *   post: Post record with an optional publication date.
 *
 * Returns:
 *   A readable date, or a neutral fallback for undated writing.
 */
function postDate(post) {
  const value = post.publishedAt || post.createdAt || post.updatedAt;
  const timestamp = Date.parse(value || '');
  if (!timestamp) {
    return 'A recent story';
  }
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(timestamp);
}

/** Return a concise excerpt when a local post does not include one.
 *
 * Args:
 *   post: Post record to summarize.
 *
 * Returns:
 *   The excerpt, or a short prompt to open the post.
 */
function postExcerpt(post) {
  const excerpt = post.excerpt || post.summary;
  if (excerpt) {
    return excerpt;
  }
  if (post.content) {
    return `${String(post.content).slice(0, 150).trim()}${String(post.content).length > 150 ? '…' : ''}`;
  }
  return 'Open this story to read more.';
}

/** Render WriteSpace's public home and browser-local writing preview. */
export default function LandingPage() {
  const posts = newestPosts(getPosts());
  const session = getSession();
  const storageWarning = getStorageWarning();
  const signedInUser = session?.user || session;
  const startReadingPath = signedInUser ? '/blogs' : '/login';

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-stone-900">
      <PublicNavbar session={session} />
      {storageWarning && (
        <div aria-live="polite" className="border-b border-amber-300 bg-amber-50 px-5 py-3 text-center text-sm text-amber-950" role="status">
          {storageWarning}
        </div>
      )}
      <main>
        <section aria-labelledby="hero-title" className="mx-auto grid min-h-[100dvh] max-w-6xl gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="mb-6 text-sm font-semibold uppercase tracking-[0.16em] text-indigo-800">A writing and reading space</p>
            <h1 className="font-display text-5xl font-medium leading-[1.06] tracking-[-0.04em] sm:text-7xl" id="hero-title">WriteSpace</h1>
            <p className="mt-5 font-display text-2xl leading-snug tracking-tight text-stone-700 sm:text-3xl">
              Your thoughts. Your space. Beautifully simple.
            </p>
            <p className="mt-5 max-w-xl text-lg leading-8 text-stone-600">
              A quiet, local place to read and publish plain-text writing, stored only in this browser.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link className="rounded-md bg-indigo-700 px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 motion-reduce:transition-none" to={startReadingPath}>
                Start reading
              </Link>
              {!signedInUser && (
                <Link className="rounded-md border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-800 transition-colors duration-150 hover:border-indigo-300 hover:text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 motion-reduce:transition-none" to="/register">
                  Get started
                </Link>
              )}
            </div>
            <p className="mt-4 text-sm text-stone-500">Your posts are stored only in this browser, not shared across devices.</p>
          </div>
          <aside aria-label="Local writing preview" className="lg:ml-8">
            <article className="motion-safe:animate-float rounded-2xl border border-stone-200 bg-white p-7 shadow-[0_18px_45px_rgba(59,49,34,0.10)] motion-reduce:animate-none">
              {posts[0] ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-800">From this browser</p>
                  <h2 className="mt-5 font-display text-2xl font-medium leading-snug tracking-tight text-stone-900">{posts[0].title || 'Untitled story'}</h2>
                  <p className="mt-3 text-sm leading-6 text-stone-600">{postExcerpt(posts[0])}</p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-800">A writing space</p>
                  <p className="mt-5 font-display text-3xl leading-snug tracking-tight text-stone-900">Your next story starts with a first line.</p>
                  <p className="mt-4 text-sm leading-6 text-stone-600">Create a local account to begin writing in this browser.</p>
                </>
              )}
            </article>
          </aside>
        </section>

        <section aria-labelledby="features-title" className="border-y border-stone-200 bg-[#f7f5f0]">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-stone-500">A little less noise</p>
              <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl" id="features-title">Space for the words that matter.</h2>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
              {features.map((feature, index) => (
                <article className="border-t border-stone-300 pt-5" key={feature.title}>
                  <h3 className="text-lg font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-600">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="latest-title" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-stone-500">From this browser</p>
              <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl" id="latest-title">Latest writing</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-stone-500">A small preview of posts saved locally on this device.</p>
          </div>
          {posts.length ? (
            <div className="mt-9 divide-y divide-stone-200 border-y border-stone-200">
              {posts.map((post) => (
                <article className="grid gap-3 py-6 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8" key={post.id}>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-stone-500">{postDate(post)}{post.authorName ? ` · ${post.authorName}` : ''}</p>
                    <h3 className="mt-2 font-display text-2xl font-medium tracking-tight">
                      <Link className="underline decoration-transparent underline-offset-4 transition-colors duration-150 hover:text-indigo-800 hover:decoration-indigo-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 motion-reduce:transition-none" to={`/blog/${encodeURIComponent(post.id)}`}>
                        {post.title || 'Untitled story'}
                      </Link>
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">{postExcerpt(post)}</p>
                  </div>
                  <Link aria-label={`Read ${post.title || 'untitled story'}`} className="w-fit text-sm font-semibold text-indigo-800 underline underline-offset-4 decoration-indigo-300 hover:decoration-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-700" to={`/blog/${encodeURIComponent(post.id)}`}>
                    Read story <span aria-hidden="true">→</span>
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-9 border-y border-stone-200 py-8 text-stone-600">No posts yet - check back soon!</p>
          )}
        </section>
      </main>
      <footer className="border-t border-stone-200 bg-[#f7f5f0]">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-8 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} WriteSpace</p>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link className="underline-offset-4 hover:text-indigo-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" to="/">Home</Link>
            <Link className="underline-offset-4 hover:text-indigo-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" to="/blogs">All Blogs</Link>
            <Link className="underline-offset-4 hover:text-indigo-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" to="/login">Login</Link>
            <Link className="underline-offset-4 hover:text-indigo-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" to="/register">Register</Link>
          </nav>
        </div>
      </footer>
          </div>
  );
}

