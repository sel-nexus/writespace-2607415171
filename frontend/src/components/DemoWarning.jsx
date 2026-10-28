import PropTypes from 'prop-types';

/** Warn that WriteSpace uses insecure, browser-local demo credentials.
 *
 * Args:
 *   className: Optional classes for placement on the authentication page.
 */
export default function DemoWarning({ className = '' }) {
  return (
    <aside aria-label="Demo security notice" className={`rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950 ${className}`} role="note">
      <strong className="font-semibold">Demo only:</strong> passwords are stored as plain text in this browser. Do not use a real password or save sensitive information here.
    </aside>
  );
}

DemoWarning.propTypes = {
  className: PropTypes.string,
};
