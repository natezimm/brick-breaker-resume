import { expect, test } from '@playwright/test';

const startGame = async (page, look = 'Glass') => {
  await page.getByRole('button', { name: `Play on ${look}` }).click();
  await expect(page.locator('#startOverlay')).toHaveClass(/hidden/);
  // The engine is loaded on demand once the chosen look has swept across, so
  // the canvas can take a few seconds when several browsers start at once.
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
};

test.describe('brick breaker resume', () => {
  test('loads the start screen with both looks side by side', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Resume Brick Breaker/);
    await expect(
      page.getByRole('heading', { name: 'Resume Brick Breaker' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Play on Paper' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Play on Glass' })
    ).toBeVisible();

    // The same résumé, laid out once per look.
    const paper = page.locator('#brickContainerLight');
    const glass = page.locator('#brickContainerDark');
    await expect(paper).toHaveAttribute('data-layout', 'typeset');
    await expect(glass).toHaveAttribute('data-layout', 'wall');
    await expect(paper.locator('.brick--name').first()).toHaveText('Nathan');
    await expect(glass.locator('.overlay-brick').first()).toHaveText('Nathan');

    await expect(
      page.getByRole('button', { name: 'Show high score' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Open settings' })
    ).toBeVisible();
  });

  test('each side of the start screen starts the game in its look', async ({
    page,
  }) => {
    await page.goto('/');
    await startGame(page, 'Paper');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('#gameBrickContainer')).toHaveAttribute(
      'data-layout',
      'typeset'
    );

    await page.goto('/');
    await startGame(page, 'Glass');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#gameBrickContainer')).toHaveAttribute(
      'data-layout',
      'wall'
    );
  });

  test('shows lives, score, and best score in the HUD', async ({ page }) => {
    await page.goto('/');
    await startGame(page);

    await expect(page.locator('#hudLives .hud-pip')).toHaveCount(5);
    await expect(page.locator('#hudLives')).toHaveAttribute(
      'aria-label',
      '5 lives left'
    );
    await expect(page.locator('#hudScoreValue')).toHaveText('0');
  });

  test('switches between light and dark from the settings menu', async ({
    page,
  }) => {
    await page.goto('/');
    await startGame(page);

    await page.getByRole('button', { name: 'Open settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Dark/ })).toBeChecked();

    // The radio sits under its card; click the card as a player would.
    await page.locator('.theme-option', { hasText: 'Light' }).click();
    await expect(page.getByRole('radio', { name: /Light/ })).toBeChecked();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('#gameBrickContainer')).toHaveAttribute(
      'data-layout',
      'typeset'
    );

    await page.locator('.theme-option', { hasText: 'Dark' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#gameBrickContainer')).toHaveAttribute(
      'data-layout',
      'wall'
    );
  });

  test('opens game utility modals', async ({ page }) => {
    await page.goto('/');

    await startGame(page);

    await page.getByRole('button', { name: 'Open settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByText('Sound Effects')).toBeVisible();
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

  test('runs collisions and pauses and resumes from the keyboard', async ({
    page,
  }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await startGame(page);

    await expect
      .poll(
        async () => Number(await page.locator('#hudScoreValue').textContent()),
        {
          timeout: 20_000,
        }
      )
      .toBeGreaterThan(0);
    await page.keyboard.press('p');
    await expect(
      page.getByRole('button', { name: 'Resume game' })
    ).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('p');
    await expect(
      page.getByRole('button', { name: 'Pause game' })
    ).toHaveAttribute('aria-pressed', 'false');
    expect(errors).toEqual([]);
  });

  test('settings closes with Escape and the game counts back in', async ({
    page,
  }) => {
    await page.goto('/');
    await startGame(page);

    const settingsButton = page.getByRole('button', { name: 'Open settings' });
    await settingsButton.click();
    const dialog = page.getByRole('dialog', { name: 'Settings' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('#closeModal')).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(settingsButton).toBeFocused();
    await expect(page.locator('.gm-countdown')).toBeVisible();
  });

  test('the HUD draws its icons without any outside stylesheet', async ({
    page,
  }) => {
    const external = [];
    page.on('request', (request) => {
      if (!request.url().startsWith('http://127.0.0.1')) {
        external.push(request.url());
      }
    });
    await page.goto('/');
    await startGame(page);

    const icon = page.locator('#settingsButton svg');
    await expect(icon).toBeVisible();
    expect((await icon.boundingBox()).width).toBeGreaterThan(10);
    expect(external).toEqual([]);
  });

  test('rotating the screen keeps every brick on it', async ({ page }) => {
    const rightmostBrick = () =>
      page.evaluate(() =>
        Math.max(
          ...[
            ...document.querySelectorAll('#gameBrickContainer .overlay-brick'),
          ].map((brick) => brick.getBoundingClientRect().right)
        )
      );

    await page.goto('/');
    await startGame(page);
    await expect(
      page.locator('#gameBrickContainer .overlay-brick').first()
    ).toBeVisible();

    const { width, height } = page.viewportSize();
    // Turn the screen, then turn it back.
    for (const size of [
      { width: height, height: width },
      { width, height },
    ]) {
      await page.setViewportSize(size);
      await expect
        .poll(rightmostBrick, { timeout: 5_000 })
        .toBeLessThanOrEqual(size.width);
      await expect
        .poll(rightmostBrick, { timeout: 5_000 })
        .toBeGreaterThan(size.width * 0.8);
    }
  });

  test('a lost game offers Play again, which starts a fresh game', async ({
    page,
  }) => {
    test.slow();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await startGame(page);
    await page.locator('.gm-countdown').waitFor({ state: 'detached' });

    // Park the paddle in a corner so every ball is missed.
    await page.mouse.move(1, 400);
    const playAgain = page.getByRole('button', { name: 'Play again' });
    await expect(playAgain).toBeVisible({ timeout: 150_000 });
    await expect(playAgain).toBeFocused();
    await expect(
      page.getByRole('link', { name: 'Download résumé' }).last()
    ).toHaveAttribute('href', /Resume\.docx$/);

    await playAgain.click();
    await expect(playAgain).not.toBeVisible();
    await expect(page.locator('#hudLives .hud-pip:not(.is-lost)')).toHaveCount(
      5
    );
    await expect(page.locator('#hudScoreValue')).toHaveText('0');
  });
});
