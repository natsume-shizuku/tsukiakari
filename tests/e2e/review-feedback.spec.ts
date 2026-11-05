import { test, expect, type Page } from '@playwright/test';

interface Attempt { questions: { card: { id: string; correctOptionIds: string[] } }[]; completedAt: number | null; mode: string; deadlineAt: number | null; }
function rows<T>(page: Page, table: string) {
  return page.evaluate(name => new Promise<T[]>((resolve, reject) => {
    const request = indexedDB.open('tsukiakari');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const read = db.transaction(name).objectStore(name).getAll();
      read.onsuccess = () => { db.close(); resolve(read.result as T[]); };
    };
  }), table);
}
const active = async (page: Page) => (await rows<Attempt>(page, 'testAttempts')).find(item => item.completedAt === null)!;

async function deckWithPack(page: Page, name: string, pack = 'Foundation fixtures') {
  await page.goto('/#study');
  await page.getByRole('button', { name: 'Create a deck', exact: true }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Create a deck', exact: true });
  await dialog.getByLabel('Deck name', { exact: true }).fill(name);
  await dialog.getByRole('button', { name: 'Create deck', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.goto('/#library');
  const panel = page.getByRole('region', { name: pack, exact: true });
  await panel.getByRole('button', { name: 'Add entire pack', exact: true }).click();
  await expect(panel.getByRole('button', { name: 'All pack cards added', exact: true })).toBeDisabled();
}
async function finishPractice(page: Page) {
  await page.goto('/#tests?bank=ab250-original');
  await expect(page.getByText(/300 available questions/)).toBeVisible();
  await page.getByLabel('Number of questions', { exact: true }).fill('5');
  await page.getByRole('button', { name: 'Start practice', exact: true }).click();
  await expect(page.locator('.test-session-bar')).toContainText('of 5 answered');
  const attempt = await active(page);
  const first = attempt.questions[0].card;
  for (const id of first.correctOptionIds) await page.locator(`.test-question[data-index="0"] input[value="${id}"]`).check();
  await expect.poll(async () => (await page.locator('.test-session-bar').innerText()).includes('1 of 5 answered')).toBe(true);
  await page.locator('.test-question[data-index="1"] input').first().check();
  await expect.poll(async () => (await page.locator('.test-session-bar').innerText()).includes('2 of 5 answered')).toBe(true);
  page.once('dialog', dialog => void dialog.accept());
  await page.getByRole('button', { name: 'Finish test', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Test score', exact: true })).toBeVisible();
}

test('results can be filtered, explanations open on request, and Retry missed starts only those', async ({ page }) => {
  await finishPractice(page);
  const correct = (await rows<Attempt>(page, 'testAttempts'))[0];
  const score = await page.getByRole('region', { name: 'Test score', exact: true }).innerText();
  const skipped = Number(/(\d+) skipped/.exec(score)![1]);
  const wrong = Number(/(\d+) wrong/.exec(score)![1]);
  await expect(page.locator('.test-question')).toHaveCount(5);
  await page.getByRole('button', { name: `Skipped (${skipped})`, exact: true }).click();
  await expect(page.locator('.test-question')).toHaveCount(skipped);
  await expect(page.locator('.test-question').first().locator('.test-question-number')).toHaveText('Question 3');
  await page.getByRole('button', { name: 'All (5)', exact: true }).click();
  await expect(page.locator('.test-question')).toHaveCount(5);
  const why = page.locator('.test-why').first();
  await expect(why.locator('.test-option-explanations')).toBeHidden();
  await why.locator('summary').click();
  await expect(why.locator('.test-option-explanations')).toBeVisible();
  await page.getByRole('button', { name: `Retry missed (${wrong + skipped})`, exact: true }).click();
  await expect(page.locator('.test-session-bar')).toContainText(`of ${wrong + skipped} answered`);
  const retry = await active(page);
  expect(retry.questions.map(question => question.card.id)).not.toContain(correct.questions[0].card.id);
});

test('a single revealed answer reads correctly on the results page', async ({ page }) => {
  await page.goto('/#tests?bank=ab250-original');
  await expect(page.getByText(/300 available questions/)).toBeVisible();
  await page.getByLabel('Number of questions', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Start practice', exact: true }).click();
  await page.locator('.test-question input').first().check();
  await page.getByRole('button', { name: 'Reveal answer', exact: true }).click();
  page.once('dialog', dialog => void dialog.accept());
  await page.getByRole('button', { name: 'Finish test', exact: true }).click();
  await expect(page.getByText('1 answer revealed during practice', { exact: true })).toBeVisible();
});

test('the study day can be changed, and it ends the review and clears undo', async ({ page }) => {
  await deckWithPack(page, 'Day deck');
  await page.goto('/#study');
  await page.getByRole('button', { name: 'Study Day deck', exact: true }).click();
  await page.getByRole('button', { name: 'Reveal answer', exact: true }).click();
  await page.getByRole('button', { name: 'Right', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Undo last review', exact: true })).toBeEnabled();
  await page.goto('/#settings');
  const save = page.getByRole('button', { name: 'Save study day', exact: true });
  await expect(save).toBeDisabled();
  await page.getByLabel('Day starts at', { exact: true }).selectOption('4');
  await page.getByLabel('Time zone', { exact: true }).selectOption('Asia/Tokyo');
  await save.click();
  await expect(page.getByText('Starts at 04:00 in Asia/Tokyo.', { exact: false })).toBeVisible();
  await expect(save).toBeDisabled();
  await page.reload();
  await expect(page.getByLabel('Day starts at', { exact: true })).toHaveValue('4');
  expect(await rows(page, 'reviewSessions')).toEqual([]);
  expect((await rows<{ undoable: boolean }>(page, 'reviewLogs')).every(log => !log.undoable)).toBe(true);
  await page.goto('/#statistics');
  await expect(page.getByText(/Study days begin at 04:00 in Asia\/Tokyo/)).toBeVisible();
});

test('study cards hide internal details and keep long prompts readable', async ({ page }) => {
  await deckWithPack(page, 'Card deck', 'AB-250 — Advanced Scenarios');
  await page.goto('/#study');
  await page.getByRole('button', { name: 'Study Card deck', exact: true }).click();
  const question = page.locator('.review-question');
  await expect(question).toBeVisible();
  await expect(page.locator('.review-content')).not.toContainText('Revision');
  const prompt = await question.innerText();
  expect(await question.evaluate(element => getComputedStyle(element).textAlign)).toBe(prompt.length > 100 ? 'left' : 'center');
  await page.getByRole('radiogroup', { name: 'Answer choices' }).getByRole('radio').first().click();
  await page.getByRole('button', { name: 'Reveal answer', exact: true }).click();
  const before = await rows(page, 'reviewLogs');
  await page.getByRole('button', { name: 'Again', exact: true }).click();
  await expect.poll(async () => (await rows(page, 'reviewLogs')).length).toBe(before.length + 1);
  await expect(page.getByText(/next card is ready/)).toHaveCount(0);
});

test('several cards can be selected without a Ctrl key', async ({ page }) => {
  await page.goto('/#library/cards');
  await page.getByRole('button', { name: 'Select several', exact: true }).click();
  const cards = page.getByRole('button', { name: /^Select card:/ });
  await cards.nth(0).click();
  await cards.nth(1).click();
  await expect(page.getByText('2 selected', { exact: true })).toBeVisible();
  await cards.nth(1).click();
  await expect(page.getByText('1 selected', { exact: true })).toBeVisible();
});

test.describe('without the developer flag', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('cards show readable labels, not filter tags', async ({ page }) => {
    await page.goto('/#library/cards');
    await expect(page.getByText('235 matching cards', { exact: true })).toBeVisible();
    await expect(page.getByText(/#topic:|#domain:|#task:/)).toHaveCount(0);
  });
});

test.describe('on a Japanese system', () => {
  test.use({ locale: 'ja-JP' });
  test('dates stay in the language of the site', async ({ page }) => {
    await page.goto('/#statistics');
    await expect(page.getByRole('heading', { name: 'Statistics', exact: true, level: 1 })).toBeVisible();
    await expect(page.locator('main')).not.toContainText(/d+月/);
  });
});

test('the deck search appears only when there are enough decks to search', async ({ page }) => {
  await deckWithPack(page, 'Only deck');
  await page.goto('/#study');
  await expect(page.getByRole('button', { name: 'Study Only deck', exact: true })).toBeVisible();
  await expect(page.getByLabel('Search personal decks', { exact: true })).toHaveCount(0);
});
