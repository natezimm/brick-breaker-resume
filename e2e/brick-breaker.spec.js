import { expect, test } from '@playwright/test';

const startGame = async (page) => {
  await page.getByRole('button', { name: 'Start Game' }).click();
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#startOverlay')).toHaveClass(/hidden/);
};

test.describe('brick breaker resume', () => {
  test('loads the start screen and supporting controls', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Resume Brick Breaker/);
    await expect(
      page.getByRole('heading', { name: 'Resume Brick Breaker' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Start Game' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Show high score' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Open settings' })
    ).toBeVisible();
  });

  test('opens game utility modals', async ({ page }) => {
    await page.goto('/');

    await startGame(page);

    await page.getByRole('button', { name: 'Open settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByText('Dark Mode')).toBeVisible();
    await page.getByRole('button', { name: 'Close settings' }).click();
    await expect(
      page.getByRole('heading', { name: 'Settings' })
    ).not.toBeVisible();

    await page.getByRole('button', { name: 'Show high score' }).click();
    await expect(
      page.getByRole('heading', { name: 'High Score' })
    ).toBeVisible();
    await expect(page.locator('#highScoreValue')).toContainText('0');
  });

  test('starts the Phaser canvas and exposes game controls', async ({
    page,
  }) => {
    await page.goto('/');

    await startGame(page);
    await expect(
      page.getByRole('button', { name: /Pause game|Resume game/ })
    ).toBeVisible();
  });
});
