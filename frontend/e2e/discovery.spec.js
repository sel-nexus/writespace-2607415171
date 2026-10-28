import { expect, test } from '@playwright/test';

/** Capture browser console and uncaught page errors for a navigation journey.
 *
 * Args:
 *   page: Playwright page to observe.
 *
 * Returns:
 *   A callback that asserts no browser errors were observed.
 */
function captureBrowserErrors(page) {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  return () => expect(errors, errors.join('\n')).toEqual([]);
}

test('guest discovers WriteSpace and sees reading and registration destinations', async ({ page }) => {
  const assertNoBrowserErrors = captureBrowserErrors(page);
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'WriteSpace' })).toBeVisible();
  await expect(page.getByText('Your thoughts. Your space. Beautifully simple.')).toBeVisible();
  await expect(page.getByText(/stored only in this browser/i)).toBeVisible();
  await expect(page.getByText('No posts yet - check back soon!')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start reading' })).toHaveAttribute('href', '/login');
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/register');


  assertNoBrowserErrors();
});

test('locally signed-in admin sees the newest local story and admin links', async ({ page }) => {
  const assertNoBrowserErrors = captureBrowserErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('writespace_session', JSON.stringify({ user: { name: 'Morgan Admin', role: 'admin' } }));
    localStorage.setItem('writespace_posts', JSON.stringify([
      { id: 'old', title: 'Older local story', createdAt: '2024-01-01', excerpt: 'Old browser writing.' },
      { id: 'new', title: 'Newest local story', createdAt: '2025-05-01', excerpt: 'Saved on this device.' },
    ]));
  });
  await page.goto('/');

  await expect(page.getByText('Morgan Admin')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/admin');
  await expect(page.getByRole('link', { name: 'Start reading' })).toHaveAttribute('href', '/blogs');
  await expect(page.getByRole('link', { name: 'Newest local story' })).toHaveAttribute('href', '/blog/new');
  await expect(page.getByText('Saved on this device.')).toBeVisible();


  assertNoBrowserErrors();
});

test('signed-in readers see their reading dashboard and the home remains usable on mobile', async ({ page }) => {
  const assertNoBrowserErrors = captureBrowserErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('writespace_session', JSON.stringify({ user: { name: 'Jordan Reader', role: 'user' } }));
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'WriteSpace' })).toBeVisible();
  await expect(page.getByText('Your thoughts. Your space. Beautifully simple.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Jordan Reader profile' })).toHaveAttribute('href', '/blogs');
  await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/blogs');
  await expect(page.getByRole('link', { name: 'Start reading' })).toHaveAttribute('href', '/blogs');
  await expect(page.getByRole('heading', { name: 'Space for the words that matter.' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Footer navigation' })).toBeVisible();
  assertNoBrowserErrors();
});

 test('continues with a visible warning when browser storage is unavailable', async ({ page }) => {
  const assertNoBrowserErrors = captureBrowserErrors(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('Storage access denied');
      },
    });
  });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'WriteSpace' })).toBeVisible();
  await expect(page.getByText('Your thoughts. Your space. Beautifully simple.')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('temporary in-memory data');
  assertNoBrowserErrors();
});
