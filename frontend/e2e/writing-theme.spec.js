/** Verify dark writing journeys against real browser-local records on desktop and mobile. */
import { expect, test } from '@playwright/test';

/** Capture browser failures before navigation.
 * Args:
 *   page: Browser page for the writing journey.
 * Returns:
 *   A final assertion that no console or uncaught errors occurred.
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

for (const viewport of [{ width: 1280, height: 900 }, { width: 375, height: 812 }]) {
  test(`dark create/read/edit/cancel/delete preserves local records at ${viewport.width}px`, async ({ page }, testInfo) => {
    const assertNoErrors = monitorErrors(page);
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Login' }).click();
    await page.getByRole('link', { name: 'Register', exact: true }).click();
    await page.getByLabel('Display Name').fill('Night Writer');
    await page.getByLabel('Username').fill('nightwriter');
    await page.getByLabel('Password', { exact: true }).fill('local-demo');
    await page.getByLabel('Confirm Password').fill('local-demo');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/blogs$/);
    await expect(page.getByRole('heading', { name: 'No blogs yet. Be the first to write one!' })).toBeVisible();
    await expect(page.getByRole('main').locator('..')).toHaveCSS('background-color', 'rgb(2, 6, 23)');
    await page.getByRole('main').getByRole('link', { name: 'Write a post' }).last().click();
    await expect(page.getByText('0 characters')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Write a new post' })).toHaveCSS('background-color', 'rgb(15, 23, 42)');
    await page.getByRole('button', { name: 'Publish post' }).click();
    await expect(page.getByText('Title is required.')).toHaveCSS('color', 'rgb(252, 165, 165)');
    await expect(page.getByText('Content is required.')).toBeVisible();
    // Rejected drafts must not create even an empty persisted record.
    expect(await page.evaluate(() => localStorage.getItem('writespace_posts'))).toBeNull();

    const title = 'Writing after sunset';
    const content = 'A long plain-text passage. '.repeat(2048) + '\nSecond paragraph.';
    await page.getByLabel('Title').fill(title);
    await expect(page.getByLabel('Title')).toHaveAttribute('maxlength', '140');
    await expect(page.getByLabel('Content')).not.toHaveAttribute('maxlength');
    await expect(page.getByLabel('Content')).toHaveCSS('background-color', 'rgb(30, 41, 59)');
    await page.getByLabel('Content').fill('Count me');
    await expect(page.getByText('8 characters')).toBeVisible();
    await page.getByLabel('Content').fill('');
    await expect(page.getByText('0 characters')).toBeVisible();
    await page.getByLabel('Content').fill(content);
    await expect(page.getByText(`${content.length} characters`)).toBeVisible();
    await page.getByRole('button', { name: 'Publish post' }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.locator('article')).toHaveCSS('background-color', 'rgb(15, 23, 42)');
    await expect(page.locator('article p.whitespace-pre-wrap')).toHaveText(content);
    const records = await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_posts')));
    expect(records).toEqual([expect.objectContaining({ title, content, authorName: 'Night Writer' })]);
    const original = records[0];
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await page.getByRole('link', { name: 'Edit', exact: true }).click();
    await expect(page.getByLabel('Content')).toHaveValue(content);
    await expect(page.getByText(`${content.length} characters`)).toBeVisible();
    await page.getByLabel('Title').fill('Unsaved title');
    await page.getByLabel('Content').fill('Discard these words');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_posts')))).toEqual([original]);
    await page.getByRole('link', { name: 'Edit', exact: true }).click();
    const revisedContent = `${content}\nA final thought.`;
    await page.getByLabel('Title').fill('Revised after sunset');
    await page.getByLabel('Content').fill(revisedContent);
    await expect(page.getByText(`${revisedContent.length} characters`)).toBeVisible();
    await page.getByRole('button', { name: 'Save changes' }).click();
    const revised = { ...original, title: 'Revised after sunset', content: revisedContent };
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_posts')))).toEqual([revised]);
    await page.getByRole('link', { name: 'Back to All Posts', exact: true }).first().click();
    await page.getByRole('link', { name: 'Revised after sunset', exact: true }).click();
    await expect(page.locator('article p.whitespace-pre-wrap')).toHaveText(revisedContent);
    await page.screenshot({ path: testInfo.outputPath('dark-writing-reader.png'), fullPage: true });
    page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByRole('button', { name: 'Delete' }).click();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_posts')))).toEqual([revised]);
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page).toHaveURL(/\/blogs$/);
    await expect(page.getByRole('heading', { name: 'No blogs yet. Be the first to write one!' })).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_posts')))).toEqual([]);
    expect(await page.evaluate(() => localStorage.getItem('writespace_theme'))).toBe('dark');
    assertNoErrors();
  });
}

test('dark non-owner edit entry redirects and the reader cannot modify the record', async ({ page }) => {
  const assertNoErrors = monitorErrors(page);
  const otherPost = {
    id: 'another-author', title: 'Another author owns this', content: 'Keep these original words.',
    createdAt: '2026-04-01T12:00:00.000Z', authorId: 'writer-1', authorName: 'Ari Reader',
  };
  await page.addInitScript((post) => {
    if (localStorage.getItem('writespace_theme') === null) {
      localStorage.setItem('writespace_theme', 'dark');
      localStorage.setItem('writespace_session', JSON.stringify({
        userId: 'writer-2', username: 'riley', displayName: 'Riley Writer', role: 'user',
      }));
      localStorage.setItem('writespace_posts', JSON.stringify([post]));
    }
  }, otherPost);
  await page.goto('/edit/another-author');
  await expect(page).toHaveURL(/\/blogs$/);
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('link', { name: `Edit ${otherPost.title}` })).toHaveCount(0);
  await page.getByRole('link', { name: otherPost.title, exact: true }).click();
  await expect(page.getByRole('heading', { name: otherPost.title })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Edit', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Delete' })).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_posts')))).toEqual([otherPost]);
  await page.getByRole('link', { name: 'Back to All Posts' }).first().click();
  await expect(page).toHaveURL(/\/blogs$/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('writespace_posts')))).toEqual([otherPost]);
  assertNoErrors();
});
