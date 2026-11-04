import { test, expect, type Page } from '@playwright/test';

const prompts = ['Fixture: What is 2 + 3?', 'Fixture: What do we call the result of addition?'];
const savedNotes = ['My saved explanation: two plus three gives five.', 'My saved explanation: the result is called the sum.'];
interface CopyRow { id: string; personalNote: string; }
async function copies(page: Page): Promise<CopyRow[]> {
  return page.evaluate(() => new Promise<CopyRow[]>((resolve, reject) => {
    const request = indexedDB.open('tsukiakari');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('copies');
      const read = transaction.objectStore('copies').getAll();
      read.onsuccess = () => resolve(read.result);
      read.onerror = () => reject(read.error);
      transaction.oncomplete = () => db.close();
    };
  }));
}
async function personalNotes(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.getByText('Saved in this browser', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Create a deck', exact: true }).click();
  const create = page.getByRole('dialog', { name: 'Create a deck', exact: true });
  await create.getByLabel('Deck name', { exact: true }).fill('Notes regression');
  await create.getByRole('button', { name: 'Create deck', exact: true }).click();
  await expect(create).not.toBeVisible();
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByLabel('Destination deck', { exact: true }).selectOption({ label: 'Notes regression' });
  const pack = page.locator('.library-pack').filter({ has: page.getByRole('heading', { name: 'Foundation fixtures', exact: true }) });
  await pack.getByRole('button', { name: 'Add entire pack', exact: true }).click();
  await expect(pack.getByRole('button', { name: 'All pack cards added', exact: true })).toBeDisabled();
  await page.getByRole('link', { name: 'Card browser', exact: true }).click();
  for (let i = 0; i < prompts.length; i++) {
    await page.getByRole('button', { name: 'Select card: ' + prompts[i], exact: true }).click();
    const detail = page.getByRole('region', { name: 'Card details', exact: true });
    await detail.getByRole('tab', { name: 'My notes', exact: true }).click();
    await detail.getByLabel('Personal note', { exact: true }).fill(savedNotes[i]);
    await detail.getByRole('button', { name: 'Save notes and tags', exact: true }).click();
    await expect(detail.getByRole('button', { name: 'Save notes and tags', exact: true })).toBeDisabled();
    await detail.getByRole('button', { name: 'Close details', exact: true }).click();
  }
  await page.getByRole('link', { name: 'Notes', exact: true }).click();
  await page.getByRole('button', { name: /^Note filters/ }).click();
  await page.getByLabel('Note type', { exact: true }).selectOption('personal');
  const reader = page.getByRole('region', { name: 'Note reader', exact: true });
  await expect(page.getByRole('region', { name: 'Note list', exact: true }).getByRole('button')).toHaveCount(2);
  return reader;
}

test('inline note save failure keeps the draft, and retry saves before returning to reading', async ({ page }) => {
  const reader = await personalNotes(page);
  const original = (await reader.locator('.note-reader-body').innerText()).trim();
  const before = await copies(page);
  const target = before.find(copy => copy.personalNote === original)!;
  await reader.getByRole('button', { name: 'Edit personal note', exact: true }).click();
  const editor = reader.getByLabel('Personal note', { exact: true });
  await expect(editor).toBeFocused();
  await editor.fill('A retained draft after a failed save.');
  await page.evaluate(() => {
    const originalPut = IDBObjectStore.prototype.put;
    let fail = true;
    IDBObjectStore.prototype.put = function(value, key) {
      if (fail && this.name === 'copies') { fail = false; throw new DOMException('Notes save regression', 'QuotaExceededError'); }
      return originalPut.call(this, value, key);
    };
  });
  await reader.getByRole('button', { name: 'Save notes and tags', exact: true }).click();
  await expect(reader.getByRole('alert')).toContainText('could not be saved');
  await expect(editor).toHaveValue('A retained draft after a failed save.');
  expect(await copies(page)).toEqual(before);
  await expect(reader.getByRole('button', { name: 'Save notes and tags', exact: true })).toBeEnabled();
  await reader.getByRole('button', { name: 'Save notes and tags', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(reader.locator('.note-reader-body')).toHaveText('A retained draft after a failed save.');
  await expect(reader.locator('.notes-navigation-status')).toHaveText('Personal notes and tags saved.');
  await expect(page.locator('main > .mutation-feedback-slot')).toHaveCount(0);
  await expect(reader.getByRole('button', { name: 'Edit personal note', exact: true })).toBeFocused();
  const after = await copies(page);
  expect(after.find(copy => copy.id === target.id)?.personalNote).toBe('A retained draft after a failed save.');
  expect(after.filter(copy => copy.id !== target.id)).toEqual(before.filter(copy => copy.id !== target.id));
});

test('note drafts survive index visibility, declined filtering and navigation, and discard returns saved text', async ({ page }) => {
  const reader = await personalNotes(page);
  const original = (await reader.locator('.note-reader-body').innerText()).trim();
  const before = await copies(page);
  await reader.getByRole('button', { name: 'Edit personal note', exact: true }).click();
  const editor = reader.getByLabel('Personal note', { exact: true });
  await editor.fill('Unsaved note for navigation checks.');
  await reader.getByRole('button', { name: 'Hide index', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Note list', exact: true })).not.toBeVisible();
  await expect(editor).toHaveValue('Unsaved note for navigation checks.');
  await reader.getByRole('button', { name: 'Show index', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Note list', exact: true })).toBeVisible();
  page.once('dialog', dialog => dialog.dismiss());
  await reader.getByRole('button', { name: 'Next note', exact: true }).click();
  await expect(editor).toHaveValue('Unsaved note for navigation checks.');
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByLabel('Note type', { exact: true }).selectOption('published');
  await expect(page.getByLabel('Note type', { exact: true })).toHaveValue('personal');
  await expect(editor).toHaveValue('Unsaved note for navigation checks.');
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByLabel('Search notes', { exact: true }).fill('another note');
  await expect(page.getByLabel('Search notes', { exact: true })).toHaveValue('');
  await expect(editor).toHaveValue('Unsaved note for navigation checks.');
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  await expect(page).toHaveURL(/#library\/notes$/);
  await expect(editor).toHaveValue('Unsaved note for navigation checks.');
  page.once('dialog', dialog => dialog.accept());
  await reader.getByRole('button', { name: 'Next note', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await reader.getByRole('button', { name: 'Previous note', exact: true }).click();
  await expect(reader.locator('.note-reader-body')).toHaveText(original);
  await reader.getByRole('button', { name: 'Edit personal note', exact: true }).click();
  await editor.fill('Discard this second draft.');
  await reader.getByRole('button', { name: 'Discard changes', exact: true }).click();
  await expect(reader.locator('.note-reader-body')).toHaveText(original);
  await expect(reader.getByRole('button', { name: 'Edit personal note', exact: true })).toBeFocused();
  expect(await copies(page)).toEqual(before);
});

test('mobile Back confirms unsaved personal notes and returns focus to the selected title', async ({ page }) => {
  const reader = await personalNotes(page);
  await page.setViewportSize({ width: 320, height: 740 });
  const opener = page.getByRole('region', { name: 'Note list', exact: true }).getByRole('button').first();
  await opener.click();
  await reader.getByRole('button', { name: 'Edit personal note', exact: true }).click();
  const editor = reader.getByLabel('Personal note', { exact: true });
  await editor.fill('Keep this mobile draft until confirmed.');
  page.once('dialog', dialog => dialog.dismiss());
  await reader.getByRole('button', { name: /Back to notes/ }).click();
  await expect(editor).toHaveValue('Keep this mobile draft until confirmed.');
  page.once('dialog', dialog => dialog.accept());
  await reader.getByRole('button', { name: /Back to notes/ }).click();
  await expect(reader).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await expect(reader.getByLabel('Personal note', { exact: true })).toHaveCount(0);
  await expect(reader.locator('.note-reader-body')).not.toContainText('Keep this mobile draft');
});

test('mobile document Back restores a scrolled index without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/#library/notes');
  await expect(page.getByText('Saved in this browser', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: /^Note filters/ }).click();
  await page.getByLabel('Notes study pack', { exact: true }).selectOption({ label: 'Collection fixtures' });
  await page.getByRole('button', { name: /^Note filters/ }).click();
  const index = page.getByRole('region', { name: 'Note list', exact: true });
  const opener = index.getByRole('button').nth(30);
  await opener.scrollIntoViewIfNeeded();
  const top = await index.evaluate(element => element.scrollTop);
  expect(top).toBeGreaterThan(0);
  await opener.click();
  const reader = page.getByRole('region', { name: 'Note reader', exact: true });
  await expect(reader).toBeVisible();
  expect(await reader.evaluate(element => getComputedStyle(element).overflowY)).toBe('visible');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await reader.getByRole('button', { name: /Back to notes/ }).click();
  await expect(opener).toBeFocused();
  await expect.poll(() => index.evaluate(element => element.scrollTop)).toBeCloseTo(top, 0);
});
