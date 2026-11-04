import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import type {StudyPack} from '../../src/domain';
const pack=JSON.parse(readFileSync('src/content/published/study-pack.json','utf8')) as StudyPack;
const pilot=JSON.parse(readFileSync('src/content/pilot/study-pack.json','utf8')) as StudyPack;
const oldIds=new Set(pilot.cards.map(card=>card.id));
const recall=pack.cards.find(card=>!oldIds.has(card.id)&&card.kind==='recall')!;
const scenario=pack.cards.find(card=>!oldIds.has(card.id)&&card.kind==='mcq')!;
const note=pack.notes.find(note=>!pilot.notes.some(old=>old.id===note.id))!;
async function ready(page:Page){await page.goto('/');await expect(page.getByText('Saved in this browser',{exact:true}).first()).toBeVisible();}
for(const theme of ['dark','light'])test('expanded sourced notes and scenario cards remain readable in '+theme,async({page})=>{
  await ready(page);
  await page.getByRole('link',{name:'Settings',exact:true}).click();
  await page.getByLabel('Appearance',{exact:true}).selectOption(theme);
  await page.getByRole('link',{name:'Library',exact:true}).click();
  await page.getByRole('link',{name:'Notes',exact:true}).click();
  await page.getByLabel('Search notes',{exact:true}).fill(note.title);
  await page.getByRole('button',{name:'Read note: '+note.title,exact:true}).click();
  const reader=page.getByRole('region',{name:'Note reader',exact:true});
  for(const paragraph of note.body.split(/\n\s*\n/))await expect(reader).toContainText(paragraph);
  for(const id of note.sourceIds)await expect(reader.locator('a[href="'+pack.sources.find(source=>source.id===id)!.url+'"]').first()).toBeVisible();
  for(const width of [320,768,1440,1920,2560]){
    await page.setViewportSize({width,height:1000});await page.evaluate(()=>scrollTo(0,0));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(reader).toBeVisible();
    await page.screenshot({path:'test-results/phase7d-note-'+theme+'-'+width+'.png',fullPage:true});
  }
  await page.getByRole('link',{name:'Card browser',exact:true}).click();
  await page.getByLabel('Search cards',{exact:true}).fill(scenario.prompt);
  await page.getByRole('button',{name:'Select card: '+scenario.prompt,exact:true}).click();
  const inspector=page.getByRole('region',{name:'Card details',exact:true});
  const answer=inspector.getByRole('tabpanel',{name:'Answer',exact:true});
  await expect(answer).toContainText(scenario.answer);
  for(const option of scenario.options!)await expect(answer).toContainText(option.text);
  for(const width of [320,768,1440,1920,2560]){
    await page.setViewportSize({width,height:1000});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(answer).toBeVisible();
    const tabs=inspector.getByRole('tablist'),before=await tabs.boundingBox();
    await answer.evaluate(el=>{el.scrollTop=el.scrollHeight;});
    expect((await tabs.boundingBox())!.y).toBeCloseTo(before!.y,0);
    await answer.evaluate(el=>{el.scrollTop=0;});
    await page.screenshot({path:'test-results/phase7d-card-'+theme+'-'+width+'.png'});
  }
});
test('a new sourced card can be added and reviewed with its canonical identity',async({page})=>{
  await ready(page);
  await page.getByRole('button',{name:'Create a deck',exact:true}).click();
  const create=page.getByRole('dialog',{name:'Create a deck',exact:true});
  await create.getByLabel('Deck name',{exact:true}).fill('Deployment learning');
  await create.getByRole('button',{name:'Create deck',exact:true}).click();await expect(create).not.toBeVisible();
  await page.getByRole('link',{name:'Library',exact:true}).click();
  await page.getByRole('link',{name:'Card browser',exact:true}).click();
  await page.getByLabel('Destination deck',{exact:true}).selectOption({label:'Deployment learning'});
  await page.getByLabel('Search cards',{exact:true}).fill(recall.prompt);
  await page.getByRole('button',{name:'Select card: '+recall.prompt,exact:true}).click();
  await page.getByRole('button',{name:'Add selected cards (1)',exact:true}).click();
  await expect(page.getByRole('button',{name:'Add selected cards (0)',exact:true})).toBeDisabled();
  await page.getByRole('link',{name:'Study',exact:true}).click();
  await page.getByRole('button',{name:'Study Deployment learning',exact:true}).click();
  await expect(page.getByRole('heading',{name:recall.prompt,exact:true})).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('revealed-answer')).toContainText(recall.answer);
  await page.getByRole('button',{name:'Again',exact:true}).click();
  await expect(page.getByTestId('revealed-answer')).toHaveCount(0);
  const saved=await page.evaluate(()=>new Promise<{copies:any[];logs:any[]}>((resolve,reject)=>{
    const req=indexedDB.open('tsukiakari');req.onerror=()=>reject(req.error);req.onsuccess=()=>{
      const db=req.result,tx=db.transaction(['copies','reviewLogs']);
      const copies=tx.objectStore('copies').getAll(),logs=tx.objectStore('reviewLogs').getAll();
      tx.oncomplete=()=>{resolve({copies:copies.result,logs:logs.result});db.close();};tx.onerror=()=>reject(tx.error);
    };
  }));
  expect(saved.copies).toHaveLength(1);expect(saved.logs).toHaveLength(1);
  expect(saved.copies[0].packId).toBe('contact-center-core');expect(saved.copies[0].cardId).toBe(recall.id);
  expect(saved.logs[0].copyId).toBe(saved.copies[0].id);expect(saved.logs[0].rating).toBe('again');
});
