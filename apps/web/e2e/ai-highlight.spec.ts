import { Page, expect, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Credentials (matching the backend seed script)
// ---------------------------------------------------------------------------
const USER_EMAIL = 'test@grimoire.test';
const USER_PASSWORD = 'password123';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

async function logout(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
}

/**
 * Build a single SSE data line from a payload object.
 * Each token is JSON-stringified inside a JSON wrapper — no shared imports needed.
 */
function sseToken(payload: object): string {
  return `data: ${JSON.stringify({ token: JSON.stringify(payload) })}\n\n`;
}

/**
 * Log in, wait for the library, and return the Hollow Knight card locator
 * plus the UUID assigned to it by the seed.
 */
async function getHollowKnightCard(page: Page) {
  await login(page, USER_EMAIL, USER_PASSWORD);
  await page.waitForURL('**/');

  const hkCard = page.locator('a[data-game-id]').filter({ hasText: 'Hollow Knight' }).first();
  await expect(hkCard).toBeVisible({ timeout: 10_000 });

  const hollowKnightID = await hkCard.getAttribute('data-game-id');
  if (!hollowKnightID) throw new Error('data-game-id attribute missing on Hollow Knight card');

  return { hkCard, hollowKnightID };
}

// ---------------------------------------------------------------------------
// AI highlight tests
// ---------------------------------------------------------------------------

test.describe('AI highlight', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  // -------------------------------------------------------------------------
  // 1. Text + tool call: SSE stream returns TEXT then TOOL_CALL
  //    — AI panel shows the text, target card gets animate-border-pulse
  // -------------------------------------------------------------------------
  test('text token renders in the AI panel and tool call highlights the card', async ({ page }) => {
    const { hkCard, hollowKnightID } = await getHollowKnightCard(page);

    await page.route('**/api/v1/ai/recommend/stream', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body:
          sseToken({ type: 'text', text: 'I recommend Hollow Knight!' }) +
          sseToken({
            type: 'toolCall',
            name: 'highlight_game',
            arguments: { gameID: hollowKnightID },
          }),
      });
    });

    await page.getByRole('button', { name: 'Relaxed' }).first().click();
    await page.getByRole('button', { name: 'Get recommendation' }).click();

    await expect(page.locator('text=I recommend Hollow Knight!')).toBeVisible({ timeout: 10_000 });
    await expect(hkCard).toHaveClass(/animate-border-pulse/, { timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // 2. Highlight when game is visible: toolCall fires with a gameID
  //    — the target card gets animate-border-pulse
  // -------------------------------------------------------------------------
  test('toolCall highlights the correct card when the game is visible', async ({ page }) => {
    const { hkCard, hollowKnightID } = await getHollowKnightCard(page);

    await page.route('**/api/v1/ai/recommend/stream', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: sseToken({
          type: 'toolCall',
          name: 'highlight_game',
          arguments: { gameID: hollowKnightID },
        }),
      });
    });

    await page.getByRole('button', { name: 'Relaxed' }).first().click();
    await page.getByRole('button', { name: 'Get recommendation' }).click();

    await expect(hkCard).toHaveClass(/animate-border-pulse/, { timeout: 10_000 });
  });

  // -------------------------------------------------------------------------
  // 3. Filter reset + highlight: a status filter hides the target game
  //    — toolCall fires — filters reset, game reappears, card gets
  //    animate-border-pulse
  // -------------------------------------------------------------------------
  test('toolCall resets active filters so the highlighted game becomes visible', async ({ page }) => {
    const { hkCard, hollowKnightID } = await getHollowKnightCard(page);

    // Hollow Knight is seeded with status BACKLOG.
    // Clicking "Playing" hides it (only PLAYING games are shown).
    await page.getByRole('button', { name: 'Playing', exact: true }).click();

    // Confirm Hollow Knight is now hidden.
    await expect(hkCard).not.toBeVisible({ timeout: 5_000 });

    await page.route('**/api/v1/ai/recommend/stream', async (route) => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: sseToken({
          type: 'toolCall',
          name: 'highlight_game',
          arguments: { gameID: hollowKnightID },
        }),
      });
    });

    await page.getByRole('button', { name: 'Relaxed' }).first().click();
    await page.getByRole('button', { name: 'Get recommendation' }).click();

    // After the toolCall the filters should have been cleared so the card
    // reappears, and the highlight class is applied.
    await expect(hkCard).toBeVisible({ timeout: 10_000 });
    await expect(hkCard).toHaveClass(/animate-border-pulse/, { timeout: 10_000 });
  });
});
