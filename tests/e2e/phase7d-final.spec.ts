import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import type {StudyPack} from '../../src/domain';
const pack=JSON.parse(readFileSync('src/content/published/study-pack.json','utf8')) as StudyPack;
const manifest=JSON.parse(readFileSync('src/content/batches/manifest.json','utf8')) as {batches:{id:string;noteIds:string[];cardIds:string[]}[]};
async function ready(page:Page){await page.goto('/');await expect(page.getByText('Saved in this browser',{exact:true}).first()).toBeVisible();}
for(const spec of manifest.batches.filter(spec=>spec.id.startsWith('7d-final-'))){
const note=pack.notes.find(note=>note.id===spec.noteIds[0])!;
const scenario=pack.cards.find(card=>spec.cardIds.includes(card.id)&&card.kind==='mcq')!;
for(const theme of ['dark','light'])test(spec.id+' notes and application cards remain readable in '+theme,async({page})=>{
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
    await page.screenshot({path:'test-results/'+spec.id+'-note-'+theme+'-'+width+'.png',fullPage:true});
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
    await page.screenshot({path:'test-results/'+spec.id+'-card-'+theme+'-'+width+'.png'});
  }
});
}
