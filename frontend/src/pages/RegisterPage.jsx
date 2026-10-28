import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import DemoWarning from '../components/DemoWarning.jsx';
import { getCurrentSession, getHomeRoute, register } from '../utils/auth.js';
import { getStorageWarning } from '../utils/storage.js';

/** Render local standard-user registration with field-level validation. */
export default function RegisterPage() {
  const navigate = useNavigate();
  const session = getCurrentSession();
  const storageWarning = getStorageWarning();
  const [form, setForm] = useState({ displayName: '', username: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  if (session) {
    return <Navigate replace to={getHomeRoute(session)} />;
  }

  /** Update one controlled registration field and clear its prior error. */
  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setFormError('');
  }

  /** Validate and persist a new local standard-user account. */
  function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    const result = register(form);
    setErrors(result.errors || {});
    if (!result.success) {
      setFormError('Please correct the highlighted fields.');
      return;
    }
    navigate('/blogs', { replace: true });
  }

  const fields = [
    { name: 'displayName', label: 'Display Name', type: 'text', autoComplete: 'name' },
    { name: 'username', label: 'Username', type: 'text', autoComplete: 'username' },
    { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', autoComplete: 'new-password' },
  ];

  return (
    <main className="min-h-[100dvh] bg-[#fbfaf7] px-5 py-12 text-stone-900 sm:px-8">
      <div className="mx-auto max-w-md">
        {storageWarning && <p className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="status">{storageWarning}</p>}
        <Link aria-label="WriteSpace home" className="font-semibold tracking-tight text-stone-900" to="/">WriteSpace</Link>
        <section aria-labelledby="register-title" className="mt-8 rounded-2xl border border-stone-200 bg-white p-7 shadow-sm sm:p-9">
          <h1 className="font-display text-3xl font-medium tracking-tight" id="register-title">Create your account</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">Start reading and writing in this browser.</p>
          <DemoWarning className="mt-6" />
          <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
            {fields.map((field) => {
              const id = `register-${field.name}`;
              const errorId = `${id}-error`;
              return (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-stone-800" htmlFor={id}>{field.label}</label>
                  <input aria-describedby={errors[field.name] ? errorId : undefined} aria-invalid={Boolean(errors[field.name])} aria-required="true" autoComplete={field.autoComplete} className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-3 text-stone-900 focus:border-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700" id={id} name={field.name} onChange={updateField} type={field.type} value={form[field.name]} />
                  {errors[field.name] && <p className="mt-1 text-sm text-red-700" id={errorId} role="alert">{errors[field.name]}</p>}
                </div>
              );
            })}
            {formError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{formError}</p>}
            <button className="w-full rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700" type="submit">Create account</button>
          </form>
          <p className="mt-6 text-sm text-stone-600">Already have an account? <Link className="font-semibold text-indigo-800 underline underline-offset-4" to="/login">Login</Link></p>
        </section>
      </div>
    </main>
  );
}

