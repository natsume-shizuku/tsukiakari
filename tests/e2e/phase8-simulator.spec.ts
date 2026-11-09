import { test, expect, type Locator, type Page } from '@playwright/test';
import type { ExamQuestion, HotspotQuestion, MatchQuestion, OrderQuestion, TestAttempt } from '../../src/domain';

const BANK = 'simulator-test-fixture';

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
const attempts = (page: Page) => rows<TestAttempt>(page, 'testAttempts');
async function active(page: Page) { return (await attempts(page)).find(attempt => attempt.completedAt === null)!; }
async function choose(page: Page, mode: 'practice' | 'exam', count: number) {
  await page.goto('/#tests');
  await expect(page.getByText('Saved in this browser', { exact: true }).first()).toBeVisible();
  await page.getByLabel('Question bank', { exact: true }).selectOption(BANK);
  await expect(page.getByText(/128 available questions/)).toBeVisible();
  await page.getByLabel('Test mode', { exact: true }).selectOption(mode);
  await page.getByLabel('Number of questions', { exact: true }).fill(String(count));
}
async function start(page: Page, mode: 'practice' | 'exam' = 'practice', count = 50) {
  await choose(page, mode, count);
  await page.getByRole('button', { name: mode === 'exam' ? 'Start exam' : 'Start practice', exact: true }).click();
  await expect(page.locator('.test-session-bar')).toContainText(`of ${count} answered`);
  return active(page);
}
/** Mirrors the page rule: five per page inside a section, one at a time in a series. */
function pagesOf(attempt: TestAttempt) {
  const pages: { start: number; end: number }[] = [];
  let at = 0;
  for (const section of attempt.delivery!.sections) {
    const size = section.kind === 'series' ? 1 : 5;
    for (let offset = 0; offset < section.cardIds.length; offset += size) pages.push({ start: at + offset, end: at + Math.min(offset + size, section.cardIds.length) });
    at += section.cardIds.length;
  }
  return pages;
}
const tile = (page: Page, index: number) => page.locator(`.test-nav-button[data-page="${index}"]`);
const panel = (page: Page, index: number) => page.locator(`.test-question[data-index="${index}"]`);
async function open(page: Page, attempt: TestAttempt, test: (card: ExamQuestion) => boolean) {
  const index = attempt.questions.findIndex(question => test(question.card));
  const pageIndex = pagesOf(attempt).findIndex(item => index >= item.start && index < item.end);
  if (!await tile(page, pageIndex).getAttribute('aria-current')) await tile(page, pageIndex).click();
  await expect(panel(page, index)).toBeVisible();
  return { card: attempt.questions[index].card, index, here: panel(page, index) };
}
const isPlainMatch = (card: ExamQuestion) => card.kind === 'match' && !card.groupId;
const isTwoRowMatch = (card: ExamQuestion) => isPlainMatch(card) && (card as MatchQuestion).rows.length === 2;
async function placements(page: Page, cardId: string) {
  return (await active(page)).responses.find(response => response.cardId === cardId)?.placements ?? {};
}
async function drag(page: Page, from: Locator, to: Locator) {
  await from.evaluate(element => element.closest('.drag-board')?.scrollIntoView({ block: 'center' }));
  const a = (await from.boundingBox())!, b = (await to.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 12, a.y + a.height / 2 + 12, { steps: 4 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
  await page.mouse.up();
}
const tray = (page: Page, tokenId: string) => page.getByTestId('tray-' + tokenId);
const target = (page: Page, id: string) => page.getByTestId('target-' + id);
const pick = (page: Page, token: { id: string; text: string }) => tray(page, token.id).getByRole('button', { name: token.text, exact: true });

test('setup explains the assembled bank and defaults by mode', async ({ page }) => {
  await page.goto('/#tests');
  await page.getByLabel('Question bank', { exact: true }).selectOption(BANK);
  await expect(page.getByText(/exam-style mix of formats/)).toBeVisible();
  await expect(page.getByLabel('Number of questions', { exact: true })).toHaveValue('20');
  await page.getByLabel('Test mode', { exact: true }).selectOption('exam');
  await expect(page.getByLabel('Number of questions', { exact: true })).toHaveValue('50');
  await page.getByLabel('Test mode', { exact: true }).selectOption('practice');
  await expect(page.getByLabel('Number of questions', { exact: true })).toHaveValue('20');
  const attempt = await start(page);
  expect(attempt.scoring).toBe('per-selection');
  expect(attempt.delivery!.sections.map(section => section.kind)).toEqual(['general', 'case-study', 'series']);
  await expect(page.locator('.test-question')).toHaveCount(5);
  await expect(page.getByText('Sample questions for trying the test tools.')).toBeVisible();
});

test('a short practice test leaves out case studies and series', async ({ page }) => {
  const attempt = await start(page, 'practice', 10);
  expect(attempt.questions).toHaveLength(10);
  expect(attempt.delivery!.sections.map(section => section.kind)).toEqual(['general']);
  await expect(page.locator('.test-nav-button')).toHaveCount(2);
});

test('other banks keep their own paged test', async ({ page }) => {
  await page.goto('/#tests');
  await page.getByLabel('Question bank', { exact: true }).selectOption('developer-test-fixture');
  await expect(page.getByText(/300 available questions/)).toBeVisible();
  await page.getByRole('button', { name: 'Start practice', exact: true }).click();
  await expect(page.locator('.test-question')).toHaveCount(5);
  await expect(page.locator('.exam-runner')).toHaveCount(0);
});

test('match: a mouse drag copies a token, reuses it, moves it and returns it', async ({ page }) => {
  const attempt = await start(page);
  const { card: raw, here } = await open(page, attempt, isPlainMatch);
  const card = raw as MatchQuestion;
  const [first, second] = card.rows;
  const token = card.tokens[0];
  await drag(page, tray(page, token.id), target(page, first.id));
  await expect.poll(() => placements(page, card.id)).toEqual({ [first.id]: token.id });
  await expect(tray(page, token.id)).toBeVisible();
  await drag(page, tray(page, token.id), target(page, second.id));
  await expect.poll(() => placements(page, card.id)).toEqual({ [first.id]: token.id, [second.id]: token.id });
  await drag(page, page.getByTestId('placed-' + first.id), here.locator('.drag-tray'));
  await expect.poll(() => placements(page, card.id)).toEqual({ [second.id]: token.id });
});

test('match: tokens can be placed with the keyboard alone', async ({ page }) => {
  const attempt = await start(page);
  const { card: raw, here } = await open(page, attempt, isPlainMatch);
  const card = raw as MatchQuestion;
  const row = card.rows[0];
  const grip = here.getByRole('button', { name: 'Drag ' + card.tokens[0].text, exact: true }).first();
  await grip.focus();
  await page.keyboard.press('Space');
  await expect(tray(page, card.tokens[0].id)).toHaveClass(/is-dragging/);
  for (let step = 0; step < 6; step++) {
    await page.keyboard.press('ArrowDown');
    if (await target(page, row.id).evaluate(element => element.classList.contains('is-over'))) break;
  }
  await page.keyboard.press('Space');
  await expect.poll(() => placements(page, card.id)).toEqual({ [row.id]: card.tokens[0].id });
});

test('match: a token can be selected and then placed without dragging', async ({ page }) => {
  const attempt = await start(page);
  const { card: raw, here } = await open(page, attempt, isPlainMatch);
  const card = raw as MatchQuestion;
  const [first] = card.rows;
  await pick(page, card.tokens[1]).click();
  await expect(here.getByRole('status').filter({ hasText: 'Selected:' })).toContainText(card.tokens[1].text);
  await here.getByRole('button', { name: `Place ${card.tokens[1].text} on ${first.label}`, exact: true }).click();
  await expect.poll(() => placements(page, card.id)).toEqual({ [first.id]: card.tokens[1].id });
  await here.getByRole('button', { name: `Remove ${card.tokens[1].text} from ${first.label}`, exact: true }).click();
  await expect.poll(() => placements(page, card.id)).toEqual({});
});

test('keyboard focus stays in the answer area after placing and clearing', async ({ page }) => {
  const attempt = await start(page);
  const { card: raw, here } = await open(page, attempt, isPlainMatch);
  const card = raw as MatchQuestion;
  const [first] = card.rows;
  const inSlot = () => page.evaluate(id => document.querySelector(`[data-drop-target="${id}"]`)?.contains(document.activeElement) ?? false, first.id);
  await pick(page, card.tokens[0]).focus();
  await page.keyboard.press('Enter');
  await here.getByRole('button', { name: `Place ${card.tokens[0].text} on ${first.label}`, exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect.poll(inSlot).toBe(true);
  await here.getByRole('button', { name: `Remove ${card.tokens[0].text} from ${first.label}`, exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => placements(page, card.id)).toEqual({});
  await expect.poll(inSlot).toBe(true);
});

test('a read-only second tab can move around without a save warning', async ({ page, context }) => {
  const attempt = await start(page);
  const second = await context.newPage();
  await second.goto('/#tests?attempt=' + encodeURIComponent(attempt.id));
  await expect(second.locator('.test-session-bar')).toContainText('of 50 answered');
  await second.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(second.locator('.test-nav-button[data-page="1"]')).toHaveAttribute('aria-current', 'page');
  await expect(second.getByText('A change has not been saved yet.')).toHaveCount(0);
  expect((await active(page)).delivery!.position).toBe(0);
});

test('the navigator shows five-question pages, progress, and jumps to what is left', async ({ page }) => {
  const attempt = await start(page);
  const pages = pagesOf(attempt);
  await expect(page.locator('.test-nav-button')).toHaveCount(pages.length);
  await expect(tile(page, 0)).toContainText('1–5');
  await expect(tile(page, 0)).toContainText('0/5');
  await expect(tile(page, 0)).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.test-question')).toHaveCount(5);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await expect(tile(page, 1)).toHaveAttribute('aria-current', 'page');
  await expect(panel(page, 5)).toBeVisible();
  await expect.poll(async () => (await active(page)).delivery!.position).toBe(5);
  await page.getByRole('button', { name: 'Previous page', exact: true }).click();
  await expect(panel(page, 0)).toBeVisible();

  const { card: raw, index, here } = await open(page, attempt, isTwoRowMatch);
  const card = raw as MatchQuestion;
  const pageIndex = pages.findIndex(item => index >= item.start && index < item.end);
  await pick(page, card.tokens[0]).click();
  await here.locator('.drop-empty').first().click();
  await expect(tile(page, pageIndex)).toContainText('0/');
  await pick(page, card.tokens[0]).click();
  await here.locator('.drop-empty').first().click();
  await expect(tile(page, pageIndex)).toContainText('1/');
  await expect(page.locator('.test-navigator')).toContainText('1 answered');

  await here.getByRole('button', { name: 'Flag for review' }).click();
  await expect(here.getByRole('button', { name: 'Remove flag' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.test-navigator')).toContainText('1 flagged');
  await expect(tile(page, pageIndex)).toHaveClass(/is-flagged/);
  await tile(page, pageIndex === 0 ? 1 : 0).click();
  await page.getByRole('button', { name: 'Next flagged' }).click();
  await expect(here).toBeVisible();
  await page.getByRole('button', { name: 'Next unanswered' }).click();
  await expect(page.locator('.test-question:has(h2:focus)')).not.toHaveAttribute('data-index', String(index));
});

test('a 100-question test stays readable as pages of five', async ({ page }) => {
  const attempt = await start(page, 'practice', 100);
  await expect(page.locator('.test-nav-button')).toHaveCount(pagesOf(attempt).length);
  await expect(page.locator('.test-nav-grid')).toBeVisible();
  const last = pagesOf(attempt).length - 1;
  await tile(page, last).click();
  await expect(tile(page, last)).toHaveAttribute('aria-current', 'page');
  await expect(tile(page, last)).toBeInViewport();
});

test('exam: pages stay inside a section, and sections and series lock behind you', async ({ page }) => {
  const dialogs: string[] = [];
  page.on('dialog', dialog => { dialogs.push(dialog.message()); void dialog.accept(); });
  const attempt = await start(page, 'exam');
  const [general, caseStudy] = attempt.delivery!.sections.map(section => section.cardIds.length);
  const pages = pagesOf(attempt);
  const generalPages = Math.ceil(general / 5), casePages = Math.ceil(caseStudy / 5);
  await expect(page.getByRole('button', { name: 'Reveal answer' })).toHaveCount(0);
  await expect(page.locator('.test-nav-button:not(:disabled)')).toHaveCount(generalPages);
  await expect(tile(page, generalPages)).toBeDisabled();
  await expect(tile(page, generalPages)).toHaveAccessibleName(/opens later/);
  await tile(page, generalPages - 1).click();
  await expect(panel(page, pages[generalPages - 1].start)).toBeVisible();
  await page.getByRole('button', { name: 'Next section', exact: true }).click();
  expect(dialogs.at(-1)).toMatch(/You will not be able to return/);
  await expect(page.locator('.case-pane')).toBeVisible();
  await expect(page.locator('.exam-section-label')).toContainText('Fixture case study');
  await expect(page.getByRole('button', { name: 'Previous page', exact: true })).toBeDisabled();
  await expect(tile(page, 0)).toBeDisabled();
  await expect(tile(page, 0)).toHaveAccessibleName(/closed/);
  await expect.poll(async () => (await active(page)).delivery!.lockedBefore).toBe(general);

  const tabs = page.getByRole('tab');
  const background = await page.getByRole('tabpanel').innerText();
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).not.toHaveText(background);

  await tile(page, generalPages + casePages - 1).click();
  await page.getByRole('button', { name: 'Next section', exact: true }).click();
  await expect(panel(page, general + caseStudy)).toBeVisible();
  await expect(page.locator('.test-question')).toHaveCount(1);
  await expect(page.getByText(/you cannot return to it/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Flag for review' })).toHaveCount(0);
  await expect(page.locator('.test-nav-button:not(:disabled)')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Next unanswered' })).toHaveCount(0);
  await page.getByRole('radio', { name: /Yes/ }).check();
  await page.getByRole('button', { name: 'Next question', exact: true }).click();
  await expect(panel(page, general + caseStudy + 1)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous page', exact: true })).toBeDisabled();
  await expect.poll(async () => (await active(page)).delivery!.lockedBefore).toBe(general + caseStudy + 1);
  await page.getByRole('button', { name: 'Finish test' }).click();
  await expect(page.getByRole('dialog', { name: 'Test results' })).toBeVisible();
  const done = (await attempts(page)).find(item => item.completedAt !== null)!;
  expect(done.result!.points!.possible).toBeGreaterThan(50);
});

test('rapid drops all reach storage in order', async ({ page }) => {
  const attempt = await start(page);
  const { card: raw } = await open(page, attempt, isPlainMatch);
  const card = raw as MatchQuestion;
  const [first, second] = card.rows;
  await drag(page, tray(page, card.tokens[0].id), target(page, first.id));
  await drag(page, tray(page, card.tokens[1].id), target(page, second.id));
  await drag(page, tray(page, card.tokens[2].id), target(page, first.id));
  await expect.poll(() => placements(page, card.id)).toEqual({ [first.id]: card.tokens[2].id, [second.id]: card.tokens[1].id });
});

test('order: tokens leave the tray, swap, reorder with buttons and return', async ({ page }) => {
  const attempt = await start(page);
  const { card: raw, here } = await open(page, attempt, candidate => candidate.kind === 'order' && !candidate.groupId);
  const card = raw as OrderQuestion;
  const slot = (position: number) => here.locator(`[data-drop-target="position-${position}"]`);
  await expect(here.locator('.answer-order-row')).toHaveCount(card.correctOrder.length);
  const [a, b] = card.tokens;
  await drag(page, tray(page, a.id), slot(1));
  await expect(tray(page, a.id)).toHaveCount(0);
  await drag(page, tray(page, b.id), slot(2));
  await expect.poll(() => placements(page, card.id)).toEqual({ 'position-1': a.id, 'position-2': b.id });
  await drag(page, slot(1).locator('.drag-token'), slot(2));
  await expect.poll(() => placements(page, card.id)).toEqual({ 'position-1': b.id, 'position-2': a.id });
  // dnd-kit swallows clicks for 50ms after a drop so the release cannot count as a click.
  await page.waitForTimeout(100);
  await here.getByRole('button', { name: `Move ${a.text} up`, exact: true }).click();
  await expect.poll(() => placements(page, card.id)).toEqual({ 'position-1': a.id, 'position-2': b.id });
  await here.getByRole('button', { name: `Remove ${a.text} from Position 1`, exact: true }).click();
  await expect(tray(page, a.id)).toBeVisible();
  await expect.poll(() => placements(page, card.id)).toEqual({ 'position-2': b.id });
});

test('order: focus follows an item moved with its buttons', async ({ page }) => {
  const attempt = await start(page);
  const { card: raw, here } = await open(page, attempt, candidate => candidate.kind === 'order' && !candidate.groupId);
  const card = raw as OrderQuestion;
  const token = card.tokens[0];
  await drag(page, tray(page, token.id), here.locator('[data-drop-target="position-1"]'));
  await expect.poll(() => placements(page, card.id)).toEqual({ 'position-1': token.id });
  await page.waitForTimeout(100);
  await here.getByRole('button', { name: `Move ${token.text} down`, exact: true }).click();
  await expect.poll(() => placements(page, card.id)).toEqual({ 'position-2': token.id });
  await expect(here.locator('[data-drop-target="position-2"] :focus')).toHaveCount(1);
});

test('hotspot: each row has its own dropdown', async ({ page }) => {
  const attempt = await start(page);
  const { card: raw, here } = await open(page, attempt, candidate => candidate.kind === 'hotspot' && !candidate.groupId);
  const card = raw as HotspotQuestion;
  const [first] = card.rows;
  await expect(here.locator('.answer-row select')).toHaveCount(card.rows.length);
  await here.getByLabel(first.label, { exact: true }).selectOption(first.options[1].id);
  await expect.poll(() => placements(page, card.id)).toEqual({ [first.id]: first.options[1].id });
  await here.getByLabel(first.label, { exact: true }).selectOption('');
  await expect.poll(() => placements(page, card.id)).toEqual({});
});

test('reloading keeps placements, the flag and the current page', async ({ page }) => {
  const attempt = await start(page);
  const { card: raw, index, here } = await open(page, attempt, isPlainMatch);
  const card = raw as MatchQuestion;
  const row = card.rows[0];
  await drag(page, tray(page, card.tokens[0].id), target(page, row.id));
  await expect.poll(() => placements(page, card.id)).toEqual({ [row.id]: card.tokens[0].id });
  await page.waitForTimeout(100);
  await here.getByRole('button', { name: 'Flag for review' }).click();
  await expect.poll(async () => (await active(page)).delivery!.flaggedCardIds).toEqual([card.id]);
  await page.reload();
  await expect(panel(page, index)).toBeVisible();
  await expect(panel(page, index).getByRole('button', { name: 'Remove flag' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('placed-' + row.id)).toContainText(card.tokens[0].text);
});

test('practice reveals one answer and locks it', async ({ page }) => {
  const attempt = await start(page);
  const { card: raw, here } = await open(page, attempt, isPlainMatch);
  const card = raw as MatchQuestion;
  await here.getByRole('button', { name: 'Reveal answer' }).click();
  await expect(here.getByText('Response locked after reveal', { exact: false })).toBeVisible();
  await expect(here.locator('.answer-review dt').first()).toContainText(card.rows[0].label);
  await expect(here.locator('.drag-tray')).toHaveCount(0);
});

test('results show partial credit, filter it as wrong, and retry only what was missed', async ({ page }) => {
  page.on('dialog', dialog => void dialog.accept());
  const attempt = await start(page);
  const { card: raw, here } = await open(page, attempt, isTwoRowMatch);
  const card = raw as MatchQuestion;
  const [right, wrong] = card.rows;
  await pick(page, card.tokens.find(token => token.id === right.correctTokenId)!).click();
  await here.locator('.drop-empty').first().click();
  await expect.poll(() => placements(page, card.id)).toEqual({ [right.id]: right.correctTokenId });
  await pick(page, card.tokens.find(token => token.id !== wrong.correctTokenId)!).click();
  await here.locator('.drop-empty').first().click();
  await expect.poll(async () => Object.keys(await placements(page, card.id))).toHaveLength(2);
  await page.getByRole('button', { name: 'Finish test' }).click();
  await expect(page.getByText(/points \(\d+%\)/)).toBeVisible();
  await expect(page.getByText(/Roughly \d+ out of 1000/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Partly correct · 1 of 2 points/)).toBeVisible();
  await page.getByRole('button', { name: 'Wrong (1)' }).click();
  await expect(page.locator('.test-question')).toHaveCount(1);
  await expect(page.locator('.answer-review .answer-wrong').first()).toBeVisible();
  await page.getByRole('button', { name: /missed/i }).click();
  await expect(page.locator('.test-session-bar')).toContainText('of 50 answered');
  const retry = await active(page);
  expect(retry.mode).toBe('practice');
  expect(retry.delivery!.lockedBefore).toBe(0);
  await expect(page.locator('.exam-runner')).toBeVisible();
});

test('an exam that runs out of time scores what was saved', async ({ page }) => {
  await page.clock.install();
  await choose(page, 'exam', 50);
  await page.getByLabel('Time limit (minutes)', { exact: true }).fill('1');
  await page.getByRole('button', { name: 'Start exam', exact: true }).click();
  await expect(page.locator('.test-session-bar')).toContainText('of 50 answered');
  await page.clock.fastForward(61_000);
  await expect.poll(async () => (await attempts(page))[0].completedAt, { timeout: 15_000 }).not.toBeNull();
  await expect(page.getByRole('dialog', { name: 'Test results' })).toBeVisible();
  expect((await attempts(page))[0].result!.skipped).toBe(50);
});

test('nothing overflows at 320px and answer targets stay 44px tall', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const attempt = await start(page);
  const expectFit = async () => {
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    for (const height of await page.locator('.test-question button:visible, .test-question select:visible, .test-move button, .test-nav-button').evaluateAll(items => items.map(item => item.getBoundingClientRect().height))) expect(height).toBeGreaterThanOrEqual(44);
  };
  const match = await open(page, attempt, isPlainMatch);
  await pick(page, (match.card as MatchQuestion).tokens[0]).click();
  await match.here.locator('.drop-empty').first().click();
  await expectFit();
  const order = await open(page, attempt, candidate => candidate.kind === 'order' && !candidate.groupId);
  await pick(page, (order.card as OrderQuestion).tokens[0]).click();
  await order.here.locator('.drop-empty').first().click();
  await expectFit();
  await open(page, attempt, candidate => candidate.kind === 'hotspot' && !candidate.groupId);
  await expectFit();
  await open(page, attempt, candidate => candidate.groupId?.startsWith('fixture-case') === true);
  await expect(page.locator('.case-pane')).toBeVisible();
  await expectFit();
});

test('a held token stays on its row instead of the page scrolling away', async ({ page }) => {
  const attempt = await start(page);
  const { card: raw } = await open(page, attempt, isPlainMatch);
  const card = raw as MatchQuestion;
  const row = card.rows[0];
  await tray(page, card.tokens[0].id).evaluate(element => element.closest('.drag-board')?.scrollIntoView({ block: 'center' }));
  const a = (await tray(page, card.tokens[0].id).boundingBox())!, b = (await target(page, row.id).boundingBox())!;
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.move(a.x + 80, a.y + 20);
  await page.mouse.down();
  await page.mouse.move(a.x + 92, a.y + 32, { steps: 4 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
  await page.waitForTimeout(800);
  expect(Math.abs(await page.evaluate(() => window.scrollY) - before)).toBeLessThan(40);
  await page.mouse.up();
  await expect.poll(() => placements(page, card.id)).toEqual({ [row.id]: card.tokens[0].id });
});

test('reduced motion removes the drop animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const attempt = await start(page);
  const { card: raw } = await open(page, attempt, isPlainMatch);
  const card = raw as MatchQuestion;
  await drag(page, tray(page, card.tokens[0].id), target(page, card.rows[0].id));
  await expect(page.locator('.drag-token.is-overlay')).toHaveCount(0);
  await expect.poll(() => placements(page, card.id)).toEqual({ [card.rows[0].id]: card.tokens[0].id });
});

test.describe('touch', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 780 } });
  test('a press and hold drags a token onto a row', async ({ page }) => {
    const attempt = await start(page);
    const { card: raw } = await open(page, attempt, isPlainMatch);
    const card = raw as MatchQuestion;
    // Keep the token below the sticky bar and the row clear of the bottom edge.
    await tray(page, card.tokens[0].id).evaluate(element => window.scrollBy(0, element.getBoundingClientRect().top - 180));
    const a = (await tray(page, card.tokens[0].id).boundingBox())!;
    const b = (await target(page, card.rows[0].id).boundingBox())!;
    const client = await page.context().newCDPSession(page);
    const touch = (type: string, x?: number, y?: number) => client.send('Input.dispatchTouchEvent', { type: type as 'touchStart', touchPoints: x === undefined ? [] : [{ x, y: y! }] });
    await touch('touchStart', a.x + a.width / 2, a.y + a.height / 2);
    await page.waitForTimeout(260);
    for (let step = 1; step <= 10; step++) await touch('touchMove', a.x + a.width / 2 + (b.x + b.width / 2 - a.x - a.width / 2) * step / 10, a.y + a.height / 2 + (b.y + b.height / 2 - a.y - a.height / 2) * step / 10);
    await touch('touchEnd');
    await expect.poll(() => placements(page, card.id)).toEqual({ [card.rows[0].id]: card.tokens[0].id });
  });
  test('a tap selects a token and a second tap places it', async ({ page }) => {
    const attempt = await start(page);
    const { card: raw, here } = await open(page, attempt, isPlainMatch);
    const card = raw as MatchQuestion;
    await pick(page, card.tokens[0]).tap();
    await here.locator('.drop-empty').first().tap();
    await expect.poll(() => placements(page, card.id)).toEqual({ [card.rows[0].id]: card.tokens[0].id });
  });
});
