import { test, expect, type Page } from '@playwright/test';
import type { TestAttempt } from '../../src/domain';

async function rows<T>(page: Page, name: string): Promise<T[]> {
  return page.evaluate(table => new Promise<T[]>((resolve, reject) => {
    const request = indexedDB.open('tsukiakari');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(table);
      const read = tx.objectStore(table).getAll();
      read.onsuccess = () => resolve(read.result);
      read.onerror = () => reject(read.error);
      tx.oncomplete = () => db.close();
    };
  }), name);
}
async function attempts(page: Page) { return (await rows<TestAttempt>(page, 'testAttempts')).sort((a, b) => a.startedAt - b.startedAt); }
async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByText('Saved in this browser', { exact: true }).first()).toBeVisible();
}
async function start(page: Page, mode: 'practice' | 'exam' = 'practice', count = 50, minutes = 120) {
  await page.getByRole('link', { name: 'Tests', exact: true }).click();
  await page.getByLabel('Question bank', { exact: true }).selectOption('developer-test-fixture');
  await expect(page.getByText(/300 available questions/)).toBeVisible();
  await page.getByLabel('Test mode', { exact: true }).selectOption(mode);
  await page.getByLabel('Number of questions', { exact: true }).fill(String(count));
  if (mode === 'exam') await page.getByLabel('Time limit (minutes)', { exact: true }).fill(String(minutes));
  await page.getByRole('button', { name: mode === 'practice' ? 'Start practice' : 'Start exam', exact: true }).click();
  await expect(page.locator('.test-session-bar')).toContainText(`of ${count} answered`);
  return (await attempts(page)).find(attempt => attempt.completedAt === null)!;
}
async function question(page: Page, index: number) {
  const button = page.locator(`.test-nav-button[data-page="${Math.floor(index / 5)}"]`);
  if (!await button.count()) return page.locator('.test-question').nth(index);
  if (!await button.getAttribute('aria-current')) await button.click();
  return page.locator(`.test-question[data-index="${index}"]`);
}
async function choose(page: Page, attempt: TestAttempt, index: number, correct = true) {
  const card = attempt.questions[index].card;
  const optionIds = correct ? card.correctOptionIds : [card.options.find(option => !card.correctOptionIds.includes(option.id))!.id];
  const selected: string[] = [];
  for (const optionId of optionIds) {
    const position = card.options.findIndex(option => option.id === optionId);
    await (await question(page, index)).locator('input[type="radio"], input[type="checkbox"]').nth(position).check();
    selected.push(optionId);
    await expect.poll(async () => [...((await attempts(page)).find(item => item.id === attempt.id)!.responses.find(response => response.cardId === card.id)?.selectedOptionIds ?? [])].sort()).toEqual([...selected].sort());
  }
}

async function confirmButton(page: Page, label: string, index?: number) {
  if (label === 'Finish test') page.once('dialog', dialog => dialog.accept());
  await (index === undefined ? page : (await question(page, index))).getByRole('button', { name: label, exact: true }).click();
}
async function finish(page: Page) {
  await confirmButton(page, 'Finish test');
  await expect.poll(async () => (await attempts(page)).every(attempt => attempt.completedAt !== null)).toBe(true);
}
async function failNextWrite(page: Page) {
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    let fail = true;
    IDBObjectStore.prototype.put = function(value, key) {
      if (fail && this.name === 'testAttempts') { fail = false; throw new DOMException('Simulated test save failure', 'QuotaExceededError'); }
      return put.call(this, value, key);
    };
  });
}

test('practice freezes revealed responses, persists reloads and isolates test results from flashcards', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'Create a deck', exact: true }).click();
  const create = page.getByRole('dialog', { name: 'Create a deck', exact: true });
  await create.getByLabel('Deck name', { exact: true }).fill('Unchanged by tests');
  await create.getByRole('button', { name: 'Create deck', exact: true }).click();
  await expect(create).not.toBeVisible();
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByLabel('Destination deck', { exact: true }).selectOption({ label: 'Unchanged by tests' });
  const pack = page.locator('.library-pack').filter({ has: page.getByRole('heading', { name: 'Foundation fixtures', exact: true }) });
  await pack.getByRole('button', { name: 'Add entire pack', exact: true }).click();
  await expect(pack.getByRole('button', { name: 'All pack cards added', exact: true })).toBeDisabled();
  await expect(page.getByText('Engineering test preview', { exact: true })).toHaveCount(0);
  const before = await Promise.all(['decks', 'copies', 'schedulerStates', 'reviewLogs'].map(table => rows(page, table)));
  const attempt = await start(page);
  await choose(page, attempt, 0, true);
  await choose(page, attempt, 1, false);
  await confirmButton(page, 'Reveal answer', 1);
  await expect((await question(page, 1)).getByText('Incorrect · Response locked after reveal', { exact: true })).toBeVisible();
  await expect((await question(page, 1)).locator('input[type="radio"], input[type="checkbox"]').first()).toBeDisabled();
  await expect((await question(page, 1)).getByRole('link', { name: /Wolfram MathWorld: Addition/ })).toHaveAttribute('href', 'https://mathworld.wolfram.com/Addition.html');
  await confirmButton(page, 'Reveal answer', 2);
  await expect((await question(page, 2)).getByText('Skipped · Response locked after reveal', { exact: true })).toBeVisible();
  await page.reload();
  await expect((await question(page, 1)).getByText('Incorrect · Response locked after reveal', { exact: true })).toBeVisible();
  await expect((await question(page, 2)).locator('input[type="radio"], input[type="checkbox"]').first()).toBeDisabled();
  await finish(page);
  await expect(page.getByRole('region', { name: 'Test score' })).toContainText('1/50 (2%)');
  await expect(page.getByRole('region', { name: 'Test score' })).toContainText('1 correct · 1 wrong · 48 skipped');
  const completed = (await attempts(page))[0];
  expect(completed.result).toEqual({ correct: 1, wrong: 1, skipped: 48 });
  for (const index of [0, 1, 2, 49]) await expect((await question(page, index)).locator('input[type="radio"], input[type="checkbox"]').first()).toBeDisabled();
  expect(await Promise.all(['decks', 'copies', 'schedulerStates', 'reviewLogs'].map(table => rows(page, table)))).toEqual(before);
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByRole('link', { name: 'Mistakes', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Select mistake:/ })).toHaveCount(0);
});

test('failed answer writes retain the draft, block finish and protect navigation until retry', async ({ page }) => {
  await ready(page);
  const attempt = await start(page);
  await failNextWrite(page);
  await (await question(page, 20)).locator('input[type="radio"], input[type="checkbox"]').nth(1).check();
  await expect((await question(page, 20)).getByRole('alert')).toHaveText('This selection is not saved.');
  await expect((await question(page, 20)).locator('input[type="radio"], input[type="checkbox"]').nth(1)).toBeChecked();
  expect((await attempts(page))[0].responses[20].selectedOptionIds).toEqual([]);
  await expect(page.getByRole('button', { name: 'Finish test', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Go to unsaved answer', exact: true }).click();
  await expect((await question(page, 20)).getByRole('button', { name: 'Retry saving answer', exact: true })).toBeFocused();
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await expect((await question(page, 20)).locator('input[type="radio"], input[type="checkbox"]').nth(1)).toBeChecked();
  await (await question(page, 20)).getByRole('button', { name: 'Retry saving answer', exact: true }).click();
  await expect((await question(page, 20)).getByRole('button', { name: 'Retry saving answer', exact: true })).toHaveCount(0);
  expect((await attempts(page))[0].responses[20].selectedOptionIds).toEqual([attempt.questions[20].card.options[1].id]);
  await expect(page.getByRole('button', { name: 'Finish test', exact: true })).toBeEnabled();
  await failNextWrite(page);
  await confirmButton(page, 'Reveal answer', 20);
  await expect((await question(page, 20)).getByRole('heading', { name: 'Answer', exact: true })).toHaveCount(0);
  expect((await attempts(page))[0].responses[20].revealed).toBe(false);
  await confirmButton(page, 'Reveal answer', 20);
  await expect((await question(page, 20)).getByRole('heading', { name: 'Answer', exact: true })).toBeVisible();
  await failNextWrite(page);
  await confirmButton(page, 'Finish test');
  expect((await attempts(page))[0].completedAt).toBeNull();
  await expect(page.locator('.test-session-bar')).toContainText(`of ${50} answered`);
  await expect(page.getByRole('button', { name: 'Finish test', exact: true })).toBeEnabled();
  await finish(page);
});

test('retry keeps frozen snapshots but fresh responses; a new test avoids previously exposed questions', async ({ page }) => {
  await ready(page);
  const first = await start(page, 'practice', 100);
  expect(new Set(first.questions.map(item => item.card.id)).size).toBe(100);
  await choose(page, first, 0);
  await finish(page);
  await page.getByRole('button', { name: 'Retry same questions', exact: true }).click();
  await expect.poll(async () => (await attempts(page)).length).toBe(2);
  const retry = (await attempts(page)).find(item => item.completedAt === null)!;
  expect(retry.id).not.toBe(first.id);
  expect(retry.questions).toEqual(first.questions);
  expect(retry.responses.every(response => response.selectedOptionIds.length === 0 && !response.revealed)).toBe(true);
  await finish(page);
  await page.getByRole('button', { name: 'New test', exact: true }).click();
  await page.getByLabel('Question bank', { exact: true }).selectOption('developer-test-fixture');
  await page.getByRole('button', { name: 'Start practice', exact: true }).click();
  await expect.poll(async () => (await attempts(page)).length).toBe(3);
  const next = (await attempts(page)).find(item => item.completedAt === null)!;
  expect(next.questions).toHaveLength(100);
  const exposed = new Set(first.questions.map(item => item.card.id));
  expect(next.questions.every(item => !exposed.has(item.card.id))).toBe(true);
  await page.getByRole('button', { name: 'Back to Tests', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Attempt history', exact: true })).toHaveCount(0);
  expect(await attempts(page)).toHaveLength(3);
  await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeDisabled();
});

test('exam hides answers until submission and opens a scored dialog before frozen review', async ({ page }) => {
  await ready(page);
  const attempt = await start(page, 'exam');
  await expect(page.getByLabel('Time remaining', { exact: true })).toHaveText(/0[12]:[0-5][0-9]:[0-5][0-9]/);
  await expect(page.getByRole('button', { name: 'Reveal answer', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'References', exact: true })).toHaveCount(0);
  await choose(page, attempt, 0, true);
  await finish(page);
  const dialog = page.getByRole('dialog', { name: 'Test results', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('1/50 (2%)');
  await expect(page.locator('.test-question')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Review exam', exact: true })).toBeFocused();
  await page.screenshot({ path: 'test-results/phase4-exam-results.png' });
  await dialog.getByRole('button', { name: 'Review exam', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.test-question')).toHaveCount(50);
  await expect((await question(page, 0)).locator('input[type="radio"], input[type="checkbox"]').first()).toBeDisabled();
  await expect((await question(page, 0)).getByRole('heading', { name: 'References', exact: true })).toBeVisible();
});

test('absolute exam deadline survives reload and finalizes while another page is open', async ({ page }) => {
  await page.clock.install({ time: new Date('2030-05-10T12:00:00Z') });
  await ready(page);
  const attempt = await start(page, 'exam', 50, 1);
  await choose(page, attempt, 0, true);
  await page.reload();
  await expect(page.locator('.test-session-bar')).toContainText(`of ${50} answered`);
  expect((await attempts(page))[0].deadlineAt).toBe(attempt.deadlineAt);
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.clock.fastForward(61_000);
  await expect.poll(async () => (await attempts(page))[0].completedAt).toBe(attempt.deadlineAt);
  expect((await attempts(page))[0].result).toEqual({ correct: 1, wrong: 0, skipped: 49 });
  await page.getByRole('link', { name: 'Tests', exact: true }).click();
  await page.getByLabel('Question bank', { exact: true }).selectOption('developer-test-fixture');
  await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeEnabled();
  await expect(page.getByRole('heading', { name: 'Attempt history', exact: true })).toHaveCount(0);
  expect((await attempts(page))[0].result).toEqual({ correct: 1, wrong: 0, skipped: 49 });
});

test('an exam that expires while the site is closed finalizes from its stored deadline on reopen', async ({ page }) => {
  await page.clock.install({ time: new Date('2030-05-11T12:00:00Z') });
  await ready(page);
  const attempt = await start(page, 'exam', 50, 1);
  await choose(page, attempt, 0, false);
  await page.goto('about:blank');
  await page.clock.fastForward(61_000);
  await page.goto('/#tests');
  await expect.poll(async () => (await attempts(page))[0].completedAt).toBe(attempt.deadlineAt);
  expect((await attempts(page))[0].result).toEqual({ correct: 0, wrong: 1, skipped: 49 });
  const dialog = page.getByRole('dialog', { name: 'Test results', exact: true });
  await expect(dialog).toContainText('0/50 (0%)');
  await dialog.getByRole('button', { name: 'Review exam', exact: true }).click();
  await expect((await question(page, 0)).locator('input[type="radio"], input[type="checkbox"]').first()).toBeDisabled();
});

test('a secondary tab can inspect but cannot mutate a saved test', async ({ page, context }) => {
  await ready(page);
  const attempt = await start(page);
  await choose(page, attempt, 0);
  const second = await context.newPage();
  await second.goto('/#tests');
  await expect(second.getByText('This is a read-only tab.', { exact: true })).toBeVisible();
  await expect((await question(second, 0)).locator('input[type="radio"], input[type="checkbox"]').first()).toBeDisabled();
  await expect((await question(second, 0)).getByRole('button', { name: 'Reveal answer', exact: true })).toBeDisabled();
  await expect(second.getByRole('button', { name: 'Finish test', exact: true })).toBeDisabled();
  await expect(second.getByRole('button', { name: 'Abandon test', exact: true })).toBeDisabled();
  expect((await attempts(second))[0]).toEqual((await attempts(page))[0]);
  await second.close();
});

for (const theme of ['dark', 'light']) {
  test(`test form supports keyboard and responsive touch targets in ${theme} theme`, async ({ page }) => {
    await ready(page);
    await page.getByRole('link', { name: 'Settings', exact: true }).click();
    await page.getByLabel('Appearance', { exact: true }).selectOption(theme);
    await page.getByRole('link', { name: 'Tests', exact: true }).click();
    await expect(page.getByLabel('Number of questions', { exact: true })).toHaveValue('20');
    await page.getByLabel('Test mode', { exact: true }).selectOption('exam');
    await expect(page.getByLabel('Number of questions', { exact: true })).toHaveValue('100');
    await expect(page.getByLabel('Time limit (minutes)', { exact: true })).toHaveValue('120');
    await page.screenshot({ path: `test-results/phase4-setup-${theme}.png` });
    const attempt = await start(page);
    const radio = (await question(page, 0)).locator('input[type="radio"], input[type="checkbox"]').first();
    await radio.focus(); await page.keyboard.press('Space');
    await expect(radio).toBeChecked();
    await expect.poll(async () => (await attempts(page))[0].responses[0].selectedOptionIds).toEqual([attempt.questions[0].card.options[0].id]);
    for (const width of [320, 768, 1440, 1920, 2560]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const targets = await (await question(page, 0)).locator('label.test-option, button').evaluateAll(elements => elements.map(element => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height })));
      expect(targets.every(target => target.width >= 44 && target.height >= 44)).toBe(true);
      if (width === 320 || width === 1440 || width === 2560) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: `test-results/phase4-${theme}-${width}.png` });
      }
    }
    await confirmButton(page, 'Reveal answer', 0);
    await expect((await question(page, 0)).getByRole('heading', { name: 'Answer', exact: true })).toBeVisible();
  });
}


test('failed deadline finalization stays locked and can be retried without accepting late answers', async ({ page }) => {
  await page.clock.install({ time: new Date('2030-05-12T12:00:00Z') });
  await ready(page);
  const attempt = await start(page, 'exam', 50, 1);
  await choose(page, attempt, 0, true);
  await failNextWrite(page);
  await page.clock.fastForward(61_000);
  await expect(page.getByRole('alert').filter({ hasText: 'Storage needs attention' })).toBeVisible();
  expect((await attempts(page))[0].completedAt).toBeNull();
  await expect((await question(page, 1)).locator('input[type="radio"], input[type="checkbox"]').first()).toBeDisabled();
  await page.clock.fastForward(5000);
  expect((await attempts(page))[0].completedAt).toBeNull();
  await page.getByRole('button', { name: 'Retry finalization', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Test results', exact: true })).toContainText('1/50 (2%)');
  expect((await attempts(page))[0].completedAt).toBe(attempt.deadlineAt);
  expect((await attempts(page))[0].result).toEqual({correct:1,wrong:0,skipped:49});
});


test('abandon protects cancellation and failed writes, then clears the attempt and unsaved draft', async ({ page }) => {
  await ready(page);
  const completed = await start(page);
  await finish(page);
  const history = (await attempts(page))[0];
  await page.getByRole('button', { name: 'New test', exact: true }).click();
  const active = await start(page);
  await expect(page.getByRole('button', { name: 'Clear answer', exact: true })).toHaveCount(0);
  await expect(page.getByText('Revealing locks your response.', { exact: true })).toHaveCount(0);
  await failNextWrite(page);
  await (await question(page, 0)).locator('input[type="radio"], input[type="checkbox"]').nth(1).check();
  await expect((await question(page, 0)).getByRole('alert')).toHaveText('This selection is not saved.');
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Abandon test', exact: true }).click();
  await expect((await question(page, 0)).locator('input[type="radio"], input[type="checkbox"]').nth(1)).toBeChecked();
  expect((await attempts(page)).find(item => item.id === active.id)?.completedAt).toBeNull();
  await page.evaluate(() => {
    const remove = IDBObjectStore.prototype.delete;
    let fail = true;
    IDBObjectStore.prototype.delete = function(key) {
      if (fail && this.name === 'testAttempts') { fail = false; throw new DOMException('Simulated abandon failure', 'UnknownError'); }
      return remove.call(this, key);
    };
  });
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Abandon test', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Storage needs attention' })).toBeVisible();
  expect((await attempts(page)).some(item => item.id === active.id)).toBe(true);
  await expect((await question(page, 0)).locator('input[type="radio"], input[type="checkbox"]').nth(1)).toBeChecked();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Abandon test', exact: true }).click();
  await expect(page.getByText('Test abandoned. You can start a new test.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tests', exact: true })).toBeFocused();
  expect(await attempts(page)).toEqual([history]);
  expect(history.id).toBe(completed.id);
  await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeEnabled();
  await start(page);
  expect((await attempts(page)).filter(item => item.completedAt === null)).toHaveLength(1);
});

test('abandon from the resume panel discards an exam without a score or later deadline result', async ({ page }) => {
  await page.clock.install({ time: new Date('2030-05-13T12:00:00Z') });
  await ready(page);
  await start(page, 'exam', 50, 1);
  await page.getByRole('button', { name: 'Back to Tests', exact: true }).click();
  const resume = page.getByRole('region', { name: 'Unfinished test', exact: true });
  page.once('dialog', dialog => dialog.dismiss());
  await resume.getByRole('button', { name: 'Abandon test', exact: true }).click();
  await expect(resume).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await resume.getByRole('button', { name: 'Abandon test', exact: true }).click();
  await expect(resume).toHaveCount(0);
  expect(await attempts(page)).toEqual([]);
  await page.clock.fastForward(61000);
  await page.reload();
  expect(await attempts(page)).toEqual([]);
  await start(page, 'exam');
});


for (const width of [320, 1440]) {
  test('answer saves keep option appearance, focus and layout stable at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await ready(page);
    const attempt = await start(page);
    await page.evaluate(() => {
      const descriptor = Object.getOwnPropertyDescriptor(IDBTransaction.prototype, 'oncomplete')!;
      Object.defineProperty(IDBTransaction.prototype, 'oncomplete', {
        ...descriptor,
        set(callback) {
          const slow = this.mode === 'readwrite' && this.objectStoreNames.contains('testAttempts');
          descriptor.set!.call(this, slow && callback ? function(this: IDBTransaction, event: Event) {
            setTimeout(() => callback.call(this, event), 600);
          } : callback);
        },
      });
    });
    const first = (await question(page, 0));
    const radio = first.locator('input[type="radio"], input[type="checkbox"]').first();
    const reveal = first.getByRole('button', { name: 'Reveal answer', exact: true });
    await radio.focus();
    const before = await first.boundingBox();
    await page.keyboard.press('Space');
    await expect(page.locator('.save-status')).toContainText('Saving…');
    await expect(radio).toBeFocused();
    expect(await radio.evaluate((node: HTMLInputElement) => node.disabled)).toBe(false);
    await expect(radio).toHaveAttribute('aria-disabled', 'true');
    expect(await radio.evaluate(node => getComputedStyle(node).opacity)).toBe('1');
    expect(await reveal.evaluate(node => getComputedStyle(node).opacity)).toBe('1');
    expect(await first.boundingBox()).toEqual(before);
    await expect(page.getByText('This selection is not saved.', { exact: true })).toHaveCount(0);
    await expect(radio).toHaveAttribute('aria-disabled', 'false');
    await expect(radio).toBeFocused();
    await expect(radio).toBeChecked();
    expect((await attempts(page))[0].responses[0].selectedOptionIds).toEqual([attempt.questions[0].card.options[0].id]);
    expect(await first.boundingBox()).toEqual(before);
    await expect(page.getByText('This selection is not saved.', { exact: true })).toHaveCount(0);
  });
}

