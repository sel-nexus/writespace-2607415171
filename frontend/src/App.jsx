import { Link } from 'react-router-dom';

/** Render the initial WriteSpace application entry surface. */
export default function App() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20 text-slate-800">
      <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">WriteSpace</p>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">A home for your words.</h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
          A quiet place to read and publish plain-text writing, stored in this browser.
        </p>
        <Link className="mt-8 inline-flex rounded-full bg-indigo-700 px-6 py-3 font-semibold text-white hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2" to="/">
          Visit WriteSpace
        </Link>
      </section>
    </main>
  );
}
