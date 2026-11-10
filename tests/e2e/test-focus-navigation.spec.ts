import { test, expect, type Page } from '@playwright/test';
import type { TestAttempt } from '../../src/domain';

test.use({ storageState: { cookies: [], origins: [] } });
const banks = [
  { id: 'ab250-original', available: 300 },
  { id: 'ab250-simulator', available: 128 },
];
const header = (page: Page) => page.locator('.site-header');
const trigger = (page: Page) => page.getByRole('button', { name: 'Site navigation', exact: true });
const toolbar = (page: Page) => page.locator('.test-toolbar');
async function start(page: Page, bank = banks[0], mode: 'practice' | 'exam' = 'practice') {
  await page.mouse.move(200, 500);
  await page.goto('/#tests?bank=' + bank.id);
  await expect(page.getByText(new RegExp(bank.available + ' available questions'))).toBeVisible();
  await expect(header(page)).toBeVisible();
  await page.getByLabel('Test mode', { exact: true }).selectOption(mode);
  await page.getByLabel('Number of questions', { exact: true }).fill('100');
  await page.getByRole('button', { name: mode === 'exam' ? 'Start exam' : 'Start practice', exact: true }).click();
  await expect(toolbar(page)).toContainText('of 100 answered');
  await closed(page);
}
async function closed(page: Page) {
  await expect(page.locator('.app-shell')).toHaveClass(/is-test-focused/);
  await expect(header(page)).toBeHidden();
  await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(() => header(page).evaluate(element => (element as HTMLElement).inert)).toBe(true);
  await expect(page.getByRole('navigation', { name: 'Main navigation', exact: true })).toHaveCount(0);
  await expect.poll(() => page.locator('.app-shell').evaluate(element => parseFloat(getComputedStyle(element).getPropertyValue('--site-header-height')))).toBe(0);
}
async function settledHeader(page: Page) {
  await header(page).evaluate(async element => {
    await Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => undefined)));
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}
async function open(page: Page) {
  await trigger(page).focus();
  await page.keyboard.press('Enter');
  await expect(header(page)).toBeVisible();
  await expect(header(page)).toHaveClass(/is-revealed/);
  await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() => header(page).evaluate(element => (element as HTMLElement).inert)).toBe(false);
  await settledHeader(page);
}
async function geometry(page: Page) {
  return page.evaluate(() => ({
    scroll: scrollY,
    question: document.querySelector('.test-question')!.getBoundingClientRect().top,
    toolbar: document.querySelector('.test-toolbar')!.getBoundingClientRect().top,
  }));
}

async function expectControlsClear(page: Page, desktop = false) {
  await expect.poll(async () => {
    const banner = (await header(page).boundingBox())!, bar = (await toolbar(page).boundingBox())!;
    return bar.y >= banner.y + banner.height - 1;
  }).toBe(true);
  for (const name of ['Back to Tests', 'Finish test']) {
    const button = toolbar(page).getByRole('button', { name, exact: true });
    await expect(button).toBeInViewport({ ratio: 1 });
    expect(await button.evaluate(element => {
      const box = element.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return hit !== null && element.contains(hit);
    })).toBe(true);
  }
  if (desktop) {
    const nav = (await page.getByRole('navigation', { name: 'Test questions', exact: true }).boundingBox())!;
    const bar = (await toolbar(page).boundingBox())!;
    expect(nav.y).toBeGreaterThanOrEqual(bar.y + bar.height - 1);
  }
}
async function expectPushed(page: Page, before: Awaited<ReturnType<typeof geometry>>) {
  await settledHeader(page);
  await expect.poll(async () => {
    const after = await geometry(page), banner = (await header(page).boundingBox())!;
    return Math.max(Math.abs(after.question - before.question - banner.height), Math.abs(after.toolbar - before.toolbar - banner.height));
  }).toBeLessThanOrEqual(1);
  expect((await geometry(page)).scroll).toBe(before.scroll);
  await expect.poll(async () => {
    const height = (await header(page).boundingBox())!.height;
    const reserved = await page.locator('.app-shell').evaluate(element => parseFloat(getComputedStyle(element).getPropertyValue('--site-header-height')));
    return Math.abs(reserved - height);
  }).toBeLessThanOrEqual(1);
  await expectControlsClear(page, page.viewportSize()!.width > 900);
}
async function expectRestored(page: Page, before: Awaited<ReturnType<typeof geometry>>) {
  await expect.poll(async () => {
    const after = await geometry(page);
    return Math.max(Math.abs(after.question - before.question), Math.abs(after.toolbar - before.toolbar), Math.abs(after.scroll - before.scroll));
  }).toBeLessThanOrEqual(1);
}

for (const bank of banks) for (const mode of ['practice', 'exam'] as const) for (const theme of ['dark', 'light']) {
  test(`${bank.id} ${mode} recovers header space and pushes content below revealed navigation in ${theme}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/#settings');
    await page.getByLabel('Appearance', { exact: true }).selectOption(theme);
    await start(page, bank, mode);
    for (const width of [320, 390, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 640 });
      await page.mouse.move(width - 2, 638);
      await closed(page);
      await trigger(page).evaluate(element => (element as HTMLElement).blur());
      const control = (await trigger(page).boundingBox())!;
      if (width <= 900) {
        expect(control.width).toBeGreaterThanOrEqual(44);
        expect(control.height).toBeGreaterThanOrEqual(44);
      } else {
        expect(control.width).toBeLessThanOrEqual(1);
        expect(control.height).toBeLessThanOrEqual(1);
        await expect(trigger(page)).toHaveCSS('position', 'absolute');
        await expect(trigger(page)).toHaveCSS('clip-path', 'inset(50%)');
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      await expect(toolbar(page).getByRole('button', { name: 'Finish test', exact: true })).toBeInViewport();
      await expect(toolbar(page).getByRole('status')).toContainText('of 100 answered');
      await expect(toolbar(page).getByText('Selections save automatically', { exact: true })).toBeVisible();
      if (mode === 'exam') await expect(toolbar(page).getByLabel('Time remaining', { exact: true })).toBeVisible();
      const before = await geometry(page);
      await open(page);
      await expectPushed(page, before);
      const close = header(page).getByRole('button', { name: 'Close site navigation', exact: true });
      if (width <= 900) await expect(close).toBeVisible();
      else await expect(close).toBeHidden();
      for (const name of ['Study', 'Library', 'Tests', 'Statistics', 'Settings']) {
        await expect(header(page).getByRole('link', { name, exact: true })).toBeInViewport({ ratio: 1 });
      }
      await page.keyboard.press('Escape');
      await closed(page);
      await expectRestored(page, before);
      await expect(trigger(page)).toBeFocused();
      await page.mouse.move(width - 2, 638);
      if (bank.id === 'ab250-simulator' && mode === 'practice' && width === 320) await page.screenshot({ path: `test-results/test-focus-${theme}-mobile.png` });
    }
    await page.setViewportSize({ width: 1920, height: 640 });
    await page.evaluate(() => scrollTo(0, 400));
    await expect.poll(() => toolbar(page).evaluate(element => Math.round(element.getBoundingClientRect().top))).toBe(0);
    const pinnedBefore = await geometry(page);
    await open(page);
    await expectControlsClear(page, true);
    const expandedNav = (await page.getByRole('navigation', { name: 'Test questions', exact: true }).boundingBox())!;
    expect(expandedNav.y + expandedNav.height).toBeLessThanOrEqual(641);
    await expect(header(page).getByRole('link', { name: 'Tests', exact: true })).toBeInViewport({ ratio: 1 });
    if (bank.id === 'ab250-simulator' && mode === 'practice') await page.screenshot({ path: `test-results/test-focus-${theme}-expanded-desktop.png` });
    await page.keyboard.press('Escape');
    await closed(page);
    await expectRestored(page, pinnedBefore);
    await expect.poll(() => toolbar(page).evaluate(element => Math.round(element.getBoundingClientRect().top))).toBe(0);
    const nav = page.getByRole('navigation', { name: 'Test questions', exact: true });
    const navBox = (await nav.boundingBox())!, barBox = (await toolbar(page).boundingBox())!;
    expect(navBox.y).toBeGreaterThanOrEqual(barBox.y + barBox.height);
    expect(navBox.y + navBox.height).toBeLessThanOrEqual(641);
    await nav.locator('.test-nav-button[data-page="1"]').click();
    const title = page.locator('.test-question[data-index="5"] .test-question-title');
    await expect(title).toBeFocused();
    await expect.poll(async () => (await title.boundingBox())!.y >= ((await toolbar(page).boundingBox())!.y + (await toolbar(page).boundingBox())!.height)).toBe(true);
    if (bank.id === 'ab250-simulator' && mode === 'practice') await page.screenshot({ path: `test-results/test-focus-${theme}-desktop.png` });
  });
}

test('desktop edge hover reveals navigation and leaving closes it unless keyboard focus remains inside', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await start(page);
  const before = await geometry(page);
  await page.locator('.site-nav-edge').hover();
  await expect(header(page)).toBeVisible();
  await expectPushed(page, before);
  await header(page).getByRole('link', { name: 'Library', exact: true }).hover();
  await expect(header(page)).toBeVisible();
  await page.mouse.move(1278, 718);
  await closed(page);
  await page.locator('.site-nav-edge').hover();
  await expect(header(page)).toBeVisible();
  await header(page).getByRole('link', { name: 'Study', exact: true }).focus();
  await page.mouse.move(1278, 718);
  await page.waitForTimeout(300);
  await expect(header(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await closed(page);
});

test('desktop navigation uses the top edge without reserving toolbar space for Menu', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await start(page, banks[1]);
  const attemptUrl = page.url(), before = await geometry(page);
  await expect(trigger(page)).toHaveCSS('clip-path', 'inset(50%)');
  const title = page.locator('.test-toolbar-title');
  const text = title.locator(':scope > div');
  expect(Math.abs((await text.boundingBox())!.x - (await title.boundingBox())!.x)).toBeLessThanOrEqual(1);
  await page.locator('.site-nav-edge').hover();
  await expect(header(page)).toBeVisible();
  await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(page).toHaveURL(attemptUrl);
  await expectPushed(page, before);
  await expect(toolbar(page)).toContainText('of 100 answered');
  await expect(header(page).getByRole('button', { name: 'Close site navigation', exact: true })).toBeHidden();
  await toolbar(page).getByRole('status').click();
  await closed(page);
  await expectRestored(page, before);
  await page.waitForTimeout(350);
  await closed(page);
  await expect(page).toHaveURL(attemptUrl);
});

test('clicking an answer with navigation open saves that selection before collapsing the header', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await start(page, banks[0]);
  const attemptUrl = page.url();
  await open(page);
  const choice = page.locator('.test-question').first().locator('input').first();
  const optionId = (await choice.getAttribute('value'))!;
  const cardId = (await choice.getAttribute('name'))!.slice('test-question-'.length);
  await expect(choice).not.toBeChecked();
  await choice.check();
  await expect(choice).toBeChecked();
  await closed(page);
  await expect(page).toHaveURL(attemptUrl);
  await expect.poll(() => page.evaluate(({ cardId, optionId }) => new Promise<boolean>((resolve, reject) => {
    const request = indexedDB.open('tsukiakari');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, transaction = db.transaction('testAttempts');
      const read = transaction.objectStore('testAttempts').getAll();
      read.onerror = () => reject(read.error);
      read.onsuccess = () => {
        const attempt = (read.result as TestAttempt[]).find(item => item.completedAt === null);
        resolve(attempt?.responses.find(response => response.cardId === cardId)?.selectedOptionIds.includes(optionId) ?? false);
      };
      transaction.oncomplete = () => db.close();
    };
  }), { cardId, optionId })).toBe(true);
  await expect(choice).toBeChecked();
});

test('Escape dismisses a hover-opened menu until the pointer leaves and returns', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await start(page);
  const attemptUrl = page.url();
  await page.locator('.site-nav-edge').hover();
  await expect(header(page)).toBeVisible();
  // Keep the pointer stationary over the top edge while Escape dismisses navigation.
  await page.keyboard.press('Escape');
  await closed(page);
  await expect(trigger(page)).toBeFocused();
  await page.waitForTimeout(350);
  await closed(page);
  await expect(page).toHaveURL(attemptUrl);
  await page.mouse.move(1278, 718);
  await page.locator('.site-nav-edge').hover();
  await expect(header(page)).toBeVisible();
  await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(page).toHaveURL(attemptUrl);
});

test('keyboard reaches the desktop-only focus control and restores it after Escape', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await start(page, banks[1]);
  await expect(trigger(page)).toHaveCSS('clip-path', 'inset(50%)');
  await page.getByRole('link', { name: 'Skip to content', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(trigger(page)).toBeFocused();
  await expect(trigger(page)).toHaveCSS('clip-path', 'none');
  await expect(trigger(page)).toBeInViewport({ ratio: 1 });
  const control = (await trigger(page).boundingBox())!;
  expect(control.width).toBeGreaterThanOrEqual(44);
  expect(control.height).toBeGreaterThanOrEqual(44);
  await page.keyboard.press('Enter');
  await expect(header(page)).toBeVisible();
  await expect(header(page).getByRole('link', { name: 'Study', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(header(page).getByRole('link', { name: 'Library', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await closed(page);
  await expect(trigger(page)).toBeFocused();
  await page.keyboard.press('Space');
  await expect(header(page)).toBeVisible();
  await header(page).getByRole('link', { name: 'Statistics', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Statistics', exact: true, level: 1 })).toBeVisible();
  await expect(header(page)).toBeVisible();
  await expect(page.locator('.app-shell')).not.toHaveClass(/is-test-focused/);
  await expect(page.locator('main')).toBeFocused();
});

test.describe('touch navigation', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 780 } });
  test('a wide touch screen keeps a visible Menu button without hover', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 780 });
    await start(page);
    await expect(trigger(page)).toHaveCSS('clip-path', 'none');
    const control = (await trigger(page).boundingBox())!;
    expect(control.width).toBeGreaterThanOrEqual(44);
    expect(control.height).toBeGreaterThanOrEqual(44);
    await trigger(page).tap();
    await expect(header(page)).toBeVisible();
    await settledHeader(page);
    await trigger(page).tap();
    await closed(page);
  });
  for (const bank of banks) test(`${bank.id} reveals navigation on tap and dismisses it outside the header`, async ({ page }) => {
    await start(page, bank);
    const before = await geometry(page);
    await trigger(page).tap();
    await expect(header(page)).toBeVisible();
    await expectPushed(page, before);
    const close = header(page).getByRole('button', { name: 'Close site navigation', exact: true });
    await expect(close).toBeInViewport();
    const closeBox = (await close.boundingBox())!;
    expect(closeBox.width).toBeGreaterThanOrEqual(44);
    expect(closeBox.height).toBeGreaterThanOrEqual(44);
    await close.tap();
    await closed(page);
    await expectRestored(page, before);
    await expect(trigger(page)).toBeFocused();
    await trigger(page).tap();
    await expect(header(page)).toBeVisible();
    await page.touchscreen.tap(385, 770);
    await closed(page);
    await trigger(page).tap();
    await expect(header(page)).toBeVisible();
    await header(page).getByRole('link', { name: 'Settings', exact: true }).tap();
    await expect(page.getByRole('heading', { name: 'Settings', exact: true, level: 1 })).toBeVisible();
    await expect(header(page)).toBeVisible();
    await expect(page.locator('.app-shell')).not.toHaveClass(/is-test-focused/);
  });
});

for (const bank of banks) test(`${bank.id} restores the normal header on setup and completion while an unfinished test elsewhere leaves it visible`, async ({ page }) => {
  await start(page, bank);
  await page.getByRole('button', { name: 'Back to Tests', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tests', exact: true, level: 1 })).toBeVisible();
  await expect(header(page)).toBeVisible();
  await expect(page.locator('.app-shell')).not.toHaveClass(/is-test-focused/);
  await header(page).getByRole('link', { name: 'Study', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your decks', exact: true, level: 1 })).toBeVisible();
  await expect(header(page)).toBeVisible();
  await header(page).getByRole('link', { name: 'Tests', exact: true }).click();
  // Revisiting Tests may auto-resume the unfinished attempt; returning through setup must keep navigation visible.
  if (await page.getByRole('button', { name: 'Resume test', exact: true }).isVisible()) await page.getByRole('button', { name: 'Resume test', exact: true }).click();
  await closed(page);
  page.once('dialog', dialog => void dialog.accept());
  await page.getByRole('button', { name: 'Finish test', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Test score', exact: true })).toBeVisible();
  await expect(header(page)).toBeVisible();
  await expect(page.locator('.app-shell')).not.toHaveClass(/is-test-focused/);
});

test('a failed simulator save remains visible and retryable while the site header is hidden', async ({ page }) => {
  await start(page, banks[1], 'exam');
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    let fail = true;
    IDBObjectStore.prototype.put = function (value, key) {
      if (fail && this.name === 'testAttempts') { fail = false; throw new DOMException('Simulated write failure', 'QuotaExceededError'); }
      return put.call(this, value, key);
    };
  });
  await page.getByRole('button', { name: 'Flag for review', exact: true }).first().click();
  await expect(page.getByRole('alert').filter({ hasText: 'A change has not been saved yet.' })).toBeVisible();
  await expect(page.getByText('Storage needs attention', { exact: true })).toBeVisible();
  await closed(page);
  await expect(toolbar(page).getByLabel('Time remaining', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Retry saving', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'A change has not been saved yet.' })).toHaveCount(0);
  await closed(page);
});


test('navigation expands and collapses through intermediate heights while sticky controls stay clear', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1280, height: 720 });
  await start(page);
  await page.evaluate(() => scrollTo(0, 400));
  await expect.poll(() => toolbar(page).evaluate(element => Math.round(element.getBoundingClientRect().top))).toBe(0);
  const sampleToggle = () => page.evaluate(async () => {
    const banner = document.querySelector<HTMLElement>('.site-header')!;
    const button = document.querySelector<HTMLButtonElement>('.site-nav-trigger')!;
    const samples: { height: number; toolbarGap: number; navigatorGap: number }[] = [];
    button.click();
    const start = performance.now();
    while (performance.now() - start < 400) {
      await new Promise<void>(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
      const headerBox = banner.getBoundingClientRect();
      const bar = document.querySelector('.test-toolbar')!.getBoundingClientRect();
      const nav = document.querySelector('.test-navigator')!.getBoundingClientRect();
      samples.push({ height: headerBox.height, toolbarGap: bar.top - headerBox.bottom, navigatorGap: nav.top - bar.bottom });
    }
    return samples;
  });
  const expanding = await sampleToggle();
  await expect(header(page)).toHaveClass(/is-revealed/);
  await settledHeader(page);
  const fullHeight = (await header(page).boundingBox())!.height;
  expect(fullHeight).toBeGreaterThan(44);
  const collapsing = await sampleToggle();
  await closed(page);
  for (const samples of [expanding, collapsing]) {
    expect(samples.some(sample => sample.height > 1 && sample.height < fullHeight - 1)).toBe(true);
    expect(Math.min(...samples.map(sample => sample.toolbarGap))).toBeGreaterThanOrEqual(-1);
    expect(Math.min(...samples.map(sample => sample.navigatorGap))).toBeGreaterThanOrEqual(-1);
  }
});

test('reduced motion changes navigation height without an animated transition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 720 });
  await start(page);
  const before = await geometry(page);
  await open(page);
  expect(await header(page).evaluate(element => element.getAnimations().length)).toBe(0);
  expect(await header(page).evaluate(element => getComputedStyle(element).transitionDuration.split(',').every(value => parseFloat(value) === 0))).toBe(true);
  await expectPushed(page, before);
  await page.keyboard.press('Escape');
  await closed(page);
  await expectRestored(page, before);
});


for (const bank of banks) test(`${bank.id} header background pins navigation through page interactions and toggles it closed`, async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await start(page, bank);
  const attemptUrl = page.url();
  await page.locator('.site-nav-edge').hover();
  await settledHeader(page);
  const pin = page.getByRole('button', { name: 'Keep site navigation open', exact: true });
  await expect(pin).toHaveAttribute('aria-pressed', 'false');
  await pin.click({ position: { x: 5, y: 5 } });
  const collapse = page.getByRole('button', { name: 'Collapse site navigation', exact: true });
  await expect(collapse).toHaveAttribute('aria-pressed', 'true');
  // Transfer focus out of the header so continued visibility proves pinning, not focus retention.
  await page.getByRole('button', { name: 'Flag for review', exact: true }).first().click();
  if (bank.id === 'ab250-original') {
    const choice = page.locator('.test-question').first().locator('input').first();
    await choice.check();
    await expect(choice).toBeChecked();
  }
  await page.mouse.move(1278, 898);
  await page.waitForTimeout(350);
  await expect(header(page)).toBeVisible();
  await expect(collapse).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(attemptUrl);
  await expectControlsClear(page, true);
  await collapse.click({ position: { x: 5, y: 5 } });
  await closed(page);
  await page.waitForTimeout(350);
  await closed(page);
});

test('keyboard pin toggle stays open outside the header and Escape clears the pinned state', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await start(page);
  await open(page);
  const pin = page.getByRole('button', { name: 'Keep site navigation open', exact: true });
  await pin.focus();
  await page.keyboard.press('Space');
  const collapse = page.getByRole('button', { name: 'Collapse site navigation', exact: true });
  await expect(collapse).toHaveAttribute('aria-pressed', 'true');
  const flag = page.getByRole('button', { name: 'Flag for review', exact: true }).first();
  await flag.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(350);
  await expect(header(page)).toBeVisible();
  await collapse.focus();
  await page.keyboard.press('Enter');
  await closed(page);
  await open(page);
  await pin.focus();
  await page.keyboard.press('Enter');
  await expect(collapse).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await closed(page);
  await expect(trigger(page)).toBeFocused();
  await open(page);
  await expect(pin).toHaveAttribute('aria-pressed', 'false');
});

test('header pinning resets after setup and navigation links retain their normal actions', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await start(page);
  await open(page);
  await page.getByRole('button', { name: 'Keep site navigation open', exact: true }).click({ position: { x: 5, y: 5 } });
  await page.getByRole('button', { name: 'Back to Tests', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tests', exact: true, level: 1 })).toBeVisible();
  await expect(page.locator('.site-nav-pin')).toHaveCount(0);
  await page.getByRole('button', { name: 'Resume test', exact: true }).click();
  await closed(page);
  await open(page);
  const pin = page.getByRole('button', { name: 'Keep site navigation open', exact: true });
  await expect(pin).toHaveAttribute('aria-pressed', 'false');
  await pin.click({ position: { x: 5, y: 5 } });
  await header(page).getByRole('link', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true, level: 1 })).toBeVisible();
  await expect(header(page)).toBeVisible();
  await expect(page.locator('.site-nav-pin')).toHaveCount(0);
  await header(page).getByRole('link', { name: 'Tests', exact: true }).click();
  if (await page.getByRole('button', { name: 'Resume test', exact: true }).isVisible()) await page.getByRole('button', { name: 'Resume test', exact: true }).click();
  await closed(page);
  await open(page);
  await expect(pin).toHaveAttribute('aria-pressed', 'false');
});

test.describe('pinned navigation on touch', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 780 } });
  test('mobile Close and Menu explicitly dismiss a pinned header', async ({ page }) => {
    await start(page);
    for (const closeWith of ['Close', 'Menu']) {
      await trigger(page).tap();
      await settledHeader(page);
      await page.getByRole('button', { name: 'Keep site navigation open', exact: true }).tap({ position: { x: 5, y: 5 } });
      await page.touchscreen.tap(385, 770);
      await page.waitForTimeout(350);
      await expect(page.getByRole('button', { name: 'Collapse site navigation', exact: true })).toHaveAttribute('aria-pressed', 'true');
      if (closeWith === 'Close') await header(page).getByRole('button', { name: 'Close site navigation', exact: true }).tap();
      else await trigger(page).tap();
      await closed(page);
    }
  });
});
