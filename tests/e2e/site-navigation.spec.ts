import { test, expect, type Page } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });
const routes = [
  { label: 'Study', hash: 'study', heading: 'Your decks' },
  { label: 'Library', hash: 'library', heading: 'Library' },
  { label: 'Tests', hash: 'tests', heading: 'Tests' },
  { label: 'Statistics', hash: 'statistics', heading: 'Statistics' },
  { label: 'Settings', hash: 'settings', heading: 'Settings' },
];
const header = (page: Page) => page.locator('.site-header');
const mainNav = (page: Page) => header(page).getByRole('navigation', { name: 'Main navigation', exact: true });

for (const theme of ['dark', 'light']) test(`the horizontal site header reaches every page and fits all screen sizes in ${theme}`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/#settings');
  await expect(page.getByText('Saved in this browser', { exact: true }).first()).toBeVisible();
  await page.getByLabel('Appearance', { exact: true }).selectOption(theme);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
  await expect(header(page)).toHaveRole('banner');
  await expect(mainNav(page).getByRole('link')).toHaveCount(4);
  await expect(page.locator('.sidebar')).toHaveCount(0);
  await expect(header(page).getByRole('link', { name: '月明かり · Tsukiakari home', exact: true })).toHaveAttribute('href', '#study');

  for (const width of [320, 390, 768, 1024, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      await header(page).getByRole('link', { name: route.label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp('#' + route.hash + '$'));
      await expect(page.getByRole('heading', { name: route.heading, exact: true, level: 1 })).toBeVisible();
      await expect(header(page).locator('a[aria-current="page"]')).toHaveCount(1);
      await expect(header(page).getByRole('link', { name: route.label, exact: true })).toHaveAttribute('aria-current', 'page');
      await expect(header(page).locator('.save-status')).toHaveText('Saved in this browser');
      await expect(header(page).getByRole('link', { name: 'Settings', exact: true })).toBeVisible();
      await expect(header(page).locator('.save-status')).toBeVisible();
      const layout = await page.evaluate(() => {
        const banner = document.querySelector('.site-header')!, inner = document.querySelector('.site-header-inner')!;
        const nav = banner.querySelector('nav[aria-label="Main navigation"]')!;
        const brand = banner.querySelector('.brand')!, settings = banner.querySelector('.settings-link')!, status = banner.querySelector('.save-status')!;
        const main = document.querySelector('main')!, mainStyle = getComputedStyle(main);
        const bannerBox = banner.getBoundingClientRect(), innerBox = inner.getBoundingClientRect(), mainBox = main.getBoundingClientRect();
        const navBox = nav.getBoundingClientRect(), brandBox = brand.getBoundingClientRect(), settingsBox = settings.getBoundingClientRect();
        const links = Array.from(nav.querySelectorAll('a')).map(link => { const box = link.getBoundingClientRect(); return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height }; });
        const targetSizes = Array.from(banner.querySelectorAll('a')).map(link => { const box = link.getBoundingClientRect(); return { width: box.width, height: box.height }; });
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          viewport: document.documentElement.clientWidth,
          mainLeft: mainBox.left, mainRight: mainBox.right, mainWidth: mainBox.width,
          mainContentWidth: mainBox.width - parseFloat(mainStyle.paddingLeft) - parseFloat(mainStyle.paddingRight),
          innerLeft: innerBox.left, innerRight: innerBox.right, innerWidth: innerBox.width,
          bannerBottom: bannerBox.bottom, mainTop: mainBox.top, position: getComputedStyle(banner).position,
          navTop: navBox.top, navBottom: navBox.bottom, brandTop: brandBox.top, brandBottom: brandBox.bottom,
          settingsTop: settingsBox.top, settingsBottom: settingsBox.bottom,
          statusBesideSettings: settings.parentElement!.contains(status), links, targetSizes,
        };
      });
      expect(layout.overflow).toBeLessThanOrEqual(0);
      expect(layout.position).toBe('sticky');
      expect(layout.bannerBottom).toBeLessThanOrEqual(layout.mainTop + 1);
      expect(layout.mainContentWidth).toBeLessThanOrEqual(1241);
      expect(layout.mainWidth).toBeLessThanOrEqual(1289);
      expect(Math.abs(layout.mainLeft - (layout.viewport - layout.mainRight))).toBeLessThanOrEqual(1);
      expect(layout.innerWidth).toBeLessThanOrEqual(1289);
      expect(Math.abs(layout.innerLeft - (layout.viewport - layout.innerRight))).toBeLessThanOrEqual(1);
      expect(layout.statusBesideSettings).toBe(true);
      for (const size of layout.targetSizes) {
        expect(size.width).toBeGreaterThanOrEqual(44);
        expect(size.height).toBeGreaterThanOrEqual(44);
      }
      for (let index = 1; index < layout.links.length; index++) {
        expect(Math.abs(layout.links[index].top - layout.links[0].top)).toBeLessThanOrEqual(1);
        expect(layout.links[index - 1].right).toBeLessThanOrEqual(layout.links[index].left + 1);
      }
      if (width <= 900) {
        expect(layout.navTop).toBeGreaterThanOrEqual(Math.max(layout.brandBottom, layout.settingsBottom) - 1);
      } else {
        expect(layout.navBottom).toBeGreaterThan(layout.brandTop);
        expect(layout.navTop).toBeLessThan(layout.brandBottom);
        expect(layout.settingsBottom).toBeGreaterThan(layout.navTop);
        expect(layout.settingsTop).toBeLessThan(layout.navBottom);
      }
    }
    // Settings is deliberately tall at this viewport; the other routes need not scroll.
    await page.setViewportSize({ width, height: 600 });
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    const pinned = await header(page).boundingBox();
    expect(pinned!.y).toBeCloseTo(0, 0);
    await expect(header(page)).toBeInViewport({ ratio: 1 });
    for (const route of routes) {
      const link = header(page).getByRole('link', { name: route.label, exact: true });
      await expect(link).toBeInViewport({ ratio: 1 });
      const size = (await link.boundingBox())!;
      expect(size.width).toBeGreaterThanOrEqual(44);
      expect(size.height).toBeGreaterThanOrEqual(44);
    }
    await expect(header(page).locator('.save-status')).toBeInViewport({ ratio: 1 });
    await page.evaluate(() => scrollTo(0, 0));
    await page.setViewportSize({ width, height: 1000 });
    if (width === 1920 || width === 390) {
      await header(page).getByRole('link', { name: 'Study', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Your decks', exact: true })).toBeVisible();
      await page.screenshot({ path: `test-results/site-navigation-${theme}-${width}.png`, fullPage: true });
    }
  }
});

test('site navigation and the skip link work from the keyboard', async ({ page }) => {
  await page.goto('/#study');
  await expect(header(page).locator('.save-status')).toHaveText('Saved in this browser');
  const skip = page.getByRole('link', { name: 'Skip to content', exact: true });
  await skip.focus();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await expect(page).toHaveURL(/#study$/);

  await mainNav(page).getByRole('link', { name: 'Study', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(mainNav(page).getByRole('link', { name: 'Library', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Library', exact: true, level: 1 })).toBeVisible();
  await expect(page.locator('main')).toBeFocused();
  await header(page).getByRole('link', { name: 'Settings', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Settings', exact: true, level: 1 })).toBeVisible();
  await expect(page.locator('main')).toBeFocused();
  await header(page).getByRole('link', { name: '月明かり · Tsukiakari home', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Your decks', exact: true, level: 1 })).toBeVisible();
});
