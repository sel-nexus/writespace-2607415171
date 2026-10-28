import { expect, test } from '@playwright/test';

/** Collect JavaScript errors produced during the author journey.
 *
 * Args:
 *   page: Browser page under test.
 *
 * Returns:
 *   A callback that fails if console or uncaught page errors occurred.
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

test('author creates, edits, and deletes a local post through the reader', async ({ page }) => {
  const assertNoErrors = monitorErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('writespace_session', JSON.stringify({ userId: 'writer-1', username: 'ari', displayName: 'Ari Reader', role: 'user' }));
    localStorage.setItem('writespace_posts', JSON.stringify([]));
  });
  await page.goto('/write');
  await page.getByLabel('Title').fill('A small discovery');
  await page.getByLabel('Content').fill('First paragraph.\n\nSecond paragraph.');
  await page.getByRole('button', { name: 'Publish post' }).click();

  await expect(page).toHaveURL(/\/blog\/.+/);
  await expect(page.getByRole('heading', { name: 'A small discovery' })).toBeVisible();
  await expect(page.getByText('First paragraph.\n\nSecond paragraph.')).toBeVisible();
  const postId = await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_posts'))[0].id);
  await page.getByRole('link', { name: 'Edit' }).click();
  await expect(page).toHaveURL(new RegExp(`/edit/${postId}$`));
  await page.getByLabel('Title').fill('A revised discovery');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('heading', { name: 'A revised discovery' })).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page).toHaveURL(/\/blogs$/);
  await expect(page.getByRole('heading', { name: 'No blogs yet. Be the first to write one!' })).toBeVisible();
  assertNoErrors();
});

test('a writer cannot edit or delete another author’s post', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('writespace_session', JSON.stringify({ userId: 'writer-2', username: 'riley', displayName: 'Riley Writer', role: 'user' }));
    localStorage.setItem('writespace_posts', JSON.stringify([
      { id: 'writer-one-post', title: 'Private to its author', content: 'Original words.', createdAt: '2026-04-01T12:00:00.000Z', authorId: 'writer-1', authorName: 'Ari Reader' },
    ]));
  });
  await page.goto('/edit/writer-one-post');
  await expect(page).toHaveURL(/\/blogs$/);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('writespace_posts'))[0].title)).toBe('Private to its author');
  await page.goto('/blog/writer-one-post');
  await expect(page.getByRole('heading', { name: 'Private to its author' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edit' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Delete' })).toHaveCount(0);
});
