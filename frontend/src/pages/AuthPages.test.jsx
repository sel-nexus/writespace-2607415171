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
  return <p aria-label="Current route" className="sr-only">{location.pathname}</p>;
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

  it('shows the demo-only warning and a generic inline error for invalid login credentials', async () => {
    const user = userEvent.setup();
    renderRoute('/login');

    expect(screen.getByRole('main')).toHaveClass('bg-[#fbfaf7]');
    expect(screen.getByRole('note', { name: 'Demo security notice' })).toHaveTextContent(/plain text/i);
    await user.type(screen.getByLabelText('Username'), 'unknown');
    await user.type(screen.getByLabelText('Password'), 'incorrect');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid username or password.');
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

  it('signs in with demo admin credentials and routes to the admin dashboard', async () => {
    const user = userEvent.setup();
    renderRoute('/login');

    await user.type(screen.getByLabelText('Username'), 'admin');
    await user.type(screen.getByLabelText('Password'), 'admin');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(screen.getByLabelText('Current route')).toHaveTextContent('/admin');
  });

  it('registers a standard account and routes to the authenticated blog destination', async () => {
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
  });

  it('shows linked field errors and does not register duplicate or mismatched accounts', async () => {
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
    expect(screen.getByLabelText('Username')).toHaveAttribute('aria-invalid', 'true');
    expect(getUsers()).toHaveLength(1);
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/register');
  });

  it('redirects an already-authenticated visitor away from login or registration by role', () => {
    localStorage.setItem('writespace_session', JSON.stringify({ userId: 'admin', username: 'admin', displayName: 'WriteSpace Administrator', role: 'admin' }));
    const { unmount } = renderRoute('/login');
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/admin');

    unmount();
    localStorage.setItem('writespace_session', JSON.stringify({ userId: 'u-1', username: 'ari', displayName: 'Ari Reader', role: 'user' }));
    renderRoute('/register');
    expect(screen.getByLabelText('Current route')).toHaveTextContent('/blogs');
  });
});
