import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { StudyPack } from '../../src/domain';
const pack = JSON.parse(readFileSync('src/content/published/study-pack.json','utf8')) as StudyPack;

async function records(page: Page, table: string) {
  return page.evaluate(name => new Promise<any[]>((resolve,reject) => {
    const request=indexedDB.open('tsukiakari');
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{
      const db=request.result, tx=db.transaction(name), read=tx.objectStore(name).getAll();
      read.onsuccess=()=>resolve(read.result); read.onerror=()=>reject(read.error);
      tx.oncomplete=()=>db.close();
    };
  }),table);
}
async function ready(page:Page,path='/') {
  await page.goto(path);
  await expect(page.getByText('Saved in this browser',{exact:true}).first()).toBeVisible();
}
test('real study curations share cards and their sourced notes remain readable',async({page})=>{
  await ready(page);
  await page.getByRole('button',{name:'Create a deck',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Create a deck',exact:true});
  await dialog.getByLabel('Deck name',{exact:true}).fill('Pilot study');
  await dialog.getByRole('button',{name:'Create deck',exact:true}).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('link',{name:'Library',exact:true}).click();
  await page.getByLabel('Destination deck',{exact:true}).selectOption({label:'Pilot study'});
  const implementation=page.getByRole('region',{name:'D365 Contact Center — Implementation',exact:true});
  const preparation=page.getByRole('region',{name:'AB-250 — Certification Preparation',exact:true});
  await implementation.getByRole('button',{name:'Add entire pack',exact:true}).click();
  await expect.poll(async()=>(await records(page,'copies')).length).toBe(pack.cards.filter(card=>card.kind==='recall').length);
  const original=await records(page,'copies');
  await preparation.getByRole('button',{name:'Add entire pack',exact:true}).click();
  await expect.poll(async()=>(await records(page,'copies')).length).toBe(pack.cards.length);
  const saved=await records(page,'copies');
  expect(saved.every(item=>item.packId==='contact-center-core')).toBe(true);
  for(const item of original) expect(saved.find(copy=>copy.id===item.id)).toEqual(item);
  await expect(page.getByRole('region',{name:'AB-250 — Advanced Scenarios',exact:true}).getByRole('button',{name:'All pack cards added',exact:true})).toBeDisabled();
  await page.getByRole('link',{name:'Notes',exact:true}).click();
  await page.getByRole('button',{name:/^Note filters/}).click();
  await page.getByLabel('Notes study pack').selectOption('ab250-preparation');
  await expect(page.getByRole('region',{name:'Note list',exact:true}).getByRole('button')).toHaveCount(pack.notes.length);
  await page.getByRole('button',{name:'Read note: '+pack.notes[0].title,exact:true}).click();
  const reader=page.getByRole('region',{name:'Note reader',exact:true});
  await expect(reader).toContainText(pack.notes[0].body.split(/\n\s*\n/)[0]);
  for(const id of pack.notes[0].sourceIds) {
    await expect(reader.locator('a[href="'+pack.sources.find(source=>source.id===id)!.url+'"]').first()).toBeVisible();
  }
});
