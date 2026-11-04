import { test, expect, type Page } from '@playwright/test';
import type { TestAttempt } from '../../src/domain';

async function rows<T>(page: Page, table: string): Promise<T[]> {
  return page.evaluate(name => new Promise<T[]>((resolve, reject) => {
    const request = indexedDB.open('tsukiakari');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(name);
      const read = tx.objectStore(name).getAll();
      read.onsuccess = () => resolve(read.result);
      read.onerror = () => reject(read.error);
      tx.oncomplete = () => db.close();
    };
  }), table);
}
async function activeAttempt(page: Page) {
  return (await rows<TestAttempt>(page, 'testAttempts')).find(attempt => attempt.completedAt === null)!;
}
async function ready(page: Page, path = '/#tests') {
  await page.goto(path);
  await expect(page.getByText('Saved in this browser', { exact: true }).first()).toBeVisible();
}
async function start(page: Page, mode: 'practice' | 'exam' = 'practice', count = 100) {
  await page.getByLabel('Question bank', { exact: true }).selectOption('developer-test-fixture');
  await expect(page.getByText(/300 available questions/)).toBeVisible();
  await page.getByLabel('Test mode', { exact: true }).selectOption(mode);
  await page.getByLabel('Number of questions', { exact: true }).fill(String(count));
  await page.getByRole('button', { name: mode === 'exam' ? 'Start exam' : 'Start practice', exact: true }).click();
  await expect(page.locator('.test-question')).toHaveCount(count);
  return activeAttempt(page);
}
async function expectSaved(page: Page, cardId: string, values: string[]) {
  await expect.poll(async () => {
    const attempt = await activeAttempt(page);
    return [...attempt.responses.find(response => response.cardId === cardId)!.selectedOptionIds].sort();
  }).toEqual([...values].sort());
}
async function chooseOption(page: Page, index: number, optionId: string) {
  const input = page.locator('.test-question').nth(index).locator('input');
  const position = await input.evaluateAll((inputs, id) => inputs.findIndex(item => (item as HTMLInputElement).value === id), optionId);
  expect(position).toBeGreaterThanOrEqual(0);
  await input.nth(position).check();
}

test('bank loading failures preserve learner records and can retry before explicit start', async ({ page }) => {
  let fail = true;
  await page.route(/engineering-question-bank.*\.json(?:\?.*)?$/, route => {
    if (fail) { fail = false; return route.abort(); }
    return route.continue();
  });
  await ready(page);
  const tables = ['decks', 'copies', 'schedulerStates', 'reviewLogs', 'testAttempts', 'testExposures'];
  const before = await Promise.all(tables.map(table => rows(page, table)));
  await page.getByLabel('Question bank', { exact: true }).selectOption('developer-test-fixture');
  await expect(page.getByRole('button', { name: 'Retry loading question bank', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeDisabled();
  expect(await Promise.all(tables.map(table => rows(page, table)))).toEqual(before);
  await page.getByRole('button', { name: 'Retry loading question bank', exact: true }).click();
  await expect(page.getByText(/300 available questions/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeEnabled();
  expect(await Promise.all(tables.map(table => rows(page, table)))).toEqual(before);
});

test('curation bank links preselect the bank and unavailable banks remain explicit', async ({ page }) => {
  await ready(page, '/#tests?bank=developer-test-fixture');
  await expect(page.getByLabel('Question bank', { exact: true })).toHaveValue('developer-test-fixture');
  await expect(page.getByText(/300 available questions/)).toBeVisible();
  await ready(page, '/#tests?bank=missing-bank');
  await expect(page.getByRole('button', { name: 'Retry loading question bank', exact: true })).toBeVisible();
  await expect(page.getByLabel('Question bank', { exact: true })).toHaveValue('missing-bank');
  await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeDisabled();
  expect(await rows(page, 'testAttempts')).toEqual([]);
});

test('practice explains domains smaller than the minimum and does not reduce requested counts', async ({ page }) => {
  await ready(page);
  await page.getByLabel('Question bank', { exact: true }).selectOption('developer-test-fixture');
  await expect(page.getByText(/300 available questions/)).toBeVisible();
  const domain = page.getByLabel('Practice domain', { exact: true });
  await domain.selectOption({ index: 3 });
  await expect(page.getByText(/36 available questions/)).toBeVisible();
  await expect(page.getByText(/This domain has fewer than 50/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeDisabled();
  await domain.selectOption({ index: 1 });
  await expect(page.getByText(/51 available questions/)).toBeVisible();
  await page.getByRole('button', { name: 'Start practice', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('The question count is never reduced automatically');
  expect(await rows(page, 'testAttempts')).toEqual([]);
  await page.getByLabel('Number of questions', { exact: true }).fill('50');
  await page.getByRole('button', { name: 'Start practice', exact: true }).click();
  await expect(page.locator('.test-question')).toHaveCount(50);
  const attempt = await activeAttempt(page);
  expect(new Set(attempt.questions.map(question => question.card.domainId)).size).toBe(1);
});

test('multiple answers retain failed drafts, persist on reload, and require the exact answer set', async ({ page }) => {
  await ready(page);
  const attempt = await start(page);
  const indices = attempt.questions.flatMap((question, index) => question.card.kind === 'multiple' ? [index] : []);
  expect(indices.length).toBeGreaterThanOrEqual(2);
  const index = indices[0];
  const card = attempt.questions[index].card;
  const panel = page.locator('.test-question').nth(index);
  await expect(panel.getByText('Choose 2 answers.', { exact: false })).toBeVisible();
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    let fail = true;
    IDBObjectStore.prototype.put = function (value, key) {
      if (fail && this.name === 'testAttempts') { fail = false; throw new DOMException('Simulated write failure', 'QuotaExceededError'); }
      return put.call(this, value, key);
    };
  });
  await chooseOption(page, index, card.correctOptionIds[0]);
  await expect(panel.getByRole('alert')).toHaveText('This selection is not saved.');
  expect((await activeAttempt(page)).responses.find(response => response.cardId === card.id)!.selectedOptionIds).toEqual([]);
  await expect(page.getByRole('button', { name: 'Show answers', exact: true })).toBeDisabled();
  await panel.getByRole('button', { name: 'Retry saving answer', exact: true }).click();
  await expectSaved(page, card.id, [card.correctOptionIds[0]]);
  await chooseOption(page, index, card.correctOptionIds[1]);
  await expectSaved(page, card.id, card.correctOptionIds);
  await page.reload();
  await expect(panel.getByRole('checkbox', { checked: true })).toHaveCount(2);
  await panel.getByRole('button', { name: 'Reveal answer', exact: true }).click();
  await expect(panel.getByText('Correct · Response locked after reveal', { exact: true })).toBeVisible();
  await expect(panel.getByRole('heading', { name: 'Why these choices?', exact: true })).toBeVisible();
  await expect(panel.getByRole('checkbox').first()).toBeDisabled();
  const partialIndex = indices[1];
  const partial = attempt.questions[partialIndex].card;
  await chooseOption(page, partialIndex, partial.correctOptionIds[0]);
  await expectSaved(page, partial.id, [partial.correctOptionIds[0]]);
  const partialPanel = page.locator('.test-question').nth(partialIndex);
  await partialPanel.getByRole('button', { name: 'Reveal answer', exact: true }).click();
  await expect(partialPanel.getByText('Incorrect · Response locked after reveal', { exact: true })).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Show answers', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Test score' })).toContainText('1 correct · 1 wrong · 98 skipped');
  expect(await rows(page, 'reviewLogs')).toEqual([]);
});

test('timed exams use six domain quotas and abandonment preserves exposure without a score', async ({ page }) => {
  await ready(page);
  const attempt = await start(page, 'exam');
  const counts = new Map<string, number>();
  for (const question of attempt.questions) counts.set(question.card.domainId, (counts.get(question.card.domainId) ?? 0) + 1);
  expect([...counts.values()].sort((a, b) => a - b)).toEqual([10, 12, 12, 17, 17, 32]);
  await expect(page.getByRole('button', { name: 'Reveal answer', exact: true })).toHaveCount(0);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Abandon test', exact: true }).click();
  expect(await rows(page, 'testAttempts')).toEqual([]);
  expect(await rows(page, 'testExposures')).toHaveLength(100);
  await expect(page.getByRole('button', { name: 'Start exam', exact: true })).toBeEnabled();
});

for (const theme of ['dark', 'light']) {
  test(`long multiple-answer questions remain readable and operable across viewport sizes in ${theme}`, async ({ page }) => {
    test.setTimeout(60000);
    await page.route(/engineering-question-bank.*\.json(?:\?.*)?$/, async route => {
      const response = await route.fetch();
      const bank = await response.json();
      for (const question of bank.questions) {
        question.kind = 'multiple';
        question.prompt += '\nLayout fixture: A service team needs to compare several documented requirements before choosing two actions. Read the scenario and every option carefully, including the explanation that follows submission. This deliberately long scenario checks wrapping and reading space on phones and wide desktop displays.';
        question.correctOptionIds = question.options.slice(0, 2).map((option: { id: string }) => option.id);
        question.options.forEach((option: { id: string; text: string }, index: number) => {
          option.text += ' — Layout fixture: review the requirements, identify the relevant configuration, and verify the result before applying the change to the complete service team.';
          question.optionExplanations[option.id] = (index < 2 ? 'Included in this layout fixture. ' : 'Excluded from this layout fixture. ') +
            'This explanation is intentionally long to exercise the answer reader, wrapping, and separation between option text and the next explanation. It is software test content, not a product claim.';
        });
        question.answer = question.options.slice(0, 2).map((option: { text: string }) => option.text).join('\n');
        question.explanation = 'Layout fixture only. Both selected options are required; choosing only one does not form the complete answer. '.repeat(4);
      }
      await route.fulfill({ response, json: bank });
    });
    await ready(page);
    await page.getByRole('link', { name: 'Settings', exact: true }).click();
    await page.getByLabel('Appearance', { exact: true }).selectOption(theme);
    await page.getByRole('link', { name: 'Tests', exact: true }).click();
    const attempt = await start(page, 'practice', 50);
    const panel = page.locator('.test-question').first();
    const boxes = panel.getByRole('checkbox');
    await boxes.first().focus();
    await page.keyboard.press('Space');
    await expectSaved(page, attempt.questions[0].card.id, [attempt.questions[0].card.options[0].id]);
    await page.keyboard.press('Tab');
    await expect(boxes.nth(1)).toBeFocused();
    await page.keyboard.press('Space');
    await expectSaved(page, attempt.questions[0].card.id, attempt.questions[0].card.correctOptionIds);
    await panel.getByRole('button', { name: 'Reveal answer', exact: true }).click();
    await expect(panel.getByText('Correct · Response locked after reveal', { exact: true })).toBeVisible();
    for (const width of [320, 768, 1440, 1920, 2560]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const layout = await panel.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const options = [...element.querySelectorAll('.test-option')].map(option => {
          const rect = option.getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, height: rect.height, width: rect.width };
        });
        const answer = element.querySelector('.test-answer')!.getBoundingClientRect();
        const prose = [...element.querySelectorAll('.test-question-title, .test-answer p, .test-option-explanations dd')];
        return { left: bounds.left, right: bounds.right, options, answerTop: answer.top,
          clipped: prose.some(item => item.scrollWidth > item.clientWidth + 1 || item.scrollHeight > item.clientHeight + 1) };
      });
      expect(layout.clipped).toBe(false);
      expect(layout.options.every(option => option.width >= 44 && option.height >= 44 && option.left >= layout.left && option.right <= layout.right)).toBe(true);
      expect(layout.options.every((option, index) => index === 0 || option.top >= layout.options[index - 1].bottom)).toBe(true);
      expect(layout.answerTop).toBeGreaterThanOrEqual(layout.options.at(-1)!.bottom);
      await panel.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `test-results/phase7-long-multiple-${theme}-${width}.png` });
    }
  });
}
