import { test, expect, type Page } from '@playwright/test';

const deckName = 'Keyboard recovery';
const prompt = 'Fixture: What is 2 + 3?';
async function createDeck(page: Page) {
  await page.goto('/');
  await expect(page.getByText('Saved in this browser', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Create a deck', exact: true }).click();
  const create = page.getByRole('dialog', { name: 'Create a deck', exact: true });
  await create.getByLabel('Deck name', { exact: true }).fill(deckName);
  await create.getByRole('button', { name: 'Create deck', exact: true }).click();
  await expect(create).not.toBeVisible();
  await page.getByRole('link', { name: 'Library', exact: true }).click();
  await page.getByLabel('Destination deck', { exact: true }).selectOption({ label: deckName });
  const pack = page.locator('.library-pack').filter({ has: page.getByRole('heading', { name: 'Foundation fixtures', exact: true }) });
  await pack.getByRole('button', { name: 'Add entire pack', exact: true }).click();
  await expect(pack.getByRole('button', { name: 'All pack cards added', exact: true })).toBeDisabled();
}

for (const width of [320, 1440]) {
  test(`clearing the final personal note restores visible keyboard focus at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await createDeck(page);
    await page.getByRole('link', { name: 'Card browser', exact: true }).click();
    await page.getByRole('button', { name: 'Select card: ' + prompt, exact: true }).click();
    const inspector = page.getByRole('region', { name: 'Card details', exact: true });
    await inspector.getByRole('tab', { name: 'My notes', exact: true }).click();
    await inspector.getByLabel('Personal note', { exact: true }).fill('A personal note to remove.');
    await inspector.getByRole('button', { name: 'Save notes and tags', exact: true }).click();
    await expect(inspector.getByRole('button', { name: 'Save notes and tags', exact: true })).toBeDisabled();
    const close = inspector.getByRole('button', { name: /Close details|Back to cards/ });
    await close.click();
    await page.getByRole('link', { name: 'Notes', exact: true }).click();
    await page.getByRole('button', { name: /^Note filters/ }).click();
    await page.getByLabel('Note type', { exact: true }).selectOption('personal');
    await expect(page.getByRole('button', { name: 'Read note: ' + prompt, exact: true })).toHaveAccessibleDescription(/Keyboard recovery/);
    await page.getByRole('button', { name: 'Read note: ' + prompt, exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Notes', exact: true, level: 2 })).toHaveCount(1);
    const reader = page.getByRole('region', { name: 'Note reader', exact: true });
    await reader.getByRole('button', { name: 'Edit personal note', exact: true }).click();
    await reader.getByLabel('Personal note', { exact: true }).fill('');
    await reader.getByRole('button', { name: 'Save notes and tags', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'No notes match these filters.', exact: true })).toBeVisible();
    await expect(page.getByLabel('Search notes', { exact: true })).toBeFocused();
    await expect(page.getByRole('status').filter({ hasText: 'Personal notes and tags saved.' }).first()).toBeVisible();
  });
}

test('removing all deck cards leaves focus in Manage and Escape returns to its opener', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await createDeck(page);
  await page.getByRole('link', { name: 'Study', exact: true }).click();
  const opener = page.getByRole('link', { name: 'Manage ' + deckName, exact: true });
  await opener.click();
  const manage = page.getByRole('dialog', { name: 'Manage ' + deckName, exact: true });
  const settingsTab = manage.getByRole('tab', { name: 'Settings', exact: true });
  await settingsTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(manage.getByRole('tab', { name: 'Cards', exact: true })).toBeFocused();
  await manage.getByRole('button', { name: 'Select all matching cards', exact: true }).click();
  page.once('dialog', dialog => dialog.accept());
  await manage.getByRole('button', { name: 'Remove selected cards', exact: true }).click();
  await expect(manage.getByText('This deck has no cards yet. Add cards from Library.', { exact: true })).toBeVisible();
  await expect(manage.getByLabel('Search deck cards', { exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(manage).not.toBeVisible();
  await expect(opener).toBeFocused();
});
