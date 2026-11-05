import { expect, test, type Page } from '@playwright/test';

const chart = (page: Page) => page.getByRole('region', { name: 'Yearly study heatmap', exact: true });
const day = (page: Page, index: number) => chart(page).locator(`rect[data-index="${index}"]`);
const tip = (page: Page) => page.locator('.statistics-tip');
async function open(page: Page) {
  await page.goto('/#statistics');
  await expect(chart(page)).toBeVisible();
}

test('the heatmap has no axis labels and hovering a day shows its date', async ({ page }) => {
  await open(page);
  await expect(chart(page).locator('svg text')).toHaveCount(0);
  await expect(tip(page)).toHaveCount(0);

  await day(page, 0).hover();
  await expect(tip(page)).toContainText(/January 1, \d{4}/);
  await expect(tip(page)).toContainText('0 reviews · 0s active time');

  await day(page, 31).hover();
  await expect(tip(page)).toContainText(/February 1, \d{4}/);

  await page.getByRole('heading', { name: 'Statistics', exact: true }).hover();
  await expect(tip(page)).toHaveCount(0);
});

test.describe('on a small touch screen', () => {
  test.use({ hasTouch: true, viewport: { width: 320, height: 700 } });

  test('tapping a day shows its date on screen until the learner moves on', async ({ page }) => {
    await open(page);
    await day(page, 0).tap();
    await expect(tip(page)).toContainText(/January 1, \d{4}/);
    const box = await tip(page).boundingBox();
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);

    await page.getByRole('heading', { name: 'Statistics', exact: true }).tap();
    await expect(tip(page)).toHaveCount(0);

    await day(page, 0).tap();
    await expect(tip(page)).toBeVisible();
    await chart(page).evaluate(element => { element.scrollLeft = 200; });
    await expect(tip(page)).toHaveCount(0);
  });
});
