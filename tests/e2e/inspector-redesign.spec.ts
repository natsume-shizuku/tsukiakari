import { test, expect, type Page } from '@playwright/test';

const prompt = 'Fixture: What is 2 + 3?';
interface CopyRow { id: string; deckId: string; cardId: string; personalNote: string; removed?: boolean; }
interface DeckRow { id: string; name: string; }
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
async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByText('Saved in this browser', { exact: true }).first()).toBeVisible();
}
async function createWithCards(page: Page, name: string) {
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  await page.getByRole('button', { name: 'Create a deck', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Create a deck' });
  await dialog.getByLabel('Deck name', { exact: true }).fill(name);
  await dialog.getByRole('button', { name: 'Create deck', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByLabel('Destination deck', { exact: true }).selectOption({ label: name });
  const pack = page.locator('.library-pack').filter({ has: page.getByRole('heading', { name: 'Foundation fixtures', exact: true }) });
  await pack.getByRole('button', { name: 'Add entire pack', exact: true }).click();
  await expect(pack.getByRole('button', { name: 'All pack cards added', exact: true })).toBeDisabled();
}
async function openCard(page: Page) {
  await page.getByRole('link', { name: 'Card browser', exact: true }).click();
  await page.getByRole('button', { name: 'Select card: ' + prompt, exact: true }).click();
  return page.getByRole('region', { name: 'Card details', exact: true });
}

test('inspector keyboard tabs preserve drafts and deck-copy changes require explicit discard', async ({ page }) => {
  await ready(page); await createWithCards(page, 'First copy'); await createWithCards(page, 'Second copy');
  const detail = await openCard(page);
  await detail.getByLabel('Deck copy', { exact: true }).selectOption({ label: 'First copy' });
  const answerTab = detail.getByRole('tab', { name: 'Answer', exact: true });
  const notesTab = detail.getByRole('tab', { name: 'My notes', exact: true });
  const historyTab = detail.getByRole('tab', { name: 'History', exact: true });
  await expect(answerTab).toHaveAttribute('aria-selected', 'true');
  await answerTab.focus(); await page.keyboard.press('ArrowRight');
  await expect(notesTab).toBeFocused();
  await detail.getByLabel('Personal note', { exact: true }).fill('Keep this draft while reading.');
  await historyTab.click();
  await expect(detail.getByLabel('Personal note', { exact: true })).toBeHidden();
  await historyTab.focus(); await page.keyboard.press('Home');
  await expect(answerTab).toBeFocused();
  await page.keyboard.press('End'); await expect(historyTab).toBeFocused();
  await page.keyboard.press('ArrowRight'); await expect(answerTab).toBeFocused();
  await notesTab.click();
  await expect(detail.getByLabel('Personal note', { exact: true })).toHaveValue('Keep this draft while reading.');
  const firstCopyId = await detail.getByLabel('Deck copy', { exact: true }).inputValue();
  page.once('dialog', dialog => dialog.dismiss());
  await detail.getByLabel('Deck copy', { exact: true }).selectOption({ label: 'Second copy' });
  await expect(detail.getByLabel('Deck copy', { exact: true })).toHaveValue(firstCopyId);
  await expect(detail.getByLabel('Personal note', { exact: true })).toHaveValue('Keep this draft while reading.');
  page.once('dialog', dialog => dialog.accept());
  await detail.getByLabel('Deck copy', { exact: true }).selectOption({ label: 'Second copy' });
  await expect(detail.getByLabel('Personal note', { exact: true })).toHaveValue('');
  await detail.getByLabel('Deck copy', { exact: true }).selectOption({ label: 'First copy' });
  await expect(detail.getByLabel('Personal note', { exact: true })).toHaveValue('');
  expect((await rows<CopyRow>(page, 'copies')).every(copy => copy.personalNote === '')).toBe(true);
});

test('cards without a deck copy remain readable and explain unavailable personal data', async ({ page }) => {
  await ready(page);
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  const detail = await openCard(page);
  await expect(detail.getByRole('heading', { name: prompt, exact: true })).toBeVisible();
  const reference = detail.locator('.card-inspector-references details').first();
  await expect(reference).not.toHaveAttribute('open', '');
  await reference.locator('summary').click();
  await expect(reference.locator('.library-prose')).toBeVisible();
  await expect(detail.getByRole('button', { name: 'Card actions', exact: true })).toHaveCount(0);
  await detail.getByRole('tab', { name: 'My notes', exact: true }).click();
  await expect(detail.getByRole('heading', { name: 'Personal notes unavailable', exact: true })).toBeVisible();
  await expect(detail.getByRole('tabpanel', { name: 'My notes', exact: true }).getByText('Add this card to a deck to save personal notes and tags and begin scheduled study.')).toBeVisible();
  await detail.getByRole('tab', { name: 'History', exact: true }).click();
  await expect(detail.getByRole('heading', { name: 'History unavailable', exact: true })).toBeVisible();
  await detail.getByRole('tab', { name: 'Answer', exact: true }).click();
  await expect(detail.getByRole('heading', { name: prompt, exact: true })).toBeVisible();
});

test('removing the inspected destination copy never silently opens another deck copy', async ({ page }) => {
  await ready(page); await createWithCards(page, 'Keep copy'); await createWithCards(page, 'Remove copy');
  const detail = await openCard(page);
  const decks = await rows<DeckRow>(page, 'decks');
  const keepDeck = decks.find(deck => deck.name === 'Keep copy')!;
  const removeDeck = decks.find(deck => deck.name === 'Remove copy')!;
  const before = await rows<CopyRow>(page, 'copies');
  const keepCopies = before.filter(copy => copy.deckId === keepDeck.id);
  const selectedId = await detail.getByLabel('Deck copy', { exact: true }).inputValue();
  expect(before.find(copy => copy.id === selectedId)?.deckId).toBe(removeDeck.id);
  await detail.getByRole('button', { name: 'Card actions', exact: true }).click();
  page.once('dialog', dialog => dialog.accept());
  await detail.getByRole('button', { name: 'Remove from this deck', exact: true }).click();
  await expect.poll(async () => (await rows<CopyRow>(page, 'copies')).find(copy => copy.id === selectedId)?.removed).toBe(true);
  await expect(detail.getByRole('button', { name: 'Card actions', exact: true })).toHaveCount(0);
  await detail.getByRole('tab', { name: 'My notes', exact: true }).click();
  await expect(detail.getByRole('heading', { name: 'Personal notes unavailable', exact: true })).toBeVisible();
  await expect(detail.getByLabel('Personal note', { exact: true })).toHaveCount(0);
  expect((await rows<CopyRow>(page, 'copies')).filter(copy => copy.deckId === keepDeck.id)).toEqual(keepCopies);
});

test('a failed note save retains its draft across tabs and retry saves only its deck copy', async ({ page }) => {
  await ready(page); await createWithCards(page, 'Save first'); await createWithCards(page, 'Other copy');
  const detail = await openCard(page);
  await detail.getByLabel('Deck copy', { exact: true }).selectOption({ label: 'Save first' });
  const copyId = await detail.getByLabel('Deck copy', { exact: true }).inputValue();
  const before = await rows<CopyRow>(page, 'copies');
  await detail.getByRole('tab', { name: 'My notes', exact: true }).click();
  await detail.getByLabel('Personal note', { exact: true }).fill('Retry without losing this note.');
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    let fail = true;
    IDBObjectStore.prototype.put = function(value, key) {
      if (fail && this.name === 'copies') { fail = false; throw new DOMException('Simulated note save failure', 'QuotaExceededError'); }
      return original.call(this, value, key);
    };
  });
  await detail.getByRole('button', { name: 'Save notes and tags', exact: true }).click();
  await expect(detail.getByRole('alert')).toContainText('could not be saved');
  expect(await rows(page, 'copies')).toEqual(before);
  await detail.getByRole('tab', { name: 'Answer', exact: true }).click();
  await detail.getByRole('tab', { name: 'History', exact: true }).click();
  await detail.getByRole('tab', { name: 'My notes', exact: true }).click();
  await expect(detail.getByLabel('Personal note', { exact: true })).toHaveValue('Retry without losing this note.');
  await expect(detail.getByRole('button', { name: 'Save notes and tags', exact: true })).toBeEnabled();
  await detail.getByRole('button', { name: 'Save notes and tags', exact: true }).click();
  await expect(detail.getByRole('button', { name: 'Save notes and tags', exact: true })).toBeDisabled();
  const after = await rows<CopyRow>(page, 'copies');
  expect(after.find(copy => copy.id === copyId)?.personalNote).toBe('Retry without losing this note.');
  expect(after.filter(copy => copy.id !== copyId)).toEqual(before.filter(copy => copy.id !== copyId));
});
