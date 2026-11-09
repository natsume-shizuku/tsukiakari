import { test, expect, type Page } from '@playwright/test';
import type { TestAttempt } from '../../src/domain';

// Real content must be available without the engineering-fixture preference.
test.use({ storageState: { cookies: [], origins: [] } });
async function rows<T>(page: Page, table: string): Promise<T[]> {
  return page.evaluate(name => new Promise<T[]>((resolve, reject) => {
    const request = indexedDB.open('tsukiakari');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(name);
      const read = transaction.objectStore(name).getAll();
      read.onsuccess = () => resolve(read.result);
      read.onerror = () => reject(read.error);
      transaction.oncomplete = () => db.close();
    };
  }), table);
}

for (const count of [50, 100]) test(`real simulator starts ${count} sourced questions and preserves the attempt on reload`, async ({ page }) => {
  if (count === 50) await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/#tests?bank=ab250-simulator');
  await expect(page.getByText(/128 available questions/)).toBeVisible();
  const bank = page.getByLabel('Question bank', { exact: true });
  await expect(bank).toHaveValue('ab250-simulator');
  expect(await bank.locator('option').evaluateAll(options => options.map(option => (option as HTMLOptionElement).value))).not.toContain('simulator-test-fixture');
  await page.getByLabel('Test mode', { exact: true }).selectOption('exam');
  await page.getByLabel('Number of questions', { exact: true }).fill(String(count));
  await page.getByRole('button', { name: 'Start exam', exact: true }).click();
  await expect(page.locator('.test-session-bar')).toContainText(`of ${count} answered`);
  const attempt = (await rows<TestAttempt>(page, 'testAttempts'))[0];
  expect(attempt.bankId).toBe('ab250-simulator');
  expect(attempt.fixture).toBe(false);
  expect(attempt.scoring).toBe('per-selection');
  expect(new Set(attempt.questions.map(question => question.card.id)).size).toBe(count);
  expect(attempt.questions.every(question => question.sources.length > 0 && question.card.relatedNotes.length > 0)).toBe(true);
  expect(attempt.groups!.filter(group => group.kind === 'case-study')).toHaveLength(count === 100 ? 2 : 1);
  expect(attempt.groups!.filter(group => group.kind === 'series')).toHaveLength(1);
  for (const group of attempt.groups!) {
    const members = attempt.questions.filter(question => question.card.groupId === group.id);
    expect(members).toHaveLength(group.kind === 'series' ? 4 : group.id === 'sim-case-a' ? 8 : 9);
  }
  await expect(page.getByRole('button', { name: 'Reveal answer', exact: true })).toHaveCount(0);
  await expect(page.locator('.test-answer')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const flag = page.locator('.test-question').first().getByRole('button', { name: 'Flag for review', exact: true });
  await flag.click();
  await expect.poll(async () => (await rows<TestAttempt>(page, 'testAttempts'))[0].delivery!.flaggedCardIds).toEqual([attempt.questions[0].card.id]);
  await page.reload();
  await expect(page.locator('.test-session-bar')).toContainText(`of ${count} answered`);
  await expect(page.locator('.test-question').first().getByRole('button', { name: 'Remove flag', exact: true })).toBeVisible();
  const restored = (await rows<TestAttempt>(page, 'testAttempts'))[0];
  expect(restored.questions).toEqual(attempt.questions);
  expect(restored.groups).toEqual(attempt.groups);
  expect(restored.deadlineAt).toBe(attempt.deadlineAt);
  expect(await rows(page, 'reviewLogs')).toEqual([]);
  expect(await rows(page, 'schedulerStates')).toEqual([]);
  await page.screenshot({ path: `test-results/phase8d-real-${count}.png`, fullPage: true });
});
