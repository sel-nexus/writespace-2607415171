import { expect, test } from '@playwright/test';

/** Capture browser console and uncaught page errors for reader journeys.
 *
 * Args:
 *   page: Browser page to observe.
 *
 * Returns:
 *   An assertion callback for captured errors.
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

test('guest direct navigation to all blogs is redirected to login', async ({ page }) => {
  const assertNoErrors = monitorErrors(page);
  await page.goto('/blogs');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  assertNoErrors();
});

test('authenticated author browses newest posts and reads full whitespace-preserving content', async ({ page }) => {
  const assertNoErrors = monitorErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('writespace_session', JSON.stringify({ userId: 'reader-1', username: 'ari', displayName: 'Ari Reader', role: 'user' }));
    localStorage.setItem('writespace_posts', JSON.stringify([
      { id: 'older', title: 'Older essay', content: 'Older full text.', createdAt: '2025-11-14T12:00:00.000Z', authorId: 'reader-2', authorName: 'Riley Writer' },
      { id: 'newest', title: 'Newest essay', content: 'First paragraph.\n\nSecond paragraph stays separate.', createdAt: '2026-04-03T12:00:00.000Z', authorId: 'reader-1', authorName: 'Ari Reader' },
    ]));
  });
  await page.goto('/blogs');

  await expect(page.getByRole('heading', { name: 'All Blogs' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Newest essay' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Newest essay' })).toHaveAttribute('href', '/blog/newest');
  await page.getByRole('link', { name: 'Newest essay' }).click();
  await expect(page).toHaveURL(/\/blog\/newest$/);
  await expect(page.getByRole('heading', { name: 'Newest essay' })).toBeVisible();
  await expect(page.getByText('First paragraph.\n\nSecond paragraph stays separate.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
  assertNoErrors();
});

test('reader shows no edit or delete actions on another author’s post', async ({ page }) => {
  const assertNoErrors = monitorErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('writespace_session', JSON.stringify({ userId: 'reader-1', username: 'ari', displayName: 'Ari Reader', role: 'user' }));
    localStorage.setItem('writespace_posts', JSON.stringify([
      { id: 'others', title: 'A different view', content: 'Another author’s full story.', createdAt: '2026-02-09T12:00:00.000Z', authorId: 'reader-2', authorName: 'Riley Writer' },
    ]));
  });
  await page.goto('/blog/others');

  await expect(page.getByRole('heading', { name: 'A different view' })).toBeVisible();
  await expect(page.getByText('Another author’s full story.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to All Posts' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Delete' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Edit' })).toHaveCount(0);
  assertNoErrors();
});
