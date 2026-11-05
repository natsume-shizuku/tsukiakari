import { test, expect, type Page } from '@playwright/test';
import type { Backup } from '../../src/portability';

async function ready(page:Page) { await page.goto('/'); await expect(page.locator('.sidebar').getByText('Saved in this browser',{exact:true})).toBeVisible(); }
async function nav(page:Page,name:string) { await page.getByRole('link',{name,exact:true}).click(); }
async function create(page:Page,name='Transfer deck') {
  await nav(page,'Study'); await page.getByRole('button',{name:'Create a deck',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Create a deck',exact:true});
  await dialog.getByLabel('Deck name',{exact:true}).fill(name); await dialog.getByRole('button',{name:'Create deck',exact:true}).click();
  await expect(dialog).not.toBeVisible();
}
async function seed(page:Page) {
  await create(page); await nav(page,'Library');
  await page.getByLabel('Destination deck',{exact:true}).selectOption({label:'Transfer deck'});
  await page.locator('.library-pack').filter({has:page.getByRole('heading',{name:'Foundation fixtures',exact:true})}).getByRole('button',{name:'Add entire pack',exact:true}).click();
  await nav(page,'Study'); await page.getByRole('button',{name:'Study Transfer deck',exact:true}).click();
  const choices=page.getByRole('radiogroup',{name:'Answer choices'});
  if(await choices.count()) await choices.getByRole('radio').first().click();
  await page.getByRole('button',{name:'Reveal answer',exact:true}).click();
  await page.getByRole('button',{name:'Again',exact:true}).click();
  await expect(page.getByTestId('revealed-answer')).toHaveCount(0);
  await nav(page,'Settings');
}
async function download(page:Page,label='Export full backup'):Promise<Backup> {
  const pending=page.waitForEvent('download'); await page.getByRole('button',{name:label,exact:true}).click();
  const file=await pending; const stream=await file.createReadStream(); if(!stream)throw new Error('Missing download stream');
  const chunks:Buffer[]=[]; for await(const chunk of stream) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Backup;
}
async function full(page:Page) { const b=await download(page); if(b.kind!=='full')throw new Error('Expected full backup');return b; }
async function chooseFile(page:Page,value:unknown) {
  await page.getByLabel('JSON file (up to 100 MB)',{exact:true}).setInputFiles({name:'transfer.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(value))});
}
async function safety(page:Page) {
  await expect(page.getByRole('button',{name:'Replace collection',exact:true})).toBeDisabled();
  await download(page,'Download current backup'); await page.getByLabel('I have saved the current backup file.',{exact:true}).check();
}
async function replace(page:Page) {
  page.once('dialog',dialog=>dialog.accept()); await page.getByRole('button',{name:'Replace collection',exact:true}).click();
  await expect(page.getByText('Backup restored. This browser now contains the imported collection.',{exact:true})).toBeVisible();
}

test('full JSON round-trip restores reviews, test snapshots, settings and sessions after a safety export',async({page})=>{
  await ready(page);await seed(page);
  await nav(page,'Tests');await page.getByLabel('Question bank',{exact:true}).selectOption('developer-test-fixture');
  await page.getByLabel('Number of questions',{exact:true}).fill('50');await page.getByRole('button',{name:'Start practice',exact:true}).click();
  await page.locator('.test-question').first().locator('input[type=radio], input[type=checkbox]').first().check();
  await expect(page.locator('.save-status')).toContainText('Saved in this browser');
  await nav(page,'Settings');const original=await full(page);
  expect(original.workspace.reviewLogs).toHaveLength(1);expect(original.workspace.testAttempts).toHaveLength(1);
  await create(page,'Replace this deck');await nav(page,'Settings');const before=await full(page);
  await chooseFile(page,original);await expect(page.getByRole('heading',{name:'Import preview',exact:true})).toBeFocused();
  await safety(page);page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Replace collection',exact:true}).click();
  expect((await full(page)).workspace).toEqual(before.workspace);
  await replace(page);expect((await full(page)).workspace).toEqual(original.workspace);
  expect(await page.evaluate(()=>sessionStorage.getItem('tsukiakari-active-time'))).toBeNull();
  await page.reload();expect((await full(page)).workspace).toEqual(original.workspace);
});

test('invalid imports and failed replacements preserve the current collection and allow retry',async({page})=>{
  await ready(page);await seed(page);const original=await full(page);
  await chooseFile(page,{...original,version:999});
  await expect(page.locator('.transfer-error')).toContainText('cannot be imported');
  await expect(page.getByRole('button',{name:'Replace collection',exact:true})).toHaveCount(0);
  expect((await full(page)).workspace).toEqual(original.workspace);
  await create(page,'Survives failed restore');await nav(page,'Settings');const before=await full(page);
  await chooseFile(page,original);await safety(page);
  await page.evaluate(()=>{const clear=IDBObjectStore.prototype.clear;let fail=true;IDBObjectStore.prototype.clear=function(){if(fail&&this.name==='copies'){fail=false;throw new DOMException('Simulated restore failure','QuotaExceededError');}return clear.call(this);};});
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Replace collection',exact:true}).click();
  await expect(page.getByRole('alert').filter({hasText:'Storage needs attention'})).toBeVisible();
  expect((await full(page)).workspace).toEqual(before.workspace);
  await expect(page.getByRole('heading',{name:'Import preview',exact:true})).toBeVisible();
  await replace(page);expect((await full(page)).workspace).toEqual(original.workspace);
});

test('deck selections omit private progress, create fresh copies and keep mixed content studyable',async({page})=>{
  await ready(page);await seed(page);const before=await full(page);
  await page.getByLabel('Deck to export',{exact:true}).selectOption({label:'Transfer deck'});
  const deck=await download(page,'Export deck selection');if(deck.kind!=='deck')throw new Error('Expected deck');
  expect(JSON.stringify(deck)).not.toMatch(/personalNote|reviewLogs|schedulerStates|testAttempts/);
  deck.deck.name='Imported mixed';deck.deck.cards.push({packId:'unavailable-pack',cardId:'unavailable-card',contentRevision:1});
  await chooseFile(page,deck);await expect(page.getByText('1 card references are unavailable on this website.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Import as new deck',exact:true}).click();
  await expect(page.getByText('Deck imported as a fresh personal deck.',{exact:true})).toBeVisible();
  const after=await full(page);expect(after.workspace.decks).toHaveLength(2);
  const added=after.workspace.copies.filter(copy=>!before.workspace.copies.some(old=>old.id===copy.id));
  expect(added).toHaveLength(5);expect(added.every(copy=>!copy.personalNote&&!copy.tags.length&&!copy.suspended)).toBe(true);
  expect(after.workspace.reviewLogs).toEqual(before.workspace.reviewLogs);
  await nav(page,'Study');page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Study Imported mixed',exact:true}).click();
  await expect(page.getByRole('region',{name:'Review session',exact:true})).toBeVisible();
  await nav(page,'Settings');await chooseFile(page,deck);await page.getByRole('button',{name:'Import as new deck',exact:true}).click();
  await expect(page.getByText('Deck imported as a fresh personal deck.',{exact:true})).toBeVisible();
  expect((await full(page)).workspace.decks).toHaveLength(3);
});

test('settings scope matches deck identities and secondary tabs can export but cannot import',async({page,context})=>{
  await ready(page);await seed(page);const before=await full(page);
  const settings=await download(page,'Export settings');if(settings.kind!=='settings')throw new Error('Expected settings');
  settings.preferences.theme='dark';settings.decks[0].settings.newCardsPerDay=7;
  settings.decks.push({...settings.decks[0],id:'another-device',name:'No match'});
  await chooseFile(page,settings);await expect(page.getByText('1 deck settings have no matching deck and will be skipped.',{exact:true})).toBeVisible();
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Import settings',exact:true}).click();
  await expect(page.getByText('Preferences and matching deck settings imported.',{exact:true})).toBeVisible();
  const after=await full(page);expect(after.workspace.decks).toHaveLength(1);expect(after.workspace.decks[0].settings.newCardsPerDay).toBe(7);
  expect(after.workspace.copies).toEqual(before.workspace.copies);expect(after.workspace.schedulerStates).toEqual(before.workspace.schedulerStates);
  expect(after.workspace.session).toBeNull();expect(after.workspace.reviewLogs[0].undoable).toBe(false);
  const second=await context.newPage();await second.goto('/#settings');await expect(second.getByText('This is a read-only tab.',{exact:true})).toBeVisible();
  await expect(second.getByLabel('JSON file (up to 100 MB)',{exact:true})).toBeDisabled();
  expect((await full(second)).workspace).toEqual(after.workspace);await second.close();
});

test('statistics count saved flashcard reviews and undo removes the activity',async({page})=>{
  await ready(page);await seed(page);await nav(page,'Statistics');
  const today=page.locator('.statistics-metrics section').filter({has:page.getByRole('heading',{name:'Today',exact:true})});
  await expect(today.locator('strong')).toHaveText('1');await expect(page.locator('.statistics-year-summary')).toContainText('1 days');
  await expect(page.getByRole('region',{name:'Yearly study heatmap',exact:true})).toBeVisible();
  const originalDate=await page.getByLabel('Inspect date',{exact:true}).inputValue();
  await page.getByRole('button',{name:'Previous study day',exact:true}).click();
  await expect(page.getByLabel('Inspect date',{exact:true})).not.toHaveValue(originalDate);
  await nav(page,'Study');await page.getByRole('button',{name:'Continue studying',exact:true}).click();
  await page.getByRole('button',{name:'Undo last review',exact:true}).click();
  await nav(page,'Statistics');await expect(today.locator('strong')).toHaveText('0');
  await expect(page.getByText('Your first saved flashcard review will appear here.',{exact:true})).toBeVisible();
});

for(const theme of ['dark','light'])test('statistics and transfer layouts fit mobile and desktop in '+theme,async({page})=>{
  await ready(page);await nav(page,'Settings');await page.getByLabel('Appearance',{exact:true}).selectOption(theme);
  for(const width of [320,768,1440,1920,2560]){
    await page.setViewportSize({width,height:1000});
    for(const route of ['Statistics','Settings']){
      await nav(page,route);await page.evaluate(()=>scrollTo(0,0));
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(route==='Statistics'){
        await expect(page.getByRole('region',{name:'Yearly study heatmap',exact:true})).toBeVisible();
        const buttons=await page.locator('.statistics-page button').evaluateAll(items=>items.map(el=>el.getBoundingClientRect().height));
        expect(buttons.every(height=>height>=44)).toBe(true);
      }
      if(width===320||width===1440)await page.screenshot({path:'test-results/phase5-'+route.toLowerCase()+'-'+theme+'-'+width+'.png',fullPage:true});
    }
  }
});


test('expiry invalidates a stale safety backup and imported expired exams finalize again',async({page})=>{
  await page.clock.install({time:new Date('2030-05-14T12:00:00Z')});await ready(page);await nav(page,'Tests');
  await page.getByLabel('Question bank',{exact:true}).selectOption('developer-test-fixture');
  await page.getByLabel('Test mode',{exact:true}).selectOption('exam');await page.getByLabel('Number of questions',{exact:true}).fill('50');
  await page.getByLabel('Time limit (minutes)',{exact:true}).fill('1');await page.getByRole('button',{name:'Start exam',exact:true}).click();
  await expect(page.locator('.test-session-bar')).toContainText(`of ${50} answered`);await nav(page,'Settings');const original=await full(page);
  await chooseFile(page,original);await safety(page);await expect(page.getByRole('button',{name:'Replace collection',exact:true})).toBeEnabled();
  await page.clock.fastForward(61000);
  await expect(page.getByRole('button',{name:'Replace collection',exact:true})).toBeDisabled();
  await expect(page.getByLabel('I have saved the current backup file.',{exact:true})).not.toBeChecked();
  await safety(page);await replace(page);
  await expect.poll(async()=>(await full(page)).workspace.testAttempts[0].completedAt).toBe(original.workspace.testAttempts[0].deadlineAt);
  const completed=(await full(page)).workspace.testAttempts[0];expect(completed.result).toEqual({correct:0,wrong:0,skipped:50});
});


test('cancelling a validated import returns keyboard focus without changing data', async ({page}) => {
  await ready(page); await nav(page,'Settings');
  const before = await full(page);
  await chooseFile(page,before);
  await expect(page.getByRole('heading',{name:'Import preview',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Cancel import',exact:true}).click();
  await expect(page.getByLabel('JSON file (up to 100 MB)',{exact:true})).toBeFocused();
  expect((await full(page)).workspace).toEqual(before.workspace);
});
