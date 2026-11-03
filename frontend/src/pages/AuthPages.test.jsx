/** Verify auth validation, role routing, and inherited theme presentation. */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App.jsx';
import { clearSession, getUsers, saveUsers } from '../utils/storage.js';

const browserStorage = window.localStorage;

/** Expose the current test route for assertions after form submissions. */
function RouteProbe() {
  const location = useLocation();
  return (
    <p aria-label="Current route" className="sr-only">
      {location.pathname}
    </p>
  );
}

/** Render a route and a screen-reader-visible route probe for form tests. */
function renderRoute(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <RouteProbe />
    </MemoryRouter>,
  );
}

describe('authentication pages', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, value: browserStorage });
    browserStorage.clear();
    saveUsers([]);
    clearSession();
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', { configurable: true, value: browserStorage });
  });

  it.each(['light', 'dark'])('shows the demo-only warning and a generic inline error for invalid login credentials in %s theme', async (theme) => {
    browserStorage.setItem('writespace_theme', theme);
    const user = userEvent.setup();
    renderRoute('/login');

    expect(screen.getByRole('main')).toHaveClass('bg-[#fbfaf7]');
    expect(screen.getByRole('note', { name: 'Demo security notice' })).toHaveTextContent(/plain text/i);
    await user.type(screen.getByLabelText('Username'), 'unknown');
    await user.type(screen.getByLabelText('Password'), 'incorrect');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid username or password.');
    expect(browserStorage.getItem('writespace_session')).toBeNull();
    expect(screen.getByRole('alert')).toHaveClass('dark:bg-slate-800', 'dark:text-red-300');
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/login');
  });

  it('shows a visible storage warning when browser storage access is denied', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('Storage access denied');
      },
    });
    renderRoute('/login');

    expect(screen.getByRole('status')).toHaveTextContent(/changes may not persist/i);
    expect(screen.getByRole('note', { name: 'Demo security notice' })).toBeInTheDocument();
  });

  it.each(['light', 'dark'])('signs in with demo admin credentials and routes to the admin dashboard in %s theme', async (theme) => {
    browserStorage.setItem('writespace_theme', theme);
    const user = userEvent.setup();
    renderRoute('/login');

    await user.type(screen.getByLabelText('Username'), 'admin');
    await user.type(screen.getByLabelText('Password'), 'admin');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByLabelText('Current route')).toHaveTextContent('/admin');
    expect(JSON.parse(browserStorage.getItem('writespace_session'))).toMatchObject({ username: 'admin', role: 'admin' });
  });

  it.each(['light', 'dark'])('registers a standard account and routes to the authenticated blog destination in %s theme', async (theme) => {
    browserStorage.setItem('writespace_theme', theme);
    const user = userEvent.setup();
    renderRoute('/register');

    await user.type(screen.getByLabelText('Display Name'), 'Casey Writer');
    await user.type(screen.getByLabelText('Username'), 'casey');
    await user.type(screen.getByLabelText('Password'), 'demo-secret');
    await user.type(screen.getByLabelText('Confirm Password'), 'demo-secret');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByLabelText('Current route')).toHaveTextContent('/blogs');
    expect(getUsers()).toHaveLength(1);
    expect(getUsers()[0]).toMatchObject({ displayName: 'Casey Writer', username: 'casey', role: 'user' });
    expect(JSON.parse(browserStorage.getItem('writespace_session'))).toMatchObject({ username: 'casey', role: 'user' });
  });

  it.each(['light', 'dark'])('shows linked field errors and does not register duplicate or mismatched accounts in %s theme', async (theme) => {
    browserStorage.setItem('writespace_theme', theme);
    const user = userEvent.setup();
    saveUsers([{ id: 'existing', displayName: 'Casey', username: 'casey', password: 'demo', role: 'user' }]);
    renderRoute('/register');

    await user.type(screen.getByLabelText('Display Name'), 'Another Casey');
    await user.type(screen.getByLabelText('Username'), 'CASEY');
    await user.type(screen.getByLabelText('Password'), 'one');
    await user.type(screen.getByLabelText('Confirm Password'), 'two');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(screen.getByText('That username is already taken.')).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match.')).toHaveClass('dark:text-red-300');
    expect(screen.getByLabelText('Confirm Password')).toHaveAttribute('aria-describedby', 'register-confirmPassword-error');
    expect(browserStorage.getItem('writespace_session')).toBeNull();
    expect(screen.getByLabelText('Username')).toHaveAttribute('aria-invalid', 'true');
    expect(getUsers()).toHaveLength(1);
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/register');
  });

  it.each(['light', 'dark'])('redirects an already-authenticated visitor away from login or registration by role in %s theme', (theme) => {
    browserStorage.setItem('writespace_theme', theme);
    localStorage.setItem('writespace_session', JSON.stringify({ userId: 'admin', username: 'admin', displayName: 'WriteSpace Administrator', role: 'admin' }));
    const { unmount } = renderRoute('/login');
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/admin');

    unmount();
    localStorage.setItem('writespace_session', JSON.stringify({ userId: 'u-1', username: 'ari', displayName: 'Ari Reader', role: 'user' }));
    renderRoute('/register');
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/blogs');
  });

  it.each(['/login', '/register'])('renders dark form surfaces and associated required errors on %s', async (path) => {
    browserStorage.setItem('writespace_theme', 'dark');
    const user = userEvent.setup();
    renderRoute(path);

    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByRole('main')).toHaveClass('dark:bg-slate-950', 'dark:text-slate-100');
    expect(screen.getByRole('region')).toHaveClass('dark:bg-slate-900', 'dark:border-slate-700');
    expect(screen.getByRole('note', { name: 'Demo security notice' })).toHaveClass(
      'dark:bg-slate-800', 'dark:text-amber-200', 'dark:border-amber-700', 'mt-6',
    );
    const labels = path === '/login'
      ? ['Username', 'Password']
      : ['Display Name', 'Username', 'Password', 'Confirm Password'];
    for (const label of labels) {
      expect(screen.getByLabelText(label)).toHaveClass(
        'dark:bg-slate-800', 'dark:text-slate-100', 'dark:border-slate-600',
        'dark:focus:border-indigo-300', 'dark:focus-visible:ring-indigo-300',
      );
      expect(screen.getByText(label, { selector: 'label' })).toHaveClass('dark:text-slate-200');
    }
    if (path === '/login') {
      expect(screen.getByText(/Demo admin credentials/)).toHaveClass('dark:bg-slate-800', 'dark:text-slate-200');
    }
    expect(screen.getByRole('link', { name: path === '/login' ? 'Register' : 'Login' })).toHaveClass(
      'dark:text-indigo-300', 'dark:focus-visible:outline-indigo-300',
    );
    await user.click(screen.getByRole('button', { name: path === '/login' ? 'Login' : 'Create account' }));
    for (const label of labels) {
      const input = screen.getByLabelText(label);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      const error = document.getElementById(input.getAttribute('aria-describedby'));
      expect(error).toHaveAttribute('role', 'alert');
      expect(error).toHaveClass('dark:text-red-300');
      expect(error).not.toBeEmptyDOMElement();
    }
    expect(screen.getByLabelText('Current route')).toHaveTextContent(path);
    expect(getUsers()).toHaveLength(0);
    expect(browserStorage.getItem('writespace_session')).toBeNull();
  });

});
