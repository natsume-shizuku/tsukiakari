import {test,expect} from '@playwright/test';
for (const theme of ['dark','light']) test('compact reviews keep long content clear of fixed controls in '+theme, async ({page})=>{
  await page.goto('/');
  await expect(page.getByText('Saved in this browser',{exact:true}).first()).toBeVisible();
  await page.getByRole('link',{name:'Settings',exact:true}).click();
  await page.getByLabel('Appearance',{exact:true}).selectOption(theme);
  await page.getByRole('link',{name:'Study',exact:true}).click();
  await page.getByRole('button',{name:'Create a deck',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Create a deck',exact:true});
  await dialog.getByLabel('Deck name',{exact:true}).fill('A long deck name for a comfortable review');
  await dialog.getByRole('button',{name:'Create deck',exact:true}).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole('link',{name:'Library',exact:true}).click();
  await page.getByLabel('Destination deck',{exact:true}).selectOption({label:'A long deck name for a comfortable review'});
  const pack=page.locator('.library-pack').filter({has:page.getByRole('heading',{name:'Foundation fixtures',exact:true})});
  await pack.getByRole('button',{name:'Add entire pack',exact:true}).click();
  await expect(pack.getByRole('button',{name:'All pack cards added',exact:true})).toBeDisabled();
  await page.getByRole('link',{name:'Study',exact:true}).click();
  await page.getByRole('button',{name:'Study A long deck name for a comfortable review',exact:true}).click();
  const options=page.getByRole('radiogroup',{name:'Answer choices'});
  if(await options.count())await options.getByRole('radio').first().click();
  await page.getByRole('button',{name:'Reveal answer',exact:true}).click();
  for(const width of [320,768,1440,1920,2560]){
    await page.setViewportSize({width,height:1000});
    const panel=page.locator('.review-panel');
    const box=(await panel.boundingBox())!;
    const main=(await page.locator('main').boundingBox())!;
    expect(box.width).toBeLessThanOrEqual(1200);
    if(width>760){expect(box.height).toBeLessThanOrEqual(740);expect(box.x+box.width/2).toBeCloseTo(main.x+main.width/2,0);}
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const content=page.locator('.review-content');
    await page.locator('.review-answer .answer').evaluate(el=>{el.textContent=Array.from({length:120},(_,i)=>'Long answer '+i+': read this explanation without moving the review actions.').join(' ');});
    const actions=page.locator('.review-actions');
    const before=(await actions.boundingBox())!;
    await content.evaluate(el=>{el.scrollTop=el.scrollHeight;});
    const after=(await actions.boundingBox())!;
    expect(after.y).toBeCloseTo(before.y,0);
    expect(await content.evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);
    const cb=(await content.boundingBox())!;
    expect(cb.y+cb.height).toBeLessThanOrEqual(after.y+1);
    for(const label of ['Again','Right','Undo last review','Suspend card'])expect((await page.getByRole('button',{name:label,exact:true}).boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await content.evaluate(el=>{el.scrollTop=0;});
    await page.screenshot({path:'test-results/phase6-review-'+theme+'-'+width+'.png',fullPage:true});
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await page.getByRole('button',{name:'Right',exact:true}).evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
});
