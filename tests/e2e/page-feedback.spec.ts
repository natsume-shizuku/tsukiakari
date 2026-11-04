import { test, expect, type Page } from '@playwright/test';

async function ready(page: Page) {
  await page.goto('/');
  await expect(page.locator('.sidebar').getByText('Saved in this browser', { exact: true })).toBeVisible();
}
async function startTest(page: Page) {
  await page.getByRole('link', { name: 'Tests', exact: true }).click();
  await page.getByLabel('Question bank', { exact: true }).selectOption('developer-test-fixture');
  await page.getByLabel('Number of questions', { exact: true }).fill('50');
  await page.getByRole('button', { name: 'Start practice', exact: true }).click();
  await expect(page.locator('.test-question')).toHaveCount(50);
}

test('test confirmations stay on Tests and ordinary confirmations disappear when leaving their page', async ({ page }) => {
  await ready(page);
  await startTest(page);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Abandon test', exact: true }).click();
  await expect(page.getByText('Test abandoned. You can start a new test.', { exact: true })).toBeVisible();
  for (const name of ['Study', 'Statistics', 'Settings', 'Library', 'Tests']) {
    await page.getByRole('link', { name, exact: true }).click();
    await expect(page.getByText('Test abandoned.', { exact: true })).toHaveCount(0);
    await expect(page.locator('.mutation-feedback')).toHaveCount(0);
  }
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  await page.getByRole('button', { name: 'Create a deck', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Create a deck', exact: true });
  await dialog.getByLabel('Deck name', { exact: true }).fill('Feedback scope');
  await dialog.getByRole('button', { name: 'Create deck', exact: true }).click();
  await expect(page.locator('.mutation-feedback')).toBeVisible();
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await expect(page.locator('.mutation-feedback')).toHaveCount(0);
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  await expect(page.locator('.mutation-feedback')).toHaveCount(0);
});

for (const width of [320, 1440]) {
  test('footer stays at the bottom without covering short or long content at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 1600 });
    await ready(page);
    await page.getByRole('link', { name: 'Tests', exact: true }).click();
    const footer = page.locator('.page-footer');
    const box = (await footer.boundingBox())!;
    expect(box.y + box.height).toBeCloseTo(1600, 0);
    expect(await footer.evaluate(el => getComputedStyle(el).position)).toBe('static');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await startTest(page);
    const lastQuestion = (await page.locator('.test-question').last().boundingBox())!;
    const longFooter = (await footer.boundingBox())!;
    expect(longFooter.y).toBeGreaterThan(lastQuestion.y + lastQuestion.height);
    expect(longFooter.y).toBeGreaterThan(1600);
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
