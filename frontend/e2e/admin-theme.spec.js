/** Exercise dark administrator controls through real UI navigation and saved state. */
import { expect, test } from '@playwright/test';

/** Observe browser failures before entering the application.
 * Args:
 *   page: Browser page for the administrator journey.
 * Returns:
 *   A final assertion for console errors and uncaught exceptions.
 */
function monitorErrors(page) {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  return () => expect(errors, errors.join('\n')).toEqual([]);
}

for (const width of [1280, 375]) {
  test(`dark admin validation, safeguards and persistence at ${width}px`, async ({ page }, testInfo) => {
    const assertNoErrors = monitorErrors(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Login' }).click();
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password', { exact: true }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.locator('html')).toHaveClass(/dark/);
    const overview = page.getByRole('heading', { name: 'Community overview' });
    await expect(overview).toBeVisible();
    await expect(overview.locator('..')).toHaveCSS('color', 'rgb(255, 255, 255)');
    for (const [name, count] of [['Total Posts', '0'], ['Total Users', '0'], ['Total Admins', '1'], ['Total users', '0']]) {
      const card = page.getByRole('heading', { name, exact: true }).locator('..');
      await expect(card.getByRole('status')).toHaveText(count);
      await expect(card).toHaveCSS('background-color', 'rgb(15, 23, 42)');
    }
    await expect(page.getByRole('region', { name: 'Recent posts' })).toContainText('No posts yet.');
    await page.getByRole('link', { name: 'Write New Post' }).click();
    await page.getByLabel('Title').fill('Dark community activity');
    await page.getByLabel('Content').fill('A persisted community update from the administrator.');
    await page.getByRole('button', { name: 'Publish post' }).click();
    await expect(page.getByRole('heading', { name: 'Dark community activity' })).toBeVisible();
    await page.getByRole('link', { name: 'WriteSpace home' }).click();
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Dashboard' }).click();
    const activity = page.getByRole('region', { name: 'Recent posts' });
    await expect(activity.getByRole('article')).toHaveCount(1);
    await expect(activity.getByRole('link', { name: 'Dark community activity' })).toBeVisible();
    await expect(activity.getByRole('article').locator('..')).toHaveCSS('background-color', 'rgb(15, 23, 42)');
    await expect(page.getByRole('heading', { name: 'Total Posts', exact: true }).locator('..').getByRole('status')).toHaveText('1');

    await page.getByRole('link', { name: 'Manage Users' }).click();
    await expect(page).toHaveURL(/\/users$/);
    const form = page.getByRole('region', { name: 'Add an account' });
    await expect(form).toHaveCSS('background-color', 'rgb(15, 23, 42)');
    await expect(page.getByLabel('Username')).toHaveCSS('background-color', 'rgb(30, 41, 59)');
    await expect(page.getByRole('note', { name: 'Demo security notice' })).toHaveCSS('color', 'rgb(253, 230, 138)');
    await page.getByRole('button', { name: 'Create account' }).click();
    for (const message of ['Display name is required.', 'Username is required.', 'Password is required.']) {
      await expect(page.getByText(message)).toBeVisible();
      await expect(page.getByText(message)).toHaveCSS('color', 'rgb(252, 165, 165)');
    }
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_users') || '[]'))).toEqual([]);
    await page.getByLabel('Display Name').fill('Duplicate Admin');
    await page.getByLabel('Username').fill('ADMIN');
    await page.getByLabel('Password').fill('demo-only');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('That username is already taken.')).toBeVisible();
    await expect(page.getByLabel('Username')).toHaveAttribute('aria-invalid', 'true');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_users') || '[]'))).toEqual([]);

    for (const account of [
      { name: 'Theme Reader', username: 'themereader', role: 'user' },
      { name: 'Theme Admin', username: 'themeadmin', role: 'admin' },
    ]) {
      await page.getByLabel('Display Name').fill(account.name);
      await page.getByLabel('Username').fill(account.username);
      await page.getByLabel('Password').fill('demo-only');
      await page.getByLabel('Role').selectOption(account.role);
      await page.getByRole('button', { name: 'Create account' }).click();
      await expect(page.getByRole('status')).toContainText(`${account.name} was added`);
      await expect.poll(() => page.evaluate((username) => JSON.parse(localStorage.getItem('writespace_users') || '[]').find((user) => user.username === username), account.username)).toMatchObject({ displayName: account.name, role: account.role });
    }
    const accounts = page.getByRole('region', { name: 'Accounts' });
    const visibleAccounts = width < 768 ? accounts.getByRole('article') : accounts.getByRole('row').filter({ has: page.getByRole('button') });
    await expect(visibleAccounts).toHaveCount(3);
    await expect(visibleAccounts.filter({ hasText: 'Theme Reader' })).toContainText('user');
    await expect(visibleAccounts.filter({ hasText: 'Theme Admin' })).toContainText('Admin');
    await expect(accounts.getByRole('button', { name: 'Delete WriteSpace Administrator' }).locator('visible=true')).toBeDisabled();
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(visibleAccounts.filter({ hasText: 'Theme Admin' })).toBeVisible();
    await page.getByRole('link', { name: 'Back to dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'Total Users', exact: true }).locator('..').getByRole('status')).toHaveText('2');
    await expect(page.getByRole('heading', { name: 'Total Admins', exact: true }).locator('..').getByRole('status')).toHaveText('2');
    await expect(page.getByRole('heading', { name: 'Total users', exact: true }).locator('..').getByRole('status')).toHaveText('1');
    if (width < 768) await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await page.getByRole('link', { name: 'Users', exact: true }).locator('visible=true').click();
    await expect(page).toHaveURL(/\/users$/);

    await page.getByRole('button', { name: 'Logout' }).click();
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Login' }).click();
    await page.getByLabel('Username').fill('themeadmin');
    await page.getByLabel('Password', { exact: true }).fill('demo-only');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'Manage Users' }).click();
    const self = accounts.getByRole('button', { name: 'Delete Theme Admin' }).locator('visible=true');
    await expect(self).toBeDisabled();
    await expect(self).toHaveAttribute('title', 'You cannot delete your own account.');
    const reader = accounts.getByRole('button', { name: 'Delete Theme Reader' }).locator('visible=true');
    page.once('dialog', (dialog) => dialog.dismiss());
    await reader.click();
    await expect(reader).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_users') || '[]').length)).toBe(2);
    page.once('dialog', (dialog) => dialog.accept());
    await reader.click();
    await expect(reader).toHaveCount(0);
    await expect(page.getByRole('status')).toContainText('Their posts remain saved.');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_posts') || '[]'))).toEqual([
      expect.objectContaining({ title: 'Dark community activity', authorId: 'admin' }),
    ]);
    await page.reload();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_users') || '[]').map((user) => user.username))).toEqual(['themeadmin']);
    await expect(self).toBeDisabled();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.screenshot({ path: testInfo.outputPath(`dark-admin-${width}.png`), fullPage: true });
    assertNoErrors();
  });
}
