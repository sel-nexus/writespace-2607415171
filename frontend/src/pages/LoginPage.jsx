import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import DemoWarning from '../components/DemoWarning.jsx';
import { getCurrentSession, getHomeRoute, login } from '../utils/auth.js';
import { getStorageWarning } from '../utils/storage.js';

/** Render browser-local demo login and redirect successful sessions by role. */
export default function LoginPage() {
  const navigate = useNavigate();
  const session = getCurrentSession();
  const storageWarning = getStorageWarning();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  if (session) {
    return <Navigate replace to={getHomeRoute(session)} />;
  }

  /** Validate credentials and persist a session before changing routes. */
  function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    const result = login(username, password);
    setErrors(result.errors || {});
    if (!result.success) {
      setFormError(result.error || 'Please correct the highlighted fields.');
      return;
    }
    navigate(getHomeRoute(result.session), { replace: true });
  }

  return (
    <main className="min-h-[100dvh] bg-[#fbfaf7] px-5 py-12 text-stone-900 sm:px-8">
      <div className="mx-auto max-w-md">
        {storageWarning && <p className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="status">{storageWarning}</p>}
        <Link aria-label="WriteSpace home" className="font-semibold tracking-tight text-stone-900" to="/">WriteSpace</Link>
        <section aria-labelledby="login-title" className="mt-8 rounded-2xl border border-stone-200 bg-white p-7 shadow-sm sm:p-9">
          <h1 className="font-display text-3xl font-medium tracking-tight" id="login-title">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">Sign in to read and write in this browser.</p>
          <DemoWarning className="mt-6" />
          <p className="mt-5 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">Demo admin credentials: <code>admin</code> / <code>admin</code></p>
          <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-sm font-medium text-stone-800" htmlFor="login-username">Username</label>
              <input aria-describedby={errors.username ? 'login-username-error' : undefined} aria-invalid={Boolean(errors.username)} aria-required="true" autoComplete="username" className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-3 text-stone-900 focus:border-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700" id="login-username" name="username" onChange={(event) => setUsername(event.target.value)} value={username} />
              {errors.username && <p className="mt-1 text-sm text-red-700" id="login-username-error" role="alert">{errors.username}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-800" htmlFor="login-password">Password</label>
              <input aria-describedby={errors.password ? 'login-password-error' : undefined} aria-invalid={Boolean(errors.password)} aria-required="true" autoComplete="current-password" className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-3 text-stone-900 focus:border-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700" id="login-password" name="password" onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
              {errors.password && <p className="mt-1 text-sm text-red-700" id="login-password-error" role="alert">{errors.password}</p>}
            </div>
            {formError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{formError}</p>}
            <button className="w-full rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" type="submit">Login</button>
          </form>
          <p className="mt-6 text-sm text-stone-600">New to WriteSpace? <Link className="font-semibold text-indigo-800 underline underline-offset-4" to="/register">Register</Link></p>
        </section>
      </div>
    </main>
  );
}

