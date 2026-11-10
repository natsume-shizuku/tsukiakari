import { test, expect, type Page } from '@playwright/test';
import type { TestAttempt } from '../../src/domain';

test.use({ storageState: { cookies: [], origins: [] } });
const banks = [
  { id: 'ab250-original', title: 'AB-250 — Original Practice', available: 300 },
  { id: 'ab250-simulator', title: 'AB-250 — Exam Simulator', available: 128 },
];
const toolbar = (page: Page) => page.locator('.test-session-bar.test-toolbar');
const navigator = (page: Page) => page.getByRole('navigation', { name: 'Test questions', exact: true });
const tile = (page: Page, index: number) => navigator(page).locator(`.test-nav-button[data-page="${index}"]`);
const panel = (page: Page, index: number) => page.locator(`.test-question[data-index="${index}"]`);
async function start(page: Page, bank: typeof banks[number], mode: 'practice' | 'exam' = 'practice') {
  await page.goto('/#tests?bank=' + bank.id);
  await expect(page.getByText(new RegExp(bank.available + ' available questions'))).toBeVisible();
  await page.getByLabel('Test mode', { exact: true }).selectOption(mode);
  await page.getByLabel('Number of questions', { exact: true }).fill('100');
  await page.getByRole('button', { name: mode === 'practice' ? 'Start practice' : 'Start exam', exact: true }).click();
  await expect(toolbar(page)).toContainText('of 100 answered');
  await expect(toolbar(page).getByRole('heading', { name: bank.title, exact: true, level: 1 })).toBeVisible();
}
async function expectClearQuestion(page: Page, index: number) {
  await expect(panel(page, index).locator('.test-question-title')).toBeFocused();
  await expect.poll(() => page.evaluate(index => {
    const title = document.querySelector(`.test-question[data-index="${index}"] .test-question-title`)!.getBoundingClientRect();
    const bar = document.querySelector('.test-toolbar')!.getBoundingClientRect();
    const header = document.querySelector('.site-header')!;
    const headerBottom = header.hasAttribute('inert') ? 0 : header.getBoundingClientRect().bottom;
    return title.top >= Math.max(bar.bottom, headerBottom) - 1;
  }, index)).toBe(true);
}

for (const bank of banks) for (const theme of ['dark', 'light']) test(`${bank.id} combines active-test controls and keeps right navigation readable in ${theme}`, async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/#settings');
  await expect(page.getByText('Saved in this browser', { exact: true }).first()).toBeVisible();
  await page.getByLabel('Appearance', { exact: true }).selectOption(theme);
  await start(page, bank);
  await expect(page.locator('.test-attempt > .test-attempt-heading:not(.test-toolbar)')).toHaveCount(0);
  await expect(toolbar(page).getByText('Practice Mode', { exact: true })).toBeVisible();
  await expect(toolbar(page).getByRole('status')).toContainText('0 of 100 answered');
  await expect(toolbar(page).getByText('Selections save automatically', { exact: true })).toBeVisible();
  for (const name of ['Back to Tests', 'Abandon test', 'Finish test']) {
    await expect(toolbar(page).getByRole('button', { name, exact: true })).toHaveCount(1);
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(1);
  }

  for (const width of [320, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => scrollTo(0, 0));
    await expect(toolbar(page).getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const layout = await page.evaluate(() => {
      const nav = document.querySelector('.test-navigator')!, main = document.querySelector('.test-focus-main')!;
      const navBox = nav.getBoundingClientRect(), mainBox = main.getBoundingClientRect();
      return { navLeft: navBox.left, navTop: navBox.top, mainRight: mainBox.right, mainBottom: mainBox.bottom, position: getComputedStyle(nav).position };
    });
    if (width > 900) {
      expect(layout.navLeft).toBeGreaterThanOrEqual(layout.mainRight);
      expect(layout.position).toBe('sticky');
    } else {
      expect(layout.navTop).toBeGreaterThanOrEqual(layout.mainBottom);
      expect(layout.position).toBe('static');
    }
    // Desktop Menu is keyboard-only; its focused target size is covered by the navigation spec.
    const pointerControls = width > 900 ? 'button:not(.site-nav-trigger)' : 'button';
    for (const box of await toolbar(page).locator(pointerControls).evaluateAll(buttons => buttons.map(button => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })))) {
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }

  // A short desktop viewport forces the complete page grid to scroll in its own pane.
  await page.setViewportSize({ width: 1920, height: 640 });
  await page.evaluate(() => scrollTo(0, 400));
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  const pinned = await page.evaluate(() => {
    const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
    const site = box('.site-header'), bar = box('.test-toolbar'), nav = box('.test-navigator');
    const pane = document.querySelector('.test-navigator')!;
    return { siteBottom: document.querySelector('.site-header')!.hasAttribute('inert') ? 0 : site.bottom, barTop: bar.top, barBottom: bar.bottom, navTop: nav.top, navBottom: nav.bottom,
      scrollable: pane.scrollHeight > pane.clientHeight, overflow: getComputedStyle(pane).overflowY, viewport: innerHeight };
  });
  expect(pinned.barTop).toBeGreaterThanOrEqual(pinned.siteBottom - 1);
  expect(pinned.navTop).toBeGreaterThanOrEqual(pinned.barBottom - 1);
  expect(pinned.navBottom).toBeLessThanOrEqual(pinned.viewport + 1);
  expect(pinned.scrollable).toBe(true);
  expect(pinned.overflow).toBe('auto');
  const before = await page.evaluate(() => ({ scroll: scrollY, toolbarTop: document.querySelector('.test-toolbar')!.getBoundingClientRect().top }));
  await navigator(page).evaluate(element => { element.scrollTop = element.scrollHeight; });
  expect(await navigator(page).evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY)).toBe(before.scroll);
  expect((await toolbar(page).boundingBox())!.y).toBeCloseTo(before.toolbarTop, 0);
  await tile(page, 1).focus();
  await page.keyboard.press('Enter');
  await expectClearQuestion(page, 5);
  await expect(tile(page, 1)).toHaveAttribute('aria-current', 'page');
  await navigator(page).getByRole('button', { name: 'Next unanswered', exact: true }).click();
  await expectClearQuestion(page, 6);
  await page.screenshot({ path: `test-results/test-toolbar-${bank.id}-${theme}-desktop.png` });

  await page.setViewportSize({ width: 320, height: 900 });
  await tile(page, 2).click();
  await expectClearQuestion(page, 10);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(toolbar(page).getByRole('button', { name: 'Finish test', exact: true })).toBeInViewport();
  await page.screenshot({ path: `test-results/test-toolbar-${bank.id}-${theme}-mobile.png` });
});

for (const bank of banks) test(`${bank.id} keeps the exam timer with its combined toolbar actions on narrow and wide screens`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await start(page, bank, 'exam');
  for (const width of [320, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(toolbar(page).getByText('Exam Mode', { exact: true })).toBeVisible();
    await expect(toolbar(page).getByLabel('Time remaining', { exact: true })).toBeVisible();
    for (const name of ['Back to Tests', 'Abandon test', 'Finish test']) await expect(toolbar(page).getByRole('button', { name, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  await expect(page.getByRole('button', { name: 'Reveal answer', exact: true })).toHaveCount(0);
  await tile(page, 1).click();
  await expectClearQuestion(page, 5);
});


test('a real simulator case keeps exhibits, tabs and navigation inside the space below its toolbar', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 640 });
  await start(page, banks[1]);
  const attempt = await page.evaluate(() => new Promise<TestAttempt>((resolve, reject) => {
    const request = indexedDB.open('tsukiakari');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, transaction = db.transaction('testAttempts');
      const read = transaction.objectStore('testAttempts').getAll();
      read.onsuccess = () => resolve(read.result.find((item: TestAttempt) => item.completedAt === null));
      read.onerror = () => reject(read.error);
      transaction.oncomplete = () => db.close();
    };
  }));
  const group = attempt.groups!.filter(item => item.kind === 'case-study')
    .sort((a, b) => Math.max(...b.exhibits.map(exhibit => exhibit.body.length)) - Math.max(...a.exhibits.map(exhibit => exhibit.body.length)))[0];
  let casePage = 0, questionIndex = 0;
  for (const section of attempt.delivery!.sections) {
    if (section.groupId === group.id) break;
    casePage += Math.ceil(section.cardIds.length / (section.kind === 'series' ? 1 : 5));
    questionIndex += section.cardIds.length;
  }
  await tile(page, casePage).click();
  await expectClearQuestion(page, questionIndex);
  const pane = page.locator('.case-pane'), tabs = pane.getByRole('tab');
  await expect(pane.getByRole('heading', { name: group.title, exact: true })).toBeVisible();
  await expect(tabs).toHaveCount(group.exhibits.length);
  const longest = group.exhibits.reduce((best, item, index) => item.body.length > group.exhibits[best].body.length ? index : best, 0);
  await tabs.nth(longest).focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth((longest + 1) % group.exhibits.length)).toHaveAttribute('aria-selected', 'true');
  await tabs.nth(longest).click();
  await page.evaluate(() => scrollBy(0, 160));
  const fit = await page.evaluate(() => {
    const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
    const bar = box('.test-toolbar'), pane = box('.case-pane'), panel = box('.case-panel'), nav = box('.test-navigator');
    return { barBottom: bar.bottom, paneTop: pane.top, paneBottom: pane.bottom, panelBottom: panel.bottom, navTop: nav.top, navBottom: nav.bottom, viewport: innerHeight };
  });
  expect(fit.paneTop).toBeGreaterThanOrEqual(fit.barBottom - 1);
  expect(fit.navTop).toBeGreaterThanOrEqual(fit.barBottom - 1);
  expect(fit.paneBottom).toBeLessThanOrEqual(fit.viewport + 1);
  expect(fit.panelBottom).toBeLessThanOrEqual(fit.viewport + 1);
  expect(fit.navBottom).toBeLessThanOrEqual(fit.viewport + 1);
  for (const tab of await tabs.all()) await expect(tab).toBeInViewport({ ratio: 1 });
  const body = pane.getByRole('tabpanel');
  expect(await body.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  const before = { window: await page.evaluate(() => scrollY), tabsY: (await pane.getByRole('tablist').boundingBox())!.y };
  await body.evaluate(element => { element.scrollTop = element.scrollHeight; });
  expect(await body.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY)).toBe(before.window);
  expect((await pane.getByRole('tablist').boundingBox())!.y).toBeCloseTo(before.tabsY, 0);
  await page.screenshot({ path: 'test-results/test-toolbar-real-case-desktop.png' });
});
