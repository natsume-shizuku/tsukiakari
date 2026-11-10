import { test, expect, type Page } from '@playwright/test';
import { fixturePack } from '../../src/content/fixtures';

async function rows<T>(page: Page, table: string): Promise<T[]> {
  return page.evaluate(name => new Promise<T[]>((resolve, reject) => {
    const open = indexedDB.open('tsukiakari');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result, transaction = db.transaction(name), request = transaction.objectStore(name).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    };
  }), table);
}
async function createWithFixtures(page: Page, name: string) {
  await page.goto('/#study');
  await expect(page.getByText('Saved in this browser', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Create a deck', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Create a deck', exact: true });
  await dialog.getByLabel('Deck name', { exact: true }).fill(name);
  await dialog.getByRole('button', { name: 'Create deck', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByLabel('Destination deck', { exact: true }).selectOption({ label: name });
  const pack = page.getByRole('region', { name: 'Foundation fixtures', exact: true });
  await pack.getByRole('button', { name: 'Add entire pack', exact: true }).click();
  await expect(pack.getByRole('button', { name: 'All pack cards added', exact: true })).toBeDisabled();
}

// Native details must retain full source/note text while keeping the initial answer concise.
test('card details preserve open references through saves and reset them for another card', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await createWithFixtures(page, 'Compact library');
  await page.getByRole('link', { name: 'Card browser', exact: true }).click();
  const card = fixturePack.cards[0], next = fixturePack.cards[1];
  await page.getByRole('button', { name: 'Select card: ' + card.prompt, exact: true }).click();
  const detail = page.getByRole('region', { name: 'Card details', exact: true });
  const answer = detail.getByRole('tabpanel', { name: 'Answer', exact: true });
  const references = answer.locator('.card-inspector-references > details');
  const sources = answer.locator('details.card-inspector-sources');
  await expect(answer.getByText(card.answer, { exact: true })).toBeVisible();
  await expect(answer.getByText(card.explanation, { exact: true })).toBeVisible();
  await expect(references.locator('summary')).toHaveText('Reference notes (1)');
  await expect(sources.locator('summary')).toHaveText('Sources (1)');
  await expect(references).not.toHaveAttribute('open', '');
  await expect(sources).not.toHaveAttribute('open', '');
  await references.locator('summary').focus();
  await page.keyboard.press('Enter');
  const note = fixturePack.notes.find(note => card.noteIds.includes(note.id))!;
  await expect(references.getByRole('heading', { name: note.title, exact: true })).toBeVisible();
  await expect(references.getByText(note.body, { exact: true })).toBeVisible();
  for (const source of fixturePack.sources.filter(source => note.sourceIds.includes(source.id))) {
    await expect(references.getByRole('link', { name: source.title + ' ↗', exact: true })).toHaveAttribute('href', source.url);
  }
  await sources.locator('summary').click();
  for (const source of fixturePack.sources.filter(source => card.sourceIds.includes(source.id))) {
    await expect(sources.getByRole('link', { name: source.title + ' ↗', exact: true })).toHaveAttribute('href', source.url);
  }
  await detail.getByRole('tab', { name: 'My notes', exact: true }).click();
  await detail.getByLabel('Personal note', { exact: true }).fill('Keep the answer disclosures open while saving.');
  await detail.getByRole('button', { name: 'Save notes and tags', exact: true }).click();
  await expect(detail.getByRole('button', { name: 'Save notes and tags', exact: true })).toBeDisabled();
  await detail.getByRole('tab', { name: 'Answer', exact: true }).click();
  await expect(references).toHaveAttribute('open', '');
  await expect(sources).toHaveAttribute('open', '');
  await page.getByRole('button', { name: 'Select card: ' + next.prompt, exact: true }).click();
  await expect(answer.getByRole('heading', { name: next.prompt, exact: true })).toBeVisible();
  await expect(references).not.toHaveAttribute('open', '');
  await expect(sources).not.toHaveAttribute('open', '');
});

test.describe('touch study cards', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 900 } });
  for (const theme of ['dark', 'light']) test(`review disclosures preserve notes and guarded actions in ${theme}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/#settings');
    await expect(page.getByText('Saved in this browser', { exact: true }).first()).toBeVisible();
    await page.getByLabel('Appearance', { exact: true }).selectOption(theme);
    const deck = 'Compact review ' + theme;
    await createWithFixtures(page, deck);
    await page.getByRole('link', { name: 'Study', exact: true }).click();
    await page.getByRole('button', { name: 'Study ' + deck, exact: true }).click();
    const panel = page.getByRole('region', { name: 'Review session', exact: true });
    const prompt = await panel.locator('.review-question').innerText();
    const card = fixturePack.cards.find(card => card.prompt === prompt)!;
    if (card.kind === 'mcq') await panel.getByRole('radio').filter({ hasText: card.options!.find(option => option.id === card.correctOptionId)!.text }).click();
    await panel.getByRole('button', { name: 'Reveal answer', exact: true }).click();
    const answer = panel.getByTestId('revealed-answer');
    const references = answer.locator('.review-reference-notes'), sources = answer.locator('.review-sources');
    await expect(answer.locator('p.answer')).toHaveText(card.answer);
    await expect(answer.getByText(card.explanation, { exact: true })).toBeVisible();
    await expect(references).not.toHaveAttribute('open', '');
    await expect(sources).not.toHaveAttribute('open', '');
    await references.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(references).toHaveAttribute('open', '');
    await sources.locator('summary').focus();
    await page.keyboard.press('Space');
    await expect(sources).toHaveAttribute('open', '');
    expect(await rows(page, 'reviewLogs')).toHaveLength(0);
    const note = fixturePack.notes.find(note => card.noteIds.includes(note.id))!;
    await expect(references.getByRole('heading', { name: note.title, exact: true })).toBeVisible();
    await expect(references.getByText(note.body, { exact: true })).toBeVisible();
    for (const source of fixturePack.sources.filter(source => note.sourceIds.includes(source.id))) {
      await expect(references.getByRole('link', { name: source.title + ' ↗', exact: true })).toHaveAttribute('href', source.url);
      await expect(sources.getByRole('link', { name: source.title + ' ↗', exact: true })).toHaveAttribute('href', source.url);
    }
    await answer.locator('.review-annotations > summary').click();
    await answer.getByLabel('Personal note', { exact: true }).fill('My visible personal note.');
    await expect(panel.getByRole('button', { name: 'Right', exact: true })).toBeDisabled();
    const more = panel.locator('.review-more-actions');
    await more.locator('summary').click();
    await expect(more.getByRole('button', { name: 'Suspend card', exact: true })).toBeDisabled();
    await more.locator('summary').click();
    await answer.getByRole('button', { name: 'Save notes and tags', exact: true }).click();
    await expect(answer.getByRole('button', { name: 'Save notes and tags', exact: true })).toBeDisabled();
    await expect(answer.locator(':scope > .linked-notes .personal-prose')).toHaveText('My visible personal note.');
    await expect(references).toHaveAttribute('open', '');
    await expect(sources).toHaveAttribute('open', '');
    await expect(panel.getByRole('button', { name: 'Right', exact: true })).toBeEnabled();
    await expect(panel.locator('.review-shortcuts')).toBeHidden();
    await answer.locator('.review-annotations > summary').click();

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const control of ['Again', 'Right', 'Undo last review']) {
        const box = (await panel.getByRole('button', { name: control, exact: true }).boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
      const summaryBox = (await more.locator('summary').boundingBox())!;
      expect(summaryBox.width).toBeGreaterThanOrEqual(44);
      expect(summaryBox.height).toBeGreaterThanOrEqual(44);
      await answer.locator('p.answer').evaluate(element => { element.textContent = Array.from({ length: 160 }, (_, index) => 'Long answer paragraph ' + index + ' remains in the independently scrolling content.').join('\n\n'); });
      const actions = panel.locator('.review-actions'), content = panel.locator('.review-content');
      const before = (await actions.boundingBox())!;
      await content.evaluate(element => { element.scrollTop = element.scrollHeight; });
      expect(await content.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
      expect((await actions.boundingBox())!.y).toBeCloseTo(before.y, 0);
      const contentBox = (await content.boundingBox())!;
      expect(contentBox.y + contentBox.height).toBeLessThanOrEqual(before.y + 1);
      if (width === 320) await panel.screenshot({ path: `test-results/compact-card-${theme}-320.png` });
      await content.evaluate(element => { element.scrollTop = 0; });
    }
    await panel.getByRole('button', { name: 'Again', exact: true }).click();
    await expect.poll(async () => (await rows(page, 'reviewLogs')).length).toBe(1);
    await panel.getByRole('button', { name: 'Undo last review', exact: true }).click();
    await expect(panel.getByTestId('revealed-answer')).toBeVisible();
    await expect(panel.locator('.review-question')).toHaveText(prompt);
    await expect(panel.locator('.review-reference-notes')).not.toHaveAttribute('open', '');
    await expect(panel.locator('.review-sources')).not.toHaveAttribute('open', '');
    await more.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(more).toHaveAttribute('open', '');
    expect(await rows(page, 'reviewLogs')).toHaveLength(1);
    await more.getByRole('button', { name: 'Suspend card', exact: true }).click();
    await expect.poll(async () => (await rows<{ cardId: string; suspended: boolean }>(page, 'copies')).find(copy => copy.cardId === card.id)?.suspended).toBe(true);
  });
});
