import { test, expect, type Browser, type Page, type Route } from '@playwright/test';

interface StoredFile { id: string; name: string; parents: string[]; modifiedTime: string; body: string; }
interface FakeDrive { files: StoredFile[]; clock: number; failNext?: number; }
const newDrive = (): FakeDrive => ({ files: [], clock: Date.parse('2026-11-05T01:00:00.000Z') });
const stamp = (drive: FakeDrive) => new Date(drive.clock += 60_000).toISOString();
const reply = (route: Route, status: number, body: unknown) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: typeof body === 'string' ? body : JSON.stringify(body) });

/** Stands in for Google's sign-in script and Drive REST API, sharing one Drive between browsers. */
async function connectFakeGoogle(page: Page, drive: FakeDrive, clientId = 'test-client') {
  await page.addInitScript(id => {
    localStorage.setItem('tsukiakari.driveClientId', id);
    type Config = { scope: string; callback: (response: unknown) => void; error_callback: (error: unknown) => void };
    const scope = window as unknown as { fakeSignIn?: string; google: unknown };
    scope.google = { accounts: { oauth2: {
      initTokenClient: (config: Config) => ({ requestAccessToken: () => {
        if (scope.fakeSignIn === 'closed') config.error_callback({ type: 'popup_closed' });
        else if (scope.fakeSignIn === 'blocked') config.error_callback({ type: 'popup_failed_to_open' });
        else config.callback({ access_token: 'fake-token', expires_in: 3600, scope: config.scope });
      } }),
      hasGrantedAllScopes: () => scope.fakeSignIn !== 'declined',
      revoke: () => {},
    } } };
  }, clientId);
  await page.route('https://accounts.google.com/**', route => route.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.route('https://www.googleapis.com/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (drive.failNext) { const status = drive.failNext; drive.failNext = undefined; return reply(route, status, {}); }
    if (request.headers().authorization !== 'Bearer fake-token') return reply(route, 401, {});
    const summary = (file: StoredFile) => ({ id: file.id, modifiedTime: file.modifiedTime, size: String(file.body.length) });
    if (url.pathname === '/drive/v3/files') return reply(route, 200, { files: drive.files.filter(file => file.parents.includes('appDataFolder')).map(summary) });
    if (url.pathname === '/upload/drive/v3/files') {
      const parts = (request.postData() ?? '').split(/--tsukiakari-[^\r\n]+/).map(part => part.slice(part.indexOf('\r\n\r\n') + 4).trim());
      const metadata = JSON.parse(parts[1]) as { name: string; parents: string[] };
      const file = { id: 'drive-file', name: metadata.name, parents: metadata.parents, modifiedTime: stamp(drive), body: parts[2] };
      drive.files.push(file);
      return reply(route, 200, summary(file));
    }
    const file = drive.files.find(item => url.pathname.endsWith('/' + item.id));
    if (!file) return reply(route, 404, {});
    if (request.method() === 'PATCH') { file.body = request.postData() ?? ''; file.modifiedTime = stamp(drive); return reply(route, 200, summary(file)); }
    return reply(route, 200, file.body);
  });
}
async function createDeck(page: Page, name: string) {
  await page.goto('/#study');
  await page.getByRole('button', { name: 'Create a deck', exact: true }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Create a deck', exact: true });
  await dialog.getByLabel('Deck name', { exact: true }).fill(name);
  await dialog.getByRole('button', { name: 'Create deck', exact: true }).click();
  await expect(dialog).not.toBeVisible();
}
const settings = async (page: Page) => { await page.goto('/#settings'); await expect(page.getByRole('heading', { name: 'Data and transfer', exact: true })).toBeVisible(); };
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const saveToDrive = async (page: Page) => { await button(page, 'Save to Drive').click(); await expect(page.getByText('Saved to Google Drive.', { exact: true })).toBeVisible(); };
async function secondDevice(browser: Browser, drive: FakeDrive) {
  const context = await browser.newContext({ baseURL: 'http://localhost:4187' });
  const page = await context.newPage();
  await connectFakeGoogle(page, drive);
  return page;
}
const seenDecks = (page: Page) => page.evaluate(() => new Promise<string[]>((resolve, reject) => {
  const open = indexedDB.open('tsukiakari');
  open.onerror = () => reject(open.error);
  open.onsuccess = () => {
    const read = open.result.transaction('decks').objectStore('decks').getAll();
    read.onsuccess = () => { open.result.close(); resolve((read.result as { name: string }[]).map(deck => deck.name)); };
  };
}));

test('without a client ID the Drive section is a placeholder that never contacts Google', async ({ page }) => {
  const google: string[] = [];
  page.on('request', request => { if (/google/.test(new URL(request.url()).hostname)) google.push(request.url()); });
  await settings(page);
  await expect(page.getByRole('heading', { name: 'Google Drive backup', exact: true })).toBeVisible();
  await expect(page.getByText('Coming soon', { exact: true })).toBeVisible();
  await expect(button(page, 'Save to Drive')).toBeDisabled();
  await expect(button(page, 'Restore from Drive')).toBeDisabled();
  await expect(button(page, 'Disconnect Google')).toHaveCount(0);
  await expect(button(page, 'Export full backup')).toBeEnabled();
  expect(google).toEqual([]);
});

test('a backup saves to the hidden folder, updates in place, and restores on another device', async ({ page, browser }) => {
  const drive = newDrive();
  await connectFakeGoogle(page, drive);
  await createDeck(page, 'From my laptop');
  await settings(page);
  await saveToDrive(page);
  expect(drive.files).toHaveLength(1);
  expect(drive.files[0]).toMatchObject({ name: 'tsukiakari-backup.json', parents: ['appDataFolder'] });
  expect((JSON.parse(drive.files[0].body) as { kind: string }).kind).toBe('full');
  await expect(page.getByText(/Last saved or restored here:/)).toBeVisible();

  await createDeck(page, 'Second deck');
  await settings(page);
  await saveToDrive(page);
  expect(drive.files).toHaveLength(1);
  expect(drive.files[0].body).toContain('Second deck');

  const phone = await secondDevice(browser, drive);
  await createDeck(phone, 'Will be replaced');
  await settings(phone);
  await button(phone, 'Restore from Drive').click();
  await expect(phone.getByRole('heading', { name: 'Import preview', exact: true })).toBeFocused();
  expect(await seenDecks(phone)).toEqual(['Will be replaced']);
  const download = phone.waitForEvent('download');
  await button(phone, 'Download current backup').click();
  await download;
  await phone.getByLabel('I have saved the current backup file.', { exact: true }).check();
  phone.once('dialog', dialog => void dialog.accept());
  await button(phone, 'Replace collection').click();
  await expect(phone.getByText('Backup restored. This browser now contains the imported collection.', { exact: true })).toBeVisible();
  expect((await seenDecks(phone)).sort()).toEqual(['From my laptop', 'Second deck']);

  await saveToDrive(phone);
  await phone.context().close();
});

test('a device that has not seen the Drive copy must confirm before replacing it', async ({ page, browser }) => {
  const drive = newDrive();
  await connectFakeGoogle(page, drive);
  await createDeck(page, 'Years of progress');
  await settings(page);
  await saveToDrive(page);
  const original = drive.files[0].body;

  const fresh = await secondDevice(browser, drive);
  await settings(fresh);
  let warning = '';
  fresh.once('dialog', dialog => { warning = dialog.message(); void dialog.dismiss(); });
  await button(fresh, 'Save to Drive').click();
  await expect(fresh.getByText('Nothing was saved. Your Google Drive backup is unchanged.', { exact: true })).toBeVisible();
  expect(warning).toContain('has not restored');
  expect(drive.files[0].body).toBe(original);

  fresh.once('dialog', dialog => void dialog.accept());
  await saveToDrive(fresh);
  expect(drive.files[0].body).not.toBe(original);
  await fresh.context().close();
});

test('a copy saved elsewhere since this browser last saved also needs confirming', async ({ page, browser }) => {
  const drive = newDrive();
  await connectFakeGoogle(page, drive);
  await createDeck(page, 'Shared');
  await settings(page);
  await saveToDrive(page);
  const other = await secondDevice(browser, drive);
  await settings(other);
  other.once('dialog', dialog => void dialog.accept());
  await saveToDrive(other);
  await other.context().close();
  const newer = drive.files[0].modifiedTime;
  let warned = false;
  page.once('dialog', dialog => { warned = true; void dialog.dismiss(); });
  await button(page, 'Save to Drive').click();
  await expect(page.getByText('Nothing was saved. Your Google Drive backup is unchanged.', { exact: true })).toBeVisible();
  expect(warned).toBe(true);
  expect(drive.files[0].modifiedTime).toBe(newer);
});

test('restoring when Drive is empty says so and changes nothing', async ({ page }) => {
  await connectFakeGoogle(page, newDrive());
  await createDeck(page, 'Keep me');
  await settings(page);
  await button(page, 'Restore from Drive').click();
  await expect(page.getByText('No backup was found in this Google Drive yet.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Import preview', exact: true })).toHaveCount(0);
  expect(await seenDecks(page)).toEqual(['Keep me']);
});

test('a damaged Drive file is refused and local data stays', async ({ page }) => {
  const drive = newDrive();
  drive.files.push({ id: 'drive-file', name: 'tsukiakari-backup.json', parents: ['appDataFolder'], modifiedTime: stamp(drive), body: '{"format":"not-ours"}' });
  await connectFakeGoogle(page, drive);
  await createDeck(page, 'Keep me');
  await settings(page);
  await button(page, 'Restore from Drive').click();
  await expect(page.getByRole('alert').filter({ hasText: 'This file cannot be imported. Your data has not changed.' })).toBeVisible();
  await expect(button(page, 'Replace collection')).toHaveCount(0);
  expect(await seenDecks(page)).toEqual(['Keep me']);
});

test('an abandoned restore does not count as having seen the Drive copy', async ({ page, browser }) => {
  const drive = newDrive();
  await connectFakeGoogle(page, drive);
  await createDeck(page, 'Original');
  await settings(page);
  await saveToDrive(page);
  const other = await secondDevice(browser, drive);
  await settings(other);
  await button(other, 'Restore from Drive').click();
  await expect(other.getByRole('heading', { name: 'Import preview', exact: true })).toBeFocused();
  await other.reload();
  await expect(button(other, 'Save to Drive')).toBeEnabled();
  let warned = false;
  other.once('dialog', dialog => { warned = true; void dialog.dismiss(); });
  await button(other, 'Save to Drive').click();
  await expect(other.getByText('Nothing was saved. Your Google Drive backup is unchanged.', { exact: true })).toBeVisible();
  expect(warned).toBe(true);
  await other.context().close();
});

test('sign-in problems explain themselves and nothing is saved', async ({ page }) => {
  const drive = newDrive();
  await connectFakeGoogle(page, drive);
  await settings(page);
  const attempt = async (mode: string, message: RegExp) => {
    await page.evaluate(value => { (window as unknown as { fakeSignIn: string }).fakeSignIn = value; }, mode);
    await button(page, 'Save to Drive').click();
    await expect(page.getByRole('alert').filter({ hasText: message })).toContainText('Your data has not changed.');
  };
  await attempt('closed', /sign-in was closed/);
  await attempt('blocked', /blocked the Google sign-in window/);
  await attempt('declined', /needs permission/);
  expect(drive.files).toEqual([]);
  await expect(button(page, 'Disconnect Google')).toHaveCount(0);
});

test('an expired sign-in and a full Drive are reported, and the next try works', async ({ page }) => {
  const drive = newDrive();
  await connectFakeGoogle(page, drive);
  await settings(page);
  drive.failNext = 401;
  await button(page, 'Save to Drive').click();
  await expect(page.getByRole('alert').filter({ hasText: 'sign-in has expired' })).toBeVisible();
  await saveToDrive(page);
  await button(page, 'Disconnect Google').click();
  await expect(page.getByText('Disconnected from Google. Your Drive backup stays in your Drive.', { exact: true })).toBeVisible();
  await expect(button(page, 'Disconnect Google')).toHaveCount(0);
  expect(drive.files).toHaveLength(1);
});

test('a read-only tab can save a backup but cannot restore over the writer', async ({ page }) => {
  const drive = newDrive();
  await connectFakeGoogle(page, drive);
  await createDeck(page, 'Writer deck');
  const second = await page.context().newPage();
  await connectFakeGoogle(second, drive);
  await settings(second);
  await expect(second.getByText('This is a read-only tab.', { exact: true })).toBeVisible();
  await expect(button(second, 'Restore from Drive')).toBeDisabled();
  await saveToDrive(second);
  expect(drive.files[0].body).toContain('Writer deck');
});
