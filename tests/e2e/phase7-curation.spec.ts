import { test, expect, type Page } from '@playwright/test';

type Copy = { id: string; deckId: string; packId: string; cardId: string; personalNote: string; removed?: boolean };
async function copies(page: Page): Promise<Copy[]> {
  return page.evaluate(() => new Promise<Copy[]>((resolve, reject) => {
    const request = indexedDB.open('tsukiakari');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('copies');
      const read = tx.objectStore('copies').getAll();
      read.onsuccess = () => resolve(read.result);
      read.onerror = () => reject(read.error);
      tx.oncomplete = () => db.close();
    };
  }));
}
async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByText('Saved in this browser', { exact: true }).first()).toBeVisible();
}
async function create(page: Page, name: string) {
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  await page.getByRole('button', { name: 'Create a deck', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Create a deck', exact: true });
  await dialog.getByLabel('Deck name', { exact: true }).fill(name);
  await dialog.getByRole('button', { name: 'Create deck', exact: true }).click();
  await expect(dialog).not.toBeVisible();
}
async function packs(page: Page, deck: string) {
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByRole('link', { name: 'Study packs', exact: true }).click();
  await page.getByLabel('Destination deck', { exact: true }).selectOption({ label: deck });
}
const packPanel = (page: Page, title: string) => page.getByRole('region', { name: title, exact: true });
const sharedId = 'developer-shared-foundations';
const prompt = 'Fixture: What is 2 + 3?';

test('overlapping packs add only canonical cards and expose one shared question bank', async ({ page }) => {
  await ready(page);
  await create(page, 'Shared learning');
  await packs(page, 'Shared learning');
  await packPanel(page, 'Foundation fixtures').getByRole('button', { name: 'Add entire pack', exact: true }).click();
  await expect.poll(async () => (await copies(page)).length).toBe(4);
  const original = await copies(page);
  const shared = packPanel(page, 'Shared foundations preview');
  await expect(shared.getByText('4 of 6 cards in Shared learning')).toBeVisible();
  await shared.getByRole('button', { name: 'Add entire pack', exact: true }).click();
  await expect.poll(async () => (await copies(page)).length).toBe(6);
  await expect(page.getByText(/Added 2 cards.*4 already in this deck/).first()).toBeVisible();
  await expect(shared.getByRole('button', { name: 'All pack cards added', exact: true })).toBeDisabled();
  const after = await copies(page);
  for (const copy of original) expect(after.find(item => item.id === copy.id)).toEqual(copy);
  expect(after.some(copy => copy.packId === sharedId)).toBe(false);
  await shared.getByRole('link', { name: /Open Engineering test preview/ }).click();
  await expect(page.getByLabel('Question bank', { exact: true })).toHaveValue('developer-test-fixture');
  await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeEnabled();
  await packs(page, 'Shared learning');
  await packPanel(page, 'Foundation fixtures').getByRole('link', { name: /Open Engineering test preview/ }).click();
  await expect(page.getByLabel('Question bank', { exact: true })).toHaveValue('developer-test-fixture');
});

test('card and note filters resolve curation membership without duplicate rows', async ({ page }) => {
  await ready(page);
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByRole('link', { name: 'Card browser', exact: true }).click();
  const list = page.getByRole('region', { name: 'Card list', exact: true });
  await expect(list.getByRole('button', { name: /^Select card:/ })).toHaveCount(359);
  await page.getByRole('button', { name: /^Filters/ }).click();
  await page.getByLabel('Study pack', { exact: true }).selectOption(sharedId);
  await expect(list.getByRole('button', { name: /^Select card:/ })).toHaveCount(6);
  await page.getByLabel('Topic', { exact: true }).selectOption({ label: 'More addition' });
  await expect(list.getByRole('button', { name: /^Select card:/ })).toHaveCount(2);
  const rows = list.getByRole('button', { name: /^Select card:/ });
  await rows.nth(0).click();
  await rows.nth(1).click();
  await expect(rows.nth(0)).toHaveAttribute('aria-pressed', 'false');
  await expect(rows.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await rows.nth(0).click({ modifiers: ['Control'] });
  await expect(rows.nth(0)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { name: '2 cards selected', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Notes', exact: true }).click();
  const notes = page.getByRole('region', { name: 'Note list', exact: true });
  await expect(notes.getByRole('button', { name: /^Read note:/ })).toHaveCount(120);
  await page.getByRole('button', { name: /^Note filters/ }).click();
  await page.getByLabel('Notes study pack', { exact: true }).selectOption(sharedId);
  await expect(notes.getByRole('button', { name: /^Read note:/ })).toHaveCount(3);
  await notes.getByRole('button', { name: /Read note: Collection fixture note 001/ }).click();
  await page.locator('.note-reader-related > summary').click();
  await expect(page.getByRole('button', { name: /^Open related card:/ })).toHaveCount(2);
});

test('curation filter changes guard drafts and personal notes remain deck-specific', async ({ page }) => {
  await ready(page);
  await create(page, 'First');
  await packs(page, 'First');
  await packPanel(page, 'Foundation fixtures').getByRole('button', { name: 'Add entire pack', exact: true }).click();
  await expect(packPanel(page, 'Foundation fixtures').getByRole('button', { name: 'All pack cards added', exact: true })).toBeDisabled();
  await create(page, 'Second');
  await packs(page, 'Second');
  await packPanel(page, 'Shared foundations preview').getByRole('button', { name: 'Add entire pack', exact: true }).click();
  await expect.poll(async () => (await copies(page)).length).toBe(10);
  await page.getByRole('link', { name: 'Card browser', exact: true }).click();
  await page.getByLabel('Destination deck', { exact: true }).selectOption({ label: 'First' });
  await page.getByRole('button', { name: /^Filters/ }).click();
  await page.getByLabel('Study pack', { exact: true }).selectOption(sharedId);
  await page.getByRole('button', { name: 'Select card: ' + prompt, exact: true }).click();
  await page.getByRole('tab', { name: 'My notes', exact: true }).click();
  await page.getByLabel('Personal note', { exact: true }).fill('My independent explanation');
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByLabel('Study pack', { exact: true }).selectOption('developer-foundation-fixture');
  await expect(page.getByLabel('Study pack', { exact: true })).toHaveValue(sharedId);
  await expect(page.getByLabel('Personal note', { exact: true })).toHaveValue('My independent explanation');
  await page.getByRole('button', { name: 'Save notes and tags', exact: true }).click();
  await expect.poll(async () => (await copies(page)).filter(copy => copy.personalNote === 'My independent explanation').length).toBe(1);
  await page.getByRole('link', { name: 'Notes', exact: true }).click();
  await page.getByRole('button', { name: /^Note filters/ }).click();
  await page.getByLabel('Notes study pack', { exact: true }).selectOption(sharedId);
  await page.getByLabel('Note type', { exact: true }).selectOption('personal');
  await page.getByLabel('Notes deck', { exact: true }).selectOption({ label: 'First' });
  await expect(page.getByRole('region', { name: 'Note list', exact: true }).getByRole('button', { name: /^Read note:/ })).toHaveCount(1);
  await expect(page.locator('.note-reader-body')).toContainText('My independent explanation');
  await page.getByLabel('Notes deck', { exact: true }).selectOption({ label: 'Second' });
  await expect(page.getByRole('heading', { name: 'No notes match these filters.', exact: true })).toBeVisible();
});
