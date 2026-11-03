/** Exercise dark authentication through real navigation and browser-local persistence. */
import { expect, test } from '@playwright/test';

/** Observe browser failures before entering the application.
 * Args:
 *   page: Browser page used for the identity journey.
 * Returns:
 *   A final assertion for all console errors and uncaught exceptions.
 */
function monitorErrors(page) {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  return () => expect(errors, errors.join('\n')).toEqual([]);
}

for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
  test(`dark auth rejects invalid input and preserves user/admin journeys at ${viewport.width}px`, async ({ page }, testInfo) => {
    const assertNoErrors = monitorErrors(page);
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Login' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByRole('main')).toHaveCSS('background-color', 'rgb(2, 6, 23)');
    await expect(page.getByRole('region', { name: 'Welcome back' })).toHaveCSS('background-color', 'rgb(15, 23, 42)');
    await expect(page.getByRole('note', { name: 'Demo security notice' })).toContainText('plain text');
    await expect(page.getByRole('note', { name: 'Demo security notice' })).toHaveCSS('color', 'rgb(253, 230, 138)');
    await page.getByLabel('Username').fill('unknown');
    await page.getByLabel('Password', { exact: true }).fill('wrong');
    await expect(page.getByLabel('Username')).toHaveCSS('background-color', 'rgb(30, 41, 59)');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('alert')).toHaveText('Invalid username or password.');
    await expect(page.getByRole('alert')).toHaveCSS('color', 'rgb(252, 165, 165)');
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('writespace_session'))).toBeNull();

    await page.getByRole('link', { name: 'Register', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Create your account' })).toHaveCSS('background-color', 'rgb(15, 23, 42)');
    await page.getByLabel('Display Name').fill('Dark Theme Writer');
    await page.getByLabel('Username').fill('darkwriter');
    await page.getByLabel('Password', { exact: true }).fill('local-demo');
    await page.getByLabel('Confirm Password').fill('different');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('Passwords do not match.')).toBeVisible();
    await expect(page.getByText('Passwords do not match.')).toHaveCSS('color', 'rgb(252, 165, 165)');
    await expect(page.getByLabel('Confirm Password')).toHaveAttribute('aria-describedby', 'register-confirmPassword-error');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_users') || '[]'))).toEqual([]);
    await page.getByLabel('Confirm Password').fill('local-demo');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/blogs$/);
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('writespace_session') || 'null'))).toMatchObject({
      username: 'darkwriter', displayName: 'Dark Theme Writer', role: 'user',
    });
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_users') || '[]'))).toEqual([
      expect.objectContaining({ username: 'darkwriter', displayName: 'Dark Theme Writer', role: 'user' }),
    ]);
    await page.reload();
    await expect(page).toHaveURL(/\/blogs$/);
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.getByRole('link', { name: 'WriteSpace home' }).click();
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/\/blogs$/);
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL('/');
    expect(await page.evaluate(() => localStorage.getItem('writespace_session'))).toBeNull();

    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'Register', exact: true }).click();
    await page.getByLabel('Display Name').fill('Duplicate Writer');
    await page.getByLabel('Username').fill('DARKWRITER');
    await page.getByLabel('Password', { exact: true }).fill('local-demo');
    await page.getByLabel('Confirm Password').fill('local-demo');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText('That username is already taken.')).toBeVisible();
    await expect(page.getByText('That username is already taken.')).toHaveCSS('color', 'rgb(252, 165, 165)');
    await expect(page.getByLabel('Username')).toHaveAttribute('aria-invalid', 'true');
    await expect(page).toHaveURL(/\/register$/);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_users') || '[]').length)).toBe(1);
    expect(await page.evaluate(() => localStorage.getItem('writespace_session'))).toBeNull();
    await page.screenshot({ path: testInfo.outputPath('dark-registration-error.png'), fullPage: true });

    await page.getByRole('link', { name: 'Login', exact: true }).click();
    await page.getByLabel('Username').fill('darkwriter');
    await page.getByLabel('Password', { exact: true }).fill('local-demo');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/blogs$/);
    await page.getByRole('button', { name: 'Logout' }).click();
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Login' }).click();
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password', { exact: true }).fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('writespace_session') || 'null')?.role)).toBe('admin');
    await page.getByRole('link', { name: 'WriteSpace home' }).click();
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('html')).toHaveClass(/dark/);
    expect(await page.evaluate(() => localStorage.getItem('writespace_theme'))).toBe('dark');
    expect(await page.evaluate(() => localStorage.getItem('writespace_session'))).toBeNull();
    assertNoErrors();
  });
}
