import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import { logout } from '../utils/auth.js';

const navLinkClass = ({ isActive }) => `rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 ${isActive ? 'bg-indigo-100 text-indigo-900' : 'text-stone-700 hover:bg-stone-100 hover:text-indigo-900'}`;

/** Render role-aware authenticated navigation with a stateful mobile menu.
 *
 * Args:
 *   session: Valid local session to identify the active visitor.
 */
export default function Navbar({ session }) {
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
      <NavLink className={navLinkClass} end to="/blogs">All Blogs</NavLink>
      <NavLink className={navLinkClass} to="/write">Write</NavLink>
      {isAdmin && <NavLink className={navLinkClass} to="/users">Users</NavLink>}
    </>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-slate-100 bg-white shadow-sm">
      <nav aria-label="Authenticated navigation" className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link aria-label="WriteSpace home" className="flex items-center gap-3 font-semibold tracking-tight text-stone-900" to="/">
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-700 text-sm text-white">W</span>
          WriteSpace
        </Link>
        <div className="hidden items-center gap-1 md:flex">{links}</div>
        <div className="flex items-center gap-3">
          <Avatar role={session.role} />
          <span className="hidden max-w-36 truncate text-sm font-medium text-stone-700 sm:inline">{session.displayName}</span>
          <button className="rounded-md px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" onClick={handleLogout} type="button">Logout</button>
          <button aria-controls="authenticated-mobile-menu" aria-expanded={menuOpen} aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} className="rounded-md border border-stone-300 px-3 py-2 text-lg text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 md:hidden" onClick={() => setMenuOpen((open) => !open)} type="button">{menuOpen ? '×' : '☰'}</button>
        </div>
      </nav>
      {menuOpen && <div className="flex flex-col gap-1 border-t border-stone-200 px-5 py-3 md:hidden" id="authenticated-mobile-menu">{links}</div>}
    </header>
  );
}

Navbar.propTypes = {
  session: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    role: PropTypes.oneOf(['admin', 'user']).isRequired,
  }).isRequired,
};
