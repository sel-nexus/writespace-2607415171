import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import DemoWarning from '../components/DemoWarning.jsx';
import UserRow from '../components/UserRow.jsx';
import { getCurrentSession } from '../utils/auth.js';
import { createManagedUser, deleteManagedUser, getManagedUsers } from '../utils/admin.js';
import { getStorageWarning } from '../utils/storage.js';

const initialForm = { displayName: '', username: '', password: '', role: 'user' };

/** Render local account creation and deletion controls for an administrator. */
export default function UsersPage() {
  const session = getCurrentSession();
  const [users, setUsers] = useState(() => getManagedUsers());
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const warning = getStorageWarning();

  /** Update one controlled account field and clear prior field feedback. */
  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setFormError('');
  }

  /** Validate and persist a new account using the shared admin operation. */
  function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setNotice('');
    const result = createManagedUser(form, session);
    setErrors(result.errors || {});
    if (!result.success) {
      setFormError(result.error || 'Please correct the highlighted fields.');
      return;
    }
    setUsers(getManagedUsers());
    setForm(initialForm);
    setNotice(`${result.user.displayName} was added as ${result.user.role === 'admin' ? 'an admin' : 'a user'}.`);
  }

  /** Confirm deletion and preserve authored posts by changing only users. */
  function handleDelete(user) {
    if (!window.confirm(`Delete ${user.displayName || user.username}? Authored posts will remain in this browser.`)) {
      return;
    }
    const result = deleteManagedUser(user.id, session);
    if (!result.success) {
      setFormError(result.error);
      return;
    }
    setUsers(getManagedUsers());
    setNotice(`${result.user.displayName || result.user.username} was removed. Their posts remain saved.`);
  }

  return (
    <div className="min-h-[100dvh] bg-[#fbfaf7] text-stone-900">
      <Navbar session={session} />
      {warning && (
        <p
          className="border-b border-amber-300 bg-amber-50 px-5 py-3 text-center text-sm text-amber-950"
          role="status"
        >
          {warning}
        </p>
      )}
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <Link
          className="text-sm font-semibold text-indigo-800 underline underline-offset-4"
          to="/admin"
        >
          Back to dashboard
        </Link>
        <header className="mt-7">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-violet-800">Administrator tools</p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">Manage users</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
            Create local accounts and manage access for this browser. Removing an account never removes its saved posts.
          </p>
        </header>

        <section
          aria-labelledby="create-user-title"
          className="mt-9 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h2 className="font-display text-2xl font-medium" id="create-user-title">
            Add an account
          </h2>
          <DemoWarning className="mt-4" />
          <form className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-sm font-medium text-stone-800" htmlFor="admin-display-name">
                Display Name
              </label>
              <input
                aria-describedby={errors.displayName ? 'admin-display-name-error' : undefined}
                aria-invalid={Boolean(errors.displayName)}
                aria-required="true"
                className={
                  "mt-2 w-full rounded-lg border border-stone-300 px-3 py-3 " +
                  "focus:border-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700"
                }
                id="admin-display-name"
                name="displayName"
                onChange={updateField}
                value={form.displayName}
              />
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-700" id="admin-display-name-error" role="alert">
                  {errors.displayName}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-800" htmlFor="admin-username">
                Username
              </label>
              <input
                aria-describedby={errors.username ? 'admin-username-error' : undefined}
                aria-invalid={Boolean(errors.username)}
                aria-required="true"
                autoComplete="off"
                className={
                  "mt-2 w-full rounded-lg border border-stone-300 px-3 py-3 " +
                  "focus:border-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700"
                }
                id="admin-username"
                name="username"
                onChange={updateField}
                value={form.username}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-700" id="admin-username-error" role="alert">
                  {errors.username}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-800" htmlFor="admin-password">
                Password
              </label>
              <input
                aria-describedby={errors.password ? 'admin-password-error' : undefined}
                aria-invalid={Boolean(errors.password)}
                aria-required="true"
                autoComplete="new-password"
                className={
                  "mt-2 w-full rounded-lg border border-stone-300 px-3 py-3 " +
                  "focus:border-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700"
                }
                id="admin-password"
                name="password"
                onChange={updateField}
                type="password"
                value={form.password}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-700" id="admin-password-error" role="alert">
                  {errors.password}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-800" htmlFor="admin-role">
                Role
              </label>
              <select
                aria-describedby={errors.role ? 'admin-role-error' : undefined}
                aria-invalid={Boolean(errors.role)}
                aria-required="true"
                className={
                  "mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-3 " +
                  "focus:border-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700"
                }
                id="admin-role"
                name="role"
                onChange={updateField}
                value={form.role}
              >
                <option value="admin">Admin</option>
                <option value="user">user</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-700" id="admin-role-error" role="alert">
                  {errors.role}
                </p>
              )}
            </div>
            {formError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800 md:col-span-2" role="alert">
                {formError}
              </p>
            )}
            {notice && (
              <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 md:col-span-2" role="status">
                {notice}
              </p>
            )}
            <div className="md:col-span-2 md:flex md:justify-end">
              <button
                className={
                  "w-full rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800 " +
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 md:w-auto"
                }
                type="submit"
              >
                Create account
              </button>
            </div>
          </form>
        </section>

        <section aria-labelledby="accounts-title" className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-medium tracking-tight" id="accounts-title">
                Accounts
              </h2>
              <p className="mt-2 text-sm text-stone-500">{users.length} accounts, including the built-in administrator.</p>
            </div>
          </div>
          <div className="mt-5 hidden overflow-hidden rounded-2xl border border-stone-200 bg-white md:block">
            <table className="w-full border-collapse text-left">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3" scope="col">
                    Account
                  </th>
                  <th className="px-4 py-3" scope="col">
                    Role
                  </th>
                  <th className="px-4 py-3" scope="col">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right" scope="col">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserRow
                    currentUserId={session.userId}
                    key={user.id}
                    onDelete={handleDelete}
                    user={user}
                    variant="table"
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 grid gap-3 md:hidden">
            {users.map((user) => (
              <UserRow
                currentUserId={session.userId}
                key={user.id}
                onDelete={handleDelete}
                user={user}
                variant="card"
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
