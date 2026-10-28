import PropTypes from 'prop-types';

/** Return the required static role avatar markup.
 *
 * Args:
 *   role: Account role to display.
 *
 * Returns:
 *   A labeled, static role-colored avatar element.
 */
export function getAvatar(role) {
  const isAdmin = String(role || '').toLowerCase() === 'admin';
  return (
    <span aria-label={isAdmin ? 'Administrator avatar' : 'Reader avatar'} className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-base ${isAdmin ? 'bg-violet-600' : 'bg-indigo-500'}`} role="img">
      {isAdmin ? '👑' : '📖'}
    </span>
  );
}

/** Render a role avatar for use in authenticated navigation and bylines.
 *
 * Args:
 *   role: Account role to display.
 */
export default function Avatar({ role }) {
  return getAvatar(role);
}

Avatar.propTypes = {
  role: PropTypes.oneOf(['admin', 'user']).isRequired,
};
