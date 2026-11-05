import { test, expect, type Page } from '@playwright/test';

async function setup(page: Page) {
  await page.goto('/#tests?bank=ab250-original');
  await expect(page.getByText(/300 available questions/)).toBeVisible();
}
async function startPractice(page: Page, count: number) {
  await setup(page);
  await page.getByLabel('Number of questions', { exact: true }).fill(String(count));
  await page.getByRole('button', { name: 'Start practice', exact: true }).click();
  await expect(page.locator('.test-session-bar')).toContainText(`of ${count} answered`);
}
const pageButton = (page: Page, index: number) => page.locator(`.test-nav-button[data-page="${index}"]`);
const panel = (page: Page, index: number) => page.locator(`.test-question[data-index="${index}"]`);
const answer = (page: Page, index: number) => panel(page, index).locator('input').first().check();
const flag = (page: Page, index: number) => panel(page, index).getByRole('button', { name: 'Flag for review', exact: true }).click();

test('a test shows five questions per page and moves between pages', async ({ page }) => {
  await startPractice(page, 12);
  await expect(page.locator('.test-question')).toHaveCount(5);
  await expect(panel(page, 0)).toContainText('Question 1 of 12');
  await expect(panel(page, 4)).toContainText('Question 5 of 12');
  await expect(page.locator('.test-nav-button')).toHaveCount(3);
  await expect(pageButton(page, 0)).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('button', { name: 'Previous page', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(panel(page, 5)).toContainText('Question 6 of 12');
  await expect(page.locator('.test-question').first().locator('.test-question-title')).toBeFocused();
  await pageButton(page, 2).click();
  await expect(page.locator('.test-question')).toHaveCount(2);
  await expect(pageButton(page, 2)).toHaveAccessibleName('Questions 11 to 12, 0 of 2 answered');
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Previous page', exact: true }).click();
  await expect(panel(page, 9)).toBeVisible();
});

test('a test of five or fewer needs no page buttons', async ({ page }) => {
  await startPractice(page, 5);
  await expect(page.locator('.test-question')).toHaveCount(5);
  await expect(page.locator('.test-nav-button')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Next page', exact: true })).toHaveCount(0);
});

test('answers, flags and page survive a reload, and the jump buttons find what is left', async ({ page }) => {
  await startPractice(page, 12);
  await answer(page, 0);
  await expect(pageButton(page, 0)).toContainText('1/5');
  await pageButton(page, 1).click();
  await flag(page, 7);
  await expect(panel(page, 7).getByRole('button', { name: 'Remove flag', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(pageButton(page, 1)).toHaveAccessibleName('Questions 6 to 10, 0 of 5 answered, flagged');
  await page.reload();
  await expect(panel(page, 7)).toBeVisible();
  await expect(pageButton(page, 1)).toHaveClass(/is-flagged/);
  await expect(pageButton(page, 0)).toContainText('1/5');
  await pageButton(page, 2).click();
  await page.getByRole('button', { name: 'Next flagged', exact: true }).click();
  await expect(panel(page, 7)).toBeVisible();
  await pageButton(page, 0).click();
  await page.getByRole('button', { name: 'Next unanswered', exact: true }).click();
  await expect(panel(page, 1).locator('.test-question-title')).toBeFocused();
});

test('Next unanswered wraps to earlier questions and disappears once everything is answered', async ({ page }) => {
  await startPractice(page, 2);
  await answer(page, 1);
  await panel(page, 1).locator('input').first().focus();
  await page.getByRole('button', { name: 'Next unanswered', exact: true }).click();
  await expect(panel(page, 0).locator('.test-question-title')).toBeFocused();
  await answer(page, 0);
  await expect(page.getByRole('button', { name: 'Next unanswered', exact: true })).toHaveCount(0);
});

test('Finish stays reachable from any page and summarizes what is left', async ({ page }) => {
  await startPractice(page, 7);
  await pageButton(page, 1).click();
  await flag(page, 5);
  const finish = page.getByRole('button', { name: 'Finish test', exact: true });
  await expect(finish).toBeInViewport();
  let message = '';
  page.once('dialog', dialog => { message = dialog.message(); void dialog.dismiss(); });
  await finish.click();
  expect(message).toContain('7 unanswered questions will count as skipped.');
  expect(message).toContain('1 flagged for review.');
  await expect(page.locator('.test-question')).toHaveCount(2);
  page.once('dialog', dialog => void dialog.accept());
  await finish.click();
  await expect(page.getByRole('region', { name: 'Test score', exact: true })).toBeVisible();
  await expect(page.locator('.test-question')).toHaveCount(7);
  await expect(page.locator('.test-nav-button')).toHaveCount(0);
});

test('the page buttons fit a phone, keep touch sized targets and land clear of the sticky bar', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await startPractice(page, 100);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.locator('.test-nav-button')).toHaveCount(20);
  const box = (await pageButton(page, 19).boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await pageButton(page, 19).click();
  await expect(panel(page, 95)).toBeVisible();
  await expect.poll(async () => {
    const bar = (await page.locator('.test-session-bar').boundingBox())!;
    const title = (await panel(page, 95).locator('.test-question-number').boundingBox())!;
    return title.y >= bar.y + bar.height;
  }).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('links open a page at its top, and Back keeps the place you left', async ({ page }) => {
  await page.goto('/#statistics');
  await expect(page.getByRole('heading', { name: 'Statistics', exact: true, level: 1 })).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 500 });
  await page.evaluate(() => scrollTo(0, 600));
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  const left = await page.evaluate(() => scrollY);
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true, level: 1 })).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Statistics', exact: true, level: 1 })).toBeVisible();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(left);
});

test.describe('without the developer flag', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('learners never see engineering fixtures', async ({ page }) => {
    await page.goto('/#library');
    await expect(page.getByText('3 available packs', { exact: true })).toBeVisible();
    await expect(page.getByText('Engineering fixture', { exact: false })).toHaveCount(0);
    await page.goto('/#library/cards');
    await expect(page.getByText('235 matching cards', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Select card: Fixture/ })).toHaveCount(0);
    await page.goto('/#library/notes');
    await expect(page.getByText('78 matching notes', { exact: true })).toBeVisible();
    await page.goto('/#statistics');
    await expect(page.getByRole('heading', { name: 'Flashcard topics', exact: true })).toBeVisible();
    await expect(page.getByText('Engineering fixture', { exact: false })).toHaveCount(0);
    await page.goto('/#tests');
    await expect(page.getByLabel('Question bank', { exact: true }).locator('option')).toHaveText(['Choose a question bank', 'AB-250 — Original Practice']);
  });

  test('fixture cards already saved in a deck stay usable once the flag is gone', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('tsukiakari.showFixtures', 'on'));
    await page.goto('/#study');
    await page.reload();
    await page.getByRole('button', { name: 'Create a deck', exact: true }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Create a deck', exact: true });
    await dialog.getByLabel('Deck name', { exact: true }).fill('Older deck');
    await dialog.getByRole('button', { name: 'Create deck', exact: true }).click();
    await page.goto('/#library');
    await page.getByRole('region', { name: 'Foundation fixtures', exact: true }).getByRole('button', { name: 'Add entire pack', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Foundation fixtures', exact: true }).getByText(/in Older deck/)).not.toContainText(/^0 of/);
    await page.evaluate(() => localStorage.removeItem('tsukiakari.showFixtures'));
    await page.reload();
    await expect(page.getByRole('region', { name: 'Foundation fixtures', exact: true })).toHaveCount(0);
    await page.goto('/#library/cards');
    await expect(page.getByRole('button', { name: /^Select card: Fixture/ }).first()).toBeVisible();
    await page.goto('/#study');
    await page.getByRole('button', { name: 'Study Older deck', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Reveal answer', exact: true })).toBeVisible();
  });
});
