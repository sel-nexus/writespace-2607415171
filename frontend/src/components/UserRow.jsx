import PropTypes from 'prop-types';
import Avatar from './Avatar.jsx';

const roleClasses = {
  admin: 'bg-violet-100 text-violet-800 ring-violet-300',
  user: 'bg-indigo-100 text-indigo-800 ring-indigo-300',
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
    <button aria-label={`Delete ${user.displayName || user.username}`} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700" disabled={Boolean(disabledReason)} onClick={() => onDelete(user)} title={disabledReason || 'Delete account'} type="button">
      Delete
    </button>
  );
  const identity = (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar role={role} />
      <div className="min-w-0">
        <p className="truncate font-semibold text-stone-900">{user.displayName || 'Unnamed account'}</p>
        <p className="truncate text-sm text-stone-500">@{user.username}</p>
      </div>
    </div>
  );
  const badge = <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${roleClasses[role]}`}>{role === 'admin' ? 'Admin' : 'user'}</span>;
  const created = formatCreatedAt(user.createdAt);

  if (variant === 'table') {
    return (
      <tr className="border-b border-stone-200 last:border-b-0">
        <th className="px-4 py-4 text-left font-normal" scope="row">{identity}</th>
        <td className="px-4 py-4">{badge}</td>
        <td className="px-4 py-4 text-sm text-stone-600">{created}</td>
        <td className="px-4 py-4 text-right">{deleteControl}</td>
      </tr>
    );
  }

  return (
    <article className="rounded-xl border border-stone-200 bg-white p-4">
      {identity}
      <div className="mt-4 flex items-center justify-between gap-3">
        {badge}
        <span className="text-xs text-stone-500">{created}</span>
      </div>
      <div className="mt-4 flex justify-end">{deleteControl}</div>
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
