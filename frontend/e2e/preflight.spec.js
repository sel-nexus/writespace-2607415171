import { expect, test } from '@playwright/test';

/** Capture browser errors so the design-preflight journey fails on runtime issues.
 *
 * Args:
 *   page: Browser page to observe.
 *
 * Returns:
 *   A callback that asserts no browser errors occurred.
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

/** Attach text-based design evidence and save a reviewer screenshot.
 *
 * Args:
 *   page: Rendered Playwright page.
 *   testInfo: Current Playwright test result metadata.
 *   label: Stable label for the captured page/state.
 */
async function capturePageEvidence(page, testInfo, label) {
  const accessibility = await page.accessibility.snapshot();
  const computedStyles = await page.evaluate(() => ({
    bodyFontFamily: getComputedStyle(document.body).fontFamily,
    bodyBackgroundColor: getComputedStyle(document.body).backgroundColor,
    mainBackgroundColor: getComputedStyle(document.querySelector('main') || document.body).backgroundColor,
    viewport: { width: window.innerWidth, height: window.innerHeight },
  }));
  const renderedHtml = await page.content();

  await testInfo.attach(`${label}-structure.json`, {
    body: JSON.stringify({ accessibility, computedStyles, renderedHtml }, null, 2),
    contentType: 'application/json',
  });
  await page.screenshot({ path: testInfo.outputPath(`${label}.png`), fullPage: true });
}

test('captures representative desktop and mobile WriteSpace interface evidence', async ({ page }, testInfo) => {
  const assertNoErrors = monitorErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('writespace_posts', JSON.stringify([
      {
        id: 'preflight-story',
        title: 'A story saved in this browser',
        excerpt: 'A representative local post preview for the interface review.',
        content: 'A representative local post for the reader journey.',
        createdAt: '2026-04-12T12:00:00.000Z',
        authorId: 'writer-1',
        authorName: 'Ari Writer',
      },
    ]));
    localStorage.setItem('writespace_users', JSON.stringify([
      { id: 'writer-1', username: 'ari', displayName: 'Ari Writer', password: 'demo-only', role: 'user' },
    ]));
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'WriteSpace' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'A story saved in this browser' })).toBeVisible();
  await capturePageEvidence(page, testInfo, 'preflight-landing-desktop');

  await page.setViewportSize({ width: 390, height: 844 });
  await capturePageEvidence(page, testInfo, 'preflight-landing-mobile');

  await page.getByRole('link', { name: 'Start reading' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Username').fill('invalid');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('alert')).toContainText('Invalid username or password.');
  await capturePageEvidence(page, testInfo, 'preflight-login-error');

  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Community overview' })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 800 });
  await capturePageEvidence(page, testInfo, 'preflight-admin-desktop');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Authenticated navigation' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
  await capturePageEvidence(page, testInfo, 'preflight-admin-mobile-nav-open');
  assertNoErrors();
});
