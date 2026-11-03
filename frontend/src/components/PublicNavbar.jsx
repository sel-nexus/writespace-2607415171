import ThemeToggle from './ThemeToggle.jsx';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

/** Render public navigation for guests and locally signed-in readers.
 *
 * Args:
 *   session: Optional locally stored session object.
 */
export default function PublicNavbar({ session, theme = 'light', onToggleTheme }) {
  const signedInUser = session?.user || session;
  const displayName = signedInUser?.displayName || signedInUser?.name || signedInUser?.username || '';
  const role = String(signedInUser?.role || '').toLowerCase();
  const dashboardPath = role === 'admin' ? '/admin' : '/blogs';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return (
    <header
      className={
        "sticky top-0 z-20 border-b border-slate-100 bg-white shadow-sm dark:border-slate-700 " +
        "dark:bg-slate-900"
      }
    >
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-6xl flex-wrap gap-3 items-center justify-between px-5 py-5 sm:px-8"
      >
        <Link
          aria-label="WriteSpace home"
          className="flex items-center gap-3 text-stone-900 dark:text-slate-100"
          to="/"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-700 text-sm font-semibold text-white"
          >
            W
          </span>
          <span className="font-semibold tracking-tight">
            WriteSpace
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
          {onToggleTheme && (
            <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
          )}
          {displayName ? (
            <>
              <span className="hidden text-stone-600 dark:text-slate-300 sm:inline">
                {displayName}
              </span>
              <Link
                aria-label={`${displayName} profile`}
                className={
                  "flex h-9 w-9 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 " +
                  "text-xs font-semibold text-indigo-800 sm:hidden"
                }
                to={dashboardPath}
              >
                {initials || 'W'}
              </Link>
              <Link
                className={
                  "rounded-md bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-800 focus-visible:outline " +
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 " +
                  "dark:focus-visible:outline-indigo-300"
                }
                to={dashboardPath}
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                className={
                  "text-stone-700 dark:text-slate-200 underline-offset-4 hover:text-indigo-800 " +
                  "dark:hover:text-indigo-300 hover:underline focus-visible:outline focus-visible:outline-2 " +
                  "focus-visible:outline-offset-4 focus-visible:outline-indigo-700 " +
                  "dark:focus-visible:outline-indigo-300"
                }
                to="/login"
              >
                Login
              </Link>
              <Link
                className={
                  "rounded-md bg-indigo-700 px-4 py-2 text-white hover:bg-indigo-800 focus-visible:outline " +
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 " +
                  "dark:focus-visible:outline-indigo-300"
                }
                to="/register"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

PublicNavbar.propTypes = {
  theme: PropTypes.oneOf(['light', 'dark']),
  onToggleTheme: PropTypes.func,
  session: PropTypes.oneOfType([
    PropTypes.shape({
      userId: PropTypes.string,
      username: PropTypes.string,
      displayName: PropTypes.string,
      role: PropTypes.oneOf(['admin', 'user']),
    }),
    PropTypes.shape({
      user: PropTypes.shape({
        displayName: PropTypes.string,
        name: PropTypes.string,
        username: PropTypes.string,
        role: PropTypes.oneOf(['admin', 'user']),
      }),
    }),
  ]),
};


