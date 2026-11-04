import { test, expect, type Page } from '@playwright/test';
const lastDeck = new WeakMap<Page, string>();

async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByText('Saved in this browser', { exact: true }).first()).toBeVisible();
}
async function create(page: Page, name: string) {
  if (await page.getByRole('button', { name: 'Close deck settings', exact: true }).isVisible()) await page.getByRole('button', { name: 'Close deck settings', exact: true }).click();
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  await page.getByRole('button', { name: 'Create a deck', exact: true }).click();
  await page.getByLabel('Deck name').fill(name);
  await page.getByRole('button', { name: 'Create deck', exact: true }).click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  lastDeck.set(page, name);
}
async function addFixtures(page: Page) {
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByLabel('Destination deck', { exact: true }).selectOption({ label: lastDeck.get(page)! });
  await page.locator('.library-pack').filter({ has: page.getByRole('heading', { name: 'Foundation fixtures', exact: true }) }).getByRole('button', { name: 'Add entire pack', exact: true }).click();
  await expect(page.getByRole('button', { name: 'All pack cards added', exact: true })).toBeDisabled();
}
async function rows(page: Page, name: string): Promise<Record<string, unknown>[]> {
  return page.evaluate((storeName) => new Promise<Record<string, unknown>[]>((resolve, reject) => {
    const open = indexedDB.open('tsukiakari');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction(storeName);
      const request = transaction.objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    };
  }), name);
}

test('creates independent deck copies and preserves them across reloads', async ({ page }) => {
  await ready(page);
  await expect(page.getByText('Make room for your first deck.')).toBeVisible();
  expect(await rows(page, 'decks')).toHaveLength(0);
  await create(page, 'Evening study');
  await addFixtures(page);
  await create(page, 'Morning study');
  await addFixtures(page);
  const copies = await rows(page, 'copies');
  expect(copies).toHaveLength(8);
  expect(new Set(copies.map(copy => copy.id)).size).toBe(8);
  expect(new Set(copies.map(copy => copy.deckId)).size).toBe(2);
  expect(await rows(page, 'reviewLogs')).toHaveLength(0);
  expect(await rows(page, 'schedulerStates')).toHaveLength(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'All pack cards added', exact: true })).toBeDisabled();
  if (await page.getByRole('button', { name: 'Close deck settings', exact: true }).isVisible()) await page.getByRole('button', { name: 'Close deck settings', exact: true }).click();
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Evening study', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Morning study', exact: true })).toBeVisible();
  await expect(page.getByText('20 new / day', { exact: true })).toHaveCount(2);
});

test('all four areas and library sections have honest foundation states', async ({ page }) => {
  await ready(page);
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link')).toHaveCount(4);
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await expect(page.getByText('Engineering fixture · not a study pack').first()).toBeVisible();
  await page.getByRole('link', { name: 'Card browser', exact: true }).click();
  await page.getByRole('button', { name: 'Select card: Fixture: What is 2 + 3?', exact: true }).click();
  await expect(page.getByRole('link', { name: /Wolfram MathWorld: Addition/ }).first()).toHaveAttribute('href', 'https://mathworld.wolfram.com/Addition.html');
  await page.getByRole('button', { name: 'Close details' }).click();
  await page.getByRole('link', { name: 'Notes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Notes', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Mistakes', exact: true }).click();
  await expect(page.getByText('Cards with a saved Again review remain here so you can see their history. Undone reviews and test results are excluded.')).toBeVisible();
  await page.getByRole('link', { name: 'Tests', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tests', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Statistics', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Yearly study heatmap', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Statistics', exact: true })).toBeVisible();
  await expect(page.locator('main')).toBeFocused();
});

test('appearance persists and settings remain explicitly per deck', async ({ page }) => {
  await ready(page);
  await page.getByRole('link', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Appearance', { exact: true }).selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.getByLabel('Appearance', { exact: true })).toHaveValue('dark');
  await expect(page.getByText('Each deck manages its own daily allowances, steps, retention, and leech action. Open Manage on a deck to change them.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Third-party notices' })).toHaveAttribute('href', './third-party-notices.txt');
});

test('a second tab stays read-only until the writer closes and it reloads', async ({ page, context }) => {
  await ready(page);
  await create(page, 'Writer deck');
  const second = await context.newPage();
  await second.goto('/');
  await expect(second.getByText('This is a read-only tab.')).toBeVisible();
  await expect(second.getByRole('button', { name: 'Create a deck', exact: true })).toBeDisabled();
  await expect(second.getByRole('heading', { name: 'Writer deck', exact: true })).toBeVisible();
  await page.close();
  // Closing a tab and releasing its browser lock complete asynchronously.
  await expect.poll(async () => (await second.evaluate(() => navigator.locks.query())).held?.filter(lock => lock.name === 'tsukiakari-writer').length ?? 0).toBe(0);
  await second.getByRole('button', { name: 'Reload this tab' }).click();
  await expect(second.getByText('Saved in this browser', { exact: true }).first()).toBeVisible();
  await second.getByRole('button', { name: 'Create a deck', exact: true }).click();
  await second.getByLabel('Deck name').fill('Now writable');
  await expect(second.getByRole('button', { name: 'Create deck', exact: true })).toBeEnabled();
});

test('failed saves retain the form and existing data, then allow retry', async ({ page }) => {
  await ready(page);
  await create(page, 'Keep me');
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.add;
    let failOnce = true;
    IDBObjectStore.prototype.add = function (value, key) {
      if (this.name === 'decks' && failOnce) { failOnce = false; throw new DOMException('Simulated full storage', 'QuotaExceededError'); }
      return original.call(this, value, key);
    };
  });
  await page.getByRole('button', { name: 'Create a deck', exact: true }).click();
  await page.getByLabel('Deck name').fill('Retry me');
  await page.getByRole('button', { name: 'Create deck', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Create a deck' }).getByRole('alert')).toContainText('could not be saved');
  await expect(page.getByLabel('Deck name')).toHaveValue('Retry me');
  expect(await rows(page, 'decks')).toHaveLength(1);
  await page.getByRole('button', { name: 'Create deck', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Retry me', exact: true })).toBeVisible();
  expect(await rows(page, 'decks')).toHaveLength(2);
});

test('post-commit read failure blocks retry until reload to prevent duplicate writes', async ({ page }) => {
  // Install before Dexie captures the native transaction function. Only fail after the deck write.
  await page.addInitScript(() => {
    let failReads = false;
    const originalAdd = IDBObjectStore.prototype.add;
    const originalTransaction = IDBDatabase.prototype.transaction;
    IDBObjectStore.prototype.add = function (value, key) {
      const request = originalAdd.call(this, value, key);
      if (this.name === 'decks') failReads = true;
      return request;
    };
    IDBDatabase.prototype.transaction = function (storeNames, mode, options) {
      if (this.name === 'tsukiakari' && mode === 'readonly' && failReads) {
        throw new DOMException('Simulated read failure after commit', 'UnknownError');
      }
      return originalTransaction.call(this, storeNames, mode, options);
    };
  });
  await ready(page);
  await page.getByRole('button', { name: 'Create a deck', exact: true }).click();
  await page.getByLabel('Deck name').fill('Saved once');
  await page.getByRole('button', { name: 'Create deck', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Create a deck' }).getByRole('alert')).toContainText('save completed');
  await expect(page.getByRole('button', { name: 'Create deck', exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Saved once', exact: true })).toBeVisible();
  expect(await rows(page, 'decks')).toHaveLength(1);
});

test('corrupt saved data is reported and never reset', async ({ page }) => {
  await ready(page);
  await create(page, 'Preserve my deck');
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open('tsukiakari');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction('preferences', 'readwrite');
      transaction.objectStore('preferences').put({ id: 'preferences', theme: 'invalid', timeZone: 'America/Denver', dayStartsAtHour: 5 });
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
  }));
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('has not been reset');
  expect(await rows(page, 'decks')).toHaveLength(1);
  expect((await rows(page, 'preferences'))[0].theme).toBe('invalid');
  await expect(page.getByRole('button', { name: 'Create deck', exact: true })).toHaveCount(0);
});

for (const width of [320, 390, 768, 1440]) {
  test('responsive navigation and controls fit at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await ready(page);
    await create(page, 'An intentionally long deck name for small screens');
    await addFixtures(page);
    for (const route of ['Study', 'Library', 'Tests', 'Statistics', 'Settings']) {
      await page.getByRole('link', { name: route, exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    await page.getByLabel('Appearance', { exact: true }).selectOption('dark');
    if (await page.getByRole('button', { name: 'Close deck settings', exact: true }).isVisible()) await page.getByRole('button', { name: 'Close deck settings', exact: true }).click();
  await page.getByRole('link', { name: 'Study', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Create a deck', exact: true })).toBeVisible();
    if (width === 1440 || width === 390) {
      await page.screenshot({ path: 'test-results/phase1-' + (width === 1440 ? 'desktop' : 'mobile') + '.png', fullPage: true });
    }
  });
}
