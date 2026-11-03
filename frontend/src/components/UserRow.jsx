import PropTypes from 'prop-types';
import Avatar from './Avatar.jsx';

const roleClasses = {
  admin: 'bg-violet-100 text-violet-800 ring-violet-300 dark:bg-violet-950 dark:text-violet-200 dark:ring-violet-700',
  user: 'bg-indigo-100 text-indigo-800 ring-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:ring-indigo-700',
};

/** Format a local account creation timestamp for the account list.
 *
 * Args:
 *   createdAt: Optional stored ISO timestamp.
 *
 * Returns:
 *   A readable date or a neutral fallback label.
 */
function formatCreatedAt(createdAt) {
  const timestamp = Date.parse(createdAt || '');
  return Number.isFinite(timestamp)
    ? new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(timestamp)
    : 'Date unavailable';
}

/** Render one account row or responsive card with safe delete affordances.
 *
 * Args:
 *   user: Account record to display.
 *   currentUserId: Id for the active administrator.
 *   variant: Table row or mobile card presentation.
 *   onDelete: Callback for an enabled delete action.
 */
export default function UserRow({ user, currentUserId, variant = 'card', onDelete }) {
  const role = String(user.role || 'user').toLowerCase() === 'admin' ? 'admin' : 'user';
  const isDefault = user.id === 'admin' || user.isDefault === true;
  const isSelf = user.id === currentUserId;
  const disabledReason = isDefault ? 'Default admin cannot be deleted.' : isSelf ? 'You cannot delete your own account.' : '';
  const deleteControl = (
    <button
      aria-label={`Delete ${user.displayName || user.username}`}
      className={
        'rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-3 py-2 ' +
        'text-sm font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900 ' +
        'disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-red-50 ' +
        'dark:disabled:hover:bg-red-950 focus-visible:outline focus-visible:outline-2 ' +
        'focus-visible:outline-offset-2 focus-visible:outline-red-700 dark:focus-visible:outline-red-300'
      }
      disabled={Boolean(disabledReason)}
      onClick={() => onDelete(user)}
      title={disabledReason || 'Delete account'}
      type="button"
    >
      Delete
    </button>
  );
  const identity = (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar role={role} />
      <div className="min-w-0">
        <p className="truncate font-semibold text-stone-900 dark:text-slate-100">
          {user.displayName || 'Unnamed account'}
        </p>
        <p className="truncate text-sm text-stone-500 dark:text-slate-400">
          @{user.username}
        </p>
      </div>
    </div>
  );
  const badge = (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${roleClasses[role]}`}>
      {role === 'admin' ? 'Admin' : 'user'}
    </span>
  );
  const created = formatCreatedAt(user.createdAt);

  if (variant === 'table') {
    return (
      <tr className="border-b border-stone-200 dark:border-slate-700 last:border-b-0">
        <th className="px-4 py-4 text-left font-normal" scope="row">
          {identity}
        </th>
        <td className="px-4 py-4">
          {badge}
        </td>
        <td className="px-4 py-4 text-sm text-stone-600 dark:text-slate-300">
          {created}
        </td>
        <td className="px-4 py-4 text-right">
          {deleteControl}
        </td>
      </tr>
    );
  }

  return (
    <article className="rounded-xl border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      {identity}
      <div className="mt-4 flex items-center justify-between gap-3">
        {badge}
        <span className="text-xs text-stone-500 dark:text-slate-400">
          {created}
        </span>
      </div>
      <div className="mt-4 flex justify-end">
        {deleteControl}
      </div>
    </article>
  );
}

UserRow.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    username: PropTypes.string.isRequired,
    role: PropTypes.string,
    createdAt: PropTypes.string,
    isDefault: PropTypes.bool,
  }).isRequired,
  currentUserId: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['table', 'card']),
  onDelete: PropTypes.func.isRequired,
};
