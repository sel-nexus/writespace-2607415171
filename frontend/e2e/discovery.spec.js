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
  await expect(page.locator('#root > div')).toHaveCSS('background-color', 'rgb(251, 250, 247)');
  await expect(page.locator('section[aria-labelledby="hero-title"]')).toHaveCSS('background-image', 'none');

  await expect(page.getByRole('heading', { name: 'WriteSpace' })).toBeVisible();
  await expect(page.getByText('Your thoughts. Your space. Beautifully simple.')).toBeVisible();
  await expect(page.getByText(/stored only in this browser/i)).toBeVisible();
  await expect(page.getByText('No posts yet - check back soon!')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start reading' })).toHaveAttribute('href', '/login');
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/register');
  await page.screenshot({ path: 'test-results/discovery-desktop-landing.png', fullPage: true });
  await page.getByRole('link', { name: 'Start reading' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await page.getByRole('link', { name: 'WriteSpace home' }).click();
  await page.locator('section[aria-labelledby="hero-title"]').getByRole('link', { name: 'Get started' }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByLabel('Confirm Password')).toBeVisible();
  await page.getByRole('link', { name: 'WriteSpace home' }).click();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Get started' }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByLabel('Display Name')).toBeVisible();
  await page.getByRole('link', { name: 'WriteSpace home' }).click();
  const footer = page.getByRole('navigation', { name: 'Footer navigation' });
  await footer.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'WriteSpace' })).toBeVisible();
  for (const name of ['All Blogs', 'Login', 'Register']) {
    await footer.getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(name === 'Register' ? /\/register$/ : /\/login$/);
    await expect(page.getByRole('heading', { name: name === 'Register' ? 'Create your account' : 'Welcome back' })).toBeVisible();
    await page.getByRole('link', { name: 'WriteSpace home' }).click();
  }

  assertNoBrowserErrors();
});

test('locally signed-in admin sees the newest local story and admin links', async ({ page }) => {
  const assertNoBrowserErrors = captureBrowserErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('writespace_session', JSON.stringify({ userId: 'admin', username: 'admin', displayName: 'Morgan Admin', role: 'admin' }));
    localStorage.setItem('writespace_posts', JSON.stringify([
      { id: 'old', title: 'Older local story', createdAt: '2024-01-01', excerpt: 'Old browser writing.' },
      { id: 'new', title: 'Newest local story', createdAt: '2025-05-01', excerpt: 'Saved on this device.', content: 'The full newest story from this browser.', authorId: 'writer-1', authorName: 'Local Writer' },
    ]));
  });
  await page.goto('/');

  await expect(page.getByText('Morgan Admin')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/admin');
  await expect(page.getByRole('link', { name: 'Start reading' })).toHaveAttribute('href', '/blogs');
  await expect(page.getByRole('link', { name: 'Newest local story' })).toHaveAttribute('href', '/blog/new');
  await expect(page.getByRole('complementary', { name: 'Local writing preview' }).getByText('Saved on this device.', { exact: true })).toBeVisible();
  for (const name of ['Newest local story', 'Read Newest local story']) {
    await page.getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(/\/blog\/new$/);
    await expect(page.getByRole('heading', { name: 'Newest local story' })).toBeVisible();
    await expect(page.locator('article p.whitespace-pre-wrap')).toHaveText('The full newest story from this browser.');
    await expect(page.locator('article')).toContainText('Local Writer');
    await page.getByRole('link', { name: 'WriteSpace home' }).click();
  }
  await page.getByRole('link', { name: 'Start reading' }).click();
  await expect(page).toHaveURL(/\/blogs$/);
  await expect(page.getByRole('heading', { name: 'Newest local story' })).toBeVisible();
  await page.getByRole('link', { name: 'WriteSpace home' }).click();
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('region', { name: 'Recent posts' }).getByRole('link', { name: 'Newest local story', exact: true })).toBeVisible();

  assertNoBrowserErrors();
});

test('signed-in readers see their reading dashboard and the home remains usable on mobile', async ({ page }) => {
  const assertNoBrowserErrors = captureBrowserErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('writespace_session', JSON.stringify({ userId: 'reader-1', username: 'jordan', displayName: 'Jordan Reader', role: 'user' }));
    localStorage.setItem('writespace_posts', JSON.stringify([{ id: 'mobile-story', title: 'Mobile local story', content: 'Words saved for the mobile reader.', authorId: 'reader-1', authorName: 'Jordan Reader', createdAt: '2026-04-01' }]));
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
  await page.screenshot({ path: 'test-results/discovery-mobile-landing.png', fullPage: true });
  for (const name of ['Jordan Reader profile', 'Dashboard', 'Start reading']) {
    await page.getByRole('link', { name, exact: true }).click();
    await expect(page).toHaveURL(/\/blogs$/);
    await expect(page.getByRole('heading', { name: 'Mobile local story' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'All posts' })).toContainText('Words saved for the mobile reader.');
    await page.getByRole('link', { name: 'WriteSpace home' }).click();
  }
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

for (const entry of ['title', 'Read story']) {
  test(`guest clicks public preview ${entry} and is redirected to login`, async ({ page }) => {
    const assertNoBrowserErrors = captureBrowserErrors(page);
    await page.addInitScript(() => {
      localStorage.setItem('writespace_posts', JSON.stringify([{
        id: 'guest-preview', title: 'Guest preview story', excerpt: 'A local preview before signing in.',
        content: 'Protected full story.', createdAt: '2026-04-01', authorId: 'writer-1', authorName: 'Local Writer',
      }]));
    });
    await page.goto('/');
    await expect(page.getByRole('region', { name: 'Latest writing' })).toContainText('A local preview before signing in.');
    await page.getByRole('link', { name: entry === 'title' ? 'Guest preview story' : 'Read Guest preview story', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('writespace_session'))).toBeNull();
    assertNoBrowserErrors();
  });
}
