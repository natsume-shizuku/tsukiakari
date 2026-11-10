import { test, expect, type Page, type Locator } from '@playwright/test';

const longDeck = 'An intentionally long deck name for reviewing the compact Library layout';
async function ready(page: Page) {
  await page.goto('/');
  await expect(page.locator('.site-header').getByText('Saved in this browser', { exact: true })).toBeVisible();
}
async function createDeck(page: Page) {
  await page.getByRole('button', { name: 'Create a deck', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Create a deck' });
  await dialog.getByLabel('Deck name', { exact: true }).fill(longDeck);
  await dialog.getByRole('button', { name: 'Create deck', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByRole('link', { name: 'Card browser', exact: true }).click();
}
async function noHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function paneTop(list: Locator) {
  await expect(list).toBeVisible();
  return (await list.boundingBox())!.y;
}
async function checkSelectionStability(page: Page, list: Locator, prefix: string) {
  const rows = list.getByRole('button', { name: new RegExp('^' + prefix) });
  const top = await paneTop(list);
  expect(top).toBeLessThan((page.viewportSize()?.height ?? 1000) - 300);
  await rows.nth(0).click();
  await expect(page.getByRole('region', { name: 'Card details', exact: true })).toBeVisible();
  expect(await paneTop(list)).toBeCloseTo(top, 0);
  await rows.nth(1).click({ modifiers: ['Control'] });
  await expect(list.locator('[aria-pressed="true"]')).toHaveCount(2);
  expect(await paneTop(list)).toBeCloseTo(top, 0);
  await rows.nth(1).click();
  await expect(list.locator('[aria-pressed="true"]')).toHaveCount(1);
  expect(await paneTop(list)).toBeCloseTo(top, 0);
  await page.getByRole('button', { name: 'Clear selection', exact: true }).click();
  await expect(list.locator('[aria-pressed="true"]')).toHaveCount(0);
  expect(await paneTop(list)).toBeCloseTo(top, 0);
}

for (const theme of ['dark', 'light']) {
  test(`compact Library shares its header and fits all viewports in ${theme}`, async ({ page }) => {
    await ready(page);
    await page.getByRole('link', { name: 'Settings', exact: true }).click();
    await page.getByLabel('Appearance', { exact: true }).selectOption(theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await page.getByRole('link', { name: 'Library', exact: true }).click();
    for (const width of [320, 768, 1440, 1920, 2560]) {
      await page.setViewportSize({ width, height: 1000 });
      let headingStyle: { size: string; height: number; top: number } | undefined;
      for (const section of ['Study packs', 'Card browser', 'Notes', 'Mistakes']) {
        await page.getByRole('link', { name: section, exact: true }).click();
        await page.evaluate(() => scrollTo(0, 0));
        await expect(page.locator('.topbar')).toHaveCount(0);
        await expect(page.getByText('Phase 3 · Study and Library', { exact: true })).toHaveCount(0);
        await expect(page.getByRole('heading', { name: 'Library', exact: true })).toBeVisible();
        await expect(page.getByText('Keep knowledge close', { exact: true })).toBeVisible();
        await expect(page.locator('.site-header .save-status')).toBeVisible();
        await noHorizontalOverflow(page);
        const current = await page.locator('.page-header').evaluate(el => ({
          size: getComputedStyle(el.querySelector('h1')!).fontSize,
          height: el.getBoundingClientRect().height,
          top: el.getBoundingClientRect().top,
        }));
        if (headingStyle) expect(current).toEqual(headingStyle);
        headingStyle = current;
        if (width >= 900) {
          expect(current.top).toBeCloseTo((await page.locator('.site-header').boundingBox())!.height + 20, 0);
          if (section === 'Card browser' || section === 'Mistakes') {
            const list = page.getByRole('region', { name: section === 'Card browser' ? 'Card list' : 'Mistake list', exact: true });
            const header = (await page.locator('.page-header').boundingBox())!;
            expect(await paneTop(list)).toBeGreaterThanOrEqual(header.y + header.height);
            const bounds = (await list.boundingBox())!;
            expect(bounds.height).toBeGreaterThan(300);
            expect(bounds.height).toBeLessThanOrEqual(800);
            expect((await page.locator('.page-footer').boundingBox())!.y).toBeGreaterThanOrEqual(bounds.y + bounds.height);
          }
          if (section === 'Notes') {
            const header = (await page.locator('.page-header').boundingBox())!;
            expect((await page.getByRole('region', { name: 'Note reader', exact: true }).boundingBox())!.y).toBeGreaterThanOrEqual(header.y + header.height);
          }
        }
        if (section === 'Card browser' || section === 'Notes') {
          await page.screenshot({ path: `test-results/compact-${section === 'Notes' ? 'notes' : 'cards'}-${theme}-${width}.png`, fullPage: width < 900 });
        }
      }
    }
  });
}

test('compact panes stay in place through selection and confirmations, with expanded filters in normal flow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await ready(page);
  await createDeck(page);
  const list = page.getByRole('region', { name: 'Card list', exact: true });
  await checkSelectionStability(page, list, 'Select card:');
  const collapsedTop = await paneTop(list);
  const toggle = page.getByRole('button', { name: /^Filters/ });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(page.getByLabel('Study pack', { exact: true })).toBeVisible();
  expect(await paneTop(list)).toBeGreaterThan(collapsedTop);
  const filterBottom = await page.getByLabel('Tag filter', { exact: true }).boundingBox();
  expect(await paneTop(list)).toBeGreaterThanOrEqual(filterBottom!.y + filterBottom!.height);
  await toggle.click();
  expect(await paneTop(list)).toBeCloseTo(collapsedTop, 0);
  const cards = list.getByRole('button', { name: /^Select card:/ });
  await cards.nth(0).click();
  await cards.nth(1).click({ modifiers: ['Control'] });
  await page.getByRole('button', { name: 'Add selected cards (2)', exact: true }).click();
  const controls = page.getByRole('region', { name: 'Card selection controls', exact: true });
  await expect(controls).toContainText('Added 2 cards');
  await expect(page.locator('main > .mutation-feedback-slot')).toHaveCount(0);
  expect(await paneTop(list)).toBeCloseTo(collapsedTop, 0);
  await noHorizontalOverflow(page);
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  await page.getByRole('button', { name: 'Study ' + longDeck, exact: true }).click();
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'Reveal answer', exact: true }).click();
    await page.getByRole('button', { name: 'Again', exact: true }).click();
    await expect(page.getByTestId('revealed-answer')).toHaveCount(0);
  }
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByRole('link', { name: 'Mistakes', exact: true }).click();
  await checkSelectionStability(page, page.getByRole('region', { name: 'Mistake list', exact: true }), 'Select mistake:');
});

test('storage status remains visible by Settings for read-only and failed writes', async ({ page, context }) => {
  await ready(page);
  await createDeck(page);
  const second = await context.newPage();
  await second.goto('/#library/cards');
  await expect(second.locator('.site-header .save-status')).toHaveText('Read-only tab');
  await expect(second.getByText('This is a read-only tab.', { exact: true })).toBeVisible();
  for (const width of [320, 1440]) {
    await second.setViewportSize({ width, height: 1000 });
    await expect(second.locator('.site-header .save-status')).toBeVisible();
    await noHorizontalOverflow(second);
  }
  await second.close();
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.add;
    let failOnce = true;
    IDBObjectStore.prototype.add = function (value, key) {
      if (this.name === 'copies' && failOnce) {
        failOnce = false;
        throw new DOMException('Simulated storage failure', 'QuotaExceededError');
      }
      return original.call(this, value, key);
    };
  });
  await page.getByRole('region', { name: 'Card list', exact: true }).getByRole('button', { name: /^Select card:/ }).first().click();
  await page.getByRole('button', { name: 'Add selected cards (1)', exact: true }).click();
  await expect(page.locator('.site-header .save-status')).toHaveText('Save needs attention');
  await expect(page.getByRole('alert').filter({ hasText: 'Storage needs attention' })).toBeVisible();
  await noHorizontalOverflow(page);
});

