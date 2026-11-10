import { test, expect, type Page } from '@playwright/test';
async function ready(page: Page, theme: string) {
  await page.goto('/');
  await expect(page.getByText('Saved in this browser', {exact:true}).first()).toBeVisible();
  await page.getByRole('link', {name:'Settings',exact:true}).click();
  await page.getByLabel('Appearance').selectOption(theme);
  await page.getByRole('link', {name:'Library',exact:true}).click();
  await page.getByRole('link', {name:'Card browser',exact:true}).click();
  if (await page.getByRole('button',{name:'Dismiss confirmation'}).isVisible()) await page.getByRole('button',{name:'Dismiss confirmation'}).click();
}
for (const theme of ['dark','light']) {
  test(`reader layout uses available width and independent scroll in ${theme}`, async ({page}) => {
    await ready(page,theme);
    await page.getByRole('button',{name:'Select card: Fixture: Which description defines a square?',exact:true}).click();
    const list=page.getByRole('region',{name:'Card list',exact:true});
    const inspector=page.getByRole('region',{name:'Card details',exact:true});
    const toolbar=page.getByRole('region',{name:'Card selection controls',exact:true});
    let previousDesktop: { content: number; inspector: number } | undefined;
    for (const width of [320,768,1024,1440,1920,2560]) {
      await page.setViewportSize({width,height:1000});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      expect(await page.evaluate(()=>document.documentElement.scrollHeight<=Math.max(innerHeight,document.body.scrollHeight)+1)).toBe(true);
      const [l,r,t]=await Promise.all([list.boundingBox(),inspector.boundingBox(),toolbar.boundingBox()]);
      expect(r!.width).toBeLessThanOrEqual(width);
      if(width>=900){
        expect(l!.width).toBeGreaterThanOrEqual(300);
        expect(l!.width).toBeLessThanOrEqual(560);
        expect(l!.width).toBeCloseTo(Math.min(560, Math.max(300, (l!.width+r!.width+16)*.32)),0);
        expect(r!.x-l!.x-l!.width).toBeCloseTo(16,0);
        const frame=await page.locator('main').evaluate(el=>{
          const box=el.getBoundingClientRect(),style=getComputedStyle(el);
          return { left:box.left,right:box.right,width:box.width,paddingLeft:parseFloat(style.paddingLeft),paddingRight:parseFloat(style.paddingRight),viewport:document.documentElement.clientWidth };
        });
        const contentWidth=frame.width-frame.paddingLeft-frame.paddingRight;
        expect(frame.width).toBeCloseTo(Math.min(frame.viewport,1288),0);
        expect(Math.abs(frame.left-(frame.viewport-frame.right))).toBeLessThanOrEqual(1);
        expect(contentWidth).toBeLessThanOrEqual(1240);
        expect(l!.x).toBeCloseTo(frame.left+frame.paddingLeft,0);
        expect(frame.right-(r!.x+r!.width)).toBeCloseTo(frame.paddingRight,0);
        expect(l!.width+r!.width+16).toBeCloseTo(contentWidth,0);
        if(previousDesktop){
          if(contentWidth>previousDesktop.content+1) expect(r!.width).toBeGreaterThan(previousDesktop.inspector);
          else expect(r!.width).toBeCloseTo(previousDesktop.inspector,0);
        }
        previousDesktop={content:contentWidth,inspector:r!.width};
        expect(r!.height).toBeLessThanOrEqual(800);
        const footer=(await page.locator('.page-footer').boundingBox())!;
        expect(footer.y).toBeGreaterThanOrEqual(r!.y+r!.height);
        expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBeGreaterThan(1000);
        expect(r!.y).toBeGreaterThanOrEqual(t!.y+t!.height);
        expect(await inspector.evaluate(el=>el.scrollHeight<=el.clientHeight)).toBe(true);
      }
      await inspector.getByRole('tab',{name:'Answer',exact:true}).click();
      const panel=inspector.getByRole('tabpanel',{name:'Answer',exact:true});
      // Stress the actual prose styles without modifying catalog or learner records.
      await panel.locator('.library-prose').first().evaluate(el=>{el.textContent=Array.from({length:80},(_,i)=>`Long answer paragraph ${i+1}: this explanation must scroll inside the answer panel without moving its navigation.`).join('\n\n');});
      const tabs=inspector.getByRole('tablist');
      const before=await tabs.boundingBox();
      await panel.evaluate(el=>{el.scrollTop=el.scrollHeight;});
      expect((await tabs.boundingBox())!.y).toBeCloseTo(before!.y,0);
      expect(await panel.evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);
      await panel.evaluate(el=>{el.scrollTop=0;});
      await page.screenshot({path:`test-results/readers-${theme}-${width}.png`,fullPage:width<900});
    }
    await inspector.getByRole('button',{name:'Close details',exact:true}).click();
    await page.getByLabel('Search cards',{exact:true}).fill('no matching card anywhere');
    await expect(list).toContainText('No cards match these filters.');
    await expect(page.getByRole('region',{name:'Selection summary'})).toContainText('Select a card to read');
    await page.evaluate(()=>scrollTo(0,0));
    const headingStyle=await page.locator('.page-header').evaluate(el=>({size:getComputedStyle(el.querySelector('h1')!).fontSize,height:el.getBoundingClientRect().height,top:el.getBoundingClientRect().top}));
    for (const section of ['Study packs','Notes','Mistakes']) {
      await page.getByRole('link',{name:section,exact:true}).click();
      const bounds=(await page.locator('.library-page').boundingBox())!;
      const frame=await page.locator('main').evaluate(el=>{
        const box=el.getBoundingClientRect(),style=getComputedStyle(el);
        return { left:box.left,right:box.right,width:box.width,paddingLeft:parseFloat(style.paddingLeft),paddingRight:parseFloat(style.paddingRight),viewport:document.documentElement.clientWidth };
      });
      expect(frame.width).toBeCloseTo(1288,0);
      expect(Math.abs(frame.left-(frame.viewport-frame.right))).toBeLessThanOrEqual(1);
      expect(bounds.x).toBeCloseTo(frame.left+frame.paddingLeft,0);
      expect(frame.right-bounds.x-bounds.width).toBeCloseTo(frame.paddingRight,0);
      expect(bounds.width).toBeCloseTo(1240,0);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      expect(await page.locator('.page-header').evaluate(el=>({size:getComputedStyle(el.querySelector('h1')!).fontSize,height:el.getBoundingClientRect().height,top:el.getBoundingClientRect().top}))).toEqual(headingStyle);
    }
  });
}

test('mobile Manage returns to its list with selection and scroll intact',async({page})=>{
  await page.setViewportSize({width:320,height:900});
  await page.goto('/');
  await page.getByRole('button',{name:'Create a deck',exact:true}).click();
  const create=page.getByRole('dialog',{name:'Create a deck'});
  await create.getByLabel('Deck name',{exact:true}).fill('Mobile manager');
  await create.getByRole('button',{name:'Create deck',exact:true}).click();
  await page.getByRole('link',{name:'Library',exact:true}).click();
  await page.locator('.library-pack').filter({has:page.getByRole('heading',{name:'Collection fixtures',exact:true})}).getByRole('button',{name:'Add entire pack',exact:true}).click();
  await page.getByRole('link',{name:'Study',exact:true}).click();
  await page.getByRole('link',{name:'Manage Mobile manager',exact:true}).click();
  const modal=page.getByRole('dialog',{name:'Manage Mobile manager',exact:true});
  await expect(modal.getByRole('link',{name:'Add cards',exact:true})).toHaveCount(0);
  await expect(modal.getByRole('button',{name:/^Study /})).toHaveCount(0);
  await modal.getByRole('tab',{name:'Cards',exact:true}).click();
  const list=modal.getByRole('region',{name:'Deck card list',exact:true});
  const rows=list.getByRole('button',{name:/^Select card:/});
  await rows.nth(50).scrollIntoViewIfNeeded();
  const pos=await list.evaluate(el=>el.scrollTop);
  await rows.nth(50).click();
  await expect(list).not.toBeVisible();
  const detail=modal.getByRole('region',{name:'Card details',exact:true});
  await expect(detail).toBeVisible();
  await expect(detail.getByRole('button',{name:'Back to cards',exact:true})).toBeFocused();
  expect(await modal.evaluate(el=>el.scrollHeight<=el.clientHeight)).toBe(true);
  await detail.getByRole('button',{name:'Back to cards',exact:true}).click();
  await expect(rows.nth(50)).toBeFocused();
  expect(await list.evaluate(el=>el.scrollTop)).toBeCloseTo(pos,0);
  await rows.nth(51).click({modifiers:['Control']});
  await expect(list.locator('[aria-pressed="true"]')).toHaveCount(2);
  await expect(modal.getByRole('button',{name:'Remove selected cards',exact:true})).toBeEnabled();
});
