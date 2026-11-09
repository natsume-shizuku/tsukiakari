import { sel } from '../support/selection';
import {test,expect,type Page} from '@playwright/test';
import type {TestAttempt} from '../../src/domain';
async function rows<T=unknown>(page:Page,table:string):Promise<T[]>{return page.evaluate(name=>new Promise<T[]>((resolve,reject)=>{const r=indexedDB.open('tsukiakari');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction(name),q=tx.objectStore(name).getAll();q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);tx.oncomplete=()=>db.close();};}),table);}
async function active(page:Page){return(await rows<TestAttempt>(page,'testAttempts')).find(a=>a.completedAt===null)!;}
async function ready(page:Page){await page.goto('/#tests?bank=ab250-original');await expect(page.getByText('Saved in this browser',{exact:true}).first()).toBeVisible();await expect(page.getByText(/300 available questions/)).toBeVisible();}
async function saved(page:Page,id:string,ids:string[]){await expect.poll(async()=>(await active(page)).responses.find(r=>r.cardId===id)!.selectedOptionIds.slice().sort()).toEqual(ids.slice().sort());}
async function openQuestion(page:Page,index:number){const button=page.locator(`.test-nav-button[data-page="${Math.floor(index / 5)}"]`);if(!await button.getAttribute('aria-current'))await button.click();return page.locator(`.test-question[data-index="${index}"]`);}
async function choose(page:Page,index:number,id:string){await (await openQuestion(page,index)).locator('input[value="'+id+'"]').check();}

test('real bank download failure is non-destructive and retry unlocks full practice',async({page})=>{
 let fail=true;await page.route(/ab250-bank.*\.json(?:\?.*)?$/,route=>{if(fail){fail=false;return route.abort();}return route.continue();});
 await page.goto('/#tests?bank=ab250-original');
 await expect(page.getByRole('button',{name:'Retry loading question bank',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Start practice',exact:true})).toBeDisabled();
 expect(await rows(page,'testAttempts')).toEqual([]);expect(await rows(page,'testExposures')).toEqual([]);
 await page.getByRole('button',{name:'Retry loading question bank',exact:true}).click();
 await expect(page.getByText(/300 available questions/)).toBeVisible();
 await expect(page.getByRole('button',{name:'Start practice',exact:true})).toBeEnabled();
 await expect(page.getByRole('button',{name:'Preview pilot questions',exact:true})).toHaveCount(0);
 expect(await rows(page,'testAttempts')).toEqual([]);
});

test('real practice offers small domains, never reduces a typed count and starts a sourced domain selection',async({page})=>{
 await ready(page);const domain=page.getByLabel('Practice domain',{exact:true});await page.getByLabel('Number of questions',{exact:true}).fill('100');
 for(const [id,size] of [['agents-ai','36'],['work-distribution','36'],['analytics','30']]){await domain.selectOption(id);await expect(page.getByLabel('Number of questions',{exact:true})).toHaveValue(size);await expect(page.getByRole('button',{name:'Start practice',exact:true})).toBeEnabled();}
 await domain.selectOption('deployment');await expect(page.getByText(/51 available questions/)).toBeVisible();
 await page.getByLabel('Number of questions',{exact:true}).fill('52');await page.getByRole('button',{name:'Start practice',exact:true}).click();await expect(page.getByRole('alert')).toContainText('never reduced automatically');
 await page.getByLabel('Number of questions',{exact:true}).fill('0');await page.getByRole('button',{name:'Start practice',exact:true}).click();await expect(page.getByRole('alert')).toContainText('1 to 51');
 expect(await rows(page,'testAttempts')).toEqual([]);
 await page.getByLabel('Number of questions',{exact:true}).fill('50');await page.getByRole('button',{name:'Start practice',exact:true}).click();await expect(page.locator('.test-session-bar')).toContainText(`of ${50} answered`);
 const attempt=await active(page);expect(attempt.fixture).toBe(false);expect(attempt.questions.every(q=>q.card.domainId==='deployment'&&q.sources.length&&q.card.relatedNotes.length)).toBe(true);
 const first=attempt.questions[0];await choose(page,0,sel(first.card).correctOptionIds[0]);await saved(page,first.card.id,[sel(first.card).correctOptionIds[0]]);
 await page.locator('.test-question').first().getByRole('button',{name:'Reveal answer',exact:true}).click();
 for(const s of first.sources)await expect(page.locator('.test-question').first().locator('a[href="'+s.url+'"]').first()).toBeVisible();
 expect(await rows(page,'reviewLogs')).toEqual([]);expect(await rows(page,'schedulerStates')).toEqual([]);
});

test('real timed exam uses six quotas, keeps answers hidden, reviews and retries saved snapshots',async({page})=>{
 await ready(page);await page.getByLabel('Test mode',{exact:true}).selectOption('exam');await expect(page.getByLabel('Time limit (minutes)',{exact:true})).toHaveValue('120');
 await page.getByRole('button',{name:'Start exam',exact:true}).click();await expect(page.locator('.test-session-bar')).toContainText(`of ${100} answered`);
 const attempt=await active(page);expect(attempt.bankVersion).toBe('1.0.0');
 expect(['deployment','channels','agents-ai','work-distribution','representative-experience','analytics'].map(id=>attempt.questions.filter(q=>q.card.domainId===id).length)).toEqual([17,32,12,12,17,10]);
 await expect(page.getByRole('button',{name:'Reveal answer',exact:true})).toHaveCount(0);await expect(page.locator('.test-answer')).toHaveCount(0);
 const single=attempt.questions.findIndex(q=>q.card.kind==='single');await choose(page,single,sel(attempt.questions[single].card).correctOptionIds[0]);await saved(page,attempt.questions[single].card.id,sel(attempt.questions[single].card).correctOptionIds);
 page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Finish test',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Test results',exact:true});await expect(dialog).toContainText('1/100 (1%)');await expect(page.locator('.test-question')).toHaveCount(0);
 await dialog.getByRole('button',{name:'Review exam',exact:true}).click();await expect(page.locator('.test-question')).toHaveCount(100);await expect(page.locator('.test-answer')).toHaveCount(100);
 await page.getByRole('button',{name:'Retry same questions',exact:true}).click();
 const retry=await active(page);expect(retry.retryOf).toBe(attempt.id);expect(retry.questions).toEqual(attempt.questions);expect(retry.responses.every(r=>!r.revealed&&!r.selectedOptionIds.length)).toBe(true);
 expect(await rows(page,'reviewLogs')).toEqual([]);expect(await rows(page,'copies')).toEqual([]);
});

for(const theme of ['dark','light'])test('real long answers, multiple-choice explanations and source links fit all widths in '+theme,async({page})=>{
 test.setTimeout(60000);await page.goto('/#settings');await expect(page.getByText('Saved in this browser',{exact:true}).first()).toBeVisible();await page.getByLabel('Appearance',{exact:true}).selectOption(theme);await ready(page);
 await page.getByLabel('Number of questions',{exact:true}).fill('50');await page.getByRole('button',{name:'Start practice',exact:true}).click();await expect(page.locator('.test-session-bar')).toContainText(`of ${50} answered`);
 const attempt=await active(page),index=attempt.questions.findIndex(q=>q.card.kind==='multiple');expect(index).toBeGreaterThanOrEqual(0);const card=attempt.questions[index].card,panel=await openQuestion(page,index);
 const input=panel.locator('input[value="'+sel(card).correctOptionIds[0]+'"]');await input.focus();await page.keyboard.press('Space');await saved(page,card.id,[sel(card).correctOptionIds[0]]);
 for(const id of sel(card).correctOptionIds.slice(1)){await choose(page,index,id);await saved(page,card.id,sel(card).correctOptionIds.slice(0,sel(card).correctOptionIds.indexOf(id)+1));}
 await panel.getByRole('button',{name:'Reveal answer',exact:true}).click();await expect(panel.getByText('Correct · Response locked after reveal',{exact:true})).toBeVisible();
 await expect(panel.getByRole('heading',{name:'Why these choices?',exact:true})).toBeVisible();
 for(const width of [320,768,1440,1920,2560]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await panel.scrollIntoViewIfNeeded();const clipped=await panel.evaluate(el=>[...el.querySelectorAll('p,h2,dd,dt,a')].some(item=>item.scrollWidth>item.clientWidth+1));expect(clipped).toBe(false);await page.screenshot({path:'test-results/phase7e-'+theme+'-'+width+'.png'});}
 await page.reload();await expect(panel.getByRole('checkbox',{checked:true})).toHaveCount(sel(card).correctOptionIds.length);await expect(panel.getByRole('checkbox').first()).toBeDisabled();
});

test('a small real domain starts, survives a reload and returns exams to their floor',async({page})=>{
 await ready(page);const count=page.getByLabel('Number of questions',{exact:true});
 await count.fill('100');await page.getByLabel('Practice domain',{exact:true}).selectOption('analytics');await expect(count).toHaveValue('30');
 await page.getByLabel('Test mode',{exact:true}).selectOption('exam');await expect(count).toHaveValue('100');
 await count.fill('49');await page.getByRole('button',{name:'Start exam',exact:true}).click();await expect(page.getByRole('alert')).toContainText('50 to 300');
 await page.getByLabel('Test mode',{exact:true}).selectOption('practice');await expect(count).toHaveValue('20');await count.fill('30');
 await page.getByRole('button',{name:'Start practice',exact:true}).click();await expect(page.locator('.test-session-bar')).toContainText(`of ${30} answered`);
 await page.reload();await expect(page.locator('.test-session-bar')).toContainText(`of ${30} answered`);
 const attempt=await active(page);expect(attempt.questions.every(q=>q.card.domainId==='analytics')).toBe(true);
});
