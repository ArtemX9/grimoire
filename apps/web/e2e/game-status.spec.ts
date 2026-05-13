import { Page, expect, test } from '@playwright/test';

import { Genre } from '@grimoire/shared';

import { generateUserGame } from '@/test';

// ---------------------------------------------------------------------------
// Credentials (matching the backend seed script)
// ---------------------------------------------------------------------------
const USER_EMAIL = 'test@grimoire.test';
const USER_PASSWORD = 'password123';

// Hollow Knight is seeded for test@grimoire.test with status BACKLOG
const SEEDED_GAME_TITLE = 'Hollow Knight';

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

// ---------------------------------------------------------------------------
// Game status transition tests
// ---------------------------------------------------------------------------

test.describe('Game status transitions', () => {
  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  // -------------------------------------------------------------------------
  // Status changes persist on the detail page and propagate back to the
  // library grid after the mutation's onSuccess handler writes the updated
  // UserGame into the TanStack Query list cache.
  // -------------------------------------------------------------------------
  test(
    'status changes persist on detail page and are reflected on the library card',
    async ({ page }) => {
      // -----------------------------------------------------------------------
      // 1. Log in and wait for the library to load.
      // -----------------------------------------------------------------------
      await login(page, USER_EMAIL, USER_PASSWORD);
      await page.waitForURL('**/library');

      // -----------------------------------------------------------------------
      // 2. Find the seeded Hollow Knight card and read its UUID from the href.
      // -----------------------------------------------------------------------
      const hkCard = page
        .locator('a[href^="/games/"]')
        .filter({ hasText: SEEDED_GAME_TITLE })
        .first();
      await expect(hkCard).toBeVisible({ timeout: 10_000 });

      const href = await hkCard.getAttribute('href');
      const gameID = href!.replace('/games/', '');

      // -----------------------------------------------------------------------
      // 3. Set up route mocks before navigating to the detail page.
      //
      //    `currentStatus` is captured in closure so every fulfillment returns
      //    the status that was most recently PATCHed.
      //
      //    Route order matters: Playwright evaluates handlers last-registered-
      //    first. We register a single handler for the game detail endpoint that
      //    branches on method; the games-list handler lets all other requests
      //    (stats, sessions, etc.) pass through.
      // -----------------------------------------------------------------------
      let currentStatus = 'BACKLOG';

      const baseGame = generateUserGame({
        id: gameID,
        igdbID: 1177,
        title: SEEDED_GAME_TITLE,
        coverURL: '//images.igdb.com/igdb/image/upload/t_cover_big/co1rgi.jpg',
        genres: [Genre.Platform, Genre.Adventure],
        playtimeHours: 0,
        isMappedManually: false,
        platforms: [],
      });

      // Intercept the games list so the library card reflects the updated status
      // after the mutation's onSuccess invalidates the cache. Registered FIRST
      // so the more-specific detail route (registered next) takes priority in
      // Playwright's LIFO handler evaluation order.
      // Guard on the exact list path — let /games/stats and /games/:id pass
      // through to the network.
      await page.route('**/api/v1/games**', (route) => {
        const url = new URL(route.request().url());
        const isListEndpoint =
          /\/api\/v1\/games$/.test(url.pathname) || /\/api\/v1\/games\?/.test(url.href);
        if (route.request().method() === 'GET' && isListEndpoint) {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ ...baseGame, status: currentStatus }]),
          });
        } else {
          route.continue();
        }
      });

      // Intercept the game detail endpoint (GET + PATCH). Registered AFTER the
      // broad games route so it takes priority (LIFO) and handles all requests
      // to /api/v1/games/:id without falling through to the broad handler.
      await page.route(`**/api/v1/games/${gameID}`, (route) => {
        const method = route.request().method();

        if (method === 'PATCH') {
          const body = route.request().postDataJSON() as { status?: string };
          if (body?.status) currentStatus = body.status;
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ...baseGame, status: currentStatus }),
          });
          return;
        }

        // GET — return the game with the current status.
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...baseGame, status: currentStatus }),
        });
      });

      // -----------------------------------------------------------------------
      // 4. Navigate to the Hollow Knight detail page.
      // -----------------------------------------------------------------------
      await hkCard.click();
      await page.waitForURL('**/games/**');
      await expect(page.getByRole('heading', { name: SEEDED_GAME_TITLE, level: 1 })).toBeVisible({
        timeout: 10_000,
      });

      // -----------------------------------------------------------------------
      // 5. Change status: Backlog → Playing.
      //    Status picker buttons are rendered from Object.values(GameStatus).
      // -----------------------------------------------------------------------
      const playingButton = page.getByRole('button', { name: 'Playing', exact: true });
      await expect(playingButton).toBeVisible({ timeout: 5_000 });
      await playingButton.click();

      // The hero area shows a status badge; onSuccess writes the returned game
      // back into the detail cache so the badge updates immediately.
      await expect(
        page.locator('span').filter({ hasText: /^Playing$/ }).first(),
      ).toBeVisible({ timeout: 10_000 });

      // -----------------------------------------------------------------------
      // 6. Change status: Playing → Completed.
      // -----------------------------------------------------------------------
      const completedButton = page.getByRole('button', { name: 'Completed', exact: true });
      await expect(completedButton).toBeVisible();
      await completedButton.click();

      await expect(
        page.locator('span').filter({ hasText: /^Completed$/ }).first(),
      ).toBeVisible({ timeout: 10_000 });

      // -----------------------------------------------------------------------
      // 7. Navigate back to the library.
      // -----------------------------------------------------------------------
      await page.getByRole('button', { name: 'Back', exact: true }).click();
      await page.waitForURL('**/library');

      // -----------------------------------------------------------------------
      // 8. The library card for Hollow Knight must now show "COMPLETED".
      //    useUpdateGame's onSuccess calls setQueriesData on the list cache, so
      //    the card reflects the new status without a round-trip. If the cache
      //    was already invalidated and re-fetched, the intercepted list handler
      //    above ensures the updated status is returned.
      // -----------------------------------------------------------------------
      const updatedCard = page
        .locator('a[href^="/games/"]')
        .filter({ hasText: SEEDED_GAME_TITLE })
        .first();
      await expect(updatedCard).toBeVisible({ timeout: 10_000 });

      // The status badge is rendered inside the card cover as a <span>.
      await expect(
        updatedCard.locator('span').filter({ hasText: 'COMPLETED' }),
      ).toBeVisible({ timeout: 10_000 });
    },
  );
});
