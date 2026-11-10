import { test, expect, type Page } from '@playwright/test';

interface CopyRow { id: string; deckId: string; cardId: string; personalNote: string; tags: string[]; removed?: boolean; }
interface DeckRow { id: string; name: string; archived?: boolean; }
interface ReviewRow { id: string; copyId: string; undone: boolean; }
async function rows<T>(page: Page, storeName: string): Promise<T[]> {
  return page.evaluate(name => new Promise<T[]>((resolve, reject) => {
    const open = indexedDB.open('tsukiakari');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(name);
      const request = tx.objectStore(name).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    };
  }), storeName);
}
async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByText('Saved in this browser', { exact: true }).first()).toBeVisible();
}
async function create(page: Page, name: string) {
  if (await page.getByRole('button', { name: 'Close deck settings', exact: true }).isVisible()) await page.getByRole('button', { name: 'Close deck settings', exact: true }).click();
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  await page.getByRole('button', { name: 'Create a deck', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Create a deck' });
  await dialog.getByLabel('Deck name', { exact: true }).fill(name);
  await dialog.getByRole('button', { name: 'Create deck', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
}
async function addPack(page: Page, name: string) {
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByLabel('Destination deck', { exact: true }).selectOption({ label: name });
  await page.locator('.library-pack').filter({ has: page.getByRole('heading', { name: 'Foundation fixtures', exact: true }) }).getByRole('button', { name: 'Add entire pack', exact: true }).click();
  await expect(page.getByRole('button', { name: 'All pack cards added', exact: true })).toBeDisabled();
  await page.getByRole('link', { name: 'Card browser', exact: true }).click();
}
async function start(page: Page, name: string) {
  if (await page.getByRole('button', { name: 'Close deck settings', exact: true }).isVisible()) await page.getByRole('button', { name: 'Close deck settings', exact: true }).click();
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  await page.getByRole('button', { name: 'Study ' + name, exact: true }).click();
  await expect(page).toHaveURL(/#study\/review$/);
  await expect(page.getByRole('region', { name: 'Review session' })).toBeVisible();
}
async function reveal(page: Page) {
  if (await page.getByRole('radiogroup', { name: 'Answer choices' }).count()) {
    await page.getByRole('radio', { name: /Four equal sides and four right angles/ }).click();
  }
  await page.getByRole('button', { name: 'Reveal answer', exact: true }).click();
  await expect(page.getByTestId('revealed-answer')).toBeVisible();
}
async function manage(page: Page, name: string) {
  if (await page.getByRole('button', { name: 'Close deck settings', exact: true }).isVisible()) await page.getByRole('button', { name: 'Close deck settings', exact: true }).click();
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  await page.getByRole('link', { name: 'Manage ' + name, exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Manage ' + name, exact: true }).getByRole('heading', { name, exact: true })).toBeVisible();
}
async function inspectorNotes(page: Page) {
  const tab = page.getByRole('tab', { name: 'My notes', exact: true });
  if (await tab.count()) await tab.click();
}
async function inspectorActions(page: Page) {
  const button = page.getByRole('button', { name: 'Card actions', exact: true });
  if (await button.count() && await button.getAttribute('aria-expanded') !== 'true') await button.click();
}

const prompt = 'Fixture: What is 2 + 3?';

test('overview keeps review separate and Create dialog restores focus without losing a saved answer', async ({ page }) => {
  await ready(page);
  await expect(page.locator('.review-panel')).toHaveCount(0);
  await expect(page.getByLabel('Deck name', { exact: true })).not.toBeVisible();
  const opener = page.getByRole('button', { name: 'Create a deck', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Create a deck' });
  await expect(dialog.getByLabel('Deck name', { exact: true })).toBeFocused();
  await dialog.getByLabel('Deck name', { exact: true }).fill('Draft deck');
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await expect(opener).toBeFocused();
  expect(await rows(page, 'decks')).toHaveLength(0);
  await create(page, 'Evening');
  await addPack(page, 'Evening');
  await start(page, 'Evening');
  await expect(page.getByRole('heading', { name: 'Personal decks' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Create a deck' })).toHaveCount(0);
  const question = await page.locator('.review-question').innerText();
  await reveal(page);
  await page.getByRole('link', { name: 'Back to decks' }).click();
  await expect(page.locator('.review-panel')).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue studying', exact: true }).click();
  await expect(page.locator('.review-question')).toHaveText(question);
  await expect(page.getByTestId('revealed-answer')).toBeVisible();
  expect(await rows(page, 'reviewLogs')).toHaveLength(0);
});

test('rename, remove, re-add, archive and restore preserve one deck copy and leave another untouched', async ({ page }) => {
  await ready(page);
  await create(page, 'First'); await addPack(page, 'First');
  await create(page, 'Second'); await addPack(page, 'Second');
  const first = (await rows<DeckRow>(page, 'decks')).find(deck => deck.name === 'First')!;
  const originalCopies = await rows<CopyRow>(page, 'copies');
  const secondCopies = originalCopies.filter(copy => copy.deckId !== first.id);
  await start(page, 'First'); await reveal(page);
  const reviewedQuestion = await page.locator('.review-question').innerText();
  await page.getByRole('button', { name: 'Again', exact: true }).click();
  await expect.poll(async () => (await rows(page, 'reviewLogs')).length).toBe(1);
  const log = (await rows<ReviewRow>(page, 'reviewLogs'))[0];
  const schedules = await rows(page, 'schedulerStates');
  await manage(page, 'First');
  await page.getByRole('dialog', { name: 'Manage First', exact: true }).getByLabel('Deck name', { exact: true }).fill('Renamed');
  await page.getByRole('button', { name: 'Save name' }).click();
  await expect(page.getByRole('dialog', { name: 'Manage Renamed', exact: true }).getByRole('heading', { name: 'Renamed', exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Cards', exact: true }).click();
  await page.getByRole('button', { name: 'Select card: ' + reviewedQuestion, exact: true }).click();
  page.once('dialog', dialog => dialog.accept());
  await inspectorActions(page);
  await page.getByRole('region', { name: 'Card details', exact: true }).getByRole('button', { name: 'Remove from this deck', exact: true }).click();
  await expect.poll(async () => (await rows<CopyRow>(page, 'copies')).find(copy => copy.id === log.copyId)?.removed).toBe(true);
  expect(await rows(page, 'schedulerStates')).toEqual(schedules);
  await page.getByRole('button', {name:'Close deck settings',exact:true}).click();
  await page.getByRole('link', {name:'Library',exact:true}).click();
  await page.getByLabel('Destination deck', { exact: true }).selectOption(first.id);
  await page.locator('.library-pack').filter({ has: page.getByRole('heading', { name: 'Foundation fixtures', exact: true }) }).getByRole('button', { name: 'Add entire pack', exact: true }).click();
  await expect(page.getByRole('button', { name: 'All pack cards added', exact: true })).toBeDisabled();
  expect((await rows<CopyRow>(page, 'copies')).find(copy => copy.id === log.copyId)?.removed).toBe(false);
  expect(await rows(page, 'copies')).toHaveLength(8);
  expect(await rows(page, 'schedulerStates')).toEqual(schedules);
  expect((await rows<ReviewRow>(page, 'reviewLogs')).map(item => item.id)).toEqual([log.id]);
  await manage(page, 'Renamed');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Archive deck', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Archived deck', exact: true })).toBeVisible();
  await expect(page.locator('.membership-list a')).toHaveCount(0);
  await page.getByRole('button', { name: 'Close deck settings', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Manage Renamed' })).toHaveCount(0);
  await page.getByText('Archived decks', { exact: false }).first().click();
  await page.getByRole('button', { name: 'Restore Renamed', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Manage Renamed', exact: true })).toBeVisible();
  expect((await rows<CopyRow>(page, 'copies')).filter(copy => copy.deckId !== first.id)).toEqual(secondCopies);
  expect(await rows(page, 'schedulerStates')).toEqual(schedules);
});

test('Library keeps filters and stores notes and tags independently for each deck copy', async ({ page }) => {
  await ready(page);
  await create(page, 'Morning'); await addPack(page, 'Morning');
  await create(page, 'Night'); await addPack(page, 'Night');
  await page.getByLabel('Search cards', { exact: true }).fill('2 + 3');
  if (!await page.getByLabel('Card type', {exact:true}).isVisible()) await page.getByRole('button', {name:/^Filters/}).click();
  await page.getByLabel('Card type', { exact: true }).selectOption('recall');
  await page.getByRole('button', { name: 'Select card: ' + prompt, exact: true }).click();
  const detail = page.getByRole('region', { name: 'Card details', exact: true });
  await detail.getByLabel('Deck copy', { exact: true }).selectOption({ label: 'Morning' });
  await inspectorNotes(page);
  await detail.getByLabel('Personal note', { exact: true }).fill('Remember five fingers.');
  await detail.getByLabel('Personal tags (comma separated)').fill('morning, arithmetic');
  await detail.getByRole('button', { name: 'Save notes and tags' }).click();
  await expect(detail.getByRole('button', { name: 'Save notes and tags' })).toBeDisabled();
  await detail.getByLabel('Deck copy', { exact: true }).selectOption({ label: 'Night' });
  await expect(detail.getByLabel('Personal note', { exact: true })).toHaveValue('');
  await expect(detail.getByLabel('Personal tags (comma separated)')).toHaveValue('');
  await detail.getByRole('button', { name: 'Close details' }).click();
  await expect(page.getByLabel('Search cards', { exact: true })).toHaveValue('2 + 3');
  await expect(page.getByLabel('Card type', { exact: true })).toHaveValue('recall');
  await expect(page.getByRole('button', { name: 'Select card: ' + prompt, exact: true })).toBeFocused();
  await page.getByRole('link', { name: 'Notes', exact: true }).click();
  await page.getByLabel('Search notes', { exact: true }).fill('five fingers');
  await expect(page.locator('.library-note')).toHaveCount(1);
  await expect(page.locator('.library-note')).toContainText('Personal note · Morning');
  await expect(page.locator('.note-reader-body')).toContainText('Remember five fingers.');
  expect(await rows(page, 'reviewLogs')).toHaveLength(0);
  await page.reload();
  if (!await page.getByLabel('Notes study pack').isVisible()) await page.getByRole('button', {name: /^Note filters/}).click();
  await page.getByLabel('Notes deck', { exact: true }).selectOption({ label: 'Morning' });
  await page.getByLabel('Search notes', {exact:true}).fill('five fingers');
  await expect(page.locator('.note-reader-body')).toContainText('Remember five fingers.');
  const copies = await rows<CopyRow>(page, 'copies');
  expect(copies.filter(copy => copy.personalNote === 'Remember five fingers.')).toHaveLength(1);
  expect(copies.find(copy => copy.personalNote)?.tags).toEqual(['morning', 'arithmetic']);
});

test('failed annotation save keeps draft inside the details dialog and retries without changing review history', async ({ page }) => {
  await ready(page); await create(page, 'Notes'); await addPack(page, 'Notes');
  await page.getByRole('button', { name: 'Select card: ' + prompt, exact: true }).click();
  const detail = page.getByRole('region', { name: 'Card details', exact: true });
  await inspectorNotes(page);
  await detail.getByLabel('Personal note', { exact: true }).fill('Draft retained after failure');
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    let fail = true;
    IDBObjectStore.prototype.put = function(value, key) {
      if (fail && this.name === 'copies') { fail = false; throw new DOMException('Simulated annotation failure', 'QuotaExceededError'); }
      return original.call(this, value, key);
    };
  });
  const original = await rows(page, 'copies');
  await detail.getByRole('button', { name: 'Save notes and tags' }).click();
  await expect(detail.getByRole('alert')).toContainText('could not be saved');
  await expect(detail.getByLabel('Personal note', { exact: true })).toHaveValue('Draft retained after failure');
  expect(await rows(page, 'copies')).toEqual(original);
  expect(await rows(page, 'reviewLogs')).toHaveLength(0);
  await detail.getByRole('button', { name: 'Save notes and tags' }).click();
  await expect(detail.getByRole('button', { name: 'Save notes and tags' })).toBeDisabled();
  expect((await rows<CopyRow>(page, 'copies')).some(copy => copy.personalNote === 'Draft retained after failure')).toBe(true);
  expect(await rows(page, 'reviewLogs')).toHaveLength(0);
});

test('Mistakes shows saved Again reviews and removes an undone review', async ({ page }) => {
  await ready(page); await create(page, 'Mistakes'); await addPack(page, 'Mistakes');
  await start(page, 'Mistakes'); await reveal(page);
  const question = await page.locator('.review-question').innerText();
  await page.getByRole('button', { name: 'Again', exact: true }).click();
  await expect.poll(async () => (await rows(page, 'reviewLogs')).length).toBe(1);
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByRole('link', { name: 'Mistakes', exact: true }).click();
  await expect(page.locator('.library-mistake')).toHaveCount(1);
  await expect(page.locator('.library-mistake')).toContainText(question);
  await expect(page.locator('.library-mistake')).toContainText('1 Again review');
  if (await page.getByRole('button', { name: 'Close deck settings', exact: true }).isVisible()) await page.getByRole('button', { name: 'Close deck settings', exact: true }).click();
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  await page.getByRole('button', { name: 'Continue studying', exact: true }).click();
  await page.getByRole('button', { name: 'Undo last review', exact: true }).click();
  await expect.poll(async () => (await rows<ReviewRow>(page, 'reviewLogs'))[0].undone).toBe(true);
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByRole('link', { name: 'Mistakes', exact: true }).click();
  await expect(page.locator('.library-mistake')).toHaveCount(0);
  await expect(page.getByText('No flashcard mistakes match these filters.')).toBeVisible();
});

test('site-wide top navigation fits the overview, dialogs, management and review', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await ready(page); await create(page, 'Mobile studies'); await addPack(page, 'Mobile studies');
  if (await page.getByRole('button', { name: 'Close deck settings', exact: true }).isVisible()) await page.getByRole('button', { name: 'Close deck settings', exact: true }).click();
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  const siteHeader = await page.locator('.site-header').boundingBox();
  const main = await page.locator('main').boundingBox();
  expect(siteHeader!.y + siteHeader!.height).toBeLessThanOrEqual(main!.y + 1);
  await page.screenshot({ path: 'test-results/phase3-study-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 740 });
  const mobileHeader = await page.locator('.site-header').boundingBox();
  const mobileMain = await page.locator('main').boundingBox();
  // Main content starts after the shared website header at every width.
  expect(mobileHeader!.y + mobileHeader!.height).toBeLessThanOrEqual(mobileMain!.y);
  const noOverflow = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await noOverflow();
  await page.getByRole('button', { name: 'Create a deck', exact: true }).click();
  const createDialog = page.getByRole('dialog', { name: 'Create a deck' });
  await expect(createDialog).toBeVisible();
  await noOverflow();
  for (const button of await createDialog.getByRole('button').all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await createDialog.getByRole('button', { name: 'Cancel' }).click();
  await manage(page, 'Mobile studies'); await noOverflow();
  await page.getByRole('button', {name:'Close deck settings',exact:true}).click();
  await page.getByRole('link', {name:'Library',exact:true}).click();
  await page.getByRole('link', { name: 'Card browser', exact: true }).click();
  await page.getByRole('button', { name: 'Select card: ' + prompt, exact: true }).click();
  const detail = page.getByRole('region', { name: 'Card details', exact: true });
  await expect(detail).toBeVisible();
  await noOverflow();
  expect(await detail.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect((await detail.boundingBox())!.width).toBeLessThanOrEqual(320);
  await page.screenshot({ path: 'test-results/phase3-library-mobile.png' });
  await detail.getByRole('button', { name: 'Close details' }).click();
  await start(page, 'Mobile studies'); await reveal(page); await noOverflow();
  for (const name of ['Again', 'Right']) expect((await page.getByRole('button', { name, exact: true }).boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: 'test-results/phase3-review-mobile.png' });
});

test('review notes block accidental ratings and survive cancelled navigation before saving', async ({ page }) => {
  await ready(page); await create(page, 'Review notes'); await addPack(page, 'Review notes');
  await start(page, 'Review notes'); await reveal(page);
  await page.locator('.review-annotations summary').click();
  await inspectorNotes(page);
  await page.getByLabel('Personal note', { exact: true }).fill('My review reminder');
  await expect(page.getByRole('button', { name: 'Again', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Right', exact: true })).toBeDisabled();
  await page.getByRole('region', { name: 'Review session' }).focus();
  await page.keyboard.press('Space');
  expect(await rows(page, 'reviewLogs')).toHaveLength(0);
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Pause review', exact: true }).click();
  await expect(page).toHaveURL(/#study\/review$/);
  await expect(page.getByLabel('Personal note', { exact: true })).toHaveValue('My review reminder');
  await page.getByRole('button', { name: 'Save notes and tags', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Again', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Again', exact: true }).click();
  await expect.poll(async () => (await rows(page, 'reviewLogs')).length).toBe(1);
  expect((await rows<CopyRow>(page, 'copies')).filter(copy => copy.personalNote === 'My review reminder')).toHaveLength(1);
});

test('card details dismiss only from outside and protect unsaved notes', async ({ page }) => {
  await page.setViewportSize({width:1440,height:900});
  await ready(page); await create(page,'Backdrop'); await addPack(page,'Backdrop');
  await page.getByRole('link',{name:'Notes',exact:true}).click();
  const opener=page.getByRole('button',{name:'Open related card: '+prompt,exact:true});
  await page.getByText('Related cards', {exact:false}).first().click();
  await opener.click();
  const detail=page.getByRole('dialog',{name:'Card details'});
  await detail.getByRole('tab',{name:'Answer',exact:true}).click();
  await expect(detail).toBeVisible();
  const bounds=(await detail.boundingBox())!;
  await page.mouse.move(bounds.x+30,150); await page.mouse.down();
  await page.mouse.move(30,150); await page.mouse.up();
  await expect(detail).toBeVisible();
  await page.mouse.click(30,150);
  await expect(detail).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await inspectorNotes(page);
  await detail.getByLabel('Personal note',{exact:true}).fill('Keep my draft');
  page.once('dialog',dialog=>dialog.dismiss());
  await page.mouse.click(30,150);
  await expect(detail).toBeVisible();
  await expect(detail.getByLabel('Personal note',{exact:true})).toHaveValue('Keep my draft');
  page.once('dialog',dialog=>dialog.accept());
  await page.mouse.click(30,150);
  await expect(detail).not.toBeVisible();
  expect((await rows<CopyRow>(page,'copies')).every(copy=>copy.personalNote==='')).toBe(true);
});

test('Library separates packs from the browser and scrolls large collections without pagination', async ({ page }) => {
  test.setTimeout(60000);
  await ready(page); await create(page,'Large collection');
  await page.getByRole('link',{name:'Library',exact:true}).click();
  await expect(page.getByRole('link',{name:'Study packs',exact:true})).toHaveAttribute('aria-current','page');
  await expect(page.getByLabel('Search cards',{exact:true})).toHaveCount(0);
  await page.getByRole('link',{name:'Card browser',exact:true}).click();
  await expect(page.locator('.library-pack')).toHaveCount(0);
  if (!await page.getByLabel('Study pack', {exact:true}).isVisible()) await page.getByRole('button', {name:/^Filters/}).click();
  await page.getByLabel('Study pack',{exact:true}).selectOption({label:'Collection fixtures'});
  await expect(page.locator('.library-row')).toHaveCount(120);
  const cardList=page.getByRole('region',{name:'Card list',exact:true});
  const checkScrollable=async(name:string)=>{
    const list=page.getByRole('region',{name,exact:true});
    expect(await list.evaluate(element=>element.scrollHeight>element.clientHeight)).toBe(true);
    expect((await list.boundingBox())!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    await list.scrollIntoViewIfNeeded();
    await list.focus();await page.keyboard.press('End');
    await expect.poll(()=>list.evaluate(element=>Math.abs(element.scrollHeight-element.clientHeight-element.scrollTop))).toBeLessThanOrEqual(2);
  };
  await checkScrollable('Card list');
  const lastCard=page.locator('.library-row').last().getByRole('button');
  const previousScroll=await cardList.evaluate(element=>element.scrollTop);
  await lastCard.click();await page.getByRole('button',{name:'Close details'}).click();
  expect(await cardList.evaluate(element=>element.scrollTop)).toBe(previousScroll);
  await page.getByRole('button',{name:'Select all 120 matching cards',exact:true}).click();
  await expect(page.locator('.library-row button[aria-pressed="true"]')).toHaveCount(120);
  await page.getByRole('link',{name:'Study packs',exact:true}).click();
  await expect(page.getByRole('button',{name:'Add entire pack',exact:true})).toHaveCount(6);
  await page.getByRole('link',{name:'Card browser',exact:true}).click();
  await expect(page.getByLabel('Study pack',{exact:true})).toHaveValue('developer-collection-fixture');
  await page.getByRole('button',{name:'Add selected cards (120)',exact:true}).click();
  await expect.poll(async()=>(await rows(page,'copies')).length).toBe(120);
  await page.getByLabel('Search cards',{exact:true}).fill('11 + 1?');
  await expect(page.locator('.library-row')).toHaveCount(1);
  expect(await cardList.evaluate(element=>element.scrollTop)).toBe(0);
  await page.getByLabel('Search cards',{exact:true}).fill('');
  await cardList.scrollIntoViewIfNeeded();
  await page.screenshot({path:'test-results/phase3-scrolling-cards.png'});
  await page.getByRole('link',{name:'Notes',exact:true}).click();
  if (!await page.getByLabel('Notes study pack').isVisible()) await page.getByRole('button', {name: /^Note filters/}).click();
  await page.getByLabel('Notes study pack').selectOption({label:'Collection fixtures'});
  await expect(page.locator('.library-note')).toHaveCount(40);
  await checkScrollable('Note list');
  await page.locator('.library-note button').last().click();
  await expect(page.getByRole('region',{name:'Note reader',exact:true}).locator('.note-reader-body')).toBeVisible();
  await page.setViewportSize({width:320,height:740});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.getByRole('region',{name:'Note list',exact:true})).not.toBeVisible();
  await page.getByRole('button',{name:'Back to notes'}).click();
  await page.getByRole('region',{name:'Note list',exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:'test-results/phase3-scrolling-notes-mobile.png'});
  await page.setViewportSize({width:1280,height:900});
  await manage(page,'Large collection');
  await page.getByRole('tab',{name:'Cards',exact:true}).click();
  await expect(page.locator('.membership-list li')).toHaveCount(120);
  await checkScrollable('Deck card list');
  await page.getByLabel('Search deck cards').fill('11 + 1?');
  await expect(page.locator('.membership-list li')).toHaveCount(1);
  expect(await page.getByRole('region',{name:'Deck card list'}).evaluate(element=>element.scrollTop)).toBe(0);
  await page.getByLabel('Search deck cards').fill('');
  await page.getByRole('tab',{name:'Settings',exact:true}).click();
  await page.getByLabel('New cards / day',{exact:true}).fill('50');
  await page.getByRole('button',{name:'Save deck settings',exact:true}).click();
  await expect(page.getByText('Saved in this browser',{exact:true}).first()).toBeVisible();
  await start(page,'Large collection');
  for(let i=0;i<26;i++){
    const radios=page.getByRole('radio');
    if(await radios.count())await radios.first().click();
    await page.getByRole('button',{name:'Reveal answer',exact:true}).click();
    await page.getByRole('button',{name:'Again',exact:true}).click();
    await expect.poll(async()=>(await rows(page,'reviewLogs')).length).toBe(i+1);
  }
  await page.getByRole('link',{name:'Library',exact:true}).click();
  await page.getByRole('link',{name:'Mistakes',exact:true}).click();
  await expect(page.locator('.library-mistake')).toHaveCount(26);
  await checkScrollable('Mistake list');
  const mistakeRows=page.locator('.library-mistake').getByRole('button',{name:/^Select mistake:/});
  await mistakeRows.nth(0).click();
  await mistakeRows.nth(1).click();
  await expect(mistakeRows.nth(0)).toHaveAttribute('aria-pressed','false');
  await expect(mistakeRows.nth(1)).toHaveAttribute('aria-pressed','true');
  await mistakeRows.nth(0).click({modifiers:['Control']});
  await expect(page.locator('.library-mistake button[aria-pressed="true"]')).toHaveCount(2);
  await mistakeRows.nth(0).click({modifiers:['Control']});
  await expect(page.locator('.library-mistake button[aria-pressed="true"]')).toHaveCount(1);
  await mistakeRows.last().click();
  const detail=page.getByRole('region',{name:'Card details',exact:true});
  await expect(detail).toBeVisible();
  await detail.getByRole('tab', {name:'History',exact:true}).click();
  await expect(detail.getByRole('region',{name:'Review history list',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Next page',exact:true})).toHaveCount(0);
});

test('personal decks stay within three columns and can be found by name',async({page})=>{
  await page.setViewportSize({width:1920,height:1080});await ready(page);
  for(let i=1;i<=5;i++)await create(page,'Deck '+i);
  const tiles=await page.locator('.deck-tile').all();
  const boxes=await Promise.all(tiles.map(tile=>tile.boundingBox()));
  expect(boxes.filter(box=>Math.abs(box!.y-boxes[0]!.y)<1)).toHaveLength(3);
  await page.screenshot({path:'test-results/phase3-refined-decks.png',fullPage:true});
  await page.getByLabel('Search personal decks').fill('Deck 4');
  await expect(page.locator('.deck-tile')).toHaveCount(1);
  await page.getByLabel('Search personal decks').fill('');
  await page.setViewportSize({width:320,height:740});
  const mobileBoxes=await Promise.all((await page.locator('.deck-tile').all()).map(tile=>tile.boundingBox()));
  expect(mobileBoxes.every(box=>box!.x===mobileBoxes[0]!.x)).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('permanent deck deletion requires confirmation and preserves another deck',async({page})=>{
  await ready(page);await create(page,'Keep');await addPack(page,'Keep');
  await create(page,'Delete me');await addPack(page,'Delete me');
  const keep=(await rows<DeckRow>(page,'decks')).find(deck=>deck.name==='Keep')!;
  const keepCopies=(await rows<CopyRow>(page,'copies')).filter(copy=>copy.deckId===keep.id);
  await start(page,'Delete me');await reveal(page);
  await page.getByRole('button',{name:'Again',exact:true}).click();
  await expect.poll(async()=>(await rows(page,'reviewLogs')).length).toBe(1);
  await manage(page,'Delete me');
  await page.getByRole('button',{name:'Delete deck',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Permanently delete deck?'});
  await expect(dialog.getByRole('button',{name:'Permanently delete',exact:true})).toBeDisabled();
  await dialog.getByLabel('Type the deck name to confirm').fill('Wrong');
  await expect(dialog.getByRole('button',{name:'Permanently delete',exact:true})).toBeDisabled();
  await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
  expect(await rows(page,'decks')).toHaveLength(2);
  await page.getByRole('button',{name:'Delete deck',exact:true}).click();
  await dialog.getByLabel('Type the deck name to confirm').fill('Delete me');
  await dialog.getByRole('button',{name:'Permanently delete',exact:true}).click();
  await expect(page).toHaveURL(/#study$/);
  expect(await rows(page,'copies')).toEqual(keepCopies);
  expect(await rows(page,'reviewLogs')).toHaveLength(0);
  expect(await rows(page,'schedulerStates')).toHaveLength(0);
  expect(await rows(page,'reviewSessions')).toHaveLength(0);
  await expect(page.getByRole('heading',{name:'Keep',exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading',{name:'Keep',exact:true})).toBeVisible();
  expect(await rows(page,'decks')).toHaveLength(1);
});

test('card badges distinguish type, deck-scoped learning states, suspension, and tags',async({page})=>{
  await ready(page);await create(page,'Badge A');await addPack(page,'Badge A');
  await create(page,'Badge B');await addPack(page,'Badge B');
  await start(page,'Badge A');await reveal(page);
  const question=await page.locator('.review-question').innerText();
  await page.getByRole('button',{name:'Again',exact:true}).click();
  await expect.poll(async()=>(await rows(page,'reviewLogs')).length).toBe(1);
  await page.getByRole('link',{name:'Library',exact:true}).click();
  await page.getByRole('link',{name:'Card browser',exact:true}).click();
  const opener=page.getByRole('button',{name:'Select card: '+question,exact:true});
  const row=page.locator('.library-row').filter({has:opener});
  await expect(row.locator('.badge-learning')).toHaveText('Learning · 1');
  await expect(row.locator('.badge-new')).toHaveText('New · 1');
  await expect(opener).toHaveAttribute('aria-describedby',/card-badges-/);
  await opener.click();
  const detail=page.getByRole('region',{name:'Card details',exact:true});
  await detail.getByLabel('Deck copy',{exact:true}).selectOption({label:'Badge B'});
  await inspectorNotes(page);
  await detail.getByLabel('Personal tags (comma separated)').fill('night-study');
  await detail.getByRole('button',{name:'Save notes and tags'}).click();
  await expect(detail.getByRole('button',{name:'Save notes and tags'})).toBeDisabled();
  await inspectorActions(page);
  await detail.getByRole('button',{name:'Suspend card',exact:true}).click();
  await inspectorActions(page);
  await expect(detail.getByRole('button',{name:'Resume card',exact:true})).toBeEnabled();
  await detail.getByRole('button',{name:'Close details'}).click();
  await expect(row.locator('.badge-suspended')).toHaveText('Suspended · 1');
  await expect(row.locator('.badge-tag').filter({hasText:'#night-study'})).toHaveCount(1);
  if (!await page.getByLabel('Deck filter', {exact:true}).isVisible()) await page.getByRole('button', {name:/^Filters/}).click();
  await page.getByLabel('Deck filter',{exact:true}).selectOption({label:'Badge A'});
  await expect(row.locator('.badge-learning')).toHaveText('Learning');
  await expect(row.locator('.badge-new')).toHaveCount(0);
  await expect(row.locator('.badge-suspended')).toHaveCount(0);
  await expect(row.locator('.badge-tag').filter({hasText:'#night-study'})).toHaveCount(0);
  if (!await page.getByLabel('Deck filter', {exact:true}).isVisible()) await page.getByRole('button', {name:/^Filters/}).click();
  await page.getByLabel('Deck filter',{exact:true}).selectOption('');
  if (!await page.getByLabel('Study pack', {exact:true}).isVisible()) await page.getByRole('button', {name:/^Filters/}).click();
  await page.getByLabel('Study pack',{exact:true}).selectOption({label:'Collection fixtures'});
  await expect(page.locator('.badge-unadded')).toHaveCount(120);
  await expect(page.locator('.badge-new')).toHaveCount(0);
  if (!await page.getByLabel('Study pack', {exact:true}).isVisible()) await page.getByRole('button', {name:/^Filters/}).click();
  await page.getByLabel('Study pack',{exact:true}).selectOption('');
  await page.getByRole('region',{name:'Card list',exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:'test-results/phase3-card-badges.png'});
  await page.setViewportSize({width:320,height:740});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('region',{name:'Card list',exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:'test-results/phase3-card-badges-mobile.png'});
});
