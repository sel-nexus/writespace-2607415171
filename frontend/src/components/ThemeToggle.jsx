/** Provide a native keyboard-operable control for the root theme preference. */
import PropTypes from 'prop-types';

/** Render the next-theme action with a visible focus indicator.
 *
 * Args:
 *   theme: Current root appearance.
 *   onToggleTheme: Root callback that changes and persists the preference.
 */
export default function ThemeToggle({ theme, onToggleTheme }) {
  const dark = theme === 'dark';
  return (
    <button
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={dark}
      className={
        'shrink-0 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold ' +
        'text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-100 ' +
        'dark:hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 ' +
        'focus-visible:outline-offset-2 focus-visible:outline-indigo-700 dark:focus-visible:outline-indigo-300'
      }
      onClick={onToggleTheme}
      type="button"
    >
      {dark ? 'Light mode' : 'Dark mode'}
    </button>
  );
}

ThemeToggle.propTypes = {
  theme: PropTypes.oneOf(['light', 'dark']).isRequired,
  onToggleTheme: PropTypes.func.isRequired,
};
