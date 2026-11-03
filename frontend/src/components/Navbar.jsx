import ThemeToggle from './ThemeToggle.jsx';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import { logout } from '../utils/auth.js';

/** Style the current route distinctly in either appearance. */
const navLinkClass = ({ isActive }) =>
  'rounded-full px-4 py-2 text-sm font-medium transition-colors ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-indigo-700 dark:focus-visible:outline-indigo-300 ' +
  (isActive
    ? 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100'
    : 'text-stone-700 hover:bg-stone-100 hover:text-indigo-900 ' +
      'dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-indigo-200');

/** Render role-aware authenticated navigation with a stateful mobile menu.
 *
 * Args:
 *   session: Valid local session to identify the active visitor.
 */
export default function Navbar({ session, theme = 'light', onToggleTheme }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = session.role === 'admin';

  /** Clear the browser-local session and return to the public home page. */
  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  const links = (
    <>
      <NavLink className={navLinkClass} end to="/blogs">
        All Blogs
      </NavLink>
      <NavLink className={navLinkClass} to="/write">
        Write
      </NavLink>
      {isAdmin && (
        <NavLink className={navLinkClass} to="/users">
          Users
        </NavLink>
      )}
    </>
  );

  return (
    <header
      className={
        "sticky top-0 z-20 border-b border-slate-100 bg-white shadow-sm dark:border-slate-700 " +
        "dark:bg-slate-900"
      }
    >
      <nav
        aria-label="Authenticated navigation"
        className="mx-auto flex max-w-6xl flex-wrap gap-3 items-center justify-between px-5 py-4 sm:px-8"
      >
        <Link
          aria-label="WriteSpace home"
          className="flex items-center gap-3 font-semibold tracking-tight text-stone-900 dark:text-slate-100"
          to="/"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-700 text-sm text-white"
          >
            W
          </span>
          WriteSpace
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {links}
        </div>
        <div className="flex items-center gap-3">
          {onToggleTheme && (
            <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
          )}
          <Avatar role={session.role} />
          <span className="hidden max-w-36 truncate text-sm font-medium text-stone-700 dark:text-slate-200 sm:inline">
            {session.displayName}
          </span>
          <button
            className={
              "rounded-md px-3 py-2 text-sm font-semibold text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 hover:text-stone-900 dark:hover:text-slate-100 " +
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 dark:focus-visible:outline-indigo-300"
            }
            onClick={handleLogout}
            type="button"
          >
            Logout
          </button>
          <button
            aria-controls="authenticated-mobile-menu"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className={
              'rounded-md border border-stone-300 dark:border-slate-600 px-3 py-2 ' +
              'text-lg text-stone-800 dark:text-slate-100 focus-visible:outline ' +
              'focus-visible:outline-2 focus-visible:outline-offset-2 ' +
              'focus-visible:outline-indigo-700 dark:focus-visible:outline-indigo-300 md:hidden'
            }
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            {menuOpen ? '×' : '☰'}
          </button>
        </div>
      </nav>
      {menuOpen && (
        <div
          className="flex flex-col gap-1 border-t border-stone-200 dark:border-slate-700 px-5 py-3 md:hidden"
          id="authenticated-mobile-menu"
        >
          {links}
        </div>
      )}
    </header>
  );
}

Navbar.propTypes = {
  theme: PropTypes.oneOf(['light', 'dark']),
  onToggleTheme: PropTypes.func,
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.oneOf(['admin', 'user']).isRequired,
  }).isRequired,
};
