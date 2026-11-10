import { test, expect, type Page } from '@playwright/test';
import publishedPack from '../../src/content/published/study-pack.json' with { type: 'json' };

test.use({ storageState: { cookies: [], origins: [] } });

async function openCards(page: Page, theme: string) {
  await page.goto('/#settings');
  await expect(page.getByText('Saved in this browser', { exact: true }).first()).toBeVisible();
  await page.getByLabel('Appearance', { exact: true }).selectOption(theme);
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByRole('link', { name: 'Card browser', exact: true }).click();
}

async function footerFollowsContent(page: Page) {
  const footer = page.locator('.page-footer');
  await expect(footer).toBeVisible();
  const workspace = page.locator('.card-browser-workspace');
  const content = (await workspace.boundingBox())!, foot = (await footer.boundingBox())!;
  expect(foot.y).toBeGreaterThanOrEqual(content.y + content.height);
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toBeInViewport({ ratio: 1 });
  await expect(footer.getByRole('link', { name: 'Third-party notices ↗', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

for (const theme of ['dark', 'light']) for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 600 },
  { width: 390, height: 780 },
]) {
  test(`Card browser and Mistakes expose their footer at ${viewport.width}x${viewport.height} in ${theme}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openCards(page, theme);
    for (const section of ['Card browser', 'Mistakes']) {
      await page.getByRole('link', { name: section, exact: true }).click();
      await page.evaluate(() => scrollTo(0, 0));
      if (section === 'Card browser' || viewport.height === 600) {
        expect(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight)).toBe(true);
      }
      await footerFollowsContent(page);
      const filters = page.getByRole('button', { name: /^Filters/ });
      await filters.click();
      await expect(filters).toHaveAttribute('aria-expanded', 'true');
      await footerFollowsContent(page);
      await filters.click();
      if (section === 'Card browser') {
        await page.getByRole('region', { name: 'Card list', exact: true }).getByRole('button', { name: /^Select card:/ }).first().click();
        await expect(page.getByRole('region', { name: 'Card details', exact: true })).toBeVisible();
        await footerFollowsContent(page);
      }
    }
    await page.screenshot({ path: `test-results/card-browser-footer-${theme}-${viewport.width}.png` });
  });
}

// Pick actual published content with substantial references rather than changing learner data or prose.
const referenceLength = (card: typeof publishedPack.cards[number]) => publishedPack.notes
  .filter(note => card.noteIds.includes(note.id)).reduce((length, note) => length + note.body.length, 0);
const longCard = publishedPack.cards.reduce((longest, card) => referenceLength(card) > referenceLength(longest) ? card : longest);

for (const theme of ['dark', 'light']) test(`desktop card list and expanded references scroll independently of the page in ${theme}`, async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await openCards(page, theme);
  const list = page.getByRole('region', { name: 'Card list', exact: true });
  await list.getByRole('button', { name: 'Select card: ' + longCard.prompt, exact: true }).click();
  const detail = page.getByRole('region', { name: 'Card details', exact: true });
  const answer = detail.getByRole('tabpanel', { name: 'Answer', exact: true });
  await answer.locator('.card-inspector-references > details > summary').click();
  await answer.locator('details.card-inspector-sources > summary').click();
  const tabs = detail.getByRole('tablist');
  const before = await page.evaluate(() => ({ scroll: scrollY }));
  const tabsBefore = (await tabs.boundingBox())!.y;
  await list.evaluate(element => { element.scrollTop = 200; });
  expect(await list.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY)).toBe(before.scroll);
  await answer.evaluate(element => { element.scrollTop = element.scrollHeight; });
  expect(await answer.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  expect((await tabs.boundingBox())!.y).toBeCloseTo(tabsBefore, 0);
  expect(await list.evaluate(element => element.scrollTop)).toBe(200);
  expect(await page.evaluate(() => scrollY)).toBe(before.scroll);
  await footerFollowsContent(page);
});
