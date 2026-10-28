import { expect, test } from '@playwright/test';

/** Collect console and uncaught page errors during an administrator journey.
 *
 * Args:
 *   page: Browser page to observe.
 *
 * Returns:
 *   An assertion callback for captured browser errors.
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

const samplePosts = Array.from({ length: 6 }, (_, index) => ({
  id: `admin-post-${index + 1}`,
  title: `Community post ${index + 1}`,
  content: `Body of community post ${index + 1}`,
  createdAt: `2026-04-0${index + 1}T12:00:00.000Z`,
  authorId: index % 2 ? 'writer-1' : 'writer-2',
  authorName: index % 2 ? 'Ari Writer' : 'Riley Writer',
}));

test('administrator dashboard shows distinct local totals and the five newest posts', async ({ page }) => {
  const assertNoErrors = monitorErrors(page);
  await page.addInitScript((posts) => {
    localStorage.setItem('writespace_session', JSON.stringify({ userId: 'admin', username: 'admin', displayName: 'WriteSpace Administrator', role: 'admin' }));
    localStorage.setItem('writespace_users', JSON.stringify([
      { id: 'writer-1', username: 'ari', displayName: 'Ari Writer', password: 'demo', role: 'user' },
      { id: 'admin-2', username: 'morgan', displayName: 'Morgan Admin', password: 'demo', role: 'admin' },
      { id: 'writer-2', username: 'riley', displayName: 'Riley Writer', password: 'demo', role: 'user' },
    ]));
    localStorage.setItem('writespace_posts', JSON.stringify(posts));
  }, samplePosts);
  await page.goto('/admin');

  await expect(page.getByRole('heading', { name: 'Community overview' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Total Posts' }).locator('..')).toContainText('6');
  await expect(page.getByRole('heading', { name: 'Total Users' }).locator('..')).toContainText('3');
  await expect(page.getByRole('heading', { name: 'Total Admins' }).locator('..')).toContainText('2');
  await expect(page.getByRole('heading', { name: 'Total users' }).locator('..')).toContainText('2');
  const recentPosts = page.getByRole('region', { name: 'Recent posts' });
  await expect(recentPosts.getByRole('article')).toHaveCount(5);
  await expect(recentPosts.getByRole('link', { name: 'Community post 6' })).toHaveAttribute('href', '/blog/admin-post-6');
  await expect(recentPosts.getByRole('link', { name: 'Community post 1' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Write New Post' })).toHaveAttribute('href', '/write');
  await expect(page.getByRole('link', { name: 'Manage Users' })).toHaveAttribute('href', '/users');
  assertNoErrors();
});

test('administrator creates and removes a unique user while authored posts remain saved', async ({ page }) => {
  const assertNoErrors = monitorErrors(page);
  await page.addInitScript((posts) => {
    localStorage.setItem('writespace_session', JSON.stringify({ userId: 'admin', username: 'admin', displayName: 'WriteSpace Administrator', role: 'admin' }));
    localStorage.setItem('writespace_users', JSON.stringify([
      { id: 'writer-1', username: 'ari', displayName: 'Ari Writer', password: 'demo', role: 'user', createdAt: '2026-02-01T12:00:00.000Z' },
      { id: 'writer-2', username: 'riley', displayName: 'Riley Writer', password: 'demo', role: 'user', createdAt: '2026-02-02T12:00:00.000Z' },
    ]));
    localStorage.setItem('writespace_posts', JSON.stringify(posts));
  }, samplePosts);
  await page.goto('/users');

  await expect(page.getByRole('heading', { name: 'Manage users' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete WriteSpace Administrator' }).first()).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Delete Ari Writer' }).first()).toBeDisabled();
  await page.getByLabel('Display Name').fill('Taylor Writer');
  await page.getByLabel('Username').fill('taylor');
  await page.getByLabel('Password').fill('demo-only');
  await page.getByLabel('Role').selectOption('user');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('status')).toContainText('Taylor Writer was added as a user.');
  await expect(page.getByRole('button', { name: 'Delete Taylor Writer' }).first()).toBeDisabled();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('writespace_users')).some((user) => user.username === 'taylor'))).toBe(true);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete Riley Writer' }).first().click();
  await expect(page.getByRole('status')).toContainText('Their posts remain saved.');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('writespace_users')).some((user) => user.username === 'riley'))).toBe(false);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('writespace_posts')).length)).toBe(6);
  assertNoErrors();
});

test('standard user is redirected away from admin dashboard and user management', async ({ page }) => {
  const assertNoErrors = monitorErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('writespace_session', JSON.stringify({ userId: 'writer-1', username: 'ari', displayName: 'Ari Writer', role: 'user' }));
  });
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/blogs$/);
  await expect(page.getByRole('heading', { name: 'All Blogs' })).toBeVisible();
  await page.goto('/users');
  await expect(page).toHaveURL(/\/blogs$/);
  await expect(page.getByRole('heading', { name: 'All Blogs' })).toBeVisible();
  assertNoErrors();
});
