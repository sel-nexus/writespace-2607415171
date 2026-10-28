import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';

/** Explain that a requested client-side route is not part of the application.
 *
 * Args:
 *   title: Optional heading for a route that exists but is not yet accessible.
 */
export default function NotFoundPage({ title = 'Page not found' }) {
  const location = useLocation();

  return (
    <main className="min-h-[100dvh] bg-[#fbfaf7] px-5 py-16 text-stone-900 sm:px-8">
      <section aria-labelledby="not-found-title" className="mx-auto max-w-xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <Link aria-label="WriteSpace home" className="font-semibold text-stone-900" to="/">WriteSpace</Link>
        <h1 className="mt-10 font-display text-3xl font-medium tracking-tight" id="not-found-title">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">There is no WriteSpace page at <code>{location.pathname}</code>.</p>
        <div className="mt-7 flex flex-wrap gap-4">
          <Link className="rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" to="/">Return home</Link>
          <Link className="rounded-lg border border-stone-300 px-5 py-3 font-semibold text-stone-800 hover:border-indigo-300 hover:text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" to="/login">Login</Link>
        </div>
      </section>
    </main>
  );
}

NotFoundPage.propTypes = {
  title: PropTypes.string,
};
