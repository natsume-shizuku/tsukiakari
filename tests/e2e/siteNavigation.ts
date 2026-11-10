import type { Page } from '@playwright/test';

/** Follow the same navigation path available to a learner in an active test. */
export async function followSiteLink(page: Page, name: string) {
  const trigger = page.getByRole('button', { name: 'Site navigation', exact: true });
  if (await trigger.count() && await trigger.getAttribute('aria-expanded') === 'false') {
    await trigger.focus();
    await page.keyboard.press('Enter');
  }
  await page.getByRole('link', { name, exact: true }).click();
}
