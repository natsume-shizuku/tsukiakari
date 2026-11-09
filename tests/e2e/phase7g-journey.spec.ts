import { sel } from '../support/selection';
import { test, expect, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { Deck, LearningCopy, ReviewLog, SchedulerState, StudyCuration, StudyPack, TestAttempt } from '../../src/domain';
import type { Backup } from '../../src/portability';

const pack = JSON.parse(readFileSync('src/content/published/study-pack.json', 'utf8')) as StudyPack;
const curations = JSON.parse(readFileSync('src/content/published/curations.json', 'utf8')) as StudyCuration[];
const implementation = curations.find(item => item.id === 'd365-contact-center')!;
const preparation = curations.find(item => item.id === 'ab250-preparation')!;
const advanced = curations.find(item => item.id === 'ab250-advanced')!;
const owner = pack.id;
const domains = ['deployment', 'channels', 'agents-ai', 'work-distribution', 'representative-experience', 'analytics'];
const widths = [320, 768, 1440, 1920, 2560];

async function rows<T = unknown>(page: Page, table: string): Promise<T[]> {
  return page.evaluate(name => new Promise<T[]>((resolve, reject) => {
    const open = indexedDB.open('tsukiakari');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result, tx = db.transaction(name), read = tx.objectStore(name).getAll();
      read.onsuccess = () => resolve(read.result);
      read.onerror = () => reject(read.error);
      tx.oncomplete = () => db.close();
    };
  }), table);
}
async function ready(page: Page, path = '/') {
  await page.goto(path);
  await expect(page.getByText('Saved in this browser', { exact: true }).first()).toBeVisible();
}
const nav = (page: Page, label: string) => page.getByRole('link', { name: label, exact: true }).click();
const go = (page: Page, hash: string) => page.evaluate(value => { location.hash = value; }, hash);
const fits = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const stat = (row: Locator, label: string) => row.locator('dt').filter({ hasText: new RegExp('^' + label + '$') }).locator('..').locator('dd');

async function createDeck(page: Page, name: string) {
  await nav(page, 'Study');
  await page.getByRole('button', { name: 'Create a deck', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Create a deck', exact: true });
  await dialog.getByLabel('Deck name', { exact: true }).fill(name);
  await dialog.getByRole('button', { name: 'Create deck', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  return (await rows<Deck>(page, 'decks')).find(deck => deck.name === name)!;
}
async function addPack(page: Page, deck: Deck, curation: StudyCuration, expected: number) {
  await page.getByLabel('Destination deck', { exact: true }).selectOption(deck.id);
  await page.getByRole('region', { name: curation.title, exact: true }).getByRole('button', { name: 'Add entire pack', exact: true }).click();
  await expect.poll(async () => (await rows<LearningCopy>(page, 'copies')).filter(copy => copy.deckId === deck.id).length).toBe(expected);
}
async function rate(page: Page, rating: 'Again' | 'Right') {
  const choices = page.getByRole('radiogroup', { name: 'Answer choices' });
  if (await choices.count()) await choices.getByRole('radio').first().click();
  await page.getByRole('button', { name: 'Reveal answer', exact: true }).click();
  const before = (await rows(page, 'reviewLogs')).length;
  await page.getByRole('button', { name: rating, exact: true }).click();
  await expect.poll(async () => (await rows(page, 'reviewLogs')).length).toBe(before + 1);
}
async function startTest(page: Page, mode: 'practice' | 'exam', count: number) {
  await nav(page, 'Tests');
  await page.getByLabel('Question bank', { exact: true }).selectOption('ab250-original');
  await expect(page.getByText(/300 available questions/)).toBeVisible();
  await page.getByLabel('Test mode', { exact: true }).selectOption(mode);
  await page.getByLabel('Number of questions', { exact: true }).fill(String(count));
  await page.getByRole('button', { name: mode === 'practice' ? 'Start practice' : 'Start exam', exact: true }).click();
  await expect(page.locator('.test-session-bar')).toContainText(`of ${count} answered`);
  return (await rows<TestAttempt>(page, 'testAttempts')).find(attempt => attempt.completedAt === null)!;
}
async function chooseAnswer(page: Page, attempt: TestAttempt, index: number, ids: string[]) {
  const button = page.locator(`.test-nav-button[data-page="${Math.floor(index / 5)}"]`);
  if (!await button.getAttribute('aria-current')) await button.click();
  const panel = page.locator(`.test-question[data-index="${index}"]`);
  for (const id of ids) await panel.locator('input[value="' + id + '"]').check();
  await expect.poll(async () => {
    const saved = (await rows<TestAttempt>(page, 'testAttempts')).find(item => item.id === attempt.id)!;
    return saved.responses.find(response => response.cardId === attempt.questions[index].card.id)!.selectedOptionIds.length;
  }).toBe(ids.length);
}
async function finish(page: Page) {
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Finish test', exact: true }).click();
}
async function downloadBackup(page: Page, label: string) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: label, exact: true }).click();
  const stream = await (await pending).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

test('one learner goes from choosing packs through study, feedback and tests to a restored browser', async ({ page, browser }) => {
  test.setTimeout(180000);
  await ready(page);

  // Choose packs and assemble decks. Overlapping curations share canonical cards.
  const main = await createDeck(page, 'Certification study');
  const side = await createDeck(page, 'Scenario practice');
  await nav(page, 'Library');
  await addPack(page, main, implementation, implementation.cards.length);
  const firstCopies = await rows<LearningCopy>(page, 'copies');
  await addPack(page, main, preparation, pack.cards.length);
  await addPack(page, side, advanced, advanced.cards.length);
  const copies = await rows<LearningCopy>(page, 'copies');
  expect(copies).toHaveLength(pack.cards.length + advanced.cards.length);
  expect(copies.every(copy => copy.packId === owner)).toBe(true);
  expect(new Set(copies.map(copy => copy.deckId + '|' + copy.packId + '|' + copy.cardId)).size).toBe(copies.length);
  for (const copy of firstCopies) expect(copies.find(item => item.id === copy.id)).toEqual(copy);

  // A personal note belongs to one deck's copy of a card held in both decks.
  const shared = advanced.cards[0].cardId;
  await go(page, '#library/cards?owner=' + owner + '&card=' + shared);
  const inspector = page.getByRole('region', { name: 'Card details', exact: true });
  await inspector.getByLabel('Deck copy', { exact: true }).selectOption({ label: 'Scenario practice' });
  await inspector.getByRole('tab', { name: 'My notes', exact: true }).click();
  await inspector.getByLabel('Personal note', { exact: true }).fill('Only for the scenario deck.');
  await inspector.getByRole('button', { name: 'Save notes and tags', exact: true }).click();
  await expect.poll(async () => (await rows<LearningCopy>(page, 'copies')).filter(copy => copy.cardId === shared).map(copy => [copy.deckId, copy.personalNote]).sort())
    .toEqual([[main.id, ''], [side.id, 'Only for the scenario deck.']].sort());

  // Review, then undo one rating. Only the two kept reviews may count anywhere.
  await nav(page, 'Study');
  await page.getByRole('button', { name: 'Study ' + main.name, exact: true }).click();
  await rate(page, 'Again');
  await rate(page, 'Right');
  await rate(page, 'Right');
  await page.getByRole('button', { name: 'Undo last review', exact: true }).click();
  await expect.poll(async () => (await rows<ReviewLog>(page, 'reviewLogs')).filter(log => log.undone).length).toBe(1);
  const logs = (await rows<ReviewLog>(page, 'reviewLogs')).filter(log => !log.undone);
  expect(logs.map(log => log.rating).sort()).toEqual(['again', 'right']);

  // Topic feedback matches those reviews, and each topic opens its own cards.
  const allCopies = await rows<LearningCopy>(page, 'copies');
  const reviewed = logs.map(log => pack.cards.find(card => card.id === allCopies.find(copy => copy.id === log.copyId)!.cardId)!);
  const topicId = reviewed[0].topicId;
  const topic = pack.topics.find(item => item.id === topicId)!;
  const inTopic = logs.filter((_, index) => reviewed[index].topicId === topicId);
  await nav(page, 'Statistics');
  const topics = page.getByRole('region', { name: 'Flashcard topics', exact: true });
  const row = topics.getByRole('article').filter({ has: page.getByRole('link', { name: topic.title, exact: true }) });
  await expect(stat(row, 'Reviews')).toHaveText(String(inTopic.length));
  await expect(stat(row, 'Again')).toHaveText(String(inTopic.filter(log => log.rating === 'again').length));
  await expect(stat(row, 'Right')).toHaveText(String(inTopic.filter(log => log.rating === 'right').length));
  await expect(stat(row, 'Distinct cards')).toHaveText(String(new Set(inTopic.map(log => log.copyId)).size));
  await expect(topics.getByText('Not studied', { exact: true }).first()).toBeVisible();
  await row.getByRole('link', { name: topic.title, exact: true }).click();
  await expect(page.getByRole('button', { name: /^Select card:/ })).toHaveCount(pack.cards.filter(card => card.topicId === topicId).length);

  // Nothing in the tests below may touch flashcard learning.
  const copiesBefore = await rows<LearningCopy>(page, 'copies');
  const logsBefore = await rows<ReviewLog>(page, 'reviewLogs');
  const schedulesBefore = await rows<SchedulerState>(page, 'schedulerStates');

  // Practice: reveal an answer, follow its study link and come back to the same attempt.
  const practice = await startTest(page, 'practice', 50);
  expect(new Set(practice.questions.map(question => question.card.id)).size).toBe(50);
  const firstQuestion = practice.questions[0].card;
  await chooseAnswer(page, practice, 0, sel(firstQuestion).correctOptionIds);
  const panel = page.locator('.test-question').first();
  await panel.getByRole('button', { name: 'Reveal answer', exact: true }).click();
  await finish(page);
  await expect(page.getByRole('region', { name: 'Test score', exact: true })).toContainText('1 correct · 0 wrong · 49 skipped');
  const results = page.getByRole('region', { name: 'Results by domain', exact: true });
  await expect(results).toBeVisible();
  const note = pack.notes.find(item => item.id === firstQuestion.relatedNotes[0].noteId)!;
  await page.locator('.test-question').first().locator('.test-learning-resources > summary').click();
  await page.locator('.test-question').first().getByRole('link', { name: note.title, exact: true }).click();
  await expect(page.getByRole('region', { name: 'Note reader', exact: true }).getByRole('heading', { name: note.title, exact: true })).toBeFocused();
  await page.goBack();
  await expect(results).toBeVisible();

  // Exam: fair quotas, nothing repeated, answers hidden until finished, then exact-set scoring.
  const exam = await startTest(page, 'exam', 50);
  expect(domains.map(id => exam.questions.filter(question => question.card.domainId === id).length)).toEqual([9, 16, 6, 6, 8, 5]);
  const seen = new Set(practice.questions.map(question => question.card.id));
  expect(exam.questions.filter(question => seen.has(question.card.id))).toEqual([]);
  await expect(page.locator('.test-answer')).toHaveCount(0);
  await expect(page.locator('.test-learning-resources')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Results by domain', exact: true })).toHaveCount(0);
  const multiple = exam.questions.findIndex(question => question.card.kind === 'multiple');
  const single = exam.questions.findIndex(question => question.card.kind === 'single');
  await chooseAnswer(page, exam, multiple, sel(exam.questions[multiple].card).correctOptionIds.slice(0, 1));
  await chooseAnswer(page, exam, single, sel(exam.questions[single].card).correctOptionIds);
  await finish(page);
  const dialog = page.getByRole('dialog', { name: 'Test results', exact: true });
  await expect(dialog).toContainText('1/50 (2%)');
  await dialog.getByRole('button', { name: 'Review exam', exact: true }).click();
  await expect(page).toHaveURL(/review=1/);
  await expect(page.locator('.test-answer')).toHaveCount(50);
  expect((await rows<TestAttempt>(page, 'testAttempts')).find(item => item.id === exam.id)!.result).toEqual({ correct: 1, wrong: 1, skipped: 48 });
  expect(await rows(page, 'copies')).toEqual(copiesBefore);
  expect(await rows(page, 'reviewLogs')).toEqual(logsBefore);
  expect(await rows(page, 'schedulerStates')).toEqual(schedulesBefore);

  // Move to another browser with a full backup. Everything arrives and keeps working.
  await nav(page, 'Settings');
  const file = await downloadBackup(page, 'Export full backup');
  const original = JSON.parse(file.toString('utf8')) as Backup;
  if (original.kind !== 'full') throw new Error('Expected a full backup');
  const moved = await browser.newContext({ baseURL: 'http://localhost:4187' });
  const phone = await moved.newPage();
  await ready(phone, '/#settings');
  await createDeck(phone, 'Will be replaced');
  await nav(phone, 'Settings');
  await phone.getByLabel('JSON file (up to 100 MB)', { exact: true }).setInputFiles({ name: 'transfer.json', mimeType: 'application/json', buffer: file });
  await expect(phone.getByRole('heading', { name: 'Import preview', exact: true })).toBeFocused();
  await downloadBackup(phone, 'Download current backup');
  await phone.getByLabel('I have saved the current backup file.', { exact: true }).check();
  phone.once('dialog', item => item.accept());
  await phone.getByRole('button', { name: 'Replace collection', exact: true }).click();
  await expect(phone.getByText('Backup restored. This browser now contains the imported collection.', { exact: true })).toBeVisible();
  const restored = JSON.parse((await downloadBackup(phone, 'Export full backup')).toString('utf8')) as Backup;
  if (restored.kind !== 'full') throw new Error('Expected a full backup');
  expect(restored.workspace).toEqual(original.workspace);
  await go(phone, '#tests?attempt=' + encodeURIComponent(exam.id) + '&review=1');
  await expect(phone.locator('.test-answer')).toHaveCount(50);
  await nav(phone, 'Study');
  await phone.getByRole('button', { name: 'Continue studying', exact: true }).click();
  // The undone card comes back exactly as it was before rating, already revealed.
  await expect(phone.getByTestId('revealed-answer')).toBeVisible();
  await phone.getByRole('button', { name: 'Right', exact: true }).click();
  await expect.poll(async () => (await rows<ReviewLog>(phone, 'reviewLogs')).filter(log => !log.undone).length).toBe(3);
  await moved.close();
});

test('an exam that ends away from the test still offers its results', async ({ page }) => {
  await page.clock.install({ time: new Date('2030-06-01T12:00:00Z') });
  await ready(page);
  await nav(page, 'Tests');
  await page.getByLabel('Question bank', { exact: true }).selectOption('ab250-original');
  await expect(page.getByText(/300 available questions/)).toBeVisible();
  await page.getByLabel('Test mode', { exact: true }).selectOption('exam');
  await page.getByLabel('Number of questions', { exact: true }).fill('50');
  await page.getByLabel('Time limit (minutes)', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Start exam', exact: true }).click();
  await expect(page.locator('.test-session-bar')).toContainText(`of ${50} answered`);
  const notice = page.locator('.exam-ended-notice');
  await nav(page, 'Library');
  await page.clock.fastForward(61_000);
  await expect(notice).toContainText('Exam time ended. Your saved answers have been scored.');
  await nav(page, 'Statistics');
  await expect(notice).toBeVisible();
  await nav(page, 'Tests');
  await expect(notice).toBeVisible();
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    expect(await fits(page)).toBe(true);
    const heights = await notice.locator('a,button').evaluateAll(items => items.map(item => item.getBoundingClientRect().height));
    expect(heights.every(height => height >= 44)).toBe(true);
    await page.screenshot({ path: 'test-results/phase7g-exam-notice-' + width + '.png' });
  }
  await notice.getByRole('link', { name: 'See results', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Test results', exact: true })).toContainText('0/50 (0%)');
  await expect(notice).toHaveCount(0);
});

test('an exam that ended while the site was closed offers its results on reopening, and can be dismissed', async ({ page }) => {
  await page.clock.install({ time: new Date('2030-06-02T12:00:00Z') });
  await ready(page);
  await nav(page, 'Tests');
  await page.getByLabel('Question bank', { exact: true }).selectOption('ab250-original');
  await expect(page.getByText(/300 available questions/)).toBeVisible();
  await page.getByLabel('Test mode', { exact: true }).selectOption('exam');
  await page.getByLabel('Number of questions', { exact: true }).fill('50');
  await page.getByLabel('Time limit (minutes)', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Start exam', exact: true }).click();
  await expect(page.locator('.test-session-bar')).toContainText(`of ${50} answered`);
  await page.goto('about:blank');
  await page.clock.fastForward(61_000);
  await ready(page, '/#study');
  const notice = page.locator('.exam-ended-notice');
  await expect(notice.getByRole('link', { name: 'See results', exact: true })).toBeVisible();
  await notice.getByRole('button', { name: 'Dismiss exam notice', exact: true }).click();
  await expect(notice).toHaveCount(0);
});

test('a read-only tab exports what is saved now, not what it first loaded', async ({ page, context }) => {
  await ready(page);
  const second = await context.newPage();
  await second.goto('/#settings');
  await expect(second.getByText('This is a read-only tab.')).toBeVisible();
  const deck = await createDeck(page, 'Saved after the second tab opened');
  const backup = JSON.parse((await downloadBackup(second, 'Export full backup')).toString('utf8')) as Backup;
  if (backup.kind !== 'full') throw new Error('Expected a full backup');
  expect(backup.workspace.decks.map(item => item.id)).toEqual([deck.id]);
});

test('a browser that cannot name its time zone can still create a deck', async ({ page }) => {
  await page.addInitScript(() => {
    const resolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
    Intl.DateTimeFormat.prototype.resolvedOptions = function () {
      const options: Partial<Intl.ResolvedDateTimeFormatOptions> = resolvedOptions.call(this);
      delete options.timeZone;
      return options as Intl.ResolvedDateTimeFormatOptions;
    };
    Date.prototype.getTimezoneOffset = () => 420;
  });
  await ready(page);
  await createDeck(page, 'No named zone');
  await expect(page.getByText('could not be saved')).toHaveCount(0);
  expect((await rows<{ timeZone: string }>(page, 'preferences'))[0].timeZone).toBe('Etc/GMT+7');
  await nav(page, 'Statistics');
  await expect(page.getByText('Study days begin at 05:00 in UTC-07:00.')).toBeVisible();
});

test('a crafted review link never exposes an unfinished exam', async ({ page }) => {
  await ready(page);
  const exam = await startTest(page, 'exam', 50);
  const firstPrompt = exam.questions[0].card.prompt;
  for (const load of [() => go(page, '#tests?attempt=' + encodeURIComponent(exam.id) + '&review=1'), () => page.reload()]) {
    await load();
    await expect(page.getByText(firstPrompt, { exact: false }).first()).toBeVisible();
    await expect(page.locator('.test-answer')).toHaveCount(0);
    await expect(page.locator('.test-learning-resources')).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Results by domain', exact: true })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Test score', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Reveal answer', exact: true })).toHaveCount(0);
  }
});

for (const theme of ['dark', 'light'] as const) test('populated pages and the longest real content fit every width in ' + theme, async ({ page }) => {
  test.setTimeout(180000);
  const longestNote = [...pack.notes].sort((a, b) => b.body.length - a.body.length)[0];
  const longestCard = [...pack.cards].sort((a, b) => (b.answer + b.explanation).length - (a.answer + a.explanation).length)[0];
  await ready(page, '/#settings');
  await page.getByLabel('Appearance', { exact: true }).selectOption(theme);
  const deck = await createDeck(page, 'Layout check');
  await nav(page, 'Library');
  await addPack(page, deck, preparation, pack.cards.length);
  const routes = ['#study', '#library/packs', '#library/cards', '#library/mistakes', '#statistics', '#settings', '#tests?bank=ab250-original',
    '#library/notes?owner=' + owner + '&note=' + longestNote.id, '#library/cards?owner=' + owner + '&card=' + longestCard.id];
  const problems: string[] = [];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      await go(page, route);
      await expect(page.locator('main')).toBeVisible();
      if (route.includes('note=')) await expect(page.getByRole('region', { name: 'Note reader', exact: true })).toContainText(longestNote.title);
      if (route.includes('card=')) await expect(page.getByRole('region', { name: 'Card details', exact: true })).toContainText(longestCard.answer);
      if (route.includes('bank=')) await expect(page.getByText(/300 available questions/)).toBeVisible();
      if (!await fits(page)) problems.push(width + ' ' + route + ' overflows horizontally');
      if (width > 768) continue;
      const small = await page.evaluate(() => [...document.querySelectorAll('button,select,textarea,summary,[role=tab],nav a,input:not([type=checkbox]):not([type=radio]):not([type=file])')].flatMap(element => {
        const box = element.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && box.height < 44 ? [element.tagName + ' "' + (element.getAttribute('aria-label') ?? element.textContent ?? '').trim().slice(0, 40) + '" ' + Math.round(box.height) + 'px'] : [];
      }));
      for (const item of small) problems.push(width + ' ' + route + ' ' + item);
    }
  }
  expect([...new Set(problems)]).toEqual([]);
});
