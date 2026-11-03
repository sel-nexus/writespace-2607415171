/** Verify preference persistence through real public and authenticated UI journeys. */
import { expect, test } from '@playwright/test';

/** Capture browser failures before the first navigation.
 * Args:
 *   page: Browser page to observe.
 * Returns:
 *   A final assertion for all captured failures.
 */
function monitorErrors(page) {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return () => expect(errors, errors.join('\n')).toEqual([]);
}

for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
  test('theme survives public navigation, login, refresh and logout at ' + viewport.width + 'px', async ({ page }, testInfo) => {
    const assertNoErrors = monitorErrors(page);
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Switch to dark mode' })).toBeVisible();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const toggle = page.getByRole('button', { name: 'Switch to dark mode' });
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveCSS('outline-style', 'solid');
    await toggle.press('Enter');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('writespace_theme'))).toBe('dark');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(1);
    await expect(page.locator('header').first()).toHaveCSS('background-color', 'rgb(15, 23, 42)');
    await expect(page.getByText('No posts yet - check back soon!')).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel('Username').fill('invalid');
    await page.getByLabel('Password').fill('wrong');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('alert')).toContainText('Invalid username or password.');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('admin');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('navigation', { name: 'Authenticated navigation' })).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('writespace_session')).role)).toBe('admin');
    if (viewport.width < 768) {
      await page.getByRole('button', { name: 'Open navigation menu' }).click();
      await expect(page.getByRole('button', { name: 'Close navigation menu' })).toHaveAttribute('aria-expanded', 'true');
      await expect(page.locator('#authenticated-mobile-menu')).toHaveCSS('border-top-color', 'rgb(51, 65, 85)');
      await page.locator('#authenticated-mobile-menu').getByRole('link', { name: 'All Blogs' }).click();
    } else {
      await page.getByRole('navigation', { name: 'Authenticated navigation' }).getByRole('link', { name: 'All Blogs' }).click();
    }
    await expect(page).toHaveURL(/\/blogs$/);
    await page.getByRole('button', { name: 'Switch to light mode' }).press('Space');
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('writespace_theme'))).toBe('light');
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
    await page.getByRole('link', { name: 'WriteSpace home' }).click();
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL('/');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('writespace_session'))).toBeNull();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('writespace_theme'))).toBe('dark');
    await page.reload();
    await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('theme-' + viewport.width + '.png'), fullPage: true });
    assertNoErrors();
  });
}
