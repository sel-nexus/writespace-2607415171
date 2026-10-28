import { expect, test } from '@playwright/test';

/** Record uncaught browser errors while an identity journey is running.
 *
 * Args:
 *   page: Browser page to observe.
 *
 * Returns:
 *   An assertion callback for any captured browser errors.
 */
function monitorErrors(page) {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  return () => expect(errors, errors.join('\n')).toEqual([]);
}

test('visitor registers a local standard account and sees the persisted identity', async ({ page }) => {
  const assertNoErrors = monitorErrors(page);
  await page.goto('/register');
  await expect(page.getByRole('note', { name: 'Demo security notice' })).toContainText('plain text');
  await page.getByLabel('Display Name').fill('Quinn Writer');
  await page.getByLabel('Username').fill('quinn');
  await page.getByLabel('Password').fill('demo-pass');
  await page.getByLabel('Confirm Password').fill('demo-pass');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/\/blogs$/);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('writespace_session') || 'null')?.username)).toBe('quinn');
  await page.reload();
  await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/blogs');
  assertNoErrors();
});

test('built-in admin signs in and invalid credentials remain an inline error', async ({ page }) => {
  const assertNoErrors = monitorErrors(page);
  await page.goto('/login');
  await page.getByLabel('Username').fill('invalid');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('alert')).toContainText('Invalid username or password.');

  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  assertNoErrors();
});

test('registration rejects duplicate names and mismatched password confirmation', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('writespace_users', JSON.stringify([
      { id: 'existing', displayName: 'Casey', username: 'casey', password: 'local', role: 'user' },
    ]));
  });
  await page.goto('/register');
  await page.getByLabel('Display Name').fill('A writer');
  await page.getByLabel('Username').fill('CASEY');
  await page.getByLabel('Password').fill('first');
  await page.getByLabel('Confirm Password').fill('second');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByText('That username is already taken.')).toBeVisible();
  await expect(page.getByText('Passwords do not match.')).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
});

test('logout clears the local session and returns the visitor home', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('writespace_session', JSON.stringify({ userId: 'u-1', username: 'ari', displayName: 'Ari Reader', role: 'user' }));
  });
  await page.goto('/blogs');
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL('/');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('writespace_session'))).toBeNull();
});
