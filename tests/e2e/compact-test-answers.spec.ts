import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import type { ExamQuestion, QuestionBank, TestAttempt, TestResponse } from '../../src/domain';

// Exercise recorded fixture snapshots on Playwright's isolated origin, never live learner data.
const bank = JSON.parse(readFileSync('src/content/simulator-fixture-bank.json', 'utf8')) as QuestionBank;
const kinds = ['single', 'multiple', 'match', 'hotspot', 'order'] as const;
type Scenario = 'wrong' | 'omissions' | 'editing';
const panel = (page: Page, index: number) => page.locator(`.test-question[data-index="${index}"]`);

function recordedAnswer(card: ExamQuestion, scenario: Scenario): { response: TestResponse; incorrectIds: string[] } {
  const response: TestResponse = { cardId: card.id, selectedOptionIds: [], revealed: true };
  if (scenario === 'omissions') {
    if (card.kind === 'multiple') response.selectedOptionIds = [card.correctOptionIds[0]];
    if (card.kind === 'match') response.placements = { [card.rows[0].id]: card.rows[0].correctTokenId };
    if (card.kind === 'hotspot') response.placements = { [card.rows[0].id]: card.rows[0].correctOptionId };
    if (card.kind === 'order') response.placements = { 'position-1': card.correctOrder[0] };
    return { response, incorrectIds: [] };
  }
  if (card.kind === 'single' || card.kind === 'multiple') {
    const wrong = card.options.find(option => !card.correctOptionIds.includes(option.id))!.id;
    response.selectedOptionIds = card.kind === 'single' ? [wrong] : [card.correctOptionIds[0], wrong];
    return { response, incorrectIds: [wrong] };
  }
  if (card.kind === 'match') {
    const wrong = card.tokens.find(token => card.rows.every(row => row.correctTokenId !== token.id))!.id;
    response.placements = Object.fromEntries(card.rows.map(row => [row.id, wrong]));
    return { response, incorrectIds: [wrong] };
  }
  if (card.kind === 'hotspot') {
    const wrong = card.rows[0].options.find(option => option.id !== card.rows[0].correctOptionId)!.id;
    response.placements = Object.fromEntries(card.rows.map((row, index) => [row.id, index === 0 ? wrong : row.correctOptionId]));
    return { response, incorrectIds: [wrong] };
  }
  if (card.kind !== 'order') throw new Error('Expected an ordering fixture.');
  response.placements = Object.fromEntries(card.correctOrder.map((id, index) => [
    'position-' + (index + 1), index === 0 ? card.correctOrder[1] : index === 1 ? card.correctOrder[0] : id,
  ]));
  return { response, incorrectIds: card.correctOrder.slice(0, 2) };
}

function snapshotAttempt(scenario: Scenario) {
  const cards = kinds.map(kind => structuredClone(bank.questions.find(card => card.kind === kind && !card.groupId)!));
  if (scenario === 'editing') cards.push(structuredClone(bank.questions.find(card => card.kind === 'single' && !card.groupId && card.id !== cards[0].id)!));
  const questions = cards.map((card, index) => {
    card.answer = `Saved full answer ${index + 1}`;
    card.explanation = `Saved main explanation ${index + 1}`;
    card.optionExplanations = Object.fromEntries(Object.keys(card.optionExplanations).map((id, choice) => [id, `Saved reasoning for question ${index + 1}, choice ${choice + 1}`]));
    return { bankId: bank.id, card, domainTitle: bank.domains.find(domain => domain.id === card.domainId)!.title,
      sources: [...bank.sources.filter(source => card.sourceIds.includes(source.id)),
        { id: 'saved-extra-reference-two', title: 'Saved reference two', url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-variables-about' },
        { id: 'saved-extra-reference-three', title: 'Saved reference three', url: 'https://learn.microsoft.com/en-us/dynamics365/customer-service/administer/create-workstreams' }],
    };
  });
  const answers = cards.map(card => recordedAnswer(card, scenario));
  if (scenario === 'editing') {
    for (let index = 1; index < 5; index++) answers[index] = {
      response: { cardId: cards[index].id, selectedOptionIds: [], revealed: false }, incorrectIds: [],
    };
    answers[5] = { response: { cardId: cards[5].id, selectedOptionIds: [], revealed: true }, incorrectIds: [] };
  }
  const attempt: TestAttempt = { id: 'compact-answer-fixture', bankId: bank.id, bankTitle: 'Compact answer fixture', bankVersion: 'recorded-version',
    fixture: true, mode: 'practice', startedAt: Date.now() - 10_000, durationMinutes: 120, deadlineAt: null, completedAt: null,
    questions, responses: answers.map(answer => answer.response), result: null, scoring: 'per-selection', groups: [],
    delivery: { sections: [{ id: 'section-general', kind: 'general', title: 'Questions', cardIds: cards.map(card => card.id) }],
      position: 0, flaggedCardIds: [], lockedBefore: 0 },
  };
  return { attempt, incorrectIds: answers.map(answer => answer.incorrectIds) };
}

async function seed(page: Page, scenario: Scenario) {
  const seeded = snapshotAttempt(scenario);
  await page.goto('/#tests');
  await expect(page.getByText('Saved in this browser', { exact: true }).first()).toBeVisible();
  await page.evaluate(attempt => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('tsukiakari');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, transaction = db.transaction('testAttempts', 'readwrite');
      transaction.objectStore('testAttempts').put(attempt);
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => { db.close(); reject(transaction.error); };
      transaction.onabort = () => { db.close(); reject(transaction.error); };
    };
  }), seeded.attempt);
  await page.goto('/#tests?attempt=' + seeded.attempt.id);
  await page.reload();
  await expect(panel(page, 0).locator('.test-answer')).toBeVisible();
  return seeded;
}

async function stored(page: Page): Promise<TestAttempt> {
  return page.evaluate(() => new Promise<TestAttempt>((resolve, reject) => {
    const request = indexedDB.open('tsukiakari');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, transaction = db.transaction('testAttempts');
      const read = transaction.objectStore('testAttempts').get('compact-answer-fixture');
      read.onsuccess = () => resolve(read.result);
      read.onerror = () => reject(read.error);
      transaction.oncomplete = () => db.close();
    };
  }));
}

for (const theme of ['dark', 'light']) test('all test formats retain compact recorded answers and sources in ' + theme, async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/#settings');
  await page.getByLabel('Appearance', { exact: true }).selectOption(theme);
  const { attempt, incorrectIds } = await seed(page, 'wrong');
  for (let index = 0; index < attempt.questions.length; index++) {
    const question = attempt.questions[index], answer = panel(page, index).locator('.test-answer');
    await expect(answer.getByText(question.card.answer, { exact: true })).toBeVisible();
    await expect(answer.getByText(question.card.explanation, { exact: true })).toBeVisible();
    const immediate = answer.locator('.test-selected-reasons');
    await expect(immediate.locator('dd')).toHaveCount(incorrectIds[index].length);
    expect(new Set(await immediate.locator('dd').allTextContents())).toEqual(new Set(incorrectIds[index].map(id => question.card.optionExplanations[id])));
    for (const reason of await immediate.locator('dd').all()) await expect(reason).toBeVisible();
    if (question.card.kind === 'match') await expect(immediate.locator('.test-reason-context')).toHaveCount(question.card.rows.length);
    if (question.card.kind === 'order') expect(new Set(await immediate.locator('.test-reason-context').allTextContents())).toEqual(new Set(['Placed in position 1', 'Placed in position 2']));

    const why = answer.locator('.test-why');
    await expect(why).toHaveJSProperty('open', false);
    await expect(why.locator('dl')).toBeHidden();
    await why.locator('summary').click();
    await expect(why.locator('dd')).toHaveCount(Object.keys(question.card.optionExplanations).length - incorrectIds[index].length);
    const remaining = await why.locator('dd').allTextContents();
    for (const id of incorrectIds[index]) expect(remaining).not.toContain(question.card.optionExplanations[id]);

    const references = answer.locator('.test-references');
    await expect(references.locator('summary')).toHaveText(`References (${question.sources.length})`);
    await expect(references).toHaveJSProperty('open', false);
    await expect(references.locator('ul')).toBeHidden();
    await references.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(references.locator('a')).toHaveCount(question.sources.length);
    for (const source of question.sources) {
      const link = references.getByRole('link', { name: source.title + ' ↗', exact: true });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', source.url);
    }
    await expect(answer.locator('.test-learning-resources > summary')).toContainText('Related study material');
  }
  expect((await stored(page)).questions).toEqual(attempt.questions);
  expect((await stored(page)).responses).toEqual(attempt.responses);

  const firstAnswer = panel(page, 0).locator('.test-answer');
  await firstAnswer.locator('.test-why > summary').click();
  await firstAnswer.locator('.test-references > summary').click();
  for (const width of [320, 390, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await firstAnswer.evaluate(element => {
      const bar = document.querySelector('.test-toolbar')!.getBoundingClientRect();
      scrollBy(0, element.getBoundingClientRect().top - bar.bottom - 16);
    });
    if (width === 320 || width === 1920) await page.screenshot({ path: `test-results/compact-test-answer-${theme}-${width}.png` });
  }

  // Completion still uses saved snapshots and leaves the remaining explanations collapsed.
  page.once('dialog', dialog => void dialog.accept());
  await page.getByRole('button', { name: 'Finish test', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Test score', exact: true })).toBeVisible();
  await expect(panel(page, 0).locator('.test-selected-reasons dd')).toHaveCount(1);
  await expect(panel(page, 0).locator('.test-why')).toHaveJSProperty('open', false);
  await expect(panel(page, 0).locator('.test-references')).toHaveJSProperty('open', false);
  expect((await stored(page)).questions).toEqual(attempt.questions);
});

test('omitted answers and correct partial selections do not appear as incorrectly selected choices', async ({ page }) => {
  const { attempt } = await seed(page, 'omissions');
  await expect(page.locator('.test-selected-reasons')).toHaveCount(0);
  await expect(panel(page, 0).locator('.test-answer-status')).toContainText('Skipped');
  await expect(panel(page, 1).locator('.test-answer-status')).toContainText('Partly correct');
  // Order remains all-or-nothing; its one correctly placed action is not called a wrong choice.
  await expect(panel(page, 4).locator('.test-answer-status')).toContainText('Incorrect');
  for (let index = 0; index < attempt.questions.length; index++) {
    const why = panel(page, index).locator('.test-why');
    await expect(why).toHaveJSProperty('open', false);
    await why.locator('summary').click();
    await expect(why.locator('dd')).toHaveCount(Object.keys(attempt.questions[index].card.optionExplanations).length);
  }
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  expect((await stored(page)).questions).toEqual(attempt.questions);
});

test('manual disclosures survive another answer save and flag rerender, then reset when the shown question changes', async ({ page }) => {
  const { attempt } = await seed(page, 'editing');
  const first = panel(page, 0).locator('.test-answer');
  const why = first.locator('.test-why'), references = first.locator('.test-references');
  await why.locator('summary').click();
  await references.locator('summary').click();
  await expect(why).toHaveJSProperty('open', true);
  await expect(references).toHaveJSProperty('open', true);

  const second = panel(page, 1);
  await second.getByRole('checkbox').first().check();
  const secondCard = attempt.questions[1].card;
  if (secondCard.kind !== 'multiple') throw new Error('Expected the multiple-answer fixture.');
  await expect.poll(async () => (await stored(page)).responses[1].selectedOptionIds).toEqual([secondCard.options[0].id]);
  await expect(why).toHaveJSProperty('open', true);
  await expect(references).toHaveJSProperty('open', true);
  await second.getByRole('button', { name: 'Flag for review', exact: true }).click();
  await expect.poll(async () => (await stored(page)).delivery!.flaggedCardIds).toEqual([secondCard.id]);
  await expect(why).toHaveJSProperty('open', true);
  await expect(references).toHaveJSProperty('open', true);

  await page.locator('.test-nav-button[data-page="1"]').click();
  const different = panel(page, 5).locator('.test-answer');
  await expect(different).toBeVisible();
  await expect(different.locator('.test-why')).toHaveJSProperty('open', false);
  await expect(different.locator('.test-references')).toHaveJSProperty('open', false);
  await page.locator('.test-nav-button[data-page="0"]').click();
  await expect(why).toHaveJSProperty('open', false);
  await expect(references).toHaveJSProperty('open', false);
  expect((await stored(page)).questions).toEqual(attempt.questions);
});
