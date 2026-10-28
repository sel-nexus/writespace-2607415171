import PropTypes from 'prop-types';

const toneClasses = {
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-950',
  violet: 'border-violet-200 bg-violet-50 text-violet-950',
  pink: 'border-pink-200 bg-pink-50 text-pink-950',
  teal: 'border-teal-200 bg-teal-50 text-teal-950',
};

/** Render one accessible dashboard metric using its named accent tone.
 *
 * Args:
 *   title: Short metric label.
 *   value: Numeric metric value.
 *   tone: Accent tone name from the supported set.
 */
export default function StatCard({ title, value, tone = 'indigo' }) {
  return (
    <article className={`rounded-2xl border p-5 ${toneClasses[tone]}`}>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-3 font-display text-4xl font-medium tabular-nums" role="status">{value}</p>
    </article>
  );
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  tone: PropTypes.oneOf(['indigo', 'violet', 'pink', 'teal']),
};
