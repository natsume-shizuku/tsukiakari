import { test, expect, type Page } from '@playwright/test';
const lastDeck = new WeakMap<Page, string>();

async function inspectorNotes(page: Page) {
  const tab = page.getByRole('tab', { name: 'My notes', exact: true });
  if (await tab.count()) await tab.click();
}
async function inspectorActions(page: Page) {
  const button = page.getByRole('button', { name: 'Card actions', exact: true });
  if (await button.count() && await button.getAttribute('aria-expanded') !== 'true') await button.click();
}

async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByText('Saved in this browser', { exact: true }).first()).toBeVisible();
}
async function createDeck(page: Page, name = 'Review deck') {
  if (await page.getByRole('button', { name: 'Close deck settings', exact: true }).isVisible()) await page.getByRole('button', { name: 'Close deck settings', exact: true }).click();
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  await page.getByRole('button', { name: 'Create a deck', exact: true }).click();
  await page.getByLabel('Deck name', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Create deck', exact: true }).click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  lastDeck.set(page, name);
}
async function addFixtures(page: Page) {
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByLabel('Destination deck', { exact: true }).selectOption({ label: lastDeck.get(page)! });
  await page.locator('.library-pack').filter({ has: page.getByRole('heading', { name: 'Foundation fixtures', exact: true }) }).getByRole('button', { name: 'Add entire pack', exact: true }).click();
  await expect(page.getByRole('button', { name: 'All pack cards added', exact: true })).toBeDisabled();
}
async function start(page: Page, name = 'Review deck') {
  if (await page.getByRole('button', { name: 'Close deck settings', exact: true }).isVisible()) await page.getByRole('button', { name: 'Close deck settings', exact: true }).click();
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  await page.getByRole('button', { name: 'Study ' + name, exact: true }).click();
  await expect(page.getByRole('region', { name: 'Review session', exact: true })).toBeVisible();
}
async function revealCorrect(page: Page) {
  if (await page.getByRole('radiogroup', { name: 'Answer choices' }).count()) {
    await page.getByRole('radio', { name: /Four equal sides and four right angles/ }).click();
  }
  await page.getByRole('button', { name: 'Reveal answer', exact: true }).click();
  await expect(page.getByTestId('revealed-answer')).toBeVisible();
}
async function rows(page: Page, storeName: string): Promise<Record<string, unknown>[]> {
  return page.evaluate(name => new Promise<Record<string, unknown>[]>((resolve, reject) => {
    const open = indexedDB.open('tsukiakari');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(name);
      const request = tx.objectStore(name).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    };
  }), storeName);
}
async function failNextReviewWrite(page: Page) {
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    let fail = true;
    IDBObjectStore.prototype.put = function(value, key) {
      if (fail && ['schedulerStates', 'reviewLogs', 'reviewSessions', 'copies'].includes(this.name)) {
        fail = false;
        throw new DOMException('Simulated full storage', 'QuotaExceededError');
      }
      return original.call(this, value, key);
    };
  });
}

test('reveals with sources, survives reload, reviews atomically, and undoes the last review', async ({ page }) => {
  await ready(page); await createDeck(page); await addFixtures(page); await start(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const question = await page.locator('.review-question').innerText();
  await revealCorrect(page);
  await page.locator('.review-sources > summary').click();
  await expect(page.getByRole('region', { name: 'Review session' }).getByRole('link', { name: /Wolfram MathWorld/ }).first()).toBeVisible();
  await page.locator('.review-panel').screenshot({ path: 'test-results/phase2-desktop.png' });
  await page.reload();
  await expect(page.getByTestId('revealed-answer')).toBeVisible();
  await expect(page.locator('.review-question')).toHaveText(question);
  expect(await rows(page, 'reviewLogs')).toHaveLength(0);
  const originalSession = (await rows(page, 'reviewSessions'))[0];
  await page.getByRole('button', { name: 'Right', exact: true }).click();
  await expect.poll(async () => (await rows(page, 'reviewLogs')).length).toBe(1);
  await expect(page.getByTestId('revealed-answer')).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo last review', exact: true }).click();
  await expect(page.locator('.review-question')).toHaveText(question);
  await expect(page.getByTestId('revealed-answer')).toBeVisible();
  const logs = await rows(page, 'reviewLogs');
  expect(logs[0].undone).toBe(true);
  expect(logs[0].undoable).toBe(false);
  expect((await rows(page, 'reviewSessions'))[0].copyId).toBe(originalSession.copyId);
  await expect(page.getByRole('button', { name: 'Undo last review', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Again', exact: true }).click();
  await expect.poll(async () => (await rows(page, 'reviewLogs')).length).toBe(2);
  const second = (await rows(page, 'reviewLogs')).find(log => !log.undone)!;
  expect(second.rating).toBe('again');
  expect(second.durationMs).toBeGreaterThanOrEqual(0);
});

test('failed review and failed undo keep the current card and saved records intact', async ({ page }) => {
  await ready(page); await createDeck(page); await addFixtures(page); await start(page);
  await revealCorrect(page);
  const firstQuestion = await page.locator('.review-question').innerText();
  const beforeSession = await rows(page, 'reviewSessions');
  await failNextReviewWrite(page);
  await page.getByRole('button', { name: 'Right', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('could not be saved');
  await expect(page.getByTestId('revealed-answer')).toBeVisible();
  await expect(page.locator('.review-question')).toHaveText(firstQuestion);
  expect(await rows(page, 'reviewLogs')).toHaveLength(0);
  expect(await rows(page, 'reviewSessions')).toEqual(beforeSession);
  await page.getByRole('button', { name: 'Right', exact: true }).click();
  await expect.poll(async () => (await rows(page, 'reviewLogs')).length).toBe(1);
  await expect(page.getByTestId('revealed-answer')).toHaveCount(0);
  const afterStates = await rows(page, 'schedulerStates');
  const afterSession = await rows(page, 'reviewSessions');
  await failNextReviewWrite(page);
  await page.getByRole('button', { name: 'Undo last review', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('could not be saved');
  expect(await rows(page, 'schedulerStates')).toEqual(afterStates);
  expect(await rows(page, 'reviewSessions')).toEqual(afterSession);
  expect((await rows(page, 'reviewLogs'))[0].undone).toBe(false);
  await page.getByRole('button', { name: 'Undo last review', exact: true }).click();
  await expect(page.getByTestId('revealed-answer')).toBeVisible();
  await expect(page.locator('.review-question')).toHaveText(firstQuestion);
});

test('settings and allowances are per deck; learning returns even with no daily reviews', async ({ page }) => {
  await page.clock.install();
  await ready(page); await createDeck(page, 'One per day'); await addFixtures(page);
  await createDeck(page, 'Another deck'); await addFixtures(page);
  if (await page.getByRole('button', { name: 'Close deck settings', exact: true }).isVisible()) await page.getByRole('button', { name: 'Close deck settings', exact: true }).click();
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  await page.getByRole('link', { name: 'Manage One per day', exact: true }).click();
  await page.getByLabel('New cards / day', { exact: true }).fill('1');
  await page.getByLabel('Maximum reviews / day', { exact: true }).fill('0');
  await page.getByLabel('Learning steps', { exact: true }).fill('10m 1m');
  await page.getByRole('button', { name: 'Save deck settings', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('increase');
  await expect(page.getByLabel('Learning steps', { exact: true })).toHaveValue('10m 1m');
  await page.getByLabel('Learning steps', { exact: true }).fill('1m 10m 1h');
  await page.getByRole('button', { name: 'Save deck settings', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('dialog').getByText('Deck settings saved.', { exact: false }).first()).toBeVisible();
  if (await page.getByRole('button', { name: 'Close deck settings', exact: true }).isVisible()) await page.getByRole('button', { name: 'Close deck settings', exact: true }).click();
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  await page.getByRole('link', { name: 'Manage Another deck', exact: true }).click();
  await expect(page.getByLabel('New cards / day', { exact: true })).toHaveValue('20');
  await expect(page.getByLabel('Maximum reviews / day', { exact: true })).toHaveValue('9999');
  await start(page, 'One per day'); await revealCorrect(page);
  await page.getByRole('button', { name: 'Again', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nothing due right now', exact: true })).toBeVisible();
  await page.clock.fastForward(61_000);
  await expect(page.getByRole('heading', { name: 'Cards are ready to review', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Check due cards', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reveal answer', exact: true })).toBeVisible();
  const settings = (await rows(page, 'decks')).find(deck => deck.name === 'One per day')!.settings as Record<string, unknown>;
  expect(settings.newCardsPerDay).toBe(1);
  expect(settings.maximumReviewsPerDay).toBe(0);
});

test('MCQ shortcuts preserve the choice, guessed state, and prevent a wrong Right rating', async ({ page }) => {
  await ready(page); await createDeck(page); await addFixtures(page);
  if (await page.getByRole('button', { name: 'Close deck settings', exact: true }).isVisible()) await page.getByRole('button', { name: 'Close deck settings', exact: true }).click();
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  await page.getByRole('link', { name: 'Manage Review deck', exact: true }).click();
  await page.getByRole('tab', { name: 'Cards', exact: true }).click();
  const entries = page.locator('.membership-list li');
  for (const fragment of ['What is 2 + 3?', 'What do we call', 'How many sides']) {
    const row = entries.filter({ hasText: fragment }).getByRole('button', { name: /^Select card:/ });
    await row.click();
  await inspectorActions(page);
    await page.getByRole('button', { name: 'Suspend card', exact: true }).click();
  await inspectorActions(page);
    await expect(page.getByRole('button', { name: 'Resume card', exact: true })).toBeVisible();
    await row.click({modifiers:['Control']});
  }
  await start(page);
  const review = page.getByRole('region', { name: 'Review session', exact: true });
  await expect(review).toBeFocused();
  await page.keyboard.press('a');
  await page.keyboard.press('g');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('revealed-answer')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Right', exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('radio', { name: /Three equal sides/ })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByLabel('I guessed this answer')).toBeChecked();
  await expect(page.getByRole('button', { name: 'Right', exact: true })).toBeDisabled();
  await review.focus();
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await rows(page, 'reviewLogs')).length).toBe(1);
  expect((await rows(page, 'reviewLogs'))[0].rating).toBe('again');
  await page.getByRole('button', { name: 'Undo last review', exact: true }).click();
  await expect(page.getByTestId('revealed-answer')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Right', exact: true })).toBeDisabled();
});

test('review controls are read-only in a second tab', async ({ page, context }) => {
  await ready(page); await createDeck(page); await addFixtures(page); await start(page); await revealCorrect(page);
  const second = await context.newPage();
  await second.goto('/#study/review');
  await expect(second.getByText('This is a read-only tab.')).toBeVisible();
  await expect(second.getByTestId('revealed-answer')).toBeVisible();
  await expect(second.getByRole('button', { name: 'Right', exact: true })).toBeDisabled();
  await expect(second.getByRole('button', { name: 'Again', exact: true })).toBeDisabled();
  await inspectorActions(page);
  await second.locator('.review-more-actions > summary').click();
  await expect(second.getByRole('button', { name: 'Suspend card', exact: true })).toBeDisabled();
  await second.getByRole('region', { name: 'Review session' }).focus();
  await second.keyboard.press('Enter');
  expect(await rows(second, 'reviewLogs')).toHaveLength(0);
});

test('review and editable settings fit a 320px screen and use touch-sized actions', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await ready(page); await createDeck(page, 'A deck with a long name for small screens'); await addFixtures(page);
  await start(page, 'A deck with a long name for small screens'); await revealCorrect(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator('.review-more-actions > summary').click();
  for (const name of ['Again', 'Right', 'Undo last review', 'Suspend card']) {
    const box = await page.getByRole('button', { name, exact: true }).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await page.locator('.review-panel').screenshot({ path: 'test-results/phase2-mobile.png' });
  if (await page.getByRole('button', { name: 'Close deck settings', exact: true }).isVisible()) await page.getByRole('button', { name: 'Close deck settings', exact: true }).click();
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  await page.getByRole('link', { name: 'Manage A deck with a long name for small screens', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByLabel('New cards / day', { exact: true })).toHaveValue('20');
});

test('active time survives pause and reload without counting the paused interval', async ({ page }) => {
  await page.clock.install();
  await ready(page); await createDeck(page); await addFixtures(page); await start(page); await revealCorrect(page);
  await page.clock.fastForward(5_000);
  await page.getByRole('button', { name: 'Pause review', exact: true }).click();
  await page.clock.fastForward(600_000);
  await page.getByRole('button', { name: 'Continue studying', exact: true }).click();
  await expect(page.getByTestId('revealed-answer')).toBeVisible();
  await page.clock.fastForward(5_000);
  await page.reload();
  await expect(page.getByTestId('revealed-answer')).toBeVisible();
  await page.getByRole('button', { name: 'Right', exact: true }).click();
  await expect.poll(async () => (await rows(page, 'reviewLogs')).length).toBe(1);
  const duration = (await rows(page, 'reviewLogs'))[0].durationMs as number;
  expect(duration).toBeGreaterThanOrEqual(9_000);
  expect(duration).toBeLessThan(20_000);
});
