import { expect, test } from '@playwright/test';

/** Observe console errors and uncaught exceptions before entering a recovery route. */
function monitorErrors(page) {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  return () => expect(errors, errors.join('\n')).toEqual([]);
}

const savedPost = {
  id: 'recovery-story', title: 'Still saved in this browser', content: 'These words survive recovery.',
  authorId: 'recovery-reader', authorName: 'Recovery Reader', createdAt: '2026-04-01T12:00:00.000Z',
};

for (const width of [1280, 375]) {
  for (const entry of [
    { path: '/blog/missing-reader-id', message: 'This post may have been removed from this browser.' },
    { path: '/edit/missing-editor-id', message: 'This post is not saved in this browser.' },
  ]) {
    test(`dark ${entry.path} recovers through saved posts at ${width}px`, async ({ page }) => {
      const assertNoErrors = monitorErrors(page);
      await page.addInitScript((post) => {
        localStorage.setItem('writespace_theme', 'dark');
        localStorage.setItem('writespace_session', JSON.stringify({ userId: 'recovery-reader', username: 'recovery', displayName: 'Recovery Reader', role: 'user' }));
        localStorage.setItem('writespace_posts', JSON.stringify([post]));
      }, savedPost);
      await page.setViewportSize({ width, height: 900 });
      await page.goto(entry.path);
      await expect(page).toHaveURL(entry.path);
      await expect(page.getByRole('heading', { name: 'Post not found', exact: true })).toBeVisible();
      await expect(page.getByText(entry.message, { exact: true })).toBeVisible();
      await expect(page.locator('html')).toHaveClass(/dark/);
      await expect(page.locator('#root > div')).toHaveCSS('background-color', 'rgb(2, 6, 23)');
      await page.getByRole('link', { name: 'Back to All Posts', exact: true }).click();
      await expect(page).toHaveURL(/\/blogs$/);
      await expect(page.getByRole('heading', { name: 'All Blogs', exact: true })).toBeVisible();
      await expect(page.getByRole('region', { name: 'All posts' }).getByRole('article')).toHaveCount(1);
      await page.getByRole('link', { name: savedPost.title, exact: true }).click();
      await expect(page).toHaveURL(/\/blog\/recovery-story$/);
      await expect(page.getByRole('heading', { name: savedPost.title })).toBeVisible();
      await expect(page.locator('article p.whitespace-pre-wrap')).toHaveText(savedPost.content);
      await expect(page.locator('html')).toHaveClass(/dark/);
      expect(await page.evaluate(() => localStorage.getItem('writespace_theme'))).toBe('dark');
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_posts')))).toEqual([savedPost]);
      assertNoErrors();
    });
  }

  for (const recoveryLink of ['Return home', 'WriteSpace home', 'Login']) {
    test(`dark unknown route recovers using ${recoveryLink} at ${width}px`, async ({ page }) => {
      const assertNoErrors = monitorErrors(page);
      await page.addInitScript((post) => {
        localStorage.setItem('writespace_theme', 'dark');
        localStorage.setItem('writespace_posts', JSON.stringify([post]));
      }, savedPost);
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/unknown-recovery-route');
      await expect(page).toHaveURL('/unknown-recovery-route');
      await expect(page.getByRole('heading', { name: 'Page not found', exact: true })).toBeVisible();
      await expect(page.getByText('There is no WriteSpace page at', { exact: false })).toContainText('/unknown-recovery-route');
      await expect(page.locator('html')).toHaveClass(/dark/);
      await expect(page.getByRole('main')).toHaveCSS('background-color', 'rgb(2, 6, 23)');
      await page.getByRole('link', { name: recoveryLink, exact: true }).click();
      if (recoveryLink === 'Login') {
        await expect(page).toHaveURL(/\/login$/);
        await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
        await page.getByRole('link', { name: 'WriteSpace home' }).click();
      }
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('heading', { name: 'WriteSpace', exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: savedPost.title, exact: true })).toBeVisible();
      await expect(page.locator('html')).toHaveClass(/dark/);
      expect(await page.evaluate(() => localStorage.getItem('writespace_theme'))).toBe('dark');
      expect(await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_posts')))).toEqual([savedPost]);
      expect(await page.evaluate(() => localStorage.getItem('writespace_session'))).toBeNull();
      assertNoErrors();
    });
  }
}
